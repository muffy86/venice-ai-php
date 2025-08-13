"""
Advanced User Interface System
Provides comprehensive UI components, themes, and interactive elements for the AI framework.
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Optional, Any, Union, Callable, Set, Tuple
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import uuid
from datetime import datetime, timedelta
import threading
from abc import ABC, abstractmethod
import base64
from io import BytesIO
import hashlib
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, Enum as SQLEnum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine, ForeignKey
from fastapi import FastAPI, HTTPException, Depends, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel, Field, validator
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import structlog
import websockets
import aiofiles
import markdown
from PIL import Image, ImageDraw, ImageFont
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
import pandas as pd

# Database setup
Base = declarative_base()

class ComponentType(Enum):
    BUTTON = "button"
    INPUT = "input"
    SELECT = "select"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    TEXTAREA = "textarea"
    SLIDER = "slider"
    TOGGLE = "toggle"
    CARD = "card"
    MODAL = "modal"
    CHART = "chart"
    TABLE = "table"
    FORM = "form"
    NAVIGATION = "navigation"
    SIDEBAR = "sidebar"
    HEADER = "header"
    FOOTER = "footer"
    DASHBOARD = "dashboard"
    WIDGET = "widget"

class ThemeType(Enum):
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"
    CUSTOM = "custom"

class LayoutType(Enum):
    GRID = "grid"
    FLEX = "flex"
    ABSOLUTE = "absolute"
    RELATIVE = "relative"
    FIXED = "fixed"

class AnimationType(Enum):
    FADE = "fade"
    SLIDE = "slide"
    BOUNCE = "bounce"
    ZOOM = "zoom"
    ROTATE = "rotate"
    NONE = "none"

class InteractionType(Enum):
    CLICK = "click"
    HOVER = "hover"
    FOCUS = "focus"
    BLUR = "blur"
    CHANGE = "change"
    SUBMIT = "submit"
    SCROLL = "scroll"
    RESIZE = "resize"
    KEYPRESS = "keypress"

class NotificationType(Enum):
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class UIComponent:
    id: str
    type: ComponentType
    properties: Dict[str, Any] = field(default_factory=dict)
    styles: Dict[str, Any] = field(default_factory=dict)
    children: List['UIComponent'] = field(default_factory=list)
    events: Dict[str, str] = field(default_factory=dict)
    data: Dict[str, Any] = field(default_factory=dict)
    visible: bool = True
    enabled: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Theme:
    name: str
    type: ThemeType
    colors: Dict[str, str] = field(default_factory=dict)
    fonts: Dict[str, str] = field(default_factory=dict)
    spacing: Dict[str, str] = field(default_factory=dict)
    borders: Dict[str, str] = field(default_factory=dict)
    shadows: Dict[str, str] = field(default_factory=dict)
    animations: Dict[str, str] = field(default_factory=dict)
    custom_css: str = ""

@dataclass
class Layout:
    id: str
    type: LayoutType
    components: List[UIComponent] = field(default_factory=list)
    properties: Dict[str, Any] = field(default_factory=dict)
    responsive: bool = True
    breakpoints: Dict[str, Dict[str, Any]] = field(default_factory=dict)

@dataclass
class Page:
    id: str
    title: str
    path: str
    layout: Layout
    theme: str = "default"
    meta: Dict[str, str] = field(default_factory=dict)
    scripts: List[str] = field(default_factory=list)
    styles: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)

@dataclass
class Notification:
    id: str
    type: NotificationType
    title: str
    message: str
    duration: int = 5000  # milliseconds
    actions: List[Dict[str, str]] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class UserPreferences:
    user_id: str
    theme: str = "light"
    language: str = "en"
    timezone: str = "UTC"
    notifications: bool = True
    animations: bool = True
    compact_mode: bool = False
    sidebar_collapsed: bool = False
    custom_settings: Dict[str, Any] = field(default_factory=dict)

# Database Models
class UIComponentDB(Base):
    __tablename__ = "ui_components"
    
    id = Column(String(255), primary_key=True)
    type = Column(SQLEnum(ComponentType), nullable=False)
    properties = Column(JSON)
    styles = Column(JSON)
    events = Column(JSON)
    data = Column(JSON)
    visible = Column(Boolean, default=True)
    enabled = Column(Boolean, default=True)
    parent_id = Column(String(255), ForeignKey('ui_components.id'))
    page_id = Column(String(255), ForeignKey('pages.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    children = relationship("UIComponentDB", backref="parent", remote_side=[id])

class ThemeDB(Base):
    __tablename__ = "themes"
    
    id = Column(String(255), primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    type = Column(SQLEnum(ThemeType), default=ThemeType.CUSTOM)
    colors = Column(JSON)
    fonts = Column(JSON)
    spacing = Column(JSON)
    borders = Column(JSON)
    shadows = Column(JSON)
    animations = Column(JSON)
    custom_css = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PageDB(Base):
    __tablename__ = "pages"
    
    id = Column(String(255), primary_key=True)
    title = Column(String(255), nullable=False)
    path = Column(String(255), unique=True, nullable=False)
    theme_id = Column(String(255), ForeignKey('themes.id'))
    meta = Column(JSON)
    scripts = Column(JSON)
    styles = Column(JSON)
    permissions = Column(JSON)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    theme = relationship("ThemeDB", backref="pages")
    components = relationship("UIComponentDB", backref="page")

class UserPreferencesDB(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), unique=True, nullable=False)
    theme = Column(String(255), default="light")
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    notifications = Column(Boolean, default=True)
    animations = Column(Boolean, default=True)
    compact_mode = Column(Boolean, default=False)
    sidebar_collapsed = Column(Boolean, default=False)
    custom_settings = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UIInteractionDB(Base):
    __tablename__ = "ui_interactions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(255))
    component_id = Column(String(255))
    interaction_type = Column(SQLEnum(InteractionType))
    data = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Prometheus Metrics
REGISTRY = CollectorRegistry()
UI_INTERACTIONS = Counter('ui_interactions_total', 'Total UI interactions', ['component_type', 'interaction_type'], registry=REGISTRY)
PAGE_VIEWS = Counter('page_views_total', 'Total page views', ['page_path'], registry=REGISTRY)
COMPONENT_RENDERS = Counter('component_renders_total', 'Total component renders', ['component_type'], registry=REGISTRY)
WEBSOCKET_CONNECTIONS = Gauge('websocket_connections', 'Active WebSocket connections', registry=REGISTRY)
THEME_USAGE = Counter('theme_usage_total', 'Theme usage statistics', ['theme_name'], registry=REGISTRY)

class ComponentBuilder:
    """Build UI components programmatically"""
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def create_button(self, id: str, text: str, variant: str = "primary", 
                     size: str = "medium", disabled: bool = False,
                     onclick: str = None) -> UIComponent:
        """Create a button component"""
        return UIComponent(
            id=id,
            type=ComponentType.BUTTON,
            properties={
                "text": text,
                "variant": variant,
                "size": size,
                "disabled": disabled
            },
            events={"click": onclick} if onclick else {},
            styles={
                "padding": "8px 16px" if size == "medium" else "4px 8px" if size == "small" else "12px 24px",
                "border-radius": "4px",
                "border": "none",
                "cursor": "pointer" if not disabled else "not-allowed",
                "opacity": "0.6" if disabled else "1"
            }
        )
    
    def create_input(self, id: str, type: str = "text", placeholder: str = "",
                    value: str = "", required: bool = False,
                    validation: Dict[str, Any] = None) -> UIComponent:
        """Create an input component"""
        return UIComponent(
            id=id,
            type=ComponentType.INPUT,
            properties={
                "type": type,
                "placeholder": placeholder,
                "value": value,
                "required": required,
                "validation": validation or {}
            },
            styles={
                "padding": "8px 12px",
                "border": "1px solid #ccc",
                "border-radius": "4px",
                "font-size": "14px",
                "width": "100%"
            }
        )
    
    def create_card(self, id: str, title: str = "", content: str = "",
                   children: List[UIComponent] = None) -> UIComponent:
        """Create a card component"""
        return UIComponent(
            id=id,
            type=ComponentType.CARD,
            properties={
                "title": title,
                "content": content
            },
            children=children or [],
            styles={
                "background": "#fff",
                "border": "1px solid #e0e0e0",
                "border-radius": "8px",
                "padding": "16px",
                "box-shadow": "0 2px 4px rgba(0,0,0,0.1)"
            }
        )
    
    def create_chart(self, id: str, chart_type: str, data: Dict[str, Any],
                    title: str = "", height: int = 400) -> UIComponent:
        """Create a chart component"""
        return UIComponent(
            id=id,
            type=ComponentType.CHART,
            properties={
                "chart_type": chart_type,
                "title": title,
                "height": height
            },
            data=data,
            styles={
                "width": "100%",
                "height": f"{height}px"
            }
        )
    
    def create_table(self, id: str, columns: List[Dict[str, str]],
                    data: List[Dict[str, Any]], sortable: bool = True,
                    filterable: bool = True, paginated: bool = True) -> UIComponent:
        """Create a table component"""
        return UIComponent(
            id=id,
            type=ComponentType.TABLE,
            properties={
                "columns": columns,
                "sortable": sortable,
                "filterable": filterable,
                "paginated": paginated
            },
            data={"rows": data},
            styles={
                "width": "100%",
                "border-collapse": "collapse"
            }
        )
    
    def create_modal(self, id: str, title: str, content: UIComponent = None,
                    size: str = "medium", closable: bool = True) -> UIComponent:
        """Create a modal component"""
        return UIComponent(
            id=id,
            type=ComponentType.MODAL,
            properties={
                "title": title,
                "size": size,
                "closable": closable
            },
            children=[content] if content else [],
            styles={
                "position": "fixed",
                "top": "50%",
                "left": "50%",
                "transform": "translate(-50%, -50%)",
                "background": "#fff",
                "border-radius": "8px",
                "box-shadow": "0 4px 20px rgba(0,0,0,0.3)",
                "z-index": "1000"
            }
        )
    
    def create_form(self, id: str, fields: List[UIComponent],
                   submit_url: str = "", method: str = "POST") -> UIComponent:
        """Create a form component"""
        return UIComponent(
            id=id,
            type=ComponentType.FORM,
            properties={
                "submit_url": submit_url,
                "method": method
            },
            children=fields,
            events={"submit": "handleFormSubmit"}
        )

class ThemeManager:
    """Manage UI themes"""
    
    def __init__(self, db_session):
        self.db_session = db_session
        self.logger = structlog.get_logger()
        self._setup_default_themes()
    
    def _setup_default_themes(self):
        """Setup default themes"""
        default_themes = [
            {
                "id": "light",
                "name": "Light",
                "type": ThemeType.LIGHT,
                "colors": {
                    "primary": "#007bff",
                    "secondary": "#6c757d",
                    "success": "#28a745",
                    "danger": "#dc3545",
                    "warning": "#ffc107",
                    "info": "#17a2b8",
                    "light": "#f8f9fa",
                    "dark": "#343a40",
                    "background": "#ffffff",
                    "surface": "#f8f9fa",
                    "text": "#212529",
                    "text-secondary": "#6c757d"
                },
                "fonts": {
                    "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "monospace": "'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
                },
                "spacing": {
                    "xs": "4px",
                    "sm": "8px",
                    "md": "16px",
                    "lg": "24px",
                    "xl": "32px"
                }
            },
            {
                "id": "dark",
                "name": "Dark",
                "type": ThemeType.DARK,
                "colors": {
                    "primary": "#0d6efd",
                    "secondary": "#6c757d",
                    "success": "#198754",
                    "danger": "#dc3545",
                    "warning": "#ffc107",
                    "info": "#0dcaf0",
                    "light": "#f8f9fa",
                    "dark": "#212529",
                    "background": "#121212",
                    "surface": "#1e1e1e",
                    "text": "#ffffff",
                    "text-secondary": "#adb5bd"
                },
                "fonts": {
                    "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    "monospace": "'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
                },
                "spacing": {
                    "xs": "4px",
                    "sm": "8px",
                    "md": "16px",
                    "lg": "24px",
                    "xl": "32px"
                }
            }
        ]
        
        for theme_data in default_themes:
            existing = self.db_session.query(ThemeDB).filter(ThemeDB.id == theme_data["id"]).first()
            if not existing:
                theme = ThemeDB(
                    id=theme_data["id"],
                    name=theme_data["name"],
                    type=theme_data["type"],
                    colors=theme_data["colors"],
                    fonts=theme_data["fonts"],
                    spacing=theme_data["spacing"]
                )
                self.db_session.add(theme)
        
        self.db_session.commit()
    
    def get_theme(self, theme_id: str) -> Optional[Theme]:
        """Get theme by ID"""
        theme_db = self.db_session.query(ThemeDB).filter(ThemeDB.id == theme_id).first()
        if not theme_db:
            return None
        
        return Theme(
            name=theme_db.name,
            type=theme_db.type,
            colors=theme_db.colors or {},
            fonts=theme_db.fonts or {},
            spacing=theme_db.spacing or {},
            borders=theme_db.borders or {},
            shadows=theme_db.shadows or {},
            animations=theme_db.animations or {},
            custom_css=theme_db.custom_css or ""
        )
    
    def create_theme(self, theme: Theme) -> str:
        """Create new theme"""
        theme_id = str(uuid.uuid4())
        theme_db = ThemeDB(
            id=theme_id,
            name=theme.name,
            type=theme.type,
            colors=theme.colors,
            fonts=theme.fonts,
            spacing=theme.spacing,
            borders=theme.borders,
            shadows=theme.shadows,
            animations=theme.animations,
            custom_css=theme.custom_css
        )
        
        self.db_session.add(theme_db)
        self.db_session.commit()
        
        self.logger.info("Theme created", theme_id=theme_id, name=theme.name)
        return theme_id
    
    def generate_css(self, theme: Theme) -> str:
        """Generate CSS from theme"""
        css_parts = [":root {"]
        
        # Colors
        for name, value in theme.colors.items():
            css_parts.append(f"  --color-{name}: {value};")
        
        # Fonts
        for name, value in theme.fonts.items():
            css_parts.append(f"  --font-{name}: {value};")
        
        # Spacing
        for name, value in theme.spacing.items():
            css_parts.append(f"  --spacing-{name}: {value};")
        
        # Borders
        for name, value in theme.borders.items():
            css_parts.append(f"  --border-{name}: {value};")
        
        # Shadows
        for name, value in theme.shadows.items():
            css_parts.append(f"  --shadow-{name}: {value};")
        
        css_parts.append("}")
        
        # Add custom CSS
        if theme.custom_css:
            css_parts.append(theme.custom_css)
        
        return "\n".join(css_parts)

class LayoutManager:
    """Manage UI layouts"""
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def create_grid_layout(self, components: List[UIComponent], 
                          columns: int = 12, gap: str = "16px") -> Layout:
        """Create grid layout"""
        return Layout(
            id=str(uuid.uuid4()),
            type=LayoutType.GRID,
            components=components,
            properties={
                "columns": columns,
                "gap": gap,
                "grid-template-columns": f"repeat({columns}, 1fr)"
            }
        )
    
    def create_flex_layout(self, components: List[UIComponent],
                          direction: str = "row", justify: str = "flex-start",
                          align: str = "stretch", wrap: str = "nowrap") -> Layout:
        """Create flex layout"""
        return Layout(
            id=str(uuid.uuid4()),
            type=LayoutType.FLEX,
            components=components,
            properties={
                "flex-direction": direction,
                "justify-content": justify,
                "align-items": align,
                "flex-wrap": wrap
            }
        )
    
    def make_responsive(self, layout: Layout, 
                       breakpoints: Dict[str, Dict[str, Any]]) -> Layout:
        """Make layout responsive"""
        layout.responsive = True
        layout.breakpoints = breakpoints
        return layout

class ChartGenerator:
    """Generate interactive charts"""
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def create_line_chart(self, data: pd.DataFrame, x: str, y: str,
                         title: str = "", color: str = None) -> Dict[str, Any]:
        """Create line chart"""
        fig = px.line(data, x=x, y=y, title=title, color=color)
        fig.update_layout(
            template="plotly_white",
            font=dict(family="Arial, sans-serif", size=12),
            title_font_size=16
        )
        return json.loads(fig.to_json())
    
    def create_bar_chart(self, data: pd.DataFrame, x: str, y: str,
                        title: str = "", color: str = None) -> Dict[str, Any]:
        """Create bar chart"""
        fig = px.bar(data, x=x, y=y, title=title, color=color)
        fig.update_layout(
            template="plotly_white",
            font=dict(family="Arial, sans-serif", size=12),
            title_font_size=16
        )
        return json.loads(fig.to_json())
    
    def create_pie_chart(self, data: pd.DataFrame, values: str, names: str,
                        title: str = "") -> Dict[str, Any]:
        """Create pie chart"""
        fig = px.pie(data, values=values, names=names, title=title)
        fig.update_layout(
            template="plotly_white",
            font=dict(family="Arial, sans-serif", size=12),
            title_font_size=16
        )
        return json.loads(fig.to_json())
    
    def create_scatter_plot(self, data: pd.DataFrame, x: str, y: str,
                           title: str = "", color: str = None, size: str = None) -> Dict[str, Any]:
        """Create scatter plot"""
        fig = px.scatter(data, x=x, y=y, title=title, color=color, size=size)
        fig.update_layout(
            template="plotly_white",
            font=dict(family="Arial, sans-serif", size=12),
            title_font_size=16
        )
        return json.loads(fig.to_json())

class WebSocketManager:
    """Manage WebSocket connections for real-time UI updates"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
        self.logger = structlog.get_logger()
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Connect WebSocket client"""
        await websocket.accept()
        self.connections[client_id] = websocket
        WEBSOCKET_CONNECTIONS.inc()
        self.logger.info("WebSocket connected", client_id=client_id)
    
    def disconnect(self, client_id: str):
        """Disconnect WebSocket client"""
        if client_id in self.connections:
            del self.connections[client_id]
            WEBSOCKET_CONNECTIONS.dec()
            self.logger.info("WebSocket disconnected", client_id=client_id)
    
    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        """Send message to specific client"""
        if client_id in self.connections:
            try:
                await self.connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                self.logger.error("Failed to send WebSocket message", 
                                client_id=client_id, error=str(e))
                self.disconnect(client_id)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        disconnected = []
        for client_id, websocket in self.connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                self.logger.error("Failed to broadcast WebSocket message", 
                                client_id=client_id, error=str(e))
                disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)
    
    async def send_notification(self, client_id: str, notification: Notification):
        """Send notification to client"""
        message = {
            "type": "notification",
            "data": asdict(notification)
        }
        await self.send_to_client(client_id, message)
    
    async def send_component_update(self, client_id: str, component: UIComponent):
        """Send component update to client"""
        message = {
            "type": "component_update",
            "data": asdict(component)
        }
        await self.send_to_client(client_id, message)

class UISystem:
    """Main UI system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = structlog.get_logger()
        
        # Setup database
        db_url = config.get('database_url', 'sqlite:///ui_system.db')
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db_session = Session()
        
        # Initialize components
        self.component_builder = ComponentBuilder()
        self.theme_manager = ThemeManager(self.db_session)
        self.layout_manager = LayoutManager()
        self.chart_generator = ChartGenerator()
        self.websocket_manager = WebSocketManager()
        
        # Setup templates
        self.templates = Jinja2Templates(directory="templates")
    
    def create_page(self, title: str, path: str, components: List[UIComponent],
                   theme: str = "light", permissions: List[str] = None) -> str:
        """Create new page"""
        page_id = str(uuid.uuid4())
        
        # Save page to database
        page_db = PageDB(
            id=page_id,
            title=title,
            path=path,
            theme_id=theme,
            permissions=permissions or []
        )
        self.db_session.add(page_db)
        
        # Save components
        for component in components:
            self._save_component(component, page_id)
        
        self.db_session.commit()
        
        self.logger.info("Page created", page_id=page_id, title=title, path=path)
        return page_id
    
    def _save_component(self, component: UIComponent, page_id: str, parent_id: str = None):
        """Save component to database"""
        component_db = UIComponentDB(
            id=component.id,
            type=component.type,
            properties=component.properties,
            styles=component.styles,
            events=component.events,
            data=component.data,
            visible=component.visible,
            enabled=component.enabled,
            parent_id=parent_id,
            page_id=page_id
        )
        self.db_session.add(component_db)
        
        # Save children
        for child in component.children:
            self._save_component(child, page_id, component.id)
    
    def get_page(self, page_id: str) -> Optional[Page]:
        """Get page by ID"""
        page_db = self.db_session.query(PageDB).filter(PageDB.id == page_id).first()
        if not page_db:
            return None
        
        # Load components
        components = self._load_components(page_id)
        
        # Create layout
        layout = Layout(
            id=str(uuid.uuid4()),
            type=LayoutType.FLEX,
            components=components
        )
        
        return Page(
            id=page_db.id,
            title=page_db.title,
            path=page_db.path,
            layout=layout,
            theme=page_db.theme_id,
            meta=page_db.meta or {},
            scripts=page_db.scripts or [],
            styles=page_db.styles or [],
            permissions=page_db.permissions or []
        )
    
    def _load_components(self, page_id: str, parent_id: str = None) -> List[UIComponent]:
        """Load components from database"""
        components_db = self.db_session.query(UIComponentDB).filter(
            UIComponentDB.page_id == page_id,
            UIComponentDB.parent_id == parent_id
        ).all()
        
        components = []
        for comp_db in components_db:
            # Load children recursively
            children = self._load_components(page_id, comp_db.id)
            
            component = UIComponent(
                id=comp_db.id,
                type=comp_db.type,
                properties=comp_db.properties or {},
                styles=comp_db.styles or {},
                children=children,
                events=comp_db.events or {},
                data=comp_db.data or {},
                visible=comp_db.visible,
                enabled=comp_db.enabled,
                created_at=comp_db.created_at
            )
            components.append(component)
        
        return components
    
    def render_page(self, page: Page, user_preferences: UserPreferences = None) -> str:
        """Render page to HTML"""
        theme = self.theme_manager.get_theme(page.theme)
        if not theme:
            theme = self.theme_manager.get_theme("light")
        
        # Apply user preferences
        if user_preferences:
            if user_preferences.theme != page.theme:
                theme = self.theme_manager.get_theme(user_preferences.theme) or theme
        
        # Generate CSS
        theme_css = self.theme_manager.generate_css(theme)
        
        # Render components
        components_html = self._render_components(page.layout.components)
        
        # Create HTML template
        html_template = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{page.title}</title>
            <style>
                {theme_css}
                {self._get_base_css()}
            </style>
            {''.join([f'<link rel="stylesheet" href="{style}">' for style in page.styles])}
        </head>
        <body>
            <div id="app">
                {components_html}
            </div>
            
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <script>
                {self._get_base_js()}
            </script>
            {''.join([f'<script src="{script}"></script>' for script in page.scripts])}
        </body>
        </html>
        """
        
        return html_template
    
    def _render_components(self, components: List[UIComponent]) -> str:
        """Render components to HTML"""
        html_parts = []
        
        for component in components:
            if not component.visible:
                continue
            
            COMPONENT_RENDERS.labels(component_type=component.type.value).inc()
            
            html = self._render_component(component)
            html_parts.append(html)
        
        return "\n".join(html_parts)
    
    def _render_component(self, component: UIComponent) -> str:
        """Render single component to HTML"""
        styles = "; ".join([f"{k}: {v}" for k, v in component.styles.items()])
        style_attr = f'style="{styles}"' if styles else ""
        
        events = " ".join([f'{event}="{handler}"' for event, handler in component.events.items()])
        
        if component.type == ComponentType.BUTTON:
            return f'''
            <button id="{component.id}" {style_attr} {events} 
                    {"disabled" if not component.enabled else ""}>
                {component.properties.get("text", "")}
            </button>
            '''
        
        elif component.type == ComponentType.INPUT:
            return f'''
            <input id="{component.id}" 
                   type="{component.properties.get("type", "text")}"
                   placeholder="{component.properties.get("placeholder", "")}"
                   value="{component.properties.get("value", "")}"
                   {"required" if component.properties.get("required") else ""}
                   {"disabled" if not component.enabled else ""}
                   {style_attr} {events}>
            '''
        
        elif component.type == ComponentType.CARD:
            children_html = self._render_components(component.children)
            title = component.properties.get("title", "")
            content = component.properties.get("content", "")
            
            return f'''
            <div id="{component.id}" class="card" {style_attr}>
                {f"<h3>{title}</h3>" if title else ""}
                {f"<p>{content}</p>" if content else ""}
                {children_html}
            </div>
            '''
        
        elif component.type == ComponentType.CHART:
            chart_data = json.dumps(component.data)
            return f'''
            <div id="{component.id}" {style_attr}></div>
            <script>
                Plotly.newPlot('{component.id}', {chart_data});
            </script>
            '''
        
        elif component.type == ComponentType.TABLE:
            columns = component.properties.get("columns", [])
            rows = component.data.get("rows", [])
            
            headers = "".join([f"<th>{col.get('title', col.get('key', ''))}</th>" for col in columns])
            
            table_rows = []
            for row in rows:
                cells = "".join([f"<td>{row.get(col.get('key', ''), '')}</td>" for col in columns])
                table_rows.append(f"<tr>{cells}</tr>")
            
            return f'''
            <table id="{component.id}" {style_attr}>
                <thead><tr>{headers}</tr></thead>
                <tbody>{"".join(table_rows)}</tbody>
            </table>
            '''
        
        elif component.type == ComponentType.MODAL:
            children_html = self._render_components(component.children)
            title = component.properties.get("title", "")
            
            return f'''
            <div id="{component.id}" class="modal" {style_attr} style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{title}</h3>
                        {"<button class='modal-close'>&times;</button>" if component.properties.get("closable") else ""}
                    </div>
                    <div class="modal-body">
                        {children_html}
                    </div>
                </div>
            </div>
            '''
        
        elif component.type == ComponentType.FORM:
            children_html = self._render_components(component.children)
            action = component.properties.get("submit_url", "")
            method = component.properties.get("method", "POST")
            
            return f'''
            <form id="{component.id}" action="{action}" method="{method}" {style_attr} {events}>
                {children_html}
            </form>
            '''
        
        else:
            # Generic container
            children_html = self._render_components(component.children)
            return f'''
            <div id="{component.id}" {style_attr} {events}>
                {children_html}
            </div>
            '''
    
    def _get_base_css(self) -> str:
        """Get base CSS styles"""
        return """
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: var(--font-primary);
            background-color: var(--color-background);
            color: var(--color-text);
        }
        
        .card {
            background: var(--color-surface);
            border: 1px solid var(--color-light);
            border-radius: 8px;
            padding: var(--spacing-md);
            margin: var(--spacing-sm);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        }
        
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--color-background);
            border-radius: 8px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
        }
        
        .modal-header {
            padding: var(--spacing-md);
            border-bottom: 1px solid var(--color-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-body {
            padding: var(--spacing-md);
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--color-text-secondary);
        }
        
        button {
            background: var(--color-primary);
            color: white;
            border: none;
            padding: var(--spacing-sm) var(--spacing-md);
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        button:hover {
            opacity: 0.9;
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        input, textarea, select {
            padding: var(--spacing-sm);
            border: 1px solid var(--color-light);
            border-radius: 4px;
            font-size: 14px;
            background: var(--color-background);
            color: var(--color-text);
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--color-primary);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: var(--color-surface);
        }
        
        th, td {
            padding: var(--spacing-sm);
            text-align: left;
            border-bottom: 1px solid var(--color-light);
        }
        
        th {
            background: var(--color-light);
            font-weight: bold;
        }
        """
    
    def _get_base_js(self) -> str:
        """Get base JavaScript"""
        return """
        // WebSocket connection for real-time updates
        let ws = null;
        
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                console.log('WebSocket connected');
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                console.log('WebSocket disconnected');
                // Reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(message) {
            if (message.type === 'notification') {
                showNotification(message.data);
            } else if (message.type === 'component_update') {
                updateComponent(message.data);
            }
        }
        
        function showNotification(notification) {
            // Create notification element
            const notif = document.createElement('div');
            notif.className = `notification notification-${notification.type}`;
            notif.innerHTML = `
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
            `;
            
            // Add to page
            document.body.appendChild(notif);
            
            // Remove after duration
            setTimeout(() => {
                notif.remove();
            }, notification.duration || 5000);
        }
        
        function updateComponent(component) {
            const element = document.getElementById(component.id);
            if (element) {
                // Update component properties
                if (component.properties.text) {
                    element.textContent = component.properties.text;
                }
                if (component.properties.value) {
                    element.value = component.properties.value;
                }
                // Update visibility
                element.style.display = component.visible ? '' : 'none';
                // Update enabled state
                element.disabled = !component.enabled;
            }
        }
        
        // Modal functionality
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
            }
        }
        
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        };
        
        // Form handling
        function handleFormSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            
            // Send form data via WebSocket or AJAX
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'form_submit',
                    form_id: form.id,
                    data: Object.fromEntries(formData)
                }));
            }
        }
        
        // Initialize WebSocket connection
        connectWebSocket();
        """
    
    def log_interaction(self, user_id: str, component_id: str, 
                       interaction_type: InteractionType, data: Dict[str, Any] = None):
        """Log UI interaction"""
        interaction = UIInteractionDB(
            user_id=user_id,
            component_id=component_id,
            interaction_type=interaction_type,
            data=data or {}
        )
        
        self.db_session.add(interaction)
        self.db_session.commit()
        
        UI_INTERACTIONS.labels(
            component_type="unknown",  # Would need to look up component type
            interaction_type=interaction_type.value
        ).inc()
    
    def get_user_preferences(self, user_id: str) -> UserPreferences:
        """Get user preferences"""
        prefs_db = self.db_session.query(UserPreferencesDB).filter(
            UserPreferencesDB.user_id == user_id
        ).first()
        
        if not prefs_db:
            # Create default preferences
            prefs_db = UserPreferencesDB(user_id=user_id)
            self.db_session.add(prefs_db)
            self.db_session.commit()
        
        return UserPreferences(
            user_id=prefs_db.user_id,
            theme=prefs_db.theme,
            language=prefs_db.language,
            timezone=prefs_db.timezone,
            notifications=prefs_db.notifications,
            animations=prefs_db.animations,
            compact_mode=prefs_db.compact_mode,
            sidebar_collapsed=prefs_db.sidebar_collapsed,
            custom_settings=prefs_db.custom_settings or {}
        )
    
    def update_user_preferences(self, user_id: str, preferences: UserPreferences):
        """Update user preferences"""
        prefs_db = self.db_session.query(UserPreferencesDB).filter(
            UserPreferencesDB.user_id == user_id
        ).first()
        
        if not prefs_db:
            prefs_db = UserPreferencesDB(user_id=user_id)
            self.db_session.add(prefs_db)
        
        prefs_db.theme = preferences.theme
        prefs_db.language = preferences.language
        prefs_db.timezone = preferences.timezone
        prefs_db.notifications = preferences.notifications
        prefs_db.animations = preferences.animations
        prefs_db.compact_mode = preferences.compact_mode
        prefs_db.sidebar_collapsed = preferences.sidebar_collapsed
        prefs_db.custom_settings = preferences.custom_settings
        
        self.db_session.commit()

# Example usage
if __name__ == "__main__":
    # Configuration
    config = {
        'database_url': 'sqlite:///ui_system.db'
    }
    
    # Create UI system
    ui_system = UISystem(config)
    
    # Create sample components
    builder = ui_system.component_builder
    
    # Create a dashboard page
    header = builder.create_card(
        "header",
        title="AI Framework Dashboard",
        content="Welcome to the AI Framework"
    )
    
    # Create metrics cards
    metrics_card = builder.create_card(
        "metrics",
        title="System Metrics"
    )
    
    # Add chart to metrics card
    sample_data = pd.DataFrame({
        'time': ['00:00', '01:00', '02:00', '03:00', '04:00'],
        'cpu': [20, 35, 45, 30, 25],
        'memory': [60, 65, 70, 68, 62]
    })
    
    cpu_chart = builder.create_chart(
        "cpu_chart",
        "line",
        ui_system.chart_generator.create_line_chart(sample_data, 'time', 'cpu', 'CPU Usage'),
        title="CPU Usage Over Time"
    )
    
    metrics_card.children.append(cpu_chart)
    
    # Create control panel
    control_panel = builder.create_card("controls", title="Controls")
    
    start_button = builder.create_button(
        "start_btn",
        "Start System",
        variant="success",
        onclick="startSystem()"
    )
    
    stop_button = builder.create_button(
        "stop_btn",
        "Stop System",
        variant="danger",
        onclick="stopSystem()"
    )
    
    control_panel.children.extend([start_button, stop_button])
    
    # Create page
    page_id = ui_system.create_page(
        title="AI Framework Dashboard",
        path="/dashboard",
        components=[header, metrics_card, control_panel],
        theme="dark"
    )
    
    # Create FastAPI app
    app = FastAPI(title="UI System API")
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # WebSocket endpoint
    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        client_id = str(uuid.uuid4())
        await ui_system.websocket_manager.connect(websocket, client_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "form_submit":
                    # Process form submission
                    ui_system.log_interaction(
                        user_id="anonymous",  # Would get from session
                        component_id=message.get("form_id"),
                        interaction_type=InteractionType.SUBMIT,
                        data=message.get("data")
                    )
                
        except WebSocketDisconnect:
            ui_system.websocket_manager.disconnect(client_id)
    
    # API endpoints
    @app.get("/api/pages/{page_id}")
    async def get_page_api(page_id: str):
        """Get page data"""
        page = ui_system.get_page(page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        PAGE_VIEWS.labels(page_path=page.path).inc()
        return asdict(page)
    
    @app.get("/pages/{page_path:path}")
    async def render_page_endpoint(request: Request, page_path: str):
        """Render page"""
        # Find page by path
        page_db = ui_system.db_session.query(PageDB).filter(PageDB.path == f"/{page_path}").first()
        if not page_db:
            raise HTTPException(status_code=404, detail="Page not found")
        
        page = ui_system.get_page(page_db.id)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        # Get user preferences (would normally get from session)
        user_prefs = ui_system.get_user_preferences("anonymous")
        
        # Render page
        html = ui_system.render_page(page, user_prefs)
        
        PAGE_VIEWS.labels(page_path=page.path).inc()
        return HTMLResponse(content=html)
    
    @app.get("/api/themes")
    async def get_themes():
        """Get available themes"""
        themes = ui_system.db_session.query(ThemeDB).filter(ThemeDB.is_active == True).all()
        return [
            {
                "id": theme.id,
                "name": theme.name,
                "type": theme.type.value
            }
            for theme in themes
        ]
    
    @app.get("/api/metrics")
    async def get_metrics():
        """Get UI metrics"""
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)
    
    # Run the application
    uvicorn.run(app, host="0.0.0.0", port=8000)