"""
video_engine.py  —  TikTok Mashup Studio  v5.0  (WIDESCREEN 16:9)
==================================================================
CANVAS: 1920 x 1080

LAYOUT:
  AVATAR  : x=0, y=H-AV_H  (left, bottom-anchored)
  TEXT    : x=TX_X, y=TX_Y  (right half, vertically centered)
            font=Anton, color=#FFE000, stroke=black 18px, size=175px
  LOGO    : x=int(W*0.78), y=int(H*0.06)  (top-right)
            height=130px, cyan+pink+white TikTok note
  BG      : 3-color triad gradient from avatar dominant color
  SNOW    : 60 real 6-arm snowflakes, sizes 10-35px
"""

import os, math, random, shutil, asyncio, subprocess, colorsys
from io import BytesIO
from typing import Optional, List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR    = os.path.join(BASE_DIR, "assets", "fonts")
STICKERS_DIR = os.path.join(BASE_DIR, "assets", "stickers")
TEMP_DIR     = os.path.join(BASE_DIR, "temp")
EXPORTS_DIR  = os.path.join(BASE_DIR, "exports")

# ══════════════════════════════════════════════════════════════════════════════
# CANVAS CONSTANTS
# ══════════════════════════════════════════════════════════════════════════════
W, H   = 1920, 1080
FPS    = 30
CYCLE  = 30

# AVATAR — left, full height, top-anchored
AV_H   = H                       # 1080 px — full canvas height
AV_X   = -30                     # slight bleed left
AV_Y   = 0

# TEXT — PERMANENTLY FIXED: starts at x=960 (exact center), fills full right half
TX_X        = 960                # LOCKED — do not change
TEXT_MAX_W  = 920                # fills entire right half
FONT_SIZE   = 255                # larger — fills more vertical space
STROKE_W    = 18
TEXT_COLOR  = "#FFFFFF"
TEXT_ALIGN  = "left"

# LOGO — LOCKED: same line as "SI TE", left of it. Size user-adjustable.
LOGO_H      = 220                # slightly smaller to give more room for text
LOGO_FLOAT  = 6

# LOGO asset
LOGO_ASSET  = os.path.join(BASE_DIR, "assets", "stickers", "tiktok_sticker.png")

# SUBSCRIBE asset for outro
SUBSCRIBE_ASSET = os.path.join(BASE_DIR, "assets", "stickers", "Subscribe_logo.png")

# OUTRO — LOCKED: exactly 20 seconds, never changes
OUTRO_DURATION = 20

# SNOW
SNOW_N    = 60
SNOW_SEED = 42


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — COLOR EXTRACTION (ColorThief + colorsys triad)
# ══════════════════════════════════════════════════════════════════════════════

def get_gradient_colors(avatar_path: str) -> Tuple[Tuple,Tuple,Tuple]:
    """
    Extract avatar's most vibrant color, then build a 3-color triad gradient.
    Returns (color1, color2, color3) as RGB tuples.
    e.g. yellow jersey → (magenta, purple, deep violet)
    """
    try:
        from colorthief import ColorThief
        ct      = ColorThief(avatar_path)
        palette = ct.get_palette(color_count=8, quality=1)
    except Exception:
        palette = [(220, 50, 150)]

    def is_valid(r, g, b):
        brightness = (r + g + b) / 3
        if brightness > 210 or brightness < 30:
            return False
        if r > 170 and g > 120 and b < 140:   # skip skin tones
            return False
        return True

    valid = [c for c in palette if is_valid(*c)]
    if not valid:
        valid = [(220, 50, 150)]   # fallback magenta

    # Pick most saturated as KEY color
    def saturation(c):
        h, s, v = colorsys.rgb_to_hsv(c[0]/255, c[1]/255, c[2]/255)
        return s
    valid.sort(key=saturation, reverse=True)
    key = valid[0]

    h, s, v = colorsys.rgb_to_hsv(key[0]/255, key[1]/255, key[2]/255)

    # Color 1: complement (hue +0.55)
    h1 = (h + 0.55) % 1.0
    r1,g1,b1 = colorsys.hsv_to_rgb(h1, min(1.0, s*1.3), min(1.0, v*0.9))
    color1 = (int(r1*255), int(g1*255), int(b1*255))

    # Color 2: triadic (hue +0.80)
    h2 = (h + 0.80) % 1.0
    r2,g2,b2 = colorsys.hsv_to_rgb(h2, min(1.0, s*1.1), min(1.0, v*0.75))
    color2 = (int(r2*255), int(g2*255), int(b2*255))

    # Color 3: near-complement (hue +0.65)
    h3 = (h + 0.65) % 1.0
    r3,g3,b3 = colorsys.hsv_to_rgb(h3, min(1.0, s*0.9), min(1.0, v*0.6))
    color3 = (int(r3*255), int(g3*255), int(b3*255))

    return color1, color2, color3


def _hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"

def _from_hex(h: str) -> Tuple[int,int,int]:
    h = h.lstrip("#")
    return int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — 3-COLOR DIAGONAL GRADIENT BACKGROUND
# ══════════════════════════════════════════════════════════════════════════════

def build_background(c1: Tuple, c2: Tuple, c3: Tuple) -> Image.Image:
    """
    Draw a 3-color diagonal gradient:
      top-left = c1, center = c2, bottom-right = c3
    Uses step=2 for performance, then adds glow spots.
    Returns RGB PIL Image 1920×1080.
    """
    img  = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)

    for y in range(H):
        for x in range(0, W, 2):
            rx = x / W
            ry = y / H
            t  = (rx + ry) / 2   # diagonal blend 0→1

            if t < 0.5:
                ratio = t * 2
                r = int(c1[0]*(1-ratio) + c2[0]*ratio)
                g = int(c1[1]*(1-ratio) + c2[1]*ratio)
                b = int(c1[2]*(1-ratio) + c2[2]*ratio)
            else:
                ratio = (t - 0.5) * 2
                r = int(c2[0]*(1-ratio) + c3[0]*ratio)
                g = int(c2[1]*(1-ratio) + c3[1]*ratio)
                b = int(c2[2]*(1-ratio) + c3[2]*ratio)

            draw.line([(x, y), (min(x+1, W-1), y)], fill=(r, g, b))

    # Add cinematic glow spots
    ov   = Image.new("RGBA", (W, H), (0,0,0,0))
    gd   = ImageDraw.Draw(ov)
    spots = [
        (int(W*0.75), int(H*0.25), 420, c1, 70),
        (int(W*0.60), int(H*0.70), 340, c2, 55),
        (int(W*0.50), int(H*0.50), 260, c3, 40),
    ]
    for sx, sy, sr, sc, sa in spots:
        gd.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=(*sc, sa))
    ov  = ov.filter(ImageFilter.GaussianBlur(radius=100))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — AVATAR PROCESSOR
# ══════════════════════════════════════════════════════════════════════════════

def _remove_white_background(img: Image.Image, threshold: int = 230) -> Image.Image:
    """
    Manually remove white/near-white background using alpha masking.
    Works for cartoon/anime avatars and logos with plain white or light grey backgrounds.
    threshold: pixels brighter than this in all channels are made transparent.
    """
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.float32)
    R, G, B, A = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # Detect white/near-white pixels: all channels high AND close to each other
    is_white = (R > threshold) & (G > threshold) & (B > threshold)

    # Also detect light grey background (uniform color, not part of subject)
    is_grey  = (np.abs(R - G) < 20) & (np.abs(G - B) < 20) & (np.abs(R - B) < 20) & (R > 200)

    bg_mask = is_white | is_grey

    # Soft edge: semi-transparent for pixels near the threshold (anti-alias)
    near_edge = (R > threshold - 30) & (R <= threshold) & (G > threshold - 30) & (B > threshold - 30)
    data[:,:,3] = np.where(bg_mask, 0,
                  np.where(near_edge, ((255 - R) / 25 * 255).clip(0, 255), A))

    return Image.fromarray(data.astype(np.uint8), "RGBA")


def process_avatar(image_path: str) -> Image.Image:
    """rembg + enhance + resize to AV_H."""
    img = None
    bg_removed = False

    # Step 1: Try rembg with isnet-general-use model (best for cartoons/illustrations)
    try:
        from rembg import remove, new_session
        session = new_session("isnet-general-use")
        with open(image_path, "rb") as f:
            raw = f.read()
        result = remove(raw, session=session)
        img = Image.open(BytesIO(result)).convert("RGBA")

        alpha_arr = np.array(img.split()[3])
        if alpha_arr.min() < 128:
            bg_removed = True
            print(f"[AVATAR] isnet-general-use: background removed ({(alpha_arr < 128).sum()} transparent px)")
        else:
            print("[AVATAR] isnet-general-use returned fully opaque — trying u2net fallback")

    except Exception as e1:
        print(f"[AVATAR] isnet-general-use failed: {e1}")

    # Step 2: Fallback to default u2net model
    if not bg_removed:
        try:
            from rembg import remove
            with open(image_path, "rb") as f:
                raw = f.read()
            result = remove(raw)
            img = Image.open(BytesIO(result)).convert("RGBA")

            alpha_arr = np.array(img.split()[3])
            if alpha_arr.min() < 128:
                bg_removed = True
                print(f"[AVATAR] u2net: background removed ({(alpha_arr < 128).sum()} transparent px)")
            else:
                print("[AVATAR] u2net also returned opaque — using manual white bg removal")

        except Exception as e2:
            print(f"[AVATAR] u2net failed: {e2}")

    # Step 3: Manual white/light background removal (always works for plain bg images)
    if not bg_removed:
        if img is None:
            img = Image.open(image_path).convert("RGBA")
        img = _remove_white_background(img, threshold=230)
        print("[AVATAR] Manual white background removal applied")
    else:
        # Even after rembg, apply gentle cleanup for any leftover white fringe
        img = _remove_white_background(img, threshold=245)
        print("[AVATAR] Applied edge cleanup pass")

    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b))

    # Capture original pixel data before any enhancement
    rgb_arr_orig = np.array(rgb, dtype=np.float32)
    R, G, B = rgb_arr_orig[:,:,0], rgb_arr_orig[:,:,1], rgb_arr_orig[:,:,2]
    skin_mask = (R > 140) & (G > 90) & (B > 60) & (R > G) & (R > B) & ((R - B) > 30)

    # Enhance the full image moderately
    rgb = ImageEnhance.Color(rgb).enhance(1.3)       # moderate saturation
    rgb = ImageEnhance.Contrast(rgb).enhance(1.15)   # gentle contrast
    rgb = ImageEnhance.Brightness(rgb).enhance(1.05) # slight brightness
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

    # Restore skin pixels to original (no color burning on skin)
    enhanced_arr = np.array(rgb, dtype=np.float32)
    enhanced_arr[skin_mask] = rgb_arr_orig[skin_mask]  # revert skin to original

    rgb = Image.fromarray(enhanced_arr.astype(np.uint8), "RGB")
    r2, g2, b2 = rgb.split()
    img = Image.merge("RGBA", (r2, g2, b2, a))

    # Crop transparent padding — rembg leaves empty rows top/bottom/sides
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Scale to FULL canvas height (1080px) — fills entire screen
    scale = AV_H / img.height
    new_w = int(img.width * scale * 1.12)   # 12% wider for bigger presence
    return img.resize((new_w, AV_H), Image.LANCZOS)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — FONT LOADER
# ══════════════════════════════════════════════════════════════════════════════

def load_font(size: int, font_name: str = "Anton") -> ImageFont.FreeTypeFont:
    """
    Load font by name from assets/fonts or system fonts.
    Supported: Anton, Impact, Bebas Neue, Oswald, Righteous, Pacifico,
               Bangers, Black Ops One, Montserrat, Prohibition, Jumper, YWFT-Backs
    """
    # Map font names to filenames
    FONT_MAP = {
        "Anton":          ["Anton-Regular.ttf"],
        "Impact":         [r"C:\Windows\Fonts\impact.ttf", "impact.ttf"],
        "Bebas Neue":     ["BebasNeue-Regular.ttf", "BebasNeuePro-Regular.ttf"],
        "Oswald":         ["Oswald-Bold.ttf"],
        "Righteous":      ["Righteous-Regular.ttf"],
        "Pacifico":       ["Pacifico-Regular.ttf"],
        "Bangers":        ["Bangers-Regular.ttf"],
        "Black Ops One":  ["BlackOpsOne-Regular.ttf"],
        "Montserrat":     ["Montserrat-Bold.ttf"],
        "Prohibition":    ["Prohibition.ttf", "prohibition.ttf"],
        "Jumper":         ["Jumper.ttf", "jumper.ttf"],
        "YWFT Backs":     ["YWFT-Backs-Regular.ttf", "YWFTBacks-Regular.ttf"],
    }

    candidates = FONT_MAP.get(font_name, [f"{font_name}.ttf"])

    for fname in candidates:
        # Try assets/fonts first
        p = os.path.join(FONTS_DIR, fname)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
        # Try as absolute path (system fonts)
        if os.path.exists(fname):
            try:
                return ImageFont.truetype(fname, size)
            except Exception:
                continue

    # Fallback: Impact (always on Windows)
    impact = r"C:\Windows\Fonts\impact.ttf"
    if os.path.exists(impact):
        return ImageFont.truetype(impact, size)

    return ImageFont.load_default()


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — TEXT RENDERER
# ══════════════════════════════════════════════════════════════════════════════

def _stack_lines(text: str) -> List[str]:
    """Stack into 4 lines: 'SI TE SABES EL TIKTOK BAILAI' → 4 lines."""
    words = text.upper().strip().split()
    n = len(words)
    if n == 6:
        return [f"{words[0]} {words[1]}", f"{words[2]} {words[3]}", words[4], words[5]]
    lines, i = [], 0
    while i < n:
        if i + 1 < n:
            lines.append(f"{words[i]} {words[i+1]}")
            i += 2
        else:
            lines.append(words[i])
            i += 1
    return lines


def build_text_overlay(
    text: str,
    text_color_hex: str,
    font_name: str = "Anton",
    font_size_override: int = 0,
    text_x_override: int = 0,
    text_y_override: int = 0,
    logo_x_override: int = 0,
    logo_y_override: int = 0,
    text_align: str = "left",
) -> Tuple[Image.Image,int,int,int,int]:
    """
    PERMANENTLY FIXED:
    - TikTok logo on SAME LINE as 'SI TE' (left of it)
    - Text raised to top (6% from top) — no cutoff
    - Alignment: left / center / right
    """
    lines = _stack_lines(text)
    rgb   = _from_hex(text_color_hex)

    # Load TikTok logo
    logo_img = None
    logo_w   = 0
    if os.path.exists(LOGO_ASSET):
        try:
            raw_logo = Image.open(LOGO_ASSET).convert("RGBA")
            ratio    = LOGO_H / raw_logo.height
            logo_w   = int(raw_logo.width * ratio)
            logo_img = raw_logo.resize((logo_w, LOGO_H), Image.LANCZOS)
        except Exception:
            logo_img = None

    # Auto-fit font: logo + 4 lines must fit in 96% of H
    logo_space = (LOGO_H + 10) if logo_img else 0
    target_h   = int(H * 0.96)
    size = font_size_override if font_size_override > 0 else FONT_SIZE
    if font_size_override == 0:
        while size > 40:
            font      = load_font(size, font_name)
            gap       = int(size * 0.08)   # tighter gap = more room for bigger font
            line_dims = [(font.getbbox(ln)[2]-font.getbbox(ln)[0],
                          font.getbbox(ln)[3]-font.getbbox(ln)[1]) for ln in lines]
            block_h   = sum(h for _,h in line_dims) + gap*(len(lines)-1)
            total_h   = logo_space + block_h
            max_w     = max(w for w,_ in line_dims)
            if total_h <= target_h and max_w <= TEXT_MAX_W:
                break
            size -= 5

    font      = load_font(size, font_name)
    gap       = int(size * 0.08)   # tighter gap
    line_dims = [(font.getbbox(ln)[2]-font.getbbox(ln)[0],
                  font.getbbox(ln)[3]-font.getbbox(ln)[1]) for ln in lines]
    block_h   = sum(h for _,h in line_dims) + gap*(len(lines)-1)
    total_h   = logo_space + block_h

    block_x = text_x_override if text_x_override > 0 else TX_X
    # Vertically center logo+text block, apply user offset
    if text_y_override != 0:
        block_y = max(10, (H - total_h) // 2 + text_y_override)
    else:
        block_y = max(20, (H - total_h) // 2)

    def get_lx(line_w: int, is_first: bool) -> int:
        """All lines align to the SAME left edge regardless of logo."""
        # Logo is placed separately — text always starts at block_x
        # This ensures all 4 lines are perfectly left-aligned
        return block_x

    canvas = Image.new("RGBA", (W, H), (0,0,0,0))

    # Logo on SAME LINE as "SI TE" — to its LEFT, vertically centered with first line
    # All 4 text lines start at block_x (same left edge — perfect alignment)
    text_start_y = block_y

    # Glow pass
    glow = Image.new("RGBA", (W, H), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    cy   = text_start_y
    for i, ln in enumerate(lines):
        gd.text((block_x, cy), ln, font=font, fill=(*rgb, 130))
        cy += line_dims[i][1] + gap
    glow = glow.filter(ImageFilter.GaussianBlur(radius=16))
    canvas = Image.alpha_composite(canvas, glow)

    # Draw text — ALL 4 lines at same x = block_x
    cy = text_start_y
    for i, ln in enumerate(lines):
        lx = block_x

        # On first line: draw logo to the LEFT of "SI TE"
        if i == 0 and logo_img:
            # Logo vertically centered with first text line
            first_line_h = line_dims[0][1]
            logo_center_y = cy + (first_line_h - logo_img.height) // 2
            logo_draw_y = logo_y_override if logo_y_override > 0 else logo_center_y
            logo_draw_x = logo_x_override if logo_x_override > 0 else (block_x - logo_img.width - 15)
            # Ensure logo doesn't go off-screen left
            logo_draw_x = max(0, logo_draw_x)
            canvas.paste(logo_img, (logo_draw_x, logo_draw_y), logo_img)

        sh = Image.new("RGBA", (W, H), (0,0,0,0))
        sd = ImageDraw.Draw(sh)
        sd.text((lx+7, cy+7), ln, font=font, fill=(0,0,0,180))
        sh = sh.filter(ImageFilter.GaussianBlur(radius=4))
        canvas = Image.alpha_composite(canvas, sh)

        td = ImageDraw.Draw(canvas)
        td.text((lx, cy), ln, font=font,
                fill=(*rgb, 255),
                stroke_width=STROKE_W,
                stroke_fill=(0,0,0,255))
        cy += line_dims[i][1] + gap

    return canvas, block_x, text_start_y, max(w for w,_ in line_dims), block_h


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — TIKTOK LOGO (130px height, top-right)
# ══════════════════════════════════════════════════════════════════════════════

def load_tiktok_logo() -> Image.Image:
    """
    Load tiktok_sticker.png, resize to LOGO_H=130px height.
    If missing, generate proper TikTok note: white + cyan shadow + pink shadow.
    """
    if os.path.exists(LOGO_ASSET):
        img   = Image.open(LOGO_ASSET).convert("RGBA")
        ratio = LOGO_H / img.height
        return img.resize((int(img.width * ratio), LOGO_H), Image.LANCZOS)

    # Generate at 4× then downscale
    sz = LOGO_H * 4
    sc = sz / 400.0
    img = Image.new("RGBA", (sz, sz), (0,0,0,0))

    def draw_note(draw, ox, oy, color, alpha):
        r_out = int(90*sc); r_in = int(55*sc)
        cx = int(ox+120*sc); cy = int(oy+260*sc)
        draw.ellipse([cx-r_out,cy-r_out,cx+r_out,cy+r_out], fill=(*color,alpha))
        draw.ellipse([cx-r_in, cy-r_in, cx+r_in, cy+r_in],  fill=(0,0,0,0))
        sx = int(ox+200*sc); sw = int(40*sc)
        draw.rectangle([sx,int(oy+20*sc),sx+sw,int(oy+280*sc)], fill=(*color,alpha))
        draw.arc([sx-int(80*sc),int(oy+20*sc),sx+int(80*sc),int(oy+180*sc)],
                 start=270, end=30, fill=(*color,alpha), width=int(40*sc))

    d = ImageDraw.Draw(img)
    draw_note(d, -8*sc,  8*sc, (0,232,227), 220)   # cyan shadow
    draw_note(d,  8*sc, -8*sc, (255,0,80),  220)   # pink shadow
    draw_note(d,  0,     0,    (255,255,255),255)   # white main

    img = img.resize((int(LOGO_H * img.width/img.height), LOGO_H), Image.LANCZOS)
    os.makedirs(STICKERS_DIR, exist_ok=True)
    img.save(LOGO_ASSET, "PNG")
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — REAL SNOWFLAKE GENERATOR (6-arm shapes)
# ══════════════════════════════════════════════════════════════════════════════

def draw_snowflake(draw: ImageDraw.Draw, x: int, y: int, size: int,
                   color: Tuple = (255,255,255,200)):
    """Draw a real 6-arm snowflake with branch details."""
    for angle in range(0, 360, 60):
        rad = math.radians(angle)
        x2  = x + size * math.cos(rad)
        y2  = y + size * math.sin(rad)
        draw.line([(x, y), (x2, y2)], fill=color, width=2)

        # Small branches at 50% along each arm
        for branch_angle in [-30, 30]:
            brad = math.radians(angle + branch_angle)
            bx   = x + (size * 0.5) * math.cos(rad)
            by   = y + (size * 0.5) * math.sin(rad)
            bx2  = bx + (size * 0.3) * math.cos(brad)
            by2  = by + (size * 0.3) * math.sin(brad)
            draw.line([(bx, by), (bx2, by2)], fill=color, width=1)


def build_snowfall_cycle(n_frames: int = CYCLE) -> List[Image.Image]:
    """
    Real 6-arm snowflakes. Seamless loop. Visible from frame 0 — no delay.
    Flakes are spread evenly across the full canvas height at start.
    Fixed seed 42.
    """
    rng = random.Random(SNOW_SEED)
    flakes = []
    for i in range(SNOW_N):
        flakes.append({
            "x":     rng.randint(0, W),
            # Spread evenly across full height so ALL flakes visible immediately at frame 0
            "y":     int(i * H / SNOW_N),
            "size":  rng.randint(5, 15),
            "speed": rng.uniform(18, 35),
            "drift": rng.uniform(-1.0, 1.0),
            "alpha": rng.randint(160, 220),
        })

    # Make seamless: speed * n_frames must be a multiple of H
    for f in flakes:
        total  = f["speed"] * n_frames
        cycles = max(1, round(total / H))
        f["speed"] = (cycles * H) / n_frames

    frames = []
    for fi in range(n_frames):
        frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw  = ImageDraw.Draw(frame)
        for f in flakes:
            y = int((f["y"] + f["speed"] * fi) % H)
            x = int((f["x"] + f["drift"] * fi) % W)
            draw_snowflake(draw, x, y, f["size"], (255, 255, 255, f["alpha"]))
        frames.append(frame)
    return frames


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 8 — FRAME COMPOSITOR
# ══════════════════════════════════════════════════════════════════════════════

def composite_frame(
    background:   Image.Image,
    avatar:       Optional[Image.Image],
    text_overlay: Image.Image,
    snow:         Image.Image,
    logo:         Image.Image,
    frame_idx:    int,
    avatar_x_pos: int = -1,
    avatar_y_off: int = 0,
) -> Image.Image:
    # Layer order: background → snow → avatar → text
    # Snow is BEHIND both avatar and text
    frame = background.copy().convert("RGBA")

    # 1. Snow behind everything
    frame = Image.alpha_composite(frame, snow)

    # 2. Avatar on top of snow
    if avatar is not None:
        ax = avatar_x_pos if avatar_x_pos >= 0 else AV_X
        ay = AV_Y + avatar_y_off
        frame.paste(avatar, (ax, ay), avatar)

    # 3. Text on top of avatar
    frame = Image.alpha_composite(frame, text_overlay)
    return frame.convert("RGB")


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 9 — FFmpeg HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _run(cmd: list, timeout: int = 600) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)

def _get_duration(audio_path: str) -> float:
    r = _run(["ffprobe","-v","quiet","-show_entries","format=duration",
               "-of","default=noprint_wrappers=1:nokey=1", audio_path])
    try:
        return float(r.stdout.strip())
    except Exception:
        return 60.0


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 10 — MAIN RENDER PIPELINE
# ══════════════════════════════════════════════════════════════════════════════

async def render_video(
    audio_path:  str,
    avatar_path: Optional[str],
    output_path: str,
    text:        str  = "SI TE SABES EL TIKTOK BAILAI",
    text_color:  str  = "#FFFFFF",
    font_name:   str  = "Anton",
    font_size:   int  = 0,
    text_x:      int  = 0,
    text_y:      int  = 0,
    logo_x:      int  = 0,
    logo_y:      int  = 0,
    logo_size:   int  = 0,          # 0 = use LOGO_H default
    avatar_x:    int  = -1,
    avatar_y_offset: int = 0,
    avatar_scale:    float = 1.0,   # 0.5=smaller, 1.0=default, 1.5=bigger
    text_align:  str  = "left",
    quality:     str  = "high",
    progress_cb        = None,
    gradient_colors:   Optional[Tuple] = None,
) -> str:
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    frames_dir = os.path.join(TEMP_DIR, "veng_frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir)

    loop = asyncio.get_running_loop()

    async def prog(stage, pct, msg):
        if progress_cb:
            await progress_cb(stage, pct, msg)

    # ── 1. Color extraction ───────────────────────────────────────────────
    await prog("color", 5, "Extracting gradient colors from avatar...")
    if gradient_colors:
        c1, c2, c3 = gradient_colors
    elif avatar_path and os.path.exists(avatar_path):
        c1, c2, c3 = await loop.run_in_executor(None, get_gradient_colors, avatar_path)
    else:
        c1, c2, c3 = (220,50,150), (100,0,180), (50,0,100)

    await prog("color", 9, f"Gradient: {_hex(*c1)} → {_hex(*c2)} → {_hex(*c3)}")

    # ── 2. Background ─────────────────────────────────────────────────────
    await prog("background", 13, "Building 3-color gradient background...")
    background = await loop.run_in_executor(None, build_background, c1, c2, c3)

    # Save background so outro can reuse it (instead of black screen)
    outro_bg_path = os.path.join(TEMP_DIR, "outro_bg.png")
    background.save(outro_bg_path, "PNG")

    # ── 3. Avatar ─────────────────────────────────────────────────────────
    await prog("avatar", 20, "Processing avatar (rembg + enhance)...")
    avatar = None
    if avatar_path and os.path.exists(avatar_path):
        avatar = await loop.run_in_executor(None, process_avatar, avatar_path)
        # Apply user scale
        if avatar_scale != 1.0 and avatar is not None:
            new_w = int(avatar.width * avatar_scale)
            new_h = int(avatar.height * avatar_scale)
            avatar = avatar.resize((new_w, new_h), Image.LANCZOS)
        await prog("avatar", 32, f"Avatar: {avatar.size}, bottom={AV_Y+AV_H}={H} ✓")

    # ── 4. Text ───────────────────────────────────────────────────────────
    await prog("text", 36, f"Rendering text (color={text_color})...")
    # Apply logo size override by temporarily patching the module-level constant
    import sys as _sys
    _orig_logo_h = LOGO_H
    if logo_size > 0:
        _sys.modules[__name__].LOGO_H = logo_size

    text_overlay, bx, by, bw, bh = await loop.run_in_executor(
        None, build_text_overlay, text, text_color, font_name, font_size,
        text_x, text_y, logo_x, logo_y, text_align)

    # Restore LOGO_H
    _sys.modules[__name__].LOGO_H = _orig_logo_h
    await prog("text", 42, f"Text block: ({bx},{by}) {bw}×{bh}px")

    # ── 5. Snowfall ───────────────────────────────────────────────────────
    await prog("effects", 46, "Generating 6-arm snowflakes...")
    snow_frames = await loop.run_in_executor(None, build_snowfall_cycle)

    # ── 6. Logo ───────────────────────────────────────────────────────────
    await prog("sticker", 50, "Loading TikTok logo (130px)...")
    logo = await loop.run_in_executor(None, load_tiktok_logo)
    await prog("sticker", 53, f"Logo: {logo.size} (inline before text)")

    # ── 7. Composite frames ───────────────────────────────────────────────
    await prog("render", 56, f"Compositing {CYCLE} frames...")
    for fi in range(CYCLE):
        frame = composite_frame(background, avatar, text_overlay,
                                snow_frames[fi], logo, fi,
                                avatar_x_pos=avatar_x if avatar_x >= 0 else AV_X,
                                avatar_y_off=avatar_y_offset)
        frame.save(os.path.join(frames_dir, f"frame_{fi:04d}.jpg"), "JPEG", quality=94)
        if fi % 10 == 0:
            await prog("render", 56 + int(fi/CYCLE*20), f"Frame {fi+1}/{CYCLE}")

    # ── 8. Encode full main video ─────────────────────────────────────────
    await prog("encode", 78, "Encoding main video...")
    duration   = await loop.run_in_executor(None, _get_duration, audio_path)
    main_video = output_path.replace(".mp4", "_main.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS), "-stream_loop", "-1",
        "-i", os.path.join(frames_dir, "frame_%04d.jpg"),
        "-i", audio_path,
        "-t", str(duration),
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-pix_fmt", "yuv420p",
        "-g", "30", "-keyint_min", "30", "-sc_threshold", "0",  # fixed keyframes every 1s
        "-vsync", "cfr", "-r", str(FPS),                         # constant frame rate
        "-vf", f"scale={W}:{H}:flags=lanczos",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-shortest", "-movflags", "+faststart",
        main_video,
    ]
    result = await loop.run_in_executor(None, _run, cmd)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed:\n{result.stderr[:800]}")

    # ── 9. Build full timeline (subscribe breaks every 60s + outro last 20s)
    await prog("timeline", 85, "Building timeline: subscribe breaks + outro...")
    from app.services.timeline_service import build_full_timeline

    tl_ok = await loop.run_in_executor(
        None, build_full_timeline,
        main_video, audio_path, output_path, duration
    )
    if not tl_ok:
        print("[TIMELINE] Failed — using main video only")
        shutil.copy(main_video, output_path)

    try:
        os.remove(main_video)
    except Exception:
        pass

    # ── 10. Thumbnail ─────────────────────────────────────────────────────
    await prog("thumbnail", 96, "Generating thumbnail...")
    thumb = output_path.replace(".mp4", "_thumbnail.jpg")
    _run(["ffmpeg","-y","-i",output_path,"-ss","1","-vframes","1","-q:v","2",thumb])

    shutil.rmtree(frames_dir, ignore_errors=True)
    await prog("complete", 100, "Render complete!")
    return output_path


def _build_outro_frames(
    outro_text:  str = "Sígueme para ver más",
    outro_color: str = "#FFFFFF",
    outro_font:  str = "Anton",
    outro_align: str = "center",
    fps:         int = 30,
    duration:    float = 60.0,
) -> tuple:
    """
    Animated outro: logo + text slide UP from bottom, then hold.
    Slide-in: first 1.5 seconds (45 frames)
    Hold: remaining duration
    Returns path to frames directory.
    """
    frames_dir = os.path.join(TEMP_DIR, "outro_frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir)

    # Load Subscribe logo — remove background
    sub_logo = None
    if os.path.exists(SUBSCRIBE_ASSET):
        try:
            from rembg import remove
            with open(SUBSCRIBE_ASSET, "rb") as f:
                raw = f.read()
            from io import BytesIO as _BIO
            result   = remove(raw)
            sub_logo = Image.open(_BIO(result)).convert("RGBA")
        except Exception as e:
            print(f"[OUTRO] rembg: {e}")
            try:
                sub_logo = Image.open(SUBSCRIBE_ASSET).convert("RGBA")
            except Exception:
                sub_logo = None
        if sub_logo:
            ratio    = 500 / sub_logo.width
            sub_logo = sub_logo.resize((500, int(sub_logo.height * ratio)), Image.LANCZOS)

    # Font
    font_size = 160
    font      = load_font(font_size, outro_font)
    rgb       = _from_hex(outro_color)

    bb = font.getbbox(outro_text)
    tw = bb[2] - bb[0]
    th = bb[3] - bb[1]

    logo_h  = sub_logo.height if sub_logo else 0
    gap     = 60
    total_h = logo_h + (gap if sub_logo else 0) + th

    # Final resting Y position (centered)
    final_y = (H - total_h) // 2

    # Text X
    if outro_align == "left":
        tx = int(W * 0.1)
    elif outro_align == "right":
        tx = W - tw - int(W * 0.1)
    else:
        tx = (W - tw) // 2

    logo_x = (W - sub_logo.width) // 2 if sub_logo else 0

    # Animation: slide from bottom (start_y = H+50) to final_y in 1.5s
    slide_frames = int(fps * 1.5)   # 45 frames
    total_frames = int(fps * duration)

    def ease_out(t):
        """Ease-out cubic — fast start, slow stop."""
        return 1 - (1 - t) ** 3

    for fi in range(total_frames):
        img = Image.new("RGB", (W, H), (0, 0, 0))

        # Calculate Y offset
        if fi < slide_frames:
            t       = fi / slide_frames
            eased   = ease_out(t)
            start_y = H + 50                          # starts below screen
            current_y = int(start_y + (final_y - start_y) * eased)
        else:
            current_y = final_y                       # hold position

        # Draw logo
        if sub_logo:
            logo_y   = current_y
            img_rgba = img.convert("RGBA")
            img_rgba.paste(sub_logo, (logo_x, logo_y), sub_logo)
            img = img_rgba.convert("RGB")

        # Draw text
        text_y = current_y + logo_h + gap

        # Glow
        glow = Image.new("RGBA", (W, H), (0,0,0,0))
        gd   = ImageDraw.Draw(glow)
        gd.text((tx, text_y), outro_text, font=font, fill=(*rgb, 90))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=20))
        img  = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")

        draw = ImageDraw.Draw(img)
        draw.text((tx, text_y), outro_text, font=font,
                  fill=rgb, stroke_width=8, stroke_fill=(0, 0, 0))

        # Save frame (only save unique frames — hold frames are identical)
        if fi < slide_frames:
            frame_path = os.path.join(frames_dir, f"frame_{fi:05d}.jpg")
            img.save(frame_path, "JPEG", quality=90)
        elif fi == slide_frames:
            # Save the final hold frame once
            hold_path = os.path.join(frames_dir, f"frame_{fi:05d}.jpg")
            img.save(hold_path, "JPEG", quality=90)
            # Symlink/copy for remaining frames would be too slow
            # Instead we'll use FFmpeg's -loop on the hold frame

    # Save hold frame separately for FFmpeg loop
    hold_frame_path = os.path.join(frames_dir, f"frame_{slide_frames:05d}.jpg")

    return frames_dir, slide_frames, hold_frame_path, total_frames