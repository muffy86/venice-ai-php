# TalkToApp Terminal Enhancements
# PowerShell profile enhancements for better development experience

# Enhanced prompt with project context
function prompt {
    $currentPath = Get-Location
    $projectRoot = "talktoapp"
    
    if ($currentPath -like "*$projectRoot*") {
        $relativePath = $currentPath -replace ".*$projectRoot", $projectRoot
        Write-Host "🚀 " -NoNewline -ForegroundColor Magenta
        Write-Host "$relativePath" -NoNewline -ForegroundColor Cyan
        Write-Host " > " -NoNewline -ForegroundColor Green
    } else {
        Write-Host "PS " -NoNewline -ForegroundColor Yellow
        Write-Host "$currentPath" -NoNewline -ForegroundColor White
        Write-Host " > " -NoNewline -ForegroundColor Green
    }
    
    return " "
}

# Enhanced aliases for common development tasks
Set-Alias -Name "dev" -Value ".\dev-tools.ps1"
Set-Alias -Name "start" -Value ".\start-dev.bat"
Set-Alias -Name "ll" -Value "Get-ChildItem"
Set-Alias -Name "la" -Value "Get-ChildItem -Force"

# Function to safely navigate to TalkToApp directory
function Go-TalkToApp {
    $targetPath = "c:\Users\aiech\OneDrive\Documents\GitHub\venice-ai-php\agent_examples\new trae\mcp-applications\talktoapp"
    if (Test-Path $targetPath) {
        Set-Location -Path $targetPath
        Write-Host "✅ Navigated to TalkToApp directory" -ForegroundColor Green
        Get-ChildItem | Format-Table Name, Length, LastWriteTime -AutoSize
    } else {
        Write-Host "❌ TalkToApp directory not found" -ForegroundColor Red
    }
}

# Function to show project status
function Show-ProjectStatus {
    Write-Host "📊 TalkToApp Project Status" -ForegroundColor Magenta
    Write-Host "═══════════════════════════" -ForegroundColor Magenta
    
    # Check if we're in the right directory
    if (Test-Path "index.html") {
        Write-Host "✅ In TalkToApp directory" -ForegroundColor Green
        
        # Check file sizes and modification times
        $files = @("index.html", "modules/mcp-integration.js", "modules/ai-services.js", "modules/app-generator.js", "modules/persistence.js")
        
        foreach ($file in $files) {
            if (Test-Path $file) {
                $fileInfo = Get-Item $file
                $size = [math]::Round($fileInfo.Length / 1KB, 2)
                Write-Host "  📄 $file ($size KB) - Modified: $($fileInfo.LastWriteTime.ToString('MM/dd HH:mm'))" -ForegroundColor Cyan
            } else {
                Write-Host "  ❌ $file - Missing" -ForegroundColor Red
            }
        }
        
        # Check for running servers
        $runningServers = Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -ge 8000 -and $_.LocalPort -le 9000 }
        if ($runningServers) {
            Write-Host "🌐 Active development servers:" -ForegroundColor Yellow
            foreach ($server in $runningServers) {
                Write-Host "  • Port $($server.LocalPort)" -ForegroundColor Green
            }
        } else {
            Write-Host "💤 No development servers running" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Not in TalkToApp directory" -ForegroundColor Red
        Write-Host "💡 Use 'Go-TalkToApp' to navigate to the project" -ForegroundColor Yellow
    }
}

# Function to quickly start development server
function Start-DevQuick {
    param([int]$Port = 8080)
    
    if (Test-Path "index.html") {
        Write-Host "🚀 Starting TalkToApp development server..." -ForegroundColor Green
        python -m http.server $Port
    } else {
        Write-Host "❌ Not in TalkToApp directory. Use 'Go-TalkToApp' first." -ForegroundColor Red
    }
}

# Function to open project in browser
function Open-TalkToApp {
    param([int]$Port = 8080)
    $url = "http://localhost:$Port"
    Write-Host "🌐 Opening TalkToApp at $url" -ForegroundColor Green
    Start-Process $url
}

# Enhanced tab completion for project files
Register-ArgumentCompleter -CommandName "code", "notepad", "Get-Content" -ScriptBlock {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameters)
    
    $projectFiles = @("index.html", "modules/mcp-integration.js", "modules/ai-services.js", "modules/app-generator.js", "modules/persistence.js", "dev-tools.ps1", "start-dev.bat")
    
    $projectFiles | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}

# Welcome message
Write-Host ""
Write-Host "🎉 TalkToApp Terminal Enhancements Loaded!" -ForegroundColor Magenta
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  • Go-TalkToApp      - Navigate to project directory" -ForegroundColor White
Write-Host "  • Show-ProjectStatus - Show project information" -ForegroundColor White
Write-Host "  • Start-DevQuick    - Quick start development server" -ForegroundColor White
Write-Host "  • Open-TalkToApp    - Open app in browser" -ForegroundColor White
Write-Host "  • dev               - Run development tools" -ForegroundColor White
Write-Host "  • start             - Run start script" -ForegroundColor White
Write-Host ""

# Auto-navigate to project if we're close
$currentLocation = Get-Location
if ($currentLocation -like "*venice-ai-php*" -and -not ($currentLocation -like "*talktoapp*")) {
    Write-Host "💡 Detected you're in the project area. Use 'Go-TalkToApp' to navigate to TalkToApp." -ForegroundColor Yellow
}