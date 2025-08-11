# API Keys Configuration for MCP Servers
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MCP Servers API Keys Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$configPath = "$env:APPDATA\Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"

if (-not (Test-Path $configPath)) {
    Write-Host "Error: MCP configuration not found at $configPath" -ForegroundColor Red
    Write-Host "Please run the setup script first." -ForegroundColor Red
    exit 1
}

# Read current configuration
$config = Get-Content $configPath | ConvertFrom-Json
$updated = $false

Write-Host "Current MCP servers configuration found." -ForegroundColor Green
Write-Host "You can configure API keys for the following services:" -ForegroundColor Yellow
Write-Host ""

# API Key configurations
$apiConfigs = @{
    "brave-search" = @{
        "name" = "Brave Search"
        "envVar" = "BRAVE_API_KEY"
        "url" = "https://api.search.brave.com/"
        "description" = "Web search capabilities"
    }
    "github" = @{
        "name" = "GitHub"
        "envVar" = "GITHUB_PERSONAL_ACCESS_TOKEN"
        "url" = "https://github.com/settings/tokens"
        "description" = "GitHub repository management"
    }
    "postgres" = @{
        "name" = "PostgreSQL"
        "envVar" = "POSTGRES_CONNECTION_STRING"
        "url" = "postgresql://username:password@localhost:5432/database"
        "description" = "PostgreSQL database access"
    }
    "everart" = @{
        "name" = "EverArt"
        "envVar" = "EVERART_API_KEY"
        "url" = "https://everart.ai/"
        "description" = "AI image generation"
    }
    "gdrive" = @{
        "name" = "Google Drive"
        "envVar" = "GOOGLE_CLIENT_ID"
        "url" = "https://console.cloud.google.com/"
        "description" = "Google Drive access (OAuth)"
    }
    "slack" = @{
        "name" = "Slack"
        "envVar" = "SLACK_BOT_TOKEN"
        "url" = "https://api.slack.com/apps"
        "description" = "Slack workspace integration"
    }
}

foreach ($serviceKey in $apiConfigs.Keys) {
    $service = $apiConfigs[$serviceKey]
    
    if ($config.mcpServers.$serviceKey) {
        Write-Host "Configure $($service.name)" -ForegroundColor Yellow
        Write-Host "  Description: $($service.description)" -ForegroundColor Gray
        Write-Host "  Setup URL: $($service.url)" -ForegroundColor Gray
        
        if ($config.mcpServers.$serviceKey.env) {
            $currentValue = $config.mcpServers.$serviceKey.env.($service.envVar)
            if ($currentValue -and $currentValue -notlike "*your_*_here*") {
                Write-Host "  Current: [CONFIGURED]" -ForegroundColor Green
            } else {
                Write-Host "  Current: [NOT CONFIGURED]" -ForegroundColor Red
            }
        } else {
            Write-Host "  Current: [NOT CONFIGURED]" -ForegroundColor Red
        }
        
        $newValue = Read-Host "  Enter API key/token (or press Enter to skip)"
        
        if ($newValue) {
            if (-not $config.mcpServers.$serviceKey.env) {
                $config.mcpServers.$serviceKey | Add-Member -Type NoteProperty -Name "env" -Value @{}
            }
            $config.mcpServers.$serviceKey.env.($service.envVar) = $newValue
            $updated = $true
            Write-Host "  ✓ $($service.name) configured" -ForegroundColor Green
        }
        Write-Host ""
    }
}

# Handle Google Drive OAuth (requires both client ID and secret)
if ($config.mcpServers.gdrive -and $updated) {
    Write-Host "Google Drive requires both Client ID and Client Secret:" -ForegroundColor Yellow
    $clientSecret = Read-Host "Enter Google Client Secret (or press Enter to skip)"
    if ($clientSecret) {
        $config.mcpServers.gdrive.env.GOOGLE_CLIENT_SECRET = $clientSecret
        Write-Host "✓ Google Client Secret configured" -ForegroundColor Green
    }
    Write-Host ""
}

# Save configuration if updated
if ($updated) {
    Write-Host "Saving updated configuration..." -ForegroundColor Yellow
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    Write-Host "✓ Configuration saved successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Restart Trae AI to load the new API keys." -ForegroundColor Yellow
} else {
    Write-Host "No changes made to configuration." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Key Setup URLs Reference:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
foreach ($serviceKey in $apiConfigs.Keys) {
    $service = $apiConfigs[$serviceKey]
    Write-Host "$($service.name): $($service.url)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Configuration complete!" -ForegroundColor Green