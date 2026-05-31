# TikTok Mashup Studio — Logic & Requirements File
# All rules are LOCKED. Update this file when adding new features.
# DO NOT change anything not listed here.

## CANVAS
- Resolution: 1920x1080 (16:9 widescreen)
- FPS: 30
- Format: MP4, H264, AAC 320k

## AVATAR
- Background removal: rembg (mandatory)
- Color enhancement: saturation×1.8, contrast×1.35, brightness×1.1
- Size: full canvas height (1080px), aspect ratio preserved
- Default X position: -30 (slight left bleed)
- Default Y position: 0 (top-anchored, fills full height)
- User adjustable: X (left/right slider), Y (up/down slider)
- Range X: -100 to 600px
- Range Y: -200 to 200px (offset from default)

## TEXT
- Font: Anton (fallback: Impact)
- Default size: 200px (auto-reduced to fit 4 lines in 90% of height)
- Default color: #FFFFFF (white)
- Stroke: black, 18px
- Default X: 960px (right half start) — LOCKED
- Default Y: vertically centered — LOCKED
- User adjustable: X (left/right), Y (up/down), font size, color, alignment
- Alignment: left (default), center, right
- Format: stacked 4 lines (SI TE / SABES EL / TIKTOK / BAILAI)

## TIKTOK LOGO
- Asset: assets/stickers/tiktok_sticker.png
- Position: ABOVE first text line "SI TE", left-aligned at text X
- Size: 200px height (user adjustable: 60-400px)
- Animation: sine-wave float (amplitude 6px)
- Position: FIXED relative to text block — moves with text
- User adjustable: size only (position always above SI TE)

## BACKGROUND
- Mode: auto gradient from avatar dominant color
- Algorithm: ColorThief KMeans → triad color scheme
- 3 color slots: Primary, Secondary, Accent
- User can override any slot with color picker or named presets
- Named presets: White, Black, Hot Pink, Magenta, Red, Orange, Yellow,
  Gold, Lime, Green, Teal, Cyan, Sky Blue, Neon Blue, Royal Blue,
  Indigo, Purple, Deep Violet, Lavender, Pink, Coral, Brown, Dark Navy, Dark Gray

## SNOWFALL
- Type: real 6-arm snowflakes (not dots)
- Count: 60 particles
- Size: 5-15px
- Speed: 18-35 px/frame (faster — clearly visible)
- Drift: ±1.0px per frame
- Opacity: 160-220
- Seed: 42 (fixed — consistent every render)
- START: frame 0 (from the very beginning of video)
- Loop: seamless 30-frame cycle (speed adjusted so frame 0 == frame 30)
- MUST appear in ALL segments including subscribe breaks
- MUST NOT stop or restart at any point in the video

## TIKTOK LOGO POSITION RULE (LOCKED)
- Logo is ALWAYS placed directly above the first text line "SI TE"
- Logo X = text block X (same left edge)
- Logo Y = text block Y - logo_height - 10px gap
- This is LOCKED and cannot be changed by position sliders
- Only SIZE is user-adjustable

## TIMELINE INTERRUPTIONS (LOCKED TIMINGS)
1. SUBSCRIBE BREAK:
   - Trigger: every 60 seconds of video
   - Duration: 7 seconds total (5s slide-up + 2s hold)
   - Content: Subscribe_logo.png (bg removed, 350px wide)
   - Position: x=960 (right side), y=52% height (next to TIKTOK text line)
   - Animation: slide up from bottom (5s ease-out) then hold
   - Background: transparent — overlaid ON the main video
   - Audio: CONTINUES from main video (no interruption)
   - Snow: CONTINUES during subscribe break (added to composite frames)

2. OUTRO (last 20 seconds):
   - Trigger: last 20 seconds of video (auto-detected)
   - Duration: 20 seconds EXACTLY (locked, never changes)
   - Content: Subscribe_logo.png (500px) + "Sígueme para ver más" (160px)
   - Animation: slide up from bottom (5s ease-out) then hold
   - Background: black
   - Audio: CONTINUES from main song (last 20s of audio plays) — NO SILENCE

## EXPORT
- Default quality: 4K (CRF 16, preset slow)
- Audio: AAC 320k, loudnorm normalized
- User selects: output folder (folder browser dialog)
- User types: custom filename (no random IDs)
- File saved as: [user_filename].mp4
- Thumbnail auto-generated: [user_filename]_thumbnail.jpg

## AUDIO PROCESSING
- Speed: 1.18x (default, user adjustable 0.5x-2.0x)
- Beat analysis: librosa, every 10 seconds
- Loudness normalization: EBU R128 (loudnorm filter)
- Dynamic compression: compand filter
- Background music volume: -20.8 dB (default)

## PRESETS
- Mashup, Neon, Snow, Dark, Anime, Glow
- Each preset configures: background colors, effects, text style

## FRONTEND RULES
- Generate button: always visible at bottom of left panel
- Live preview: updates in real-time when settings change
- Color swatches: 24 named colors for background slots
- Position controls: sliders for avatar X/Y, text X/Y, logo size
- Export modal: folder picker + filename input + Play + Open Folder buttons
