"""
Avatar Processing Service
Handles background removal, enhancement, sharpening, and positioning.
"""

import os
from typing import Optional, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class AvatarService:
    """Service for processing avatar images."""

    def process_avatar(
        self,
        avatar_path: str,
        remove_bg: bool = True,
        enhance_colors: bool = True,
        sharpen: bool = True,
        upscale: bool = False,
        target_height: int = 1080,
    ) -> str:
        """
        LOCKED: Process avatar.
        - Background removal: MANDATORY
        - Color enhancement: MANDATORY (saturation + contrast boost)
        - Scale: 0.85 of frame height
        - Position: handled by renderer (25% left, bottom-aligned)
        """
        output_path = os.path.join(BASE_DIR, "temp", "avatar_processed.png")

        img = Image.open(avatar_path).convert("RGBA")

        # MANDATORY: Remove background
        img = self._remove_background(img, avatar_path)

        # MANDATORY: Enhance colors (make vivid)
        img = self._enhance_colors(img)

        # Sharpen for clarity
        img = self._sharpen(img)

        # Scale to 85% of frame height
        final_height = int(target_height * 0.85)
        img = self._resize_to_height(img, final_height)

        img.save(output_path, "PNG", quality=95)
        return output_path

    def _remove_background(self, img: Image.Image, original_path: str) -> Image.Image:
        """Remove background using rembg."""
        try:
            from rembg import remove
            
            # rembg works best with the original file bytes
            with open(original_path, "rb") as f:
                input_bytes = f.read()
            
            output_bytes = remove(input_bytes)
            
            from io import BytesIO
            result = Image.open(BytesIO(output_bytes)).convert("RGBA")
            return result
        except ImportError:
            # Fallback: return image as-is if rembg not available
            print("Warning: rembg not installed. Skipping background removal.")
            return img
        except Exception as e:
            print(f"Warning: Background removal failed: {e}")
            return img

    def _enhance_colors(self, img: Image.Image) -> Image.Image:
        """Enhance color saturation and vibrance — PUNCHY TikTok look."""
        # Split alpha channel
        if img.mode == "RGBA":
            r, g, b, a = img.split()
            rgb_img = Image.merge("RGB", (r, g, b))
        else:
            rgb_img = img.convert("RGB")
            a = None

        # Heavy saturation — make colors POP
        enhancer = ImageEnhance.Color(rgb_img)
        rgb_img = enhancer.enhance(1.5)  # 50% more saturated

        # Strong contrast for punch
        enhancer = ImageEnhance.Contrast(rgb_img)
        rgb_img = enhancer.enhance(1.25)  # 25% more contrast

        # Brightness boost
        enhancer = ImageEnhance.Brightness(rgb_img)
        rgb_img = enhancer.enhance(1.1)  # 10% brighter

        # Recombine with alpha
        if a:
            r, g, b = rgb_img.split()
            img = Image.merge("RGBA", (r, g, b, a))
        else:
            img = rgb_img.convert("RGBA")

        return img

    def _sharpen(self, img: Image.Image) -> Image.Image:
        """Apply sharpening filter."""
        if img.mode == "RGBA":
            r, g, b, a = img.split()
            rgb_img = Image.merge("RGB", (r, g, b))
            
            # Apply unsharp mask for better sharpening
            rgb_img = rgb_img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            
            r, g, b = rgb_img.split()
            img = Image.merge("RGBA", (r, g, b, a))
        else:
            img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

        return img

    def _resize_to_height(self, img: Image.Image, target_height: int) -> Image.Image:
        """Resize image to target height maintaining aspect ratio."""
        ratio = target_height / img.height
        new_width = int(img.width * ratio)
        return img.resize((new_width, target_height), Image.LANCZOS)

    def _upscale(self, img: Image.Image, factor: float = 1.5) -> Image.Image:
        """Basic upscale using Lanczos resampling."""
        new_width = int(img.width * factor)
        new_height = int(img.height * factor)
        return img.resize((new_width, new_height), Image.LANCZOS)

    def get_dominant_colors(self, avatar_path: str, num_colors: int = 5) -> list:
        """Extract dominant colors from avatar for text color matching."""
        try:
            from colorthief import ColorThief
            ct = ColorThief(avatar_path)
            palette = ct.get_palette(color_count=num_colors)
            return [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in palette]
        except Exception:
            # Fallback colors
            return ["#ffffff", "#ff006e", "#8338ec", "#3a86ff", "#06d6a0"]
