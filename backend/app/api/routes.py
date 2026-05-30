"""
API Routes
Main REST API endpoints for the TikTok Mashup Video Generator.
"""

import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import (
    YouTubeExtractRequest,
    GenerateRequest,
    GenerateResponse,
    PresetConfig,
)
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

# Service instances
youtube_service = YouTubeService()
audio_service = AudioService()
background_service = BackgroundService()
avatar_service = AvatarService()
text_service = TextService()
effects_service = EffectsService()
sticker_service = StickerService()
video_renderer = VideoRenderer()
preset_service = PresetService()


# ==================== YouTube Routes ====================

@router.post("/youtube/extract")
async def extract_youtube_audio(request: YouTubeExtractRequest):
    """Extract audio from YouTube URL."""
    try:
        result = await youtube_service.extract_audio(request.url, request.speed)
        return {
            "success": True,
            "data": result,
            "message": "Audio extracted successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Upload Routes ====================

@router.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """Upload avatar image."""
    try:
        # Save uploaded file
        file_ext = os.path.splitext(file.filename)[1] or ".png"
        save_path = os.path.join(TEMP_DIR, f"avatar_upload{file_ext}")
        
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return {
            "success": True,
            "path": save_path,
            "filename": file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/background")
async def upload_background(file: UploadFile = File(...)):
    """Upload custom background image."""
    try:
        file_ext = os.path.splitext(file.filename)[1] or ".png"
        save_path = os.path.join(TEMP_DIR, f"bg_upload{file_ext}")
        
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return {
            "success": True,
            "path": save_path,
            "filename": file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/audio")
async def upload_custom_audio(file: UploadFile = File(...)):
    """Upload custom audio file."""
    try:
        file_ext = os.path.splitext(file.filename)[1] or ".mp3"
        save_path = os.path.join(TEMP_DIR, f"custom_audio{file_ext}")
        
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return {
            "success": True,
            "path": save_path,
            "filename": file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Preset Routes ====================

@router.get("/presets")
async def get_presets():
    """Get all available presets."""
    presets = preset_service.get_all_presets()
    return {"success": True, "presets": presets}


@router.get("/presets/{preset_id}")
async def get_preset(preset_id: str):
    """Get a specific preset."""
    preset = preset_service.get_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return {"success": True, "preset": preset}


@router.post("/presets/{preset_id}")
async def save_preset(preset_id: str, config: dict):
    """Save or update a preset."""
    preset_service.save_preset(preset_id, config)
    return {"success": True, "message": "Preset saved"}


@router.delete("/presets/{preset_id}")
async def delete_preset(preset_id: str):
    """Delete a preset."""
    preset_service.delete_preset(preset_id)
    return {"success": True, "message": "Preset deleted"}


# ==================== Generation Route ====================

@router.post("/generate", response_model=GenerateResponse)
async def generate_video(request: GenerateRequest):
    """
    Generate complete TikTok mashup video.
    This is the main endpoint that orchestrates the entire pipeline.
    """
    try:
        session_id = str(uuid.uuid4())[:8]
        session_dir = os.path.join(EXPORTS_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)

        # Apply preset if specified
        if request.preset:
            preset = preset_service.get_preset(request.preset)
            if preset:
                # Merge preset settings (preset values as defaults)
                pass  # Settings from request override preset

        # Step 1: Get audio
        audio_path = None
        duration = 60.0

        if request.youtube_url:
            yt_result = await youtube_service.extract_audio(
                request.youtube_url, request.audio.speed
            )
            audio_path = yt_result["audio_path"]
            duration = yt_result.get("duration", 60.0)
        else:
            # Check for uploaded audio
            uploaded_audio = os.path.join(TEMP_DIR, "custom_audio.mp3")
            if os.path.exists(uploaded_audio):
                audio_path = uploaded_audio
                info = await audio_service.get_audio_info(uploaded_audio)
                duration = info["duration"]

        if not audio_path:
            raise HTTPException(status_code=400, detail="No audio source provided")

        # Step 2: Process audio (speed + background music)
        processed_audio = os.path.join(session_dir, "audio.mp3")
        await audio_service.process_audio(
            audio_path,
            processed_audio,
            speed=1.0,  # Already applied during extraction
            background_music_path=request.audio.background_music_path,
            background_music_volume=request.audio.background_music_volume,
        )

        # Update duration after processing
        info = await audio_service.get_audio_info(processed_audio)
        duration = info["duration"]

        # Step 3: Process avatar FIRST (to get colors for background)
        resolution = request.export.resolution
        if resolution == "4k":
            video_renderer.set_resolution("4k")
            effects_service.set_resolution("4k")
            sticker_service.set_resolution("4k")

        avatar_path = None
        avatar_colors = None
        uploaded_avatar = os.path.join(TEMP_DIR, "avatar_upload.png")
        
        # Check multiple extensions
        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            check_path = os.path.join(TEMP_DIR, f"avatar_upload{ext}")
            if os.path.exists(check_path):
                uploaded_avatar = check_path
                break

        if request.avatar_path and os.path.exists(request.avatar_path):
            uploaded_avatar = request.avatar_path

        if os.path.exists(uploaded_avatar):
            avatar_path = avatar_service.process_avatar(
                uploaded_avatar,
                remove_bg=request.avatar.remove_background,
                enhance_colors=request.avatar.enhance_colors,
                sharpen=request.avatar.sharpen,
                upscale=request.avatar.upscale,
            )
            avatar_colors = avatar_service.get_dominant_colors(uploaded_avatar)

        # Step 4: Generate background (uses avatar colors for auto mode)
        background_path = background_service.generate_background(
            mode=request.background.mode,
            color1=request.background.color1,
            color2=request.background.color2,
            gradient_direction=request.background.gradient_direction,
            uploaded_path=request.background.uploaded_path,
            resolution=resolution,
            avatar_colors=avatar_colors,
        )

        # Step 5: Generate text overlay
        text_overlay_path = text_service.render_text_overlay(
            text=request.text.text,
            font_name=request.text.font,
            font_size=request.text.font_size,
            color=request.text.color,
            position=request.text.position,
            glow=request.text.glow,
            glow_color=request.text.glow_color,
            shadow=request.text.shadow,
            stroke=request.text.stroke,
            stroke_width=request.text.stroke_width,
            opacity=request.text.opacity,
            avatar_colors=avatar_colors,
        )

        # Step 6: Generate effects
        snowfall_frames = None
        if request.effects.snowfall:
            snowfall_frames = effects_service.generate_snowfall_frames(
                speed=request.effects.snowfall_speed
            )

        particle_overlay = None
        if request.effects.glow_particles:
            particle_overlay = effects_service.generate_particles_overlay("glow")
        elif request.effects.fuzzy_stars:
            particle_overlay = effects_service.generate_particles_overlay("stars")

        soft_glow_path = None
        if request.effects.soft_blur_glow:
            soft_glow_path = effects_service.generate_soft_blur_glow(background_path)

        vhs_path = None
        if request.effects.vhs_effect:
            vhs_path = effects_service.generate_vhs_effect()

        grain_path = None
        if request.effects.grain:
            grain_path = effects_service.generate_grain_effect()

        chromatic_path = None
        if request.effects.chromatic_glow:
            chromatic_path = effects_service.generate_chromatic_glow()

        # Step 7: Generate sticker
        sticker_frames = None
        if request.sticker.enabled:
            sticker_path = sticker_service.generate_tiktok_logo()
            sticker_frames = sticker_service.generate_floating_frames(
                sticker_path,
                position=request.sticker.position,
                scale=request.sticker.scale,
            )

        # Step 8: Render video
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
            fps=request.export.fps,
            quality=request.export.quality,
            output_path=output_video,
        )

        # Step 9: Generate thumbnail
        thumbnail_path = None
        if request.export.generate_thumbnail:
            thumbnail_path = await video_renderer.generate_thumbnail(output_video)

        return GenerateResponse(
            success=True,
            video_path=output_video,
            thumbnail_path=thumbnail_path,
            audio_path=processed_audio,
            export_folder=session_dir,
            message="Video generated successfully!",
            duration=duration,
        )

    except HTTPException:
        raise
    except Exception as e:
        return GenerateResponse(
            success=False,
            message=f"Generation failed: {str(e)}",
        )


# ==================== Utility Routes ====================

@router.get("/fonts")
async def get_available_fonts():
    """Get list of available fonts."""
    fonts = text_service.get_available_fonts()
    return {"success": True, "fonts": fonts}


@router.get("/export/{session_id}/{filename}")
async def download_export(session_id: str, filename: str):
    """Download exported file."""
    file_path = os.path.join(EXPORTS_DIR, session_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@router.post("/cleanup")
async def cleanup_temp():
    """Clean up temporary files."""
    try:
        temp_dir = os.path.join(BASE_DIR, "temp")
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            os.makedirs(temp_dir)
        return {"success": True, "message": "Temporary files cleaned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
