"""
TikTok Mashup Studio - Quick Start Script
==========================================
This script helps you start both the backend and frontend servers.
Run this file to launch the application.

Prerequisites:
- Python 3.9+
- Node.js 18+
- FFmpeg installed and in PATH
"""

import os
import sys
import subprocess
import time
import webbrowser
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Resolve npm path (Windows often needs explicit path)
NPM_CMD = shutil.which("npm")
if not NPM_CMD:
    # Common fallback locations on Windows
    for candidate in [
        r"C:\Program Files\nodejs\npm.cmd",
        r"C:\Program Files (x86)\nodejs\npm.cmd",
        os.path.expandvars(r"%APPDATA%\npm\npm.cmd"),
    ]:
        if os.path.exists(candidate):
            NPM_CMD = candidate
            break

if not NPM_CMD:
    NPM_CMD = "npm"  # Last resort, hope PATH works with shell=True


def check_prerequisites():
    """Check if required tools are installed."""
    print("🔍 Checking prerequisites...\n")
    
    checks = {
        "Python": ("python", "--version"),
        "Node.js": ("node", "--version"),
        "npm": (NPM_CMD, "--version"),
        "FFmpeg": ("ffmpeg", "-version"),
    }
    
    all_good = True
    for name, cmd in checks.items():
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=10, shell=True
            )
            version = result.stdout.strip().split("\n")[0]
            if result.returncode == 0 and version:
                print(f"  ✅ {name}: {version}")
            else:
                print(f"  ❌ {name}: NOT FOUND")
                all_good = False
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            print(f"  ❌ {name}: NOT FOUND")
            all_good = False
    
    print()
    return all_good


def install_backend_deps():
    """Install Python backend dependencies."""
    print("📦 Installing backend dependencies...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        cwd=BACKEND_DIR,
    )
    print("  ✅ Backend dependencies installed\n")


def install_frontend_deps():
    """Install Node.js frontend dependencies."""
    print("📦 Installing frontend dependencies...")
    subprocess.run([NPM_CMD, "install"], cwd=FRONTEND_DIR, shell=True)
    print("  ✅ Frontend dependencies installed\n")


def start_backend():
    """Start the FastAPI backend server."""
    print("🚀 Starting backend server on http://127.0.0.1:8000...")
    return subprocess.Popen(
        [sys.executable, "run.py"],
        cwd=BACKEND_DIR,
    )


def start_frontend():
    """Start the Vite dev server."""
    print("🚀 Starting frontend on http://localhost:5173...")
    return subprocess.Popen(
        [NPM_CMD, "run", "dev"],
        cwd=FRONTEND_DIR,
        shell=True,
    )


def wait_for_backend(timeout=30):
    """Wait until backend is responding."""
    import urllib.request
    import urllib.error
    
    print("  ⏳ Waiting for backend to be ready...", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=2)
            if req.status == 200:
                print(" ✅")
                return True
        except (urllib.error.URLError, OSError, ConnectionRefusedError):
            pass
        time.sleep(1)
        print(".", end="", flush=True)
    
    print(" ❌ (timed out)")
    return False


def main():
    print("""
╔══════════════════════════════════════════════════╗
║         🎬 TikTok Mashup Studio v1.0            ║
║         AI Video Generator Desktop App          ║
╚══════════════════════════════════════════════════╝
    """)

    if not check_prerequisites():
        print("⚠️  Some prerequisites are missing. Please install them first.")
        print("   - Python: https://python.org")
        print("   - Node.js: https://nodejs.org")
        print("   - FFmpeg: https://ffmpeg.org/download.html")
        input("\nPress Enter to exit...")
        return

    # Install dependencies if needed
    if not os.path.exists(os.path.join(FRONTEND_DIR, "node_modules")):
        install_frontend_deps()

    # Check if backend deps are installed
    try:
        import fastapi
    except ImportError:
        install_backend_deps()

    # Start servers
    backend_proc = start_backend()
    
    # Wait for backend to actually be ready
    if not wait_for_backend(timeout=30):
        print("⚠️  Backend failed to start. Check for errors above.")
        print("   Try running manually: cd backend && python run.py")
        input("\nPress Enter to exit...")
        backend_proc.terminate()
        return
    
    frontend_proc = start_frontend()
    time.sleep(5)  # Wait for Vite to compile

    print("\n" + "=" * 50)
    print("✅ Application is running!")
    print("=" * 50)
    print(f"\n  🌐 Frontend: http://localhost:5173")
    print(f"  🔧 Backend:  http://127.0.0.1:8000")
    print(f"  📚 API Docs: http://127.0.0.1:8000/docs")
    print(f"\n  Press Ctrl+C to stop all servers.\n")

    # Open browser
    webbrowser.open("http://localhost:5173")

    try:
        # Keep running until interrupted
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("  ✅ All servers stopped. Goodbye!")


if __name__ == "__main__":
    main()

