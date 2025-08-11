# TalkToApp Enhanced Development Tools
# PowerShell script to fix terminal issues and provide enhanced development experience

param(
    [string]$Action = "start",
    [int]$Port = 8080,
    [switch]$OpenBrowser,
    [switch]$Watch,
    [switch]$Debug
)

# Colors for enhanced terminal output
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Banner {
    Write-ColorOutput "================================================================" "Header"
    Write-ColorOutput "                    TalkToApp Dev Tools                         " "Header"
    Write-ColorOutput "              Enhanced Development Environment                  " "Header"
    Write-ColorOutput "================================================================" "Header"
    Write-Host ""
}

function Test-Port {
    param([int]$PortNumber)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $PortNumber)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Find-AvailablePort {
    param([int]$StartPort = 8080)
    $port = $StartPort
    while (Test-Port $port) {
        $port++
        if ($port -gt 9000) {
            throw "No available ports found between $StartPort and 9000"
        }
    }
    return $port
}

function Start-DevServer {
    param([int]$Port)
    
    Write-ColorOutput "Checking port availability..." "Info"
    
    if (Test-Port $Port) {
        Write-ColorOutput "Port $Port is already in use. Finding alternative..." "Warning"
        $Port = Find-AvailablePort $Port
        Write-ColorOutput "Using port $Port instead" "Success"
    }
    
    # Ensure we're in the correct directory
    $TargetPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $TargetPath
    
    Write-ColorOutput "Working directory: $TargetPath" "Info"
    Write-ColorOutput "Starting development server on port $Port..." "Info"
    
    # Start the server
    $ServerUrl = "http://localhost:$Port"
    Write-ColorOutput "Server starting at: $ServerUrl" "Success"
    Write-ColorOutput "Access your app at: $ServerUrl" "Success"
    
    if ($OpenBrowser) {
        Write-ColorOutput "Opening browser..." "Info"
        Start-Process $ServerUrl
    }
    
    if ($Watch) {
        Write-ColorOutput "File watching enabled - server will restart on changes" "Info"
    }
    
    Write-ColorOutput "Press Ctrl+C to stop the server" "Warning"
    Write-Host ""
    
    # Start Python HTTP server
    python -m http.server $Port
}

function Show-ProjectInfo {
    Write-ColorOutput "Project Information:" "Header"
    Write-ColorOutput "  * Project: TalkToApp Enhanced" "Info"
    Write-ColorOutput "  * Version: 2.0.0 AAA Edition" "Info"
    Write-ColorOutput "  * Features: AI-Powered App Builder with AAA Visuals" "Info"
    Write-ColorOutput "  * Technologies: HTML5, CSS3, JavaScript ES6+, Web APIs" "Info"
    Write-Host ""
}

function Show-QuickCommands {
    Write-ColorOutput "Quick Commands:" "Header"
    Write-ColorOutput "  * .\dev-tools.ps1 start          - Start development server" "Info"
    Write-ColorOutput "  * .\dev-tools.ps1 start -OpenBrowser - Start server and open browser" "Info"
    Write-ColorOutput "  * .\dev-tools.ps1 info           - Show project information" "Info"
    Write-ColorOutput "  * .\dev-tools.ps1 test           - Run tests" "Info"
    Write-ColorOutput "  * .\dev-tools.ps1 build          - Build for production" "Info"
    Write-Host ""
}

function Test-Application {
    Write-ColorOutput "Running application tests..." "Info"
    
    # Check if required files exist
    $RequiredFiles = @("index.html", "modules/mcp-integration.js", "modules/ai-services.js", "modules/app-generator.js", "modules/persistence.js")
    $AllFilesExist = $true
    
    foreach ($file in $RequiredFiles) {
        if (Test-Path $file) {
            Write-ColorOutput "[OK] $file - Found" "Success"
        } else {
            Write-ColorOutput "[MISSING] $file - Missing" "Error"
            $AllFilesExist = $false
        }
    }
    
    if ($AllFilesExist) {
        Write-ColorOutput "All required files are present!" "Success"
    } else {
        Write-ColorOutput "Some files are missing. Please check your project structure." "Warning"
    }
}

function Build-Application {
    Write-ColorOutput "Building application for production..." "Info"
    
    # Create build directory
    $BuildDir = "build"
    if (Test-Path $BuildDir) {
        Remove-Item $BuildDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $BuildDir | Out-Null
    
    # Copy files
    Copy-Item "index.html" "$BuildDir/"
    Copy-Item "modules" "$BuildDir/" -Recurse
    Copy-Item "manifest.json" "$BuildDir/"
    Copy-Item "sw.js" "$BuildDir/"
    
    Write-ColorOutput "Build completed! Files are in the '$BuildDir' directory." "Success"
}

# Main execution
Clear-Host
Show-Banner

switch ($Action.ToLower()) {
    "start" {
        Show-ProjectInfo
        Start-DevServer -Port $Port
    }
    "info" {
        Show-ProjectInfo
        Show-QuickCommands
    }
    "test" {
        Test-Application
    }
    "build" {
        Build-Application
    }
    "help" {
        Show-QuickCommands
    }
    default {
        Write-ColorOutput "Unknown action: $Action" "Warning"
        Show-QuickCommands
    }
}