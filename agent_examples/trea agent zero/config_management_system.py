"""
Advanced Configuration Management System
Provides centralized configuration management, validation, hot-reloading, and environment-specific settings.
"""

import os
import json
import yaml
import toml
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union, Type, Callable
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import hashlib
import time
from datetime import datetime, timedelta
import threading
import watchdog
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import jsonschema
from jsonschema import validate, ValidationError
import boto3
import consul
import etcd3
import redis
from cryptography.fernet import Fernet
import base64
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Database setup
Base = declarative_base()

class ConfigFormat(Enum):
    JSON = "json"
    YAML = "yaml"
    TOML = "toml"
    ENV = "env"
    INI = "ini"

class ConfigSource(Enum):
    FILE = "file"
    ENVIRONMENT = "environment"
    CONSUL = "consul"
    ETCD = "etcd"
    REDIS = "redis"
    AWS_PARAMETER_STORE = "aws_parameter_store"
    AWS_SECRETS_MANAGER = "aws_secrets_manager"
    DATABASE = "database"

class ConfigScope(Enum):
    GLOBAL = "global"
    APPLICATION = "application"
    SERVICE = "service"
    USER = "user"
    SESSION = "session"

class ValidationLevel(Enum):
    NONE = "none"
    BASIC = "basic"
    STRICT = "strict"
    CUSTOM = "custom"

@dataclass
class ConfigMetadata:
    key: str
    source: ConfigSource
    format: ConfigFormat
    scope: ConfigScope
    version: str
    created_at: datetime
    updated_at: datetime
    checksum: str
    encrypted: bool = False
    tags: Dict[str, str] = field(default_factory=dict)
    description: str = ""

@dataclass
class ConfigValidationRule:
    field_path: str
    rule_type: str  # required, type, range, regex, custom
    rule_value: Any
    error_message: str = ""
    severity: str = "error"  # error, warning, info

@dataclass
class ConfigChangeEvent:
    key: str
    old_value: Any
    new_value: Any
    source: ConfigSource
    timestamp: datetime
    user: Optional[str] = None
    reason: Optional[str] = None

# Database Models
class ConfigEntry(Base):
    __tablename__ = "config_entries"
    
    id = Column(Integer, primary_key=True)
    key = Column(String(255), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=False)
    format = Column(String(50), nullable=False)
    source = Column(String(50), nullable=False)
    scope = Column(String(50), nullable=False)
    version = Column(String(50), nullable=False)
    checksum = Column(String(64), nullable=False)
    encrypted = Column(Boolean, default=False)
    tags = Column(JSON)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ConfigHistory(Base):
    __tablename__ = "config_history"
    
    id = Column(Integer, primary_key=True)
    config_key = Column(String(255), nullable=False, index=True)
    old_value = Column(Text)
    new_value = Column(Text)
    changed_by = Column(String(255))
    change_reason = Column(Text)
    changed_at = Column(DateTime, default=datetime.utcnow)

class ConfigSchema(BaseModel):
    """Pydantic model for configuration validation"""
    key: str = Field(..., min_length=1, max_length=255)
    value: Any
    format: ConfigFormat
    source: ConfigSource
    scope: ConfigScope
    version: str = Field(default="1.0.0")
    encrypted: bool = Field(default=False)
    tags: Dict[str, str] = Field(default_factory=dict)
    description: str = Field(default="")

class ConfigEncryption:
    """Handles configuration encryption and decryption"""
    
    def __init__(self, encryption_key: Optional[str] = None):
        if encryption_key:
            self.key = encryption_key.encode()
        else:
            self.key = Fernet.generate_key()
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt configuration data"""
        encrypted_data = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt configuration data"""
        decoded_data = base64.b64decode(encrypted_data.encode())
        decrypted_data = self.cipher.decrypt(decoded_data)
        return decrypted_data.decode()
    
    def get_key(self) -> str:
        """Get the encryption key"""
        return base64.b64encode(self.key).decode()

class ConfigValidator:
    """Validates configuration values against schemas and rules"""
    
    def __init__(self):
        self.schemas: Dict[str, Dict] = {}
        self.rules: Dict[str, List[ConfigValidationRule]] = {}
        self.custom_validators: Dict[str, Callable] = {}
    
    def register_schema(self, config_key: str, schema: Dict):
        """Register a JSON schema for a configuration key"""
        self.schemas[config_key] = schema
    
    def register_rule(self, config_key: str, rule: ConfigValidationRule):
        """Register a validation rule for a configuration key"""
        if config_key not in self.rules:
            self.rules[config_key] = []
        self.rules[config_key].append(rule)
    
    def register_custom_validator(self, name: str, validator: Callable):
        """Register a custom validator function"""
        self.custom_validators[name] = validator
    
    def validate(self, config_key: str, value: Any) -> List[str]:
        """Validate a configuration value"""
        errors = []
        
        # JSON Schema validation
        if config_key in self.schemas:
            try:
                validate(instance=value, schema=self.schemas[config_key])
            except ValidationError as e:
                errors.append(f"Schema validation failed: {e.message}")
        
        # Rule-based validation
        if config_key in self.rules:
            for rule in self.rules[config_key]:
                error = self._validate_rule(value, rule)
                if error:
                    errors.append(error)
        
        return errors
    
    def _validate_rule(self, value: Any, rule: ConfigValidationRule) -> Optional[str]:
        """Validate a single rule"""
        try:
            if rule.rule_type == "required" and value is None:
                return rule.error_message or f"Field {rule.field_path} is required"
            
            elif rule.rule_type == "type":
                expected_type = rule.rule_value
                if not isinstance(value, expected_type):
                    return rule.error_message or f"Field {rule.field_path} must be of type {expected_type.__name__}"
            
            elif rule.rule_type == "range":
                min_val, max_val = rule.rule_value
                if not (min_val <= value <= max_val):
                    return rule.error_message or f"Field {rule.field_path} must be between {min_val} and {max_val}"
            
            elif rule.rule_type == "regex":
                import re
                pattern = rule.rule_value
                if not re.match(pattern, str(value)):
                    return rule.error_message or f"Field {rule.field_path} does not match pattern {pattern}"
            
            elif rule.rule_type == "custom":
                validator_name = rule.rule_value
                if validator_name in self.custom_validators:
                    validator = self.custom_validators[validator_name]
                    if not validator(value):
                        return rule.error_message or f"Custom validation failed for {rule.field_path}"
        
        except Exception as e:
            return f"Validation error for {rule.field_path}: {str(e)}"
        
        return None

class ConfigSource_File:
    """File-based configuration source"""
    
    def __init__(self, file_path: str, format: ConfigFormat):
        self.file_path = Path(file_path)
        self.format = format
        self.last_modified = None
    
    def load(self) -> Dict[str, Any]:
        """Load configuration from file"""
        if not self.file_path.exists():
            return {}
        
        with open(self.file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if self.format == ConfigFormat.JSON:
            return json.loads(content)
        elif self.format == ConfigFormat.YAML:
            return yaml.safe_load(content)
        elif self.format == ConfigFormat.TOML:
            return toml.loads(content)
        elif self.format == ConfigFormat.ENV:
            return self._parse_env_file(content)
        else:
            raise ValueError(f"Unsupported format: {self.format}")
    
    def save(self, config: Dict[str, Any]):
        """Save configuration to file"""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        
        if self.format == ConfigFormat.JSON:
            content = json.dumps(config, indent=2)
        elif self.format == ConfigFormat.YAML:
            content = yaml.dump(config, default_flow_style=False)
        elif self.format == ConfigFormat.TOML:
            content = toml.dumps(config)
        elif self.format == ConfigFormat.ENV:
            content = self._format_env_file(config)
        else:
            raise ValueError(f"Unsupported format: {self.format}")
        
        with open(self.file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def _parse_env_file(self, content: str) -> Dict[str, Any]:
        """Parse .env file format"""
        config = {}
        for line in content.strip().split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip().strip('"\'')
        return config
    
    def _format_env_file(self, config: Dict[str, Any]) -> str:
        """Format configuration as .env file"""
        lines = []
        for key, value in config.items():
            lines.append(f"{key}={value}")
        return '\n'.join(lines)
    
    def has_changed(self) -> bool:
        """Check if file has been modified"""
        if not self.file_path.exists():
            return False
        
        current_modified = self.file_path.stat().st_mtime
        if self.last_modified is None:
            self.last_modified = current_modified
            return True
        
        if current_modified != self.last_modified:
            self.last_modified = current_modified
            return True
        
        return False

class ConfigSource_Consul:
    """Consul-based configuration source"""
    
    def __init__(self, host: str = 'localhost', port: int = 8500, prefix: str = 'config/'):
        self.client = consul.Consul(host=host, port=port)
        self.prefix = prefix
    
    def load(self) -> Dict[str, Any]:
        """Load configuration from Consul"""
        try:
            _, data = self.client.kv.get(self.prefix, recurse=True)
            if not data:
                return {}
            
            config = {}
            for item in data:
                key = item['Key'].replace(self.prefix, '')
                value = item['Value'].decode('utf-8') if item['Value'] else ''
                try:
                    # Try to parse as JSON
                    config[key] = json.loads(value)
                except json.JSONDecodeError:
                    config[key] = value
            
            return config
        except Exception as e:
            logging.error(f"Failed to load from Consul: {e}")
            return {}
    
    def save(self, config: Dict[str, Any]):
        """Save configuration to Consul"""
        for key, value in config.items():
            consul_key = f"{self.prefix}{key}"
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            self.client.kv.put(consul_key, str(value))

class ConfigSource_Redis:
    """Redis-based configuration source"""
    
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0, prefix: str = 'config:'):
        self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self.prefix = prefix
    
    def load(self) -> Dict[str, Any]:
        """Load configuration from Redis"""
        try:
            keys = self.client.keys(f"{self.prefix}*")
            config = {}
            
            for key in keys:
                config_key = key.replace(self.prefix, '')
                value = self.client.get(key)
                try:
                    config[config_key] = json.loads(value)
                except json.JSONDecodeError:
                    config[config_key] = value
            
            return config
        except Exception as e:
            logging.error(f"Failed to load from Redis: {e}")
            return {}
    
    def save(self, config: Dict[str, Any]):
        """Save configuration to Redis"""
        for key, value in config.items():
            redis_key = f"{self.prefix}{key}"
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            self.client.set(redis_key, str(value))

class ConfigWatcher(FileSystemEventHandler):
    """Watches for configuration file changes"""
    
    def __init__(self, config_manager, file_paths: List[str]):
        self.config_manager = config_manager
        self.file_paths = set(file_paths)
        self.observer = Observer()
    
    def start(self):
        """Start watching for file changes"""
        watched_dirs = set()
        for file_path in self.file_paths:
            dir_path = str(Path(file_path).parent)
            if dir_path not in watched_dirs:
                self.observer.schedule(self, dir_path, recursive=False)
                watched_dirs.add(dir_path)
        
        self.observer.start()
    
    def stop(self):
        """Stop watching for file changes"""
        self.observer.stop()
        self.observer.join()
    
    def on_modified(self, event):
        """Handle file modification events"""
        if not event.is_directory and event.src_path in self.file_paths:
            asyncio.create_task(self.config_manager.reload_config(event.src_path))

class ConfigManager:
    """Central configuration management system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.sources: Dict[str, Any] = {}
        self.cache: Dict[str, Any] = {}
        self.metadata: Dict[str, ConfigMetadata] = {}
        self.validator = ConfigValidator()
        self.encryption = ConfigEncryption(config.get('encryption_key'))
        self.change_listeners: List[Callable] = []
        self.hot_reload_enabled = config.get('hot_reload', True)
        self.watcher = None
        
        # Setup database
        db_url = config.get('database_url', 'sqlite:///config.db')
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db_session = Session()
        
        # Initialize sources
        self._initialize_sources()
        
        # Setup file watcher if hot reload is enabled
        if self.hot_reload_enabled:
            self._setup_file_watcher()
    
    def _initialize_sources(self):
        """Initialize configuration sources"""
        sources_config = self.config.get('sources', {})
        
        for source_name, source_config in sources_config.items():
            source_type = ConfigSource(source_config['type'])
            
            if source_type == ConfigSource.FILE:
                self.sources[source_name] = ConfigSource_File(
                    source_config['path'],
                    ConfigFormat(source_config['format'])
                )
            elif source_type == ConfigSource.CONSUL:
                self.sources[source_name] = ConfigSource_Consul(
                    source_config.get('host', 'localhost'),
                    source_config.get('port', 8500),
                    source_config.get('prefix', 'config/')
                )
            elif source_type == ConfigSource.REDIS:
                self.sources[source_name] = ConfigSource_Redis(
                    source_config.get('host', 'localhost'),
                    source_config.get('port', 6379),
                    source_config.get('db', 0),
                    source_config.get('prefix', 'config:')
                )
    
    def _setup_file_watcher(self):
        """Setup file watcher for hot reload"""
        file_sources = []
        for source in self.sources.values():
            if isinstance(source, ConfigSource_File):
                file_sources.append(str(source.file_path))
        
        if file_sources:
            self.watcher = ConfigWatcher(self, file_sources)
            self.watcher.start()
    
    async def load_all_configs(self):
        """Load configurations from all sources"""
        for source_name, source in self.sources.items():
            try:
                config_data = source.load()
                for key, value in config_data.items():
                    await self.set_config(key, value, source_name)
            except Exception as e:
                logging.error(f"Failed to load from source {source_name}: {e}")
    
    async def get_config(self, key: str, default: Any = None, decrypt: bool = True) -> Any:
        """Get configuration value"""
        if key in self.cache:
            value = self.cache[key]
            metadata = self.metadata.get(key)
            
            if metadata and metadata.encrypted and decrypt:
                try:
                    value = self.encryption.decrypt(value)
                    return json.loads(value) if value.startswith(('{', '[')) else value
                except Exception as e:
                    logging.error(f"Failed to decrypt config {key}: {e}")
                    return default
            
            return value
        
        # Try to load from database
        db_entry = self.db_session.query(ConfigEntry).filter(
            ConfigEntry.key == key
        ).first()
        
        if db_entry:
            value = db_entry.value
            if db_entry.encrypted and decrypt:
                try:
                    value = self.encryption.decrypt(value)
                except Exception as e:
                    logging.error(f"Failed to decrypt config {key}: {e}")
                    return default
            
            # Parse value based on format
            if db_entry.format == ConfigFormat.JSON.value:
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    pass
            
            # Cache the value
            self.cache[key] = value
            self.metadata[key] = ConfigMetadata(
                key=key,
                source=ConfigSource(db_entry.source),
                format=ConfigFormat(db_entry.format),
                scope=ConfigScope(db_entry.scope),
                version=db_entry.version,
                created_at=db_entry.created_at,
                updated_at=db_entry.updated_at,
                checksum=db_entry.checksum,
                encrypted=db_entry.encrypted,
                tags=db_entry.tags or {},
                description=db_entry.description or ""
            )
            
            return value
        
        return default
    
    async def set_config(self, key: str, value: Any, source: str = "manual", 
                        encrypt: bool = False, scope: ConfigScope = ConfigScope.APPLICATION,
                        tags: Dict[str, str] = None, description: str = "",
                        user: str = None, reason: str = None) -> bool:
        """Set configuration value"""
        # Validate the configuration
        validation_errors = self.validator.validate(key, value)
        if validation_errors:
            logging.error(f"Validation failed for {key}: {validation_errors}")
            return False
        
        # Get old value for change tracking
        old_value = await self.get_config(key)
        
        # Prepare value for storage
        storage_value = value
        if isinstance(value, (dict, list)):
            storage_value = json.dumps(value)
        elif not isinstance(value, str):
            storage_value = str(value)
        
        # Encrypt if requested
        if encrypt:
            storage_value = self.encryption.encrypt(storage_value)
        
        # Calculate checksum
        checksum = hashlib.sha256(storage_value.encode()).hexdigest()
        
        # Update database
        db_entry = self.db_session.query(ConfigEntry).filter(
            ConfigEntry.key == key
        ).first()
        
        if db_entry:
            # Record change history
            history = ConfigHistory(
                config_key=key,
                old_value=json.dumps(old_value) if isinstance(old_value, (dict, list)) else str(old_value),
                new_value=storage_value,
                changed_by=user,
                change_reason=reason
            )
            self.db_session.add(history)
            
            # Update existing entry
            db_entry.value = storage_value
            db_entry.checksum = checksum
            db_entry.encrypted = encrypt
            db_entry.tags = tags or {}
            db_entry.description = description
            db_entry.updated_at = datetime.utcnow()
        else:
            # Create new entry
            db_entry = ConfigEntry(
                key=key,
                value=storage_value,
                format=ConfigFormat.JSON.value if isinstance(value, (dict, list)) else ConfigFormat.JSON.value,
                source=source,
                scope=scope.value,
                version="1.0.0",
                checksum=checksum,
                encrypted=encrypt,
                tags=tags or {},
                description=description
            )
            self.db_session.add(db_entry)
        
        self.db_session.commit()
        
        # Update cache
        self.cache[key] = value
        self.metadata[key] = ConfigMetadata(
            key=key,
            source=ConfigSource(source) if isinstance(source, str) else source,
            format=ConfigFormat.JSON if isinstance(value, (dict, list)) else ConfigFormat.JSON,
            scope=scope,
            version="1.0.0",
            created_at=db_entry.created_at,
            updated_at=datetime.utcnow(),
            checksum=checksum,
            encrypted=encrypt,
            tags=tags or {},
            description=description
        )
        
        # Notify change listeners
        change_event = ConfigChangeEvent(
            key=key,
            old_value=old_value,
            new_value=value,
            source=ConfigSource(source) if isinstance(source, str) else source,
            timestamp=datetime.utcnow(),
            user=user,
            reason=reason
        )
        
        await self._notify_change_listeners(change_event)
        
        return True
    
    async def delete_config(self, key: str, user: str = None, reason: str = None) -> bool:
        """Delete configuration value"""
        # Get old value for change tracking
        old_value = await self.get_config(key)
        if old_value is None:
            return False
        
        # Record change history
        history = ConfigHistory(
            config_key=key,
            old_value=json.dumps(old_value) if isinstance(old_value, (dict, list)) else str(old_value),
            new_value=None,
            changed_by=user,
            change_reason=reason or "Configuration deleted"
        )
        self.db_session.add(history)
        
        # Delete from database
        db_entry = self.db_session.query(ConfigEntry).filter(
            ConfigEntry.key == key
        ).first()
        
        if db_entry:
            self.db_session.delete(db_entry)
            self.db_session.commit()
        
        # Remove from cache
        self.cache.pop(key, None)
        self.metadata.pop(key, None)
        
        # Notify change listeners
        change_event = ConfigChangeEvent(
            key=key,
            old_value=old_value,
            new_value=None,
            source=ConfigSource.DATABASE,
            timestamp=datetime.utcnow(),
            user=user,
            reason=reason
        )
        
        await self._notify_change_listeners(change_event)
        
        return True
    
    def list_configs(self, scope: Optional[ConfigScope] = None, 
                    tags: Optional[Dict[str, str]] = None) -> List[ConfigMetadata]:
        """List all configurations with optional filtering"""
        query = self.db_session.query(ConfigEntry)
        
        if scope:
            query = query.filter(ConfigEntry.scope == scope.value)
        
        if tags:
            for key, value in tags.items():
                query = query.filter(ConfigEntry.tags[key].astext == value)
        
        entries = query.all()
        
        return [
            ConfigMetadata(
                key=entry.key,
                source=ConfigSource(entry.source),
                format=ConfigFormat(entry.format),
                scope=ConfigScope(entry.scope),
                version=entry.version,
                created_at=entry.created_at,
                updated_at=entry.updated_at,
                checksum=entry.checksum,
                encrypted=entry.encrypted,
                tags=entry.tags or {},
                description=entry.description or ""
            )
            for entry in entries
        ]
    
    def get_config_history(self, key: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get configuration change history"""
        history = self.db_session.query(ConfigHistory).filter(
            ConfigHistory.config_key == key
        ).order_by(ConfigHistory.changed_at.desc()).limit(limit).all()
        
        return [
            {
                'old_value': h.old_value,
                'new_value': h.new_value,
                'changed_by': h.changed_by,
                'change_reason': h.change_reason,
                'changed_at': h.changed_at.isoformat()
            }
            for h in history
        ]
    
    def add_change_listener(self, listener: Callable[[ConfigChangeEvent], None]):
        """Add a configuration change listener"""
        self.change_listeners.append(listener)
    
    async def _notify_change_listeners(self, event: ConfigChangeEvent):
        """Notify all change listeners"""
        for listener in self.change_listeners:
            try:
                if asyncio.iscoroutinefunction(listener):
                    await listener(event)
                else:
                    listener(event)
            except Exception as e:
                logging.error(f"Error in change listener: {e}")
    
    async def reload_config(self, source_name: str = None):
        """Reload configuration from sources"""
        if source_name:
            if source_name in self.sources:
                source = self.sources[source_name]
                try:
                    config_data = source.load()
                    for key, value in config_data.items():
                        await self.set_config(key, value, source_name)
                except Exception as e:
                    logging.error(f"Failed to reload from source {source_name}: {e}")
        else:
            await self.load_all_configs()
    
    def export_config(self, format: ConfigFormat, scope: Optional[ConfigScope] = None,
                     include_encrypted: bool = False) -> str:
        """Export configuration in specified format"""
        configs = {}
        
        for metadata in self.list_configs(scope=scope):
            if metadata.encrypted and not include_encrypted:
                continue
            
            value = self.cache.get(metadata.key)
            if value is not None:
                configs[metadata.key] = value
        
        if format == ConfigFormat.JSON:
            return json.dumps(configs, indent=2)
        elif format == ConfigFormat.YAML:
            return yaml.dump(configs, default_flow_style=False)
        elif format == ConfigFormat.TOML:
            return toml.dumps(configs)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    async def import_config(self, data: str, format: ConfigFormat, 
                          source: str = "import", overwrite: bool = False) -> int:
        """Import configuration from data"""
        if format == ConfigFormat.JSON:
            configs = json.loads(data)
        elif format == ConfigFormat.YAML:
            configs = yaml.safe_load(data)
        elif format == ConfigFormat.TOML:
            configs = toml.loads(data)
        else:
            raise ValueError(f"Unsupported import format: {format}")
        
        imported_count = 0
        
        for key, value in configs.items():
            existing_value = await self.get_config(key)
            if existing_value is None or overwrite:
                success = await self.set_config(key, value, source)
                if success:
                    imported_count += 1
        
        return imported_count
    
    def cleanup(self):
        """Cleanup resources"""
        if self.watcher:
            self.watcher.stop()
        self.db_session.close()

class ConfigAPI:
    """REST API for configuration management"""
    
    def __init__(self, config_manager: ConfigManager):
        self.config_manager = config_manager
        self.app = FastAPI(title="Configuration Management API")
        self.security = HTTPBearer()
        self.setup_routes()
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/api/config/{key}")
        async def get_config(key: str, decrypt: bool = True):
            """Get configuration value"""
            value = await self.config_manager.get_config(key, decrypt=decrypt)
            if value is None:
                raise HTTPException(status_code=404, detail="Configuration not found")
            
            metadata = self.config_manager.metadata.get(key)
            return {
                "key": key,
                "value": value,
                "metadata": asdict(metadata) if metadata else None
            }
        
        @self.app.post("/api/config/{key}")
        async def set_config(key: str, request: ConfigSchema):
            """Set configuration value"""
            success = await self.config_manager.set_config(
                key=key,
                value=request.value,
                encrypt=request.encrypted,
                scope=request.scope,
                tags=request.tags,
                description=request.description
            )
            
            if not success:
                raise HTTPException(status_code=400, detail="Failed to set configuration")
            
            return {"message": "Configuration set successfully"}
        
        @self.app.delete("/api/config/{key}")
        async def delete_config(key: str):
            """Delete configuration value"""
            success = await self.config_manager.delete_config(key)
            if not success:
                raise HTTPException(status_code=404, detail="Configuration not found")
            
            return {"message": "Configuration deleted successfully"}
        
        @self.app.get("/api/configs")
        async def list_configs(scope: Optional[str] = None):
            """List all configurations"""
            scope_enum = ConfigScope(scope) if scope else None
            configs = self.config_manager.list_configs(scope=scope_enum)
            
            return {
                "configs": [asdict(config) for config in configs],
                "total": len(configs)
            }
        
        @self.app.get("/api/config/{key}/history")
        async def get_config_history(key: str, limit: int = 10):
            """Get configuration change history"""
            history = self.config_manager.get_config_history(key, limit)
            return {"history": history}
        
        @self.app.post("/api/config/export")
        async def export_config(format: str, scope: Optional[str] = None, 
                              include_encrypted: bool = False):
            """Export configuration"""
            format_enum = ConfigFormat(format)
            scope_enum = ConfigScope(scope) if scope else None
            
            exported_data = self.config_manager.export_config(
                format=format_enum,
                scope=scope_enum,
                include_encrypted=include_encrypted
            )
            
            return {"data": exported_data}
        
        @self.app.post("/api/config/import")
        async def import_config(data: str, format: str, overwrite: bool = False):
            """Import configuration"""
            format_enum = ConfigFormat(format)
            
            imported_count = await self.config_manager.import_config(
                data=data,
                format=format_enum,
                overwrite=overwrite
            )
            
            return {"imported_count": imported_count}
        
        @self.app.post("/api/config/reload")
        async def reload_config(source: Optional[str] = None):
            """Reload configuration from sources"""
            await self.config_manager.reload_config(source)
            return {"message": "Configuration reloaded successfully"}

# Example usage
if __name__ == "__main__":
    # Configuration for the config manager
    config = {
        'database_url': 'sqlite:///config.db',
        'encryption_key': 'your-encryption-key-here',
        'hot_reload': True,
        'sources': {
            'main_config': {
                'type': 'file',
                'path': './config.yaml',
                'format': 'yaml'
            },
            'secrets': {
                'type': 'file',
                'path': './secrets.json',
                'format': 'json'
            }
        }
    }
    
    # Create config manager
    config_manager = ConfigManager(config)
    
    # Setup validation rules
    config_manager.validator.register_rule(
        'database.port',
        ConfigValidationRule(
            field_path='database.port',
            rule_type='range',
            rule_value=(1, 65535),
            error_message='Port must be between 1 and 65535'
        )
    )
    
    # Setup change listener
    async def config_change_handler(event: ConfigChangeEvent):
        print(f"Configuration changed: {event.key} = {event.new_value}")
    
    config_manager.add_change_listener(config_change_handler)
    
    # Create API
    api = ConfigAPI(config_manager)
    
    async def main():
        # Load initial configurations
        await config_manager.load_all_configs()
        
        # Set some example configurations
        await config_manager.set_config('app.name', 'AI Framework')
        await config_manager.set_config('app.version', '1.0.0')
        await config_manager.set_config('database.host', 'localhost')
        await config_manager.set_config('database.port', 5432)
        
        # Set encrypted configuration
        await config_manager.set_config(
            'database.password',
            'super-secret-password',
            encrypt=True
        )
        
        # Run the API server
        uvicorn.run(api.app, host="0.0.0.0", port=8000)
    
    # Run the system
    asyncio.run(main())