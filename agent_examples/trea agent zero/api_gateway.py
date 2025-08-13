"""
Advanced API Gateway and Load Balancer for Cognitive AI Framework
Includes authentication, rate limiting, service discovery, and intelligent routing
"""

import os
import json
import asyncio
import logging
import time
import hashlib
import hmac
import jwt
from typing import Dict, List, Optional, Any, Callable, Union, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import random
import aiohttp
import aioredis
from fastapi import FastAPI, Request, Response, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import uvicorn
from prometheus_client import Counter, Histogram, Gauge
import structlog
import consul
import etcd3
from circuit_breaker import CircuitBreaker
import yaml


class LoadBalancingStrategy(Enum):
    """Load balancing strategies"""
    ROUND_ROBIN = "round_robin"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    LEAST_CONNECTIONS = "least_connections"
    LEAST_RESPONSE_TIME = "least_response_time"
    IP_HASH = "ip_hash"
    RANDOM = "random"
    HEALTH_BASED = "health_based"


class AuthenticationMethod(Enum):
    """Authentication methods"""
    JWT = "jwt"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC = "basic"
    CUSTOM = "custom"


@dataclass
class ServiceInstance:
    """Service instance configuration"""
    id: str
    host: str
    port: int
    weight: int = 1
    healthy: bool = True
    connections: int = 0
    response_time: float = 0.0
    last_health_check: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"


@dataclass
class ServiceConfig:
    """Service configuration"""
    name: str
    path_prefix: str
    instances: List[ServiceInstance] = field(default_factory=list)
    load_balancing_strategy: LoadBalancingStrategy = LoadBalancingStrategy.ROUND_ROBIN
    health_check_path: str = "/health"
    health_check_interval: int = 30
    timeout: int = 30
    retries: int = 3
    circuit_breaker_config: Dict[str, Any] = field(default_factory=dict)
    rate_limit: Optional[Dict[str, Any]] = None
    authentication_required: bool = True
    allowed_methods: List[str] = field(default_factory=lambda: ["GET", "POST", "PUT", "DELETE"])


@dataclass
class RateLimitRule:
    """Rate limiting rule"""
    key: str  # e.g., "user_id", "ip_address", "api_key"
    limit: int  # requests per window
    window: int  # window size in seconds
    burst: int = 0  # burst allowance


@dataclass
class AuthConfig:
    """Authentication configuration"""
    method: AuthenticationMethod
    jwt_secret: Optional[str] = None
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600
    api_keys: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    oauth2_config: Dict[str, Any] = field(default_factory=dict)
    custom_auth_handler: Optional[Callable] = None


class ServiceDiscovery:
    """Service discovery interface"""
    
    def __init__(self, discovery_type: str = "consul", config: Dict[str, Any] = None):
        self.discovery_type = discovery_type
        self.config = config or {}
        self.logger = structlog.get_logger(__name__)
        self._client = None
        self._setup_client()
    
    def _setup_client(self):
        """Setup service discovery client"""
        if self.discovery_type == "consul":
            self._client = consul.Consul(
                host=self.config.get('host', 'localhost'),
                port=self.config.get('port', 8500)
            )
        elif self.discovery_type == "etcd":
            self._client = etcd3.client(
                host=self.config.get('host', 'localhost'),
                port=self.config.get('port', 2379)
            )
    
    async def register_service(self, service: ServiceConfig, instance: ServiceInstance):
        """Register a service instance"""
        try:
            if self.discovery_type == "consul":
                self._client.agent.service.register(
                    name=service.name,
                    service_id=instance.id,
                    address=instance.host,
                    port=instance.port,
                    check=consul.Check.http(
                        f"{instance.url}{service.health_check_path}",
                        interval=f"{service.health_check_interval}s"
                    ),
                    meta=instance.metadata
                )
            elif self.discovery_type == "etcd":
                key = f"/services/{service.name}/{instance.id}"
                value = json.dumps({
                    "host": instance.host,
                    "port": instance.port,
                    "weight": instance.weight,
                    "metadata": instance.metadata
                })
                self._client.put(key, value)
                
            self.logger.info(
                "Service registered",
                service=service.name,
                instance_id=instance.id,
                address=f"{instance.host}:{instance.port}"
            )
            
        except Exception as e:
            self.logger.error(
                "Failed to register service",
                service=service.name,
                instance_id=instance.id,
                error=str(e)
            )
    
    async def discover_services(self, service_name: str) -> List[ServiceInstance]:
        """Discover service instances"""
        try:
            instances = []
            
            if self.discovery_type == "consul":
                _, services = self._client.health.service(service_name, passing=True)
                for service in services:
                    instance = ServiceInstance(
                        id=service['Service']['ID'],
                        host=service['Service']['Address'],
                        port=service['Service']['Port'],
                        weight=service['Service'].get('Meta', {}).get('weight', 1),
                        metadata=service['Service'].get('Meta', {})
                    )
                    instances.append(instance)
            
            elif self.discovery_type == "etcd":
                prefix = f"/services/{service_name}/"
                for value, metadata in self._client.get_prefix(prefix):
                    service_data = json.loads(value.decode())
                    instance = ServiceInstance(
                        id=metadata.key.decode().split('/')[-1],
                        host=service_data['host'],
                        port=service_data['port'],
                        weight=service_data.get('weight', 1),
                        metadata=service_data.get('metadata', {})
                    )
                    instances.append(instance)
            
            return instances
            
        except Exception as e:
            self.logger.error(
                "Failed to discover services",
                service=service_name,
                error=str(e)
            )
            return []
    
    async def deregister_service(self, service_name: str, instance_id: str):
        """Deregister a service instance"""
        try:
            if self.discovery_type == "consul":
                self._client.agent.service.deregister(instance_id)
            elif self.discovery_type == "etcd":
                key = f"/services/{service_name}/{instance_id}"
                self._client.delete(key)
                
            self.logger.info(
                "Service deregistered",
                service=service_name,
                instance_id=instance_id
            )
            
        except Exception as e:
            self.logger.error(
                "Failed to deregister service",
                service=service_name,
                instance_id=instance_id,
                error=str(e)
            )


class LoadBalancer:
    """Load balancer with multiple strategies"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
        self._round_robin_counters: Dict[str, int] = {}
    
    def select_instance(self, service: ServiceConfig, client_ip: str = None) -> Optional[ServiceInstance]:
        """Select a service instance based on load balancing strategy"""
        healthy_instances = [inst for inst in service.instances if inst.healthy]
        
        if not healthy_instances:
            return None
        
        strategy = service.load_balancing_strategy
        
        if strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._round_robin(service.name, healthy_instances)
        elif strategy == LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
            return self._weighted_round_robin(service.name, healthy_instances)
        elif strategy == LoadBalancingStrategy.LEAST_CONNECTIONS:
            return self._least_connections(healthy_instances)
        elif strategy == LoadBalancingStrategy.LEAST_RESPONSE_TIME:
            return self._least_response_time(healthy_instances)
        elif strategy == LoadBalancingStrategy.IP_HASH:
            return self._ip_hash(healthy_instances, client_ip)
        elif strategy == LoadBalancingStrategy.RANDOM:
            return self._random(healthy_instances)
        elif strategy == LoadBalancingStrategy.HEALTH_BASED:
            return self._health_based(healthy_instances)
        else:
            return self._round_robin(service.name, healthy_instances)
    
    def _round_robin(self, service_name: str, instances: List[ServiceInstance]) -> ServiceInstance:
        """Round robin load balancing"""
        if service_name not in self._round_robin_counters:
            self._round_robin_counters[service_name] = 0
        
        index = self._round_robin_counters[service_name] % len(instances)
        self._round_robin_counters[service_name] += 1
        
        return instances[index]
    
    def _weighted_round_robin(self, service_name: str, instances: List[ServiceInstance]) -> ServiceInstance:
        """Weighted round robin load balancing"""
        total_weight = sum(inst.weight for inst in instances)
        
        if service_name not in self._round_robin_counters:
            self._round_robin_counters[service_name] = 0
        
        target = self._round_robin_counters[service_name] % total_weight
        self._round_robin_counters[service_name] += 1
        
        current_weight = 0
        for instance in instances:
            current_weight += instance.weight
            if target < current_weight:
                return instance
        
        return instances[0]
    
    def _least_connections(self, instances: List[ServiceInstance]) -> ServiceInstance:
        """Least connections load balancing"""
        return min(instances, key=lambda inst: inst.connections)
    
    def _least_response_time(self, instances: List[ServiceInstance]) -> ServiceInstance:
        """Least response time load balancing"""
        return min(instances, key=lambda inst: inst.response_time)
    
    def _ip_hash(self, instances: List[ServiceInstance], client_ip: str) -> ServiceInstance:
        """IP hash load balancing"""
        if not client_ip:
            return self._random(instances)
        
        hash_value = hash(client_ip)
        index = hash_value % len(instances)
        return instances[index]
    
    def _random(self, instances: List[ServiceInstance]) -> ServiceInstance:
        """Random load balancing"""
        return random.choice(instances)
    
    def _health_based(self, instances: List[ServiceInstance]) -> ServiceInstance:
        """Health-based load balancing (prefer instances with better health scores)"""
        # Simple implementation: prefer instances with lower response time and fewer connections
        def health_score(inst):
            return inst.response_time + (inst.connections * 0.1)
        
        return min(instances, key=health_score)


class RateLimiter:
    """Redis-based rate limiter"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis = None
        self.logger = structlog.get_logger(__name__)
    
    async def initialize(self):
        """Initialize Redis connection"""
        self.redis = await aioredis.from_url(self.redis_url)
    
    async def is_allowed(self, rule: RateLimitRule, identifier: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if request is allowed under rate limit"""
        if not self.redis:
            await self.initialize()
        
        key = f"rate_limit:{rule.key}:{identifier}"
        current_time = int(time.time())
        window_start = current_time - rule.window
        
        # Use Redis pipeline for atomic operations
        pipe = self.redis.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(current_time): current_time})
        
        # Set expiration
        pipe.expire(key, rule.window)
        
        results = await pipe.execute()
        current_requests = results[1]
        
        # Check if limit exceeded
        allowed = current_requests < rule.limit
        
        if not allowed:
            # Remove the request we just added since it's not allowed
            await self.redis.zrem(key, str(current_time))
        
        return allowed, {
            "limit": rule.limit,
            "remaining": max(0, rule.limit - current_requests - 1),
            "reset_time": window_start + rule.window,
            "window": rule.window
        }


class AuthenticationManager:
    """Authentication and authorization manager"""
    
    def __init__(self, config: AuthConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.security = HTTPBearer()
    
    async def authenticate(self, request: Request) -> Dict[str, Any]:
        """Authenticate request and return user context"""
        if self.config.method == AuthenticationMethod.JWT:
            return await self._authenticate_jwt(request)
        elif self.config.method == AuthenticationMethod.API_KEY:
            return await self._authenticate_api_key(request)
        elif self.config.method == AuthenticationMethod.OAUTH2:
            return await self._authenticate_oauth2(request)
        elif self.config.method == AuthenticationMethod.BASIC:
            return await self._authenticate_basic(request)
        elif self.config.method == AuthenticationMethod.CUSTOM:
            return await self._authenticate_custom(request)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication method not supported"
            )
    
    async def _authenticate_jwt(self, request: Request) -> Dict[str, Any]:
        """JWT authentication"""
        try:
            credentials: HTTPAuthorizationCredentials = await self.security(request)
            token = credentials.credentials
            
            payload = jwt.decode(
                token,
                self.config.jwt_secret,
                algorithms=[self.config.jwt_algorithm]
            )
            
            # Check expiration
            if payload.get('exp', 0) < time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token expired"
                )
            
            return {
                "user_id": payload.get('user_id'),
                "username": payload.get('username'),
                "roles": payload.get('roles', []),
                "permissions": payload.get('permissions', []),
                "token_type": "jwt"
            }
            
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except Exception as e:
            self.logger.error("JWT authentication failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )
    
    async def _authenticate_api_key(self, request: Request) -> Dict[str, Any]:
        """API key authentication"""
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            api_key = request.query_params.get("api_key")
        
        if not api_key or api_key not in self.config.api_keys:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        
        key_info = self.config.api_keys[api_key]
        
        # Check if key is active
        if not key_info.get('active', True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key is inactive"
            )
        
        # Check expiration
        if key_info.get('expires_at'):
            expires_at = datetime.fromisoformat(key_info['expires_at'])
            if datetime.utcnow() > expires_at:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key expired"
                )
        
        return {
            "user_id": key_info.get('user_id'),
            "username": key_info.get('username'),
            "roles": key_info.get('roles', []),
            "permissions": key_info.get('permissions', []),
            "api_key": api_key,
            "token_type": "api_key"
        }
    
    async def _authenticate_oauth2(self, request: Request) -> Dict[str, Any]:
        """OAuth2 authentication"""
        # Simplified OAuth2 implementation
        # In production, you'd integrate with OAuth2 providers
        try:
            credentials: HTTPAuthorizationCredentials = await self.security(request)
            token = credentials.credentials
            
            # Validate token with OAuth2 provider
            oauth2_config = self.config.oauth2_config
            validation_url = oauth2_config.get('validation_url')
            
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"}
                async with session.get(validation_url, headers=headers) as response:
                    if response.status != 200:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid OAuth2 token"
                        )
                    
                    user_info = await response.json()
                    return {
                        "user_id": user_info.get('sub'),
                        "username": user_info.get('username'),
                        "email": user_info.get('email'),
                        "roles": user_info.get('roles', []),
                        "token_type": "oauth2"
                    }
                    
        except Exception as e:
            self.logger.error("OAuth2 authentication failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OAuth2 authentication failed"
            )
    
    async def _authenticate_basic(self, request: Request) -> Dict[str, Any]:
        """Basic authentication"""
        # Implementation for basic auth
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Basic authentication not implemented"
        )
    
    async def _authenticate_custom(self, request: Request) -> Dict[str, Any]:
        """Custom authentication"""
        if self.config.custom_auth_handler:
            return await self.config.custom_auth_handler(request)
        else:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Custom authentication handler not configured"
            )


class HealthChecker:
    """Health checker for service instances"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
    
    async def check_health(self, service: ServiceConfig, instance: ServiceInstance) -> bool:
        """Check health of a service instance"""
        try:
            url = f"{instance.url}{service.health_check_path}"
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                start_time = time.time()
                async with session.get(url) as response:
                    response_time = time.time() - start_time
                    
                    # Update instance metrics
                    instance.response_time = response_time
                    instance.last_health_check = datetime.utcnow()
                    
                    # Consider healthy if status is 2xx
                    healthy = 200 <= response.status < 300
                    instance.healthy = healthy
                    
                    if not healthy:
                        self.logger.warning(
                            "Health check failed",
                            service=service.name,
                            instance=instance.id,
                            status_code=response.status,
                            response_time=response_time
                        )
                    
                    return healthy
                    
        except Exception as e:
            instance.healthy = False
            instance.last_health_check = datetime.utcnow()
            
            self.logger.error(
                "Health check error",
                service=service.name,
                instance=instance.id,
                error=str(e)
            )
            
            return False


class APIGateway:
    """Main API Gateway class"""
    
    def __init__(self, config_path: str = "gateway_config.yaml"):
        self.config = self._load_config(config_path)
        self.app = FastAPI(title="Cognitive AI API Gateway", version="1.0.0")
        
        # Initialize components
        self.services: Dict[str, ServiceConfig] = {}
        self.load_balancer = LoadBalancer()
        self.rate_limiter = RateLimiter(self.config.get('redis_url', 'redis://localhost:6379'))
        self.auth_manager = AuthenticationManager(
            AuthConfig(**self.config.get('authentication', {}))
        )
        self.health_checker = HealthChecker()
        self.service_discovery = ServiceDiscovery(
            self.config.get('service_discovery', {}).get('type', 'consul'),
            self.config.get('service_discovery', {}).get('config', {})
        )
        
        # Circuit breakers for services
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        
        # Metrics
        self._setup_metrics()
        
        # Setup middleware and routes
        self._setup_middleware()
        self._setup_routes()
        
        self.logger = structlog.get_logger(__name__)
        
        # Background tasks
        self._health_check_task = None
        self._service_discovery_task = None
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load gateway configuration"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.warning(f"Config file not found: {config_path}, using defaults")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default gateway configuration"""
        return {
            "host": "0.0.0.0",
            "port": 8080,
            "redis_url": "redis://localhost:6379",
            "authentication": {
                "method": "jwt",
                "jwt_secret": "your-secret-key",
                "jwt_algorithm": "HS256"
            },
            "cors": {
                "allow_origins": ["*"],
                "allow_methods": ["*"],
                "allow_headers": ["*"]
            },
            "rate_limiting": {
                "default": {
                    "limit": 100,
                    "window": 60
                }
            },
            "services": []
        }
    
    def _setup_metrics(self):
        """Setup Prometheus metrics"""
        self.request_count = Counter(
            'gateway_requests_total',
            'Total requests through gateway',
            ['service', 'method', 'status']
        )
        
        self.request_duration = Histogram(
            'gateway_request_duration_seconds',
            'Request duration through gateway',
            ['service', 'method']
        )
        
        self.active_connections = Gauge(
            'gateway_active_connections',
            'Active connections per service',
            ['service']
        )
        
        self.rate_limit_hits = Counter(
            'gateway_rate_limit_hits_total',
            'Rate limit hits',
            ['service', 'rule']
        )
    
    def _setup_middleware(self):
        """Setup FastAPI middleware"""
        # CORS middleware
        cors_config = self.config.get('cors', {})
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_config.get('allow_origins', ["*"]),
            allow_credentials=cors_config.get('allow_credentials', True),
            allow_methods=cors_config.get('allow_methods', ["*"]),
            allow_headers=cors_config.get('allow_headers', ["*"])
        )
        
        # Trusted host middleware
        if self.config.get('trusted_hosts'):
            self.app.add_middleware(
                TrustedHostMiddleware,
                allowed_hosts=self.config['trusted_hosts']
            )
    
    def _setup_routes(self):
        """Setup gateway routes"""
        
        @self.app.get("/health")
        async def health_check():
            """Gateway health check"""
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    name: {
                        "healthy_instances": len([i for i in service.instances if i.healthy]),
                        "total_instances": len(service.instances)
                    }
                    for name, service in self.services.items()
                }
            }
        
        @self.app.get("/metrics")
        async def metrics():
            """Prometheus metrics endpoint"""
            from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
            return Response(
                generate_latest(),
                media_type=CONTENT_TYPE_LATEST
            )
        
        @self.app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
        async def proxy_request(request: Request, path: str):
            """Main proxy handler"""
            return await self._handle_request(request, path)
    
    async def _handle_request(self, request: Request, path: str) -> Response:
        """Handle incoming request and proxy to appropriate service"""
        start_time = time.time()
        service_name = None
        
        try:
            # Find matching service
            service = self._find_service(path)
            if not service:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Service not found"
                )
            
            service_name = service.name
            
            # Authentication
            if service.authentication_required:
                user_context = await self.auth_manager.authenticate(request)
                request.state.user = user_context
            
            # Rate limiting
            if service.rate_limit:
                await self._check_rate_limit(request, service)
            
            # Load balancing
            instance = self.load_balancer.select_instance(
                service,
                client_ip=request.client.host if request.client else None
            )
            
            if not instance:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="No healthy instances available"
                )
            
            # Circuit breaker check
            circuit_breaker = self._get_circuit_breaker(service.name)
            if circuit_breaker.state == "open":
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Service temporarily unavailable"
                )
            
            # Proxy request
            response = await self._proxy_request(request, service, instance, path)
            
            # Update metrics
            instance.connections -= 1
            circuit_breaker.record_success()
            
            # Record metrics
            duration = time.time() - start_time
            self.request_count.labels(
                service=service_name,
                method=request.method,
                status=response.status_code
            ).inc()
            
            self.request_duration.labels(
                service=service_name,
                method=request.method
            ).observe(duration)
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            # Record failure
            if service_name:
                circuit_breaker = self._get_circuit_breaker(service_name)
                circuit_breaker.record_failure()
                
                self.request_count.labels(
                    service=service_name,
                    method=request.method,
                    status=500
                ).inc()
            
            self.logger.error(
                "Request handling failed",
                path=path,
                error=str(e)
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    def _find_service(self, path: str) -> Optional[ServiceConfig]:
        """Find service matching the request path"""
        for service in self.services.values():
            if path.startswith(service.path_prefix.lstrip('/')):
                return service
        return None
    
    async def _check_rate_limit(self, request: Request, service: ServiceConfig):
        """Check rate limiting for request"""
        if not service.rate_limit:
            return
        
        # Determine rate limit key
        rate_limit_config = service.rate_limit
        key_type = rate_limit_config.get('key', 'ip_address')
        
        if key_type == 'ip_address':
            identifier = request.client.host if request.client else 'unknown'
        elif key_type == 'user_id':
            user = getattr(request.state, 'user', {})
            identifier = user.get('user_id', 'anonymous')
        elif key_type == 'api_key':
            user = getattr(request.state, 'user', {})
            identifier = user.get('api_key', 'unknown')
        else:
            identifier = 'default'
        
        # Create rate limit rule
        rule = RateLimitRule(
            key=key_type,
            limit=rate_limit_config.get('limit', 100),
            window=rate_limit_config.get('window', 60),
            burst=rate_limit_config.get('burst', 0)
        )
        
        # Check rate limit
        allowed, info = await self.rate_limiter.is_allowed(rule, identifier)
        
        if not allowed:
            self.rate_limit_hits.labels(
                service=service.name,
                rule=key_type
            ).inc()
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={
                    "X-RateLimit-Limit": str(info['limit']),
                    "X-RateLimit-Remaining": str(info['remaining']),
                    "X-RateLimit-Reset": str(info['reset_time'])
                }
            )
    
    def _get_circuit_breaker(self, service_name: str) -> CircuitBreaker:
        """Get or create circuit breaker for service"""
        if service_name not in self.circuit_breakers:
            service = self.services[service_name]
            cb_config = service.circuit_breaker_config
            
            self.circuit_breakers[service_name] = CircuitBreaker(
                failure_threshold=cb_config.get('failure_threshold', 5),
                recovery_timeout=cb_config.get('recovery_timeout', 60),
                expected_exception=Exception
            )
        
        return self.circuit_breakers[service_name]
    
    async def _proxy_request(self, request: Request, service: ServiceConfig, 
                           instance: ServiceInstance, path: str) -> Response:
        """Proxy request to service instance"""
        # Prepare target URL
        target_path = path
        if service.path_prefix and path.startswith(service.path_prefix.lstrip('/')):
            target_path = path[len(service.path_prefix.lstrip('/')):]
        
        target_url = f"{instance.url}/{target_path.lstrip('/')}"
        
        # Prepare headers
        headers = dict(request.headers)
        headers.pop('host', None)  # Remove host header
        
        # Add forwarding headers
        headers['X-Forwarded-For'] = request.client.host if request.client else 'unknown'
        headers['X-Forwarded-Proto'] = request.url.scheme
        headers['X-Forwarded-Host'] = request.headers.get('host', 'unknown')
        
        # Update connection count
        instance.connections += 1
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=service.timeout)) as session:
                # Prepare request data
                data = None
                if request.method in ['POST', 'PUT', 'PATCH']:
                    data = await request.body()
                
                # Make request
                async with session.request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    params=dict(request.query_params),
                    data=data
                ) as response:
                    # Read response
                    content = await response.read()
                    
                    # Prepare response headers
                    response_headers = dict(response.headers)
                    response_headers.pop('content-encoding', None)
                    response_headers.pop('content-length', None)
                    response_headers.pop('transfer-encoding', None)
                    
                    return Response(
                        content=content,
                        status_code=response.status,
                        headers=response_headers,
                        media_type=response.headers.get('content-type')
                    )
                    
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Service timeout"
            )
        except Exception as e:
            self.logger.error(
                "Proxy request failed",
                service=service.name,
                instance=instance.id,
                target_url=target_url,
                error=str(e)
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Service unavailable"
            )
        finally:
            instance.connections -= 1
    
    async def start(self):
        """Start the API gateway"""
        # Load services from configuration
        await self._load_services()
        
        # Start background tasks
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        self._service_discovery_task = asyncio.create_task(self._service_discovery_loop())
        
        self.logger.info("API Gateway started")
    
    async def stop(self):
        """Stop the API gateway"""
        # Cancel background tasks
        if self._health_check_task:
            self._health_check_task.cancel()
        if self._service_discovery_task:
            self._service_discovery_task.cancel()
        
        self.logger.info("API Gateway stopped")
    
    async def _load_services(self):
        """Load services from configuration"""
        services_config = self.config.get('services', [])
        
        for service_config in services_config:
            service = ServiceConfig(
                name=service_config['name'],
                path_prefix=service_config['path_prefix'],
                load_balancing_strategy=LoadBalancingStrategy(
                    service_config.get('load_balancing_strategy', 'round_robin')
                ),
                health_check_path=service_config.get('health_check_path', '/health'),
                health_check_interval=service_config.get('health_check_interval', 30),
                timeout=service_config.get('timeout', 30),
                retries=service_config.get('retries', 3),
                circuit_breaker_config=service_config.get('circuit_breaker', {}),
                rate_limit=service_config.get('rate_limit'),
                authentication_required=service_config.get('authentication_required', True),
                allowed_methods=service_config.get('allowed_methods', ["GET", "POST", "PUT", "DELETE"])
            )
            
            # Load instances
            for instance_config in service_config.get('instances', []):
                instance = ServiceInstance(
                    id=instance_config['id'],
                    host=instance_config['host'],
                    port=instance_config['port'],
                    weight=instance_config.get('weight', 1),
                    metadata=instance_config.get('metadata', {})
                )
                service.instances.append(instance)
            
            self.services[service.name] = service
    
    async def _health_check_loop(self):
        """Background health checking loop"""
        while True:
            try:
                tasks = []
                for service in self.services.values():
                    for instance in service.instances:
                        tasks.append(
                            self.health_checker.check_health(service, instance)
                        )
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error("Health check loop error", error=str(e))
                await asyncio.sleep(5)
    
    async def _service_discovery_loop(self):
        """Background service discovery loop"""
        while True:
            try:
                for service in self.services.values():
                    # Discover new instances
                    discovered_instances = await self.service_discovery.discover_services(service.name)
                    
                    # Update service instances
                    existing_ids = {inst.id for inst in service.instances}
                    discovered_ids = {inst.id for inst in discovered_instances}
                    
                    # Add new instances
                    for instance in discovered_instances:
                        if instance.id not in existing_ids:
                            service.instances.append(instance)
                            self.logger.info(
                                "New service instance discovered",
                                service=service.name,
                                instance_id=instance.id
                            )
                    
                    # Remove instances that are no longer discovered
                    service.instances = [
                        inst for inst in service.instances
                        if inst.id in discovered_ids
                    ]
                
                await asyncio.sleep(60)  # Discover every minute
                
            except Exception as e:
                self.logger.error("Service discovery loop error", error=str(e))
                await asyncio.sleep(10)


def create_gateway_config():
    """Create example gateway configuration"""
    config = {
        "host": "0.0.0.0",
        "port": 8080,
        "redis_url": "redis://localhost:6379",
        "authentication": {
            "method": "jwt",
            "jwt_secret": "your-secret-key-change-this",
            "jwt_algorithm": "HS256",
            "jwt_expiration": 3600,
            "api_keys": {
                "test-key-123": {
                    "user_id": "test-user",
                    "username": "test",
                    "roles": ["user"],
                    "permissions": ["read", "write"],
                    "active": True
                }
            }
        },
        "cors": {
            "allow_origins": ["*"],
            "allow_methods": ["*"],
            "allow_headers": ["*"],
            "allow_credentials": True
        },
        "service_discovery": {
            "type": "consul",
            "config": {
                "host": "localhost",
                "port": 8500
            }
        },
        "rate_limiting": {
            "default": {
                "limit": 100,
                "window": 60,
                "key": "ip_address"
            }
        },
        "services": [
            {
                "name": "cognitive-api",
                "path_prefix": "/api/cognitive",
                "load_balancing_strategy": "round_robin",
                "health_check_path": "/health",
                "health_check_interval": 30,
                "timeout": 30,
                "retries": 3,
                "authentication_required": True,
                "rate_limit": {
                    "limit": 50,
                    "window": 60,
                    "key": "user_id"
                },
                "circuit_breaker": {
                    "failure_threshold": 5,
                    "recovery_timeout": 60
                },
                "instances": [
                    {
                        "id": "cognitive-api-1",
                        "host": "localhost",
                        "port": 8000,
                        "weight": 1
                    },
                    {
                        "id": "cognitive-api-2",
                        "host": "localhost",
                        "port": 8001,
                        "weight": 1
                    }
                ]
            },
            {
                "name": "emotional-ai",
                "path_prefix": "/api/emotional",
                "load_balancing_strategy": "least_connections",
                "health_check_path": "/health",
                "health_check_interval": 30,
                "timeout": 45,
                "retries": 2,
                "authentication_required": True,
                "rate_limit": {
                    "limit": 30,
                    "window": 60,
                    "key": "api_key"
                },
                "instances": [
                    {
                        "id": "emotional-ai-1",
                        "host": "localhost",
                        "port": 8002,
                        "weight": 2
                    }
                ]
            },
            {
                "name": "consciousness-service",
                "path_prefix": "/api/consciousness",
                "load_balancing_strategy": "weighted_round_robin",
                "health_check_path": "/health",
                "authentication_required": True,
                "instances": [
                    {
                        "id": "consciousness-1",
                        "host": "localhost",
                        "port": 8003,
                        "weight": 1
                    }
                ]
            }
        ]
    }
    
    with open("gateway_config.yaml", 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    return config


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="API Gateway")
    parser.add_argument("--create-config", action="store_true",
                       help="Create example gateway configuration")
    parser.add_argument("--config", type=str, default="gateway_config.yaml",
                       help="Path to gateway configuration file")
    parser.add_argument("--host", type=str, default="0.0.0.0",
                       help="Host to bind to")
    parser.add_argument("--port", type=int, default=8080,
                       help="Port to bind to")
    
    args = parser.parse_args()
    
    if args.create_config:
        config = create_gateway_config()
        print("Gateway configuration created: gateway_config.yaml")
    else:
        # Run gateway
        async def main():
            gateway = APIGateway(args.config)
            await gateway.start()
            
            # Run the FastAPI app
            config = uvicorn.Config(
                gateway.app,
                host=args.host,
                port=args.port,
                log_level="info"
            )
            server = uvicorn.Server(config)
            
            try:
                await server.serve()
            except KeyboardInterrupt:
                await gateway.stop()
        
        asyncio.run(main())