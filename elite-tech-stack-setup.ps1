# Elite Tech Stack Setup - Advanced Programming Tools & Resources
# Comprehensive setup for unrestricted elite development environment

param(
    [switch]$InstallAll = $false,
    [switch]$VSCodeExtensions = $false,
    [switch]$DevTools = $false,
    [switch]$CloudTools = $false,
    [switch]$DatabaseTools = $false,
    [switch]$SecurityTools = $false,
    [switch]$AITools = $false
)

# Elite Tech Stack Configuration
$techStack = @{
    # Essential VS Code Extensions
    VSCodeExtensions = @(
        # Core AI & Productivity
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "TabNine.tabnine-vscode",
        "WallabyJs.quokka-vscode",
        "WallabyJs.console-ninja",

        # Languages & Frameworks
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bmewburn.vscode-intelephense-client",
        "denoland.vscode-deno",
        "golang.go",
        "rust-lang.rust-analyzer",
        "ms-dotnettools.csharp",
        "redhat.java",

        # Docker & Cloud
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools",
        "ms-vscode-remote.remote-containers",
        "ms-vscode.azure-account",
        "amazonwebservices.aws-toolkit-vscode",
        "GoogleCloudTools.cloudcode",

        # Database & APIs
        "ms-mssql.mssql",
        "Oracle.oracledevtools",
        "humao.rest-client",
        "rangav.vscode-thunder-client",
        "cweijan.vscode-mysql-client2",
        "ms-ossdata.vscode-postgresql",
        "mongodb.mongodb-vscode",

        # Git & Version Control
        "eamodio.gitlens",
        "GitHub.vscode-pull-request-github",
        "mhutchie.git-graph",

        # Testing & Quality
        "ms-vscode.test-adapter-converter",
        "hbenl.vscode-test-explorer",
        "ryanluker.vscode-coverage-gutters",
        "SonarSource.sonarlint-vscode",
        "ms-vscode.vscode-jest",

        # Themes & UI
        "PKief.material-icon-theme",
        "GitHub.github-vscode-theme",
        "dracula-theme.theme-dracula",
        "monokai.theme-monokai-pro-vscode",

        # Security & Secrets
        "hashicorp.terraform",
        "ms-vscode.vscode-json",
        "redhat.vscode-yaml",
        "ms-kubernetes-tools.vscode-aks-tools",

        # Advanced Development
        "ms-vscode.vscode-embedded-tools",
        "platformio.platformio-ide",
        "ms-vscode.hexeditor",
        "ms-vscode.remote-explorer",
        "ms-vscode-remote.remote-ssh",
        "ms-vscode-remote.remote-wsl",

        # Documentation & Writing
        "yzhang.markdown-all-in-one",
        "DavidAnson.vscode-markdownlint",
        "bierner.markdown-mermaid",
        "streetsidesoftware.code-spell-checker"
    )

    # Development Tools via Package Managers
    ChocoPackages = @(
        # Core Development
        "git",
        "nodejs",
        "python",
        "golang",
        "rust",
        "php",
        "composer",
        "maven",
        "gradle",
        "dotnet-sdk",

        # Databases
        "mysql",
        "postgresql",
        "mongodb",
        "redis",
        "sqlite",

        # Cloud CLI Tools
        "awscli",
        "azure-cli",
        "gcloudsdk",
        "kubernetes-cli",
        "helm",
        "terraform",
        "ansible",

        # Development Utilities
        "docker-desktop",
        "virtualbox",
        "vagrant",
        "wireshark",
        "postman",
        "insomnia-rest-api-client",
        "fiddler",

        # Security Tools
        "nmap",
        "burp-suite-free-edition",
        "gpg4win",
        "openssh",

        # Text Editors & IDEs
        "jetbrains-toolbox",
        "sublimetext4",
        "notepadplusplus",
        "vim",

        # System Tools
        "7zip",
        "curl",
        "wget",
        "jq",
        "grep",
        "sed",
        "awk",
        "grep",
        "powershell-core",

        # Media & Graphics
        "ffmpeg",
        "imagemagick",
        "gimp",
        "inkscape"
    )

    # NPM Global Packages
    NPMPackages = @(
        # Build Tools
        "@vue/cli",
        "create-react-app",
        "@angular/cli",
        "next",
        "nuxt",
        "svelte",
        "vite",
        "webpack-cli",
        "parcel",
        "rollup",

        # Development Servers
        "live-server",
        "http-server",
        "serve",
        "nodemon",
        "pm2",

        # Testing
        "jest",
        "mocha",
        "cypress",
        "playwright",
        "puppeteer",

        # Code Quality
        "eslint",
        "prettier",
        "typescript",
        "ts-node",
        "tslint",
        "jshint",

        # Utilities
        "express-generator",
        "yeoman",
        "yo",
        "json-server",
        "concurrently",
        "cross-env",
        "dotenv-cli",

        # AI & ML Tools
        "tensorflow",
        "brain.js",
        "@tensorflow/tfjs-node"
    )

    # Python Packages
    PythonPackages = @(
        # Web Frameworks
        "django",
        "flask",
        "fastapi",
        "tornado",
        "pyramid",

        # Data Science & AI
        "numpy",
        "pandas",
        "matplotlib",
        "seaborn",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "keras",
        "opencv-python",
        "pillow",

        # API & Web
        "requests",
        "httpx",
        "aiohttp",
        "websockets",
        "celery",

        # Database
        "sqlalchemy",
        "pymongo",
        "redis",
        "psycopg2",
        "mysql-connector-python",

        # Testing
        "pytest",
        "unittest2",
        "nose2",
        "coverage",

        # Utilities
        "click",
        "typer",
        "rich",
        "colorama",
        "python-dotenv",
        "pyyaml",
        "toml",
        "jsonschema"
    )

    # Rust Packages (Cargo)
    RustPackages = @(
        "cargo-watch",
        "cargo-edit",
        "cargo-outdated",
        "cargo-audit",
        "tokio",
        "serde",
        "reqwest",
        "clap",
        "log",
        "env_logger"
    )

    # Go Packages
    GoPackages = @(
        "github.com/gorilla/mux",
        "github.com/gin-gonic/gin",
        "github.com/labstack/echo/v4",
        "gorm.io/gorm",
        "github.com/spf13/cobra",
        "github.com/spf13/viper"
    )
}

# Logging function
function Write-EliteLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $colorMap = @{
        "INFO" = "Green"
        "WARN" = "Yellow"
        "ERROR" = "Red"
        "SUCCESS" = "Cyan"
        "HEADER" = "Magenta"
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $colorMap[$Level]
}

# Install VS Code Extensions
function Install-VSCodeExtensions {
    Write-EliteLog "Installing Elite VS Code Extensions..." "HEADER"

    if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
        Write-EliteLog "VS Code not found in PATH. Please install VS Code first." "ERROR"
        return
    }

    foreach ($extension in $techStack.VSCodeExtensions) {
        try {
            Write-EliteLog "Installing extension: $extension" "INFO"
            & code --install-extension $extension --force
            Write-EliteLog "Successfully installed: $extension" "SUCCESS"
        }
        catch {
            Write-EliteLog "Failed to install: $extension - $($_.Exception.Message)" "ERROR"
        }
    }
}

# Install Chocolatey packages
function Install-ChocoPackages {
    Write-EliteLog "Installing Development Tools via Chocolatey..." "HEADER"

    # Check if Chocolatey is installed
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-EliteLog "Installing Chocolatey..." "INFO"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }

    foreach ($package in $techStack.ChocoPackages) {
        try {
            Write-EliteLog "Installing package: $package" "INFO"
            & choco install $package -y
            Write-EliteLog "Successfully installed: $package" "SUCCESS"
        }
        catch {
            Write-EliteLog "Failed to install: $package - $($_.Exception.Message)" "ERROR"
        }
    }
}

# Install NPM packages
function Install-NPMPackages {
    Write-EliteLog "Installing Global NPM Packages..." "HEADER"

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-EliteLog "NPM not found. Installing Node.js first..." "WARN"
        & choco install nodejs -y
    }

    foreach ($package in $techStack.NPMPackages) {
        try {
            Write-EliteLog "Installing NPM package: $package" "INFO"
            & npm install -g $package
            Write-EliteLog "Successfully installed: $package" "SUCCESS"
        }
        catch {
            Write-EliteLog "Failed to install: $package - $($_.Exception.Message)" "ERROR"
        }
    }
}

# Install Python packages
function Install-PythonPackages {
    Write-EliteLog "Installing Python Packages..." "HEADER"

    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-EliteLog "Python not found. Installing Python first..." "WARN"
        & choco install python -y
    }

    # Upgrade pip first
    & python -m pip install --upgrade pip

    foreach ($package in $techStack.PythonPackages) {
        try {
            Write-EliteLog "Installing Python package: $package" "INFO"
            & python -m pip install $package
            Write-EliteLog "Successfully installed: $package" "SUCCESS"
        }
        catch {
            Write-EliteLog "Failed to install: $package - $($_.Exception.Message)" "ERROR"
        }
    }
}

# Install Rust packages
function Install-RustPackages {
    Write-EliteLog "Installing Rust Packages..." "HEADER"

    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        Write-EliteLog "Rust not found. Installing Rust first..." "WARN"
        & choco install rust -y
    }

    foreach ($package in $techStack.RustPackages) {
        try {
            Write-EliteLog "Installing Rust package: $package" "INFO"
            & cargo install $package
            Write-EliteLog "Successfully installed: $package" "SUCCESS"
        }
        catch {
            Write-EliteLog "Failed to install: $package - $($_.Exception.Message)" "ERROR"
        }
    }
}

# Install Go packages
function Install-GoPackages {
    Write-EliteLog "Installing Go Packages..." "HEADER"

    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        Write-EliteLog "Go not found. Installing Go first..." "WARN"
        & choco install golang -y
    }

    foreach ($package in $techStack.GoPackages) {
        try {
            Write-EliteLog "Installing Go package: $package" "INFO"
            & go install $package@latest
            Write-EliteLog "Successfully installed: $package" "SUCCESS"
        }
        catch {
            Write-EliteLog "Failed to install: $package - $($_.Exception.Message)" "ERROR"
        }
    }
}

# Configure development environment
function Configure-DevEnvironment {
    Write-EliteLog "Configuring Elite Development Environment..." "HEADER"

    # Create development directories
    $devDirs = @(
        "$env:USERPROFILE\Development",
        "$env:USERPROFILE\Development\Projects",
        "$env:USERPROFILE\Development\Tools",
        "$env:USERPROFILE\Development\Scripts",
        "$env:USERPROFILE\Development\Docker",
        "$env:USERPROFILE\Development\APIs",
        "$env:USERPROFILE\Development\Databases"
    )

    foreach ($dir in $devDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-EliteLog "Created directory: $dir" "SUCCESS"
        }
    }

    # Set up Git global configuration
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-EliteLog "Configuring Git..." "INFO"

        # Basic Git configuration (user will need to customize)
        & git config --global init.defaultBranch main
        & git config --global pull.rebase false
        & git config --global core.autocrlf true
        & git config --global core.editor "code --wait"

        Write-EliteLog "Git configuration completed" "SUCCESS"
    }

    # Create elite development profile script
    $profileScript = @"
# Elite Development Environment Profile
# Add to your PowerShell profile: $PROFILE

# Aliases for common development tasks
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name grep -Value Select-String
Set-Alias -Name touch -Value New-Item

# Functions for quick project setup
function New-NodeProject {
    param([string]`$Name)
    mkdir `$Name
    cd `$Name
    npm init -y
    npm install express
    code .
}

function New-PythonProject {
    param([string]`$Name)
    mkdir `$Name
    cd `$Name
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install flask requests
    code .
}

function New-ReactApp {
    param([string]`$Name)
    npx create-react-app `$Name
    cd `$Name
    code .
}

function Start-DevServers {
    # Start common development services
    docker start redis-dev 2>`$null
    docker start mongo-dev 2>`$null
    docker start postgres-dev 2>`$null
}

# Environment variables for development
`$env:DEVELOPMENT_MODE = "true"
`$env:NODE_ENV = "development"

Write-Host "Elite Development Environment Loaded" -ForegroundColor Green
"@

    $profileScript | Out-File -FilePath "$env:USERPROFILE\Development\Scripts\elite-profile.ps1" -Encoding UTF8
    Write-EliteLog "Created elite development profile script" "SUCCESS"
}

# Create development containers configuration
function Setup-DevContainers {
    Write-EliteLog "Setting up Development Containers..." "HEADER"

    $containerDir = "$env:USERPROFILE\Development\Docker"

    # Docker Compose for development services
    $dockerCompose = @"
version: '3.8'
services:
  redis-dev:
    image: redis:alpine
    container_name: redis-dev
    ports:
      - "6379:6379"
    restart: unless-stopped

  mongo-dev:
    image: mongo:latest
    container_name: mongo-dev
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  postgres-dev:
    image: postgres:13
    container_name: postgres-dev
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: devdb
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: devpass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  mysql-dev:
    image: mysql:8.0
    container_name: mysql-dev
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: devdb
      MYSQL_USER: developer
      MYSQL_PASSWORD: devpass
    volumes:
      - mysql-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mongo-data:
  postgres-data:
  mysql-data:
"@

    $dockerCompose | Out-File -FilePath "$containerDir\docker-compose.yml" -Encoding UTF8
    Write-EliteLog "Created development Docker Compose configuration" "SUCCESS"
}

# Main menu
function Show-Menu {
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "                    ELITE TECH STACK SETUP                        " -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Select installation options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Install All (Complete Elite Setup)" -ForegroundColor Cyan
    Write-Host "2. VS Code Extensions Only" -ForegroundColor Cyan
    Write-Host "3. Development Tools (Chocolatey)" -ForegroundColor Cyan
    Write-Host "4. NPM Global Packages" -ForegroundColor Cyan
    Write-Host "5. Python Packages" -ForegroundColor Cyan
    Write-Host "6. Rust Packages" -ForegroundColor Cyan
    Write-Host "7. Go Packages" -ForegroundColor Cyan
    Write-Host "8. Configure Environment" -ForegroundColor Cyan
    Write-Host "9. Setup Dev Containers" -ForegroundColor Cyan
    Write-Host "10. Exit" -ForegroundColor Red
    Write-Host ""
}

# Main execution
if ($InstallAll) {
    Install-VSCodeExtensions
    Install-ChocoPackages
    Install-NPMPackages
    Install-PythonPackages
    Install-RustPackages
    Install-GoPackages
    Configure-DevEnvironment
    Setup-DevContainers
    Write-EliteLog "Elite Tech Stack Setup Completed!" "SUCCESS"
} elseif ($VSCodeExtensions) {
    Install-VSCodeExtensions
} elseif ($DevTools) {
    Install-ChocoPackages
} else {
    do {
        Show-Menu
        $choice = Read-Host "Enter your choice (1-10)"

        switch ($choice) {
            "1" {
                Install-VSCodeExtensions
                Install-ChocoPackages
                Install-NPMPackages
                Install-PythonPackages
                Install-RustPackages
                Install-GoPackages
                Configure-DevEnvironment
                Setup-DevContainers
            }
            "2" { Install-VSCodeExtensions }
            "3" { Install-ChocoPackages }
            "4" { Install-NPMPackages }
            "5" { Install-PythonPackages }
            "6" { Install-RustPackages }
            "7" { Install-GoPackages }
            "8" { Configure-DevEnvironment }
            "9" { Setup-DevContainers }
            "10" {
                Write-EliteLog "Exiting Elite Tech Stack Setup" "SUCCESS"
                break
            }
            default { Write-EliteLog "Invalid choice. Please select 1-10." "WARN" }
        }
    } while ($choice -ne "10")
}
