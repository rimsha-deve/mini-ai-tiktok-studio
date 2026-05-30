"""
Text Overlay Service - STRICT LOCKED TEMPLATE
- Font: Impact (bold, condensed — always available on Windows)
- Format: Stacked, one word per line, fills right half
- Color: Matches avatar dominant color (yellow shirt = yellow text)
- Stroke: Black 6px
- TikTok logo: inline at top-left of text block
"""

import os
from typing import Optional, Tuple, List
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONTS_DIR = os.path.join(BASE_DIR, "assets", "fonts")
STICKERS_DIR = os.path.join(BASE_DIR, "assets", "stickers")


class TextService:

    def render_text_overlay(
        self,
        text: str = "SI TE SABES EL TIKTOK BAILAI",
        font_name: str = "Anton",
        font_size: int = 150,
        color: Optional[str] = None,
        position: str = "right",
        glow: bool = True,
        glow_color: Optional[str] = None,
        shadow: bool = True,
        stroke: bool = True,
        stroke_width: int = 6,
        opacity: float = 1.0,
        canvas_size: Tuple[int, int] = (1920, 1080),
        avatar_colors: Optional[List[str]] = None,
        bg_colors: Optional[List[str]] = None,
    ) -> str:
        output_path = os.path.join(BASE_DIR, "temp", "text_overlay.png")
        width, height = canvas_size

        # LOCKED: Text color matches avatar dominant color
        text_color = self._pick_text_color(avatar_colors)

        # LOCKED: Font is Impact (always on Windows), fallback Anton
        font = self._load_font(font_size)

        # LOCKED: Stack text — one word per line
        lines = text.upper().strip().split()

        # Measure each line
        line_sizes = []
        for line in lines:
            bbox = font.getbbox(line)
            line_sizes.append((bbox[2] - bbox[0], bbox[3] - bbox[1]))

        # LOCKED: Tight line spacing
        line_gap = int(font_size * 0.08)
        total_text_height = sum(h for _, h in line_sizes) + line_gap * (len(lines) - 1)
        max_line_width = max(w for w, _ in line_sizes)

        # LOCKED POSITION: Right half (50%-95%), vertically centered
        text_area_left = int(width * 0.50)
        text_area_right = int(width * 0.95)
        text_area_width = text_area_right - text_area_left
        text_area_center = text_area_left + text_area_width // 2

        # Load TikTok logo to place above first line
        logo_img = self._load_tiktok_logo(int(font_size * 0.7))
        logo_h = logo_img.height if logo_img else 0
        logo_gap = int(font_size * 0.15)

        # Total block height = logo + gap + text
        total_block_height = logo_h + logo_gap + total_text_height
        block_y_start = (height - total_block_height) // 2

        # Create canvas
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))

        # --- Draw TikTok logo above first line ---
        if logo_img:
            logo_x = text_area_center - logo_img.width // 2
            logo_y = block_y_start
            canvas.paste(logo_img, (logo_x, logo_y), logo_img)

        # --- Draw text lines ---
        rgb = self._hex_to_rgb(text_color)
        current_y = block_y_start + logo_h + logo_gap

        # Glow layer first
        if glow:
            glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            glow_draw = ImageDraw.Draw(glow_layer)
            cy = current_y
            for i, line in enumerate(lines):
                lw, lh = line_sizes[i]
                lx = text_area_center - lw // 2
                glow_draw.text((lx, cy), line, font=font, fill=(*rgb, 160))
                cy += lh + line_gap
            glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=12))
            canvas = Image.alpha_composite(canvas, glow_layer)

        # Main text layer
        text_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(text_layer)
        cy = current_y
        for i, line in enumerate(lines):
            lw, lh = line_sizes[i]
            lx = text_area_center - lw // 2
            # Black stroke
            draw.text(
                (lx, cy), line, font=font,
                fill=(*rgb, 255),
                stroke_width=stroke_width,
                stroke_fill=(0, 0, 0, 255),
            )
            cy += lh + line_gap

        canvas = Image.alpha_composite(canvas, text_layer)
        canvas.save(output_path, "PNG")
        return output_path

    def _pick_text_color(self, avatar_colors: Optional[List[str]]) -> str:
        """
        Pick text color that MATCHES the avatar's dominant color.
        Yellow shirt → yellow text. Red → red. White → white. Etc.
        """
        if not avatar_colors:
            return "#ffe600"  # Default yellow

        r, g, b = self._hex_to_rgb(avatar_colors[0])

        # Yellow / Gold
        if r > 160 and g > 130 and b < 100:
            return "#ffe600"
        # Red / Orange
        elif r > 160 and g < 100 and b < 100:
            return "#ff3c00"
        # Blue
        elif b > 140 and r < 100:
            return "#00cfff"
        # Green
        elif g > 140 and r < 100:
            return "#00ff88"
        # Pink / Magenta
        elif r > 160 and b > 100 and g < 100:
            return "#ff2eaa"
        # White / Light
        elif r > 200 and g > 200 and b > 200:
            return "#ffffff"
        # Dark / Black
        elif r < 60 and g < 60 and b < 60:
            return "#ffffff"
        else:
            # Boost the dominant channel to vivid
            max_c = max(r, g, b)
            factor = 255 / max(max_c, 1)
            vr = min(255, int(r * factor))
            vg = min(255, int(g * factor))
            vb = min(255, int(b * factor))
            return f"#{vr:02x}{vg:02x}{vb:02x}"

    def _load_tiktok_logo(self, size: int) -> Optional[Image.Image]:
        """Load the real TikTok logo from assets."""
        logo_path = os.path.join(STICKERS_DIR, "tiktok_logo.png")
        if os.path.exists(logo_path):
            img = Image.open(logo_path).convert("RGBA")
            img = img.resize((size, size), Image.LANCZOS)
            return img
        return None

    def _load_font(self, size: int) -> ImageFont.FreeTypeFont:
        """Load Impact font (always on Windows). Fallback: Anton."""
        # Try Anton from assets first
        for fname in ["Anton-Regular.ttf", "Anton.ttf"]:
            p = os.path.join(FONTS_DIR, fname)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)

        # Impact — always on Windows
        impact_path = r"C:\Windows\Fonts\impact.ttf"
        if os.path.exists(impact_path):
            return ImageFont.truetype(impact_path, size)

        try:
            return ImageFont.truetype("impact.ttf", size)
        except (OSError, IOError):
            return ImageFont.load_default()

    @staticmethod
    def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def get_available_fonts(self) -> List[str]:
        return ["Anton", "Impact"]
