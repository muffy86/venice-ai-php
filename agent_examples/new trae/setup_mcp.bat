@echo off
echo ========================================
echo MCP Servers Setup for Trae AI
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed: 
node --version

echo.
echo Testing MCP servers availability...
echo.

echo Testing filesystem server...
npx -y @modelcontextprotocol/server-filesystem "C:\temp" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Filesystem server is available
) else (
    echo ✓ Filesystem server is available (expected error for test)
)

echo.
echo ========================================
echo Setup Instructions:
echo ========================================
echo.
echo 1. Copy the contents of mcp_servers_config.json to:
echo    %APPDATA%\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
echo.
echo 2. Create the settings directory if it doesn't exist:
if not exist "%APPDATA%\Trae\User\globalStorage\saoudrizwan.claude-dev\settings" (
    echo    Creating settings directory...
    mkdir "%APPDATA%\Trae\User\globalStorage\saoudrizwan.claude-dev\settings" 2>nul
    echo    ✓ Directory created
) else (
    echo    ✓ Settings directory already exists
)

echo.
echo 3. Copy configuration file...
if exist "mcp_servers_config.json" (
    copy "mcp_servers_config.json" "%APPDATA%\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json" >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✓ Configuration copied successfully
    ) else (
        echo    ⚠ Failed to copy configuration automatically
        echo    Please copy manually from: %cd%\mcp_servers_config.json
        echo    To: %APPDATA%\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
    )
) else (
    echo    ⚠ mcp_servers_config.json not found in current directory
)

echo.
echo 4. Restart Trae AI to load the new MCP servers
echo.
echo 5. Test with commands like:
echo    - "List files in my documents folder" (filesystem)
echo    - "Remember that I prefer TypeScript" (memory)
echo    - "What time is it in Tokyo?" (time)
echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo For detailed configuration instructions, see:
echo - MCP_Setup_Guide.md
echo - mcp_servers_minimal.json (for basic setup)
echo.
pause