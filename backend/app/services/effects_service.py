"""
Visual Effects Service
Generates snowfall, particles, glow, VHS, grain, and other aesthetic overlays.
"""

import os
import random
from typing import Tuple, List
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class EffectsService:
    """Service for generating visual effect overlays."""

    def __init__(self):
        self.width = 1920
        self.height = 1080

    def set_resolution(self, resolution: str = "1080p"):
        """Set output resolution."""
        if resolution == "4k":
            self.width = 3840
            self.height = 2160

    def generate_snowfall_frames(
        self,
        num_frames: int = 30,
        speed: int = 40,
        density: int = 80,
    ) -> List[str]:
        """
        LOCKED: Snowfall effect.
        - Small, subtle white dots
        - Natural falling motion
        - Not too dense, not too sparse
        """
        frames_dir = os.path.join(BASE_DIR, "temp", "snowfall_frames")
        os.makedirs(frames_dir, exist_ok=True)

        # Fixed snowflake properties (no randomization beyond initial placement)
        snowflakes = []
        import random
        random.seed(42)  # FIXED seed for consistency
        for _ in range(density):
            snowflakes.append({
                "x": random.randint(0, self.width),
                "y": random.randint(-self.height, self.height),
                "size": random.choice([2, 3, 3, 4, 4, 5, 6]),  # Visible sizes
                "speed": random.uniform(speed * 0.6, speed * 1.2),
                "opacity": random.randint(180, 255),  # Bright and visible
                "drift": random.uniform(-0.5, 0.5),
            })

        frame_paths = []
        for frame_idx in range(num_frames):
            frame = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(frame)

            for flake in snowflakes:
                # Update position
                y = (flake["y"] + flake["speed"] * frame_idx) % (self.height + 50)
                x = flake["x"] + int(flake["drift"] * frame_idx)
                x = x % self.width

                # Draw snowflake
                size = flake["size"]
                draw.ellipse(
                    [x - size, y - size, x + size, y + size],
                    fill=(255, 255, 255, flake["opacity"]),
                )

            # Slight blur for softness
            frame = frame.filter(ImageFilter.GaussianBlur(radius=1))

            path = os.path.join(frames_dir, f"snow_{frame_idx:04d}.png")
            frame.save(path, "PNG")
            frame_paths.append(path)

        return frame_paths

    def generate_particles_overlay(
        self,
        particle_type: str = "glow",
        density: int = 50,
    ) -> str:
        """Generate static particle overlay (glow particles, fuzzy stars)."""
        output_path = os.path.join(BASE_DIR, "temp", f"particles_{particle_type}.png")
        
        img = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        for _ in range(density):
            x = random.randint(0, self.width)
            y = random.randint(0, self.height)
            
            if particle_type == "glow":
                size = random.randint(3, 12)
                opacity = random.randint(60, 180)
                color = random.choice([
                    (255, 255, 255, opacity),
                    (255, 200, 255, opacity),
                    (200, 220, 255, opacity),
                ])
                draw.ellipse(
                    [x - size, y - size, x + size, y + size],
                    fill=color,
                )
            elif particle_type == "stars":
                size = random.randint(1, 4)
                opacity = random.randint(100, 255)
                # Draw star shape (cross pattern)
                draw.line([(x - size, y), (x + size, y)], fill=(255, 255, 255, opacity), width=1)
                draw.line([(x, y - size), (x, y + size)], fill=(255, 255, 255, opacity), width=1)

        # Apply blur for glow effect
        if particle_type == "glow":
            img = img.filter(ImageFilter.GaussianBlur(radius=4))
        else:
            img = img.filter(ImageFilter.GaussianBlur(radius=1))

        img.save(output_path, "PNG")
        return output_path

    def generate_soft_blur_glow(self, base_image_path: str) -> str:
        """Generate soft blur glow overlay from base image."""
        output_path = os.path.join(BASE_DIR, "temp", "soft_glow.png")
        
        if os.path.exists(base_image_path):
            img = Image.open(base_image_path).convert("RGBA")
            img = img.resize((self.width, self.height), Image.LANCZOS)
        else:
            img = Image.new("RGBA", (self.width, self.height), (100, 50, 150, 30))

        # Heavy blur
        img = img.filter(ImageFilter.GaussianBlur(radius=50))
        
        # Reduce opacity
        r, g, b, a = img.split()
        a = a.point(lambda x: int(x * 0.3))
        img = Image.merge("RGBA", (r, g, b, a))

        img.save(output_path, "PNG")
        return output_path

    def generate_vhs_effect(self) -> str:
        """Generate VHS/retro effect overlay."""
        output_path = os.path.join(BASE_DIR, "temp", "vhs_effect.png")
        
        img = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        pixels = np.zeros((self.height, self.width, 4), dtype=np.uint8)

        # Scanlines
        for y in range(0, self.height, 3):
            pixels[y, :, 3] = 30  # Semi-transparent black lines

        # Random color aberration bands
        for _ in range(random.randint(2, 5)):
            y = random.randint(0, self.height - 10)
            height = random.randint(2, 8)
            pixels[y:y+height, :, 0] = random.randint(0, 50)  # R
            pixels[y:y+height, :, 2] = random.randint(0, 50)  # B
            pixels[y:y+height, :, 3] = random.randint(20, 60)

        img = Image.fromarray(pixels, "RGBA")
        img.save(output_path, "PNG")
        return output_path

    def generate_grain_effect(self, intensity: float = 0.3) -> str:
        """Generate film grain overlay."""
        output_path = os.path.join(BASE_DIR, "temp", "grain.png")
        
        # Generate noise
        noise = np.random.randint(0, 50, (self.height, self.width), dtype=np.uint8)
        alpha = (noise * intensity).astype(np.uint8)
        
        pixels = np.zeros((self.height, self.width, 4), dtype=np.uint8)
        pixels[:, :, 0] = noise
        pixels[:, :, 1] = noise
        pixels[:, :, 2] = noise
        pixels[:, :, 3] = alpha

        img = Image.fromarray(pixels, "RGBA")
        img.save(output_path, "PNG")
        return output_path

    def generate_chromatic_glow(self) -> str:
        """Generate chromatic aberration glow effect."""
        output_path = os.path.join(BASE_DIR, "temp", "chromatic_glow.png")
        
        img = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Create colored light leaks
        colors = [
            (255, 0, 100, 25),   # Pink
            (0, 150, 255, 20),   # Blue
            (255, 100, 0, 15),   # Orange
        ]

        for color in colors:
            x = random.randint(0, self.width)
            y = random.randint(0, self.height)
            rx = random.randint(300, 800)
            ry = random.randint(200, 600)
            draw.ellipse([x-rx, y-ry, x+rx, y+ry], fill=color)

        img = img.filter(ImageFilter.GaussianBlur(radius=100))
        img.save(output_path, "PNG")
        return output_path

    def generate_4k_enhancement(self, image_path: str) -> str:
        """Apply 4K enhancement look (sharpening + clarity)."""
        output_path = os.path.join(BASE_DIR, "temp", "enhanced.png")
        
        img = Image.open(image_path).convert("RGB")
        
        # Unsharp mask for clarity
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=100, threshold=2))
        
        # Slight contrast boost
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.05)
        
        img.save(output_path, quality=95)
        return output_path
