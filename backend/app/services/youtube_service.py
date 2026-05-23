"""
YouTube Audio Extraction Service
Handles downloading video, extracting audio, and fetching thumbnails using yt-dlp.
"""

import os
import asyncio
import uuid
from typing import Dict, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMP_DIR = os.path.join(BASE_DIR, "temp")


class YouTubeService:
    """Service for extracting audio and metadata from YouTube videos."""

    def __init__(self):
        os.makedirs(TEMP_DIR, exist_ok=True)

    async def extract_audio(
        self, url: str, speed: float = 1.18, progress_callback=None
    ) -> Dict[str, str]:
        """
        Extract audio from YouTube URL.

        Args:
            url: YouTube video URL
            speed: Audio speed multiplier (default 1.18x)
            progress_callback: Optional async callback for progress updates

        Returns:
            Dict with paths to extracted audio, thumbnail, and metadata
        """
        session_id = str(uuid.uuid4())[:8]
        output_dir = os.path.join(TEMP_DIR, session_id)
        os.makedirs(output_dir, exist_ok=True)

        audio_path = os.path.join(output_dir, "audio.mp3")
        thumbnail_path = os.path.join(output_dir, "thumbnail.jpg")
        info_path = os.path.join(output_dir, "info.json")

        if progress_callback:
            await progress_callback("youtube", 10, "Starting YouTube download...")

        # Download audio using yt-dlp — FIXED: use android client to bypass bot detection
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": os.path.join(output_dir, "raw_audio.%(ext)s"),
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
            "writethumbnail": True,
            "writeinfojson": True,
            "quiet": True,
            "no_warnings": True,
            # Use android client — most reliable for server-side downloads
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "web"],
                }
            },
            "http_headers": {
                "User-Agent": "com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip",
            },
        }

        try:
            import yt_dlp

            if progress_callback:
                await progress_callback("youtube", 20, "Downloading audio from YouTube...")

            # Run yt-dlp in thread pool to avoid blocking
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, self._download, url, ydl_opts)

            if progress_callback:
                await progress_callback("youtube", 50, "Audio downloaded, processing...")

            # Debug: list files in output directory
            print(f"[DEBUG] Files in {output_dir}: {os.listdir(output_dir)}")

            # Find the downloaded audio file
            raw_audio = self._find_file(output_dir, ["mp3", "m4a", "webm", "opus"])
            if not raw_audio:
                files_list = os.listdir(output_dir)
                raise FileNotFoundError(f"Audio file not found after download. Files in dir: {files_list}")

            # Apply speed adjustment using FFmpeg
            if speed != 1.0:
                if progress_callback:
                    await progress_callback("youtube", 60, f"Applying {speed}x speed...")
                await self._apply_speed(raw_audio, audio_path, speed)
            else:
                os.rename(raw_audio, audio_path)

            # Find thumbnail
            thumb_file = self._find_file(output_dir, ["jpg", "png", "webp"])
            if thumb_file and thumb_file != thumbnail_path:
                # Convert to jpg if needed
                await self._convert_thumbnail(thumb_file, thumbnail_path)

            if progress_callback:
                await progress_callback("youtube", 90, "Extraction complete!")

            # Get audio duration
            duration = await self._get_duration(audio_path)

            if progress_callback:
                await progress_callback("youtube", 100, "YouTube extraction done!")

            return {
                "audio_path": audio_path,
                "thumbnail_path": thumbnail_path if os.path.exists(thumbnail_path) else None,
                "duration": duration,
                "session_id": session_id,
                "output_dir": output_dir,
            }

        except Exception as e:
            import traceback
            error_detail = str(e) or repr(e)
            tb = traceback.format_exc()
            print(f"[ERROR] YouTube extraction failed:\n{tb}")
            if "no supported" in error_detail.lower() or "js" in error_detail.lower():
                error_detail += " (Ensure Node.js is installed and in PATH)"
            raise RuntimeError(f"YouTube extraction failed: {error_detail}")

    def _download(self, url: str, opts: dict):
        """Synchronous yt-dlp download."""
        import yt_dlp

        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])

    def _find_file(self, directory: str, extensions: list) -> Optional[str]:
        """Find first file matching given extensions in directory."""
        if not os.path.exists(directory):
            return None

        files = os.listdir(directory)

        # First pass: look for files with "raw_audio" in name
        for file in files:
            for ext in extensions:
                if file.endswith(f".{ext}") and "raw_audio" in file:
                    return os.path.join(directory, file)

        # Second pass: any file with matching extension (skip json/info files)
        for file in files:
            for ext in extensions:
                if file.endswith(f".{ext}") and not file.endswith(".info.json"):
                    return os.path.join(directory, file)

        return None

    async def _apply_speed(self, input_path: str, output_path: str, speed: float):
        """Apply speed adjustment to audio using FFmpeg."""
        atempo = speed
        # FFmpeg atempo filter only supports 0.5 to 100.0
        filter_chain = f"atempo={atempo}"

        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-filter:a", filter_chain,
            "-vn", output_path
        ]

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self._run_cmd, cmd)

        if result.returncode != 0:
            error_msg = result.stderr[:200] if result.stderr else "Unknown FFmpeg error"
            raise RuntimeError(f"FFmpeg speed adjustment failed: {error_msg}")

        if not os.path.exists(output_path):
            raise FileNotFoundError(f"FFmpeg did not produce output file: {output_path}")

    async def _convert_thumbnail(self, input_path: str, output_path: str):
        """Convert thumbnail to JPG format."""
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease",
            output_path
        ]
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._run_cmd, cmd)

    async def _get_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds using FFprobe."""
        cmd = [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self._run_cmd, cmd)
        try:
            return float(result.stdout.strip())
        except (ValueError, AttributeError):
            return 60.0  # Default fallback

    @staticmethod
    def _run_cmd(cmd: list):
        """Run a subprocess command synchronously and return the result."""
        import subprocess
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
