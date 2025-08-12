#!/usr/bin/env python3
"""
TREA AGENT ZERO - ADVANCED MULTI-AGENT SYSTEM
Enterprise-Grade AI Automation Framework

This module implements a sophisticated multi-agent system with:
- Dynamic agent orchestration and load balancing
- Advanced memory management and context retention
- Real-time monitoring and performance optimization
- Secure API endpoints with authentication
- Scalable architecture for production deployment
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager
import hashlib
import jwt

# Core frameworks
from fastapi import FastAPI, HTTPException, Depends, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
from pydantic import BaseModel, Field
import structlog

# AI frameworks
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain_community.vectorstores import Qdrant
from langchain.tools import BaseTool
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from crewai import Agent, Task, Crew, Process
import autogen

# Vector databases and storage
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import redis
import asyncpg

# Monitoring and observability
from prometheus_client import Counter, Histogram, Gauge, start_http_server, generate_latest
import opentelemetry
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Utilities
import aiofiles
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Metrics
REQUEST_COUNT = Counter('trea_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('trea_request_duration_seconds', 'Request latency')
ACTIVE_AGENTS = Gauge('trea_active_agents', 'Number of active agents')
TASK_QUEUE_SIZE = Gauge('trea_task_queue_size', 'Size of task queue')
MEMORY_USAGE = Gauge('trea_memory_usage_bytes', 'Memory usage in bytes')

# Configuration
class Config:
    """Application configuration"""
    SECRET_KEY = "your-secret-key-change-in-production"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # Database URLs
    QDRANT_URL = "http://localhost:6333"
    REDIS_URL = "redis://localhost:6379/0"
    POSTGRES_URL = "postgresql://trea_user:trea_password@localhost:5432/trea_db"
    
    # AI Model Configuration
    OPENAI_API_KEY = "your-openai-api-key"
    ANTHROPIC_API_KEY = "your-anthropic-api-key"
    
    # Performance settings
    MAX_CONCURRENT_TASKS = 10
    AGENT_POOL_SIZE = 5
    MEMORY_WINDOW_SIZE = 20

# Enums
class AgentType(str, Enum):
    ORCHESTRATOR = "orchestrator"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    EXECUTOR = "executor"
    MONITOR = "monitor"
    SECURITY = "security"

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Data models
@dataclass
class TaskRequest:
    """Task request data structure"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    description: str
    agent_type: AgentType
    priority: Priority = Priority.MEDIUM
    context: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    timeout: int = 300  # 5 minutes default

@dataclass
class TaskResult:
    """Task result data structure"""
    task_id: str
    status: TaskStatus
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float = 0.0
    agent_id: str = ""
    completed_at: Optional[datetime] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)

class AgentMemory:
    """Advanced memory management for agents"""
    
    def __init__(self, agent_id: str, redis_client: redis.Redis, qdrant_client: QdrantClient):
        self.agent_id = agent_id
        self.redis = redis_client
        self.qdrant = qdrant_client
        self.collection_name = f"agent_memory_{agent_id}"
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure vector collection exists"""
        try:
            self.qdrant.get_collection(self.collection_name)
        except:
            self.qdrant.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
            )
    
    async def store_memory(self, content: str, metadata: Dict[str, Any] = None):
        """Store memory with vector embedding"""
        memory_id = str(uuid.uuid4())
        
        # Generate embedding (placeholder - use actual embedding model)
        embedding = await self._generate_embedding(content)
        
        # Store in vector database
        point = PointStruct(
            id=memory_id,
            vector=embedding,
            payload={
                "content": content,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow().isoformat(),
                "agent_id": self.agent_id
            }
        )
        
        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
        
        # Store in Redis for quick access
        await self.redis.setex(
            f"memory:{self.agent_id}:{memory_id}",
            3600,  # 1 hour TTL
            json.dumps({"content": content, "metadata": metadata})
        )
        
        return memory_id
    
    async def retrieve_memories(self, query: str, limit: int = 5) -> List[Dict]:
        """Retrieve relevant memories based on query"""
        query_embedding = await self._generate_embedding(query)
        
        search_result = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit,
            score_threshold=0.7
        )
        
        memories = []
        for hit in search_result:
            memories.append({
                "id": hit.id,
                "content": hit.payload["content"],
                "metadata": hit.payload["metadata"],
                "score": hit.score,
                "timestamp": hit.payload["timestamp"]
            })
        
        return memories
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text (placeholder implementation)"""
        # In production, use actual embedding model like OpenAI's text-embedding-ada-002
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        # Convert hash to pseudo-embedding (1536 dimensions)
        pseudo_embedding = []
        for i in range(1536):
            pseudo_embedding.append(float(int(hash_obj.hexdigest()[i % 32], 16)) / 15.0 - 0.5)
        return pseudo_embedding

class BaseAgent:
    """Base agent class with common functionality"""
    
    def __init__(self, agent_id: str, agent_type: AgentType, config: Dict[str, Any] = None):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.config = config or {}
        self.is_busy = False
        self.current_task = None
        self.created_at = datetime.utcnow()
        self.task_count = 0
        self.success_count = 0
        self.error_count = 0
        
        # Initialize memory
        redis_client = redis.from_url(Config.REDIS_URL)
        qdrant_client = QdrantClient(url=Config.QDRANT_URL)
        self.memory = AgentMemory(agent_id, redis_client, qdrant_client)
        
        logger.info("Agent initialized", agent_id=agent_id, agent_type=agent_type)
    
    async def execute(self, task: TaskRequest) -> TaskResult:
        """Execute a task"""
        start_time = time.time()
        self.is_busy = True
        self.current_task = task
        self.task_count += 1
        
        ACTIVE_AGENTS.inc()
        
        try:
            logger.info("Task execution started", 
                       task_id=task.id, 
                       agent_id=self.agent_id,
                       task_type=task.type)
            
            # Store task context in memory
            await self.memory.store_memory(
                f"Task: {task.description}",
                {"task_id": task.id, "task_type": task.type}
            )
            
            # Execute task-specific logic
            result = await self._execute_task(task)
            
            execution_time = time.time() - start_time
            self.success_count += 1
            
            task_result = TaskResult(
                task_id=task.id,
                status=TaskStatus.COMPLETED,
                result=result,
                execution_time=execution_time,
                agent_id=self.agent_id,
                completed_at=datetime.utcnow(),
                metrics={
                    "execution_time": execution_time,
                    "memory_used": len(str(result)) if result else 0
                }
            )
            
            logger.info("Task execution completed",
                       task_id=task.id,
                       agent_id=self.agent_id,
                       execution_time=execution_time)
            
            return task_result
            
        except Exception as e:
            execution_time = time.time() - start_time
            self.error_count += 1
            
            logger.error("Task execution failed",
                        task_id=task.id,
                        agent_id=self.agent_id,
                        error=str(e))
            
            return TaskResult(
                task_id=task.id,
                status=TaskStatus.FAILED,
                error=str(e),
                execution_time=execution_time,
                agent_id=self.agent_id,
                completed_at=datetime.utcnow()
            )
        
        finally:
            self.is_busy = False
            self.current_task = None
            ACTIVE_AGENTS.dec()
    
    async def _execute_task(self, task: TaskRequest) -> Any:
        """Override this method in specific agent implementations"""
        raise NotImplementedError("Subclasses must implement _execute_task")
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "is_busy": self.is_busy,
            "current_task": self.current_task.id if self.current_task else None,
            "task_count": self.task_count,
            "success_count": self.success_count,
            "error_count": self.error_count,
            "success_rate": self.success_count / max(self.task_count, 1),
            "uptime": (datetime.utcnow() - self.created_at).total_seconds()
        }

class ResearchAgent(BaseAgent):
    """Specialized research agent"""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, AgentType.RESEARCHER)
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,
            openai_api_key=Config.OPENAI_API_KEY
        )
    
    async def _execute_task(self, task: TaskRequest) -> Any:
        """Execute research task"""
        # Retrieve relevant memories
        memories = await self.memory.retrieve_memories(task.description)
        context = "\n".join([mem["content"] for mem in memories])
        
        # Construct research prompt
        prompt = f"""
        Research Task: {task.description}
        
        Previous Context:
        {context}
        
        Please provide a comprehensive research analysis including:
        1. Key findings
        2. Data sources
        3. Recommendations
        4. Next steps
        """
        
        # Execute research using LLM
        response = await self.llm.agenerate([[HumanMessage(content=prompt)]])
        result = response.generations[0][0].text
        
        # Store result in memory
        await self.memory.store_memory(
            f"Research Result: {result}",
            {"task_id": task.id, "type": "research_result"}
        )
        
        return {
            "analysis": result,
            "sources": ["LLM Analysis", "Memory Context"],
            "confidence": 0.85,
            "recommendations": ["Further validation needed", "Consider additional sources"]
        }

class AnalystAgent(BaseAgent):
    """Specialized analysis agent"""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, AgentType.ANALYST)
    
    async def _execute_task(self, task: TaskRequest) -> Any:
        """Execute analysis task"""
        data = task.context.get("data", [])
        
        if not data:
            return {"error": "No data provided for analysis"}
        
        # Perform statistical analysis
        analysis_result = {
            "data_points": len(data),
            "summary_stats": self._calculate_stats(data),
            "patterns": self._identify_patterns(data),
            "anomalies": self._detect_anomalies(data),
            "insights": self._generate_insights(data)
        }
        
        # Store analysis in memory
        await self.memory.store_memory(
            f"Analysis Result: {json.dumps(analysis_result)}",
            {"task_id": task.id, "type": "analysis_result"}
        )
        
        return analysis_result
    
    def _calculate_stats(self, data: List[float]) -> Dict[str, float]:
        """Calculate basic statistics"""
        if not data:
            return {}
        
        return {
            "mean": sum(data) / len(data),
            "min": min(data),
            "max": max(data),
            "count": len(data)
        }
    
    def _identify_patterns(self, data: List[float]) -> List[str]:
        """Identify patterns in data"""
        patterns = []
        
        if len(data) > 1:
            # Simple trend analysis
            if data[-1] > data[0]:
                patterns.append("Upward trend")
            elif data[-1] < data[0]:
                patterns.append("Downward trend")
            else:
                patterns.append("Stable trend")
        
        return patterns
    
    def _detect_anomalies(self, data: List[float]) -> List[Dict]:
        """Detect anomalies in data"""
        if len(data) < 3:
            return []
        
        mean_val = sum(data) / len(data)
        std_dev = (sum((x - mean_val) ** 2 for x in data) / len(data)) ** 0.5
        threshold = 2 * std_dev
        
        anomalies = []
        for i, value in enumerate(data):
            if abs(value - mean_val) > threshold:
                anomalies.append({
                    "index": i,
                    "value": value,
                    "deviation": abs(value - mean_val)
                })
        
        return anomalies
    
    def _generate_insights(self, data: List[float]) -> List[str]:
        """Generate insights from data"""
        insights = []
        
        if len(data) > 0:
            insights.append(f"Dataset contains {len(data)} data points")
            
            if len(data) > 1:
                variance = sum((x - sum(data)/len(data))**2 for x in data) / len(data)
                if variance > 100:
                    insights.append("High variance detected - data is highly dispersed")
                elif variance < 1:
                    insights.append("Low variance detected - data is tightly clustered")
        
        return insights

class ExecutorAgent(BaseAgent):
    """Specialized execution agent"""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id, AgentType.EXECUTOR)
    
    async def _execute_task(self, task: TaskRequest) -> Any:
        """Execute action task"""
        action_type = task.context.get("action_type", "unknown")
        parameters = task.context.get("parameters", {})
        
        logger.info("Executing action", 
                   action_type=action_type, 
                   parameters=parameters)
        
        # Simulate different types of actions
        if action_type == "api_call":
            return await self._execute_api_call(parameters)
        elif action_type == "file_operation":
            return await self._execute_file_operation(parameters)
        elif action_type == "data_processing":
            return await self._execute_data_processing(parameters)
        else:
            return {"error": f"Unknown action type: {action_type}"}
    
    async def _execute_api_call(self, params: Dict) -> Dict:
        """Execute API call"""
        url = params.get("url")
        method = params.get("method", "GET")
        headers = params.get("headers", {})
        data = params.get("data")
        
        if not url:
            return {"error": "URL is required for API call"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                return {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "content": response.text[:1000],  # Limit content size
                    "success": response.status_code < 400
                }
        except Exception as e:
            return {"error": f"API call failed: {str(e)}"}
    
    async def _execute_file_operation(self, params: Dict) -> Dict:
        """Execute file operation"""
        operation = params.get("operation")
        file_path = params.get("file_path")
        content = params.get("content")
        
        if not file_path:
            return {"error": "File path is required"}
        
        try:
            if operation == "read":
                async with aiofiles.open(file_path, 'r') as f:
                    file_content = await f.read()
                return {"content": file_content[:1000], "size": len(file_content)}
            
            elif operation == "write":
                if content is None:
                    return {"error": "Content is required for write operation"}
                
                async with aiofiles.open(file_path, 'w') as f:
                    await f.write(content)
                return {"success": True, "bytes_written": len(content)}
            
            else:
                return {"error": f"Unknown file operation: {operation}"}
                
        except Exception as e:
            return {"error": f"File operation failed: {str(e)}"}
    
    async def _execute_data_processing(self, params: Dict) -> Dict:
        """Execute data processing task"""
        data = params.get("data", [])
        operation = params.get("operation", "sum")
        
        if not data:
            return {"error": "No data provided for processing"}
        
        try:
            if operation == "sum":
                result = sum(data)
            elif operation == "average":
                result = sum(data) / len(data)
            elif operation == "max":
                result = max(data)
            elif operation == "min":
                result = min(data)
            elif operation == "sort":
                result = sorted(data)
            else:
                return {"error": f"Unknown operation: {operation}"}
            
            return {"result": result, "operation": operation, "input_size": len(data)}
            
        except Exception as e:
            return {"error": f"Data processing failed: {str(e)}"}

class AgentPool:
    """Manages a pool of agents with load balancing"""
    
    def __init__(self, pool_size: int = 5):
        self.pool_size = pool_size
        self.agents: Dict[str, BaseAgent] = {}
        self.task_queue = asyncio.Queue()
        self.running = False
        
        # Initialize agent pool
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize agent pool with different agent types"""
        agent_types = [
            (ResearchAgent, 2),
            (AnalystAgent, 2),
            (ExecutorAgent, 1)
        ]
        
        for agent_class, count in agent_types:
            for i in range(count):
                agent_id = f"{agent_class.__name__.lower()}_{i}"
                agent = agent_class(agent_id)
                self.agents[agent_id] = agent
                
        logger.info("Agent pool initialized", 
                   total_agents=len(self.agents),
                   agent_types={type(agent).__name__: 1 for agent in self.agents.values()})
    
    async def submit_task(self, task: TaskRequest) -> str:
        """Submit task to the pool"""
        await self.task_queue.put(task)
        TASK_QUEUE_SIZE.set(self.task_queue.qsize())
        
        logger.info("Task submitted to pool", 
                   task_id=task.id, 
                   queue_size=self.task_queue.qsize())
        
        return task.id
    
    async def get_suitable_agent(self, agent_type: AgentType) -> Optional[BaseAgent]:
        """Get a suitable agent for the task"""
        suitable_agents = [
            agent for agent in self.agents.values()
            if agent.agent_type == agent_type and not agent.is_busy
        ]
        
        if not suitable_agents:
            # If no specific agent available, try any available agent
            suitable_agents = [
                agent for agent in self.agents.values()
                if not agent.is_busy
            ]
        
        if suitable_agents:
            # Return agent with best success rate
            return max(suitable_agents, key=lambda a: a.success_count / max(a.task_count, 1))
        
        return None
    
    async def start_processing(self):
        """Start processing tasks from the queue"""
        self.running = True
        logger.info("Agent pool started processing")
        
        while self.running:
            try:
                # Get task from queue with timeout
                task = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)
                TASK_QUEUE_SIZE.set(self.task_queue.qsize())
                
                # Get suitable agent
                agent = await self.get_suitable_agent(task.agent_type)
                
                if agent:
                    # Execute task in background
                    asyncio.create_task(self._execute_task_with_agent(agent, task))
                else:
                    # No agent available, put task back in queue
                    await self.task_queue.put(task)
                    await asyncio.sleep(0.1)  # Brief delay before retry
                    
            except asyncio.TimeoutError:
                # No tasks in queue, continue
                continue
            except Exception as e:
                logger.error("Error in task processing", error=str(e))
    
    async def _execute_task_with_agent(self, agent: BaseAgent, task: TaskRequest):
        """Execute task with specific agent"""
        try:
            result = await agent.execute(task)
            
            # Store result (in production, use proper storage)
            logger.info("Task completed", 
                       task_id=task.id, 
                       agent_id=agent.agent_id,
                       status=result.status)
            
        except Exception as e:
            logger.error("Task execution error", 
                        task_id=task.id, 
                        agent_id=agent.agent_id,
                        error=str(e))
    
    def stop_processing(self):
        """Stop processing tasks"""
        self.running = False
        logger.info("Agent pool stopped processing")
    
    def get_pool_status(self) -> Dict[str, Any]:
        """Get pool status"""
        agent_statuses = {agent_id: agent.get_status() for agent_id, agent in self.agents.items()}
        
        return {
            "total_agents": len(self.agents),
            "busy_agents": sum(1 for agent in self.agents.values() if agent.is_busy),
            "queue_size": self.task_queue.qsize(),
            "agents": agent_statuses
        }

# Authentication
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# FastAPI application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting TREA Agent Zero system")
    
    # Start Prometheus metrics server
    start_http_server(8001)
    
    # Initialize agent pool
    app.state.agent_pool = AgentPool(Config.AGENT_POOL_SIZE)
    
    # Start task processing
    processing_task = asyncio.create_task(app.state.agent_pool.start_processing())
    
    yield
    
    # Shutdown
    logger.info("Shutting down TREA Agent Zero system")
    app.state.agent_pool.stop_processing()
    processing_task.cancel()

app = FastAPI(
    title="TREA Agent Zero",
    description="Advanced Multi-Agent AI Automation System",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request/Response models
class TaskRequestModel(BaseModel):
    type: str = Field(..., description="Type of task to execute")
    description: str = Field(..., description="Task description")
    agent_type: AgentType = Field(..., description="Preferred agent type")
    priority: Priority = Field(Priority.MEDIUM, description="Task priority")
    context: Dict[str, Any] = Field(default_factory=dict, description="Task context")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Task metadata")
    timeout: int = Field(300, description="Task timeout in seconds")

class TaskResponseModel(BaseModel):
    task_id: str
    status: str
    message: str

class LoginRequest(BaseModel):
    username: str
    password: str

# API Routes
@app.post("/auth/login")
async def login(request: LoginRequest):
    """Authenticate user and return JWT token"""
    # In production, validate against real user database
    if request.username == "admin" and request.password == "admin123":
        access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": request.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/tasks/submit", response_model=TaskResponseModel)
async def submit_task(
    task_request: TaskRequestModel,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user)
):
    """Submit a new task to the agent pool"""
    with REQUEST_LATENCY.time():
        REQUEST_COUNT.labels(method="POST", endpoint="/tasks/submit", status="success").inc()
        
        # Create task
        task = TaskRequest(
            type=task_request.type,
            description=task_request.description,
            agent_type=task_request.agent_type,
            priority=task_request.priority,
            context=task_request.context,
            metadata=task_request.metadata,
            timeout=task_request.timeout
        )
        
        # Submit to agent pool
        task_id = await app.state.agent_pool.submit_task(task)
        
        logger.info("Task submitted via API", 
                   task_id=task_id, 
                   user=current_user,
                   task_type=task.type)
        
        return TaskResponseModel(
            task_id=task_id,
            status="submitted",
            message="Task submitted successfully"
        )

@app.get("/agents/status")
async def get_agents_status(current_user: str = Depends(get_current_user)):
    """Get status of all agents in the pool"""
    status = app.state.agent_pool.get_pool_status()
    return status

@app.get("/system/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "agents": len(app.state.agent_pool.agents),
        "queue_size": app.state.agent_pool.task_queue.qsize()
    }

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.get("/system/stats")
async def get_system_stats(current_user: str = Depends(get_current_user)):
    """Get detailed system statistics"""
    pool_status = app.state.agent_pool.get_pool_status()
    
    return {
        "system": {
            "uptime": time.time(),
            "total_agents": pool_status["total_agents"],
            "busy_agents": pool_status["busy_agents"],
            "queue_size": pool_status["queue_size"]
        },
        "agents": pool_status["agents"],
        "metrics": {
            "total_requests": REQUEST_COUNT._value._value,
            "active_agents": ACTIVE_AGENTS._value._value,
            "queue_size": TASK_QUEUE_SIZE._value._value
        }
    }

# Example usage and testing
async def example_usage():
    """Example of how to use the system"""
    # Create agent pool
    pool = AgentPool(3)
    
    # Start processing
    processing_task = asyncio.create_task(pool.start_processing())
    
    # Submit various tasks
    tasks = [
        TaskRequest(
            type="research",
            description="Research the latest trends in AI automation",
            agent_type=AgentType.RESEARCHER
        ),
        TaskRequest(
            type="analysis",
            description="Analyze sales data trends",
            agent_type=AgentType.ANALYST,
            context={"data": [100, 120, 110, 130, 125, 140, 135]}
        ),
        TaskRequest(
            type="execution",
            description="Process customer data",
            agent_type=AgentType.EXECUTOR,
            context={
                "action_type": "data_processing",
                "parameters": {
                    "data": [1, 2, 3, 4, 5],
                    "operation": "average"
                }
            }
        )
    ]
    
    # Submit tasks
    for task in tasks:
        await pool.submit_task(task)
    
    # Wait for processing
    await asyncio.sleep(10)
    
    # Get status
    status = pool.get_pool_status()
    print(f"Pool Status: {json.dumps(status, indent=2)}")
    
    # Stop processing
    pool.stop_processing()
    processing_task.cancel()

if __name__ == "__main__":
    # Run the FastAPI application
    uvicorn.run(
        "trea_agent_system:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )