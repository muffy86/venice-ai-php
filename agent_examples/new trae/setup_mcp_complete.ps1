# MCP Servers Complete Setup Script for Trae AI
param(
    [switch]$UseMinimal
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MCP Servers Complete Setup for Trae AI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$traeSettingsDir = "$env:APPDATA\Trae\User\globalStorage\saoudrizwan.claude-dev\settings"
$configFile = if ($UseMinimal) { "mcp_servers_minimal.json" } else { "mcp_servers_config.json" }
$targetFile = "$traeSettingsDir\cline_mcp_settings.json"

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check source file
if (-not (Test-Path $configFile)) {
    Write-Host "✗ Configuration file '$configFile' not found" -ForegroundColor Red
    exit 1
}

# Create settings directory
if (-not (Test-Path $traeSettingsDir)) {
    Write-Host "Creating Trae settings directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $traeSettingsDir -Force | Out-Null
    Write-Host "✓ Settings directory created" -ForegroundColor Green
}

# Backup existing config
if (Test-Path $targetFile) {
    $backupFile = "$targetFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $targetFile $backupFile
    Write-Host "✓ Existing config backed up" -ForegroundColor Green
}

# Copy configuration
Write-Host "Copying MCP configuration..." -ForegroundColor Yellow
Copy-Item $configFile $targetFile -Force
Write-Host "✓ Configuration copied successfully" -ForegroundColor Green

# Read config for API key setup
$config = Get-Content $targetFile | ConvertFrom-Json
$updated = $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Keys Configuration (Optional)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "You can configure API keys now or skip and set them up later." -ForegroundColor Yellow
$setupKeys = Read-Host "Configure API keys now? (y/N)"

if ($setupKeys -eq 'y' -or $setupKeys -eq 'Y') {
    # Brave Search API
    if ($config.mcpServers.'brave-search') {
        Write-Host ""
        Write-Host "Brave Search API Key" -ForegroundColor Yellow
        Write-Host "Get your key at: https://api.search.brave.com/" -ForegroundColor Gray
        $braveKey = Read-Host "Enter Brave API key (or press Enter to skip)"
        if ($braveKey) {
            $config.mcpServers.'brave-search'.env.BRAVE_API_KEY = $braveKey
            $updated = $true
            Write-Host "✓ Brave Search API key set" -ForegroundColor Green
        }
    }

    # GitHub Token
    if ($config.mcpServers.github) {
        Write-Host ""
        Write-Host "GitHub Personal Access Token" -ForegroundColor Yellow
        Write-Host "Get your token at: https://github.com/settings/tokens" -ForegroundColor Gray
        $githubToken = Read-Host "Enter GitHub token (or press Enter to skip)"
        if ($githubToken) {
            $config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = $githubToken
            $updated = $true
            Write-Host "✓ GitHub token set" -ForegroundColor Green
        }
    }

    # PostgreSQL
    if ($config.mcpServers.postgres) {
        Write-Host ""
        Write-Host "PostgreSQL Connection String" -ForegroundColor Yellow
        Write-Host "Format: postgresql://username:password@localhost:5432/database" -ForegroundColor Gray
        $pgString = Read-Host "Enter PostgreSQL connection (or press Enter to skip)"
        if ($pgString) {
            $config.mcpServers.postgres.env.POSTGRES_CONNECTION_STRING = $pgString
            $updated = $true
            Write-Host "✓ PostgreSQL connection set" -ForegroundColor Green
        }
    }

    # Save if updated
    if ($updated) {
        $config | ConvertTo-Json -Depth 10 | Set-Content $targetFile
        Write-Host ""
        Write-Host "✓ Configuration updated with API keys" -ForegroundColor Green
    }
}

# Test basic servers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing MCP Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testServers = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-fetch", 
    "@modelcontextprotocol/server-memory"
)

foreach ($server in $testServers) {
    Write-Host "Testing $server..." -ForegroundColor Yellow
    $testResult = npx -y $server --help 2>&1
    if ($LASTEXITCODE -eq 0 -or $testResult -match "filesystem|fetch|memory") {
        Write-Host "✓ $server is available" -ForegroundColor Green
    } else {
        Write-Host "⚠ $server may need additional setup" -ForegroundColor Yellow
    }
}

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration saved to:" -ForegroundColor Yellow
Write-Host "$targetFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart Trae AI to load MCP servers" -ForegroundColor White
Write-Host "2. Test with commands like:" -ForegroundColor White
Write-Host "   • 'List files in my documents'" -ForegroundColor Gray
Write-Host "   • 'Remember I prefer TypeScript'" -ForegroundColor Gray
Write-Host "   • 'What time is it in Tokyo?'" -ForegroundColor Gray
Write-Host ""
Write-Host "API Key Setup URLs:" -ForegroundColor Yellow
Write-Host "• Brave Search: https://api.search.brave.com/" -ForegroundColor Gray
Write-Host "• GitHub: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "• Google Cloud: https://console.cloud.google.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "Setup completed successfully! 🎉" -ForegroundColor Green