"""
Pydantic models for request/response validation.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class YouTubeExtractRequest(BaseModel):
    """Request model for YouTube audio extraction."""
    url: str = Field(..., description="YouTube video URL")
    speed: float = Field(default=1.18, description="Audio speed multiplier")


class AudioSettings(BaseModel):
    """Audio processing configuration."""
    speed: float = Field(default=1.18, ge=0.5, le=3.0)
    background_music_path: Optional[str] = None
    background_music_volume: float = Field(default=-20.8, description="Background music volume in dB")
    add_beat: bool = Field(default=False)


class BackgroundSettings(BaseModel):
    """Background configuration."""
    mode: str = Field(default="auto", description="auto, solid, gradient, upload")
    color1: Optional[str] = Field(default="#ff006e", description="Primary color hex")
    color2: Optional[str] = Field(default="#8338ec", description="Secondary color hex")
    gradient_direction: str = Field(default="diagonal", description="horizontal, vertical, diagonal, radial")
    uploaded_path: Optional[str] = None


class AvatarSettings(BaseModel):
    """Avatar configuration."""
    remove_background: bool = Field(default=True)
    enhance_colors: bool = Field(default=True)
    sharpen: bool = Field(default=True)
    upscale: bool = Field(default=False)
    position: str = Field(default="left", description="left, center, right")
    scale: float = Field(default=0.6, ge=0.1, le=1.5)


class TextSettings(BaseModel):
    """Text overlay configuration."""
    text: str = Field(default="SI TE SABES EL TIKTOK BAILAI")
    font: str = Field(default="Anton")
    font_size: int = Field(default=72)
    color: Optional[str] = Field(default=None, description="Auto-matched if None")
    position: str = Field(default="right")
    glow: bool = Field(default=True)
    glow_color: Optional[str] = None
    shadow: bool = Field(default=True)
    stroke: bool = Field(default=True)
    stroke_width: int = Field(default=3)
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)


class EffectSettings(BaseModel):
    """Visual effects configuration."""
    snowfall: bool = Field(default=True)
    snowfall_speed: int = Field(default=40, ge=33, le=50)
    fuzzy_stars: bool = Field(default=True)
    glow_particles: bool = Field(default=True)
    soft_blur_glow: bool = Field(default=True)
    vhs_effect: bool = Field(default=False)
    chromatic_glow: bool = Field(default=False)
    grain: bool = Field(default=False)
    cinematic_blur: bool = Field(default=False)
    enhancement_4k: bool = Field(default=True)


class StickerSettings(BaseModel):
    """TikTok sticker configuration."""
    enabled: bool = Field(default=True)
    floating_animation: bool = Field(default=True)
    position: str = Field(default="top-right")
    scale: float = Field(default=0.15)


class ExportSettings(BaseModel):
    """Export configuration."""
    resolution: str = Field(default="1080p", description="1080p or 4k")
    format: str = Field(default="mp4")
    fps: int = Field(default=30)
    quality: str = Field(default="high", description="low, medium, high, ultra")
    generate_thumbnail: bool = Field(default=True)


class PresetConfig(BaseModel):
    """Complete preset configuration."""
    name: str
    description: Optional[str] = None
    background: BackgroundSettings = BackgroundSettings()
    text: TextSettings = TextSettings()
    effects: EffectSettings = EffectSettings()
    audio: AudioSettings = AudioSettings()
    sticker: StickerSettings = StickerSettings()


class GenerateRequest(BaseModel):
    """Full video generation request."""
    youtube_url: Optional[str] = None
    avatar_path: Optional[str] = None
    preset: Optional[str] = None
    audio: AudioSettings = AudioSettings()
    background: BackgroundSettings = BackgroundSettings()
    avatar: AvatarSettings = AvatarSettings()
    text: TextSettings = TextSettings()
    effects: EffectSettings = EffectSettings()
    sticker: StickerSettings = StickerSettings()
    export: ExportSettings = ExportSettings()


class ProgressUpdate(BaseModel):
    """WebSocket progress update model."""
    stage: str
    progress: float = Field(ge=0.0, le=100.0)
    message: str
    status: str = Field(default="processing", description="processing, complete, error")


class GenerateResponse(BaseModel):
    """Video generation response."""
    success: bool
    video_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    audio_path: Optional[str] = None
    export_folder: Optional[str] = None
    message: str
    duration: Optional[float] = None
