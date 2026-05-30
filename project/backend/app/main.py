"""
FastAPI Backend — TikTok Mashup Studio
Connects UI inputs to video_engine.py render pipeline.
"""

import os, sys, uuid, shutil
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add backend dir to path so queue_manager can import video_engine
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.queue_manager import queue_manager
except ImportError:
    # Fallback: try direct import when running from backend/ dir
    from queue_manager import queue_manager

# Add backend root to path so video_engine is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="TikTok Mashup Studio", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR    = os.path.join(BASE_DIR, "temp")
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")

for d in [TEMP_DIR, EXPORTS_DIR]:
    os.makedirs(d, exist_ok=True)

app.mount("/exports", StaticFiles(directory=EXPORTS_DIR), name="exports")
app.mount("/assets",  StaticFiles(directory=os.path.join(BASE_DIR,"assets")), name="assets")


@app.on_event("startup")
async def _startup():
    queue_manager.start()


@app.get("/")
async def root():
    return {"app": "TikTok Mashup Studio", "version": "2.0.0", "status": "running"}


@app.get("/api/health")
async def health():
    import shutil as sh
    return {
        "status": "healthy",
        "ffmpeg": sh.which("ffmpeg") is not None,
        "python": sys.version,
    }


# ── Upload endpoints ────────────────────────────────────────────────────────

@app.post("/api/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    # Delete ALL previous avatar uploads and processed cache first
    for old_ext in [".png", ".jpg", ".jpeg", ".webp"]:
        for prefix in ["avatar_upload", "avatar_processed"]:
            old_path = os.path.join(TEMP_DIR, f"{prefix}{old_ext}")
            if os.path.exists(old_path):
                os.remove(old_path)

    ext  = os.path.splitext(file.filename)[1].lower() or ".png"
    path = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"success": True, "path": path}


@app.post("/api/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    ext  = os.path.splitext(file.filename)[1] or ".mp3"
    path = os.path.join(TEMP_DIR, f"custom_audio{ext}")
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"success": True, "path": path}


@app.post("/api/upload/background")
async def upload_background(file: UploadFile = File(...)):
    ext  = os.path.splitext(file.filename)[1] or ".png"
    path = os.path.join(TEMP_DIR, f"bg_upload{ext}")
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"success": True, "path": path}


@app.post("/api/upload/logo")
async def upload_logo(file: UploadFile = File(...)):
    """Upload custom logo — replaces TikTok logo."""
    ext  = os.path.splitext(file.filename)[1] or ".png"
    # Save directly as tiktok_sticker.png to replace the default
    stickers_dir = os.path.join(BASE_DIR, "assets", "stickers")
    os.makedirs(stickers_dir, exist_ok=True)
    path = os.path.join(stickers_dir, "tiktok_sticker.png")
    # Convert to PNG with transparency
    from PIL import Image as PILImage
    import io
    content = await file.read()
    img = PILImage.open(io.BytesIO(content)).convert("RGBA")
    img.save(path, "PNG")
    return {"success": True, "path": path, "message": "Logo replaced successfully"}


# ── Preset endpoints ────────────────────────────────────────────────────────

@app.get("/api/presets")
async def get_presets():
    from app.services.preset_service import PresetService
    return {"success": True, "presets": PresetService().get_all_presets()}


@app.get("/api/presets/{preset_id}")
async def get_preset(preset_id: str):
    from app.services.preset_service import PresetService
    from fastapi import HTTPException
    preset = PresetService().get_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail=f"Preset not found: {preset_id}")
    return {"success": True, "preset": preset}


@app.post("/api/cleanup")
async def cleanup_temp_files():
    import shutil
    try:
        if os.path.exists(TEMP_DIR):
            shutil.rmtree(TEMP_DIR)
            os.makedirs(TEMP_DIR, exist_ok=True)
        return {"success": True, "message": "Temporary files cleaned"}
    except Exception as e:
        return {"success": False, "message": str(e)}



@app.get("/api/fonts")
async def get_fonts():
    return {"success": True, "fonts": ["Anton", "Impact"]}


# ── YouTube extraction ──────────────────────────────────────────────────────

@app.post("/api/youtube/extract")
async def extract_youtube(data: dict):
    from app.services.youtube_service import YouTubeService
    try:
        result = await YouTubeService().extract_audio(
            data.get("url",""), data.get("speed", 1.18))
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ── WebSocket generation ────────────────────────────────────────────────────



@app.post("/api/generate")
async def generate_rest(data: dict):
    """
    REST fallback for video generation (used when WebSocket is unavailable).
    Runs the same pipeline as the WebSocket handler synchronously.
    """
    import asyncio

    result_holder = {}

    async def run():
        from app.services.youtube_service import YouTubeService
        from app.services.audio_service import AudioService
        from video_engine import render_video

        audio_path = None
        duration = 60.0
        yt_url = data.get("youtube_url", "").strip()
        speed_applied = False

        if yt_url:
            yt = await YouTubeService().extract_audio(
                yt_url, data.get("audio", {}).get("speed", 1.18))
            audio_path = yt["audio_path"]
            duration = yt.get("duration", 60.0)
            speed_applied = True
        else:
            for ext in [".mp3", ".wav", ".m4a", ".ogg"]:
                p = os.path.join(TEMP_DIR, f"custom_audio{ext}")
                if os.path.exists(p):
                    audio_path = p
                    break

        if not audio_path:
            raise RuntimeError("No audio source provided.")

        session_id = str(uuid.uuid4())[:8]
        session_dir = os.path.join(EXPORTS_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        processed_audio = os.path.join(session_dir, "audio.mp3")

        audio_cfg = data.get("audio", {})
        await AudioService().process_audio(
            audio_path, processed_audio,
            speed=1.0 if speed_applied else audio_cfg.get("speed", 1.18),
            background_music_path=audio_cfg.get("background_music_path"),
            background_music_volume=audio_cfg.get("background_music_volume", -20.8),
        )
        info = await AudioService().get_audio_info(processed_audio)
        duration = info["duration"]

        avatar_path = data.get("avatar_path")
        if not avatar_path:
            candidates = []
            for ext in [".png", ".jpg", ".jpeg", ".webp"]:
                p = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
                if os.path.exists(p):
                    candidates.append((os.path.getmtime(p), p))
            if candidates:
                candidates.sort(reverse=True)
                avatar_path = candidates[0][1]

        raw_gc = data.get("gradient_colors")
        gradient_colors = None
        if raw_gc and len(raw_gc) == 3:
            gradient_colors = [tuple(c) for c in raw_gc]

        output_video = os.path.join(session_dir, "tiktok_mashup.mp4")
        await render_video(
            audio_path=processed_audio,
            avatar_path=avatar_path,
            output_path=output_video,
            text=data.get("text", {}).get("text", "SI TE SABES EL TIKTOK BAILAI"),
            text_color=data.get("text", {}).get("color", "#FFFFFF"),
            font_name=data.get("text", {}).get("font", "Anton"),
            font_size=int(data.get("text", {}).get("font_size", 0)),
            text_x=int(data.get("layout", {}).get("text_x", 0)),
            text_y=int(data.get("layout", {}).get("text_y", 0)) + int(data.get("layout", {}).get("text_y_offset", 0)),
            logo_x=int(data.get("layout", {}).get("logo_x", 0)),
            logo_y=int(data.get("layout", {}).get("logo_y", 0)),
            logo_size=int(data.get("layout", {}).get("logo_size", 0)),
            avatar_x=int(data.get("layout", {}).get("avatar_x", -1)),
            avatar_y_offset=int(data.get("layout", {}).get("avatar_y", 0)),
            avatar_scale=float(data.get("layout", {}).get("avatar_scale", 1.0)),
            text_align=data.get("text", {}).get("align", "left"),
            quality=data.get("export", {}).get("quality", "high"),
            gradient_colors=gradient_colors,
        )

        thumb = output_video.replace(".mp4", "_thumbnail.jpg")
        result_holder.update({
            "success": True,
            "video_path": output_video,
            "thumbnail_path": thumb if os.path.exists(thumb) else None,
            "audio_path": processed_audio,
            "export_folder": session_dir,
            "duration": duration,
            "message": "Video generated successfully!",
        })

    try:
        await run()
        return result_holder
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "message": str(e)}


@app.get("/api/video/{session_id}")
async def get_video(session_id: str):
    """Serve the generated video file directly by session ID."""
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    video_path = os.path.join(EXPORTS_DIR, session_id, "tiktok_mashup.mp4")
    if not os.path.exists(video_path):
        # Try timeline output
        tl_path = os.path.join(EXPORTS_DIR, session_id, "tiktok_mashup_timeline.mp4")
        if os.path.exists(tl_path):
            video_path = tl_path
        else:
            raise HTTPException(status_code=404, detail=f"Video not found for session: {session_id}")
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename="tiktok_mashup.mp4",
        headers={"Accept-Ranges": "bytes"},
    )

@app.get("/api/thumbnail/{session_id}")
async def get_thumbnail(session_id: str):
    """Serve the thumbnail image by session ID."""
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    thumb_path = os.path.join(EXPORTS_DIR, session_id, "tiktok_mashup_thumbnail.jpg")
    if not os.path.exists(thumb_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(thumb_path, media_type="image/jpeg")


# ── Queue Endpoints ─────────────────────────────────────────────────────────

@app.get("/api/queue")
async def get_queue():
    """Return all queue jobs and their current status."""
    return {
        "success": True,
        "jobs": queue_manager.get_all(),
        "active_count": queue_manager.active_count(),
        "can_add": queue_manager.can_add(),
    }


@app.post("/api/queue/add")
async def add_to_queue(data: dict):
    """
    Snapshot current uploads and add a job to the render queue.
    Body: { config: {...}, display_name: "..." }
    Returns: { job_id, queue_position, can_add }
    """
    if not queue_manager.can_add():
        from fastapi import HTTPException
        raise HTTPException(
            status_code=429,
            detail=f"Queue is full (max {queue_manager.MAX_ACTIVE} active jobs). Wait for one to finish."
        )

    config       = data.get("config", data)
    display_name = data.get("display_name", "Video")

    # Snapshot current uploaded files to a job-specific folder
    job_dir = queue_manager.snapshot_uploads()
    job     = queue_manager.add_job(config, job_dir, display_name)

    active = [j for j in queue_manager.jobs if j.status in ("waiting", "rendering")]
    return {
        "success":        True,
        "job_id":         job.id,
        "queue_position": len(active),
        "can_add":        queue_manager.can_add(),
    }


@app.delete("/api/queue/{job_id}")
async def remove_from_queue(job_id: str):
    """Cancel a waiting job. Running jobs cannot be cancelled."""
    removed = queue_manager.remove_job(job_id)
    return {"success": removed, "message": "Cancelled" if removed else "Job not found or already running"}


@app.websocket("/ws/queue")
async def ws_queue(websocket: WebSocket):
    """
    Real-time queue updates. Sends queue state on connect,
    then pushes updates whenever any job changes.
    """
    await websocket.accept()
    queue_manager.subscribe(websocket)
    # Send current state immediately on connect
    await websocket.send_json({"type": "queue_state", "jobs": queue_manager.get_all()})
    try:
        while True:
            # Keep connection alive — client sends pings, we ignore them
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        queue_manager.unsubscribe(websocket)


@app.websocket("/ws/generate")
async def ws_generate(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()

        async def progress(stage, pct, msg):
            await websocket.send_json({
                "stage": stage, "progress": pct,
                "message": msg, "status": "processing"
            })

        await progress("init", 3, "Starting pipeline...")

        # ── 1. Audio ──────────────────────────────────────────────────────
        from app.services.youtube_service import YouTubeService
        from app.services.audio_service   import AudioService

        audio_path = None
        duration   = 60.0
        yt_url     = data.get("youtube_url","").strip()
        speed_applied = False

        if yt_url:
            await progress("youtube", 8, "Extracting YouTube audio...")
            yt = await YouTubeService().extract_audio(
                yt_url, data.get("audio",{}).get("speed",1.18))
            audio_path = yt["audio_path"]
            duration   = yt.get("duration", 60.0)
            speed_applied = True  # YouTube service already applied speed
        else:
            for ext in [".mp3",".wav",".m4a",".ogg"]:
                p = os.path.join(TEMP_DIR, f"custom_audio{ext}")
                if os.path.exists(p):
                    audio_path = p
                    break

        if not audio_path:
            await websocket.send_json({
                "stage":"error","progress":0,
                "message":"No audio source provided.","status":"error"})
            return

        # Process audio (speed + optional BG music)
        session_id  = str(uuid.uuid4())[:8]
        session_dir = os.path.join(EXPORTS_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        processed_audio = os.path.join(session_dir, "audio.mp3")

        audio_cfg = data.get("audio", {})
        await AudioService().process_audio(
            audio_path, processed_audio,
            speed=1.0 if speed_applied else audio_cfg.get("speed", 1.18),
            background_music_path=audio_cfg.get("background_music_path"),
            background_music_volume=audio_cfg.get("background_music_volume",-20.8),
            progress_callback=progress,
        )
        info     = await AudioService().get_audio_info(processed_audio)
        duration = info["duration"]

        # ── Beat analysis + dynamic processing ───────────────────────────
        beat_enabled = data.get("audio", {}).get("beat_analysis", True)
        if beat_enabled:
            await progress("beat", 30, "Analyzing beats and normalizing audio...")
            from app.services.beat_service import BeatService
            beat_svc = BeatService()
            beat_output = os.path.join(session_dir, "audio_beat.mp3")
            try:
                analysis = await beat_svc.process_with_beat_analysis(
                    processed_audio, beat_output,
                    progress_callback=progress,
                )
                if os.path.exists(beat_output) and os.path.getsize(beat_output) > 10000:
                    processed_audio = beat_output
                    summary = beat_svc.get_analysis_summary(analysis)
                    await progress("beat", 45, f"Beat analysis done: {summary}")
                else:
                    await progress("beat", 45, "Beat processing skipped (fallback to original)")
            except Exception as e:
                await progress("beat", 45, f"Beat analysis skipped: {str(e)[:80]}")

        # ── 2. Find avatar (pick most recently uploaded) ─────────────────
        avatar_path = data.get("avatar_path")
        if not avatar_path:
            candidates = []
            for ext in [".png", ".jpg", ".jpeg", ".webp"]:
                p = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
                if os.path.exists(p):
                    candidates.append((os.path.getmtime(p), p))
            if candidates:
                candidates.sort(reverse=True)
                avatar_path = candidates[0][1]

        await progress("avatar", 35, f"Avatar: {os.path.basename(avatar_path) if avatar_path else 'none'}")

        # ── 3. Run video engine ───────────────────────────────────────────
        from video_engine import render_video

        # Pass custom gradient colors if user edited swatches
        raw_gc = data.get("gradient_colors")
        gradient_colors = None
        if raw_gc and len(raw_gc) == 3:
            gradient_colors = [tuple(c) for c in raw_gc]

        output_video = os.path.join(session_dir, "tiktok_mashup.mp4")
        await render_video(
            audio_path       = processed_audio,
            avatar_path      = avatar_path,
            output_path      = output_video,
            text             = data.get("text",{}).get("text","SI TE SABES EL TIKTOK BAILAI"),
            text_color       = data.get("text",{}).get("color","#FFFFFF"),
            font_name        = data.get("text",{}).get("font","Anton"),
            font_size        = int(data.get("text",{}).get("font_size", 0)),
            text_x           = int(data.get("layout",{}).get("text_x", 0)),
            text_y           = int(data.get("layout",{}).get("text_y", 0)) + int(data.get("layout",{}).get("text_y_offset", 0)),
            logo_x           = int(data.get("layout",{}).get("logo_x", 0)),
            logo_y           = int(data.get("layout",{}).get("logo_y", 0)),
            logo_size        = int(data.get("layout",{}).get("logo_size", 0)),
            avatar_x         = int(data.get("layout",{}).get("avatar_x", -1)),
            avatar_y_offset  = int(data.get("layout",{}).get("avatar_y", 0)),
            avatar_scale     = float(data.get("layout",{}).get("avatar_scale", 1.0)),
            text_align       = data.get("text",{}).get("align","left"),
            quality          = data.get("export",{}).get("quality","high"),
            progress_cb      = progress,
            gradient_colors  = gradient_colors,
        )

        thumb = output_video.replace(".mp4","_thumbnail.jpg")
        await websocket.send_json({
            "stage":"complete","progress":100,
            "message":"Video generated successfully!","status":"complete",
            "data":{
                "session_id":   session_id,
                "video_path":   output_video,
                "thumbnail_path": thumb if os.path.exists(thumb) else None,
                "audio_path":   processed_audio,
                "export_folder":session_dir,
                "duration":     duration,
            }
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[WS ERROR]\n{tb}")
        try:
            await websocket.send_json({
                "stage":"error","progress":0,
                "message":f"Error: {str(e)}","status":"error"})
        except Exception:
            pass


# ── Color preview endpoint ──────────────────────────────────────────────────

@app.get("/api/colors/preview")
async def preview_colors():
    """
    Return the 3 gradient colors extracted from the current avatar upload.
    Called by frontend after avatar upload to show color swatches.
    """
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from video_engine import get_gradient_colors

    # Find the most recently uploaded avatar
    candidates = []
    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
        p = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
        if os.path.exists(p):
            candidates.append((os.path.getmtime(p), p))

    if not candidates:
        return {
            "success": False,
            "colors": [
                {"r": 220, "g": 50,  "b": 150, "hex": "#dc3296"},
                {"r": 100, "g": 0,   "b": 180, "hex": "#6400b4"},
                {"r": 50,  "g": 0,   "b": 100, "hex": "#320064"},
            ]
        }

    candidates.sort(reverse=True)
    avatar_path = candidates[0][1]

    try:
        c1, c2, c3 = get_gradient_colors(avatar_path)
        def to_dict(c):
            return {"r": c[0], "g": c[1], "b": c[2],
                    "hex": f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}"}
        return {
            "success": True,
            "colors": [to_dict(c1), to_dict(c2), to_dict(c3)]
        }
    except Exception as e:
        return {"success": False, "message": str(e)}