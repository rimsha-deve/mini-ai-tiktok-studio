============================================
  TikTok Mashup Studio - Client Guide
============================================

FIRST TIME SETUP (do this once):
---------------------------------
1. Install Python 3.11+   → https://python.org
   ⚠️  Check "Add Python to PATH" during install!

2. Install Node.js 18+    → https://nodejs.org

3. Install FFmpeg          → https://ffmpeg.org/download.html
   (Download "essentials build", extract, add to PATH)

4. Double-click: INSTALL.bat
   (Wait for it to finish — takes 2-5 minutes)


TO START THE APP:
-----------------
Double-click: START.bat
Then open your browser: http://localhost:5173


HOW TO USE:
-----------
1. Paste a YouTube URL
2. Upload your avatar image (PNG/JPG)
3. Click "Generate Video"
4. Wait for render to complete
5. Click "Play Video" to watch it


OUTPUT FILES:
-------------
All videos saved in: backend/exports/
Each video gets its own folder with:
  - tiktok_mashup.mp4  (final video with outro)
  - thumbnail.jpg
  - audio.mp3


REQUIREMENTS:
-------------
- Windows 10/11
- Internet connection (for YouTube)
- 4GB RAM minimum
- 2GB free disk space


SUPPORT:
--------
If you get errors, make sure:
- Internet is connected
- All 3 programs are installed (Python, Node.js, FFmpeg)
- Run INSTALL.bat again if needed
