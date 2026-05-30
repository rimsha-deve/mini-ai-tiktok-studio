"""
TikTok Sticker Service
Handles animated sticker overlay with floating animation.
"""

import os
import math
import random
from typing import List, Tuple
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STICKERS_DIR = os.path.join(BASE_DIR, "assets", "stickers")


class StickerService:
    """Service for generating animated TikTok sticker overlays."""

    def __init__(self):
        self.width = 1920
        self.height = 1080

    def set_resolution(self, resolution: str = "1080p"):
        """Set output resolution."""
        if resolution == "4k":
            self.width = 3840
            self.height = 2160

    def generate_tiktok_logo(self, size: int = 80) -> str:
        """
        Load the real TikTok logo from assets.
        Falls back to generating one if file doesn't exist.
        """
        output_path = os.path.join(BASE_DIR, "temp", "tiktok_sticker.png")

        # Use the real TikTok logo from assets
        custom_sticker = os.path.join(STICKERS_DIR, "tiktok_logo.png")
        if os.path.exists(custom_sticker):
            img = Image.open(custom_sticker).convert("RGBA")
            img = img.resize((size, size), Image.LANCZOS)
            img.save(output_path, "PNG")
            return output_path

        # Fallback: generate a simple music note
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Simple TikTok-style note
        cx, cy = size // 2, size // 2
        r = size // 5
        
        # Note head
        draw.ellipse([cx-r-2, cy+r, cx+r-2, cy+r*2+4], fill=(0, 0, 0, 255))
        # Stem
        draw.rectangle([cx+r-4, cy-r*2, cx+r, cy+r+2], fill=(0, 0, 0, 255))
        # Cyan shadow
        draw.ellipse([cx-r-5, cy+r+3, cx+r-5, cy+r*2+7], fill=(0, 232, 227, 180))
        # Red shadow
        draw.ellipse([cx-r+1, cy+r-3, cx+r+1, cy+r*2+1], fill=(255, 0, 80, 180))

        img.save(output_path, "PNG")
        return output_path

    def generate_floating_frames(
        self,
        sticker_path: str,
        num_frames: int = 30,
        position: str = "top-left",
        scale: float = 0.055,
        amplitude: float = 5.0,
    ) -> List[str]:
        """
        LOCKED: TikTok sticker with slight float animation.
        - Size: 5-6% of canvas width
        - Position: top-left (ALWAYS)
        - Animation: gentle float only
        """
        frames_dir = os.path.join(BASE_DIR, "temp", "sticker_frames")
        os.makedirs(frames_dir, exist_ok=True)

        # Load and resize sticker to LOCKED 5.5% size
        sticker = Image.open(sticker_path).convert("RGBA")
        sticker_size = int(self.width * scale)
        sticker = sticker.resize((sticker_size, sticker_size), Image.LANCZOS)

        # LOCKED position: top-left
        base_x, base_y = self._get_position(position, sticker_size)

        frame_paths = []
        for i in range(num_frames):
            frame = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
            
            # Gentle float animation (slight movement)
            progress = i / num_frames
            y_offset = int(amplitude * math.sin(2 * math.pi * progress))
            x_offset = int(amplitude * 0.3 * math.cos(2 * math.pi * progress))
            
            paste_x = base_x + x_offset
            paste_y = base_y + y_offset
            
            frame.paste(sticker, (paste_x, paste_y), sticker)
            
            path = os.path.join(frames_dir, f"sticker_{i:04d}.png")
            frame.save(path, "PNG")
            frame_paths.append(path)

        return frame_paths

    def _get_position(self, position: str, sticker_size: int) -> Tuple[int, int]:
        """LOCKED: TikTok sticker always top-left."""
        # LOCKED: Always top-left with small margin
        margin_x = int(self.width * 0.02)
        margin_y = int(self.height * 0.03)
        return (margin_x, margin_y)
