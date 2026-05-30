"""
Preset Management Service
Handles loading, saving, and applying video generation presets.
"""

import os
import json
from typing import Dict, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PRESETS_DIR = os.path.join(BASE_DIR, "presets")


# Built-in presets
DEFAULT_PRESETS = {
    "tiktok-neon": {
        "name": "TikTok Neon",
        "description": "Vibrant neon glow aesthetic",
        "background": {
            "mode": "gradient",
            "color1": "#ff006e",
            "color2": "#8338ec",
            "gradient_direction": "diagonal",
        },
        "text": {
            "text": "SI TE SABES EL TIKTOK BAILAI",
            "font": "Anton",
            "font_size": 72,
            "color": "#00ffff",
            "glow": True,
            "glow_color": "#00ffff",
            "shadow": True,
            "stroke": True,
            "stroke_width": 3,
        },
        "effects": {
            "snowfall": False,
            "fuzzy_stars": True,
            "glow_particles": True,
            "soft_blur_glow": True,
            "chromatic_glow": True,
            "enhancement_4k": True,
        },
        "audio": {"speed": 1.18, "background_music_volume": -20.8},
        "sticker": {"enabled": True, "position": "top-right"},
    },
    "snow-aesthetic": {
        "name": "Snow Aesthetic",
        "description": "Calm snowy winter vibe",
        "background": {
            "mode": "gradient",
            "color1": "#1a1a2e",
            "color2": "#16213e",
            "gradient_direction": "vertical",
        },
        "text": {
            "text": "SI TE SABES EL TIKTOK BAILAI",
            "font": "Anton",
            "font_size": 72,
            "color": "#ffffff",
            "glow": True,
            "glow_color": "#87ceeb",
            "shadow": True,
            "stroke": True,
            "stroke_width": 2,
        },
        "effects": {
            "snowfall": True,
            "snowfall_speed": 35,
            "fuzzy_stars": True,
            "glow_particles": False,
            "soft_blur_glow": True,
            "enhancement_4k": True,
        },
        "audio": {"speed": 1.18, "background_music_volume": -20.8},
        "sticker": {"enabled": True, "position": "top-right"},
    },
    "dark-mood": {
        "name": "Dark Mood",
        "description": "Dark moody cinematic style",
        "background": {
            "mode": "gradient",
            "color1": "#0d0d0d",
            "color2": "#1a0a2e",
            "gradient_direction": "radial",
        },
        "text": {
            "text": "SI TE SABES EL TIKTOK BAILAI",
            "font": "Anton",
            "font_size": 72,
            "color": "#e63946",
            "glow": True,
            "glow_color": "#e63946",
            "shadow": True,
            "stroke": True,
            "stroke_width": 4,
        },
        "effects": {
            "snowfall": False,
            "fuzzy_stars": False,
            "glow_particles": True,
            "soft_blur_glow": True,
            "vhs_effect": True,
            "grain": True,
            "cinematic_blur": True,
            "enhancement_4k": True,
        },
        "audio": {"speed": 1.18, "background_music_volume": -20.8},
        "sticker": {"enabled": True, "position": "bottom-right"},
    },
    "anime-glow": {
        "name": "Anime Glow",
        "description": "Bright anime-inspired aesthetic",
        "background": {
            "mode": "gradient",
            "color1": "#f72585",
            "color2": "#4cc9f0",
            "gradient_direction": "diagonal",
        },
        "text": {
            "text": "SI TE SABES EL TIKTOK BAILAI",
            "font": "Anton",
            "font_size": 72,
            "color": "#ffffff",
            "glow": True,
            "glow_color": "#f72585",
            "shadow": True,
            "stroke": True,
            "stroke_width": 3,
        },
        "effects": {
            "snowfall": True,
            "snowfall_speed": 40,
            "fuzzy_stars": True,
            "glow_particles": True,
            "soft_blur_glow": True,
            "chromatic_glow": True,
            "enhancement_4k": True,
        },
        "audio": {"speed": 1.18, "background_music_volume": -20.8},
        "sticker": {"enabled": True, "position": "top-right"},
    },
    "mashup-style": {
        "name": "Mashup Style",
        "description": "Classic TikTok mashup look",
        "background": {
            "mode": "auto",
        },
        "text": {
            "text": "SI TE SABES EL TIKTOK BAILAI",
            "font": "Anton",
            "font_size": 72,
            "color": None,
            "glow": True,
            "shadow": True,
            "stroke": True,
            "stroke_width": 3,
        },
        "effects": {
            "snowfall": True,
            "snowfall_speed": 40,
            "fuzzy_stars": True,
            "glow_particles": True,
            "soft_blur_glow": True,
            "enhancement_4k": True,
        },
        "audio": {"speed": 1.18, "background_music_volume": -20.8},
        "sticker": {"enabled": True, "position": "top-right"},
    },
    "glow": {
        "name": "Glow",
        "description": "Soft ethereal glow effect",
        "background": {
            "mode": "gradient",
            "color1": "#7400b8",
            "color2": "#80ffdb",
            "gradient_direction": "radial",
        },
        "text": {
            "text": "SI TE SABES EL TIKTOK BAILAI",
            "font": "Anton",
            "font_size": 72,
            "color": "#80ffdb",
            "glow": True,
            "glow_color": "#80ffdb",
            "shadow": True,
            "stroke": True,
            "stroke_width": 2,
        },
        "effects": {
            "snowfall": False,
            "fuzzy_stars": True,
            "glow_particles": True,
            "soft_blur_glow": True,
            "chromatic_glow": True,
            "enhancement_4k": True,
        },
        "audio": {"speed": 1.18, "background_music_volume": -20.8},
        "sticker": {"enabled": True, "position": "top-right"},
    },
}


class PresetService:
    """Service for managing video generation presets."""

    def __init__(self):
        os.makedirs(PRESETS_DIR, exist_ok=True)
        self._ensure_default_presets()

    def _ensure_default_presets(self):
        """Save default presets to disk if they don't exist."""
        for preset_id, preset_data in DEFAULT_PRESETS.items():
            path = os.path.join(PRESETS_DIR, f"{preset_id}.json")
            if not os.path.exists(path):
                with open(path, "w") as f:
                    json.dump(preset_data, f, indent=2)

    def get_all_presets(self) -> List[Dict]:
        """Get all available presets."""
        presets = []
        for filename in os.listdir(PRESETS_DIR):
            if filename.endswith(".json"):
                path = os.path.join(PRESETS_DIR, filename)
                with open(path, "r") as f:
                    data = json.load(f)
                    data["id"] = filename.replace(".json", "")
                    presets.append(data)
        return presets

    def get_preset(self, preset_id: str) -> Optional[Dict]:
        """Get a specific preset by ID."""
        path = os.path.join(PRESETS_DIR, f"{preset_id}.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                data = json.load(f)
                data["id"] = preset_id
                return data
        return None

    def save_preset(self, preset_id: str, data: Dict) -> bool:
        """Save or update a preset."""
        path = os.path.join(PRESETS_DIR, f"{preset_id}.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        return True

    def delete_preset(self, preset_id: str) -> bool:
        """Delete a preset."""
        path = os.path.join(PRESETS_DIR, f"{preset_id}.json")
        if os.path.exists(path):
            os.remove(path)
            return True
        return False
