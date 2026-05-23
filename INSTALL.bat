@echo off
title TikTok Mashup Studio - Setup
color 0A
echo.
echo  ============================================
echo   TikTok Mashup Studio - First Time Setup
echo  ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found!
    echo  Please install Python 3.11+ from: https://python.org
    echo  Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)
echo  [OK] Python found

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found!
    echo  Please install Node.js 18+ from: https://nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js found

:: Check FFmpeg
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] FFmpeg not found!
    echo  Please install FFmpeg from: https://ffmpeg.org/download.html
    echo  Then add it to your system PATH.
    pause
    exit /b 1
)
echo  [OK] FFmpeg found

echo.
echo  Installing Python dependencies...
cd backend
pip install -r requirements.txt --quiet
pip install rembg onnxruntime colorthief --quiet
cd ..
echo  [OK] Python packages installed

echo.
echo  Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..
echo  [OK] Frontend packages installed

echo.
echo  ============================================
echo   Setup Complete! Run START.bat to launch.
echo  ============================================
echo.
pause
