"""
Timeline Service
================
Handles automatic video interruptions:

1. SUBSCRIBE BREAK — every 60 seconds:
   - Subscribe_logo.png slides up from bottom
   - Holds for 15 seconds (centered, big)
   - Returns to main video

2. OUTRO — last 20 seconds:
   - Black screen
   - Subscribe_logo.png + "Sígueme para ver más" slides up
   - Holds until video ends

Both use the same slide-up animation (ease-out, 1.5s).
"""

import os
import math
import shutil
import subprocess
from typing import List, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STICKERS_DIR = os.path.join(BASE_DIR, "assets", "stickers")
TEMP_DIR     = os.path.join(BASE_DIR, "temp")

SUBSCRIBE_ASSET = os.path.join(STICKERS_DIR, "Subscribe_logo.png")

W, H   = 1920, 1080
FPS    = 30

# LOCKED TIMINGS — never change
SUBSCRIBE_BREAK_INTERVAL = 60   # every 60 seconds
SUBSCRIBE_BREAK_DURATION = 7    # 7 seconds total: 5s slide-up + 2s hold
OUTRO_DURATION           = 20   # last 20 seconds
SLIDE_DURATION           = 5.0  # slide animation = 5 seconds LOCKED


def _load_subscribe_logo(width: int = 600) -> Image.Image:
    """Load Subscribe_logo.png with background removed, scaled to width."""
    if not os.path.exists(SUBSCRIBE_ASSET):
        # Fallback: white rectangle with text
        img = Image.new("RGBA", (width, width//3), (255,255,255,200))
        return img

    try:
        from rembg import remove
        with open(SUBSCRIBE_ASSET, "rb") as f:
            raw = f.read()
        from io import BytesIO
        result = remove(raw)
        img = Image.open(BytesIO(result)).convert("RGBA")
    except Exception:
        img = Image.open(SUBSCRIBE_ASSET).convert("RGBA")

    ratio = width / img.width
    return img.resize((width, int(img.height * ratio)), Image.LANCZOS)


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    fonts_dir = os.path.join(BASE_DIR, "assets", "fonts")
    for p in [os.path.join(fonts_dir, "Anton-Regular.ttf"),
              os.path.join(fonts_dir, "Anton.ttf"),
              r"C:\Windows\Fonts\impact.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _ease_out(t: float) -> float:
    return 1 - (1 - t) ** 3


def _build_subscribe_break_frames(frames_dir: str) -> Tuple[int, str]:
    """
    Build frames for subscribe break (logo only, no text).
    Returns (slide_frame_count, hold_frame_path)
    """
    logo = _load_subscribe_logo(350)

    # Position: right side, vertically centered (next to TIKTOK text area)
    # Text block is centered vertically, TIKTOK is ~3rd line
    # Place logo at ~55% height on right side
    final_x = 960 - (logo.width // 2)   # centered at x=960 (text column)
    final_y = int(H * 0.52)              # ~55% down = next to TIKTOK line

    slide_frames = int(FPS * SLIDE_DURATION)

    for fi in range(slide_frames + 1):
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))  # TRANSPARENT — overlays on avatar

        if fi < slide_frames:
            t = fi / slide_frames
            eased = _ease_out(t)
            start_y = H + 50
            cur_y = int(start_y + (final_y - start_y) * eased)
        else:
            cur_y = final_y

        img.paste(logo, (final_x, cur_y), logo)

        frame_path = os.path.join(frames_dir, f"frame_{fi:05d}.png")  # PNG for transparency
        img.save(frame_path, "PNG")

    hold_path = os.path.join(frames_dir, f"frame_{slide_frames:05d}.png")
    return slide_frames, hold_path


def _build_outro_frames(frames_dir: str) -> Tuple[int, str]:
    """
    Build frames for outro (logo + text on black background).
    Returns (slide_frame_count, hold_frame_path)
    """
    logo = _load_subscribe_logo(500)
    font = _load_font(160)
    text = "Sígueme para ver más"
    rgb  = (255, 255, 255)

    bb   = font.getbbox(text)
    tw   = bb[2] - bb[0]
    th   = bb[3] - bb[1]

    logo_h  = logo.height
    gap     = 50
    total_h = logo_h + gap + th
    final_y = (H - total_h) // 2
    logo_x  = (W - logo.width) // 2
    text_x  = (W - tw) // 2

    slide_frames = int(FPS * SLIDE_DURATION)

    for fi in range(slide_frames + 1):
        img = Image.new("RGB", (W, H), (0, 0, 0))

        if fi < slide_frames:
            t = fi / slide_frames
            eased = _ease_out(t)
            start_y = H + 50
            cur_y = int(start_y + (final_y - start_y) * eased)
        else:
            cur_y = final_y

        # Draw logo
        img_rgba = img.convert("RGBA")
        img_rgba.paste(logo, (logo_x, cur_y), logo)
        img = img_rgba.convert("RGB")

        # Draw text
        text_y = cur_y + logo_h + gap
        glow = Image.new("RGBA", (W, H), (0,0,0,0))
        gd   = ImageDraw.Draw(glow)
        gd.text((text_x, text_y), text, font=font, fill=(255,255,255,80))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=20))
        img  = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")

        draw = ImageDraw.Draw(img)
        draw.text((text_x, text_y), text, font=font,
                  fill=rgb, stroke_width=8, stroke_fill=(0,0,0))

        frame_path = os.path.join(frames_dir, f"frame_{fi:05d}.jpg")
        img.save(frame_path, "JPEG", quality=92)

    hold_path = os.path.join(frames_dir, f"frame_{slide_frames:05d}.jpg")
    return slide_frames, hold_path


def _run(cmd: list, timeout: int = 300) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def _encode_subscribe_break(main_video: str, break_start: float,
                             output: str) -> bool:
    """
    Subscribe break: extract main video frames, composite logo on each frame
    using Pillow (no FFmpeg overlay filter — avoids black screen bug).
    Audio continues from main video.
    """
    frames_dir = os.path.join(TEMP_DIR, "sub_break_frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir)

    slide_frames, hold_path = _build_subscribe_break_frames(frames_dir)

    # Extract main video frames at break point
    main_frames_dir = os.path.join(TEMP_DIR, "sub_main_frames")
    if os.path.exists(main_frames_dir):
        shutil.rmtree(main_frames_dir)
    os.makedirs(main_frames_dir)

    r0 = _run([
        "ffmpeg", "-y", "-i", main_video,
        "-ss", str(break_start), "-t", str(SUBSCRIBE_BREAK_DURATION),
        "-vf", f"fps={FPS},scale={W}:{H}",
        os.path.join(main_frames_dir, "frame_%05d.jpg"),
    ])

    if r0.returncode != 0:
        # Fallback: just cut the segment unchanged
        shutil.rmtree(frames_dir, ignore_errors=True)
        shutil.rmtree(main_frames_dir, ignore_errors=True)
        r_cut = _run(["ffmpeg", "-y", "-i", main_video,
                      "-ss", str(break_start), "-t", str(SUBSCRIBE_BREAK_DURATION),
                      "-c", "copy", output])
        return r_cut.returncode == 0

    # Composite logo on each main frame using Pillow — WITH SNOW
    composite_dir = os.path.join(TEMP_DIR, "sub_composite_frames")
    if os.path.exists(composite_dir):
        shutil.rmtree(composite_dir)
    os.makedirs(composite_dir)

    main_files = sorted([f for f in os.listdir(main_frames_dir) if f.endswith('.jpg')])

    # Generate snow frames for this segment
    import sys as _sys
    _sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    try:
        import video_engine as _ve
        snow_frames = _ve.build_snowfall_cycle(300)  # FIX 1: was 30, now 300 for smooth seamless loop
    except Exception:
        snow_frames = None

    for fi, mf in enumerate(main_files):
        main_img = Image.open(os.path.join(main_frames_dir, mf)).convert("RGBA")

        # Add snow overlay (seamless loop)
        if snow_frames:
            snow = snow_frames[fi % len(snow_frames)]
            main_img = Image.alpha_composite(main_img, snow)

        # Add subscribe logo overlay
        overlay_idx = min(fi, slide_frames)
        overlay_path = os.path.join(frames_dir, f"frame_{overlay_idx:05d}.png")
        if os.path.exists(overlay_path):
            overlay = Image.open(overlay_path).convert("RGBA")
            result = Image.alpha_composite(main_img, overlay).convert("RGB")
        else:
            result = main_img.convert("RGB")

        result.save(os.path.join(composite_dir, f"frame_{fi:05d}.jpg"), "JPEG", quality=90)

    # Extract audio segment
    audio_seg = os.path.join(TEMP_DIR, "sub_audio_seg.aac")
    _run(["ffmpeg", "-y", "-i", main_video,
          "-ss", str(break_start), "-t", str(SUBSCRIBE_BREAK_DURATION),
          "-vn", "-c:a", "aac", "-b:a", "192k", audio_seg])

    # Encode composite frames + audio
    r_enc = _run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(composite_dir, "frame_%05d.jpg"),
        "-i", audio_seg,
        "-c:v", "libx264", "-crf", "16", "-preset", "fast",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy", "-shortest", output,
    ])

    for d in [frames_dir, main_frames_dir, composite_dir]:
        shutil.rmtree(d, ignore_errors=True)
    try: os.remove(audio_seg)
    except: pass

    return r_enc.returncode == 0


def build_full_timeline(
    main_video: str,
    audio_path: str,
    output_path: str,
    duration: float,
) -> bool:
    """
    Build the complete video with automatic interruptions:

    Timeline for a 6:16 (376s) video:
      0:00 - 1:00  → main video
      1:00 - 1:15  → subscribe break (logo slides up, 15s)
      1:15 - 2:00  → main video continues
      2:00 - 2:15  → subscribe break
      ...repeat every 60s...
      5:36 - 5:56  → main video (last segment)
      5:56 - 6:16  → OUTRO (logo + text, 20s)

    Strategy: use FFmpeg concat to assemble segments.
    """
    print(f"[TIMELINE] Building timeline for {duration:.1f}s video")

    # Calculate break points (every 60s, skip if too close to outro)
    outro_start   = duration - OUTRO_DURATION
    break_points  = []
    t = SUBSCRIBE_BREAK_INTERVAL
    while t < outro_start - SUBSCRIBE_BREAK_DURATION - 5:
        break_points.append(t)
        t += SUBSCRIBE_BREAK_INTERVAL

    print(f"[TIMELINE] Subscribe breaks at: {[f'{b:.0f}s' for b in break_points]}")
    print(f"[TIMELINE] Outro at: {outro_start:.1f}s")

    segments_dir = os.path.join(TEMP_DIR, "timeline_segments")
    if os.path.exists(segments_dir):
        shutil.rmtree(segments_dir)
    os.makedirs(segments_dir)

    segment_files = []
    current_pos   = 0.0
    seg_idx       = 0

    def cut_main(start: float, end: float, idx: int) -> str:
        """Cut a segment of the main video using fast copy."""
        out = os.path.join(segments_dir, f"seg_{idx:03d}_main.mp4")
        dur = end - start
        if dur <= 0:
            return None
        r = _run([
            "ffmpeg", "-y", "-i", main_video,
            "-ss", str(start), "-t", str(dur),
            "-c", "copy", out,
        ])
        return out if r.returncode == 0 else None

    # Build segments
    all_breaks = [(bp, "subscribe") for bp in break_points]
    all_breaks.append((outro_start, "outro"))
    all_breaks.sort()

    for break_time, break_type in all_breaks:
        # Main segment before this break
        if break_time > current_pos + 0.5:
            seg = cut_main(current_pos, break_time, seg_idx)
            if seg:
                segment_files.append(seg)
                seg_idx += 1

        if break_type == "subscribe":
            # Build subscribe break clip
            print(f"[TIMELINE] Building subscribe break at {break_time:.0f}s...")
            break_out = os.path.join(segments_dir, f"seg_{seg_idx:03d}_sub.mp4")
            ok = _encode_subscribe_break(main_video, break_time, break_out)
            if ok:
                segment_files.append(break_out)
                seg_idx += 1
            current_pos = break_time + SUBSCRIBE_BREAK_DURATION

        elif break_type == "outro":
            # Build outro clip
            print(f"[TIMELINE] Building outro at {break_time:.0f}s...")
            outro_out = os.path.join(segments_dir, f"seg_{seg_idx:03d}_outro.mp4")
            ok = _build_outro_clip(audio_path, break_time, duration, outro_out)
            if ok:
                segment_files.append(outro_out)
                seg_idx += 1
            current_pos = duration  # done

    print(f"[TIMELINE] {len(segment_files)} segments built")

    # Concat all segments
    concat_f = os.path.join(TEMP_DIR, "timeline_concat.txt")
    with open(concat_f, "w", encoding="ascii") as f:
        for sf in segment_files:
            abs_path = os.path.abspath(sf).replace("\\", "/")
            f.write(f"file '{abs_path}'\n")

    r = _run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", os.path.abspath(concat_f),
        "-c", "copy",
        "-movflags", "+faststart",
        output_path,
    ])

    shutil.rmtree(segments_dir, ignore_errors=True)

    if r.returncode == 0:
        final_size = os.path.getsize(output_path) / 1024 / 1024
        print(f"[TIMELINE] SUCCESS! Final: {final_size:.1f} MB")
        return True
    else:
        print(f"[TIMELINE] CONCAT ERROR: {r.stderr[:300]}")
        return False


def _build_outro_clip(audio_path: str, start: float,
                      end: float, output: str) -> bool:
    """Build the 20-second outro clip with slide-up animation + audio."""
    frames_dir = os.path.join(TEMP_DIR, "outro_frames_tl")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir)

    slide_frames, hold_path = _build_outro_frames(frames_dir)
    slide_dur = (slide_frames + 1) / FPS
    hold_dur  = max(1.0, (end - start) - slide_dur)

    # Extract audio segment for slide portion
    slide_audio = os.path.join(TEMP_DIR, "outro_slide_audio.aac")
    _run(["ffmpeg", "-y", "-i", audio_path,
          "-ss", str(start), "-t", str(slide_dur),
          "-vn", "-c:a", "aac", "-b:a", "320k", slide_audio])

    # Slide clip: frames + audio
    slide_out = os.path.join(TEMP_DIR, "outro_slide_tl.mp4")
    r1 = _run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frames_dir, "frame_%05d.jpg"),
        "-i", slide_audio,
        "-frames:v", str(slide_frames + 1),
        "-c:v", "libx264", "-crf", "16", "-preset", "fast",
        "-pix_fmt", "yuv420p", "-vf", f"scale={W}:{H}",
        "-c:a", "copy",
        "-shortest", slide_out,
    ])

    # Extract audio segment for hold portion
    hold_audio = os.path.join(TEMP_DIR, "outro_hold_audio.aac")
    _run(["ffmpeg", "-y", "-i", audio_path,
          "-ss", str(start + slide_dur), "-t", str(hold_dur),
          "-vn", "-c:a", "aac", "-b:a", "320k", hold_audio])

    # Hold clip: static frame + audio
    hold_out = os.path.join(TEMP_DIR, "outro_hold_tl.mp4")
    r2 = _run([
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(FPS), "-i", hold_path,
        "-i", hold_audio,
        "-c:v", "libx264", "-crf", "16", "-preset", "fast",
        "-pix_fmt", "yuv420p", "-vf", f"scale={W}:{H}",
        "-c:a", "copy",
        "-t", str(hold_dur),
        "-shortest", hold_out,
    ])

    if r1.returncode != 0 or r2.returncode != 0:
        print(f"[OUTRO ERROR] slide={r1.returncode} hold={r2.returncode}")
        print(f"[OUTRO] slide stderr: {r1.stderr[-200:]}")
        print(f"[OUTRO] hold stderr: {r2.stderr[-200:]}")
        shutil.rmtree(frames_dir, ignore_errors=True)
        return False

    # Merge slide + hold — FIX 2: removed bad -map flags that were dropping audio
    concat_f = os.path.join(TEMP_DIR, "outro_concat_tl.txt")
    with open(concat_f, "w", encoding="ascii") as f:
        f.write(f"file '{os.path.abspath(slide_out).replace(chr(92),'/')}'\n")
        f.write(f"file '{os.path.abspath(hold_out).replace(chr(92),'/')}'\n")

    r3 = _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
               "-i", os.path.abspath(concat_f),
               "-c", "copy", output])

    shutil.rmtree(frames_dir, ignore_errors=True)
    for f in [slide_audio, hold_audio, slide_out, hold_out, concat_f]:
        try: os.remove(f)
        except: pass

    if r3.returncode != 0:
        print(f"[OUTRO CONCAT ERROR] {r3.stderr[-200:]}")
        return False

    print(f"[OUTRO] Built: {os.path.getsize(output)//1024}KB")
    return True