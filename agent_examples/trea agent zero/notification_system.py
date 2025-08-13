"""
Advanced Notification and Communication System
Provides multi-channel notifications, real-time messaging, and communication management.
"""

import asyncio
import logging
import json
import smtplib
import ssl
from typing import Dict, List, Optional, Any, Union, Callable, Set
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import hashlib
import time
from datetime import datetime, timedelta
import threading
import queue
import uuid
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
import requests
import websockets
import aioredis
import aiogram
from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor
import slack_sdk
from slack_sdk.web.async_client import AsyncWebClient
import twilio
from twilio.rest import Client as TwilioClient
import discord
from discord.ext import commands
import pika
import boto3
from botocore.exceptions import ClientError
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel, Field, validator, EmailStr
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import structlog
from jinja2 import Template, Environment, FileSystemLoader
import schedule

# Database setup
Base = declarative_base()

class NotificationType(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"
    ALERT = "alert"
    REMINDER = "reminder"
    MARKETING = "marketing"

class NotificationChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    SLACK = "slack"
    DISCORD = "discord"
    TELEGRAM = "telegram"
    WEBHOOK = "webhook"
    WEBSOCKET = "websocket"
    PUSH = "push"
    IN_APP = "in_app"

class NotificationStatus(Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRY = "retry"

class Priority(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

class DeliveryMethod(Enum):
    IMMEDIATE = "immediate"
    SCHEDULED = "scheduled"
    BATCH = "batch"
    DIGEST = "digest"

@dataclass
class NotificationTemplate:
    id: str
    name: str
    type: NotificationType
    subject_template: str
    body_template: str
    html_template: Optional[str] = None
    variables: List[str] = field(default_factory=list)
    channels: List[NotificationChannel] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class NotificationRecipient:
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    slack_user_id: Optional[str] = None
    discord_user_id: Optional[str] = None
    telegram_user_id: Optional[str] = None
    preferences: Dict[NotificationChannel, bool] = field(default_factory=dict)
    timezone: str = "UTC"
    language: str = "en"

@dataclass
class NotificationMessage:
    id: str
    template_id: Optional[str]
    type: NotificationType
    priority: Priority
    subject: str
    body: str
    html_body: Optional[str] = None
    recipients: List[str] = field(default_factory=list)
    channels: List[NotificationChannel] = field(default_factory=list)
    variables: Dict[str, Any] = field(default_factory=dict)
    attachments: List[str] = field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    delivery_method: DeliveryMethod = DeliveryMethod.IMMEDIATE
    retry_count: int = 0
    max_retries: int = 3
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class NotificationResult:
    message_id: str
    recipient_id: str
    channel: NotificationChannel
    status: NotificationStatus
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None
    external_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

# Database Models
class NotificationTemplateDB(Base):
    __tablename__ = "notification_templates"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    subject_template = Column(Text, nullable=False)
    body_template = Column(Text, nullable=False)
    html_template = Column(Text)
    variables = Column(JSON)
    channels = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NotificationRecipientDB(Base):
    __tablename__ = "notification_recipients"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    slack_user_id = Column(String(255))
    discord_user_id = Column(String(255))
    telegram_user_id = Column(String(255))
    preferences = Column(JSON)
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NotificationMessageDB(Base):
    __tablename__ = "notification_messages"
    
    id = Column(String(255), primary_key=True)
    template_id = Column(String(255))
    type = Column(SQLEnum(NotificationType), nullable=False)
    priority = Column(SQLEnum(Priority), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    html_body = Column(Text)
    recipients = Column(JSON)
    channels = Column(JSON)
    variables = Column(JSON)
    attachments = Column(JSON)
    scheduled_at = Column(DateTime)
    expires_at = Column(DateTime)
    delivery_method = Column(SQLEnum(DeliveryMethod), default=DeliveryMethod.IMMEDIATE)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)

class NotificationResultDB(Base):
    __tablename__ = "notification_results"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(String(255), nullable=False, index=True)
    recipient_id = Column(String(255), nullable=False, index=True)
    channel = Column(SQLEnum(NotificationChannel), nullable=False)
    status = Column(SQLEnum(NotificationStatus), nullable=False)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    error_message = Column(Text)
    external_id = Column(String(255))
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

# Prometheus Metrics
REGISTRY = CollectorRegistry()
NOTIFICATIONS_SENT = Counter('notifications_sent_total', 'Total notifications sent', ['channel', 'type', 'status'], registry=REGISTRY)
NOTIFICATION_DURATION = Histogram('notification_duration_seconds', 'Notification processing duration', ['channel'], registry=REGISTRY)
ACTIVE_CONNECTIONS = Gauge('active_websocket_connections', 'Number of active WebSocket connections', registry=REGISTRY)
QUEUE_SIZE = Gauge('notification_queue_size', 'Size of notification queue', registry=REGISTRY)

class EmailProvider:
    """Email notification provider"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.smtp_server = config.get('smtp_server')
        self.smtp_port = config.get('smtp_port', 587)
        self.username = config.get('username')
        self.password = config.get('password')
        self.use_tls = config.get('use_tls', True)
        self.from_email = config.get('from_email')
        self.from_name = config.get('from_name', 'AI Framework')
        self.logger = structlog.get_logger()
    
    async def send(self, message: NotificationMessage, recipient: NotificationRecipient) -> NotificationResult:
        """Send email notification"""
        result = NotificationResult(
            message_id=message.id,
            recipient_id=recipient.id,
            channel=NotificationChannel.EMAIL,
            status=NotificationStatus.PENDING
        )
        
        try:
            # Create message
            msg = MimeMultipart('alternative')
            msg['Subject'] = message.subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = recipient.email
            
            # Add text body
            text_part = MimeText(message.body, 'plain')
            msg.attach(text_part)
            
            # Add HTML body if available
            if message.html_body:
                html_part = MimeText(message.html_body, 'html')
                msg.attach(html_part)
            
            # Add attachments
            for attachment_path in message.attachments:
                if Path(attachment_path).exists():
                    with open(attachment_path, 'rb') as attachment:
                        part = MimeBase('application', 'octet-stream')
                        part.set_payload(attachment.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {Path(attachment_path).name}'
                    )
                    msg.attach(part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls(context=context)
                server.login(self.username, self.password)
                server.send_message(msg)
            
            result.status = NotificationStatus.SENT
            result.sent_at = datetime.utcnow()
            
            self.logger.info("Email sent successfully", 
                           recipient=recipient.email, 
                           subject=message.subject)
            
        except Exception as e:
            result.status = NotificationStatus.FAILED
            result.error_message = str(e)
            
            self.logger.error("Failed to send email", 
                            recipient=recipient.email, 
                            error=str(e))
        
        return result

class SMSProvider:
    """SMS notification provider using Twilio"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.account_sid = config.get('account_sid')
        self.auth_token = config.get('auth_token')
        self.from_number = config.get('from_number')
        self.client = TwilioClient(self.account_sid, self.auth_token)
        self.logger = structlog.get_logger()
    
    async def send(self, message: NotificationMessage, recipient: NotificationRecipient) -> NotificationResult:
        """Send SMS notification"""
        result = NotificationResult(
            message_id=message.id,
            recipient_id=recipient.id,
            channel=NotificationChannel.SMS,
            status=NotificationStatus.PENDING
        )
        
        try:
            # Send SMS
            sms_message = self.client.messages.create(
                body=message.body,
                from_=self.from_number,
                to=recipient.phone
            )
            
            result.status = NotificationStatus.SENT
            result.sent_at = datetime.utcnow()
            result.external_id = sms_message.sid
            
            self.logger.info("SMS sent successfully", 
                           recipient=recipient.phone, 
                           sid=sms_message.sid)
            
        except Exception as e:
            result.status = NotificationStatus.FAILED
            result.error_message = str(e)
            
            self.logger.error("Failed to send SMS", 
                            recipient=recipient.phone, 
                            error=str(e))
        
        return result

class SlackProvider:
    """Slack notification provider"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.bot_token = config.get('bot_token')
        self.client = AsyncWebClient(token=self.bot_token)
        self.logger = structlog.get_logger()
    
    async def send(self, message: NotificationMessage, recipient: NotificationRecipient) -> NotificationResult:
        """Send Slack notification"""
        result = NotificationResult(
            message_id=message.id,
            recipient_id=recipient.id,
            channel=NotificationChannel.SLACK,
            status=NotificationStatus.PENDING
        )
        
        try:
            # Send message
            response = await self.client.chat_postMessage(
                channel=recipient.slack_user_id,
                text=message.body,
                blocks=self._create_blocks(message) if message.html_body else None
            )
            
            if response['ok']:
                result.status = NotificationStatus.SENT
                result.sent_at = datetime.utcnow()
                result.external_id = response['ts']
                
                self.logger.info("Slack message sent successfully", 
                               recipient=recipient.slack_user_id, 
                               ts=response['ts'])
            else:
                result.status = NotificationStatus.FAILED
                result.error_message = response.get('error', 'Unknown error')
            
        except Exception as e:
            result.status = NotificationStatus.FAILED
            result.error_message = str(e)
            
            self.logger.error("Failed to send Slack message", 
                            recipient=recipient.slack_user_id, 
                            error=str(e))
        
        return result
    
    def _create_blocks(self, message: NotificationMessage) -> List[Dict[str, Any]]:
        """Create Slack blocks for rich formatting"""
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{message.subject}*"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message.body
                }
            }
        ]
        
        if message.priority in [Priority.HIGH, Priority.URGENT, Priority.CRITICAL]:
            blocks.insert(0, {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f":warning: *{message.priority.value.upper()} PRIORITY*"
                }
            })
        
        return blocks

class WebhookProvider:
    """Webhook notification provider"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.default_url = config.get('default_url')
        self.headers = config.get('headers', {})
        self.timeout = config.get('timeout', 30)
        self.logger = structlog.get_logger()
    
    async def send(self, message: NotificationMessage, recipient: NotificationRecipient) -> NotificationResult:
        """Send webhook notification"""
        result = NotificationResult(
            message_id=message.id,
            recipient_id=recipient.id,
            channel=NotificationChannel.WEBHOOK,
            status=NotificationStatus.PENDING
        )
        
        try:
            # Prepare payload
            payload = {
                'id': message.id,
                'type': message.type.value,
                'priority': message.priority.value,
                'subject': message.subject,
                'body': message.body,
                'recipient': {
                    'id': recipient.id,
                    'name': recipient.name
                },
                'timestamp': datetime.utcnow().isoformat(),
                'metadata': message.metadata
            }
            
            # Get webhook URL (could be recipient-specific)
            webhook_url = recipient.preferences.get('webhook_url', self.default_url)
            
            # Send webhook
            response = requests.post(
                webhook_url,
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code < 400:
                result.status = NotificationStatus.SENT
                result.sent_at = datetime.utcnow()
                result.external_id = response.headers.get('X-Request-ID')
                
                self.logger.info("Webhook sent successfully", 
                               url=webhook_url, 
                               status_code=response.status_code)
            else:
                result.status = NotificationStatus.FAILED
                result.error_message = f"HTTP {response.status_code}: {response.text}"
            
        except Exception as e:
            result.status = NotificationStatus.FAILED
            result.error_message = str(e)
            
            self.logger.error("Failed to send webhook", 
                            url=webhook_url, 
                            error=str(e))
        
        return result

class WebSocketManager:
    """WebSocket connection manager for real-time notifications"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, Set[str]] = {}
        self.logger = structlog.get_logger()
    
    async def connect(self, websocket: WebSocket, user_id: str, connection_id: str):
        """Add new WebSocket connection"""
        await websocket.accept()
        self.connections[connection_id] = websocket
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)
        
        ACTIVE_CONNECTIONS.inc()
        self.logger.info("WebSocket connected", user_id=user_id, connection_id=connection_id)
    
    async def disconnect(self, connection_id: str, user_id: str):
        """Remove WebSocket connection"""
        if connection_id in self.connections:
            del self.connections[connection_id]
        
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        ACTIVE_CONNECTIONS.dec()
        self.logger.info("WebSocket disconnected", user_id=user_id, connection_id=connection_id)
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all connections for a user"""
        if user_id not in self.user_connections:
            return
        
        disconnected_connections = []
        
        for connection_id in self.user_connections[user_id]:
            if connection_id in self.connections:
                try:
                    await self.connections[connection_id].send_json(message)
                except Exception as e:
                    self.logger.error("Failed to send WebSocket message", 
                                    connection_id=connection_id, 
                                    error=str(e))
                    disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            await self.disconnect(connection_id, user_id)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connections"""
        disconnected_connections = []
        
        for connection_id, websocket in self.connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                self.logger.error("Failed to broadcast WebSocket message", 
                                connection_id=connection_id, 
                                error=str(e))
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            # Find user_id for this connection
            user_id = None
            for uid, conn_ids in self.user_connections.items():
                if connection_id in conn_ids:
                    user_id = uid
                    break
            
            if user_id:
                await self.disconnect(connection_id, user_id)

class NotificationQueue:
    """Notification queue manager"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.queue = asyncio.Queue()
        self.processing = False
        self.workers = []
        self.max_workers = config.get('max_workers', 5)
        self.logger = structlog.get_logger()
    
    async def enqueue(self, message: NotificationMessage):
        """Add message to queue"""
        await self.queue.put(message)
        QUEUE_SIZE.set(self.queue.qsize())
        self.logger.info("Message queued", message_id=message.id)
    
    async def start_processing(self, notification_system):
        """Start queue processing workers"""
        if self.processing:
            return
        
        self.processing = True
        
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}", notification_system))
            self.workers.append(worker)
        
        self.logger.info("Queue processing started", workers=self.max_workers)
    
    async def stop_processing(self):
        """Stop queue processing"""
        self.processing = False
        
        for worker in self.workers:
            worker.cancel()
        
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers.clear()
        
        self.logger.info("Queue processing stopped")
    
    async def _worker(self, worker_name: str, notification_system):
        """Queue worker"""
        while self.processing:
            try:
                # Get message from queue with timeout
                message = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                QUEUE_SIZE.set(self.queue.qsize())
                
                # Process message
                await notification_system._process_message(message)
                
                self.queue.task_done()
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error("Worker error", worker=worker_name, error=str(e))

class NotificationSystem:
    """Main notification system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.providers = {}
        self.templates = {}
        self.recipients = {}
        self.websocket_manager = WebSocketManager()
        self.queue = NotificationQueue(config.get('queue', {}))
        self.logger = structlog.get_logger()
        
        # Setup database
        db_url = config.get('database_url', 'sqlite:///notifications.db')
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db_session = Session()
        
        # Setup template engine
        template_dir = config.get('template_dir', './templates')
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        
        # Initialize providers
        self._initialize_providers()
        
        # Load templates and recipients
        self._load_templates()
        self._load_recipients()
        
        # Start queue processing
        asyncio.create_task(self.queue.start_processing(self))
    
    def _initialize_providers(self):
        """Initialize notification providers"""
        providers_config = self.config.get('providers', {})
        
        if 'email' in providers_config:
            self.providers[NotificationChannel.EMAIL] = EmailProvider(providers_config['email'])
        
        if 'sms' in providers_config:
            self.providers[NotificationChannel.SMS] = SMSProvider(providers_config['sms'])
        
        if 'slack' in providers_config:
            self.providers[NotificationChannel.SLACK] = SlackProvider(providers_config['slack'])
        
        if 'webhook' in providers_config:
            self.providers[NotificationChannel.WEBHOOK] = WebhookProvider(providers_config['webhook'])
    
    def _load_templates(self):
        """Load notification templates from database"""
        templates = self.db_session.query(NotificationTemplateDB).all()
        
        for template_db in templates:
            template = NotificationTemplate(
                id=template_db.id,
                name=template_db.name,
                type=template_db.type,
                subject_template=template_db.subject_template,
                body_template=template_db.body_template,
                html_template=template_db.html_template,
                variables=template_db.variables or [],
                channels=template_db.channels or [],
                created_at=template_db.created_at
            )
            self.templates[template.id] = template
    
    def _load_recipients(self):
        """Load notification recipients from database"""
        recipients = self.db_session.query(NotificationRecipientDB).all()
        
        for recipient_db in recipients:
            recipient = NotificationRecipient(
                id=recipient_db.id,
                name=recipient_db.name,
                email=recipient_db.email,
                phone=recipient_db.phone,
                slack_user_id=recipient_db.slack_user_id,
                discord_user_id=recipient_db.discord_user_id,
                telegram_user_id=recipient_db.telegram_user_id,
                preferences=recipient_db.preferences or {},
                timezone=recipient_db.timezone,
                language=recipient_db.language
            )
            self.recipients[recipient.id] = recipient
    
    async def send_notification(self, message: NotificationMessage) -> str:
        """Send notification message"""
        # Generate message ID if not provided
        if not message.id:
            message.id = str(uuid.uuid4())
        
        # Save message to database
        message_db = NotificationMessageDB(
            id=message.id,
            template_id=message.template_id,
            type=message.type,
            priority=message.priority,
            subject=message.subject,
            body=message.body,
            html_body=message.html_body,
            recipients=message.recipients,
            channels=message.channels,
            variables=message.variables,
            attachments=message.attachments,
            scheduled_at=message.scheduled_at,
            expires_at=message.expires_at,
            delivery_method=message.delivery_method,
            max_retries=message.max_retries,
            metadata=message.metadata
        )
        self.db_session.add(message_db)
        self.db_session.commit()
        
        # Queue message for processing
        if message.delivery_method == DeliveryMethod.IMMEDIATE:
            await self.queue.enqueue(message)
        elif message.delivery_method == DeliveryMethod.SCHEDULED and message.scheduled_at:
            # Schedule for later processing
            delay = (message.scheduled_at - datetime.utcnow()).total_seconds()
            if delay > 0:
                asyncio.create_task(self._schedule_message(message, delay))
            else:
                await self.queue.enqueue(message)
        
        self.logger.info("Notification queued", message_id=message.id)
        return message.id
    
    async def _schedule_message(self, message: NotificationMessage, delay: float):
        """Schedule message for delayed delivery"""
        await asyncio.sleep(delay)
        await self.queue.enqueue(message)
    
    async def _process_message(self, message: NotificationMessage):
        """Process notification message"""
        # Check if message has expired
        if message.expires_at and datetime.utcnow() > message.expires_at:
            self.logger.info("Message expired", message_id=message.id)
            return
        
        # Process for each recipient and channel
        for recipient_id in message.recipients:
            if recipient_id not in self.recipients:
                self.logger.warning("Recipient not found", recipient_id=recipient_id)
                continue
            
            recipient = self.recipients[recipient_id]
            
            for channel in message.channels:
                # Check recipient preferences
                if not recipient.preferences.get(channel, True):
                    continue
                
                # Send via WebSocket if requested
                if channel == NotificationChannel.WEBSOCKET:
                    await self._send_websocket(message, recipient)
                    continue
                
                # Send via provider
                if channel in self.providers:
                    with NOTIFICATION_DURATION.labels(channel=channel.value).time():
                        result = await self.providers[channel].send(message, recipient)
                        await self._save_result(result)
                        
                        # Update metrics
                        NOTIFICATIONS_SENT.labels(
                            channel=channel.value,
                            type=message.type.value,
                            status=result.status.value
                        ).inc()
    
    async def _send_websocket(self, message: NotificationMessage, recipient: NotificationRecipient):
        """Send WebSocket notification"""
        websocket_message = {
            'id': message.id,
            'type': message.type.value,
            'priority': message.priority.value,
            'subject': message.subject,
            'body': message.body,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': message.metadata
        }
        
        await self.websocket_manager.send_to_user(recipient.id, websocket_message)
        
        # Save result
        result = NotificationResult(
            message_id=message.id,
            recipient_id=recipient.id,
            channel=NotificationChannel.WEBSOCKET,
            status=NotificationStatus.SENT,
            sent_at=datetime.utcnow()
        )
        await self._save_result(result)
    
    async def _save_result(self, result: NotificationResult):
        """Save notification result to database"""
        result_db = NotificationResultDB(
            message_id=result.message_id,
            recipient_id=result.recipient_id,
            channel=result.channel,
            status=result.status,
            sent_at=result.sent_at,
            delivered_at=result.delivered_at,
            error_message=result.error_message,
            external_id=result.external_id,
            metadata=result.metadata
        )
        self.db_session.add(result_db)
        self.db_session.commit()
    
    async def create_template(self, template: NotificationTemplate) -> str:
        """Create notification template"""
        template_db = NotificationTemplateDB(
            id=template.id,
            name=template.name,
            type=template.type,
            subject_template=template.subject_template,
            body_template=template.body_template,
            html_template=template.html_template,
            variables=template.variables,
            channels=template.channels
        )
        self.db_session.add(template_db)
        self.db_session.commit()
        
        self.templates[template.id] = template
        return template.id
    
    async def create_recipient(self, recipient: NotificationRecipient) -> str:
        """Create notification recipient"""
        recipient_db = NotificationRecipientDB(
            id=recipient.id,
            name=recipient.name,
            email=recipient.email,
            phone=recipient.phone,
            slack_user_id=recipient.slack_user_id,
            discord_user_id=recipient.discord_user_id,
            telegram_user_id=recipient.telegram_user_id,
            preferences=recipient.preferences,
            timezone=recipient.timezone,
            language=recipient.language
        )
        self.db_session.add(recipient_db)
        self.db_session.commit()
        
        self.recipients[recipient.id] = recipient
        return recipient.id
    
    async def send_from_template(self, template_id: str, recipients: List[str], 
                               variables: Dict[str, Any], channels: List[NotificationChannel] = None,
                               priority: Priority = Priority.NORMAL) -> str:
        """Send notification from template"""
        if template_id not in self.templates:
            raise ValueError(f"Template not found: {template_id}")
        
        template = self.templates[template_id]
        
        # Render templates
        subject_template = Template(template.subject_template)
        body_template = Template(template.body_template)
        
        subject = subject_template.render(**variables)
        body = body_template.render(**variables)
        
        html_body = None
        if template.html_template:
            html_template = Template(template.html_template)
            html_body = html_template.render(**variables)
        
        # Create message
        message = NotificationMessage(
            id=str(uuid.uuid4()),
            template_id=template_id,
            type=template.type,
            priority=priority,
            subject=subject,
            body=body,
            html_body=html_body,
            recipients=recipients,
            channels=channels or template.channels,
            variables=variables
        )
        
        return await self.send_notification(message)
    
    def get_notification_history(self, recipient_id: str = None, 
                               limit: int = 50) -> List[Dict[str, Any]]:
        """Get notification history"""
        query = self.db_session.query(NotificationResultDB)
        
        if recipient_id:
            query = query.filter(NotificationResultDB.recipient_id == recipient_id)
        
        results = query.order_by(NotificationResultDB.created_at.desc()).limit(limit).all()
        
        return [
            {
                'message_id': result.message_id,
                'recipient_id': result.recipient_id,
                'channel': result.channel.value,
                'status': result.status.value,
                'sent_at': result.sent_at.isoformat() if result.sent_at else None,
                'delivered_at': result.delivered_at.isoformat() if result.delivered_at else None,
                'error_message': result.error_message,
                'created_at': result.created_at.isoformat()
            }
            for result in results
        ]
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.queue.stop_processing()
        self.db_session.close()

class NotificationAPI:
    """REST API for notification system"""
    
    def __init__(self, notification_system: NotificationSystem):
        self.notification_system = notification_system
        self.app = FastAPI(title="Notification System API")
        self.setup_routes()
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.post("/api/notifications/send")
        async def send_notification(message: Dict[str, Any]):
            """Send notification"""
            try:
                notification_message = NotificationMessage(**message)
                message_id = await self.notification_system.send_notification(notification_message)
                return {"message_id": message_id}
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
        
        @self.app.post("/api/notifications/send-template")
        async def send_from_template(
            template_id: str,
            recipients: List[str],
            variables: Dict[str, Any],
            channels: Optional[List[str]] = None,
            priority: str = "normal"
        ):
            """Send notification from template"""
            try:
                channel_enums = [NotificationChannel(ch) for ch in channels] if channels else None
                priority_enum = Priority(priority)
                
                message_id = await self.notification_system.send_from_template(
                    template_id=template_id,
                    recipients=recipients,
                    variables=variables,
                    channels=channel_enums,
                    priority=priority_enum
                )
                
                return {"message_id": message_id}
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
        
        @self.app.get("/api/notifications/history")
        async def get_history(recipient_id: Optional[str] = None, limit: int = 50):
            """Get notification history"""
            history = self.notification_system.get_notification_history(recipient_id, limit)
            return {"history": history}
        
        @self.app.websocket("/ws/{user_id}")
        async def websocket_endpoint(websocket: WebSocket, user_id: str):
            """WebSocket endpoint for real-time notifications"""
            connection_id = str(uuid.uuid4())
            
            try:
                await self.notification_system.websocket_manager.connect(
                    websocket, user_id, connection_id
                )
                
                while True:
                    # Keep connection alive
                    await websocket.receive_text()
                    
            except WebSocketDisconnect:
                await self.notification_system.websocket_manager.disconnect(
                    connection_id, user_id
                )
        
        @self.app.get("/api/metrics")
        async def get_metrics():
            """Get notification metrics"""
            from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
            return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)

# Example usage
if __name__ == "__main__":
    # Configuration
    config = {
        'database_url': 'sqlite:///notifications.db',
        'template_dir': './templates',
        'providers': {
            'email': {
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'username': 'your-email@gmail.com',
                'password': 'your-app-password',
                'from_email': 'your-email@gmail.com',
                'from_name': 'AI Framework'
            },
            'slack': {
                'bot_token': 'xoxb-your-slack-bot-token'
            },
            'webhook': {
                'default_url': 'https://your-webhook-url.com/notify',
                'headers': {'Authorization': 'Bearer your-token'}
            }
        },
        'queue': {
            'max_workers': 5
        }
    }
    
    # Create notification system
    notification_system = NotificationSystem(config)
    
    async def main():
        # Create example template
        template = NotificationTemplate(
            id="welcome",
            name="Welcome Message",
            type=NotificationType.INFO,
            subject_template="Welcome {{name}}!",
            body_template="Hello {{name}}, welcome to our platform!",
            channels=[NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET]
        )
        await notification_system.create_template(template)
        
        # Create example recipient
        recipient = NotificationRecipient(
            id="user1",
            name="John Doe",
            email="john@example.com",
            preferences={
                NotificationChannel.EMAIL: True,
                NotificationChannel.WEBSOCKET: True
            }
        )
        await notification_system.create_recipient(recipient)
        
        # Send notification from template
        message_id = await notification_system.send_from_template(
            template_id="welcome",
            recipients=["user1"],
            variables={"name": "John"},
            priority=Priority.NORMAL
        )
        
        print(f"Notification sent: {message_id}")
        
        # Create API
        api = NotificationAPI(notification_system)
        
        # Run the API server
        uvicorn.run(api.app, host="0.0.0.0", port=8000)
    
    # Run the system
    asyncio.run(main())