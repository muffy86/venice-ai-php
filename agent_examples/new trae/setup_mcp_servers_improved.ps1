#Requires -Version 5.1
<#
.SYNOPSIS
    MCP Servers Setup Script for Trae AI
.DESCRIPTION
    This script configures MCP (Model Context Protocol) servers for Trae AI with improved error handling,
    logging, and modularity.
.PARAMETER ConfigPath
    Path to the MCP configuration file (default: .\mcp_servers_config.json)
.PARAMETER SkipServerTest
    Skip testing of MCP servers during setup
.PARAMETER LogPath
    Path to write log file (default: .\mcp_setup.log)
.EXAMPLE
    .\setup_mcp_servers_improved.ps1
.EXAMPLE
    .\setup_mcp_servers_improved.ps1 -ConfigPath ".\custom_config.json" -SkipServerTest
#>

[CmdletBinding()]
param(
    [Parameter(HelpMessage = "Path to MCP configuration file")]
    [ValidateScript({Test-Path $_ -PathType Leaf})]
    [string]$ConfigPath = ".\mcp_servers_config.json",

    [Parameter(HelpMessage = "Skip MCP server testing")]
    [switch]$SkipServerTest,

    [Parameter(HelpMessage = "Path for log file")]
    [string]$LogPath = ".\mcp_setup.log"
)

# Script configuration
$ErrorActionPreference = 'Stop'
$Script:LogPath = $LogPath
$Script:ExitCode = 0

# Define color scheme for consistent output
$Colors = @{
    Header = 'Cyan'
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'White'
    Emphasis = 'Magenta'
}

#region Utility Functions

function Write-LogMessage {
    <#
    .SYNOPSIS
        Writes message to both console and log file
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$Message,

        [Parameter()]
        [ValidateSet('Info', 'Warning', 'Error', 'Success', 'Header')]
        [string]$Level = 'Info',

        [Parameter()]
        [switch]$NoNewline
    )

    process {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logEntry = "[$timestamp] [$Level] $Message"

        # Write to log file
        try {
            Add-Content -Path $Script:LogPath -Value $logEntry -ErrorAction SilentlyContinue
        }
        catch {
            # Silently continue if logging fails
        }

        # Write to console with appropriate color
        $color = $Colors[$Level]
        if ($NoNewline) {
            Write-Host $Message -ForegroundColor $color -NoNewline
        }
        else {
            Write-Host $Message -ForegroundColor $color
        }
    }
}

function Test-Prerequisites {
    <#
    .SYNOPSIS
        Tests if required software is installed
    #>
    [CmdletBinding()]
    param()

    Write-LogMessage "📦 Checking prerequisites..." -Level Header

    $prerequisites = @(
        @{
            Name = "Node.js"
            Command = "node"
            Args = "--version"
            Url = "https://nodejs.org/"
        },
        @{
            Name = "npm"
            Command = "npm"
            Args = "--version"
            Url = "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"
        }
    )

    foreach ($prereq in $prerequisites) {
        try {
            Write-LogMessage "Checking $($prereq.Name)..." -Level Info
            $version = & $prereq.Command $prereq.Args 2>$null

            if ($LASTEXITCODE -eq 0 -and $version) {
                Write-LogMessage "✅ $($prereq.Name) is installed: $version" -Level Success
            }
            else {
                throw "Command failed or returned empty result"
            }
        }
        catch {
            Write-LogMessage "❌ $($prereq.Name) is not installed or not accessible" -Level Error
            Write-LogMessage "Please install $($prereq.Name) from: $($prereq.Url)" -Level Warning
            return $false
        }
    }

    return $true
}

function Get-TraeSettingsPath {
    <#
    .SYNOPSIS
        Gets the Trae settings path with validation
    #>
    [CmdletBinding()]
    param()

    $settingsPath = Join-Path $env:APPDATA "Trae\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"
    Write-LogMessage "📁 Trae settings path: $settingsPath" -Level Info

    return $settingsPath
}

function Initialize-SettingsDirectory {
    <#
    .SYNOPSIS
        Creates the settings directory if it doesn't exist
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$SettingsPath
    )

    $settingsDir = Split-Path $SettingsPath -Parent

    if (-not (Test-Path $settingsDir)) {
        Write-LogMessage "📁 Creating settings directory..." -Level Info
        try {
            New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
            Write-LogMessage "✅ Settings directory created successfully" -Level Success
        }
        catch {
            Write-LogMessage "❌ Failed to create settings directory: $($_.Exception.Message)" -Level Error
            throw
        }
    }
    else {
        Write-LogMessage "✅ Settings directory already exists" -Level Success
    }
}

function Copy-Configuration {
    <#
    .SYNOPSIS
        Copies MCP configuration to Trae settings
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$SourcePath,

        [Parameter(Mandatory)]
        [string]$DestinationPath
    )

    Write-LogMessage "📋 Copying MCP configuration..." -Level Info
    Write-LogMessage "Source: $SourcePath" -Level Info
    Write-LogMessage "Destination: $DestinationPath" -Level Info

    try {
        # Validate source file exists and is readable
        if (-not (Test-Path $SourcePath)) {
            throw "Source configuration file not found: $SourcePath"
        }

        # Test if source file is valid JSON
        $configContent = Get-Content $SourcePath -Raw | ConvertFrom-Json
        Write-LogMessage "✅ Configuration file is valid JSON" -Level Success

        # Create backup if destination exists
        if (Test-Path $DestinationPath) {
            $backupPath = "$DestinationPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item $DestinationPath $backupPath
            Write-LogMessage "📄 Created backup: $backupPath" -Level Warning
        }

        Copy-Item $SourcePath $DestinationPath -Force
        Write-LogMessage "✅ Configuration copied successfully" -Level Success
    }
    catch {
        Write-LogMessage "❌ Failed to copy configuration: $($_.Exception.Message)" -Level Error
        throw
    }
}

function Test-McpServers {
    <#
    .SYNOPSIS
        Tests accessibility of basic MCP servers
    #>
    [CmdletBinding()]
    param()

    Write-LogMessage "🧪 Testing MCP servers accessibility..." -Level Header

    $basicServers = @(
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-fetch",
        "@modelcontextprotocol/server-memory",
        "@modelcontextprotocol/server-sequential-thinking"
    )

    $results = @()

    foreach ($server in $basicServers) {
        Write-LogMessage "Testing $server..." -Level Info

        try {
            # Test server accessibility with timeout
            $job = Start-Job -ScriptBlock {
                param($serverName)
                try {
                    $result = & npx -y $serverName --help 2>$null
                    return @{ Success = $true; Output = $result }
                }
                catch {
                    return @{ Success = $false; Error = $_.Exception.Message }
                }
            } -ArgumentList $server

            # Wait for job with timeout
            $timeout = Wait-Job $job -Timeout 30

            if ($timeout) {
                $jobResult = Receive-Job $job
                Remove-Job $job

                if ($jobResult.Success) {
                    Write-LogMessage "✅ $server is accessible" -Level Success
                    $results += @{ Server = $server; Status = "Success" }
                }
                else {
                    Write-LogMessage "⚠️ $server may need additional setup" -Level Warning
                    $results += @{ Server = $server; Status = "Warning" }
                }
            }
            else {
                Remove-Job $job -Force
                Write-LogMessage "⏰ $server test timed out" -Level Warning
                $results += @{ Server = $server; Status = "Timeout" }
            }
        }
        catch {
            Write-LogMessage "❌ Failed to test $server`: $($_.Exception.Message)" -Level Error
            $results += @{ Server = $server; Status = "Error" }
        }
    }

    # Summary
    $successful = ($results | Where-Object { $_.Status -eq "Success" }).Count
    $total = $results.Count
    Write-LogMessage "📊 Server test summary: $successful/$total servers accessible" -Level Info

    return $results
}

function Show-NextSteps {
    <#
    .SYNOPSIS
        Displays next steps for the user
    #>
    [CmdletBinding()]
    param(
        [Parameter()]
        [string]$SettingsPath
    )

    Write-LogMessage "`n🔧 Next Steps:" -Level Header

    $steps = @(
        "1. Configure API keys in the settings file for servers that require them",
        "2. Restart Trae AI to load the new MCP servers",
        "3. Test the servers by asking the AI to use specific capabilities",
        "4. Check the MCP_Setup_Guide.md for detailed configuration instructions",
        "5. Review the log file at: $Script:LogPath"
    )

    foreach ($step in $steps) {
        Write-LogMessage $step -Level Info
    }

    # Offer to open settings file
    if ($SettingsPath -and (Test-Path $SettingsPath)) {
        Write-LogMessage "`nWould you like to open the MCP settings file for editing? (y/n): " -Level Emphasis -NoNewline
        $response = Read-Host

        if ($response -match '^[Yy]') {
            try {
                if (Get-Command code -ErrorAction SilentlyContinue) {
                    Start-Process code $SettingsPath
                    Write-LogMessage "📝 Opening settings in VS Code..." -Level Success
                }
                elseif (Get-Command notepad -ErrorAction SilentlyContinue) {
                    Start-Process notepad $SettingsPath
                    Write-LogMessage "📝 Opening settings in Notepad..." -Level Success
                }
                else {
                    Write-LogMessage "⚠️ No suitable text editor found. Please open: $SettingsPath" -Level Warning
                }
            }
            catch {
                Write-LogMessage "❌ Failed to open settings file: $($_.Exception.Message)" -Level Error
            }
        }
    }
}

#endregion

#region Main Script

function Invoke-McpSetup {
    <#
    .SYNOPSIS
        Main setup function
    #>
    [CmdletBinding()]
    param()

    try {
        # Initialize logging
        Write-LogMessage "🚀 MCP Servers Setup Script - Started" -Level Header
        Write-LogMessage "================================" -Level Header
        Write-LogMessage "Log file: $Script:LogPath" -Level Info

        # Check prerequisites
        if (-not (Test-Prerequisites)) {
            $Script:ExitCode = 1
            return
        }

        # Validate configuration file
        if (-not (Test-Path $ConfigPath)) {
            Write-LogMessage "❌ Configuration file not found: $ConfigPath" -Level Error
            Write-LogMessage "Please ensure the configuration file exists in the specified location." -Level Warning
            $Script:ExitCode = 1
            return
        }

        # Get Trae settings path
        $settingsPath = Get-TraeSettingsPath

        # Initialize settings directory
        Initialize-SettingsDirectory -SettingsPath $settingsPath

        # Copy configuration
        Copy-Configuration -SourcePath $ConfigPath -DestinationPath $settingsPath

        # Test MCP servers (unless skipped)
        if (-not $SkipServerTest) {
            $testResults = Test-McpServers
        }
        else {
            Write-LogMessage "⏭️ Skipping MCP server tests" -Level Warning
        }

        # Show next steps
        Show-NextSteps -SettingsPath $settingsPath

        Write-LogMessage "`n🎉 Setup completed successfully!" -Level Success

    }
    catch {
        Write-LogMessage "❌ Setup failed: $($_.Exception.Message)" -Level Error
        Write-LogMessage "Stack trace: $($_.ScriptStackTrace)" -Level Error
        $Script:ExitCode = 1
    }
    finally {
        Write-LogMessage "`nPress any key to exit..." -Level Info
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

#endregion

# Script entry point
if ($MyInvocation.InvocationName -ne '.') {
    Invoke-McpSetup
    exit $Script:ExitCode
}
