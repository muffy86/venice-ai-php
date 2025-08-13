"""
Advanced Monitoring and Observability System for Cognitive AI Framework
Includes metrics collection, distributed tracing, logging, alerting, and health monitoring
"""

import os
import json
import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import threading
from collections import defaultdict, deque
import psutil
import numpy as np
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, Info,
    CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
)
import opentelemetry
from opentelemetry import trace, metrics
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
import structlog
import elasticsearch
from elasticsearch import Elasticsearch
import redis
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import yaml


class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MetricType(Enum):
    """Types of metrics"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


@dataclass
class AlertRule:
    """Configuration for an alert rule"""
    name: str
    metric_name: str
    condition: str  # e.g., "> 0.8", "< 0.1"
    threshold: float
    severity: AlertSeverity
    duration: int = 300  # seconds
    description: str = ""
    runbook_url: str = ""
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class Alert:
    """An active alert"""
    rule: AlertRule
    value: float
    timestamp: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    annotations: Dict[str, str] = field(default_factory=dict)


@dataclass
class HealthCheck:
    """Health check configuration"""
    name: str
    endpoint: str
    interval: int = 30  # seconds
    timeout: int = 5
    expected_status: int = 200
    expected_response: Optional[str] = None
    labels: Dict[str, str] = field(default_factory=dict)


class MetricsCollector:
    """Prometheus metrics collector for the AI framework"""
    
    def __init__(self, registry: Optional[CollectorRegistry] = None):
        self.registry = registry or CollectorRegistry()
        self._setup_metrics()
        self.logger = structlog.get_logger(__name__)
    
    def _setup_metrics(self):
        """Initialize Prometheus metrics"""
        # System metrics
        self.cpu_usage = Gauge(
            'system_cpu_usage_percent',
            'CPU usage percentage',
            registry=self.registry
        )
        
        self.memory_usage = Gauge(
            'system_memory_usage_bytes',
            'Memory usage in bytes',
            ['type'],
            registry=self.registry
        )
        
        self.disk_usage = Gauge(
            'system_disk_usage_bytes',
            'Disk usage in bytes',
            ['device', 'type'],
            registry=self.registry
        )
        
        # AI Framework metrics
        self.cognitive_requests = Counter(
            'cognitive_requests_total',
            'Total cognitive processing requests',
            ['endpoint', 'status'],
            registry=self.registry
        )
        
        self.cognitive_latency = Histogram(
            'cognitive_request_duration_seconds',
            'Cognitive request duration',
            ['endpoint'],
            registry=self.registry
        )
        
        self.emotional_analysis = Counter(
            'emotional_analysis_total',
            'Total emotional analysis requests',
            ['emotion_type', 'confidence_level'],
            registry=self.registry
        )
        
        self.consciousness_level = Gauge(
            'consciousness_level',
            'Current consciousness level',
            ['component'],
            registry=self.registry
        )
        
        self.memory_operations = Counter(
            'memory_operations_total',
            'Total memory operations',
            ['operation_type', 'memory_type'],
            registry=self.registry
        )
        
        self.attention_focus = Gauge(
            'attention_focus_score',
            'Current attention focus score',
            ['focus_type'],
            registry=self.registry
        )
        
        self.model_inference_time = Histogram(
            'model_inference_duration_seconds',
            'Model inference duration',
            ['model_name', 'model_type'],
            registry=self.registry
        )
        
        self.active_sessions = Gauge(
            'active_sessions_count',
            'Number of active user sessions',
            registry=self.registry
        )
        
        self.error_rate = Counter(
            'errors_total',
            'Total errors',
            ['component', 'error_type'],
            registry=self.registry
        )
        
        # Performance metrics
        self.throughput = Gauge(
            'throughput_requests_per_second',
            'Requests per second',
            ['service'],
            registry=self.registry
        )
        
        self.queue_size = Gauge(
            'queue_size',
            'Current queue size',
            ['queue_name'],
            registry=self.registry
        )
        
        # Business metrics
        self.user_satisfaction = Gauge(
            'user_satisfaction_score',
            'User satisfaction score',
            ['interaction_type'],
            registry=self.registry
        )
        
        self.feature_usage = Counter(
            'feature_usage_total',
            'Feature usage count',
            ['feature_name', 'user_type'],
            registry=self.registry
        )
    
    def collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.cpu_usage.set(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            self.memory_usage.labels(type='used').set(memory.used)
            self.memory_usage.labels(type='available').set(memory.available)
            self.memory_usage.labels(type='total').set(memory.total)
            
            # Disk usage
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    device = partition.device.replace(':', '').replace('\\', '_')
                    self.disk_usage.labels(device=device, type='used').set(usage.used)
                    self.disk_usage.labels(device=device, type='free').set(usage.free)
                    self.disk_usage.labels(device=device, type='total').set(usage.total)
                except PermissionError:
                    continue
                    
        except Exception as e:
            self.logger.error("Failed to collect system metrics", error=str(e))
    
    def record_cognitive_request(self, endpoint: str, status: str, duration: float):
        """Record a cognitive processing request"""
        self.cognitive_requests.labels(endpoint=endpoint, status=status).inc()
        self.cognitive_latency.labels(endpoint=endpoint).observe(duration)
    
    def record_emotional_analysis(self, emotion_type: str, confidence: float):
        """Record an emotional analysis"""
        confidence_level = "high" if confidence > 0.8 else "medium" if confidence > 0.5 else "low"
        self.emotional_analysis.labels(
            emotion_type=emotion_type,
            confidence_level=confidence_level
        ).inc()
    
    def update_consciousness_level(self, component: str, level: float):
        """Update consciousness level for a component"""
        self.consciousness_level.labels(component=component).set(level)
    
    def record_memory_operation(self, operation_type: str, memory_type: str):
        """Record a memory operation"""
        self.memory_operations.labels(
            operation_type=operation_type,
            memory_type=memory_type
        ).inc()
    
    def update_attention_focus(self, focus_type: str, score: float):
        """Update attention focus score"""
        self.attention_focus.labels(focus_type=focus_type).set(score)
    
    def record_model_inference(self, model_name: str, model_type: str, duration: float):
        """Record model inference time"""
        self.model_inference_time.labels(
            model_name=model_name,
            model_type=model_type
        ).observe(duration)
    
    def update_active_sessions(self, count: int):
        """Update active sessions count"""
        self.active_sessions.set(count)
    
    def record_error(self, component: str, error_type: str):
        """Record an error"""
        self.error_rate.labels(component=component, error_type=error_type).inc()
    
    def update_throughput(self, service: str, rps: float):
        """Update throughput metric"""
        self.throughput.labels(service=service).set(rps)
    
    def update_queue_size(self, queue_name: str, size: int):
        """Update queue size"""
        self.queue_size.labels(queue_name=queue_name).set(size)
    
    def record_user_satisfaction(self, interaction_type: str, score: float):
        """Record user satisfaction score"""
        self.user_satisfaction.labels(interaction_type=interaction_type).set(score)
    
    def record_feature_usage(self, feature_name: str, user_type: str):
        """Record feature usage"""
        self.feature_usage.labels(feature_name=feature_name, user_type=user_type).inc()


class DistributedTracing:
    """Distributed tracing setup using OpenTelemetry"""
    
    def __init__(self, service_name: str, jaeger_endpoint: str = "http://localhost:14268/api/traces"):
        self.service_name = service_name
        self.jaeger_endpoint = jaeger_endpoint
        self._setup_tracing()
        self.logger = structlog.get_logger(__name__)
    
    def _setup_tracing(self):
        """Setup OpenTelemetry tracing"""
        # Create tracer provider
        trace.set_tracer_provider(TracerProvider())
        
        # Create Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
        )
        
        # Create span processor
        span_processor = BatchSpanProcessor(jaeger_exporter)
        
        # Add span processor to tracer provider
        trace.get_tracer_provider().add_span_processor(span_processor)
        
        # Get tracer
        self.tracer = trace.get_tracer(self.service_name)
        
        # Instrument FastAPI and requests
        FastAPIInstrumentor.instrument()
        RequestsInstrumentor.instrument()
    
    def create_span(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        """Create a new span"""
        span = self.tracer.start_span(name)
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        return span
    
    def add_span_event(self, span, name: str, attributes: Optional[Dict[str, Any]] = None):
        """Add an event to a span"""
        span.add_event(name, attributes or {})
    
    def set_span_status(self, span, status_code, description: str = ""):
        """Set span status"""
        span.set_status(trace.Status(status_code, description))


class StructuredLogging:
    """Structured logging setup using structlog"""
    
    def __init__(self, log_level: str = "INFO", elasticsearch_host: Optional[str] = None):
        self.log_level = log_level
        self.elasticsearch_host = elasticsearch_host
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup structured logging"""
        processors = [
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
        ]
        
        if self.elasticsearch_host:
            processors.append(structlog.processors.JSONRenderer())
        else:
            processors.append(structlog.dev.ConsoleRenderer())
        
        structlog.configure(
            processors=processors,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        # Setup standard library logging
        logging.basicConfig(
            format="%(message)s",
            stream=None,
            level=getattr(logging, self.log_level.upper()),
        )
        
        # Setup Elasticsearch logging if configured
        if self.elasticsearch_host:
            self._setup_elasticsearch_logging()
    
    def _setup_elasticsearch_logging(self):
        """Setup Elasticsearch logging handler"""
        try:
            from elasticsearch import Elasticsearch
            from elasticsearch.helpers import bulk
            
            self.es_client = Elasticsearch([self.elasticsearch_host])
            
            # Create index template for logs
            index_template = {
                "index_patterns": ["cognitive-ai-logs-*"],
                "template": {
                    "mappings": {
                        "properties": {
                            "@timestamp": {"type": "date"},
                            "level": {"type": "keyword"},
                            "logger": {"type": "keyword"},
                            "message": {"type": "text"},
                            "component": {"type": "keyword"},
                            "user_id": {"type": "keyword"},
                            "session_id": {"type": "keyword"},
                            "trace_id": {"type": "keyword"},
                            "span_id": {"type": "keyword"}
                        }
                    }
                }
            }
            
            self.es_client.indices.put_index_template(
                name="cognitive-ai-logs",
                body=index_template
            )
            
        except Exception as e:
            logging.error(f"Failed to setup Elasticsearch logging: {e}")


class AlertManager:
    """Alert management system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.alert_rules: List[AlertRule] = []
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: deque = deque(maxlen=1000)
        self.notification_channels = self._setup_notification_channels()
        self.logger = structlog.get_logger(__name__)
        
        # Load alert rules
        self._load_alert_rules()
    
    def _setup_notification_channels(self) -> Dict[str, Any]:
        """Setup notification channels"""
        channels = {}
        
        # Email notifications
        if self.config.get('email'):
            channels['email'] = {
                'smtp_server': self.config['email'].get('smtp_server'),
                'smtp_port': self.config['email'].get('smtp_port', 587),
                'username': self.config['email'].get('username'),
                'password': self.config['email'].get('password'),
                'recipients': self.config['email'].get('recipients', [])
            }
        
        # Slack notifications
        if self.config.get('slack'):
            channels['slack'] = {
                'webhook_url': self.config['slack'].get('webhook_url'),
                'channel': self.config['slack'].get('channel', '#alerts')
            }
        
        # PagerDuty notifications
        if self.config.get('pagerduty'):
            channels['pagerduty'] = {
                'integration_key': self.config['pagerduty'].get('integration_key')
            }
        
        return channels
    
    def _load_alert_rules(self):
        """Load alert rules from configuration"""
        rules_config = self.config.get('alert_rules', [])
        
        for rule_config in rules_config:
            rule = AlertRule(
                name=rule_config['name'],
                metric_name=rule_config['metric_name'],
                condition=rule_config['condition'],
                threshold=rule_config['threshold'],
                severity=AlertSeverity(rule_config.get('severity', 'medium')),
                duration=rule_config.get('duration', 300),
                description=rule_config.get('description', ''),
                runbook_url=rule_config.get('runbook_url', ''),
                labels=rule_config.get('labels', {})
            )
            self.alert_rules.append(rule)
    
    def evaluate_alerts(self, metrics: Dict[str, float]):
        """Evaluate alert rules against current metrics"""
        for rule in self.alert_rules:
            if rule.metric_name in metrics:
                value = metrics[rule.metric_name]
                
                # Evaluate condition
                if self._evaluate_condition(value, rule.condition, rule.threshold):
                    self._trigger_alert(rule, value)
                else:
                    self._resolve_alert(rule.name)
    
    def _evaluate_condition(self, value: float, condition: str, threshold: float) -> bool:
        """Evaluate alert condition"""
        if condition.startswith('>'):
            return value > threshold
        elif condition.startswith('<'):
            return value < threshold
        elif condition.startswith('>='):
            return value >= threshold
        elif condition.startswith('<='):
            return value <= threshold
        elif condition.startswith('=='):
            return value == threshold
        elif condition.startswith('!='):
            return value != threshold
        else:
            return False
    
    def _trigger_alert(self, rule: AlertRule, value: float):
        """Trigger an alert"""
        alert_key = rule.name
        
        if alert_key not in self.active_alerts:
            alert = Alert(
                rule=rule,
                value=value,
                timestamp=datetime.utcnow()
            )
            
            self.active_alerts[alert_key] = alert
            self.alert_history.append(alert)
            
            # Send notifications
            self._send_notifications(alert)
            
            self.logger.warning(
                "Alert triggered",
                alert_name=rule.name,
                severity=rule.severity.value,
                value=value,
                threshold=rule.threshold
            )
    
    def _resolve_alert(self, alert_name: str):
        """Resolve an alert"""
        if alert_name in self.active_alerts:
            alert = self.active_alerts[alert_name]
            alert.resolved = True
            alert.resolved_at = datetime.utcnow()
            
            # Send resolution notification
            self._send_resolution_notification(alert)
            
            del self.active_alerts[alert_name]
            
            self.logger.info(
                "Alert resolved",
                alert_name=alert_name
            )
    
    def _send_notifications(self, alert: Alert):
        """Send alert notifications"""
        for channel_name, channel_config in self.notification_channels.items():
            try:
                if channel_name == 'email':
                    self._send_email_notification(alert, channel_config)
                elif channel_name == 'slack':
                    self._send_slack_notification(alert, channel_config)
                elif channel_name == 'pagerduty':
                    self._send_pagerduty_notification(alert, channel_config)
            except Exception as e:
                self.logger.error(
                    "Failed to send notification",
                    channel=channel_name,
                    error=str(e)
                )
    
    def _send_email_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send email notification"""
        msg = MIMEMultipart()
        msg['From'] = config['username']
        msg['To'] = ', '.join(config['recipients'])
        msg['Subject'] = f"[{alert.rule.severity.value.upper()}] {alert.rule.name}"
        
        body = f"""
Alert: {alert.rule.name}
Severity: {alert.rule.severity.value}
Description: {alert.rule.description}
Current Value: {alert.value}
Threshold: {alert.rule.threshold}
Timestamp: {alert.timestamp}
Runbook: {alert.rule.runbook_url}
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(config['smtp_server'], config['smtp_port'])
        server.starttls()
        server.login(config['username'], config['password'])
        server.send_message(msg)
        server.quit()
    
    def _send_slack_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send Slack notification"""
        color = {
            AlertSeverity.LOW: "good",
            AlertSeverity.MEDIUM: "warning",
            AlertSeverity.HIGH: "danger",
            AlertSeverity.CRITICAL: "danger"
        }.get(alert.rule.severity, "warning")
        
        payload = {
            "channel": config['channel'],
            "attachments": [
                {
                    "color": color,
                    "title": f"Alert: {alert.rule.name}",
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.rule.severity.value.upper(),
                            "short": True
                        },
                        {
                            "title": "Current Value",
                            "value": str(alert.value),
                            "short": True
                        },
                        {
                            "title": "Threshold",
                            "value": str(alert.rule.threshold),
                            "short": True
                        },
                        {
                            "title": "Description",
                            "value": alert.rule.description,
                            "short": False
                        }
                    ],
                    "footer": "Cognitive AI Framework",
                    "ts": int(alert.timestamp.timestamp())
                }
            ]
        }
        
        requests.post(config['webhook_url'], json=payload)
    
    def _send_pagerduty_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send PagerDuty notification"""
        payload = {
            "routing_key": config['integration_key'],
            "event_action": "trigger",
            "dedup_key": alert.rule.name,
            "payload": {
                "summary": f"{alert.rule.name}: {alert.rule.description}",
                "severity": alert.rule.severity.value,
                "source": "cognitive-ai-framework",
                "component": alert.rule.labels.get('component', 'unknown'),
                "custom_details": {
                    "current_value": alert.value,
                    "threshold": alert.rule.threshold,
                    "condition": alert.rule.condition
                }
            }
        }
        
        requests.post(
            "https://events.pagerduty.com/v2/enqueue",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
    
    def _send_resolution_notification(self, alert: Alert):
        """Send alert resolution notification"""
        # Similar to _send_notifications but for resolution
        pass


class HealthMonitor:
    """Health monitoring system"""
    
    def __init__(self, health_checks: List[HealthCheck]):
        self.health_checks = health_checks
        self.health_status: Dict[str, Dict[str, Any]] = {}
        self.logger = structlog.get_logger(__name__)
        self._running = False
        self._monitor_task = None
    
    async def start_monitoring(self):
        """Start health monitoring"""
        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        self.logger.info("Health monitoring started")
    
    async def stop_monitoring(self):
        """Stop health monitoring"""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Health monitoring stopped")
    
    async def _monitor_loop(self):
        """Main monitoring loop"""
        while self._running:
            tasks = [
                self._check_health(health_check)
                for health_check in self.health_checks
            ]
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
            # Wait for the shortest interval
            min_interval = min(hc.interval for hc in self.health_checks)
            await asyncio.sleep(min_interval)
    
    async def _check_health(self, health_check: HealthCheck):
        """Perform a single health check"""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=health_check.timeout)) as session:
                async with session.get(health_check.endpoint) as response:
                    status_ok = response.status == health_check.expected_status
                    
                    response_ok = True
                    if health_check.expected_response:
                        text = await response.text()
                        response_ok = health_check.expected_response in text
                    
                    healthy = status_ok and response_ok
                    
                    self.health_status[health_check.name] = {
                        "healthy": healthy,
                        "status_code": response.status,
                        "response_time": response.headers.get('X-Response-Time', 'unknown'),
                        "last_check": datetime.utcnow().isoformat(),
                        "labels": health_check.labels
                    }
                    
                    if not healthy:
                        self.logger.warning(
                            "Health check failed",
                            check_name=health_check.name,
                            endpoint=health_check.endpoint,
                            status_code=response.status,
                            expected_status=health_check.expected_status
                        )
                    
        except Exception as e:
            self.health_status[health_check.name] = {
                "healthy": False,
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
                "labels": health_check.labels
            }
            
            self.logger.error(
                "Health check error",
                check_name=health_check.name,
                endpoint=health_check.endpoint,
                error=str(e)
            )
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get current health status"""
        overall_healthy = all(
            status.get("healthy", False)
            for status in self.health_status.values()
        )
        
        return {
            "overall_healthy": overall_healthy,
            "checks": self.health_status,
            "timestamp": datetime.utcnow().isoformat()
        }


class MonitoringSystem:
    """Main monitoring system orchestrator"""
    
    def __init__(self, config_path: str = "monitoring_config.yaml"):
        self.config = self._load_config(config_path)
        
        # Initialize components
        self.metrics_collector = MetricsCollector()
        self.tracing = DistributedTracing(
            service_name=self.config.get('service_name', 'cognitive-ai-framework')
        )
        self.logging = StructuredLogging(
            log_level=self.config.get('log_level', 'INFO'),
            elasticsearch_host=self.config.get('elasticsearch_host')
        )
        self.alert_manager = AlertManager(self.config.get('alerting', {}))
        
        # Setup health checks
        health_checks = [
            HealthCheck(**hc_config)
            for hc_config in self.config.get('health_checks', [])
        ]
        self.health_monitor = HealthMonitor(health_checks)
        
        self.logger = structlog.get_logger(__name__)
        self._running = False
        self._monitoring_tasks = []
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load monitoring configuration"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.warning(f"Config file not found: {config_path}, using defaults")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default monitoring configuration"""
        return {
            "service_name": "cognitive-ai-framework",
            "log_level": "INFO",
            "health_checks": [
                {
                    "name": "cognitive-api",
                    "endpoint": "http://localhost:8000/health",
                    "interval": 30
                },
                {
                    "name": "emotional-ai",
                    "endpoint": "http://localhost:8001/health",
                    "interval": 30
                }
            ],
            "alerting": {
                "alert_rules": [
                    {
                        "name": "high_cpu_usage",
                        "metric_name": "system_cpu_usage_percent",
                        "condition": "> 80",
                        "threshold": 80,
                        "severity": "high",
                        "duration": 300
                    },
                    {
                        "name": "high_memory_usage",
                        "metric_name": "system_memory_usage_percent",
                        "condition": "> 90",
                        "threshold": 90,
                        "severity": "critical",
                        "duration": 180
                    }
                ]
            }
        }
    
    async def start(self):
        """Start the monitoring system"""
        self._running = True
        
        # Start health monitoring
        await self.health_monitor.start_monitoring()
        
        # Start metrics collection
        self._monitoring_tasks.append(
            asyncio.create_task(self._metrics_collection_loop())
        )
        
        # Start alert evaluation
        self._monitoring_tasks.append(
            asyncio.create_task(self._alert_evaluation_loop())
        )
        
        self.logger.info("Monitoring system started")
    
    async def stop(self):
        """Stop the monitoring system"""
        self._running = False
        
        # Stop health monitoring
        await self.health_monitor.stop_monitoring()
        
        # Cancel monitoring tasks
        for task in self._monitoring_tasks:
            task.cancel()
        
        await asyncio.gather(*self._monitoring_tasks, return_exceptions=True)
        
        self.logger.info("Monitoring system stopped")
    
    async def _metrics_collection_loop(self):
        """Metrics collection loop"""
        while self._running:
            try:
                # Collect system metrics
                self.metrics_collector.collect_system_metrics()
                
                # Wait before next collection
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                self.logger.error("Error in metrics collection", error=str(e))
                await asyncio.sleep(5)
    
    async def _alert_evaluation_loop(self):
        """Alert evaluation loop"""
        while self._running:
            try:
                # Get current metrics (simplified - in real implementation,
                # you'd query Prometheus or your metrics store)
                metrics = self._get_current_metrics()
                
                # Evaluate alerts
                self.alert_manager.evaluate_alerts(metrics)
                
                # Wait before next evaluation
                await asyncio.sleep(60)  # Evaluate every minute
                
            except Exception as e:
                self.logger.error("Error in alert evaluation", error=str(e))
                await asyncio.sleep(5)
    
    def _get_current_metrics(self) -> Dict[str, float]:
        """Get current metrics values"""
        # This is a simplified implementation
        # In practice, you'd query your metrics store
        return {
            "system_cpu_usage_percent": psutil.cpu_percent(),
            "system_memory_usage_percent": psutil.virtual_memory().percent,
            "active_sessions_count": 10,  # Example value
            "error_rate": 0.01  # Example value
        }
    
    def get_metrics_endpoint(self):
        """Get Prometheus metrics endpoint"""
        def metrics_handler():
            return generate_latest(self.metrics_collector.registry), 200, {'Content-Type': CONTENT_TYPE_LATEST}
        
        return metrics_handler
    
    def get_health_endpoint(self):
        """Get health check endpoint"""
        def health_handler():
            return self.health_monitor.get_health_status()
        
        return health_handler


# Example usage and configuration
def create_monitoring_config():
    """Create example monitoring configuration"""
    config = {
        "service_name": "cognitive-ai-framework",
        "log_level": "INFO",
        "elasticsearch_host": "http://localhost:9200",
        "health_checks": [
            {
                "name": "cognitive-api",
                "endpoint": "http://localhost:8000/health",
                "interval": 30,
                "timeout": 5,
                "expected_status": 200,
                "labels": {"service": "cognitive-api", "environment": "production"}
            },
            {
                "name": "emotional-ai",
                "endpoint": "http://localhost:8001/health",
                "interval": 30,
                "timeout": 5,
                "expected_status": 200,
                "labels": {"service": "emotional-ai", "environment": "production"}
            },
            {
                "name": "consciousness-service",
                "endpoint": "http://localhost:8002/health",
                "interval": 30,
                "timeout": 5,
                "expected_status": 200,
                "labels": {"service": "consciousness", "environment": "production"}
            }
        ],
        "alerting": {
            "email": {
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "username": "alerts@example.com",
                "password": "your-password",
                "recipients": ["admin@example.com", "ops@example.com"]
            },
            "slack": {
                "webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
                "channel": "#alerts"
            },
            "alert_rules": [
                {
                    "name": "high_cpu_usage",
                    "metric_name": "system_cpu_usage_percent",
                    "condition": ">",
                    "threshold": 80,
                    "severity": "high",
                    "duration": 300,
                    "description": "CPU usage is above 80%",
                    "runbook_url": "https://wiki.example.com/runbooks/high-cpu"
                },
                {
                    "name": "high_memory_usage",
                    "metric_name": "system_memory_usage_percent",
                    "condition": ">",
                    "threshold": 90,
                    "severity": "critical",
                    "duration": 180,
                    "description": "Memory usage is above 90%"
                },
                {
                    "name": "high_error_rate",
                    "metric_name": "error_rate",
                    "condition": ">",
                    "threshold": 0.05,
                    "severity": "high",
                    "duration": 300,
                    "description": "Error rate is above 5%"
                },
                {
                    "name": "low_consciousness_level",
                    "metric_name": "consciousness_level",
                    "condition": "<",
                    "threshold": 0.3,
                    "severity": "medium",
                    "duration": 600,
                    "description": "Consciousness level is below 30%"
                }
            ]
        }
    }
    
    with open("monitoring_config.yaml", 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    return config


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Monitoring System")
    parser.add_argument("--create-config", action="store_true",
                       help="Create example monitoring configuration")
    parser.add_argument("--config", type=str, default="monitoring_config.yaml",
                       help="Path to monitoring configuration file")
    
    args = parser.parse_args()
    
    if args.create_config:
        config = create_monitoring_config()
        print("Monitoring configuration created: monitoring_config.yaml")
    else:
        # Run monitoring system
        async def main():
            monitoring = MonitoringSystem(args.config)
            await monitoring.start()
            
            try:
                # Keep running
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                await monitoring.stop()
        
        asyncio.run(main())