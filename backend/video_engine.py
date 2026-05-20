"""
video_engine.py  —  TikTok Mashup Studio  v4.0  (VERTICAL 9:16)
================================================================
CANVAS: 1080 x 1920  (Width=1080, Height=1920)

HARDCODED LAYOUT:
  AVATAR  : x = int(1080*0.05) = 54
            new_height = int(1920*0.75) = 1440
            y = 1920 - 1440 = 480  (bottom-anchored)

  TEXT    : x = int(1080*0.55) = 594
            y = int(1920*0.40) = 768
            font = Anton.ttf / Impact.ttf
            stroke = black, 8px

  LOGO    : loaded from assets/stickers/tiktok_sticker.png
            width = 80px
            logo_x = text_x - 95 = 499
            logo_y = text_y + 12 = 780
            animation: sine-wave float on Y

  BG      : KMeans dominant color → high-saturation gradient
  SNOW    : 150 white particles, size 3-8px, alpha 190-255
"""

import os, math, random, shutil, asyncio, subprocess
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
# CANVAS — VERTICAL 9:16
# ══════════════════════════════════════════════════════════════════════════════
W, H   = 1080, 1920
FPS    = 30
CYCLE  = 30

# AVATAR — exact pixel math
AV_H   = int(H * 0.75)          # 1440 px
AV_X   = int(W * 0.05)          # 54   px  (left edge)
AV_Y   = H - AV_H               # 480  px  (top edge → bottom = 1920 ✓)

# TEXT — exact pixel math
TX_X   = int(W * 0.55)          # 594  px  (left edge of text block)
TX_Y   = int(H * 0.40)          # 768  px  (top edge of text block)
FONT_SIZE   = 110                # auto-reduced if lines overflow
STROKE_W    = 8                  # black stroke width

# LOGO — exact pixel math
LOGO_PX     = 80                 # width in pixels
LOGO_X      = TX_X - 95         # 499 px
LOGO_Y_BASE = TX_Y + 12         # 780 px  (before sine offset)
LOGO_FLOAT  = 10                 # sine-wave amplitude px

# SNOW
SNOW_N    = 150
SNOW_SEED = 42


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — KMeans COLOR EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════

def extract_dominant_color(image_path: str) -> Tuple[int, int, int]:
    """
    KMeans k=6 on opaque, vibrant pixels.
    Returns (R, G, B) of the most-frequent vivid cluster.
    Ignores near-grey, near-white, near-black pixels.
    """
    img  = Image.open(image_path).convert("RGBA")
    arr  = np.array(img, dtype=np.float32)

    opaque = arr[:, :, 3] > 128
    rgb    = arr[:, :, :3][opaque]

    if len(rgb) < 20:
        return (0, 180, 200)

    # Keep only vivid pixels
    sat    = np.max(rgb, axis=1) - np.min(rgb, axis=1)
    bright = rgb.mean(axis=1)
    keep   = (sat > 55) & (bright > 40) & (bright < 230)
    vivid  = rgb[keep]
    if len(vivid) < 20:
        vivid = rgb

    # KMeans k=6, 12 iterations
    k   = 6
    rng = np.random.default_rng(0)
    centers = vivid[rng.choice(len(vivid), k, replace=False)].copy()
    labels  = np.zeros(len(vivid), dtype=int)

    for _ in range(12):
        dists  = np.linalg.norm(vivid[:, None] - centers[None], axis=2)
        labels = np.argmin(dists, axis=1)
        new_c  = np.array([
            vivid[labels == i].mean(axis=0) if (labels == i).any() else centers[i]
            for i in range(k)
        ])
        if np.allclose(new_c, centers, atol=0.5):
            break
        centers = new_c

    counts = np.bincount(labels, minlength=k)
    best   = int(np.argmax(counts))
    return (int(centers[best][0]), int(centers[best][1]), int(centers[best][2]))


def _hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _from_hex(h: str) -> Tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _vivid(r: int, g: int, b: int) -> Tuple[int, int, int]:
    """Boost color to full saturation."""
    mx = max(r, g, b)
    if mx == 0:
        return (255, 255, 255)
    f = 255.0 / mx
    return (min(255, int(r * f)), min(255, int(g * f)), min(255, int(b * f)))


def _darken(r: int, g: int, b: int, factor: float = 0.35) -> Tuple[int, int, int]:
    """Darken a color by factor (0=black, 1=original)."""
    return (int(r * factor), int(g * factor), int(b * factor))


def decide_text_color(r: int, g: int, b: int) -> str:
    """
    Map dominant avatar color → text fill.
    High-saturation colors → STARK WHITE (#FFFFFF).
    Specific bright highlights → neon match.
    """
    # Yellow/Gold → vivid yellow
    if r > 155 and g > 115 and b < 115:
        return "#FFE600"
    # Red/Orange → vivid red
    if r > 155 and g < 115 and b < 115:
        return "#FF3C00"
    # Blue/Teal → white (max contrast on dark bg)
    if b > 120 and r < 130:
        return "#FFFFFF"
    # Green → white
    if g > 140 and r < 120:
        return "#FFFFFF"
    # Pink/Magenta → white
    if r > 145 and b > 105 and g < 115:
        return "#FFFFFF"
    # White/Light → white
    if r > 195 and g > 195 and b > 195:
        return "#FFFFFF"
    # Dark/Black → white
    if r < 65 and g < 65 and b < 65:
        return "#FFFFFF"
    # Default → vivid version of dominant color
    vr, vg, vb = _vivid(r, g, b)
    return _hex(vr, vg, vb)


def decide_background(r: int, g: int, b: int) -> Tuple[str, str]:
    """
    Map dominant avatar color → (gradient_top, gradient_bottom).
    Top = vivid version of dominant color.
    Bottom = deep dark shadow of same color.
    High-contrast, high-saturation. No pastels.
    """
    vr, vg, vb = _vivid(r, g, b)
    dr, dg, db = _darken(vr, vg, vb, 0.25)

    # Special cases for common jersey colors
    # Yellow/Gold → pink-magenta top, deep purple bottom
    if r > 155 and g > 115 and b < 115:
        return "#FF2EAA", "#4A0080"
    # Red → deep red top, near-black bottom
    if r > 155 and g < 115 and b < 115:
        return "#CC0000", "#1A0000"
    # Blue/Teal → vivid teal top, deep navy bottom
    if b > 120 and r < 130:
        return _hex(vr, vg, vb), "#000D1A"
    # Green → vivid green top, deep forest bottom
    if g > 140 and r < 120:
        return _hex(vr, vg, vb), "#001A00"
    # Pink → vivid pink top, deep purple bottom
    if r > 145 and b > 105 and g < 115:
        return "#FF2EAA", "#2D0040"
    # White/Light → purple top, dark bottom
    if r > 195 and g > 195 and b > 195:
        return "#8B2FC9", "#0D0020"
    # Dark/Black → pink top, dark bottom
    if r < 65 and g < 65 and b < 65:
        return "#FF2EAA", "#0D0020"
    # Generic → vivid top, dark shadow bottom
    return _hex(vr, vg, vb), _hex(dr, dg, db)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — BACKGROUND GENERATOR
# ══════════════════════════════════════════════════════════════════════════════

def build_background(c1_hex: str, c2_hex: str) -> Image.Image:
    """
    Vertical gradient c1 (top) → c2 (bottom) on 1080×1920 canvas.
    Adds two fixed soft glow spots for depth.
    Returns RGB PIL Image.
    """
    c1 = np.array(_from_hex(c1_hex), dtype=np.float32)
    c2 = np.array(_from_hex(c2_hex), dtype=np.float32)

    # Vertical gradient: t goes 0→1 top to bottom
    t = np.linspace(0, 1, H, dtype=np.float32)
    pixels = np.zeros((H, W, 3), dtype=np.uint8)
    for ch in range(3):
        col = (c1[ch] + (c2[ch] - c1[ch]) * t).astype(np.uint8)
        pixels[:, :, ch] = col[:, np.newaxis]

    img = Image.fromarray(pixels, "RGB")

    # Fixed glow spots
    ov   = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ov)
    spots = [
        (int(W * 0.75), int(H * 0.25), 320, _from_hex(c1_hex), 45),
        (int(W * 0.60), int(H * 0.65), 280, _from_hex(c1_hex), 30),
    ]
    for sx, sy, sr, sc, sa in spots:
        draw.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=(*sc, sa))
    ov  = ov.filter(ImageFilter.GaussianBlur(radius=80))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — AVATAR PROCESSOR
# ══════════════════════════════════════════════════════════════════════════════

def process_avatar(image_path: str) -> Image.Image:
    """
    1. rembg background removal
    2. Enhance: saturation×1.6, contrast×1.3, brightness×1.1, sharpen
    3. Resize: height = AV_H (1440px), keep aspect ratio
    Returns RGBA PIL Image.
    """
    try:
        from rembg import remove
        with open(image_path, "rb") as f:
            raw = f.read()
        result = remove(raw)
        img = Image.open(BytesIO(result)).convert("RGBA")
    except Exception:
        img = Image.open(image_path).convert("RGBA")

    # Enhance RGB channels only
    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b))
    rgb = ImageEnhance.Color(rgb).enhance(1.6)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.3)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.1)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
    r2, g2, b2 = rgb.split()
    img = Image.merge("RGBA", (r2, g2, b2, a))

    # Resize to AV_H keeping aspect ratio
    scale = AV_H / img.height
    new_w = int(img.width * scale)
    img   = img.resize((new_w, AV_H), Image.LANCZOS)
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — FONT LOADER
# ══════════════════════════════════════════════════════════════════════════════

def load_font(size: int) -> ImageFont.FreeTypeFont:
    """Anton.ttf → Impact.ttf → system fallback."""
    candidates = [
        os.path.join(FONTS_DIR, "Anton-Regular.ttf"),
        os.path.join(FONTS_DIR, "Anton.ttf"),
        r"C:\Windows\Fonts\impact.ttf",
        "impact.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — TEXT RENDERER
# ══════════════════════════════════════════════════════════════════════════════

def _stack_lines(text: str) -> List[str]:
    """
    Stack text into 4 lines.
    'SI TE SABES EL TIKTOK BAILAI' → ['SI TE','SABES EL','TIKTOK','BAILAI']
    For 6 words: pair first 4 into 2 lines, last 2 separate.
    """
    words = text.upper().strip().split()
    n = len(words)
    if n == 6:
        return [
            f"{words[0]} {words[1]}",
            f"{words[2]} {words[3]}",
            words[4],
            words[5],
        ]
    # Generic: pair consecutive words
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
) -> Tuple[Image.Image, int, int, int, int]:
    """
    Render stacked text on transparent RGBA canvas (W×H = 1080×1920).

    Position:
      Left edge  = TX_X = int(1080*0.55) = 594 px
      Top edge   = TX_Y = int(1920*0.40) = 768 px
      Each line center-aligned around TX_X + half_max_width

    Style:
      Font  = Anton / Impact
      Color = text_color_hex
      Stroke = black, STROKE_W=8 px
      Glow  = blurred copy behind text

    Returns:
      (canvas, block_left_x, block_top_y, block_width, block_height)
    """
    lines = _stack_lines(text)
    rgb   = _from_hex(text_color_hex)

    # Auto-fit font: reduce until widest line ≤ int(W*0.42) = 453 px
    max_line_w = int(W * 0.42)
    size = FONT_SIZE
    while size > 36:
        font = load_font(size)
        widths = [font.getbbox(ln)[2] - font.getbbox(ln)[0] for ln in lines]
        if max(widths) <= max_line_w:
            break
        size -= 4

    font      = load_font(size)
    gap       = int(size * 0.10)
    line_dims = []
    for ln in lines:
        bb = font.getbbox(ln)
        line_dims.append((bb[2] - bb[0], bb[3] - bb[1]))

    block_w = max(w for w, _ in line_dims)
    block_h = sum(h for _, h in line_dims) + gap * (len(lines) - 1)

    # Top-left of text block (TX_X, TX_Y)
    block_x = TX_X
    block_y = TX_Y

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Glow pass
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    cy   = block_y
    for i, ln in enumerate(lines):
        lw = line_dims[i][0]
        lx = block_x + (block_w - lw) // 2
        gd.text((lx, cy), ln, font=font, fill=(*rgb, 160))
        cy += line_dims[i][1] + gap
    glow = glow.filter(ImageFilter.GaussianBlur(radius=16))
    canvas = Image.alpha_composite(canvas, glow)

    # Main text — colored fill + black stroke 8px
    td = ImageDraw.Draw(canvas)
    cy = block_y
    for i, ln in enumerate(lines):
        lw = line_dims[i][0]
        lx = block_x + (block_w - lw) // 2
        td.text(
            (lx, cy), ln, font=font,
            fill=(*rgb, 255),
            stroke_width=STROKE_W,
            stroke_fill=(0, 0, 0, 255),
        )
        cy += line_dims[i][1] + gap

    return canvas, block_x, block_y, block_w, block_h


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — TIKTOK LOGO LOADER
# ══════════════════════════════════════════════════════════════════════════════

def load_tiktok_logo() -> Image.Image:
    """
    Load assets/stickers/tiktok_sticker.png (transparent PNG).
    Resize width to LOGO_PX (80px), keep aspect ratio.
    If file missing, generate the real TikTok note shape:
      white body + cyan offset + red offset.
    """
    # Try both filenames
    for fname in ["tiktok_sticker.png", "tiktok_logo.png"]:
        path = os.path.join(STICKERS_DIR, fname)
        if os.path.exists(path):
            img = Image.open(path).convert("RGBA")
            # Resize: width = LOGO_PX, keep aspect ratio
            ratio   = LOGO_PX / img.width
            new_h   = int(img.height * ratio)
            img     = img.resize((LOGO_PX, new_h), Image.LANCZOS)
            return img

    # Generate programmatically at 4× then downscale
    sz  = LOGO_PX * 4
    sc  = sz / 400.0
    img = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))

    def draw_note(draw: ImageDraw.Draw, ox: float, oy: float,
                  color: Tuple[int, int, int], alpha: int):
        r_out = int(90 * sc);  r_in = int(55 * sc)
        cx    = int(ox + 120 * sc);  cy = int(oy + 260 * sc)
        draw.ellipse([cx-r_out, cy-r_out, cx+r_out, cy+r_out], fill=(*color, alpha))
        draw.ellipse([cx-r_in,  cy-r_in,  cx+r_in,  cy+r_in],  fill=(0, 0, 0, 0))
        sx = int(ox + 200 * sc);  sw = int(40 * sc)
        draw.rectangle([sx, int(oy+20*sc), sx+sw, int(oy+280*sc)], fill=(*color, alpha))
        draw.arc(
            [sx-int(80*sc), int(oy+20*sc), sx+int(80*sc), int(oy+180*sc)],
            start=270, end=30, fill=(*color, alpha), width=int(40*sc),
        )

    d = ImageDraw.Draw(img)
    draw_note(d, -8*sc,  8*sc, (0,   232, 227), 220)
    draw_note(d,  8*sc, -8*sc, (255,   0,  80), 220)
    draw_note(d,  0,     0,    (255, 255, 255), 255)

    img = img.resize((LOGO_PX, LOGO_PX), Image.LANCZOS)
    os.makedirs(STICKERS_DIR, exist_ok=True)
    save_path = os.path.join(STICKERS_DIR, "tiktok_sticker.png")
    img.save(save_path, "PNG")
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — SNOWFALL GENERATOR
# ══════════════════════════════════════════════════════════════════════════════

def build_snowfall_cycle(n_frames: int = CYCLE) -> List[Image.Image]:
    """
    CYCLE frames of white snowfall particles.
    Fixed seed → identical every render.
    Size 3-8px, alpha 190-255 → high visibility on dark backgrounds.
    """
    rng = random.Random(SNOW_SEED)
    flakes = [
        {
            "x":     rng.randint(0, W),
            "y":     rng.randint(-H, H),
            "size":  rng.choice([3, 4, 4, 5, 5, 6, 7, 8]),
            "speed": rng.uniform(28, 58),
            "drift": rng.uniform(-0.8, 0.8),
            "alpha": rng.randint(190, 255),
        }
        for _ in range(SNOW_N)
    ]

    frames = []
    for fi in range(n_frames):
        frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw  = ImageDraw.Draw(frame)
        for f in flakes:
            y = int((f["y"] + f["speed"] * fi) % (H + 60))
            x = int((f["x"] + f["drift"] * fi) % W)
            s = f["size"]
            draw.ellipse([x-s, y-s, x+s, y+s], fill=(255, 255, 255, f["alpha"]))
        frame = frame.filter(ImageFilter.GaussianBlur(radius=0.6))
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
) -> Image.Image:
    """
    Layer order (bottom → top):
      1. Background  (RGB 1080×1920)
      2. Snowfall    (RGBA — behind avatar)
      3. Avatar      (RGBA)
           x = AV_X = int(1080*0.05) = 54
           y = AV_Y = 1920 - 1440    = 480  (bottom-anchored ✓)
      4. Text overlay (RGBA)
      5. TikTok logo  (RGBA)
           x = LOGO_X      = TX_X - 95 = 499
           y = LOGO_Y_BASE = TX_Y + 12 = 780  + sine-wave offset
    """
    frame = background.copy().convert("RGBA")

    # 2. Snowfall
    frame = Image.alpha_composite(frame, snow)

    # 3. Avatar — bottom-anchored at AV_X, AV_Y
    if avatar is not None:
        frame.paste(avatar, (AV_X, AV_Y), avatar)

    # 4. Text
    frame = Image.alpha_composite(frame, text_overlay)

    # 5. Logo — sine-wave float
    t      = frame_idx / CYCLE
    y_off  = int(LOGO_FLOAT * math.sin(2 * math.pi * t))
    logo_y = LOGO_Y_BASE + y_off
    frame.paste(logo, (LOGO_X, logo_y), logo)

    return frame.convert("RGB")


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 9 — FFmpeg HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _run(cmd: list, timeout: int = 600) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def _get_duration(audio_path: str) -> float:
    r = _run([
        "ffprobe", "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audio_path,
    ])
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
    text:        str = "SI TE SABES EL TIKTOK BAILAI",
    quality:     str = "high",
    progress_cb       = None,
) -> str:
    """
    Complete pipeline:
      1.  KMeans color extraction from avatar
      2.  Decide text color + background gradient
      3.  Build 1080×1920 background
      4.  Process avatar (rembg + enhance + resize to 1440px)
      5.  Build text overlay (stacked, colored, black stroke 8px)
      6.  Build snowfall cycle (CYCLE frames)
      7.  Load TikTok logo (80px wide)
      8.  Composite CYCLE frames → JPEG sequence
      9.  FFmpeg: loop frames + audio → MP4 (1080×1920)
      10. Generate thumbnail
    """
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    frames_dir = os.path.join(TEMP_DIR, "veng_frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir)

    loop = asyncio.get_running_loop()

    async def prog(stage: str, pct: float, msg: str):
        if progress_cb:
            await progress_cb(stage, pct, msg)

    # ── 1. Color extraction ───────────────────────────────────────────────
    await prog("color", 5, "Extracting dominant color from avatar...")
    if avatar_path and os.path.exists(avatar_path):
        dom_r, dom_g, dom_b = await loop.run_in_executor(
            None, extract_dominant_color, avatar_path)
    else:
        dom_r, dom_g, dom_b = 0, 180, 200      # default teal

    text_color_hex       = decide_text_color(dom_r, dom_g, dom_b)
    bg_top_hex, bg_bot_hex = decide_background(dom_r, dom_g, dom_b)

    await prog("color", 9,
        f"rgb({dom_r},{dom_g},{dom_b}) → text={text_color_hex}  "
        f"bg={bg_top_hex}→{bg_bot_hex}")

    # ── 2. Background ─────────────────────────────────────────────────────
    await prog("background", 13, "Building background gradient (1080×1920)...")
    background = await loop.run_in_executor(
        None, build_background, bg_top_hex, bg_bot_hex)

    # ── 3. Avatar ─────────────────────────────────────────────────────────
    await prog("avatar", 20, "Processing avatar (rembg + enhance)...")
    avatar = None
    if avatar_path and os.path.exists(avatar_path):
        avatar = await loop.run_in_executor(None, process_avatar, avatar_path)
        await prog("avatar", 32,
            f"Avatar: {avatar.size}  "
            f"anchored at x={AV_X}, y={AV_Y}  "
            f"(bottom={AV_Y + AV_H} = {H} ✓)")

    # ── 4. Text overlay ───────────────────────────────────────────────────
    await prog("text", 36, f"Rendering text (color={text_color_hex})...")
    text_overlay, bx, by, bw, bh = await loop.run_in_executor(
        None, build_text_overlay, text, text_color_hex)
    await prog("text", 42,
        f"Text block: ({bx},{by})  {bw}×{bh}px  "
        f"Logo snap: ({LOGO_X},{LOGO_Y_BASE})")

    # ── 5. Snowfall ───────────────────────────────────────────────────────
    await prog("effects", 46, "Generating snowfall cycle...")
    snow_frames = await loop.run_in_executor(None, build_snowfall_cycle)

    # ── 6. TikTok logo ────────────────────────────────────────────────────
    await prog("sticker", 50, "Loading TikTok logo (80px)...")
    logo = await loop.run_in_executor(None, load_tiktok_logo)
    await prog("sticker", 53, f"Logo loaded: {logo.size}  pos=({LOGO_X},{LOGO_Y_BASE})")

    # ── 7. Composite CYCLE frames ─────────────────────────────────────────
    await prog("render", 56, f"Compositing {CYCLE} frames (1080×1920)...")
    for fi in range(CYCLE):
        frame = composite_frame(
            background, avatar, text_overlay,
            snow_frames[fi], logo, fi,
        )
        frame.save(
            os.path.join(frames_dir, f"frame_{fi:04d}.jpg"),
            "JPEG", quality=94,
        )
        if fi % 10 == 0:
            await prog("render", 56 + int(fi / CYCLE * 20),
                       f"Frame {fi+1}/{CYCLE}")

    # ── 8. FFmpeg encode ──────────────────────────────────────────────────
    await prog("encode", 78, "Encoding MP4 (1080×1920)...")
    crf      = {"low":"28","medium":"23","high":"18","ultra":"15"}.get(quality,"18")
    duration = await loop.run_in_executor(None, _get_duration, audio_path)

    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-stream_loop", "-1",
        "-i", os.path.join(frames_dir, "frame_%04d.jpg"),
        "-i", audio_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-crf", crf,
        "-preset", "fast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        output_path,
    ]
    result = await loop.run_in_executor(None, _run, cmd)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg encode failed:\n{result.stderr[:800]}")

    # ── 9. Thumbnail ──────────────────────────────────────────────────────
    await prog("thumbnail", 96, "Generating thumbnail...")
    thumb = output_path.replace(".mp4", "_thumbnail.jpg")
    _run(["ffmpeg", "-y", "-i", output_path,
          "-ss", "1", "-vframes", "1", "-q:v", "2", thumb])

    shutil.rmtree(frames_dir, ignore_errors=True)
    await prog("complete", 100, "Render complete!")
    return output_path
