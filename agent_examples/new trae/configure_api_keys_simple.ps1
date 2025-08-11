# Simple API Keys Configuration for MCP Servers
Write-Host "MCP Servers API Keys Configuration" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$configPath = "$env:APPDATA\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"

if (-not (Test-Path $configPath)) {
    Write-Host "Error: MCP configuration not found" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$updated = $false

Write-Host "Available services to configure:" -ForegroundColor Yellow

# Brave Search
if ($config.mcpServers.'brave-search') {
    Write-Host "1. Brave Search API" -ForegroundColor Green
    $braveKey = Read-Host "Enter Brave API key (or press Enter to skip)"
    if ($braveKey) {
        if (-not $config.mcpServers.'brave-search'.env) {
            $config.mcpServers.'brave-search' | Add-Member -Type NoteProperty -Name "env" -Value @{}
        }
        $config.mcpServers.'brave-search'.env.BRAVE_API_KEY = $braveKey
        $updated = $true
        Write-Host "Brave Search configured" -ForegroundColor Green
    }
}

# GitHub
if ($config.mcpServers.github) {
    Write-Host "2. GitHub Personal Access Token" -ForegroundColor Green
    $githubToken = Read-Host "Enter GitHub token (or press Enter to skip)"
    if ($githubToken) {
        if (-not $config.mcpServers.github.env) {
            $config.mcpServers.github | Add-Member -Type NoteProperty -Name "env" -Value @{}
        }
        $config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = $githubToken
        $updated = $true
        Write-Host "GitHub configured" -ForegroundColor Green
    }
}

# PostgreSQL
if ($config.mcpServers.postgres) {
    Write-Host "3. PostgreSQL Connection" -ForegroundColor Green
    $pgConnection = Read-Host "Enter PostgreSQL connection string (or press Enter to skip)"
    if ($pgConnection) {
        if (-not $config.mcpServers.postgres.env) {
            $config.mcpServers.postgres | Add-Member -Type NoteProperty -Name "env" -Value @{}
        }
        $config.mcpServers.postgres.env.POSTGRES_CONNECTION_STRING = $pgConnection
        $updated = $true
        Write-Host "PostgreSQL configured" -ForegroundColor Green
    }
}

if ($updated) {
    Write-Host "Saving configuration..." -ForegroundColor Yellow
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    Write-Host "Configuration saved! Restart Trae AI to apply changes." -ForegroundColor Green
} else {
    Write-Host "No changes made." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Setup URLs:" -ForegroundColor Cyan
Write-Host "Brave Search: https://api.search.brave.com/" -ForegroundColor Gray
Write-Host "GitHub Tokens: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "Configuration complete!" -ForegroundColor Green