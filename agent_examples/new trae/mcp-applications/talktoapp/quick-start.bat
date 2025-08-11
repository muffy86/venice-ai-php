@echo off
REM TalkToApp Quick Start - Fixes terminal path issues
title TalkToApp Enhanced - Quick Start

echo.
echo ================================================================
echo                    TalkToApp Enhanced
echo              Quick Start Development Server
echo ================================================================
echo.

REM Change to script directory (handles spaces correctly)
pushd "%~dp0"

echo Working directory: %CD%
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python from python.org
    pause
    exit /b 1
)

echo [OK] Python is available
echo.

REM Find available port
set PORT=8080
:checkport
netstat -an | find ":%PORT%" >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Port %PORT% in use, trying next...
    set /a PORT+=1
    if %PORT% GTR 9000 (
        echo [ERROR] No available ports found
        pause
        exit /b 1
    )
    goto checkport
)

echo [SUCCESS] Using port %PORT%
echo [INFO] Starting server at http://localhost:%PORT%
echo [INFO] Opening browser in 2 seconds...
echo [INFO] Press Ctrl+C to stop server
echo.

REM Open browser
timeout /t 2 /nobreak >nul
start http://localhost:%PORT%

REM Start server
python -m http.server %PORT%

popd
pause