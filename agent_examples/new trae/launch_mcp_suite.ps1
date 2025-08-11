# MCP Applications Suite Launcher
# Quick access to all 7 MCP applications

Write-Host "MCP Applications Suite Launcher" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$mcpAppsPath = "c:\Users\aiech\OneDrive\Documents\GitHub\venice-ai-php\agent_examples\new trae\mcp-applications"

Write-Host "Available Applications:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. MCP Server Test Suite" -ForegroundColor Green
Write-Host "2. Task Management App" -ForegroundColor Green  
Write-Host "3. Knowledge Assistant" -ForegroundColor Green
Write-Host "4. TalkToApp - AI App Builder" -ForegroundColor Magenta
Write-Host "5. MCP Monitoring Dashboard" -ForegroundColor Green
Write-Host "6. Git Repository Analyzer" -ForegroundColor Green
Write-Host "7. Web Content Archiver" -ForegroundColor Green
Write-Host "8. Launch All Applications" -ForegroundColor Cyan
Write-Host "9. View Testing Workflow" -ForegroundColor Blue
Write-Host "0. Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Select an application (0-9)"

switch ($choice) {
    "1" {
        Write-Host "Launching MCP Server Test Suite..." -ForegroundColor Green
        Start-Process "$mcpAppsPath\index.html"
    }
    "2" {
        Write-Host "Launching Task Management App..." -ForegroundColor Green
        Start-Process "$mcpAppsPath\task-manager\index.html"
    }
    "3" {
        Write-Host "Launching Knowledge Assistant..." -ForegroundColor Green
        Start-Process "$mcpAppsPath\knowledge-assistant\index.html"
    }
    "4" {
        Write-Host "Launching TalkToApp - AI App Builder..." -ForegroundColor Magenta
        Start-Process "$mcpAppsPath\talktoapp\index.html"
    }
    "5" {
        Write-Host "Launching MCP Monitoring Dashboard..." -ForegroundColor Green
        Start-Process "$mcpAppsPath\monitoring-dashboard\index.html"
    }
    "6" {
        Write-Host "Launching Git Repository Analyzer..." -ForegroundColor Green
        Start-Process "$mcpAppsPath\git-analyzer\index.html"
    }
    "7" {
        Write-Host "Launching Web Content Archiver..." -ForegroundColor Green
        Start-Process "$mcpAppsPath\web-archiver\index.html"
    }
    "8" {
        Write-Host "Launching All Applications..." -ForegroundColor Cyan
        Start-Process "$mcpAppsPath\index.html"
        Start-Process "$mcpAppsPath\task-manager\index.html"
        Start-Process "$mcpAppsPath\knowledge-assistant\index.html"
        Start-Process "$mcpAppsPath\talktoapp\index.html"
        Start-Process "$mcpAppsPath\monitoring-dashboard\index.html"
        Start-Process "$mcpAppsPath\git-analyzer\index.html"
        Start-Process "$mcpAppsPath\web-archiver\index.html"
        Write-Host "All applications launched!" -ForegroundColor Green
    }
    "9" {
        Write-Host "Opening Testing Workflow..." -ForegroundColor Blue
        Start-Process "c:\Users\aiech\OneDrive\Documents\GitHub\venice-ai-php\agent_examples\new trae\COMPLETE_TESTING_WORKFLOW.md"
    }
    "0" {
        Write-Host "Goodbye!" -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "Invalid choice. Please select 0-9." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Happy testing! Your MCP Applications Suite is ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pro Tips:" -ForegroundColor Yellow
Write-Host "   Start with the Test Suite (#1) to verify everything works" -ForegroundColor White
Write-Host "   Try TalkToApp (#4) for the most innovative experience" -ForegroundColor White
Write-Host "   Use Launch All (#8) for a complete demonstration" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check COMPLETE_TESTING_WORKFLOW.md for detailed instructions" -ForegroundColor Blue