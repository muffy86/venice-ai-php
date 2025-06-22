#!/usr/bin/env powershell
# ELITE DEVELOPMENT ENVIRONMENT - QUICK START SCRIPT
# Run this script to immediately begin using your elite setup

param(
    [switch]$QuickStart = $false,
    [switch]$FullSetup = $false
)

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "    🚀 ELITE DEVELOPMENT ENVIRONMENT - QUICK START 🚀             " -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $colors = @{
        "SUCCESS" = "Green"
        "INFO" = "Cyan"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
    }
    Write-Host "[$Status] $Message" -ForegroundColor $colors[$Status]
}

function Test-Prerequisites {
    Write-Status "Checking prerequisites..." "INFO"

    $results = @{}

    # Check VS Code
    if (Get-Command code -ErrorAction SilentlyContinue) {
        $results["VSCode"] = $true
        Write-Status "✅ VS Code: Available" "SUCCESS"
    } else {
        $results["VSCode"] = $false
        Write-Status "❌ VS Code: Not found" "ERROR"
    }

    # Check PHP
    if (Get-Command php -ErrorAction SilentlyContinue) {
        $results["PHP"] = $true
        Write-Status "✅ PHP: Available" "SUCCESS"
    } else {
        $results["PHP"] = $false
        Write-Status "❌ PHP: Not found" "WARNING"
    }

    # Check Node.js
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $results["Node"] = $true
        Write-Status "✅ Node.js: Available" "SUCCESS"
    } else {
        $results["Node"] = $false
        Write-Status "❌ Node.js: Not found" "WARNING"
    }

    # Check Venice AI Config
    if (Test-Path "config.php") {
        $results["VeniceConfig"] = $true
        Write-Status "✅ Venice AI Config: Found" "SUCCESS"
    } else {
        $results["VeniceConfig"] = $false
        Write-Status "❌ Venice AI Config: Missing" "ERROR"
    }

    return $results
}

function Start-QuickDemo {
    Write-Status "Starting Venice AI Quick Demo..." "INFO"

    if (Test-Path "enhanced-demo.php") {
        Write-Status "Running enhanced demo..." "INFO"
        php enhanced-demo.php
    } elseif (Test-Path "test-runner.php") {
        Write-Status "Running test suite..." "INFO"
        php test-runner.php
    } else {
        Write-Status "Demo files not found. Run full setup first." "WARNING"
    }
}

function Open-Documentation {
    Write-Status "Opening documentation..." "INFO"

    $docs = @(
        "ELITE_COMPLETE_GUIDE.md",
        "FINAL_STATUS_REPORT.md",
        "QUICK_START.md"
    )

    foreach ($doc in $docs) {
        if (Test-Path $doc) {
            code $doc
            Write-Status "Opened: $doc" "SUCCESS"
        }
    }
}

function Show-NextSteps {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "                        NEXT STEPS                                " -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "1. 🔄 RESTART VS CODE to apply all settings" -ForegroundColor Cyan
    Write-Host "   Your settings.json has been completely fixed and optimized" -ForegroundColor Gray
    Write-Host ""

    Write-Host "2. 🔧 Install Elite Tech Stack:" -ForegroundColor Cyan
    Write-Host "   .\elite-tech-stack-setup.ps1" -ForegroundColor Gray
    Write-Host ""

    Write-Host "3. 📁 Enable Automated File Handling:" -ForegroundColor Cyan
    Write-Host "   .\elite-file-handler.ps1" -ForegroundColor Gray
    Write-Host ""

    Write-Host "4. 🧪 Test Venice AI SDK:" -ForegroundColor Cyan
    Write-Host "   php test-runner.php" -ForegroundColor Gray
    Write-Host "   php enhanced-demo.php" -ForegroundColor Gray
    Write-Host ""

    Write-Host "5. 🌐 Start MCP Server:" -ForegroundColor Cyan
    Write-Host "   cd 'C:\Users\aiech\OneDrive\Documents\.blackbox\MCP\venice-ai-integration'" -ForegroundColor Gray
    Write-Host "   node test-server.js" -ForegroundColor Gray
    Write-Host ""

    Write-Host "🎯 KEY FEATURES NOW AVAILABLE:" -ForegroundColor Green
    Write-Host "   • Auto-save every 1 second" -ForegroundColor Gray
    Write-Host "   • Format on save/paste/type" -ForegroundColor Gray
    Write-Host "   • AI-powered code completion" -ForegroundColor Gray
    Write-Host "   • OpenAI-compatible Venice AI methods" -ForegroundColor Gray
    Write-Host "   • Automated download processing" -ForegroundColor Gray
    Write-Host "   • Elite development tools" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
if ($QuickStart) {
    $results = Test-Prerequisites
    Start-QuickDemo
    Open-Documentation
    Show-NextSteps
} elseif ($FullSetup) {
    Write-Status "Starting full elite setup..." "INFO"

    # Run tech stack setup
    if (Test-Path "elite-tech-stack-setup.ps1") {
        .\elite-tech-stack-setup.ps1 -InstallAll
    }

    # Test Venice AI
    if (Test-Path "test-runner.php") {
        php test-runner.php
    }

    Show-NextSteps
} else {
    # Interactive mode
    $results = Test-Prerequisites

    Write-Host ""
    Write-Host "Choose an option:" -ForegroundColor Yellow
    Write-Host "1. Quick Start (Demo + Docs)" -ForegroundColor Cyan
    Write-Host "2. Full Setup (Install Everything)" -ForegroundColor Cyan
    Write-Host "3. Tech Stack Setup Only" -ForegroundColor Cyan
    Write-Host "4. File Handler Setup Only" -ForegroundColor Cyan
    Write-Host "5. Test Venice AI SDK" -ForegroundColor Cyan
    Write-Host "6. Open Documentation" -ForegroundColor Cyan
    Write-Host "7. Show Status & Next Steps" -ForegroundColor Cyan
    Write-Host "8. Exit" -ForegroundColor Red
    Write-Host ""

    $choice = Read-Host "Enter choice (1-8)"

    switch ($choice) {
        "1" {
            Start-QuickDemo
            Open-Documentation
            Show-NextSteps
        }
        "2" {
            if (Test-Path "elite-tech-stack-setup.ps1") {
                .\elite-tech-stack-setup.ps1
            } else {
                Write-Status "Elite tech stack script not found" "ERROR"
            }
        }
        "3" {
            if (Test-Path "elite-tech-stack-setup.ps1") {
                .\elite-tech-stack-setup.ps1
            } else {
                Write-Status "Elite tech stack script not found" "ERROR"
            }
        }
        "4" {
            if (Test-Path "elite-file-handler.ps1") {
                .\elite-file-handler.ps1
            } else {
                Write-Status "Elite file handler script not found" "ERROR"
            }
        }
        "5" {
            Start-QuickDemo
        }
        "6" {
            Open-Documentation
        }
        "7" {
            Show-NextSteps
        }
        "8" {
            Write-Status "Goodbye! Happy coding! 🚀" "SUCCESS"
            exit
        }
        default {
            Write-Status "Invalid choice. Showing next steps..." "WARNING"
            Show-NextSteps
        }
    }
}
