#!/usr/bin/env python3
"""
TREA AGENT ZERO - ADVANCED ENVIRONMENT SETUP
Enterprise-Grade AI Automation System Setup Script

This script sets up a complete production-ready AI agent environment with:
- Multi-agent frameworks (LangChain, CrewAI, AutoGen)
- Vector databases (Qdrant, ChromaDB, Pinecone)
- Monitoring & observability (Prometheus, Grafana, Jaeger)
- Container orchestration (Docker, Kubernetes)
- Cloud infrastructure (AWS, Azure, GCP)
"""

import os
import sys
import subprocess
import platform
import json
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Optional
import requests
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('setup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class AdvancedSetup:
    """Advanced AI environment setup orchestrator"""
    
    def __init__(self):
        self.os_type = platform.system().lower()
        self.arch = platform.machine().lower()
        self.python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
        self.setup_dir = Path.cwd()
        self.config = self.load_config()
        
    def load_config(self) -> Dict:
        """Load setup configuration"""
        return {
            "python_packages": {
                "ai_frameworks": [
                    "langchain==0.1.0",
                    "langchain-community==0.0.13",
                    "langgraph==0.0.26",
                    "crewai==0.22.5",
                    "autogen-agentchat==0.2.0",
                    "openai==1.12.0",
                    "anthropic==0.8.1",
                    "google-generativeai==0.3.2",
                    "cohere==4.39.0"
                ],
                "vector_databases": [
                    "qdrant-client==1.7.0",
                    "chromadb==0.4.22",
                    "pinecone-client==3.0.0",
                    "weaviate-client==3.25.3",
                    "milvus==2.3.4"
                ],
                "web_framework": [
                    "fastapi==0.109.0",
                    "uvicorn[standard]==0.27.0",
                    "pydantic==2.5.3",
                    "sqlalchemy==2.0.25",
                    "alembic==1.13.1"
                ],
                "monitoring": [
                    "prometheus-client==0.19.0",
                    "structlog==23.2.0",
                    "opentelemetry-api==1.22.0",
                    "opentelemetry-sdk==1.22.0",
                    "opentelemetry-instrumentation-fastapi==0.43b0"
                ],
                "cloud_providers": [
                    "boto3==1.34.34",
                    "azure-identity==1.15.0",
                    "azure-storage-blob==12.19.0",
                    "google-cloud-storage==2.10.0",
                    "kubernetes==29.0.0"
                ],
                "data_processing": [
                    "pandas==2.2.0",
                    "numpy==1.26.3",
                    "scipy==1.12.0",
                    "scikit-learn==1.4.0",
                    "torch==2.1.2",
                    "transformers==4.37.2"
                ],
                "utilities": [
                    "redis==5.0.1",
                    "celery==5.3.6",
                    "httpx==0.26.0",
                    "aiofiles==23.2.1",
                    "python-multipart==0.0.6",
                    "python-jose[cryptography]==3.3.0",
                    "passlib[bcrypt]==1.7.4",
                    "tenacity==8.2.3"
                ]
            },
            "system_tools": {
                "docker": "24.0.7",
                "docker_compose": "2.24.0",
                "kubectl": "1.29.0",
                "terraform": "1.6.6",
                "helm": "3.14.0"
            },
            "services": {
                "qdrant": {"port": 6333, "version": "v1.7.4"},
                "redis": {"port": 6379, "version": "7.2-alpine"},
                "postgres": {"port": 5432, "version": "16-alpine"},
                "prometheus": {"port": 9090, "version": "v2.48.1"},
                "grafana": {"port": 3000, "version": "10.2.3"},
                "jaeger": {"port": 16686, "version": "1.52"}
            }
        }
    
    async def setup_environment(self):
        """Main setup orchestrator"""
        logger.info("🚀 Starting TREA Agent Zero Advanced Setup")
        
        try:
            # System preparation
            await self.prepare_system()
            
            # Install system tools
            await self.install_system_tools()
            
            # Setup Python environment
            await self.setup_python_environment()
            
            # Install Python packages
            await self.install_python_packages()
            
            # Setup services
            await self.setup_services()
            
            # Generate configuration files
            await self.generate_config_files()
            
            # Setup monitoring
            await self.setup_monitoring()
            
            # Create project structure
            await self.create_project_structure()
            
            # Run health checks
            await self.run_health_checks()
            
            logger.info("✅ Setup completed successfully!")
            await self.print_summary()
            
        except Exception as e:
            logger.error(f"❌ Setup failed: {e}")
            raise
    
    async def prepare_system(self):
        """Prepare system for installation"""
        logger.info("📋 Preparing system...")
        
        if self.os_type == "linux":
            await self.run_command("sudo apt-get update")
            await self.run_command("sudo apt-get install -y curl wget git build-essential")
        elif self.os_type == "darwin":
            # Check if Homebrew is installed
            if not await self.command_exists("brew"):
                logger.info("Installing Homebrew...")
                await self.run_command('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
        elif self.os_type == "windows":
            # Check if Chocolatey is installed
            if not await self.command_exists("choco"):
                logger.info("Installing Chocolatey...")
                await self.run_command('powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))"')
    
    async def install_system_tools(self):
        """Install system-level tools"""
        logger.info("🔧 Installing system tools...")
        
        tools = self.config["system_tools"]
        
        # Docker
        if not await self.command_exists("docker"):
            await self.install_docker()
        
        # Docker Compose
        if not await self.command_exists("docker-compose"):
            await self.install_docker_compose()
        
        # Kubernetes CLI
        if not await self.command_exists("kubectl"):
            await self.install_kubectl()
        
        # Terraform
        if not await self.command_exists("terraform"):
            await self.install_terraform()
        
        # Helm
        if not await self.command_exists("helm"):
            await self.install_helm()
    
    async def install_docker(self):
        """Install Docker"""
        logger.info("🐳 Installing Docker...")
        
        if self.os_type == "linux":
            commands = [
                "curl -fsSL https://get.docker.com -o get-docker.sh",
                "sudo sh get-docker.sh",
                "sudo usermod -aG docker $USER",
                "rm get-docker.sh"
            ]
            for cmd in commands:
                await self.run_command(cmd)
        elif self.os_type == "darwin":
            await self.run_command("brew install --cask docker")
        elif self.os_type == "windows":
            await self.run_command("choco install docker-desktop -y")
    
    async def install_docker_compose(self):
        """Install Docker Compose"""
        logger.info("🐙 Installing Docker Compose...")
        
        if self.os_type in ["linux", "darwin"]:
            version = self.config["system_tools"]["docker_compose"]
            url = f"https://github.com/docker/compose/releases/download/v{version}/docker-compose-{self.os_type}-{self.arch}"
            await self.run_command(f"sudo curl -L {url} -o /usr/local/bin/docker-compose")
            await self.run_command("sudo chmod +x /usr/local/bin/docker-compose")
        elif self.os_type == "windows":
            await self.run_command("choco install docker-compose -y")
    
    async def install_kubectl(self):
        """Install Kubernetes CLI"""
        logger.info("☸️ Installing kubectl...")
        
        if self.os_type == "linux":
            commands = [
                "curl -LO https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl",
                "sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl",
                "rm kubectl"
            ]
            for cmd in commands:
                await self.run_command(cmd)
        elif self.os_type == "darwin":
            await self.run_command("brew install kubectl")
        elif self.os_type == "windows":
            await self.run_command("choco install kubernetes-cli -y")
    
    async def install_terraform(self):
        """Install Terraform"""
        logger.info("🏗️ Installing Terraform...")
        
        if self.os_type == "linux":
            commands = [
                "wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
                'echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list',
                "sudo apt update && sudo apt install terraform"
            ]
            for cmd in commands:
                await self.run_command(cmd)
        elif self.os_type == "darwin":
            await self.run_command("brew install terraform")
        elif self.os_type == "windows":
            await self.run_command("choco install terraform -y")
    
    async def install_helm(self):
        """Install Helm"""
        logger.info("⛵ Installing Helm...")
        
        if self.os_type in ["linux", "darwin"]:
            await self.run_command("curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash")
        elif self.os_type == "windows":
            await self.run_command("choco install kubernetes-helm -y")
    
    async def setup_python_environment(self):
        """Setup Python virtual environment"""
        logger.info("🐍 Setting up Python environment...")
        
        # Create virtual environment
        venv_path = self.setup_dir / "venv"
        if not venv_path.exists():
            await self.run_command(f"python{self.python_version} -m venv {venv_path}")
        
        # Activate virtual environment
        if self.os_type == "windows":
            self.python_cmd = str(venv_path / "Scripts" / "python.exe")
            self.pip_cmd = str(venv_path / "Scripts" / "pip.exe")
        else:
            self.python_cmd = str(venv_path / "bin" / "python")
            self.pip_cmd = str(venv_path / "bin" / "pip")
        
        # Upgrade pip
        await self.run_command(f"{self.pip_cmd} install --upgrade pip setuptools wheel")
    
    async def install_python_packages(self):
        """Install Python packages"""
        logger.info("📦 Installing Python packages...")
        
        # Install packages by category
        for category, packages in self.config["python_packages"].items():
            logger.info(f"Installing {category} packages...")
            for package in packages:
                try:
                    await self.run_command(f"{self.pip_cmd} install {package}")
                except Exception as e:
                    logger.warning(f"Failed to install {package}: {e}")
        
        # Generate requirements.txt
        await self.run_command(f"{self.pip_cmd} freeze > requirements.txt")
    
    async def setup_services(self):
        """Setup required services using Docker"""
        logger.info("🔧 Setting up services...")
        
        # Create docker-compose.yml
        docker_compose = self.generate_docker_compose()
        with open("docker-compose.yml", "w") as f:
            yaml.dump(docker_compose, f, default_flow_style=False)
        
        # Start services
        await self.run_command("docker-compose up -d")
        
        # Wait for services to be ready
        await asyncio.sleep(30)
        
        # Verify services
        await self.verify_services()
    
    def generate_docker_compose(self) -> Dict:
        """Generate Docker Compose configuration"""
        services = self.config["services"]
        
        return {
            "version": "3.8",
            "services": {
                "qdrant": {
                    "image": f"qdrant/qdrant:{services['qdrant']['version']}",
                    "ports": [f"{services['qdrant']['port']}:6333"],
                    "volumes": ["qdrant_data:/qdrant/storage"],
                    "environment": [
                        "QDRANT__SERVICE__HTTP_PORT=6333",
                        "QDRANT__CLUSTER__ENABLED=false"
                    ]
                },
                "redis": {
                    "image": f"redis:{services['redis']['version']}",
                    "ports": [f"{services['redis']['port']}:6379"],
                    "volumes": ["redis_data:/data"],
                    "command": "redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru"
                },
                "postgres": {
                    "image": f"postgres:{services['postgres']['version']}",
                    "ports": [f"{services['postgres']['port']}:5432"],
                    "volumes": ["postgres_data:/var/lib/postgresql/data"],
                    "environment": [
                        "POSTGRES_DB=trea_db",
                        "POSTGRES_USER=trea_user",
                        "POSTGRES_PASSWORD=trea_password"
                    ]
                },
                "prometheus": {
                    "image": f"prom/prometheus:{services['prometheus']['version']}",
                    "ports": [f"{services['prometheus']['port']}:9090"],
                    "volumes": [
                        "./prometheus.yml:/etc/prometheus/prometheus.yml",
                        "prometheus_data:/prometheus"
                    ],
                    "command": [
                        "--config.file=/etc/prometheus/prometheus.yml",
                        "--storage.tsdb.path=/prometheus",
                        "--web.console.libraries=/etc/prometheus/console_libraries",
                        "--web.console.templates=/etc/prometheus/consoles",
                        "--storage.tsdb.retention.time=200h",
                        "--web.enable-lifecycle"
                    ]
                },
                "grafana": {
                    "image": f"grafana/grafana:{services['grafana']['version']}",
                    "ports": [f"{services['grafana']['port']}:3000"],
                    "volumes": [
                        "grafana_data:/var/lib/grafana",
                        "./grafana/provisioning:/etc/grafana/provisioning"
                    ],
                    "environment": [
                        "GF_SECURITY_ADMIN_PASSWORD=admin123",
                        "GF_USERS_ALLOW_SIGN_UP=false"
                    ]
                },
                "jaeger": {
                    "image": f"jaegertracing/all-in-one:{services['jaeger']['version']}",
                    "ports": [
                        f"{services['jaeger']['port']}:16686",
                        "14268:14268"
                    ],
                    "environment": [
                        "COLLECTOR_OTLP_ENABLED=true"
                    ]
                }
            },
            "volumes": {
                "qdrant_data": {},
                "redis_data": {},
                "postgres_data": {},
                "prometheus_data": {},
                "grafana_data": {}
            }
        }
    
    async def verify_services(self):
        """Verify that all services are running"""
        logger.info("🔍 Verifying services...")
        
        services_to_check = [
            ("Qdrant", "http://localhost:6333/health"),
            ("Prometheus", "http://localhost:9090/-/healthy"),
            ("Grafana", "http://localhost:3000/api/health"),
            ("Jaeger", "http://localhost:16686/")
        ]
        
        for service_name, url in services_to_check:
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    logger.info(f"✅ {service_name} is healthy")
                else:
                    logger.warning(f"⚠️ {service_name} returned status {response.status_code}")
            except Exception as e:
                logger.error(f"❌ {service_name} health check failed: {e}")
    
    async def generate_config_files(self):
        """Generate configuration files"""
        logger.info("📝 Generating configuration files...")
        
        # Prometheus configuration
        prometheus_config = {
            "global": {
                "scrape_interval": "15s",
                "evaluation_interval": "15s"
            },
            "scrape_configs": [
                {
                    "job_name": "trea-agent-zero",
                    "static_configs": [{"targets": ["localhost:8000"]}]
                }
            ]
        }
        
        with open("prometheus.yml", "w") as f:
            yaml.dump(prometheus_config, f, default_flow_style=False)
        
        # Environment configuration
        env_config = """# TREA Agent Zero Environment Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# Database Configuration
DATABASE_URL=postgresql://trea_user:trea_password@localhost:5432/trea_db
REDIS_URL=redis://localhost:6379/0

# Vector Database Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Monitoring Configuration
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000
JAEGER_URL=http://localhost:16686

# Security Configuration
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
DEBUG=false
LOG_LEVEL=INFO
MAX_WORKERS=4
"""
        
        with open(".env", "w") as f:
            f.write(env_config)
        
        # Kubernetes configuration
        k8s_config = self.generate_k8s_config()
        with open("k8s-deployment.yml", "w") as f:
            yaml.dump_all(k8s_config, f, default_flow_style=False)
    
    def generate_k8s_config(self) -> List[Dict]:
        """Generate Kubernetes deployment configuration"""
        return [
            {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {"name": "trea-agent-zero"},
                "spec": {
                    "replicas": 3,
                    "selector": {"matchLabels": {"app": "trea-agent-zero"}},
                    "template": {
                        "metadata": {"labels": {"app": "trea-agent-zero"}},
                        "spec": {
                            "containers": [{
                                "name": "api",
                                "image": "trea-agent-zero:latest",
                                "ports": [{"containerPort": 8000}],
                                "env": [
                                    {"name": "DATABASE_URL", "value": "postgresql://trea_user:trea_password@postgres:5432/trea_db"},
                                    {"name": "REDIS_URL", "value": "redis://redis:6379/0"},
                                    {"name": "QDRANT_URL", "value": "http://qdrant:6333"}
                                ],
                                "resources": {
                                    "requests": {"memory": "512Mi", "cpu": "250m"},
                                    "limits": {"memory": "1Gi", "cpu": "500m"}
                                }
                            }]
                        }
                    }
                }
            },
            {
                "apiVersion": "v1",
                "kind": "Service",
                "metadata": {"name": "trea-agent-zero-service"},
                "spec": {
                    "selector": {"app": "trea-agent-zero"},
                    "ports": [{"port": 80, "targetPort": 8000}],
                    "type": "LoadBalancer"
                }
            }
        ]
    
    async def setup_monitoring(self):
        """Setup monitoring and observability"""
        logger.info("📊 Setting up monitoring...")
        
        # Create Grafana provisioning directories
        grafana_dir = Path("grafana/provisioning")
        grafana_dir.mkdir(parents=True, exist_ok=True)
        
        # Grafana datasources
        datasources_config = {
            "apiVersion": 1,
            "datasources": [
                {
                    "name": "Prometheus",
                    "type": "prometheus",
                    "url": "http://prometheus:9090",
                    "access": "proxy",
                    "isDefault": True
                }
            ]
        }
        
        datasources_dir = grafana_dir / "datasources"
        datasources_dir.mkdir(exist_ok=True)
        with open(datasources_dir / "datasources.yml", "w") as f:
            yaml.dump(datasources_config, f, default_flow_style=False)
        
        # Grafana dashboards
        dashboards_config = {
            "apiVersion": 1,
            "providers": [
                {
                    "name": "default",
                    "orgId": 1,
                    "folder": "",
                    "type": "file",
                    "disableDeletion": False,
                    "updateIntervalSeconds": 10,
                    "options": {"path": "/etc/grafana/provisioning/dashboards"}
                }
            ]
        }
        
        dashboards_dir = grafana_dir / "dashboards"
        dashboards_dir.mkdir(exist_ok=True)
        with open(dashboards_dir / "dashboards.yml", "w") as f:
            yaml.dump(dashboards_config, f, default_flow_style=False)
    
    async def create_project_structure(self):
        """Create project directory structure"""
        logger.info("📁 Creating project structure...")
        
        directories = [
            "src/agents",
            "src/api",
            "src/models",
            "src/services",
            "src/utils",
            "tests/unit",
            "tests/integration",
            "docs",
            "scripts",
            "configs",
            "data/raw",
            "data/processed",
            "logs",
            "monitoring/grafana/dashboards",
            "monitoring/prometheus",
            "deployment/docker",
            "deployment/kubernetes",
            "deployment/terraform"
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
            
        # Create __init__.py files
        init_files = [
            "src/__init__.py",
            "src/agents/__init__.py",
            "src/api/__init__.py",
            "src/models/__init__.py",
            "src/services/__init__.py",
            "src/utils/__init__.py",
            "tests/__init__.py",
            "tests/unit/__init__.py",
            "tests/integration/__init__.py"
        ]
        
        for init_file in init_files:
            Path(init_file).touch()
    
    async def run_health_checks(self):
        """Run comprehensive health checks"""
        logger.info("🏥 Running health checks...")
        
        checks = [
            ("Python Environment", self.check_python_env),
            ("Docker Services", self.check_docker_services),
            ("Python Packages", self.check_python_packages),
            ("API Endpoints", self.check_api_endpoints)
        ]
        
        results = {}
        for check_name, check_func in checks:
            try:
                result = await check_func()
                results[check_name] = {"status": "✅ PASS", "details": result}
            except Exception as e:
                results[check_name] = {"status": "❌ FAIL", "details": str(e)}
        
        # Print health check results
        logger.info("Health Check Results:")
        for check_name, result in results.items():
            logger.info(f"{check_name}: {result['status']}")
            if result['status'] == "❌ FAIL":
                logger.error(f"  Details: {result['details']}")
    
    async def check_python_env(self):
        """Check Python environment"""
        result = await self.run_command(f"{self.python_cmd} --version", capture_output=True)
        return result.stdout.decode().strip()
    
    async def check_docker_services(self):
        """Check Docker services"""
        result = await self.run_command("docker-compose ps", capture_output=True)
        return "All services running" if "Up" in result.stdout.decode() else "Some services down"
    
    async def check_python_packages(self):
        """Check Python packages"""
        result = await self.run_command(f"{self.pip_cmd} list", capture_output=True)
        packages = result.stdout.decode().count('\n')
        return f"{packages} packages installed"
    
    async def check_api_endpoints(self):
        """Check API endpoints"""
        endpoints = [
            "http://localhost:6333/health",
            "http://localhost:9090/-/healthy",
            "http://localhost:3000/api/health"
        ]
        
        healthy_count = 0
        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, timeout=5)
                if response.status_code == 200:
                    healthy_count += 1
            except:
                pass
        
        return f"{healthy_count}/{len(endpoints)} endpoints healthy"
    
    async def print_summary(self):
        """Print setup summary"""
        summary = f"""
🎉 TREA Agent Zero Setup Complete!

📊 Environment Summary:
  • OS: {self.os_type.title()} ({self.arch})
  • Python: {self.python_version}
  • Project Directory: {self.setup_dir}

🔧 Installed Tools:
  • Docker & Docker Compose
  • Kubernetes CLI (kubectl)
  • Terraform
  • Helm

📦 Python Packages:
  • AI Frameworks: LangChain, CrewAI, AutoGen
  • Vector Databases: Qdrant, ChromaDB, Pinecone
  • Web Framework: FastAPI, Uvicorn
  • Monitoring: Prometheus, Grafana, Jaeger

🚀 Running Services:
  • Qdrant: http://localhost:6333
  • Redis: localhost:6379
  • PostgreSQL: localhost:5432
  • Prometheus: http://localhost:9090
  • Grafana: http://localhost:3000 (admin/admin123)
  • Jaeger: http://localhost:16686

📝 Next Steps:
  1. Update API keys in .env file
  2. Review and customize configuration files
  3. Start developing your AI agents
  4. Deploy using Docker Compose or Kubernetes

📚 Documentation:
  • Setup Log: setup.log
  • Environment Config: .env
  • Docker Compose: docker-compose.yml
  • Kubernetes: k8s-deployment.yml
  • Cheat Sheet: AI_AUTOMATION_CHEATSHEET.md

Happy coding! 🚀
        """
        
        print(summary)
        logger.info("Setup summary printed")
    
    async def command_exists(self, command: str) -> bool:
        """Check if a command exists"""
        try:
            await self.run_command(f"which {command}" if self.os_type != "windows" else f"where {command}")
            return True
        except:
            return False
    
    async def run_command(self, command: str, capture_output: bool = False):
        """Run shell command"""
        logger.debug(f"Running command: {command}")
        
        if self.os_type == "windows":
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE if capture_output else None,
                stderr=asyncio.subprocess.PIPE if capture_output else None,
                shell=True
            )
        else:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE if capture_output else None,
                stderr=asyncio.subprocess.PIPE if capture_output else None
            )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0 and not capture_output:
            error_msg = stderr.decode() if stderr else f"Command failed with return code {process.returncode}"
            raise Exception(f"Command '{command}' failed: {error_msg}")
        
        if capture_output:
            return type('Result', (), {'stdout': stdout, 'stderr': stderr, 'returncode': process.returncode})()

async def main():
    """Main entry point"""
    setup = AdvancedSetup()
    await setup.setup_environment()

if __name__ == "__main__":
    asyncio.run(main())