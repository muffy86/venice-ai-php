"""
Advanced Configuration Management System for Cognitive AI Framework
Provides centralized configuration, environment management, and dynamic updates
"""

import os
import json
import yaml
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict, field
from pathlib import Path
import logging
from datetime import datetime
from enum import Enum
import asyncio
from pydantic import BaseModel, validator
import hashlib


class EnvironmentType(Enum):
    """Environment types for configuration"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class LogLevel(Enum):
    """Logging levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class DatabaseConfig:
    """Database configuration settings"""
    host: str = "localhost"
    port: int = 5432
    database: str = "cognitive_ai"
    username: str = "ai_user"
    password: str = ""
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    
    # SQLite specific
    sqlite_path: str = "cognitive_ai.db"
    sqlite_timeout: int = 20
    
    # Vector database (Qdrant)
    vector_host: str = "localhost"
    vector_port: int = 6333
    vector_collection: str = "cognitive_memories"
    vector_size: int = 384


@dataclass
class CognitiveConfig:
    """Cognitive AI framework configuration"""
    architecture: str = "ACT_R"
    working_memory_capacity: int = 7
    attention_capacity: int = 4
    memory_decay_rate: float = 0.1
    learning_rate: float = 0.01
    confidence_threshold: float = 0.7
    reasoning_timeout: int = 30
    max_reasoning_depth: int = 5
    enable_metacognition: bool = True
    enable_bias_simulation: bool = True
    consolidation_interval: int = 300  # seconds
    attention_update_interval: int = 10  # seconds


@dataclass
class ConsciousnessConfig:
    """Consciousness model configuration"""
    enable_global_workspace: bool = True
    enable_iit: bool = True
    enable_attention_schema: bool = True
    consciousness_threshold: float = 0.5
    self_awareness_threshold: float = 0.6
    phi_calculation_method: str = "simplified"
    workspace_capacity: int = 10
    integration_timeout: int = 5
    monitoring_interval: int = 15  # seconds


@dataclass
class EmotionalConfig:
    """Emotional AI configuration"""
    enable_emotion_recognition: bool = True
    enable_cultural_adaptation: bool = True
    enable_therapeutic_intervention: bool = True
    enable_group_dynamics: bool = True
    emotion_threshold: float = 0.3
    cultural_sensitivity: float = 0.8
    therapeutic_confidence_threshold: float = 0.7
    group_size_limit: int = 50
    emotion_decay_rate: float = 0.05
    memory_consolidation_interval: int = 600  # seconds


@dataclass
class APIConfig:
    """API server configuration"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    reload: bool = False
    workers: int = 1
    max_request_size: int = 16 * 1024 * 1024  # 16MB
    timeout: int = 60
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    api_key_required: bool = False
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds


@dataclass
class MonitoringConfig:
    """Monitoring and metrics configuration"""
    enable_prometheus: bool = True
    prometheus_port: int = 9090
    enable_logging: bool = True
    log_level: str = "INFO"
    log_file: str = "cognitive_ai.log"
    log_rotation: bool = True
    log_max_size: str = "100MB"
    log_backup_count: int = 5
    enable_health_checks: bool = True
    health_check_interval: int = 30  # seconds
    enable_performance_tracking: bool = True


@dataclass
class SecurityConfig:
    """Security configuration"""
    enable_encryption: bool = True
    encryption_key: str = ""
    jwt_secret: str = ""
    jwt_expiration: int = 3600  # seconds
    enable_rate_limiting: bool = True
    enable_input_validation: bool = True
    enable_output_sanitization: bool = True
    max_input_length: int = 10000
    allowed_file_types: List[str] = field(default_factory=lambda: [".txt", ".json", ".csv"])


@dataclass
class PerformanceConfig:
    """Performance optimization configuration"""
    enable_caching: bool = True
    cache_size: int = 1000
    cache_ttl: int = 3600  # seconds
    enable_async_processing: bool = True
    max_concurrent_requests: int = 100
    request_queue_size: int = 1000
    enable_batch_processing: bool = True
    batch_size: int = 32
    enable_gpu: bool = False
    gpu_memory_fraction: float = 0.8


class ConfigManager:
    """Advanced configuration management system"""
    
    def __init__(self, config_dir: str = "config", environment: EnvironmentType = EnvironmentType.DEVELOPMENT):
        self.config_dir = Path(config_dir)
        self.environment = environment
        self.config_file = self.config_dir / f"{environment.value}.yaml"
        self.secrets_file = self.config_dir / "secrets.yaml"
        
        # Configuration sections
        self.database = DatabaseConfig()
        self.cognitive = CognitiveConfig()
        self.consciousness = ConsciousnessConfig()
        self.emotional = EmotionalConfig()
        self.api = APIConfig()
        self.monitoring = MonitoringConfig()
        self.security = SecurityConfig()
        self.performance = PerformanceConfig()
        
        # Internal state
        self._config_hash = ""
        self._watchers = []
        self._logger = logging.getLogger(__name__)
        
        # Create config directory if it doesn't exist
        self.config_dir.mkdir(exist_ok=True)
    
    def load_config(self) -> None:
        """Load configuration from files"""
        try:
            # Load main configuration
            if self.config_file.exists():
                with open(self.config_file, 'r') as f:
                    config_data = yaml.safe_load(f) or {}
                self._apply_config_data(config_data)
            
            # Load secrets separately
            if self.secrets_file.exists():
                with open(self.secrets_file, 'r') as f:
                    secrets_data = yaml.safe_load(f) or {}
                self._apply_secrets_data(secrets_data)
            
            # Override with environment variables
            self._load_from_environment()
            
            # Calculate configuration hash for change detection
            self._config_hash = self._calculate_config_hash()
            
            self._logger.info(f"Configuration loaded for environment: {self.environment.value}")
            
        except Exception as e:
            self._logger.error(f"Failed to load configuration: {e}")
            raise
    
    def save_config(self) -> None:
        """Save current configuration to file"""
        try:
            config_data = {
                "database": asdict(self.database),
                "cognitive": asdict(self.cognitive),
                "consciousness": asdict(self.consciousness),
                "emotional": asdict(self.emotional),
                "api": asdict(self.api),
                "monitoring": asdict(self.monitoring),
                "performance": asdict(self.performance)
            }
            
            # Remove sensitive data from main config
            sensitive_fields = ["password", "encryption_key", "jwt_secret"]
            secrets_data = {}
            
            for section_name, section_data in config_data.items():
                for field in sensitive_fields:
                    if field in section_data:
                        if section_name not in secrets_data:
                            secrets_data[section_name] = {}
                        secrets_data[section_name][field] = section_data.pop(field)
            
            # Save main configuration
            with open(self.config_file, 'w') as f:
                yaml.dump(config_data, f, default_flow_style=False, indent=2)
            
            # Save secrets separately
            if secrets_data:
                with open(self.secrets_file, 'w') as f:
                    yaml.dump(secrets_data, f, default_flow_style=False, indent=2)
                
                # Set restrictive permissions on secrets file
                os.chmod(self.secrets_file, 0o600)
            
            self._logger.info("Configuration saved successfully")
            
        except Exception as e:
            self._logger.error(f"Failed to save configuration: {e}")
            raise
    
    def _apply_config_data(self, config_data: Dict[str, Any]) -> None:
        """Apply configuration data to config objects"""
        if "database" in config_data:
            self._update_dataclass(self.database, config_data["database"])
        
        if "cognitive" in config_data:
            self._update_dataclass(self.cognitive, config_data["cognitive"])
        
        if "consciousness" in config_data:
            self._update_dataclass(self.consciousness, config_data["consciousness"])
        
        if "emotional" in config_data:
            self._update_dataclass(self.emotional, config_data["emotional"])
        
        if "api" in config_data:
            self._update_dataclass(self.api, config_data["api"])
        
        if "monitoring" in config_data:
            self._update_dataclass(self.monitoring, config_data["monitoring"])
        
        if "security" in config_data:
            self._update_dataclass(self.security, config_data["security"])
        
        if "performance" in config_data:
            self._update_dataclass(self.performance, config_data["performance"])
    
    def _apply_secrets_data(self, secrets_data: Dict[str, Any]) -> None:
        """Apply secrets data to config objects"""
        for section_name, section_data in secrets_data.items():
            if hasattr(self, section_name):
                config_obj = getattr(self, section_name)
                self._update_dataclass(config_obj, section_data)
    
    def _update_dataclass(self, obj: Any, data: Dict[str, Any]) -> None:
        """Update dataclass object with dictionary data"""
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
    
    def _load_from_environment(self) -> None:
        """Load configuration from environment variables"""
        env_mappings = {
            # Database
            "DB_HOST": ("database", "host"),
            "DB_PORT": ("database", "port"),
            "DB_NAME": ("database", "database"),
            "DB_USER": ("database", "username"),
            "DB_PASSWORD": ("database", "password"),
            
            # API
            "API_HOST": ("api", "host"),
            "API_PORT": ("api", "port"),
            "API_DEBUG": ("api", "debug"),
            
            # Security
            "ENCRYPTION_KEY": ("security", "encryption_key"),
            "JWT_SECRET": ("security", "jwt_secret"),
            
            # Monitoring
            "LOG_LEVEL": ("monitoring", "log_level"),
            "PROMETHEUS_PORT": ("monitoring", "prometheus_port"),
        }
        
        for env_var, (section, field) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                config_obj = getattr(self, section)
                
                # Type conversion
                field_type = type(getattr(config_obj, field))
                if field_type == bool:
                    value = value.lower() in ("true", "1", "yes", "on")
                elif field_type == int:
                    value = int(value)
                elif field_type == float:
                    value = float(value)
                
                setattr(config_obj, field, value)
    
    def _calculate_config_hash(self) -> str:
        """Calculate hash of current configuration for change detection"""
        config_str = json.dumps({
            "database": asdict(self.database),
            "cognitive": asdict(self.cognitive),
            "consciousness": asdict(self.consciousness),
            "emotional": asdict(self.emotional),
            "api": asdict(self.api),
            "monitoring": asdict(self.monitoring),
            "security": asdict(self.security),
            "performance": asdict(self.performance)
        }, sort_keys=True)
        
        return hashlib.md5(config_str.encode()).hexdigest()
    
    def has_changed(self) -> bool:
        """Check if configuration has changed since last load"""
        current_hash = self._calculate_config_hash()
        return current_hash != self._config_hash
    
    def reload_if_changed(self) -> bool:
        """Reload configuration if it has changed"""
        if self.config_file.exists():
            file_mtime = self.config_file.stat().st_mtime
            current_time = datetime.now().timestamp()
            
            # Check if file was modified recently
            if current_time - file_mtime < 60:  # Within last minute
                try:
                    self.load_config()
                    return True
                except Exception as e:
                    self._logger.error(f"Failed to reload configuration: {e}")
        
        return False
    
    def validate_config(self) -> List[str]:
        """Validate current configuration and return list of issues"""
        issues = []
        
        # Database validation
        if not self.database.host:
            issues.append("Database host is required")
        
        if self.database.port <= 0 or self.database.port > 65535:
            issues.append("Database port must be between 1 and 65535")
        
        # API validation
        if self.api.port <= 0 or self.api.port > 65535:
            issues.append("API port must be between 1 and 65535")
        
        if self.api.workers <= 0:
            issues.append("API workers must be greater than 0")
        
        # Cognitive validation
        if self.cognitive.working_memory_capacity <= 0:
            issues.append("Working memory capacity must be greater than 0")
        
        if not 0 <= self.cognitive.confidence_threshold <= 1:
            issues.append("Confidence threshold must be between 0 and 1")
        
        # Security validation
        if self.security.enable_encryption and not self.security.encryption_key:
            issues.append("Encryption key is required when encryption is enabled")
        
        if self.security.jwt_expiration <= 0:
            issues.append("JWT expiration must be greater than 0")
        
        return issues
    
    def get_database_url(self) -> str:
        """Get database connection URL"""
        if self.database.host == "sqlite" or not self.database.host:
            return f"sqlite:///{self.database.sqlite_path}"
        else:
            return (f"postgresql://{self.database.username}:{self.database.password}"
                   f"@{self.database.host}:{self.database.port}/{self.database.database}")
    
    def get_vector_db_config(self) -> Dict[str, Any]:
        """Get vector database configuration"""
        return {
            "host": self.database.vector_host,
            "port": self.database.vector_port,
            "collection_name": self.database.vector_collection,
            "vector_size": self.database.vector_size
        }
    
    def setup_logging(self) -> None:
        """Setup logging based on configuration"""
        log_level = getattr(logging, self.monitoring.log_level.upper())
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Setup file handler
        if self.monitoring.enable_logging:
            if self.monitoring.log_rotation:
                from logging.handlers import RotatingFileHandler
                file_handler = RotatingFileHandler(
                    self.monitoring.log_file,
                    maxBytes=self._parse_size(self.monitoring.log_max_size),
                    backupCount=self.monitoring.log_backup_count
                )
            else:
                file_handler = logging.FileHandler(self.monitoring.log_file)
            
            file_handler.setFormatter(formatter)
            file_handler.setLevel(log_level)
            
            # Add to root logger
            root_logger = logging.getLogger()
            root_logger.addHandler(file_handler)
            root_logger.setLevel(log_level)
        
        # Setup console handler for development
        if self.environment == EnvironmentType.DEVELOPMENT:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            console_handler.setLevel(log_level)
            
            root_logger = logging.getLogger()
            root_logger.addHandler(console_handler)
    
    def _parse_size(self, size_str: str) -> int:
        """Parse size string (e.g., '100MB') to bytes"""
        size_str = size_str.upper()
        if size_str.endswith('KB'):
            return int(size_str[:-2]) * 1024
        elif size_str.endswith('MB'):
            return int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith('GB'):
            return int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            return int(size_str)
    
    def export_config(self, format: str = "yaml") -> str:
        """Export configuration in specified format"""
        config_data = {
            "environment": self.environment.value,
            "database": asdict(self.database),
            "cognitive": asdict(self.cognitive),
            "consciousness": asdict(self.consciousness),
            "emotional": asdict(self.emotional),
            "api": asdict(self.api),
            "monitoring": asdict(self.monitoring),
            "security": asdict(self.security),
            "performance": asdict(self.performance)
        }
        
        if format.lower() == "json":
            return json.dumps(config_data, indent=2)
        elif format.lower() == "yaml":
            return yaml.dump(config_data, default_flow_style=False, indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def create_default_configs(self) -> None:
        """Create default configuration files for all environments"""
        environments = [
            EnvironmentType.DEVELOPMENT,
            EnvironmentType.TESTING,
            EnvironmentType.STAGING,
            EnvironmentType.PRODUCTION
        ]
        
        for env in environments:
            config_file = self.config_dir / f"{env.value}.yaml"
            
            # Environment-specific overrides
            overrides = self._get_environment_overrides(env)
            
            # Apply overrides
            temp_config = ConfigManager(environment=env)
            temp_config._apply_config_data(overrides)
            
            # Save configuration
            temp_config.config_file = config_file
            temp_config.save_config()
    
    def _get_environment_overrides(self, env: EnvironmentType) -> Dict[str, Any]:
        """Get environment-specific configuration overrides"""
        if env == EnvironmentType.DEVELOPMENT:
            return {
                "api": {"debug": True, "reload": True},
                "monitoring": {"log_level": "DEBUG"},
                "security": {"enable_rate_limiting": False}
            }
        elif env == EnvironmentType.TESTING:
            return {
                "database": {"sqlite_path": "test_cognitive_ai.db"},
                "monitoring": {"log_level": "WARNING"},
                "performance": {"enable_caching": False}
            }
        elif env == EnvironmentType.STAGING:
            return {
                "api": {"workers": 2},
                "monitoring": {"log_level": "INFO"},
                "security": {"enable_rate_limiting": True}
            }
        elif env == EnvironmentType.PRODUCTION:
            return {
                "api": {"debug": False, "workers": 4},
                "monitoring": {"log_level": "WARNING"},
                "security": {
                    "enable_encryption": True,
                    "enable_rate_limiting": True,
                    "enable_input_validation": True
                },
                "performance": {"enable_caching": True, "enable_gpu": True}
            }
        
        return {}


# Global configuration instance
config = ConfigManager()


def get_config() -> ConfigManager:
    """Get the global configuration instance"""
    return config


def initialize_config(config_dir: str = "config", 
                     environment: Optional[str] = None) -> ConfigManager:
    """Initialize the global configuration"""
    global config
    
    if environment:
        env = EnvironmentType(environment.lower())
    else:
        env = EnvironmentType(os.getenv("ENVIRONMENT", "development").lower())
    
    config = ConfigManager(config_dir=config_dir, environment=env)
    config.load_config()
    config.setup_logging()
    
    # Validate configuration
    issues = config.validate_config()
    if issues:
        logger = logging.getLogger(__name__)
        logger.warning(f"Configuration validation issues: {issues}")
    
    return config


if __name__ == "__main__":
    # Example usage and testing
    import argparse
    
    parser = argparse.ArgumentParser(description="Configuration Management")
    parser.add_argument("--create-defaults", action="store_true",
                       help="Create default configuration files")
    parser.add_argument("--validate", action="store_true",
                       help="Validate current configuration")
    parser.add_argument("--export", choices=["yaml", "json"],
                       help="Export configuration in specified format")
    parser.add_argument("--environment", choices=["development", "testing", "staging", "production"],
                       default="development", help="Environment to use")
    
    args = parser.parse_args()
    
    # Initialize configuration
    config_mgr = initialize_config(environment=args.environment)
    
    if args.create_defaults:
        config_mgr.create_default_configs()
        print("Default configuration files created")
    
    if args.validate:
        issues = config_mgr.validate_config()
        if issues:
            print("Configuration validation issues:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print("Configuration is valid")
    
    if args.export:
        exported = config_mgr.export_config(args.export)
        print(exported)