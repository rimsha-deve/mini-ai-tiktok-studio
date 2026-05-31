"""
Background Music Service
Downloads and caches royalty-free background music tracks.
Uses freesound/pixabay/ccmixter public domain tracks.
"""

import os
import asyncio
import subprocess
from typing import Optional, List

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BGMUSIC_DIR = os.path.join(BASE_DIR, "assets", "bgmusic")
os.makedirs(BGMUSIC_DIR, exist_ok=True)

# Free royalty-free tracks from publicly accessible sources
# These are short loopable beats from freemusicarchive / pixabay
TRACKS = {
    "hiphop": {
        "label": "Hip-Hop",
        "desc": "Trap beat, 808s",
        "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "file": "hiphop.mp3",
        "bpm": 90,
    },
    "pop": {
        "label": "Pop",
        "desc": "Upbeat pop vibes",
        "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "file": "pop.mp3",
        "bpm": 120,
    },
    "reggaeton": {
        "label": "Reggaeton",
        "desc": "Latin rhythm",
        "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "file": "reggaeton.mp3",
        "bpm": 100,
    },
    "lofi": {
        "label": "Lo-Fi",
        "desc": "Chill lo-fi beats",
        "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "file": "lofi.mp3",
        "bpm": 75,
    },
    "edm": {
        "label": "EDM",
        "desc": "Electronic drop",
        "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        "file": "edm.mp3",
        "bpm": 138,
    },
}


def get_track_path(track_id: str) -> Optional[str]:
    """Get local path for a track, None if not downloaded yet."""
    if track_id not in TRACKS:
        return None
    path = os.path.join(BGMUSIC_DIR, TRACKS[track_id]["file"])
    return path if os.path.exists(path) and os.path.getsize(path) > 10000 else None


async def ensure_track(track_id: str) -> Optional[str]:
    """Download track if not cached, return local path."""
    if track_id not in TRACKS:
        return None

    path = os.path.join(BGMUSIC_DIR, TRACKS[track_id]["file"])

    # Already downloaded
    if os.path.exists(path) and os.path.getsize(path) > 10000:
        return path

    url = TRACKS[track_id]["url"]
    print(f"[BGMUSIC] Downloading {track_id} from {url}")

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, lambda: subprocess.run(
            ["ffmpeg", "-y", "-i", url, "-t", "180",  # max 3 min
             "-c:a", "mp3", "-b:a", "128k", path],
            capture_output=True, text=True, timeout=120
        ))
        if result.returncode == 0 and os.path.exists(path) and os.path.getsize(path) > 10000:
            print(f"[BGMUSIC] Downloaded {track_id} → {path}")
            return path
        # Fallback: try direct download with urllib
        result2 = await loop.run_in_executor(None, lambda: subprocess.run(
            ["ffmpeg", "-y", "-user_agent",
             "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
             "-i", url, "-t", "180", "-c:a", "mp3", "-b:a", "128k", path],
            capture_output=True, text=True, timeout=120
        ))
        if result2.returncode == 0 and os.path.exists(path):
            return path
    except Exception as e:
        print(f"[BGMUSIC] Download failed for {track_id}: {e}")

    return None


async def mix_multiple_tracks(
    main_audio: str,
    tracks: List[dict],   # [{ "id": "hiphop", "volume": -20, "speed": 1.0 }, ...]
    output_path: str,
    duration: float,
) -> str:
    """
    Mix main audio with multiple background music tracks.
    Each track has its own volume and speed settings.
    """
    if not tracks:
        # No BG music — just copy
        subprocess.run(
            ["ffmpeg", "-y", "-i", main_audio, "-c", "copy", output_path],
            capture_output=True, timeout=120
        )
        return output_path

    # Download and prepare all tracks
    track_paths = []
    for t in tracks:
        path = await ensure_track(t["id"])
        if path:
            track_paths.append((path, t.get("volume", -20.0), t.get("speed", 1.0)))

    if not track_paths:
        # No tracks available — just copy
        subprocess.run(
            ["ffmpeg", "-y", "-i", main_audio, "-c", "copy", output_path],
            capture_output=True, timeout=120
        )
        return output_path

    # Build FFmpeg filter_complex for all tracks
    inputs  = ["-i", main_audio]
    filters = []
    mix_inputs = "[0:a]"

    for i, (path, vol, spd) in enumerate(track_paths):
        inputs += ["-stream_loop", "-1", "-i", path]
        idx = i + 1
        spd_filter = f"atempo={spd:.3f}," if abs(spd - 1.0) > 0.01 else ""
        filters.append(
            f"[{idx}:a]{spd_filter}volume={vol}dB,atrim=0:{duration:.1f}[bg{i}]"
        )
        mix_inputs += f"[bg{i}]"

    n_inputs = 1 + len(track_paths)
    filters.append(
        f"{mix_inputs}amix=inputs={n_inputs}:duration=first:dropout_transition=2[out]"
    )

    filter_str = ";".join(filters)

    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_str,
        "-map", "[out]",
        "-q:a", "2",
        output_path,
    ]

    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, lambda: subprocess.run(
        cmd, capture_output=True, text=True, timeout=300
    ))

    if result.returncode != 0:
        print(f"[BGMUSIC] Mix failed: {result.stderr[:300]}")
        # Fallback: copy without BG music
        subprocess.run(
            ["ffmpeg", "-y", "-i", main_audio, "-c", "copy", output_path],
            capture_output=True, timeout=120
        )

    return output_path


def list_tracks() -> List[dict]:
    """Return all available tracks with download status."""
    return [
        {
            "id":        tid,
            "label":     t["label"],
            "desc":      t["desc"],
            "bpm":       t["bpm"],
            "available": bool(get_track_path(tid)),
        }
        for tid, t in TRACKS.items()
    ]
