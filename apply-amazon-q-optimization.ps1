# Amazon Q Developer Optimization Script
# This script applies comprehensive VS Code settings for optimal Amazon Q performance

param(
    [switch]$Force,
    [switch]$Backup,
    [string]$SettingsPath = "",
    [switch]$Verbose
)

# Set error action and verbose preference
$ErrorActionPreference = "Stop"
if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Define colors for output
$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "=" * 60 -Color "Header"
    Write-ColorOutput $Title -Color "Header"
    Write-ColorOutput "=" * 60 -Color "Header"
    Write-Host ""
}

function Test-VSCodeInstalled {
    try {
        $vscodeCommand = Get-Command code -ErrorAction SilentlyContinue
        if ($vscodeCommand) {
            Write-ColorOutput "✓ VS Code detected at: $($vscodeCommand.Source)" -Color "Success"
            return $true
        }

        # Try common installation paths
        $commonPaths = @(
            "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
            "$env:PROGRAMFILES\Microsoft VS Code\bin\code.cmd",
            "${env:PROGRAMFILES(X86)}\Microsoft VS Code\bin\code.cmd"
        )

        foreach ($path in $commonPaths) {
            if (Test-Path $path) {
                Write-ColorOutput "✓ VS Code found at: $path" -Color "Success"
                return $true
            }
        }

        Write-ColorOutput "✗ VS Code not found in PATH or common locations" -Color "Error"
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

function Backup-CurrentSettings {
    param([string]$SettingsPath)

    if (Test-Path $SettingsPath) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupPath = "$SettingsPath.backup_$timestamp"

        try {
            Copy-Item $SettingsPath $backupPath -Force
            Write-ColorOutput "✓ Current settings backed up to: $backupPath" -Color "Success"
            return $backupPath
        }
        catch {
            Write-ColorOutput "✗ Failed to backup current settings: $($_.Exception.Message)" -Color "Error"
            throw
        }
    }
    else {
        Write-ColorOutput "ℹ No existing settings file to backup" -Color "Info"
        return $null
    }
}

function Merge-Settings {
    param(
        [string]$CurrentSettingsPath,
        [hashtable]$NewSettings
    )

    $mergedSettings = @{}

    # Load existing settings if they exist
    if (Test-Path $CurrentSettingsPath) {
        try {
            $existingContent = Get-Content $CurrentSettingsPath -Raw -Encoding UTF8
            if ($existingContent.Trim()) {
                $existingSettings = $existingContent | ConvertFrom-Json -AsHashtable
                if ($existingSettings) {
                    $mergedSettings = $existingSettings.Clone()
                    Write-ColorOutput "✓ Loaded existing settings" -Color "Success"
                }
            }
        }
        catch {
            Write-ColorOutput "⚠ Could not parse existing settings, creating new: $($_.Exception.Message)" -Color "Warning"
        }
    }

    # Merge new settings
    foreach ($key in $NewSettings.Keys) {
        $mergedSettings[$key] = $NewSettings[$key]
        Write-Verbose "Added/Updated setting: $key"
    }

    return $mergedSettings
}

function Set-AmazonQSettings {
    param([string]$TargetSettingsPath)

    Write-Header "Applying Amazon Q Optimization Settings"

    # Define Amazon Q optimized settings
    $amazonQSettings = @{
        # Amazon Q Integration
        "amazonQ.developer.enableCodeSuggestions"        = $true
        "amazonQ.developer.enableInlineCompletion"       = $true
        "amazonQ.developer.enableCodeTransform"          = $true
        "amazonQ.developer.enableSecurityScanning"       = $true
        "amazonQ.developer.enableChatAssistant"          = $true
        "amazonQ.developer.showInlineCompletionTypes"    = $true
        "amazonQ.developer.experimentalFeatures"         = $true

        # Enhanced Python Analysis
        "python.analysis.typeCheckingMode"               = "strict"
        "python.analysis.autoImportCompletions"          = $true
        "python.analysis.completeFunctionParens"         = $true
        "python.analysis.addImport.exactMatchOnly"       = $false
        "python.analysis.indexing"                       = $true
        "python.analysis.diagnosticMode"                 = "workspace"
        "python.analysis.autoDocstringFormat"            = "google"

        # AI-Optimized Editor Settings
        "editor.suggestSelection"                        = "first"
        "editor.acceptSuggestionOnCommitCharacter"       = $true
        "editor.acceptSuggestionOnEnter"                 = "on"
        "editor.quickSuggestionsDelay"                   = 10
        "editor.parameterHints.enabled"                  = $true
        "editor.parameterHints.cycle"                    = $true
        "editor.suggest.snippetsPreventQuickSuggestions" = $false
        "editor.suggest.localityBonus"                   = $true
        "editor.suggest.shareSuggestSelections"          = $true

        # Enhanced IntelliSense
        "editor.quickSuggestions"                        = @{
            "other"    = "on"
            "comments" = "on"
            "strings"  = "on"
        }

        # Code Quality for AI Training
        "python.linting.enabled"                         = $true
        "python.linting.pylintEnabled"                   = $true
        "python.linting.flake8Enabled"                   = $true
        "python.linting.mypyEnabled"                     = $true
        "python.linting.pydocstyleEnabled"               = $true

        # Enhanced Formatting
        "python.formatting.provider"                     = "black"
        "editor.formatOnSave"                            = $true
        "editor.formatOnType"                            = $true
        "editor.formatOnPaste"                           = $true

        # Code Actions
        "editor.codeActionsOnSave"                       = @{
            "source.organizeImports" = $true
            "source.fixAll"          = $true
        }

        # Enhanced Hover and Context
        "editor.hover.enabled"                           = $true
        "editor.hover.delay"                             = 300
        "editor.hover.sticky"                            = $true
        "editor.inlayHints.enabled"                      = "on"

        # File Management
        "files.autoSave"                                 = "afterDelay"
        "files.autoSaveDelay"                            = 1000

        # Language-Specific Settings
        "[python]"                                       = @{
            "editor.defaultFormatter"      = "ms-python.black-formatter"
            "editor.insertSpaces"          = $true
            "editor.tabSize"               = 4
            "editor.rulers"                = @(88)
            "editor.trimAutoWhitespace"    = $true
            "files.trimTrailingWhitespace" = $true
            "files.insertFinalNewline"     = $true
        }

        # Enhanced Problem Detection
        "problems.autoReveal"                            = $true
        "problems.decorations.enabled"                   = $true
        "problems.showCurrentInStatus"                   = $true

        # Security and Trust
        "security.workspace.trust.untrustedFiles"        = "prompt"
        "security.workspace.trust.banner"                = "always"

        # Performance Optimization
        "extensions.autoCheckUpdates"                    = $true
        "extensions.autoUpdate"                          = $true

        # Enhanced Git Integration
        "git.enableSmartCommit"                          = $true
        "git.autofetch"                                  = $true
        "git.autofetchPeriod"                            = 180

        # File Associations for AI Recognition
        "files.associations"                             = @{
            "*.py"              = "python"
            "*.pyi"             = "python"
            "*.pyx"             = "python"
            ".env*"             = "dotenv"
            "requirements*.txt" = "pip-requirements"
            "pyproject.toml"    = "toml"
            "*.yml"             = "yaml"
            "*.yaml"            = "yaml"
        }
    }

    try {
        # Merge with existing settings
        $mergedSettings = Merge-Settings -CurrentSettingsPath $TargetSettingsPath -NewSettings $amazonQSettings

        # Convert to JSON with proper formatting
        $jsonOutput = $mergedSettings | ConvertTo-Json -Depth 10

        # Ensure UTF-8 encoding without BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($TargetSettingsPath, $jsonOutput, $utf8NoBom)

        Write-ColorOutput "✓ Amazon Q settings applied successfully" -Color "Success"
        Write-ColorOutput "📁 Settings file: $TargetSettingsPath" -Color "Info"

        return $true
    }
    catch {
        Write-ColorOutput "✗ Failed to apply Amazon Q settings: $($_.Exception.Message)" -Color "Error"
        throw
    }
}

function Install-RecommendedExtensions {
    Write-Header "Installing Recommended Extensions for Amazon Q"

    $extensions = @(
        "amazonwebservices.amazon-q-vscode", # Amazon Q Developer
        "ms-python.python", # Python
        "ms-python.black-formatter", # Black Formatter
        "ms-python.isort", # Import Sorting
        "ms-python.pylint", # Pylint
        "ms-python.flake8", # Flake8
        "ms-python.mypy-type-checker", # MyPy
        "njpwerner.autodocstring", # Auto Docstring
        "KevinRose.vsc-python-indent", # Python Indent
        "ms-python.debugpy", # Python Debugger
        "dongli.python-preview", # Python Preview
        "ms-toolsai.jupyter", # Jupyter
        "ms-toolsai.vscode-jupyter-cell-tags", # Jupyter Cell Tags
        "ms-toolsai.vscode-jupyter-slideshow", # Jupyter Slideshow
        "charliermarsh.ruff", # Ruff Linter
        "ms-vscode.vscode-json", # JSON Language Features
        "redhat.vscode-yaml", # YAML
        "ms-vscode.powershell", # PowerShell
        "vscode-icons-team.vscode-icons", # VS Code Icons
        "PKief.material-icon-theme", # Material Icon Theme
        "GitHub.copilot", # GitHub Copilot (if available)
        "GitHub.copilot-chat"                    # GitHub Copilot Chat (if available)
    )

    $installed = @()
    $failed = @()

    foreach ($extension in $extensions) {
        try {
            Write-ColorOutput "Installing $extension..." -Color "Info"

            $result = & code --install-extension $extension --force 2>&1
            if ($LASTEXITCODE -eq 0) {
                $installed += $extension
                Write-ColorOutput "✓ Installed: $extension" -Color "Success"
            }
            else {
                $failed += $extension
                Write-ColorOutput "✗ Failed to install: $extension" -Color "Warning"
                Write-Verbose "Error output: $result"
            }
        }
        catch {
            $failed += $extension
            Write-ColorOutput "✗ Exception installing $extension`: $($_.Exception.Message)" -Color "Error"
        }
    }

    Write-Host ""
    Write-ColorOutput "Extension Installation Summary:" -Color "Header"
    Write-ColorOutput "✓ Installed: $($installed.Count)" -Color "Success"
    if ($failed.Count -gt 0) {
        Write-ColorOutput "✗ Failed: $($failed.Count)" -Color "Warning"
        Write-ColorOutput "Failed extensions: $($failed -join ', ')" -Color "Warning"
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
        $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable

        $requiredSettings = @(
            "amazonQ.developer.enableCodeSuggestions",
            "python.analysis.typeCheckingMode",
            "editor.suggestSelection",
            "python.linting.enabled"
        )

        $allPresent = $true
        foreach ($setting in $requiredSettings) {
            if ($settings.ContainsKey($setting)) {
                Write-ColorOutput "✓ Found: $setting = $($settings[$setting])" -Color "Success"
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
        "⚡ Use caching and performance optimization patterns",
        "🔧 Configure your development environment consistently",
        "📖 Keep your dependencies and documentation up to date"
    )

    foreach ($tip in $tips) {
        Write-ColorOutput $tip -Color "Info"
    }

    Write-Host ""
    Write-ColorOutput "For best results with Amazon Q:" -Color "Header"
    Write-ColorOutput "• Write clear, well-documented code" -Color "Success"
    Write-ColorOutput "• Use consistent coding patterns" -Color "Success"
    Write-ColorOutput "• Provide rich context in comments and docstrings" -Color "Success"
    Write-ColorOutput "• Follow established best practices" -Color "Success"
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
        # Backup current settings if requested
        $backupPath = $null
        if ($Backup -or (-not $Backup -and (Test-Path $settingsPath))) {
            $backupPath = Backup-CurrentSettings -SettingsPath $settingsPath
            if ($backupPath) {
                Write-ColorOutput "Settings backed up to: $backupPath" -Color "Info"
            }
        }
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
        Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" -Color "Error"
        return 1
    }
}

# Execute main function
exit (Main)
