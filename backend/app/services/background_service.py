"""
Background Service - STRICT LOCKED TEMPLATE
ONLY gradient backgrounds using extracted avatar colors.
No random colors. No random images.
Default: neon pink → purple gradient.
"""

import os
from typing import Optional, Tuple, List
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class BackgroundService:
    """LOCKED background generation. Gradient only."""

    def __init__(self):
        self.width = 1920
        self.height = 1080

    def generate_background(
        self,
        mode: str = "auto",
        color1: Optional[str] = None,
        color2: Optional[str] = None,
        gradient_direction: str = "diagonal",
        uploaded_path: Optional[str] = None,
        resolution: str = "1080p",
        avatar_colors: Optional[list] = None,
    ) -> str:
        """
        Generate background - LOCKED RULES:
        - Auto mode: gradient using avatar colors (primary → secondary)
        - Default: neon pink (#ff2eaa) → purple (#8b2fc9)
        - Always vibrant, saturated, eye-catching
        """
        if resolution == "4k":
            self.width = 3840
            self.height = 2160

        output_path = os.path.join(BASE_DIR, "temp", "background.png")

        if mode == "upload" and uploaded_path and os.path.exists(uploaded_path):
            return self._process_uploaded(uploaded_path, output_path)
        elif mode == "solid":
            return self._generate_solid(color1 or "#ff2eaa", output_path)
        elif mode == "gradient" and color1 and color2:
            return self._generate_vibrant_gradient(color1, color2, output_path)
        else:
            # AUTO MODE: Use avatar colors to create vibrant gradient
            return self._generate_from_avatar_colors(output_path, avatar_colors)

    def _generate_from_avatar_colors(self, output_path: str, avatar_colors: Optional[list]) -> str:
        """
        LOCKED: Generate vibrant gradient from avatar colors.
        If avatar is warm (yellow/red) → pink/magenta/purple background
        If avatar is cool (blue/green) → orange/pink background
        Default: neon pink → purple
        """
        if avatar_colors and len(avatar_colors) >= 1:
            dominant = self._hex_to_rgb(avatar_colors[0])
            r, g, b = dominant

            # Determine contrast gradient based on avatar dominant color
            if r > 160 and g > 130 and b < 100:
                # YELLOW avatar → vibrant pink/magenta to purple (EXACT like reference)
                c1 = "#ff2eaa"   # Hot pink
                c2 = "#9b30d9"   # Purple
            elif r > 180 and g < 120:
                # RED avatar → blue to purple
                c1 = "#4158d0"
                c2 = "#c850c0"
            elif b > 150 and r < 120:
                # BLUE avatar → pink to orange
                c1 = "#ff6b6b"
                c2 = "#ff2eaa"
            elif g > 150 and r < 120:
                # GREEN avatar → magenta to purple
                c1 = "#ff006e"
                c2 = "#8338ec"
            elif r < 80 and g < 80 and b < 80:
                # DARK/BLACK avatar → vibrant pink to purple
                c1 = "#ff2eaa"
                c2 = "#8b2fc9"
            elif r > 200 and g > 200 and b > 200:
                # WHITE/LIGHT avatar → pink to purple
                c1 = "#c850c0"
                c2 = "#4158d0"
            else:
                # DEFAULT: neon pink → purple
                c1 = "#ff2eaa"
                c2 = "#8b2fc9"
        else:
            # NO AVATAR: default neon pink → purple
            c1 = "#ff2eaa"
            c2 = "#8b2fc9"

        return self._generate_vibrant_gradient(c1, c2, output_path)

    def _generate_vibrant_gradient(self, color1: str, color2: str, output_path: str) -> str:
        """Generate a smooth vibrant gradient background."""
        c1 = self._hex_to_rgb(color1)
        c2 = self._hex_to_rgb(color2)

        # Create gradient using numpy for speed
        pixels = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        # Diagonal gradient (top-left to bottom-right)
        y_coords, x_coords = np.mgrid[0:self.height, 0:self.width]
        ratios = (x_coords / self.width * 0.4 + y_coords / self.height * 0.6)
        ratios = np.clip(ratios, 0, 1)

        for i in range(3):
            pixels[:, :, i] = (c1[i] + (c2[i] - c1[i]) * ratios).astype(np.uint8)

        img = Image.fromarray(pixels, "RGB")

        # Add subtle ambient glow for depth
        img = self._add_subtle_glow(img, c1, c2)

        img.save(output_path, quality=95)
        return output_path

    def _add_subtle_glow(self, img: Image.Image, c1: Tuple, c2: Tuple) -> Image.Image:
        """Add subtle light spots for depth (not random, fixed positions)."""
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Fixed glow spots (not random)
        spots = [
            (int(self.width * 0.7), int(self.height * 0.3), 400, c1, 30),
            (int(self.width * 0.3), int(self.height * 0.7), 350, c2, 25),
        ]

        for x, y, radius, color, alpha in spots:
            draw.ellipse(
                [x - radius, y - radius, x + radius, y + radius],
                fill=(*color, alpha),
            )

        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=80))
        img = img.convert("RGBA")
        img = Image.alpha_composite(img, overlay)
        return img.convert("RGB")

    def _generate_solid(self, color: str, output_path: str) -> str:
        img = Image.new("RGB", (self.width, self.height), self._hex_to_rgb(color))
        img.save(output_path, quality=95)
        return output_path

    def _process_uploaded(self, uploaded_path: str, output_path: str) -> str:
        """Process uploaded background to fit 16:9."""
        img = Image.open(uploaded_path)
        target_ratio = self.width / self.height
        img_ratio = img.width / img.height

        if img_ratio > target_ratio:
            new_height = self.height
            new_width = int(new_height * img_ratio)
        else:
            new_width = self.width
            new_height = int(new_width / img_ratio)

        img = img.resize((new_width, new_height), Image.LANCZOS)
        left = (new_width - self.width) // 2
        top = (new_height - self.height) // 2
        img = img.crop((left, top, left + self.width, top + self.height))
        img.save(output_path, quality=95)
        return output_path

    @staticmethod
    def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
