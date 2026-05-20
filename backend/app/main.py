"""
FastAPI Backend — TikTok Mashup Studio
Connects UI inputs to video_engine.py render pipeline.
"""

import os, sys, uuid, shutil
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
    ext  = os.path.splitext(file.filename)[1] or ".png"
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


# ── Preset endpoints ────────────────────────────────────────────────────────

@app.get("/api/presets")
async def get_presets():
    from app.services.preset_service import PresetService
    return {"success": True, "presets": PresetService().get_all_presets()}


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

        if yt_url:
            await progress("youtube", 8, "Extracting YouTube audio...")
            yt = await YouTubeService().extract_audio(
                yt_url, data.get("audio",{}).get("speed",1.18))
            audio_path = yt["audio_path"]
            duration   = yt.get("duration", 60.0)
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
            speed=1.0,
            background_music_path=audio_cfg.get("background_music_path"),
            background_music_volume=audio_cfg.get("background_music_volume",-20.8),
            progress_callback=progress,
        )
        info     = await AudioService().get_audio_info(processed_audio)
        duration = info["duration"]

        # ── 2. Find avatar ────────────────────────────────────────────────
        avatar_path = data.get("avatar_path")
        if not avatar_path:
            for ext in [".png",".jpg",".jpeg",".webp"]:
                p = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
                if os.path.exists(p):
                    avatar_path = p
                    break

        # ── 3. Run video engine ───────────────────────────────────────────
        from video_engine import render_video

        output_video = os.path.join(session_dir, "tiktok_mashup.mp4")
        await render_video(
            audio_path  = processed_audio,
            avatar_path = avatar_path,
            output_path = output_video,
            text        = data.get("text",{}).get("text","SI TE SABES EL TIKTOK BAILAI"),
            quality     = data.get("export",{}).get("quality","high"),
            progress_cb = progress,
        )

        thumb = output_video.replace(".mp4","_thumbnail.jpg")
        await websocket.send_json({
            "stage":"complete","progress":100,
            "message":"Video generated successfully!","status":"complete",
            "data":{
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
