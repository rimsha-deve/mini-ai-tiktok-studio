"""
WebSocket Routes
Real-time progress updates during video generation.
"""

import os
import json
import uuid
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.youtube_service import YouTubeService
from app.services.audio_service import AudioService
from app.services.background_service import BackgroundService
from app.services.avatar_service import AvatarService
from app.services.text_service import TextService
from app.services.effects_service import EffectsService
from app.services.sticker_service import StickerService
from app.services.video_renderer import VideoRenderer
from app.services.preset_service import PresetService

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMP_DIR = os.path.join(BASE_DIR, "temp")
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")


class ConnectionManager:
    """Manages WebSocket connections."""

    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)

    async def send_progress(self, client_id: str, data: dict):
        ws = self.active_connections.get(client_id)
        if ws:
            await ws.send_json(data)


manager = ConnectionManager()


@router.websocket("/generate")
async def websocket_generate(websocket: WebSocket):
    """
    WebSocket endpoint for video generation with real-time progress.
    
    Client sends generation config as JSON, receives progress updates.
    """
    client_id = str(uuid.uuid4())[:8]
    await manager.connect(websocket, client_id)

    try:
        # Receive generation config
        data = await websocket.receive_json()

        # Create progress callback
        async def progress_callback(stage: str, progress: float, message: str):
            await manager.send_progress(client_id, {
                "stage": stage,
                "progress": progress,
                "message": message,
                "status": "processing",
            })

        # Initialize services
        youtube_service = YouTubeService()
        audio_service = AudioService()
        background_service = BackgroundService()
        avatar_service = AvatarService()
        text_service = TextService()
        effects_service = EffectsService()
        sticker_service = StickerService()
        video_renderer = VideoRenderer()
        preset_service = PresetService()

        session_id = str(uuid.uuid4())[:8]
        session_dir = os.path.join(EXPORTS_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)

        # Apply preset
        preset_id = data.get("preset")
        if preset_id:
            preset = preset_service.get_preset(preset_id)
            if preset:
                # Merge preset into data (data overrides preset)
                for key in ["background", "text", "effects", "audio", "sticker"]:
                    if key in preset and key not in data:
                        data[key] = preset[key]

        await progress_callback("init", 5, "Initializing pipeline...")

        # === STEP 1: Audio ===
        audio_path = None
        duration = 60.0
        audio_settings = data.get("audio", {})
        speed = audio_settings.get("speed", 1.18)

        youtube_url = data.get("youtube_url")
        if youtube_url:
            await progress_callback("youtube", 10, "Extracting YouTube audio...")
            yt_result = await youtube_service.extract_audio(
                youtube_url, speed, progress_callback
            )
            audio_path = yt_result["audio_path"]
            duration = yt_result.get("duration", 60.0)
            # Speed already applied by youtube_service — process at 1.0 to avoid double-speed
            audio_speed_for_processing = 1.0
        else:
            # Check for uploaded audio
            for ext in [".mp3", ".wav", ".m4a", ".ogg"]:
                check = os.path.join(TEMP_DIR, f"custom_audio{ext}")
                if os.path.exists(check):
                    audio_path = check
                    break
            # Apply speed to uploaded audio
            audio_speed_for_processing = speed

        if not audio_path:
            await manager.send_progress(client_id, {
                "stage": "error",
                "progress": 0,
                "message": "No audio source provided",
                "status": "error",
            })
            return

        # Process audio
        processed_audio = os.path.join(session_dir, "audio.mp3")
        await audio_service.process_audio(
            audio_path, processed_audio,
            speed=audio_speed_for_processing,
            background_music_path=audio_settings.get("background_music_path"),
            background_music_volume=audio_settings.get("background_music_volume", -20.8),
            progress_callback=progress_callback,
        )
        info = await audio_service.get_audio_info(processed_audio)
        duration = info["duration"]

        # === STEP 2: Avatar (process FIRST to get colors for background) ===
        await progress_callback("avatar", 30, "Processing avatar...")
        avatar_path = None
        avatar_colors = None
        avatar_settings = data.get("avatar", {})

        # Find uploaded avatar
        uploaded_avatar = data.get("avatar_path")
        if not uploaded_avatar:
            # Find the most recently modified avatar upload file
            candidates = []
            for ext in [".png", ".jpg", ".jpeg", ".webp"]:
                check = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
                if os.path.exists(check):
                    candidates.append((os.path.getmtime(check), check))
            if candidates:
                # Pick the newest file
                candidates.sort(reverse=True)
                uploaded_avatar = candidates[0][1]

        if uploaded_avatar and os.path.exists(uploaded_avatar):
            avatar_path = avatar_service.process_avatar(
                uploaded_avatar,
                remove_bg=avatar_settings.get("remove_background", True),
                enhance_colors=avatar_settings.get("enhance_colors", True),
                sharpen=avatar_settings.get("sharpen", True),
                upscale=avatar_settings.get("upscale", False),
            )
            avatar_colors = avatar_service.get_dominant_colors(uploaded_avatar)

        # === STEP 3: Background (uses avatar colors for auto mode) ===
        await progress_callback("background", 40, "Generating background...")
        bg_settings = data.get("background", {})
        resolution = data.get("export", {}).get("resolution", "1080p")

        if resolution == "4k":
            video_renderer.set_resolution("4k")
            effects_service.set_resolution("4k")
            sticker_service.set_resolution("4k")

        background_path = background_service.generate_background(
            mode=bg_settings.get("mode", "auto"),
            color1=bg_settings.get("color1"),
            color2=bg_settings.get("color2"),
            gradient_direction=bg_settings.get("gradient_direction", "diagonal"),
            uploaded_path=bg_settings.get("uploaded_path"),
            resolution=resolution,
            avatar_colors=avatar_colors,
        )

        # === STEP 4: Text ===
        await progress_callback("text", 50, "Rendering text overlay...")
        text_settings = data.get("text", {})
        text_overlay_path = text_service.render_text_overlay(
            text=text_settings.get("text", "SI TE SABES EL TIKTOK BAILAI"),
            font_name=text_settings.get("font", "Anton"),
            font_size=text_settings.get("font_size", 72),
            color=text_settings.get("color"),
            position=text_settings.get("position", "right"),
            glow=text_settings.get("glow", True),
            glow_color=text_settings.get("glow_color"),
            shadow=text_settings.get("shadow", True),
            stroke=text_settings.get("stroke", True),
            stroke_width=text_settings.get("stroke_width", 3),
            opacity=text_settings.get("opacity", 1.0),
            avatar_colors=avatar_colors,
        )

        # === STEP 5: Effects ===
        await progress_callback("effects", 55, "Generating effects...")
        effect_settings = data.get("effects", {})

        snowfall_frames = None
        if effect_settings.get("snowfall", True):
            snowfall_frames = effects_service.generate_snowfall_frames(
                speed=effect_settings.get("snowfall_speed", 40),
                density=120,
            )

        particle_overlay = None
        if effect_settings.get("glow_particles", True):
            particle_overlay = effects_service.generate_particles_overlay("glow")
        elif effect_settings.get("fuzzy_stars", True):
            particle_overlay = effects_service.generate_particles_overlay("stars")

        soft_glow_path = None
        if effect_settings.get("soft_blur_glow", True):
            soft_glow_path = effects_service.generate_soft_blur_glow(background_path)

        vhs_path = None
        if effect_settings.get("vhs_effect", False):
            vhs_path = effects_service.generate_vhs_effect()

        grain_path = None
        if effect_settings.get("grain", False):
            grain_path = effects_service.generate_grain_effect()

        chromatic_path = None
        if effect_settings.get("chromatic_glow", False):
            chromatic_path = effects_service.generate_chromatic_glow()

        # === STEP 6: Sticker ===
        await progress_callback("sticker", 60, "Adding sticker...")
        sticker_settings = data.get("sticker", {})
        sticker_frames = None

        if sticker_settings.get("enabled", True):
            sticker_path = sticker_service.generate_tiktok_logo()
            sticker_frames = sticker_service.generate_floating_frames(
                sticker_path,
                position=sticker_settings.get("position", "top-right"),
                scale=sticker_settings.get("scale", 0.15),
            )

        # === STEP 7: Render ===
        await progress_callback("render", 65, "Rendering video...")
        export_settings = data.get("export", {})
        output_video = os.path.join(session_dir, "tiktok_mashup.mp4")

        await video_renderer.render_video(
            audio_path=processed_audio,
            background_path=background_path,
            avatar_path=avatar_path,
            text_overlay_path=text_overlay_path,
            snowfall_frames=snowfall_frames,
            particle_overlay_path=particle_overlay,
            sticker_frames=sticker_frames,
            soft_glow_path=soft_glow_path,
            vhs_path=vhs_path,
            grain_path=grain_path,
            chromatic_path=chromatic_path,
            duration=duration,
            fps=export_settings.get("fps", 30),
            quality=export_settings.get("quality", "high"),
            output_path=output_video,
            progress_callback=progress_callback,
        )

        # === STEP 8: Thumbnail ===
        thumbnail_path = None
        if export_settings.get("generate_thumbnail", True):
            await progress_callback("thumbnail", 95, "Generating thumbnail...")
            thumbnail_path = await video_renderer.generate_thumbnail(output_video)

        # === DONE ===
        await manager.send_progress(client_id, {
            "stage": "complete",
            "progress": 100,
            "message": "Video generated successfully!",
            "status": "complete",
            "data": {
                "video_path": output_video,
                "thumbnail_path": thumbnail_path,
                "audio_path": processed_audio,
                "export_folder": session_dir,
                "duration": duration,
            },
        })

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        await manager.send_progress(client_id, {
            "stage": "error",
            "progress": 0,
            "message": f"Error: {str(e)}",
            "status": "error",
        })
    finally:
        manager.disconnect(client_id)
