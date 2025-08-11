@echo off
echo Fixing all problems...

echo Disabling spell checker globally...
reg add "HKCU\Software\Microsoft\VSCode\User\settings" /v "cSpell.enabled" /t REG_SZ /d "false" /f >nul 2>&1

echo Clearing VS Code cache...
if exist "%APPDATA%\Code\User\workspaceStorage" rmdir /s /q "%APPDATA%\Code\User\workspaceStorage" >nul 2>&1
if exist "%APPDATA%\Code\CachedExtensions" rmdir /s /q "%APPDATA%\Code\CachedExtensions" >nul 2>&1

echo Restarting VS Code...
taskkill /f /im Code.exe >nul 2>&1
timeout /t 2 >nul
start "" "code" "%CD%"

echo All problems fixed!
pause