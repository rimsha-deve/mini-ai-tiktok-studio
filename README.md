# 🎬 TikTok Mashup Studio

AI-powered desktop application for generating aesthetic TikTok mashup videos automatically.

## Features

- **YouTube Audio Extraction** - Paste URL, auto-extract audio at 1.18x speed
- **Smart Background System** - Auto-generated gradients, solid colors, or custom uploads
- **Avatar Processing** - Background removal, enhancement, sharpening
- **TikTok-Style Text** - Glow, shadow, stroke effects with dynamic color matching
- **Visual Effects** - Snowfall, particles, VHS, grain, chromatic glow
- **Animated Stickers** - Floating TikTok logo with smooth animation
- **Preset System** - Neon, Snow, Dark, Anime, Mashup, Glow presets
- **HD Export** - 1080p/4K MP4 with auto thumbnail generation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TailwindCSS, Framer Motion |
| Desktop | Electron |
| Backend | Python FastAPI |
| Video | FFmpeg, MoviePy |
| AI/Image | RemBG, OpenCV, Pillow |

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **FFmpeg** (must be in system PATH)

## Quick Start

```bash
# 1. Clone/download the project
# 2. Run the launcher:
python main.py
```

This will:
- Check prerequisites
- Install dependencies automatically
- Start backend (port 8000) and frontend (port 5173)
- Open the app in your browser

## Manual Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Electron (Desktop App)

```bash
cd frontend
npm run electron:dev
```

## Project Structure

```
KIRO_FIRST_Project/
├── main.py                    # Quick start launcher
├── backend/
│   ├── run.py                 # Backend entry point
│   ├── requirements.txt       # Python dependencies
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── api/
│   │   │   ├── routes.py     # REST API endpoints
│   │   │   └── websocket.py  # WebSocket progress updates
│   │   ├── services/
│   │   │   ├── youtube_service.py    # YouTube extraction
│   │   │   ├── audio_service.py      # Audio processing
│   │   │   ├── background_service.py # Background generation
│   │   │   ├── avatar_service.py     # Avatar processing
│   │   │   ├── text_service.py       # Text rendering
│   │   │   ├── effects_service.py    # Visual effects
│   │   │   ├── sticker_service.py    # Sticker animation
│   │   │   ├── video_renderer.py     # Video composition
│   │   │   └── preset_service.py     # Preset management
│   │   └── models/
│   │       └── schemas.py    # Pydantic models
│   ├── assets/               # Fonts, effects, stickers
│   ├── presets/              # Preset JSON files
│   ├── exports/              # Generated videos
│   └── temp/                 # Temporary processing files
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── electron/
│   │   └── main.js          # Electron main process
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Main application
│       ├── index.css         # TailwindCSS styles
│       ├── components/
│       │   ├── TitleBar.jsx
│       │   ├── InputSection.jsx
│       │   ├── PresetSection.jsx
│       │   ├── SettingsPanel.jsx
│       │   ├── GenerateSection.jsx
│       │   └── ProgressOverlay.jsx
│       └── utils/
│           └── api.js        # Backend API client
└── README.md
```

## How It Works

1. **User pastes YouTube URL** → yt-dlp extracts audio
2. **Audio is processed** → Speed adjusted to 1.18x, optional BG music mixed
3. **Background generated** → Auto aesthetic gradient or user choice
4. **Avatar processed** → Background removed, enhanced, sharpened
5. **Text rendered** → TikTok-style with glow/shadow/stroke
6. **Effects generated** → Snowfall, particles, overlays
7. **Video composed** → All layers composited frame-by-frame
8. **Encoded with FFmpeg** → Final MP4 with audio
9. **Thumbnail generated** → HD thumbnail from video frame

## API Documentation

Once the backend is running, visit: http://127.0.0.1:8000/docs

## Adding Custom Fonts

Place `.ttf` or `.otf` font files in `backend/assets/fonts/`

## Adding Custom Stickers

Place transparent PNG stickers in `backend/assets/stickers/`
Name the TikTok logo as `tiktok_logo.png`

## Configuration

All settings are configurable through the UI. Presets are stored as JSON in `backend/presets/`.

## Future Roadmap

- [ ] AI-generated captions/subtitles
- [ ] Beat sync detection
- [ ] Batch video generation
- [ ] Instagram Reels format
- [ ] Transition effects between scenes
- [ ] AI background generation
- [ ] Real-ESRGAN upscaling integration
