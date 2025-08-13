"""
Advanced Real-time Analytics and Dashboard System
Provides comprehensive analytics, visualization, and real-time monitoring capabilities
"""

import os
import json
import yaml
import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any, Union, Callable, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import structlog
from fastapi import FastAPI, Request, Response, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, validator
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
import dash
from dash import dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
from dash.exceptions import PreventUpdate
import redis
import asyncio_redis
from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, Float, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
import psycopg2
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CollectorRegistry
import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS
import elasticsearch
from elasticsearch import AsyncElasticsearch
import kafka
from kafka import KafkaProducer, KafkaConsumer
import websockets
import socketio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import threading
import multiprocessing
from collections import defaultdict, deque
import statistics
import scipy.stats as stats
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
import networkx as nx
import geoip2.database
import requests
from urllib.parse import urlparse
import schedule
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import slack_sdk
from twilio.rest import Client as TwilioClient
import boto3
from google.cloud import bigquery, storage
import azure.storage.blob
from azure.servicebus import ServiceBusClient
import streamlit as st
import altair as alt


class MetricType(Enum):
    """Metric types"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"
    RATE = "rate"
    PERCENTAGE = "percentage"


class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ChartType(Enum):
    """Chart types"""
    LINE = "line"
    BAR = "bar"
    SCATTER = "scatter"
    PIE = "pie"
    HEATMAP = "heatmap"
    HISTOGRAM = "histogram"
    BOX = "box"
    VIOLIN = "violin"
    TREEMAP = "treemap"
    SUNBURST = "sunburst"
    SANKEY = "sankey"
    NETWORK = "network"
    MAP = "map"
    CANDLESTICK = "candlestick"
    WATERFALL = "waterfall"


class DataSource(Enum):
    """Data sources"""
    PROMETHEUS = "prometheus"
    INFLUXDB = "influxdb"
    ELASTICSEARCH = "elasticsearch"
    REDIS = "redis"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    KAFKA = "kafka"
    API = "api"
    FILE = "file"
    BIGQUERY = "bigquery"
    SNOWFLAKE = "snowflake"


# Database models
Base = declarative_base()


class Dashboard(Base):
    """Dashboard model"""
    __tablename__ = "dashboards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    layout = Column(JSON)
    widgets = Column(JSON)
    filters = Column(JSON)
    refresh_interval = Column(Integer, default=30)
    is_public = Column(Boolean, default=False)
    created_by = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Widget(Base):
    """Widget model"""
    __tablename__ = "widgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dashboard_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    query = Column(Text)
    data_source = Column(String(50))
    configuration = Column(JSON)
    position = Column(JSON)
    size = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Alert(Base):
    """Alert model"""
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    query = Column(Text, nullable=False)
    condition = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False)
    threshold = Column(Float)
    data_source = Column(String(50))
    notification_channels = Column(JSON)
    is_enabled = Column(Boolean, default=True)
    last_triggered = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


@dataclass
class MetricData:
    """Metric data point"""
    timestamp: datetime
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WidgetConfig:
    """Widget configuration"""
    title: str
    chart_type: ChartType
    data_source: DataSource
    query: str
    refresh_interval: int = 30
    size: Dict[str, int] = field(default_factory=lambda: {"width": 6, "height": 4})
    position: Dict[str, int] = field(default_factory=lambda: {"x": 0, "y": 0})
    styling: Dict[str, Any] = field(default_factory=dict)
    filters: List[Dict[str, Any]] = field(default_factory=list)
    aggregation: Optional[str] = None
    time_range: str = "1h"


@dataclass
class AlertRule:
    """Alert rule configuration"""
    name: str
    query: str
    condition: str
    threshold: float
    severity: AlertSeverity
    data_source: DataSource
    evaluation_interval: int = 60
    notification_channels: List[str] = field(default_factory=list)
    labels: Dict[str, str] = field(default_factory=dict)
    annotations: Dict[str, str] = field(default_factory=dict)


class DataConnector:
    """Base data connector"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = structlog.get_logger(__name__)
    
    async def query(self, query: str, time_range: str = "1h") -> List[MetricData]:
        """Execute query and return metric data"""
        raise NotImplementedError
    
    async def test_connection(self) -> bool:
        """Test connection to data source"""
        raise NotImplementedError


class PrometheusConnector(DataConnector):
    """Prometheus data connector"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.base_url = config['url']
        self.session = requests.Session()
        
        if 'auth' in config:
            auth = config['auth']
            if auth['type'] == 'basic':
                self.session.auth = (auth['username'], auth['password'])
            elif auth['type'] == 'bearer':
                self.session.headers['Authorization'] = f"Bearer {auth['token']}"
    
    async def query(self, query: str, time_range: str = "1h") -> List[MetricData]:
        """Execute Prometheus query"""
        
        try:
            # Parse time range
            end_time = datetime.utcnow()
            if time_range.endswith('m'):
                minutes = int(time_range[:-1])
                start_time = end_time - timedelta(minutes=minutes)
            elif time_range.endswith('h'):
                hours = int(time_range[:-1])
                start_time = end_time - timedelta(hours=hours)
            elif time_range.endswith('d'):
                days = int(time_range[:-1])
                start_time = end_time - timedelta(days=days)
            else:
                start_time = end_time - timedelta(hours=1)
            
            # Execute query
            params = {
                'query': query,
                'start': start_time.timestamp(),
                'end': end_time.timestamp(),
                'step': '15s'
            }
            
            response = self.session.get(f"{self.base_url}/api/v1/query_range", params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] != 'success':
                raise Exception(f"Prometheus query failed: {data.get('error', 'Unknown error')}")
            
            # Parse results
            metrics = []
            
            for result in data['data']['result']:
                labels = result['metric']
                
                for timestamp, value in result['values']:
                    metrics.append(MetricData(
                        timestamp=datetime.fromtimestamp(float(timestamp)),
                        value=float(value),
                        labels=labels
                    ))
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Prometheus query failed: {str(e)}")
            raise
    
    async def test_connection(self) -> bool:
        """Test Prometheus connection"""
        
        try:
            response = self.session.get(f"{self.base_url}/api/v1/query", 
                                      params={'query': 'up'})
            return response.status_code == 200
        except:
            return False


class InfluxDBConnector(DataConnector):
    """InfluxDB data connector"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client = influxdb_client.InfluxDBClient(
            url=config['url'],
            token=config['token'],
            org=config['org']
        )
        self.query_api = self.client.query_api()
    
    async def query(self, query: str, time_range: str = "1h") -> List[MetricData]:
        """Execute InfluxDB query"""
        
        try:
            # Add time range to query if not present
            if 'range(' not in query:
                query = f'{query} |> range(start: -{time_range})'
            
            # Execute query
            result = self.query_api.query(query)
            
            metrics = []
            
            for table in result:
                for record in table.records:
                    metrics.append(MetricData(
                        timestamp=record.get_time(),
                        value=float(record.get_value()),
                        labels={
                            key: value for key, value in record.values.items()
                            if key not in ['_time', '_value', '_start', '_stop']
                        }
                    ))
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"InfluxDB query failed: {str(e)}")
            raise
    
    async def test_connection(self) -> bool:
        """Test InfluxDB connection"""
        
        try:
            health = self.client.health()
            return health.status == "pass"
        except:
            return False


class ElasticsearchConnector(DataConnector):
    """Elasticsearch data connector"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.client = AsyncElasticsearch([config['url']])
    
    async def query(self, query: str, time_range: str = "1h") -> List[MetricData]:
        """Execute Elasticsearch query"""
        
        try:
            # Parse query (assuming it's a JSON query)
            query_body = json.loads(query)
            
            # Add time range filter
            now = datetime.utcnow()
            if time_range.endswith('m'):
                minutes = int(time_range[:-1])
                start_time = now - timedelta(minutes=minutes)
            elif time_range.endswith('h'):
                hours = int(time_range[:-1])
                start_time = now - timedelta(hours=hours)
            elif time_range.endswith('d'):
                days = int(time_range[:-1])
                start_time = now - timedelta(days=days)
            else:
                start_time = now - timedelta(hours=1)
            
            time_filter = {
                "range": {
                    "@timestamp": {
                        "gte": start_time.isoformat(),
                        "lte": now.isoformat()
                    }
                }
            }
            
            if 'query' not in query_body:
                query_body['query'] = {"bool": {"must": [time_filter]}}
            elif 'bool' not in query_body['query']:
                query_body['query'] = {"bool": {"must": [query_body['query'], time_filter]}}
            else:
                if 'must' not in query_body['query']['bool']:
                    query_body['query']['bool']['must'] = []
                query_body['query']['bool']['must'].append(time_filter)
            
            # Execute query
            response = await self.client.search(
                index=self.config.get('index', '_all'),
                body=query_body
            )
            
            metrics = []
            
            for hit in response['hits']['hits']:
                source = hit['_source']
                
                # Extract timestamp and value
                timestamp = datetime.fromisoformat(source.get('@timestamp', now.isoformat()))
                value = source.get('value', 1)  # Default to 1 for count metrics
                
                # Extract labels
                labels = {k: v for k, v in source.items() 
                         if k not in ['@timestamp', 'value']}
                
                metrics.append(MetricData(
                    timestamp=timestamp,
                    value=float(value),
                    labels=labels
                ))
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Elasticsearch query failed: {str(e)}")
            raise
    
    async def test_connection(self) -> bool:
        """Test Elasticsearch connection"""
        
        try:
            health = await self.client.cluster.health()
            return health['status'] in ['green', 'yellow']
        except:
            return False


class DataSourceManager:
    """Data source management"""
    
    def __init__(self):
        self.connectors: Dict[str, DataConnector] = {}
        self.logger = structlog.get_logger(__name__)
    
    def add_connector(self, name: str, connector: DataConnector):
        """Add data connector"""
        self.connectors[name] = connector
        self.logger.info(f"Added data connector: {name}")
    
    def get_connector(self, name: str) -> Optional[DataConnector]:
        """Get data connector"""
        return self.connectors.get(name)
    
    async def query(self, data_source: str, query: str, time_range: str = "1h") -> List[MetricData]:
        """Execute query on data source"""
        
        connector = self.get_connector(data_source)
        if not connector:
            raise ValueError(f"Data source '{data_source}' not found")
        
        return await connector.query(query, time_range)
    
    async def test_all_connections(self) -> Dict[str, bool]:
        """Test all data source connections"""
        
        results = {}
        
        for name, connector in self.connectors.items():
            try:
                results[name] = await connector.test_connection()
            except Exception as e:
                self.logger.error(f"Connection test failed for {name}: {str(e)}")
                results[name] = False
        
        return results


class ChartGenerator:
    """Chart generation using Plotly"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
    
    def create_chart(self, chart_type: ChartType, data: List[MetricData], 
                    config: WidgetConfig) -> Dict[str, Any]:
        """Create chart from metric data"""
        
        if not data:
            return self._create_empty_chart(config.title)
        
        # Convert data to DataFrame
        df = self._metrics_to_dataframe(data)
        
        if chart_type == ChartType.LINE:
            return self._create_line_chart(df, config)
        elif chart_type == ChartType.BAR:
            return self._create_bar_chart(df, config)
        elif chart_type == ChartType.SCATTER:
            return self._create_scatter_chart(df, config)
        elif chart_type == ChartType.PIE:
            return self._create_pie_chart(df, config)
        elif chart_type == ChartType.HEATMAP:
            return self._create_heatmap(df, config)
        elif chart_type == ChartType.HISTOGRAM:
            return self._create_histogram(df, config)
        elif chart_type == ChartType.BOX:
            return self._create_box_chart(df, config)
        else:
            return self._create_line_chart(df, config)  # Default to line chart
    
    def _metrics_to_dataframe(self, metrics: List[MetricData]) -> pd.DataFrame:
        """Convert metrics to pandas DataFrame"""
        
        data = []
        
        for metric in metrics:
            row = {
                'timestamp': metric.timestamp,
                'value': metric.value,
                **metric.labels
            }
            data.append(row)
        
        return pd.DataFrame(data)
    
    def _create_line_chart(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create line chart"""
        
        fig = go.Figure()
        
        # Group by labels if present
        if len(df.columns) > 2:  # More than timestamp and value
            label_cols = [col for col in df.columns if col not in ['timestamp', 'value']]
            
            for name, group in df.groupby(label_cols):
                if isinstance(name, tuple):
                    label = ', '.join([f"{col}={val}" for col, val in zip(label_cols, name)])
                else:
                    label = f"{label_cols[0]}={name}"
                
                fig.add_trace(go.Scatter(
                    x=group['timestamp'],
                    y=group['value'],
                    mode='lines+markers',
                    name=label,
                    line=dict(width=2),
                    marker=dict(size=4)
                ))
        else:
            fig.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df['value'],
                mode='lines+markers',
                name='Value',
                line=dict(width=2),
                marker=dict(size=4)
            ))
        
        fig.update_layout(
            title=config.title,
            xaxis_title="Time",
            yaxis_title="Value",
            hovermode='x unified',
            showlegend=True,
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_bar_chart(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create bar chart"""
        
        # Aggregate data for bar chart
        if config.aggregation:
            if config.aggregation == 'sum':
                agg_data = df.groupby(df.columns.difference(['timestamp', 'value']).tolist())['value'].sum()
            elif config.aggregation == 'mean':
                agg_data = df.groupby(df.columns.difference(['timestamp', 'value']).tolist())['value'].mean()
            elif config.aggregation == 'count':
                agg_data = df.groupby(df.columns.difference(['timestamp', 'value']).tolist()).size()
            else:
                agg_data = df.groupby(df.columns.difference(['timestamp', 'value']).tolist())['value'].sum()
        else:
            # Use latest values
            agg_data = df.groupby(df.columns.difference(['timestamp', 'value']).tolist())['value'].last()
        
        fig = go.Figure(data=[
            go.Bar(
                x=agg_data.index.tolist() if hasattr(agg_data.index, 'tolist') else [str(agg_data.index)],
                y=agg_data.values,
                marker_color='steelblue'
            )
        ])
        
        fig.update_layout(
            title=config.title,
            xaxis_title="Category",
            yaxis_title="Value",
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_pie_chart(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create pie chart"""
        
        # Aggregate data for pie chart
        if len(df.columns) > 2:
            label_cols = [col for col in df.columns if col not in ['timestamp', 'value']]
            agg_data = df.groupby(label_cols)['value'].sum()
            
            labels = [', '.join([f"{col}={val}" for col, val in zip(label_cols, name)]) 
                     if isinstance(name, tuple) else str(name) 
                     for name in agg_data.index]
        else:
            agg_data = df['value']
            labels = [f"Value {i}" for i in range(len(agg_data))]
        
        fig = go.Figure(data=[
            go.Pie(
                labels=labels,
                values=agg_data.values,
                hole=0.3
            )
        ])
        
        fig.update_layout(
            title=config.title,
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_heatmap(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create heatmap"""
        
        # Pivot data for heatmap
        if len(df.columns) >= 4:  # timestamp, value, and at least 2 label columns
            label_cols = [col for col in df.columns if col not in ['timestamp', 'value']]
            
            if len(label_cols) >= 2:
                pivot_df = df.pivot_table(
                    values='value',
                    index=label_cols[0],
                    columns=label_cols[1],
                    aggfunc='mean'
                )
                
                fig = go.Figure(data=go.Heatmap(
                    z=pivot_df.values,
                    x=pivot_df.columns,
                    y=pivot_df.index,
                    colorscale='Viridis'
                ))
                
                fig.update_layout(
                    title=config.title,
                    xaxis_title=label_cols[1],
                    yaxis_title=label_cols[0],
                    template='plotly_white'
                )
                
                return json.loads(fig.to_json())
        
        # Fallback to time-based heatmap
        df['hour'] = df['timestamp'].dt.hour
        df['day'] = df['timestamp'].dt.day_name()
        
        pivot_df = df.pivot_table(
            values='value',
            index='day',
            columns='hour',
            aggfunc='mean'
        )
        
        fig = go.Figure(data=go.Heatmap(
            z=pivot_df.values,
            x=pivot_df.columns,
            y=pivot_df.index,
            colorscale='Viridis'
        ))
        
        fig.update_layout(
            title=config.title,
            xaxis_title="Hour",
            yaxis_title="Day",
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_histogram(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create histogram"""
        
        fig = go.Figure(data=[
            go.Histogram(
                x=df['value'],
                nbinsx=30,
                marker_color='steelblue'
            )
        ])
        
        fig.update_layout(
            title=config.title,
            xaxis_title="Value",
            yaxis_title="Frequency",
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_box_chart(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create box plot"""
        
        if len(df.columns) > 2:
            label_cols = [col for col in df.columns if col not in ['timestamp', 'value']]
            
            fig = go.Figure()
            
            for name, group in df.groupby(label_cols):
                if isinstance(name, tuple):
                    label = ', '.join([f"{col}={val}" for col, val in zip(label_cols, name)])
                else:
                    label = f"{label_cols[0]}={name}"
                
                fig.add_trace(go.Box(
                    y=group['value'],
                    name=label,
                    boxpoints='outliers'
                ))
        else:
            fig = go.Figure(data=[
                go.Box(
                    y=df['value'],
                    name='Value',
                    boxpoints='outliers'
                )
            ])
        
        fig.update_layout(
            title=config.title,
            yaxis_title="Value",
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_scatter_chart(self, df: pd.DataFrame, config: WidgetConfig) -> Dict[str, Any]:
        """Create scatter plot"""
        
        fig = go.Figure(data=[
            go.Scatter(
                x=df['timestamp'],
                y=df['value'],
                mode='markers',
                marker=dict(
                    size=8,
                    color=df['value'],
                    colorscale='Viridis',
                    showscale=True
                )
            )
        ])
        
        fig.update_layout(
            title=config.title,
            xaxis_title="Time",
            yaxis_title="Value",
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())
    
    def _create_empty_chart(self, title: str) -> Dict[str, Any]:
        """Create empty chart placeholder"""
        
        fig = go.Figure()
        
        fig.add_annotation(
            text="No data available",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            xanchor='center', yanchor='middle',
            showarrow=False,
            font=dict(size=16, color="gray")
        )
        
        fig.update_layout(
            title=title,
            template='plotly_white',
            xaxis=dict(showgrid=False, showticklabels=False),
            yaxis=dict(showgrid=False, showticklabels=False)
        )
        
        return json.loads(fig.to_json())


class AlertManager:
    """Alert management and evaluation"""
    
    def __init__(self, data_source_manager: DataSourceManager, db_session: Session):
        self.data_source_manager = data_source_manager
        self.db_session = db_session
        self.logger = structlog.get_logger(__name__)
        
        # Notification clients
        self.smtp_client = None
        self.slack_client = None
        self.twilio_client = None
        
        # Alert state
        self.alert_states: Dict[str, Dict[str, Any]] = {}
        
        # Setup metrics
        self.alerts_triggered = Counter(
            'alerts_triggered_total',
            'Total alerts triggered',
            ['alert_name', 'severity']
        )
    
    def configure_notifications(self, config: Dict[str, Any]):
        """Configure notification channels"""
        
        # Email configuration
        if 'email' in config:
            email_config = config['email']
            self.smtp_config = email_config
        
        # Slack configuration
        if 'slack' in config:
            slack_config = config['slack']
            self.slack_client = slack_sdk.WebClient(token=slack_config['token'])
        
        # Twilio configuration
        if 'twilio' in config:
            twilio_config = config['twilio']
            self.twilio_client = TwilioClient(
                twilio_config['account_sid'],
                twilio_config['auth_token']
            )
    
    async def evaluate_alerts(self):
        """Evaluate all active alerts"""
        
        alerts = self.db_session.query(Alert).filter_by(is_enabled=True).all()
        
        for alert in alerts:
            try:
                await self._evaluate_alert(alert)
            except Exception as e:
                self.logger.error(f"Failed to evaluate alert {alert.name}: {str(e)}")
    
    async def _evaluate_alert(self, alert: Alert):
        """Evaluate single alert"""
        
        try:
            # Execute query
            metrics = await self.data_source_manager.query(
                alert.data_source,
                alert.query,
                "5m"  # Use 5-minute window for alerts
            )
            
            if not metrics:
                return
            
            # Get latest value
            latest_metric = max(metrics, key=lambda m: m.timestamp)
            current_value = latest_metric.value
            
            # Evaluate condition
            is_triggered = self._evaluate_condition(
                alert.condition,
                current_value,
                alert.threshold
            )
            
            alert_id = str(alert.id)
            previous_state = self.alert_states.get(alert_id, {})
            
            # Check if state changed
            if is_triggered and not previous_state.get('triggered', False):
                # Alert triggered
                await self._trigger_alert(alert, current_value, latest_metric)
                
                self.alert_states[alert_id] = {
                    'triggered': True,
                    'triggered_at': datetime.utcnow(),
                    'value': current_value
                }
                
                # Update database
                alert.last_triggered = datetime.utcnow()
                self.db_session.commit()
                
                # Update metrics
                self.alerts_triggered.labels(
                    alert_name=alert.name,
                    severity=alert.severity
                ).inc()
                
            elif not is_triggered and previous_state.get('triggered', False):
                # Alert resolved
                await self._resolve_alert(alert, current_value)
                
                self.alert_states[alert_id] = {
                    'triggered': False,
                    'resolved_at': datetime.utcnow(),
                    'value': current_value
                }
            
        except Exception as e:
            self.logger.error(f"Failed to evaluate alert {alert.name}: {str(e)}")
    
    def _evaluate_condition(self, condition: str, value: float, threshold: float) -> bool:
        """Evaluate alert condition"""
        
        if condition == 'greater_than':
            return value > threshold
        elif condition == 'less_than':
            return value < threshold
        elif condition == 'equal':
            return abs(value - threshold) < 0.001
        elif condition == 'not_equal':
            return abs(value - threshold) >= 0.001
        elif condition == 'greater_equal':
            return value >= threshold
        elif condition == 'less_equal':
            return value <= threshold
        else:
            return False
    
    async def _trigger_alert(self, alert: Alert, value: float, metric: MetricData):
        """Trigger alert notification"""
        
        message = f"""
Alert: {alert.name}
Severity: {alert.severity}
Description: {alert.description}
Current Value: {value}
Threshold: {alert.threshold}
Condition: {alert.condition}
Time: {metric.timestamp.isoformat()}
Labels: {metric.labels}
"""
        
        # Parse notification channels
        channels = json.loads(alert.notification_channels) if alert.notification_channels else []
        
        for channel in channels:
            try:
                if channel['type'] == 'email':
                    await self._send_email_notification(channel, alert, message)
                elif channel['type'] == 'slack':
                    await self._send_slack_notification(channel, alert, message)
                elif channel['type'] == 'sms':
                    await self._send_sms_notification(channel, alert, message)
            except Exception as e:
                self.logger.error(f"Failed to send notification via {channel['type']}: {str(e)}")
    
    async def _resolve_alert(self, alert: Alert, value: float):
        """Send alert resolution notification"""
        
        message = f"""
Alert Resolved: {alert.name}
Current Value: {value}
Threshold: {alert.threshold}
Time: {datetime.utcnow().isoformat()}
"""
        
        channels = json.loads(alert.notification_channels) if alert.notification_channels else []
        
        for channel in channels:
            try:
                if channel['type'] == 'email':
                    await self._send_email_notification(channel, alert, message, resolved=True)
                elif channel['type'] == 'slack':
                    await self._send_slack_notification(channel, alert, message, resolved=True)
            except Exception as e:
                self.logger.error(f"Failed to send resolution notification via {channel['type']}: {str(e)}")
    
    async def _send_email_notification(self, channel: Dict[str, Any], alert: Alert, 
                                     message: str, resolved: bool = False):
        """Send email notification"""
        
        if not hasattr(self, 'smtp_config'):
            return
        
        subject = f"{'[RESOLVED] ' if resolved else ''}Alert: {alert.name}"
        
        msg = MimeMultipart()
        msg['From'] = self.smtp_config['from_email']
        msg['To'] = channel['email']
        msg['Subject'] = subject
        
        msg.attach(MimeText(message, 'plain'))
        
        server = smtplib.SMTP(self.smtp_config['smtp_server'], self.smtp_config['smtp_port'])
        
        if self.smtp_config.get('use_tls'):
            server.starttls()
        
        if 'username' in self.smtp_config:
            server.login(self.smtp_config['username'], self.smtp_config['password'])
        
        server.send_message(msg)
        server.quit()
    
    async def _send_slack_notification(self, channel: Dict[str, Any], alert: Alert, 
                                     message: str, resolved: bool = False):
        """Send Slack notification"""
        
        if not self.slack_client:
            return
        
        color = "good" if resolved else ("danger" if alert.severity == "critical" else "warning")
        
        self.slack_client.chat_postMessage(
            channel=channel['channel'],
            text=f"{'Alert Resolved' if resolved else 'Alert Triggered'}: {alert.name}",
            attachments=[
                {
                    "color": color,
                    "fields": [
                        {
                            "title": "Alert Details",
                            "value": message,
                            "short": False
                        }
                    ]
                }
            ]
        )
    
    async def _send_sms_notification(self, channel: Dict[str, Any], alert: Alert, message: str):
        """Send SMS notification"""
        
        if not self.twilio_client:
            return
        
        # Truncate message for SMS
        sms_message = f"Alert: {alert.name}\nSeverity: {alert.severity}\nValue: {message.split('Current Value: ')[1].split('\\n')[0] if 'Current Value: ' in message else 'N/A'}"
        
        if len(sms_message) > 160:
            sms_message = sms_message[:157] + "..."
        
        self.twilio_client.messages.create(
            body=sms_message,
            from_=channel['from_number'],
            to=channel['to_number']
        )


class WebSocketManager:
    """WebSocket connection management for real-time updates"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, List[str]] = {}  # dashboard_id -> [connection_ids]
        self.logger = structlog.get_logger(__name__)
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        """Accept WebSocket connection"""
        
        await websocket.accept()
        self.connections[connection_id] = websocket
        self.logger.info(f"WebSocket connected: {connection_id}")
    
    def disconnect(self, connection_id: str):
        """Remove WebSocket connection"""
        
        if connection_id in self.connections:
            del self.connections[connection_id]
        
        # Remove from subscriptions
        for dashboard_id, conn_ids in self.subscriptions.items():
            if connection_id in conn_ids:
                conn_ids.remove(connection_id)
        
        self.logger.info(f"WebSocket disconnected: {connection_id}")
    
    def subscribe(self, connection_id: str, dashboard_id: str):
        """Subscribe connection to dashboard updates"""
        
        if dashboard_id not in self.subscriptions:
            self.subscriptions[dashboard_id] = []
        
        if connection_id not in self.subscriptions[dashboard_id]:
            self.subscriptions[dashboard_id].append(connection_id)
    
    async def broadcast_dashboard_update(self, dashboard_id: str, data: Dict[str, Any]):
        """Broadcast update to all subscribers of a dashboard"""
        
        if dashboard_id not in self.subscriptions:
            return
        
        message = json.dumps({
            "type": "dashboard_update",
            "dashboard_id": dashboard_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Send to all subscribers
        disconnected = []
        
        for connection_id in self.subscriptions[dashboard_id]:
            if connection_id in self.connections:
                try:
                    await self.connections[connection_id].send_text(message)
                except:
                    disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    async def send_alert(self, alert_data: Dict[str, Any]):
        """Send alert to all connected clients"""
        
        message = json.dumps({
            "type": "alert",
            "data": alert_data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        disconnected = []
        
        for connection_id, websocket in self.connections.items():
            try:
                await websocket.send_text(message)
            except:
                disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id)


class AnalyticsDashboard:
    """Main analytics dashboard system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize database
        db_url = config.get('database_url', 'sqlite:///analytics.db')
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db_session = SessionLocal()
        
        # Initialize components
        self.data_source_manager = DataSourceManager()
        self.chart_generator = ChartGenerator()
        self.alert_manager = AlertManager(self.data_source_manager, self.db_session)
        self.websocket_manager = WebSocketManager()
        
        # Setup data sources
        self._setup_data_sources()
        
        # Setup FastAPI app
        self.app = FastAPI(title="Analytics Dashboard", version="1.0.0")
        self.templates = Jinja2Templates(directory="templates")
        self._setup_routes()
        
        # Background tasks
        self._setup_background_tasks()
    
    def _setup_data_sources(self):
        """Setup configured data sources"""
        
        data_sources = self.config.get('data_sources', {})
        
        for name, config in data_sources.items():
            source_type = config['type']
            
            if source_type == 'prometheus':
                connector = PrometheusConnector(config)
            elif source_type == 'influxdb':
                connector = InfluxDBConnector(config)
            elif source_type == 'elasticsearch':
                connector = ElasticsearchConnector(config)
            else:
                self.logger.warning(f"Unsupported data source type: {source_type}")
                continue
            
            self.data_source_manager.add_connector(name, connector)
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/", response_class=HTMLResponse)
        async def dashboard_home(request: Request):
            """Dashboard home page"""
            
            dashboards = self.db_session.query(Dashboard).filter_by(is_active=True).all()
            
            return self.templates.TemplateResponse("dashboard_list.html", {
                "request": request,
                "dashboards": dashboards
            })
        
        @self.app.get("/dashboard/{dashboard_id}", response_class=HTMLResponse)
        async def view_dashboard(request: Request, dashboard_id: str):
            """View dashboard"""
            
            dashboard = self.db_session.query(Dashboard).filter_by(
                id=dashboard_id,
                is_active=True
            ).first()
            
            if not dashboard:
                raise HTTPException(status_code=404, detail="Dashboard not found")
            
            return self.templates.TemplateResponse("dashboard.html", {
                "request": request,
                "dashboard": dashboard
            })
        
        @self.app.post("/api/dashboards")
        async def create_dashboard(
            name: str,
            description: str = "",
            layout: Dict[str, Any] = {},
            widgets: List[Dict[str, Any]] = [],
            refresh_interval: int = 30
        ):
            """Create new dashboard"""
            
            dashboard = Dashboard(
                name=name,
                description=description,
                layout=layout,
                widgets=widgets,
                refresh_interval=refresh_interval
            )
            
            self.db_session.add(dashboard)
            self.db_session.commit()
            
            return {"id": str(dashboard.id), "status": "created"}
        
        @self.app.get("/api/dashboards/{dashboard_id}/data")
        async def get_dashboard_data(dashboard_id: str, time_range: str = "1h"):
            """Get dashboard data"""
            
            dashboard = self.db_session.query(Dashboard).filter_by(
                id=dashboard_id,
                is_active=True
            ).first()
            
            if not dashboard:
                raise HTTPException(status_code=404, detail="Dashboard not found")
            
            # Get widget data
            widget_data = {}
            
            for widget_config in dashboard.widgets:
                widget_id = widget_config['id']
                
                try:
                    # Execute query
                    metrics = await self.data_source_manager.query(
                        widget_config['data_source'],
                        widget_config['query'],
                        time_range
                    )
                    
                    # Generate chart
                    config = WidgetConfig(
                        title=widget_config['title'],
                        chart_type=ChartType(widget_config['chart_type']),
                        data_source=DataSource(widget_config['data_source']),
                        query=widget_config['query'],
                        time_range=time_range
                    )
                    
                    chart = self.chart_generator.create_chart(
                        config.chart_type,
                        metrics,
                        config
                    )
                    
                    widget_data[widget_id] = {
                        "chart": chart,
                        "last_updated": datetime.utcnow().isoformat(),
                        "data_points": len(metrics)
                    }
                    
                except Exception as e:
                    self.logger.error(f"Failed to get data for widget {widget_id}: {str(e)}")
                    widget_data[widget_id] = {
                        "error": str(e),
                        "last_updated": datetime.utcnow().isoformat()
                    }
            
            return {
                "dashboard_id": dashboard_id,
                "widgets": widget_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @self.app.websocket("/ws/{connection_id}")
        async def websocket_endpoint(websocket: WebSocket, connection_id: str):
            """WebSocket endpoint for real-time updates"""
            
            await self.websocket_manager.connect(websocket, connection_id)
            
            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    
                    if message['type'] == 'subscribe':
                        dashboard_id = message['dashboard_id']
                        self.websocket_manager.subscribe(connection_id, dashboard_id)
                    
            except WebSocketDisconnect:
                self.websocket_manager.disconnect(connection_id)
        
        @self.app.post("/api/alerts")
        async def create_alert(
            name: str,
            query: str,
            condition: str,
            threshold: float,
            severity: str,
            data_source: str,
            description: str = "",
            notification_channels: List[Dict[str, Any]] = []
        ):
            """Create new alert"""
            
            alert = Alert(
                name=name,
                description=description,
                query=query,
                condition=condition,
                threshold=threshold,
                severity=severity,
                data_source=data_source,
                notification_channels=json.dumps(notification_channels)
            )
            
            self.db_session.add(alert)
            self.db_session.commit()
            
            return {"id": str(alert.id), "status": "created"}
        
        @self.app.get("/api/data-sources/test")
        async def test_data_sources():
            """Test all data source connections"""
            
            results = await self.data_source_manager.test_all_connections()
            
            return {
                "results": results,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
        
        @self.app.get("/metrics")
        async def get_metrics():
            """Prometheus metrics endpoint"""
            return Response(generate_latest(), media_type="text/plain")
    
    def _setup_background_tasks(self):
        """Setup background tasks"""
        
        async def alert_evaluation_task():
            """Background task for alert evaluation"""
            while True:
                try:
                    await self.alert_manager.evaluate_alerts()
                except Exception as e:
                    self.logger.error(f"Alert evaluation failed: {str(e)}")
                
                await asyncio.sleep(60)  # Evaluate every minute
        
        async def dashboard_refresh_task():
            """Background task for dashboard refresh"""
            while True:
                try:
                    # Get all active dashboards
                    dashboards = self.db_session.query(Dashboard).filter_by(is_active=True).all()
                    
                    for dashboard in dashboards:
                        # Check if refresh is needed
                        if dashboard.refresh_interval > 0:
                            # Get dashboard data
                            data = await self.get_dashboard_data(str(dashboard.id))
                            
                            # Broadcast to subscribers
                            await self.websocket_manager.broadcast_dashboard_update(
                                str(dashboard.id),
                                data
                            )
                    
                except Exception as e:
                    self.logger.error(f"Dashboard refresh failed: {str(e)}")
                
                await asyncio.sleep(30)  # Refresh every 30 seconds
        
        # Start background tasks
        asyncio.create_task(alert_evaluation_task())
        asyncio.create_task(dashboard_refresh_task())


# Example usage
if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    config = {
        "database_url": "sqlite:///analytics.db",
        "data_sources": {
            "prometheus": {
                "type": "prometheus",
                "url": "http://localhost:9090"
            },
            "influxdb": {
                "type": "influxdb",
                "url": "http://localhost:8086",
                "token": "your-token",
                "org": "your-org"
            }
        }
    }
    
    # Initialize dashboard
    dashboard = AnalyticsDashboard(config)
    
    # Configure alert notifications
    dashboard.alert_manager.configure_notifications({
        "email": {
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "use_tls": True,
            "username": "your-email@gmail.com",
            "password": "your-password",
            "from_email": "alerts@yourcompany.com"
        },
        "slack": {
            "token": "xoxb-your-slack-token"
        }
    })
    
    # Run FastAPI app
    uvicorn.run(dashboard.app, host="0.0.0.0", port=8000)