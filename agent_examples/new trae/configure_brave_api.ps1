# 🔍 Brave Search API Configuration Script
# Securely configure Brave API key for MCP applications

Write-Host "🚀 Brave Search API Configuration" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Get API key securely
$ApiKey = Read-Host "Enter your Brave Search API key" -AsSecureString
$PlainApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ApiKey))

if (-not $PlainApiKey) {
    Write-Host "❌ No API key provided. Exiting..." -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Configuring Brave Search API..." -ForegroundColor Yellow

# Create environment variable
[Environment]::SetEnvironmentVariable("BRAVE_API_KEY", $PlainApiKey, "User")

# Also set for current session
$env:BRAVE_API_KEY = $PlainApiKey

# Create MCP server configuration with Brave API key
$mcpConfigContent = @{
    mcpServers = @{
        filesystem = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-filesystem", "C:\Users\aiech\OneDrive\Documents")
        }
        memory = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-memory")
        }
        "sequential-thinking" = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-sequential-thinking")
        }
        puppeteer = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-puppeteer")
        }
        "brave-search" = @{
            command = "npx"
            args = @("-y", "@modelcontextprotocol/server-brave-search")
            env = @{
                BRAVE_API_KEY = $PlainApiKey
            }
        }
    }
}

# Convert to JSON and save
$mcpConfigJson = $mcpConfigContent | ConvertTo-Json -Depth 4
$mcpConfigJson | Out-File -FilePath "mcp_servers_with_brave.json" -Encoding UTF8

Write-Host "✅ Brave API key configured successfully!" -ForegroundColor Green
Write-Host "📁 Configuration saved to: mcp_servers_with_brave.json" -ForegroundColor Green
Write-Host "🔄 Please restart Cline to use the new configuration." -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart Cline with the new MCP configuration" -ForegroundColor White
Write-Host "2. Test search functionality in applications" -ForegroundColor White
Write-Host "3. Run enhanced TalkToApp with live search" -ForegroundColor White

# Clear the plain text API key from memory
$PlainApiKey = $null
[System.GC]::Collect()

Write-Host ""
Write-Host "🚀 Ready to enhance applications with real-time search!" -ForegroundColor Green
