"""
Advanced Security and Authentication System
Provides comprehensive security features including authentication, authorization, encryption, and audit logging
"""

import os
import jwt
import bcrypt
import secrets
import hashlib
import hmac
import time
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union, Callable, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json
import base64
import uuid
from pathlib import Path
import aioredis
import asyncpg
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import structlog
from fastapi import HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.base import BaseHTTPMiddleware
import ipaddress
from prometheus_client import Counter, Histogram, Gauge
import yaml
from pydantic import BaseModel, validator
import re
from passlib.context import CryptContext
from passlib.hash import argon2
import pyotp
import qrcode
from io import BytesIO
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl
from twilio.rest import Client as TwilioClient


class AuthenticationMethod(Enum):
    """Authentication methods"""
    PASSWORD = "password"
    JWT = "jwt"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    SAML = "saml"
    LDAP = "ldap"
    MFA = "mfa"
    BIOMETRIC = "biometric"


class PermissionLevel(Enum):
    """Permission levels"""
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class SecurityEvent(Enum):
    """Security event types"""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PERMISSION_DENIED = "permission_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    DATA_ACCESS = "data_access"
    API_CALL = "api_call"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    ENCRYPTION_EVENT = "encryption_event"
    AUDIT_LOG_ACCESS = "audit_log_access"


@dataclass
class User:
    """User model"""
    id: str
    username: str
    email: str
    password_hash: str
    roles: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    api_keys: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SecurityConfig:
    """Security configuration"""
    # JWT settings
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    jwt_refresh_expiration_days: int = 30
    
    # Password settings
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_special: bool = True
    password_history_count: int = 5
    
    # Account lockout
    max_failed_attempts: int = 5
    lockout_duration_minutes: int = 30
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window_minutes: int = 15
    
    # Encryption
    encryption_key: str
    
    # MFA settings
    mfa_issuer: str = "AI Framework"
    mfa_validity_window: int = 1
    
    # Audit settings
    audit_log_retention_days: int = 90
    audit_log_encryption: bool = True
    
    # IP restrictions
    allowed_ip_ranges: List[str] = field(default_factory=list)
    blocked_ip_ranges: List[str] = field(default_factory=list)
    
    # Session settings
    session_timeout_minutes: int = 60
    concurrent_sessions_limit: int = 5
    
    # API security
    api_key_length: int = 32
    api_key_expiration_days: int = 365
    
    # Notification settings
    email_notifications: bool = True
    sms_notifications: bool = False
    
    # Database encryption
    database_encryption: bool = True
    field_level_encryption: List[str] = field(default_factory=list)


@dataclass
class SecurityEvent:
    """Security event model"""
    id: str
    event_type: SecurityEvent
    user_id: Optional[str]
    ip_address: str
    user_agent: str
    timestamp: datetime
    details: Dict[str, Any]
    risk_score: float
    location: Optional[Dict[str, str]] = None


class PasswordValidator:
    """Password validation and strength checking"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    
    def validate_password(self, password: str) -> Dict[str, Any]:
        """Validate password against security policy"""
        errors = []
        score = 0
        
        # Length check
        if len(password) < self.config.password_min_length:
            errors.append(f"Password must be at least {self.config.password_min_length} characters")
        else:
            score += 1
        
        # Character requirements
        if self.config.password_require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        else:
            score += 1
        
        if self.config.password_require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        else:
            score += 1
        
        if self.config.password_require_numbers and not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        else:
            score += 1
        
        if self.config.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        else:
            score += 1
        
        # Common password check
        if self._is_common_password(password):
            errors.append("Password is too common")
            score -= 1
        
        # Calculate strength
        strength = min(score / 5.0, 1.0)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "strength": strength,
            "score": score
        }
    
    def _is_common_password(self, password: str) -> bool:
        """Check if password is in common passwords list"""
        common_passwords = {
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon", "master"
        }
        return password.lower() in common_passwords
    
    def hash_password(self, password: str) -> str:
        """Hash password using Argon2"""
        return self.pwd_context.hash(password)
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return self.pwd_context.verify(password, hashed)


class EncryptionManager:
    """Encryption and decryption management"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.fernet = Fernet(config.encryption_key.encode())
        self.logger = structlog.get_logger(__name__)
    
    def encrypt_data(self, data: Union[str, bytes]) -> str:
        """Encrypt data"""
        if isinstance(data, str):
            data = data.encode()
        
        encrypted = self.fernet.encrypt(data)
        return base64.b64encode(encrypted).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt data"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted = self.fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            self.logger.error(f"Decryption failed: {e}")
            raise ValueError("Invalid encrypted data")
    
    def encrypt_field(self, field_name: str, value: Any) -> Any:
        """Encrypt field if configured for encryption"""
        if field_name in self.config.field_level_encryption:
            if isinstance(value, (str, int, float)):
                return self.encrypt_data(str(value))
        return value
    
    def decrypt_field(self, field_name: str, value: Any) -> Any:
        """Decrypt field if configured for encryption"""
        if field_name in self.config.field_level_encryption:
            if isinstance(value, str):
                try:
                    return self.decrypt_data(value)
                except ValueError:
                    return value  # Not encrypted
        return value
    
    def generate_key(self) -> str:
        """Generate new encryption key"""
        return Fernet.generate_key().decode()
    
    def hash_data(self, data: str, salt: Optional[str] = None) -> str:
        """Hash data with optional salt"""
        if salt is None:
            salt = secrets.token_hex(16)
        
        combined = f"{data}{salt}"
        hash_obj = hashlib.sha256(combined.encode())
        return f"{salt}:{hash_obj.hexdigest()}"
    
    def verify_hash(self, data: str, hashed: str) -> bool:
        """Verify data against hash"""
        try:
            salt, hash_value = hashed.split(':', 1)
            return self.hash_data(data, salt) == hashed
        except ValueError:
            return False


class MFAManager:
    """Multi-Factor Authentication management"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
    
    def generate_secret(self) -> str:
        """Generate MFA secret"""
        return pyotp.random_base32()
    
    def generate_qr_code(self, user_email: str, secret: str) -> bytes:
        """Generate QR code for MFA setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=self.config.mfa_issuer
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG')
        return img_buffer.getvalue()
    
    def verify_totp(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=self.config.mfa_validity_window)
    
    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for MFA"""
        return [secrets.token_hex(8) for _ in range(count)]


class JWTManager:
    """JWT token management"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
    
    def create_access_token(self, user_id: str, permissions: List[str] = None) -> str:
        """Create JWT access token"""
        now = datetime.utcnow()
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(hours=self.config.jwt_expiration_hours),
            "type": "access",
            "permissions": permissions or []
        }
        
        return jwt.encode(payload, self.config.jwt_secret_key, algorithm=self.config.jwt_algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """Create JWT refresh token"""
        now = datetime.utcnow()
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(days=self.config.jwt_refresh_expiration_days),
            "type": "refresh"
        }
        
        return jwt.encode(payload, self.config.jwt_secret_key, algorithm=self.config.jwt_algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token, self.config.jwt_secret_key, 
                algorithms=[self.config.jwt_algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def refresh_access_token(self, refresh_token: str) -> str:
        """Refresh access token using refresh token"""
        payload = self.verify_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_id = payload["sub"]
        # Get user permissions (would typically come from database)
        permissions = []  # Placeholder
        
        return self.create_access_token(user_id, permissions)


class AuditLogger:
    """Security audit logging"""
    
    def __init__(self, config: SecurityConfig, encryption_manager: EncryptionManager):
        self.config = config
        self.encryption_manager = encryption_manager
        self.logger = structlog.get_logger(__name__)
        
        # Setup audit log storage
        self.audit_log_path = Path("audit_logs")
        self.audit_log_path.mkdir(exist_ok=True)
    
    async def log_event(self, event_type: SecurityEvent, user_id: Optional[str] = None,
                       ip_address: str = "", user_agent: str = "", 
                       details: Dict[str, Any] = None, risk_score: float = 0.0):
        """Log security event"""
        
        event = SecurityEvent(
            id=str(uuid.uuid4()),
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow(),
            details=details or {},
            risk_score=risk_score
        )
        
        # Encrypt sensitive data if configured
        event_data = {
            "id": event.id,
            "event_type": event.event_type.value,
            "user_id": event.user_id,
            "ip_address": event.ip_address,
            "user_agent": event.user_agent,
            "timestamp": event.timestamp.isoformat(),
            "details": event.details,
            "risk_score": event.risk_score
        }
        
        if self.config.audit_log_encryption:
            event_data = self._encrypt_audit_data(event_data)
        
        # Write to log file
        log_file = self.audit_log_path / f"audit_{datetime.utcnow().strftime('%Y%m%d')}.log"
        
        with open(log_file, 'a') as f:
            f.write(json.dumps(event_data) + '\n')
        
        # Log to structured logger
        self.logger.info(
            "Security event",
            event_type=event.event_type.value,
            user_id=event.user_id,
            ip_address=event.ip_address,
            risk_score=event.risk_score
        )
        
        # Check for high-risk events
        if risk_score > 0.8:
            await self._handle_high_risk_event(event)
    
    def _encrypt_audit_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt sensitive audit data"""
        sensitive_fields = ["user_id", "ip_address", "details"]
        
        for field in sensitive_fields:
            if field in data and data[field]:
                data[field] = self.encryption_manager.encrypt_data(json.dumps(data[field]))
        
        return data
    
    async def _handle_high_risk_event(self, event: SecurityEvent):
        """Handle high-risk security events"""
        self.logger.warning(
            "High-risk security event detected",
            event_id=event.id,
            event_type=event.event_type.value,
            risk_score=event.risk_score
        )
        
        # Send notifications
        if self.config.email_notifications:
            await self._send_security_alert(event)
    
    async def _send_security_alert(self, event: SecurityEvent):
        """Send security alert notification"""
        # Implementation would send email/SMS alerts
        pass
    
    async def get_audit_logs(self, start_date: datetime, end_date: datetime,
                           event_types: List[SecurityEvent] = None,
                           user_id: str = None) -> List[Dict[str, Any]]:
        """Retrieve audit logs with filtering"""
        logs = []
        
        # Read log files for date range
        current_date = start_date.date()
        while current_date <= end_date.date():
            log_file = self.audit_log_path / f"audit_{current_date.strftime('%Y%m%d')}.log"
            
            if log_file.exists():
                with open(log_file, 'r') as f:
                    for line in f:
                        try:
                            log_entry = json.loads(line.strip())
                            
                            # Decrypt if needed
                            if self.config.audit_log_encryption:
                                log_entry = self._decrypt_audit_data(log_entry)
                            
                            # Apply filters
                            if self._matches_filters(log_entry, event_types, user_id, start_date, end_date):
                                logs.append(log_entry)
                                
                        except json.JSONDecodeError:
                            continue
            
            current_date += timedelta(days=1)
        
        return logs
    
    def _decrypt_audit_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt audit data"""
        sensitive_fields = ["user_id", "ip_address", "details"]
        
        for field in sensitive_fields:
            if field in data and data[field]:
                try:
                    decrypted = self.encryption_manager.decrypt_data(data[field])
                    data[field] = json.loads(decrypted)
                except (ValueError, json.JSONDecodeError):
                    pass  # Field might not be encrypted
        
        return data
    
    def _matches_filters(self, log_entry: Dict[str, Any], event_types: List[SecurityEvent],
                        user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """Check if log entry matches filters"""
        
        # Date filter
        entry_date = datetime.fromisoformat(log_entry["timestamp"])
        if not (start_date <= entry_date <= end_date):
            return False
        
        # Event type filter
        if event_types and log_entry["event_type"] not in [et.value for et in event_types]:
            return False
        
        # User ID filter
        if user_id and log_entry.get("user_id") != user_id:
            return False
        
        return True


class IPSecurityManager:
    """IP-based security management"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Parse IP ranges
        self.allowed_networks = [ipaddress.ip_network(ip, strict=False) 
                               for ip in config.allowed_ip_ranges]
        self.blocked_networks = [ipaddress.ip_network(ip, strict=False) 
                               for ip in config.blocked_ip_ranges]
    
    def is_ip_allowed(self, ip_address: str) -> bool:
        """Check if IP address is allowed"""
        try:
            ip = ipaddress.ip_address(ip_address)
            
            # Check blocked list first
            for network in self.blocked_networks:
                if ip in network:
                    return False
            
            # If allowed list is empty, allow all (except blocked)
            if not self.allowed_networks:
                return True
            
            # Check allowed list
            for network in self.allowed_networks:
                if ip in network:
                    return True
            
            return False
            
        except ValueError:
            self.logger.warning(f"Invalid IP address: {ip_address}")
            return False
    
    def get_ip_risk_score(self, ip_address: str) -> float:
        """Calculate risk score for IP address"""
        # This would integrate with threat intelligence feeds
        # For now, return basic score based on configuration
        
        if not self.is_ip_allowed(ip_address):
            return 1.0
        
        # Check if IP is in private ranges
        try:
            ip = ipaddress.ip_address(ip_address)
            if ip.is_private:
                return 0.1
            else:
                return 0.3  # Public IP has slightly higher risk
        except ValueError:
            return 0.5


class RateLimiter:
    """Rate limiting implementation"""
    
    def __init__(self, config: SecurityConfig, redis_client=None):
        self.config = config
        self.redis_client = redis_client
        self.logger = structlog.get_logger(__name__)
        
        # In-memory fallback if Redis not available
        self.memory_store = {}
    
    async def is_rate_limited(self, identifier: str, limit: int = None, 
                             window_minutes: int = None) -> bool:
        """Check if identifier is rate limited"""
        
        limit = limit or self.config.rate_limit_requests
        window_minutes = window_minutes or self.config.rate_limit_window_minutes
        
        current_time = int(time.time())
        window_start = current_time - (window_minutes * 60)
        
        if self.redis_client:
            return await self._redis_rate_limit(identifier, limit, window_start, current_time)
        else:
            return self._memory_rate_limit(identifier, limit, window_start, current_time)
    
    async def _redis_rate_limit(self, identifier: str, limit: int, 
                               window_start: int, current_time: int) -> bool:
        """Redis-based rate limiting"""
        key = f"rate_limit:{identifier}"
        
        # Remove old entries
        await self.redis_client.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        current_count = await self.redis_client.zcard(key)
        
        if current_count >= limit:
            return True
        
        # Add current request
        await self.redis_client.zadd(key, {str(current_time): current_time})
        await self.redis_client.expire(key, 3600)  # 1 hour expiry
        
        return False
    
    def _memory_rate_limit(self, identifier: str, limit: int, 
                          window_start: int, current_time: int) -> bool:
        """Memory-based rate limiting"""
        
        if identifier not in self.memory_store:
            self.memory_store[identifier] = []
        
        # Remove old entries
        self.memory_store[identifier] = [
            timestamp for timestamp in self.memory_store[identifier]
            if timestamp > window_start
        ]
        
        # Check limit
        if len(self.memory_store[identifier]) >= limit:
            return True
        
        # Add current request
        self.memory_store[identifier].append(current_time)
        
        return False


class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for FastAPI"""
    
    def __init__(self, app, security_system):
        super().__init__(app)
        self.security_system = security_system
        self.logger = structlog.get_logger(__name__)
    
    async def dispatch(self, request: Request, call_next):
        """Process request through security checks"""
        
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # IP security check
        if not self.security_system.ip_manager.is_ip_allowed(client_ip):
            await self.security_system.audit_logger.log_event(
                SecurityEvent.PERMISSION_DENIED,
                ip_address=client_ip,
                user_agent=user_agent,
                details={"reason": "IP not allowed"},
                risk_score=1.0
            )
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Rate limiting
        rate_limited = await self.security_system.rate_limiter.is_rate_limited(client_ip)
        if rate_limited:
            await self.security_system.audit_logger.log_event(
                SecurityEvent.RATE_LIMIT_EXCEEDED,
                ip_address=client_ip,
                user_agent=user_agent,
                risk_score=0.7
            )
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Process request
        response = await call_next(request)
        
        # Log API call
        processing_time = time.time() - start_time
        await self.security_system.audit_logger.log_event(
            SecurityEvent.API_CALL,
            ip_address=client_ip,
            user_agent=user_agent,
            details={
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "processing_time": processing_time
            },
            risk_score=0.1
        )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host


class SecuritySystem:
    """Main security system orchestrator"""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize components
        self.password_validator = PasswordValidator(config)
        self.encryption_manager = EncryptionManager(config)
        self.mfa_manager = MFAManager(config)
        self.jwt_manager = JWTManager(config)
        self.audit_logger = AuditLogger(config, self.encryption_manager)
        self.ip_manager = IPSecurityManager(config)
        self.rate_limiter = RateLimiter(config)
        
        # User storage (would typically be a database)
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        
        # Setup metrics
        self._setup_metrics()
    
    def _setup_metrics(self):
        """Setup Prometheus metrics"""
        self.login_attempts = Counter(
            'security_login_attempts_total',
            'Total login attempts',
            ['status', 'method']
        )
        
        self.security_events = Counter(
            'security_events_total',
            'Total security events',
            ['event_type']
        )
        
        self.active_sessions = Gauge(
            'security_active_sessions',
            'Number of active sessions'
        )
    
    async def authenticate_user(self, username: str, password: str, 
                              ip_address: str, user_agent: str,
                              mfa_token: str = None) -> Dict[str, Any]:
        """Authenticate user with credentials"""
        
        user = self._get_user_by_username(username)
        
        if not user:
            await self.audit_logger.log_event(
                SecurityEvent.LOGIN_FAILURE,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "User not found", "username": username},
                risk_score=0.5
            )
            self.login_attempts.labels(status='failed', method='password').inc()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check account lockout
        if user.locked_until and user.locked_until > datetime.utcnow():
            await self.audit_logger.log_event(
                SecurityEvent.LOGIN_FAILURE,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "Account locked"},
                risk_score=0.8
            )
            raise HTTPException(status_code=423, detail="Account locked")
        
        # Verify password
        if not self.password_validator.verify_password(password, user.password_hash):
            user.failed_login_attempts += 1
            
            # Lock account if too many failures
            if user.failed_login_attempts >= self.config.max_failed_attempts:
                user.locked_until = datetime.utcnow() + timedelta(
                    minutes=self.config.lockout_duration_minutes
                )
            
            await self.audit_logger.log_event(
                SecurityEvent.LOGIN_FAILURE,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "Invalid password"},
                risk_score=0.7
            )
            self.login_attempts.labels(status='failed', method='password').inc()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # MFA verification
        if user.mfa_enabled:
            if not mfa_token:
                raise HTTPException(status_code=401, detail="MFA token required")
            
            if not self.mfa_manager.verify_totp(user.mfa_secret, mfa_token):
                await self.audit_logger.log_event(
                    SecurityEvent.LOGIN_FAILURE,
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    details={"reason": "Invalid MFA token"},
                    risk_score=0.8
                )
                raise HTTPException(status_code=401, detail="Invalid MFA token")
        
        # Successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        
        # Create tokens
        access_token = self.jwt_manager.create_access_token(user.id, user.permissions)
        refresh_token = self.jwt_manager.create_refresh_token(user.id)
        
        # Create session
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "user_id": user.id,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        await self.audit_logger.log_event(
            SecurityEvent.LOGIN_SUCCESS,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"session_id": session_id},
            risk_score=0.1
        )
        
        self.login_attempts.labels(status='success', method='password').inc()
        self.active_sessions.set(len(self.sessions))
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "session_id": session_id,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "roles": user.roles,
                "permissions": user.permissions
            }
        }
    
    async def create_user(self, username: str, email: str, password: str,
                         roles: List[str] = None) -> User:
        """Create new user"""
        
        # Validate password
        validation = self.password_validator.validate_password(password)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["errors"])
        
        # Check if user exists
        if self._get_user_by_username(username) or self._get_user_by_email(email):
            raise HTTPException(status_code=409, detail="User already exists")
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=self.password_validator.hash_password(password),
            roles=roles or [],
            permissions=self._get_permissions_for_roles(roles or [])
        )
        
        self.users[user.id] = user
        
        await self.audit_logger.log_event(
            SecurityEvent.DATA_ACCESS,
            details={"action": "user_created", "user_id": user.id},
            risk_score=0.2
        )
        
        return user
    
    def _get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        for user in self.users.values():
            if user.username == username:
                return user
        return None
    
    def _get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        for user in self.users.values():
            if user.email == email:
                return user
        return None
    
    def _get_permissions_for_roles(self, roles: List[str]) -> List[str]:
        """Get permissions for roles"""
        # This would typically come from a database
        role_permissions = {
            "admin": ["read", "write", "admin"],
            "user": ["read", "write"],
            "viewer": ["read"]
        }
        
        permissions = set()
        for role in roles:
            permissions.update(role_permissions.get(role, []))
        
        return list(permissions)
    
    async def verify_token_and_get_user(self, token: str) -> User:
        """Verify JWT token and return user"""
        payload = self.jwt_manager.verify_token(token)
        user_id = payload["sub"]
        
        user = self.users.get(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        return user
    
    def check_permission(self, user: User, required_permission: str) -> bool:
        """Check if user has required permission"""
        return required_permission in user.permissions
    
    async def enable_mfa(self, user_id: str) -> Dict[str, Any]:
        """Enable MFA for user"""
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        secret = self.mfa_manager.generate_secret()
        qr_code = self.mfa_manager.generate_qr_code(user.email, secret)
        backup_codes = self.mfa_manager.generate_backup_codes()
        
        user.mfa_secret = secret
        user.mfa_enabled = True
        
        return {
            "secret": secret,
            "qr_code": base64.b64encode(qr_code).decode(),
            "backup_codes": backup_codes
        }
    
    async def get_security_metrics(self) -> Dict[str, Any]:
        """Get security system metrics"""
        return {
            "total_users": len(self.users),
            "active_sessions": len(self.sessions),
            "mfa_enabled_users": sum(1 for user in self.users.values() if user.mfa_enabled),
            "locked_accounts": sum(1 for user in self.users.values() 
                                 if user.locked_until and user.locked_until > datetime.utcnow())
        }


# FastAPI dependencies
security = HTTPBearer()

def get_security_system() -> SecuritySystem:
    """Get security system instance"""
    # This would typically be injected
    config = SecurityConfig(
        jwt_secret_key=os.getenv("JWT_SECRET_KEY", "your-secret-key"),
        encryption_key=os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
    )
    return SecuritySystem(config)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    security_system: SecuritySystem = Depends(get_security_system)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    return await security_system.verify_token_and_get_user(token)

def require_permission(permission: str):
    """Decorator to require specific permission"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            user = kwargs.get('current_user')
            security_system = kwargs.get('security_system')
            
            if not user or not security_system.check_permission(user, permission):
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def main():
        # Create security configuration
        config = SecurityConfig(
            jwt_secret_key="your-secret-key-here",
            encryption_key=Fernet.generate_key().decode(),
            password_min_length=8,
            max_failed_attempts=3,
            lockout_duration_minutes=15
        )
        
        # Initialize security system
        security_system = SecuritySystem(config)
        
        # Create test user
        user = await security_system.create_user(
            username="testuser",
            email="test@example.com",
            password="SecurePass123!",
            roles=["user"]
        )
        
        print(f"Created user: {user.username}")
        
        # Test authentication
        try:
            auth_result = await security_system.authenticate_user(
                username="testuser",
                password="SecurePass123!",
                ip_address="127.0.0.1",
                user_agent="Test Client"
            )
            
            print(f"Authentication successful: {auth_result['access_token'][:20]}...")
            
        except HTTPException as e:
            print(f"Authentication failed: {e.detail}")
        
        # Get security metrics
        metrics = await security_system.get_security_metrics()
        print(f"Security metrics: {metrics}")
    
    asyncio.run(main())