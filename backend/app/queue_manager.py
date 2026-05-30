"""
Sequential Video Queue Manager
- Processes jobs one at a time (never two renders simultaneously)
- Each job has its own snapshot of uploaded files
- Broadcasts live progress to all WebSocket subscribers
"""

import asyncio
import os
import shutil
import time
import uuid
from typing import Dict, List, Optional, Set

# Support running from backend/ or backend/app/
_HERE    = os.path.dirname(os.path.abspath(__file__))
# If we're inside app/, BASE_DIR = backend/
# If we're inside backend/, BASE_DIR = backend/
BASE_DIR = _HERE if os.path.basename(_HERE) == 'backend' else os.path.dirname(_HERE)

TEMP_DIR    = os.path.join(BASE_DIR, "temp")
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
JOBS_DIR    = os.path.join(TEMP_DIR, "queue_jobs")


class Status:
    WAITING   = "waiting"
    RENDERING = "rendering"
    DONE      = "done"
    ERROR     = "error"
    CANCELLED = "cancelled"


class QueueJob:
    def __init__(self, config: dict, job_dir: str, display_name: str = "Video"):
        self.id           = str(uuid.uuid4())[:8]
        self.status       = Status.WAITING
        self.config       = config
        self.job_dir      = job_dir          # snapshot of uploaded files for this job
        self.display_name = display_name
        self.progress     = 0
        self.stage        = "waiting"
        self.message      = "Waiting in queue…"
        self.result: Optional[dict] = None
        self.error: Optional[str]   = None
        self.created_at   = time.time()

    def to_dict(self) -> dict:
        return {
            "id":           self.id,
            "status":       self.status,
            "display_name": self.display_name,
            "progress":     self.progress,
            "stage":        self.stage,
            "message":      self.message,
            "result":       self.result,
            "error":        self.error,
            "created_at":   self.created_at,
        }


class QueueManager:
    MAX_ACTIVE = 5     # max waiting + rendering at a time
    MAX_STORED = 30    # max total jobs kept in memory

    def __init__(self):
        self.jobs:        List[QueueJob] = []
        self._subs:       Set            = set()
        self._task:       Optional[asyncio.Task] = None
        os.makedirs(JOBS_DIR, exist_ok=True)

    # ─── Lifecycle ────────────────────────────────────────────────────────────

    def start(self):
        """Call once at app startup."""
        try:
            loop = asyncio.get_running_loop()
            self._task = loop.create_task(self._worker(), name="queue_worker")
        except RuntimeError:
            pass   # no running loop yet — will be started on first add

    # ─── Public API ───────────────────────────────────────────────────────────

    def active_count(self) -> int:
        return sum(1 for j in self.jobs if j.status in (Status.WAITING, Status.RENDERING))

    def can_add(self) -> bool:
        return self.active_count() < self.MAX_ACTIVE

    def snapshot_uploads(self) -> str:
        """
        Copy current TEMP_DIR uploads into a job-specific folder and return its path.
        This freezes the files so the user can upload different files for the next job.
        """
        job_id  = str(uuid.uuid4())[:8]
        job_dir = os.path.join(JOBS_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)

        # Copy avatar
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            src = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(job_dir, f"avatar{ext}"))
                break

        # Copy audio
        for ext in [".mp3", ".wav", ".m4a", ".ogg"]:
            src = os.path.join(TEMP_DIR, f"custom_audio{ext}")
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(job_dir, f"audio{ext}"))
                break

        # Copy background
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            src = os.path.join(TEMP_DIR, f"bg_upload{ext}")
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(job_dir, f"bg{ext}"))
                break

        return job_dir

    def add_job(self, config: dict, job_dir: str, display_name: str = "Video") -> QueueJob:
        job = QueueJob(config, job_dir, display_name)
        self.jobs.append(job)
        # Prune old done/error/cancelled jobs to stay under MAX_STORED
        done = [j for j in self.jobs if j.status in (Status.DONE, Status.ERROR, Status.CANCELLED)]
        while len(self.jobs) > self.MAX_STORED and done:
            self.jobs.remove(done.pop(0))
        # Ensure worker is running
        self._ensure_worker()
        return job

    def remove_job(self, job_id: str) -> bool:
        """Cancel a waiting job. Cannot cancel a running job."""
        for j in self.jobs:
            if j.id == job_id and j.status == Status.WAITING:
                j.status  = Status.CANCELLED
                j.message = "Cancelled by user"
                # Clean up snapshot folder
                if j.job_dir and os.path.exists(j.job_dir):
                    shutil.rmtree(j.job_dir, ignore_errors=True)
                return True
        return False

    def get_job(self, job_id: str) -> Optional[QueueJob]:
        return next((j for j in self.jobs if j.id == job_id), None)

    def get_all(self) -> List[dict]:
        return [j.to_dict() for j in self.jobs]

    # ─── WebSocket subscribers ────────────────────────────────────────────────

    def subscribe(self, ws):
        self._subs.add(ws)

    def unsubscribe(self, ws):
        self._subs.discard(ws)

    async def _broadcast(self, data: dict):
        dead = set()
        for ws in list(self._subs):
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        self._subs -= dead

    # ─── Worker ───────────────────────────────────────────────────────────────

    def _ensure_worker(self):
        if self._task is None or self._task.done():
            try:
                loop = asyncio.get_running_loop()
                self._task = loop.create_task(self._worker(), name="queue_worker")
            except RuntimeError:
                pass

    async def _worker(self):
        """Main loop: pick next waiting job and render it, one at a time."""
        while True:
            next_job = next((j for j in self.jobs if j.status == Status.WAITING), None)
            if next_job is None:
                await asyncio.sleep(0.8)
                continue
            await self._process(next_job)

    async def _process(self, job: QueueJob):
        job.status   = Status.RENDERING
        job.progress = 0
        job.stage    = "init"
        job.message  = "Starting render…"
        await self._broadcast({"type": "queue_update", "jobs": self.get_all()})

        async def prog(stage, pct, msg):
            job.stage    = stage
            job.progress = int(pct)
            job.message  = msg
            await self._broadcast({"type": "queue_update", "jobs": self.get_all()})

        try:
            result = await self._render(job, prog)
            job.status   = Status.DONE
            job.progress = 100
            job.stage    = "complete"
            job.message  = "Video ready!"
            job.result   = result
            await self._broadcast({
                "type":   "job_complete",
                "job_id": job.id,
                "result": result,
                "jobs":   self.get_all(),
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            job.status  = Status.ERROR
            job.error   = str(e)
            job.message = f"Error: {str(e)[:120]}"
            await self._broadcast({
                "type":   "job_error",
                "job_id": job.id,
                "jobs":   self.get_all(),
            })

    async def _render(self, job: QueueJob, prog) -> dict:
        import sys
        # Ensure backend/ is on path for video_engine and app.services
        if BASE_DIR not in sys.path:
            sys.path.insert(0, BASE_DIR)

        from app.services.youtube_service import YouTubeService
        from app.services.audio_service   import AudioService
        from video_engine                  import render_video

        data    = job.config
        job_dir = job.job_dir

        session_dir = os.path.join(EXPORTS_DIR, job.id)
        os.makedirs(session_dir, exist_ok=True)

        # ── Audio ──────────────────────────────────────────────────
        audio_path    = None
        duration      = 60.0
        yt_url        = data.get("youtube_url", "").strip()
        speed_applied = False

        if yt_url:
            await prog("youtube", 8, "Extracting YouTube audio…")
            yt            = await YouTubeService().extract_audio(yt_url, data.get("audio", {}).get("speed", 1.18))
            audio_path    = yt["audio_path"]
            duration      = yt.get("duration", 60.0)
            speed_applied = True
        else:
            for ext in [".mp3", ".wav", ".m4a", ".ogg"]:
                p = os.path.join(job_dir, f"audio{ext}")
                if os.path.exists(p):
                    audio_path = p; break

        if not audio_path:
            raise RuntimeError("No audio found. Upload an MP3 or provide a YouTube URL.")

        processed_audio = os.path.join(session_dir, "audio.mp3")
        audio_cfg       = data.get("audio", {})
        await AudioService().process_audio(
            audio_path, processed_audio,
            speed                  = 1.0 if speed_applied else audio_cfg.get("speed", 1.18),
            background_music_path  = audio_cfg.get("background_music_path"),
            background_music_volume= audio_cfg.get("background_music_volume", -20.8),
            progress_callback      = prog,
        )
        try:
            info     = await AudioService().get_audio_info(processed_audio)
            duration = info["duration"]
        except Exception:
            pass

        # ── Avatar ─────────────────────────────────────────────────
        avatar_path = None
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            p = os.path.join(job_dir, f"avatar{ext}")
            if os.path.exists(p):
                avatar_path = p; break

        # ── Gradient ───────────────────────────────────────────────
        raw_gc          = data.get("gradient_colors")
        gradient_colors = [tuple(c) for c in raw_gc] if raw_gc and len(raw_gc) == 3 else None

        output_video = os.path.join(session_dir, "tiktok_mashup.mp4")

        await render_video(
            audio_path    = processed_audio,
            avatar_path   = avatar_path,
            output_path   = output_video,
            text          = data.get("text", {}).get("text",      "SI TE SABES EL TIKTOK BAILAI"),
            text_color    = data.get("text", {}).get("color",     "#FFFFFF"),
            font_name     = data.get("text", {}).get("font",      "Anton"),
            font_size     = int(data.get("text", {}).get("font_size", 0)),
            text_x        = int(data.get("layout", {}).get("text_x", 0)),
            text_y        = int(data.get("layout", {}).get("text_y", 0))
                          + int(data.get("layout", {}).get("text_y_offset", 0)),
            logo_x        = int(data.get("layout", {}).get("logo_x", 0)),
            logo_y        = int(data.get("layout", {}).get("logo_y", 0)),
            logo_size     = int(data.get("layout", {}).get("logo_size", 0)),
            avatar_x      = int(data.get("layout", {}).get("avatar_x", -1)),
            avatar_y_offset = int(data.get("layout", {}).get("avatar_y", 0)),
            avatar_scale  = float(data.get("layout", {}).get("avatar_scale", 1.0)),
            text_align    = data.get("text", {}).get("align",  "left"),
            quality       = data.get("export", {}).get("quality", "high"),
            gradient_colors = gradient_colors,
            progress_cb   = prog,
        )

        thumb = output_video.replace(".mp4", "_thumbnail.jpg")
        return {
            "session_id":      job.id,
            "video_path":      output_video,
            "thumbnail_path":  thumb if os.path.exists(thumb) else None,
            "audio_path":      processed_audio,
            "export_folder":   session_dir,
            "duration":        duration,
        }


# ── Singleton ──────────────────────────────────────────────────────────────────
queue_manager = QueueManager()