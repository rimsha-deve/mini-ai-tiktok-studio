"""
Audio Processing Service
Handles audio speed adjustment, background music mixing, and beat synchronization.
"""

import os
import asyncio
import subprocess
from typing import Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class AudioService:
    """Service for audio processing and mixing."""

    async def process_audio(
        self,
        audio_path: str,
        output_path: str,
        speed: float = 1.18,
        background_music_path: Optional[str] = None,
        background_music_volume: float = -20.8,
        progress_callback=None,
    ) -> str:
        """
        Process audio with speed adjustment and optional background music.
        """
        if progress_callback:
            await progress_callback("audio", 10, "Processing audio...")

        temp_speed_path = output_path.replace(".mp3", "_speed.mp3")
        
        if speed != 1.0:
            await self._apply_speed(audio_path, temp_speed_path, speed)
            current_audio = temp_speed_path
        else:
            current_audio = audio_path

        if progress_callback:
            await progress_callback("audio", 40, "Speed adjustment applied...")

        if background_music_path and os.path.exists(background_music_path):
            if progress_callback:
                await progress_callback("audio", 60, "Mixing background music...")
            await self._mix_background_music(
                current_audio, background_music_path, output_path, background_music_volume
            )
        else:
            if current_audio != output_path:
                if os.path.exists(output_path):
                    os.remove(output_path)
                cmd = ["ffmpeg", "-y", "-i", current_audio, "-c", "copy", output_path]
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, self._run_cmd, cmd)

        # Cleanup temp files
        if os.path.exists(temp_speed_path) and temp_speed_path != output_path:
            os.remove(temp_speed_path)

        if progress_callback:
            await progress_callback("audio", 100, "Audio processing complete!")

        return output_path

    async def _apply_speed(self, input_path: str, output_path: str, speed: float):
        """Apply speed adjustment using FFmpeg atempo filter."""
        filters = []
        remaining_speed = speed
        
        while remaining_speed > 2.0:
            filters.append("atempo=2.0")
            remaining_speed /= 2.0
        while remaining_speed < 0.5:
            filters.append("atempo=0.5")
            remaining_speed /= 0.5
        filters.append(f"atempo={remaining_speed:.4f}")
        
        filter_chain = ",".join(filters)
        
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-filter:a", filter_chain,
            "-vn", "-q:a", "2",
            output_path
        ]
        
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self._run_cmd, cmd)
        
        if result.returncode != 0:
            raise RuntimeError(f"Speed adjustment failed: {result.stderr[:300]}")

    async def _mix_background_music(
        self,
        main_audio: str,
        bg_music: str,
        output_path: str,
        bg_volume: float = -20.8,
    ):
        """Mix main audio with background music at specified volume."""
        duration = await self._get_duration(main_audio)
        
        cmd = [
            "ffmpeg", "-y",
            "-i", main_audio,
            "-stream_loop", "-1", "-i", bg_music,
            "-filter_complex",
            f"[1:a]volume={bg_volume}dB,atrim=0:{duration}[bg];"
            f"[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[out]",
            "-map", "[out]",
            "-q:a", "2",
            output_path
        ]
        
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, self._run_cmd, cmd)
        
        if result.returncode != 0:
            raise RuntimeError(f"Audio mixing failed: {result.stderr[:300]}")

    async def _get_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds."""
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
            return 60.0

    async def get_audio_info(self, audio_path: str) -> dict:
        """Get audio file information."""
        duration = await self._get_duration(audio_path)
        return {
            "path": audio_path,
            "duration": duration,
            "exists": os.path.exists(audio_path),
        }

    @staticmethod
    def _run_cmd(cmd: list):
        """Run a subprocess command synchronously."""
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )
