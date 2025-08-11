# MCP Servers Setup Script
# This script helps configure MCP servers for Trae AI

Write-Host "🚀 MCP Servers Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install it from https://nodejs.org/" -ForegroundColor Red
    Write-Host "After installing Node.js, run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
Write-Host "`n📦 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = & npm --version
    Write-Host "✅ npm is available: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    exit 1
}

# Define the Trae settings path
$traeSettingsPath = "$env:APPDATA\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"
$configSourcePath = ".\mcp_servers_config.json"

Write-Host "`n📁 Trae settings path: $traeSettingsPath" -ForegroundColor Cyan

# Check if the source config file exists
if (-not (Test-Path $configSourcePath)) {
    Write-Host "❌ Configuration file not found: $configSourcePath" -ForegroundColor Red
    Write-Host "Please ensure mcp_servers_config.json is in the current directory." -ForegroundColor Yellow
    exit 1
}

# Create the settings directory if it doesn't exist
$settingsDir = Split-Path $traeSettingsPath -Parent
if (-not (Test-Path $settingsDir)) {
    Write-Host "`n📁 Creating settings directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
    Write-Host "✅ Settings directory created" -ForegroundColor Green
}

# Copy the configuration file
Write-Host "`n📋 Copying MCP configuration..." -ForegroundColor Yellow
try {
    Copy-Item $configSourcePath $traeSettingsPath -Force
    Write-Host "✅ Configuration copied successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to copy configuration: $_" -ForegroundColor Red
    Write-Host "You may need to manually copy the configuration." -ForegroundColor Yellow
}

# Test some basic MCP servers
Write-Host "`n🧪 Testing basic MCP servers..." -ForegroundColor Yellow

$basicServers = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-fetch",
    "@modelcontextprotocol/server-memory"
)

foreach ($server in $basicServers) {
    Write-Host "Testing $server..." -ForegroundColor Cyan
    try {
        # Test if the server can be installed/accessed
        $result = & npx -y $server --help 2>$null
        Write-Host "✅ $server is accessible" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $server may need additional setup" -ForegroundColor Yellow
    }
}

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure API keys in the settings file for servers that require them" -ForegroundColor White
Write-Host "2. Restart Trae AI to load the new MCP servers" -ForegroundColor White
Write-Host "3. Test the servers by asking the AI to use specific capabilities" -ForegroundColor White
Write-Host "4. Check the MCP_Setup_Guide.md for detailed configuration instructions" -ForegroundColor White

Write-Host "`n🎉 Setup script completed!" -ForegroundColor Green
Write-Host "Check the MCP_Setup_Guide.md file for detailed configuration instructions." -ForegroundColor Cyan

# Prompt to open the settings file
$openSettings = Read-Host "`nWould you like to open the MCP settings file for editing? (y/n)"
if ($openSettings -eq 'y' -or $openSettings -eq 'Y') {
    if (Test-Path $traeSettingsPath) {
        Start-Process notepad $traeSettingsPath
    } else {
        Write-Host "Settings file not found. Please check the path manually." -ForegroundColor Yellow
    }
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")