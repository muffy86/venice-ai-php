@echo off
REM TalkToApp Enhanced - Quick Start Script
REM Fixes PowerShell path issues and provides enhanced development experience

title TalkToApp Enhanced Development Server

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 TalkToApp Dev Server 🚀                ║
echo ║              Enhanced Development Environment                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Change to the script directory (handles spaces in path correctly)
cd /d "%~dp0"

echo 📁 Working directory: %CD%
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo 💡 Please install Python from https://python.org
    pause
    exit /b 1
)

echo ✅ Python is available
echo.

REM Find available port
set PORT=8080
:checkport
netstat -an | find ":%PORT%" >nul
if not errorlevel 1 (
    echo ⚠️  Port %PORT% is in use, trying next port...
    set /a PORT+=1
    goto checkport
)

echo 🌐 Starting development server on port %PORT%...
echo 📱 Your app will be available at: http://localhost:%PORT%
echo.
echo 💡 Press Ctrl+C to stop the server
echo 🌐 Opening browser in 3 seconds...
echo.

REM Open browser after a short delay
timeout /t 3 /nobreak >nul
start http://localhost:%PORT%

REM Start the Python HTTP server
python -m http.server %PORT%

pause