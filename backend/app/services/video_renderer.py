"""
Video Rendering Service - Optimized
Composes all layers and renders final video using FFmpeg.
Uses a single static frame approach for speed, with optional animation overlay.
"""

import os
import asyncio
import subprocess
import shutil
from typing import Optional, List
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class VideoRenderer:
    """Service for compositing layers and rendering final video."""

    def __init__(self):
        self.width = 1920
        self.height = 1080
        self.fps = 30

    def set_resolution(self, resolution: str = "1080p"):
        """Set output resolution."""
        if resolution == "4k":
            self.width = 3840
            self.height = 2160

    async def render_video(
        self,
        audio_path: str,
        background_path: str,
        avatar_path: Optional[str] = None,
        text_overlay_path: Optional[str] = None,
        snowfall_frames: Optional[List[str]] = None,
        particle_overlay_path: Optional[str] = None,
        sticker_frames: Optional[List[str]] = None,
        soft_glow_path: Optional[str] = None,
        vhs_path: Optional[str] = None,
        grain_path: Optional[str] = None,
        chromatic_path: Optional[str] = None,
        duration: float = 60.0,
        fps: int = 30,
        quality: str = "high",
        output_path: Optional[str] = None,
        progress_callback=None,
    ) -> str:
        """
        Render final video by compositing all layers.
        
        OPTIMIZED APPROACH:
        - If no animated elements (snowfall/sticker): single image + audio = video (instant)
        - If animated: generate minimal frames (1 second loop), FFmpeg loops them
        """
        self.fps = fps
        
        if output_path is None:
            output_path = os.path.join(BASE_DIR, "exports", "output.mp4")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        if progress_callback:
            await progress_callback("render", 5, "Preparing render pipeline...")

        has_animation = bool(snowfall_frames) or bool(sticker_frames)

        if has_animation:
            await self._render_animated(
                audio_path, background_path, avatar_path, text_overlay_path,
                snowfall_frames, particle_overlay_path, sticker_frames,
                soft_glow_path, vhs_path, grain_path, chromatic_path,
                duration, fps, quality, output_path, progress_callback
            )
        else:
            await self._render_static(
                audio_path, background_path, avatar_path, text_overlay_path,
                particle_overlay_path, soft_glow_path, vhs_path, grain_path,
                chromatic_path, duration, fps, quality, output_path, progress_callback
            )

        if progress_callback:
            await progress_callback("render", 100, "Render complete!")

        return output_path

    async def _render_static(
        self, audio_path, background_path, avatar_path, text_overlay_path,
        particle_overlay_path, soft_glow_path, vhs_path, grain_path,
        chromatic_path, duration, fps, quality, output_path, progress_callback
    ):
        """
        FAST PATH: Compose a single image, then FFmpeg creates video from it + audio.
        This takes only a few seconds regardless of video duration.
        """
        if progress_callback:
            await progress_callback("render", 15, "Compositing static scene...")

        # Build single composite frame
        frame = self._composite_static_frame(
            background_path, avatar_path, text_overlay_path,
            particle_overlay_path, soft_glow_path, vhs_path,
            grain_path, chromatic_path
        )

        # Save as single image
        static_image = os.path.join(BASE_DIR, "temp", "static_frame.png")
        frame.save(static_image, "PNG")

        if progress_callback:
            await progress_callback("render", 30, "Encoding video (this is fast)...")

        # FFmpeg: single image + audio = video
        crf = self._get_crf(quality)
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", static_image,
            "-i", audio_path,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-crf", crf,
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            output_path,
        ]

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self._run_cmd, cmd)

        if result.returncode != 0:
            raise RuntimeError(f"Video encoding failed: {result.stderr[:500]}")

        # Cleanup
        os.remove(static_image)

    async def _render_animated(
        self, audio_path, background_path, avatar_path, text_overlay_path,
        snowfall_frames, particle_overlay_path, sticker_frames,
        soft_glow_path, vhs_path, grain_path, chromatic_path,
        duration, fps, quality, output_path, progress_callback
    ):
        """
        ANIMATED PATH: Generate a short loop of frames, FFmpeg loops them with audio.
        Only generates 1 second of frames (30 frames max).
        """
        frames_dir = os.path.join(BASE_DIR, "temp", "render_frames")
        if os.path.exists(frames_dir):
            shutil.rmtree(frames_dir)
        os.makedirs(frames_dir)

        if progress_callback:
            await progress_callback("render", 10, "Building base composite...")

        # Pre-build the static base (everything except animated layers)
        base_frame = self._composite_static_frame(
            background_path, avatar_path, text_overlay_path,
            particle_overlay_path, soft_glow_path, vhs_path,
            grain_path, chromatic_path
        )

        if progress_callback:
            await progress_callback("render", 20, "Generating animation frames...")

        # Pre-load animated frames into memory (avoid repeated disk reads)
        snow_images = []
        if snowfall_frames:
            for sf in snowfall_frames:
                img = Image.open(sf).convert("RGBA")
                if img.size != (self.width, self.height):
                    img = img.resize((self.width, self.height), Image.BILINEAR)
                snow_images.append(img)

        sticker_images = []
        if sticker_frames:
            for sf in sticker_frames:
                img = Image.open(sf).convert("RGBA")
                if img.size != (self.width, self.height):
                    img = img.resize((self.width, self.height), Image.BILINEAR)
                sticker_images.append(img)

        # Generate 1 second of frames (loop cycle)
        cycle_frames = min(fps, 30)

        if progress_callback:
            await progress_callback("render", 30, f"Rendering {cycle_frames} frames...")

        for frame_idx in range(cycle_frames):
            frame = base_frame.copy()

            # Add snowfall
            if snow_images:
                snow_idx = frame_idx % len(snow_images)
                frame = Image.alpha_composite(frame, snow_images[snow_idx])

            # Add sticker
            if sticker_images:
                sticker_idx = frame_idx % len(sticker_images)
                frame = Image.alpha_composite(frame, sticker_images[sticker_idx])

            # Save frame as JPEG for speed (much smaller than PNG)
            frame_path = os.path.join(frames_dir, f"frame_{frame_idx:04d}.jpg")
            frame.convert("RGB").save(frame_path, "JPEG", quality=92)

            if progress_callback and frame_idx % 10 == 0:
                progress = 30 + (frame_idx / cycle_frames) * 30
                await progress_callback("render", progress, f"Frame {frame_idx + 1}/{cycle_frames}")

        if progress_callback:
            await progress_callback("render", 65, "Encoding video with FFmpeg...")

        # FFmpeg: loop frames + audio
        crf = self._get_crf(quality)
        frame_pattern = os.path.join(frames_dir, "frame_%04d.jpg")

        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-stream_loop", "-1",
            "-i", frame_pattern,
            "-i", audio_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-crf", crf,
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            output_path,
        ]

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self._run_cmd, cmd)

        if result.returncode != 0:
            raise RuntimeError(f"Video encoding failed: {result.stderr[:500]}")

        # Cleanup frames
        shutil.rmtree(frames_dir, ignore_errors=True)

    def _composite_static_frame(
        self, background_path, avatar_path, text_overlay_path,
        particle_overlay_path, soft_glow_path, vhs_path,
        grain_path, chromatic_path
    ) -> Image.Image:
        """Build a single composite frame from all static layers."""
        # Background
        frame = Image.open(background_path).convert("RGBA")
        frame = frame.resize((self.width, self.height), Image.LANCZOS)

        # Soft glow
        if soft_glow_path and os.path.exists(soft_glow_path):
            layer = Image.open(soft_glow_path).convert("RGBA")
            if layer.size != frame.size:
                layer = layer.resize(frame.size, Image.BILINEAR)
            frame = Image.alpha_composite(frame, layer)

        # Particles
        if particle_overlay_path and os.path.exists(particle_overlay_path):
            layer = Image.open(particle_overlay_path).convert("RGBA")
            if layer.size != frame.size:
                layer = layer.resize(frame.size, Image.BILINEAR)
            frame = Image.alpha_composite(frame, layer)

        # Avatar (LOCKED: centered at 25% from left, bottom-aligned, full height)
        if avatar_path and os.path.exists(avatar_path):
            avatar = Image.open(avatar_path).convert("RGBA")
            # Scale avatar to fill full frame height
            if avatar.height < self.height:
                scale = self.height / avatar.height
                new_w = int(avatar.width * scale)
                avatar = avatar.resize((new_w, self.height), Image.LANCZOS)
            # Center at 25% from left
            avatar_x = int(self.width * 0.25) - (avatar.width // 2)
            avatar_x = max(0, avatar_x)
            avatar_y = 0  # Top-aligned (fills full height)
            frame.paste(avatar, (avatar_x, avatar_y), avatar)

        # Text overlay
        if text_overlay_path and os.path.exists(text_overlay_path):
            layer = Image.open(text_overlay_path).convert("RGBA")
            if layer.size != frame.size:
                layer = layer.resize(frame.size, Image.BILINEAR)
            frame = Image.alpha_composite(frame, layer)

        # Post-effects
        if chromatic_path and os.path.exists(chromatic_path):
            layer = Image.open(chromatic_path).convert("RGBA")
            if layer.size != frame.size:
                layer = layer.resize(frame.size, Image.BILINEAR)
            frame = Image.alpha_composite(frame, layer)

        if vhs_path and os.path.exists(vhs_path):
            layer = Image.open(vhs_path).convert("RGBA")
            if layer.size != frame.size:
                layer = layer.resize(frame.size, Image.BILINEAR)
            frame = Image.alpha_composite(frame, layer)

        if grain_path and os.path.exists(grain_path):
            layer = Image.open(grain_path).convert("RGBA")
            if layer.size != frame.size:
                layer = layer.resize(frame.size, Image.BILINEAR)
            frame = Image.alpha_composite(frame, layer)

        return frame

    def _get_crf(self, quality: str) -> str:
        """Get FFmpeg CRF value for quality preset."""
        return {"low": "28", "medium": "23", "high": "18", "ultra": "15"}.get(quality, "18")

    async def generate_thumbnail(
        self,
        video_path: str,
        output_path: Optional[str] = None,
    ) -> str:
        """Generate HD thumbnail from rendered video."""
        if output_path is None:
            output_path = video_path.replace(".mp4", "_thumbnail.jpg")

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-ss", "1",
            "-vframes", "1",
            "-q:v", "2",
            "-vf", f"scale={self.width}:{self.height}",
            output_path,
        ]

        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._run_cmd, cmd)
        return output_path

    @staticmethod
    def _run_cmd(cmd: list):
        """Run a subprocess command synchronously."""
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,
        )
