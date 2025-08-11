# Amazon Q Developer Optimization Script - Fixed Version
# This script applies comprehensive VS Code settings for optimal Amazon Q performance

param(
    [switch]$Force,
    [switch]$Backup,
    [string]$SettingsPath = "",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
if ($Verbose) {
    $VerbosePreference = "Continue"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )

    $colorMap = @{
        "Success" = "Green"
        "Warning" = "Yellow"
        "Error" = "Red"
        "Info" = "Cyan"
        "Header" = "Magenta"
    }

    $consoleColor = if ($colorMap.ContainsKey($Color)) { $colorMap[$Color] } else { "White" }
    Write-Host $Message -ForegroundColor $consoleColor
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput ("=" * 60) -Color "Header"
    Write-ColorOutput $Title -Color "Header"
    Write-ColorOutput ("=" * 60) -Color "Header"
    Write-Host ""
}

function Test-VSCodeInstalled {
    try {
        $vscodeCommand = Get-Command code -ErrorAction SilentlyContinue
        if ($vscodeCommand) {
            Write-ColorOutput "✓ VS Code detected at: $($vscodeCommand.Source)" -Color "Success"
            return $true
        }

        Write-ColorOutput "✗ VS Code not found in PATH" -Color "Error"
        return $false
    }
    catch {
        Write-ColorOutput "✗ Error checking VS Code installation: $($_.Exception.Message)" -Color "Error"
        return $false
    }
}

function Get-VSCodeSettingsPath {
    $userDataPath = "$env:APPDATA\Code\User"
    $settingsFile = Join-Path $userDataPath "settings.json"

    if (-not (Test-Path $userDataPath)) {
        Write-Verbose "Creating VS Code user directory: $userDataPath"
        New-Item -Path $userDataPath -ItemType Directory -Force | Out-Null
    }

    return $settingsFile
}

function Set-AmazonQSettings {
    param([string]$TargetSettingsPath)

    Write-Header "Applying Amazon Q Optimization Settings"

    # Define Amazon Q optimized settings as JSON string
    $amazonQSettingsJson = @'
{
    "amazonQ.developer.enableCodeSuggestions": true,
    "amazonQ.developer.enableInlineCompletion": true,
    "amazonQ.developer.enableCodeTransform": true,
    "amazonQ.developer.enableSecurityScanning": true,
    "amazonQ.developer.enableChatAssistant": true,
    "amazonQ.developer.showInlineCompletionTypes": true,
    "amazonQ.developer.experimentalFeatures": true,
    "python.analysis.typeCheckingMode": "strict",
    "python.analysis.autoImportCompletions": true,
    "python.analysis.completeFunctionParens": true,
    "python.analysis.addImport.exactMatchOnly": false,
    "python.analysis.indexing": true,
    "python.analysis.diagnosticMode": "workspace",
    "python.analysis.autoDocstringFormat": "google",
    "editor.suggestSelection": "first",
    "editor.acceptSuggestionOnCommitCharacter": true,
    "editor.acceptSuggestionOnEnter": "on",
    "editor.quickSuggestionsDelay": 10,
    "editor.parameterHints.enabled": true,
    "editor.parameterHints.cycle": true,
    "editor.suggest.snippetsPreventQuickSuggestions": false,
    "editor.suggest.localityBonus": true,
    "editor.suggest.shareSuggestSelections": true,
    "editor.quickSuggestions": {
        "other": "on",
        "comments": "on",
        "strings": "on"
    },
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": true,
    "python.linting.flake8Enabled": true,
    "python.linting.mypyEnabled": true,
    "python.linting.pydocstyleEnabled": true,
    "python.formatting.provider": "black",
    "editor.formatOnSave": true,
    "editor.formatOnType": true,
    "editor.formatOnPaste": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true,
        "source.fixAll": true
    },
    "editor.hover.enabled": true,
    "editor.hover.delay": 300,
    "editor.hover.sticky": true,
    "editor.inlayHints.enabled": "on",
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "[python]": {
        "editor.defaultFormatter": "ms-python.black-formatter",
        "editor.insertSpaces": true,
        "editor.tabSize": 4,
        "editor.rulers": [88],
        "editor.trimAutoWhitespace": true,
        "files.trimTrailingWhitespace": true,
        "files.insertFinalNewline": true
    },
    "problems.autoReveal": true,
    "problems.decorations.enabled": true,
    "problems.showCurrentInStatus": true,
    "security.workspace.trust.untrustedFiles": "prompt",
    "security.workspace.trust.banner": "always",
    "extensions.autoCheckUpdates": true,
    "extensions.autoUpdate": true,
    "git.enableSmartCommit": true,
    "git.autofetch": true,
    "git.autofetchPeriod": 180,
    "files.associations": {
        "*.py": "python",
        "*.pyi": "python",
        "*.pyx": "python",
        ".env*": "dotenv",
        "requirements*.txt": "pip-requirements",
        "pyproject.toml": "toml",
        "*.yml": "yaml",
        "*.yaml": "yaml"
    }
}
'@

    try {
        # Create backup if file exists
        if ((Test-Path $TargetSettingsPath) -and $Backup) {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupPath = "$TargetSettingsPath.backup_$timestamp"
            Copy-Item $TargetSettingsPath $backupPath -Force
            Write-ColorOutput "✓ Backup created: $backupPath" -Color "Success"
        }

        # Write settings to file
        $amazonQSettingsJson | Out-File -FilePath $TargetSettingsPath -Encoding UTF8

        Write-ColorOutput "✓ Amazon Q settings applied successfully" -Color "Success"
        Write-ColorOutput "📁 Settings file: $TargetSettingsPath" -Color "Info"

        return $true
    }
    catch {
        Write-ColorOutput "✗ Failed to apply Amazon Q settings: $($_.Exception.Message)" -Color "Error"
        return $false
    }
}

function Install-RecommendedExtensions {
    Write-Header "Installing Recommended Extensions for Amazon Q"

    $extensions = @(
        "amazonwebservices.amazon-q-vscode",
        "ms-python.python",
        "ms-python.black-formatter",
        "ms-python.pylint",
        "ms-python.flake8",
        "njpwerner.autodocstring",
        "ms-toolsai.jupyter",
        "charliermarsh.ruff",
        "ms-vscode.vscode-json",
        "redhat.vscode-yaml",
        "vscode-icons-team.vscode-icons"
    )

    $installed = 0
    $failed = 0

    foreach ($extension in $extensions) {
        try {
            Write-ColorOutput "Installing $extension..." -Color "Info"

            $process = Start-Process -FilePath "code" -ArgumentList "--install-extension", $extension, "--force" -Wait -PassThru -NoNewWindow
            if ($process.ExitCode -eq 0) {
                $installed++
                Write-ColorOutput "✓ Installed: $extension" -Color "Success"
            }
            else {
                $failed++
                Write-ColorOutput "✗ Failed to install: $extension" -Color "Warning"
            }
        }
        catch {
            $failed++
            Write-ColorOutput "✗ Exception installing $extension : $($_.Exception.Message)" -Color "Error"
        }
    }

    Write-Host ""
    Write-ColorOutput "Extension Installation Summary:" -Color "Header"
    Write-ColorOutput "✓ Installed: $installed" -Color "Success"
    if ($failed -gt 0) {
        Write-ColorOutput "✗ Failed: $failed" -Color "Warning"
    }
}

function Test-AmazonQConfiguration {
    Write-Header "Testing Amazon Q Configuration"

    $settingsPath = Get-VSCodeSettingsPath

    if (-not (Test-Path $settingsPath)) {
        Write-ColorOutput "✗ Settings file not found: $settingsPath" -Color "Error"
        return $false
    }

    try {
        $content = Get-Content $settingsPath -Raw
        $settings = $content | ConvertFrom-Json

        $requiredSettings = @(
            "amazonQ.developer.enableCodeSuggestions",
            "python.analysis.typeCheckingMode",
            "editor.suggestSelection",
            "python.linting.enabled"
        )

        $allPresent = $true
        foreach ($setting in $requiredSettings) {
            if ($settings.PSObject.Properties.Name -contains $setting) {
                $value = $settings.$setting
                Write-ColorOutput "✓ Found: $setting = $value" -Color "Success"
            }
            else {
                Write-ColorOutput "✗ Missing: $setting" -Color "Error"
                $allPresent = $false
            }
        }

        if ($allPresent) {
            Write-ColorOutput "✓ All critical Amazon Q settings are configured" -Color "Success"
            return $true
        }
        else {
            Write-ColorOutput "⚠ Some Amazon Q settings are missing" -Color "Warning"
            return $false
        }
    }
    catch {
        Write-ColorOutput "✗ Error reading settings: $($_.Exception.Message)" -Color "Error"
        return $false
    }
}

function Show-OptimizationTips {
    Write-Header "Amazon Q Optimization Tips"

    $tips = @(
        "🎯 Use detailed docstrings with type hints for better AI understanding",
        "📝 Write descriptive variable and function names",
        "🔍 Use type annotations consistently throughout your code",
        "📚 Organize imports and follow PEP 8 conventions",
        "🧪 Write comprehensive unit tests with clear assertions",
        "💡 Use dataclasses and Protocols for better type inference",
        "🔄 Leverage async/await patterns for concurrent operations",
        "📊 Structure your code with clear separation of concerns",
        "🛡️ Implement proper error handling and logging",
        "⚡ Use caching and performance optimization patterns"
    )

    foreach ($tip in $tips) {
        Write-ColorOutput $tip -Color "Info"
    }
}

# Main execution
function Main {
    Write-Header "Amazon Q Developer Optimization Script"

    try {
        # Check VS Code installation
        if (-not (Test-VSCodeInstalled)) {
            Write-ColorOutput "Please install VS Code first: https://code.visualstudio.com/" -Color "Error"
            return 1
        }

        # Get settings path
        $settingsPath = if ($SettingsPath) { $SettingsPath } else { Get-VSCodeSettingsPath }
        Write-ColorOutput "Target settings file: $settingsPath" -Color "Info"

        # Apply Amazon Q settings
        if (-not (Set-AmazonQSettings -TargetSettingsPath $settingsPath)) {
            Write-ColorOutput "✗ Failed to apply settings" -Color "Error"
            return 1
        }

        # Install recommended extensions
        if (Test-VSCodeInstalled) {
            Install-RecommendedExtensions
        }

        # Test configuration
        Start-Sleep -Seconds 2
        $configTest = Test-AmazonQConfiguration

        # Show optimization tips
        Show-OptimizationTips

        Write-Header "Optimization Complete"

        if ($configTest) {
            Write-ColorOutput "🎉 Amazon Q optimization completed successfully!" -Color "Success"
            Write-ColorOutput "🚀 VS Code is now optimized for AI-powered development" -Color "Success"
            Write-Host ""
            Write-ColorOutput "Next steps:" -Color "Header"
            Write-ColorOutput "1. Restart VS Code to apply all changes" -Color "Info"
            Write-ColorOutput "2. Sign in to Amazon Q Developer if not already signed in" -Color "Info"
            Write-ColorOutput "3. Open your Python project and start coding" -Color "Info"
            Write-ColorOutput "4. Use the Amazon Q Demo file to test suggestions" -Color "Info"
        }
        else {
            Write-ColorOutput "⚠ Optimization completed with warnings" -Color "Warning"
            Write-ColorOutput "Please check the configuration and try again if needed" -Color "Warning"
        }

        return 0
    }
    catch {
        Write-ColorOutput "✗ Script failed: $($_.Exception.Message)" -Color "Error"
        return 1
    }
}

# Execute main function
exit (Main)
