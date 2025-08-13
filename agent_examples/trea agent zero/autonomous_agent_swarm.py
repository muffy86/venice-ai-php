#!/usr/bin/env python3
"""
AUTONOMOUS AGENT SWARM SYSTEM
Distributed AI Task Execution and Coordination

This module provides:
- Multi-agent coordination and communication
- Distributed task allocation and execution
- Swarm intelligence algorithms
- Consensus mechanisms
- Load balancing and fault tolerance
- Emergent behavior modeling
- Real-time swarm monitoring
- Adaptive swarm topology
"""

import asyncio
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Union, Tuple, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
import logging
import time
import json
from datetime import datetime, timedelta
import uuid
import pickle
import threading
import queue
import random
import math
from collections import deque, defaultdict
from abc import ABC, abstractmethod

# Networking and communication
import websockets
import aiohttp
import zmq
import zmq.asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn

# Distributed computing
try:
    import ray
    RAY_AVAILABLE = True
except ImportError:
    RAY_AVAILABLE = False

try:
    import dask
    from dask.distributed import Client, as_completed
    DASK_AVAILABLE = True
except ImportError:
    DASK_AVAILABLE = False

# AI and ML
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel

# Graph algorithms
import networkx as nx
from scipy.spatial.distance import pdist, squareform
from scipy.optimize import minimize

# Monitoring
from prometheus_client import Counter, Histogram, Gauge
import structlog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Metrics
AGENT_TASKS_COMPLETED = Counter('swarm_agent_tasks_completed_total', 'Total tasks completed by agents', ['agent_id'])
SWARM_COMMUNICATION_MESSAGES = Counter('swarm_communication_messages_total', 'Total communication messages', ['message_type'])
TASK_EXECUTION_TIME = Histogram('swarm_task_execution_time_seconds', 'Task execution time')
ACTIVE_AGENTS = Gauge('swarm_active_agents_count', 'Number of active agents')
SWARM_EFFICIENCY = Gauge('swarm_efficiency_ratio', 'Swarm efficiency ratio')
CONSENSUS_TIME = Histogram('swarm_consensus_time_seconds', 'Time to reach consensus')

class AgentRole(str, Enum):
    COORDINATOR = "coordinator"
    WORKER = "worker"
    SPECIALIST = "specialist"
    MONITOR = "monitor"
    SCOUT = "scout"
    LEADER = "leader"
    FOLLOWER = "follower"

class TaskType(str, Enum):
    COMPUTATION = "computation"
    DATA_PROCESSING = "data_processing"
    OPTIMIZATION = "optimization"
    SEARCH = "search"
    CLASSIFICATION = "classification"
    COORDINATION = "coordination"
    MONITORING = "monitoring"

class MessageType(str, Enum):
    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    HEARTBEAT = "heartbeat"
    COORDINATION = "coordination"
    CONSENSUS = "consensus"
    STATUS_UPDATE = "status_update"
    RESOURCE_ALLOCATION = "resource_allocation"
    EMERGENCY = "emergency"

class SwarmTopology(str, Enum):
    FULLY_CONNECTED = "fully_connected"
    RING = "ring"
    STAR = "star"
    HIERARCHICAL = "hierarchical"
    MESH = "mesh"
    SMALL_WORLD = "small_world"
    SCALE_FREE = "scale_free"

@dataclass
class AgentCapabilities:
    """Agent capabilities and resources"""
    cpu_cores: int = 1
    memory_gb: float = 1.0
    gpu_available: bool = False
    specialized_skills: List[str] = field(default_factory=list)
    max_concurrent_tasks: int = 1
    reliability_score: float = 1.0
    processing_speed: float = 1.0
    communication_range: float = 100.0

@dataclass
class Task:
    """Task definition"""
    task_id: str
    task_type: TaskType
    priority: int = 1
    deadline: Optional[datetime] = None
    required_capabilities: List[str] = field(default_factory=list)
    estimated_duration: float = 1.0
    data: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    result: Optional[Any] = None
    status: str = "pending"
    assigned_agent: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class Message:
    """Communication message"""
    message_id: str
    sender_id: str
    receiver_id: Optional[str]  # None for broadcast
    message_type: MessageType
    content: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    ttl: int = 10  # Time to live (hops)

@dataclass
class SwarmMetrics:
    """Swarm performance metrics"""
    total_agents: int
    active_agents: int
    completed_tasks: int
    failed_tasks: int
    average_response_time: float
    throughput: float
    efficiency: float
    consensus_time: float
    communication_overhead: float

class ConsensusAlgorithm(ABC):
    """Abstract base class for consensus algorithms"""
    
    @abstractmethod
    async def reach_consensus(self, agents: List['Agent'], proposal: Dict[str, Any]) -> Dict[str, Any]:
        pass

class RaftConsensus(ConsensusAlgorithm):
    """Raft consensus algorithm implementation"""
    
    def __init__(self):
        self.current_term = 0
        self.voted_for = None
        self.log = []
        self.commit_index = 0
        self.last_applied = 0
    
    async def reach_consensus(self, agents: List['Agent'], proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Simplified Raft consensus"""
        start_time = time.time()
        
        # Leader election (simplified)
        leader = self._elect_leader(agents)
        
        if leader:
            # Append entry to log
            log_entry = {
                'term': self.current_term,
                'proposal': proposal,
                'timestamp': datetime.now()
            }
            
            # Replicate to majority
            votes = await self._replicate_log_entry(agents, log_entry)
            
            if votes > len(agents) // 2:
                consensus_time = time.time() - start_time
                CONSENSUS_TIME.observe(consensus_time)
                
                return {
                    'status': 'accepted',
                    'leader': leader.agent_id,
                    'term': self.current_term,
                    'proposal': proposal,
                    'consensus_time': consensus_time
                }
        
        return {'status': 'rejected', 'reason': 'Failed to reach consensus'}
    
    def _elect_leader(self, agents: List['Agent']) -> Optional['Agent']:
        """Elect leader (simplified)"""
        # In a real implementation, this would involve proper leader election
        active_agents = [agent for agent in agents if agent.is_active]
        return random.choice(active_agents) if active_agents else None
    
    async def _replicate_log_entry(self, agents: List['Agent'], log_entry: Dict[str, Any]) -> int:
        """Replicate log entry to followers"""
        votes = 1  # Leader votes for itself
        
        for agent in agents:
            if agent.is_active and agent.role != AgentRole.LEADER:
                # Simulate replication
                if random.random() > 0.1:  # 90% success rate
                    votes += 1
        
        return votes

class PBFTConsensus(ConsensusAlgorithm):
    """Practical Byzantine Fault Tolerance consensus"""
    
    async def reach_consensus(self, agents: List['Agent'], proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Simplified PBFT consensus"""
        start_time = time.time()
        
        n = len([agent for agent in agents if agent.is_active])
        f = (n - 1) // 3  # Maximum Byzantine faults
        
        if n < 3 * f + 1:
            return {'status': 'rejected', 'reason': 'Insufficient agents for Byzantine fault tolerance'}
        
        # Three-phase protocol: pre-prepare, prepare, commit
        phases = ['pre-prepare', 'prepare', 'commit']
        
        for phase in phases:
            votes = await self._collect_votes(agents, proposal, phase)
            required_votes = 2 * f + 1
            
            if votes < required_votes:
                return {'status': 'rejected', 'reason': f'Insufficient votes in {phase} phase'}
        
        consensus_time = time.time() - start_time
        CONSENSUS_TIME.observe(consensus_time)
        
        return {
            'status': 'accepted',
            'proposal': proposal,
            'consensus_time': consensus_time,
            'algorithm': 'PBFT'
        }
    
    async def _collect_votes(self, agents: List['Agent'], proposal: Dict[str, Any], phase: str) -> int:
        """Collect votes for a phase"""
        votes = 0
        
        for agent in agents:
            if agent.is_active:
                # Simulate voting (in reality, this would involve cryptographic verification)
                if random.random() > 0.05:  # 95% honest agents
                    votes += 1
        
        return votes

class TaskScheduler:
    """Intelligent task scheduling for agent swarm"""
    
    def __init__(self):
        self.pending_tasks = queue.PriorityQueue()
        self.running_tasks = {}
        self.completed_tasks = {}
        self.failed_tasks = {}
    
    def add_task(self, task: Task):
        """Add task to scheduler"""
        priority = -task.priority  # Negative for max-heap behavior
        self.pending_tasks.put((priority, task.created_at, task))
        logger.info(f"Task {task.task_id} added to scheduler")
    
    def get_next_task(self) -> Optional[Task]:
        """Get next task for execution"""
        try:
            _, _, task = self.pending_tasks.get_nowait()
            return task
        except queue.Empty:
            return None
    
    def assign_task(self, task: Task, agent_id: str):
        """Assign task to agent"""
        task.assigned_agent = agent_id
        task.status = "assigned"
        self.running_tasks[task.task_id] = task
        logger.info(f"Task {task.task_id} assigned to agent {agent_id}")
    
    def complete_task(self, task_id: str, result: Any):
        """Mark task as completed"""
        if task_id in self.running_tasks:
            task = self.running_tasks.pop(task_id)
            task.result = result
            task.status = "completed"
            self.completed_tasks[task_id] = task
            logger.info(f"Task {task_id} completed")
    
    def fail_task(self, task_id: str, error: str):
        """Mark task as failed"""
        if task_id in self.running_tasks:
            task = self.running_tasks.pop(task_id)
            task.status = "failed"
            task.result = {"error": error}
            self.failed_tasks[task_id] = task
            logger.error(f"Task {task_id} failed: {error}")
    
    def get_task_statistics(self) -> Dict[str, int]:
        """Get task statistics"""
        return {
            'pending': self.pending_tasks.qsize(),
            'running': len(self.running_tasks),
            'completed': len(self.completed_tasks),
            'failed': len(self.failed_tasks)
        }

class Agent:
    """Autonomous agent in the swarm"""
    
    def __init__(self, agent_id: str, role: AgentRole, capabilities: AgentCapabilities):
        self.agent_id = agent_id
        self.role = role
        self.capabilities = capabilities
        self.is_active = True
        self.current_tasks = {}
        self.message_queue = asyncio.Queue()
        self.neighbors = set()
        self.position = (random.uniform(0, 100), random.uniform(0, 100))  # 2D position
        self.last_heartbeat = datetime.now()
        self.performance_history = deque(maxlen=100)
        
        # Communication
        self.websocket = None
        self.zmq_socket = None
        
        # Learning and adaptation
        self.experience_buffer = deque(maxlen=1000)
        self.success_rate = 1.0
        
    async def start(self):
        """Start agent operations"""
        logger.info(f"Agent {self.agent_id} starting with role {self.role}")
        
        # Start background tasks
        asyncio.create_task(self._heartbeat_loop())
        asyncio.create_task(self._message_processing_loop())
        asyncio.create_task(self._task_execution_loop())
        
        self.is_active = True
    
    async def stop(self):
        """Stop agent operations"""
        logger.info(f"Agent {self.agent_id} stopping")
        self.is_active = False
        
        if self.websocket:
            await self.websocket.close()
    
    async def send_message(self, message: Message):
        """Send message to other agents"""
        SWARM_COMMUNICATION_MESSAGES.labels(message_type=message.message_type.value).inc()
        
        # Add to message queue for processing
        await self.message_queue.put(message)
    
    async def receive_message(self, message: Message):
        """Receive and process message"""
        logger.debug(f"Agent {self.agent_id} received message {message.message_type} from {message.sender_id}")
        
        if message.message_type == MessageType.TASK_REQUEST:
            await self._handle_task_request(message)
        elif message.message_type == MessageType.HEARTBEAT:
            await self._handle_heartbeat(message)
        elif message.message_type == MessageType.COORDINATION:
            await self._handle_coordination(message)
        elif message.message_type == MessageType.CONSENSUS:
            await self._handle_consensus(message)
    
    async def execute_task(self, task: Task) -> Any:
        """Execute a task"""
        logger.info(f"Agent {self.agent_id} executing task {task.task_id}")
        
        start_time = time.time()
        
        try:
            # Check if agent has required capabilities
            if not self._can_execute_task(task):
                raise ValueError(f"Agent lacks required capabilities: {task.required_capabilities}")
            
            # Simulate task execution based on type
            result = await self._execute_task_by_type(task)
            
            execution_time = time.time() - start_time
            
            # Update performance metrics
            self.performance_history.append({
                'task_id': task.task_id,
                'execution_time': execution_time,
                'success': True,
                'timestamp': datetime.now()
            })
            
            # Update success rate
            self._update_success_rate(True)
            
            AGENT_TASKS_COMPLETED.labels(agent_id=self.agent_id).inc()
            TASK_EXECUTION_TIME.observe(execution_time)
            
            logger.info(f"Agent {self.agent_id} completed task {task.task_id} in {execution_time:.2f}s")
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            # Update performance metrics
            self.performance_history.append({
                'task_id': task.task_id,
                'execution_time': execution_time,
                'success': False,
                'error': str(e),
                'timestamp': datetime.now()
            })
            
            # Update success rate
            self._update_success_rate(False)
            
            logger.error(f"Agent {self.agent_id} failed to execute task {task.task_id}: {e}")
            raise
    
    def _can_execute_task(self, task: Task) -> bool:
        """Check if agent can execute task"""
        # Check capabilities
        for required_capability in task.required_capabilities:
            if required_capability not in self.capabilities.specialized_skills:
                return False
        
        # Check current load
        if len(self.current_tasks) >= self.capabilities.max_concurrent_tasks:
            return False
        
        return True
    
    async def _execute_task_by_type(self, task: Task) -> Any:
        """Execute task based on its type"""
        if task.task_type == TaskType.COMPUTATION:
            return await self._execute_computation_task(task)
        elif task.task_type == TaskType.DATA_PROCESSING:
            return await self._execute_data_processing_task(task)
        elif task.task_type == TaskType.OPTIMIZATION:
            return await self._execute_optimization_task(task)
        elif task.task_type == TaskType.SEARCH:
            return await self._execute_search_task(task)
        elif task.task_type == TaskType.CLASSIFICATION:
            return await self._execute_classification_task(task)
        else:
            # Generic task execution
            await asyncio.sleep(task.estimated_duration)
            return {"status": "completed", "agent_id": self.agent_id}
    
    async def _execute_computation_task(self, task: Task) -> Any:
        """Execute computation task"""
        # Simulate computational work
        data = task.data.get('input', [])
        
        if isinstance(data, list) and all(isinstance(x, (int, float)) for x in data):
            # Mathematical computation
            result = {
                'sum': sum(data),
                'mean': np.mean(data) if data else 0,
                'std': np.std(data) if len(data) > 1 else 0,
                'min': min(data) if data else 0,
                'max': max(data) if data else 0
            }
        else:
            # Generic computation
            await asyncio.sleep(task.estimated_duration)
            result = {"computed_value": random.random()}
        
        return result
    
    async def _execute_data_processing_task(self, task: Task) -> Any:
        """Execute data processing task"""
        data = task.data.get('dataset', [])
        
        # Simulate data processing
        await asyncio.sleep(min(task.estimated_duration, len(data) * 0.001))
        
        processed_data = []
        for item in data[:1000]:  # Limit processing
            if isinstance(item, dict):
                # Process dictionary data
                processed_item = {k: v for k, v in item.items() if v is not None}
                processed_data.append(processed_item)
            else:
                processed_data.append(item)
        
        return {
            'processed_count': len(processed_data),
            'original_count': len(data),
            'sample_data': processed_data[:5]
        }
    
    async def _execute_optimization_task(self, task: Task) -> Any:
        """Execute optimization task"""
        # Simulate optimization problem
        objective_function = task.data.get('objective_function', 'minimize_quadratic')
        dimensions = task.data.get('dimensions', 2)
        
        # Simple optimization using random search
        best_solution = None
        best_value = float('inf')
        
        for _ in range(100):  # Limited iterations
            solution = np.random.uniform(-10, 10, dimensions)
            
            if objective_function == 'minimize_quadratic':
                value = np.sum(solution ** 2)
            else:
                value = np.sum(np.abs(solution))
            
            if value < best_value:
                best_value = value
                best_solution = solution.tolist()
        
        return {
            'best_solution': best_solution,
            'best_value': best_value,
            'iterations': 100
        }
    
    async def _execute_search_task(self, task: Task) -> Any:
        """Execute search task"""
        search_space = task.data.get('search_space', list(range(1000)))
        target = task.data.get('target', 500)
        
        # Simulate search
        await asyncio.sleep(min(task.estimated_duration, 0.1))
        
        # Binary search simulation
        left, right = 0, len(search_space) - 1
        steps = 0
        
        while left <= right:
            mid = (left + right) // 2
            steps += 1
            
            if search_space[mid] == target:
                return {
                    'found': True,
                    'position': mid,
                    'steps': steps,
                    'value': search_space[mid]
                }
            elif search_space[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        
        return {
            'found': False,
            'steps': steps,
            'closest_position': left if left < len(search_space) else right
        }
    
    async def _execute_classification_task(self, task: Task) -> Any:
        """Execute classification task"""
        data = task.data.get('features', [])
        
        if not data:
            return {'error': 'No features provided'}
        
        # Simulate classification
        await asyncio.sleep(min(task.estimated_duration, 0.05))
        
        # Simple classification based on feature values
        if isinstance(data[0], (list, np.ndarray)):
            # Multiple samples
            predictions = []
            for sample in data:
                # Simple rule-based classification
                prediction = 1 if np.mean(sample) > 0 else 0
                confidence = min(abs(np.mean(sample)) + 0.5, 1.0)
                predictions.append({
                    'class': prediction,
                    'confidence': confidence
                })
            
            return {
                'predictions': predictions,
                'model_type': 'rule_based',
                'accuracy_estimate': 0.85
            }
        else:
            # Single sample
            prediction = 1 if np.mean(data) > 0 else 0
            confidence = min(abs(np.mean(data)) + 0.5, 1.0)
            
            return {
                'class': prediction,
                'confidence': confidence,
                'model_type': 'rule_based'
            }
    
    async def _handle_task_request(self, message: Message):
        """Handle task request message"""
        task_data = message.content.get('task')
        
        if task_data and self._can_execute_task_from_data(task_data):
            # Accept task
            response = Message(
                message_id=str(uuid.uuid4()),
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                message_type=MessageType.TASK_RESPONSE,
                content={
                    'status': 'accepted',
                    'agent_capabilities': self.capabilities.__dict__,
                    'estimated_completion': datetime.now() + timedelta(seconds=task_data.get('estimated_duration', 1))
                }
            )
        else:
            # Reject task
            response = Message(
                message_id=str(uuid.uuid4()),
                sender_id=self.agent_id,
                receiver_id=message.sender_id,
                message_type=MessageType.TASK_RESPONSE,
                content={'status': 'rejected', 'reason': 'Insufficient capabilities or overloaded'}
            )
        
        await self.send_message(response)
    
    def _can_execute_task_from_data(self, task_data: Dict[str, Any]) -> bool:
        """Check if agent can execute task from data"""
        required_capabilities = task_data.get('required_capabilities', [])
        
        for capability in required_capabilities:
            if capability not in self.capabilities.specialized_skills:
                return False
        
        return len(self.current_tasks) < self.capabilities.max_concurrent_tasks
    
    async def _handle_heartbeat(self, message: Message):
        """Handle heartbeat message"""
        sender_id = message.sender_id
        
        # Update neighbor information
        if sender_id not in self.neighbors:
            self.neighbors.add(sender_id)
        
        # Send heartbeat response
        response = Message(
            message_id=str(uuid.uuid4()),
            sender_id=self.agent_id,
            receiver_id=sender_id,
            message_type=MessageType.HEARTBEAT,
            content={
                'status': 'alive',
                'load': len(self.current_tasks),
                'capabilities': self.capabilities.__dict__
            }
        )
        
        await self.send_message(response)
    
    async def _handle_coordination(self, message: Message):
        """Handle coordination message"""
        coordination_type = message.content.get('type')
        
        if coordination_type == 'resource_request':
            await self._handle_resource_request(message)
        elif coordination_type == 'load_balancing':
            await self._handle_load_balancing(message)
        elif coordination_type == 'topology_update':
            await self._handle_topology_update(message)
    
    async def _handle_resource_request(self, message: Message):
        """Handle resource request"""
        requested_resources = message.content.get('resources', {})
        
        # Check if agent can provide resources
        can_provide = True
        available_resources = {
            'cpu': max(0, self.capabilities.cpu_cores - len(self.current_tasks)),
            'memory': max(0, self.capabilities.memory_gb - len(self.current_tasks) * 0.1),
            'gpu': self.capabilities.gpu_available and len(self.current_tasks) == 0
        }
        
        for resource, amount in requested_resources.items():
            if available_resources.get(resource, 0) < amount:
                can_provide = False
                break
        
        response = Message(
            message_id=str(uuid.uuid4()),
            sender_id=self.agent_id,
            receiver_id=message.sender_id,
            message_type=MessageType.COORDINATION,
            content={
                'type': 'resource_response',
                'can_provide': can_provide,
                'available_resources': available_resources
            }
        )
        
        await self.send_message(response)
    
    async def _handle_load_balancing(self, message: Message):
        """Handle load balancing request"""
        if len(self.current_tasks) > self.capabilities.max_concurrent_tasks // 2:
            # Agent is overloaded, request task redistribution
            response = Message(
                message_id=str(uuid.uuid4()),
                sender_id=self.agent_id,
                receiver_id=None,  # Broadcast
                message_type=MessageType.COORDINATION,
                content={
                    'type': 'redistribute_tasks',
                    'current_load': len(self.current_tasks),
                    'max_capacity': self.capabilities.max_concurrent_tasks
                }
            )
            
            await self.send_message(response)
    
    async def _handle_topology_update(self, message: Message):
        """Handle topology update"""
        new_neighbors = set(message.content.get('neighbors', []))
        self.neighbors = new_neighbors
        
        logger.info(f"Agent {self.agent_id} updated topology: {len(self.neighbors)} neighbors")
    
    async def _handle_consensus(self, message: Message):
        """Handle consensus message"""
        proposal = message.content.get('proposal')
        consensus_id = message.content.get('consensus_id')
        
        # Simple voting mechanism
        vote = self._evaluate_proposal(proposal)
        
        response = Message(
            message_id=str(uuid.uuid4()),
            sender_id=self.agent_id,
            receiver_id=message.sender_id,
            message_type=MessageType.CONSENSUS,
            content={
                'consensus_id': consensus_id,
                'vote': vote,
                'agent_id': self.agent_id
            }
        )
        
        await self.send_message(response)
    
    def _evaluate_proposal(self, proposal: Dict[str, Any]) -> bool:
        """Evaluate a consensus proposal"""
        # Simple evaluation based on agent's current state and capabilities
        proposal_type = proposal.get('type')
        
        if proposal_type == 'task_allocation':
            # Vote based on current load
            return len(self.current_tasks) < self.capabilities.max_concurrent_tasks
        elif proposal_type == 'topology_change':
            # Generally accept topology changes
            return True
        elif proposal_type == 'resource_allocation':
            # Vote based on resource availability
            return len(self.current_tasks) < self.capabilities.max_concurrent_tasks // 2
        
        # Default: accept proposal
        return True
    
    def _update_success_rate(self, success: bool):
        """Update agent's success rate"""
        alpha = 0.1  # Learning rate
        self.success_rate = alpha * (1.0 if success else 0.0) + (1 - alpha) * self.success_rate
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeats"""
        while self.is_active:
            try:
                self.last_heartbeat = datetime.now()
                
                # Broadcast heartbeat to neighbors
                heartbeat_message = Message(
                    message_id=str(uuid.uuid4()),
                    sender_id=self.agent_id,
                    receiver_id=None,  # Broadcast
                    message_type=MessageType.HEARTBEAT,
                    content={
                        'timestamp': self.last_heartbeat.isoformat(),
                        'status': 'active',
                        'load': len(self.current_tasks),
                        'position': self.position
                    }
                )
                
                await self.send_message(heartbeat_message)
                await asyncio.sleep(5)  # Heartbeat every 5 seconds
                
            except Exception as e:
                logger.error(f"Heartbeat error for agent {self.agent_id}: {e}")
                await asyncio.sleep(1)
    
    async def _message_processing_loop(self):
        """Process incoming messages"""
        while self.is_active:
            try:
                message = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)
                await self.receive_message(message)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Message processing error for agent {self.agent_id}: {e}")
    
    async def _task_execution_loop(self):
        """Execute assigned tasks"""
        while self.is_active:
            try:
                # Check for new tasks to execute
                if len(self.current_tasks) < self.capabilities.max_concurrent_tasks:
                    # In a real implementation, this would get tasks from the swarm coordinator
                    pass
                
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Task execution error for agent {self.agent_id}: {e}")

class SwarmCoordinator:
    """Central coordinator for the agent swarm"""
    
    def __init__(self, consensus_algorithm: ConsensusAlgorithm = None):
        self.agents = {}
        self.task_scheduler = TaskScheduler()
        self.consensus_algorithm = consensus_algorithm or RaftConsensus()
        self.topology = SwarmTopology.FULLY_CONNECTED
        self.network_graph = nx.Graph()
        
        # Communication infrastructure
        self.message_broker = MessageBroker()
        
        # Performance monitoring
        self.metrics_collector = MetricsCollector()
        
        # Swarm intelligence algorithms
        self.swarm_optimizer = SwarmOptimizer()
    
    async def add_agent(self, agent: Agent):
        """Add agent to swarm"""
        self.agents[agent.agent_id] = agent
        self.network_graph.add_node(agent.agent_id, agent=agent)
        
        # Update topology
        await self._update_topology()
        
        # Start agent
        await agent.start()
        
        ACTIVE_AGENTS.set(len([a for a in self.agents.values() if a.is_active]))
        
        logger.info(f"Agent {agent.agent_id} added to swarm")
    
    async def remove_agent(self, agent_id: str):
        """Remove agent from swarm"""
        if agent_id in self.agents:
            agent = self.agents[agent_id]
            await agent.stop()
            
            del self.agents[agent_id]
            self.network_graph.remove_node(agent_id)
            
            # Update topology
            await self._update_topology()
            
            ACTIVE_AGENTS.set(len([a for a in self.agents.values() if a.is_active]))
            
            logger.info(f"Agent {agent_id} removed from swarm")
    
    async def submit_task(self, task: Task):
        """Submit task to swarm"""
        logger.info(f"Submitting task {task.task_id} to swarm")
        
        # Add to scheduler
        self.task_scheduler.add_task(task)
        
        # Find suitable agents
        suitable_agents = self._find_suitable_agents(task)
        
        if not suitable_agents:
            logger.warning(f"No suitable agents found for task {task.task_id}")
            self.task_scheduler.fail_task(task.task_id, "No suitable agents available")
            return
        
        # Select best agent using auction mechanism
        selected_agent = await self._auction_task(task, suitable_agents)
        
        if selected_agent:
            # Assign task
            self.task_scheduler.assign_task(task, selected_agent.agent_id)
            
            # Execute task
            try:
                result = await selected_agent.execute_task(task)
                self.task_scheduler.complete_task(task.task_id, result)
                logger.info(f"Task {task.task_id} completed by agent {selected_agent.agent_id}")
            except Exception as e:
                self.task_scheduler.fail_task(task.task_id, str(e))
                logger.error(f"Task {task.task_id} failed: {e}")
        else:
            self.task_scheduler.fail_task(task.task_id, "No agent accepted the task")
    
    def _find_suitable_agents(self, task: Task) -> List[Agent]:
        """Find agents suitable for executing a task"""
        suitable_agents = []
        
        for agent in self.agents.values():
            if agent.is_active and agent._can_execute_task(task):
                suitable_agents.append(agent)
        
        return suitable_agents
    
    async def _auction_task(self, task: Task, suitable_agents: List[Agent]) -> Optional[Agent]:
        """Auction task to agents and select the best bid"""
        bids = []
        
        for agent in suitable_agents:
            # Calculate bid based on agent's current load and capabilities
            load_factor = len(agent.current_tasks) / agent.capabilities.max_concurrent_tasks
            capability_score = len(set(task.required_capabilities) & set(agent.capabilities.specialized_skills))
            reliability_score = agent.capabilities.reliability_score
            
            # Bid is inversely related to load and directly related to capability and reliability
            bid_score = (capability_score + reliability_score) / (1 + load_factor)
            
            bids.append((bid_score, agent))
        
        if bids:
            # Select agent with highest bid
            bids.sort(key=lambda x: x[0], reverse=True)
            return bids[0][1]
        
        return None
    
    async def _update_topology(self):
        """Update swarm topology"""
        agents = list(self.agents.values())
        
        if self.topology == SwarmTopology.FULLY_CONNECTED:
            # Connect all agents to all other agents
            for i, agent1 in enumerate(agents):
                for j, agent2 in enumerate(agents):
                    if i != j:
                        agent1.neighbors.add(agent2.agent_id)
                        self.network_graph.add_edge(agent1.agent_id, agent2.agent_id)
        
        elif self.topology == SwarmTopology.RING:
            # Connect agents in a ring
            for i, agent in enumerate(agents):
                agent.neighbors.clear()
                if len(agents) > 1:
                    next_agent = agents[(i + 1) % len(agents)]
                    prev_agent = agents[(i - 1) % len(agents)]
                    
                    agent.neighbors.add(next_agent.agent_id)
                    agent.neighbors.add(prev_agent.agent_id)
                    
                    self.network_graph.add_edge(agent.agent_id, next_agent.agent_id)
                    self.network_graph.add_edge(agent.agent_id, prev_agent.agent_id)
        
        elif self.topology == SwarmTopology.STAR:
            # Connect all agents to a central coordinator
            if agents:
                coordinator = agents[0]  # First agent is coordinator
                coordinator.role = AgentRole.COORDINATOR
                
                for agent in agents[1:]:
                    agent.neighbors.clear()
                    agent.neighbors.add(coordinator.agent_id)
                    coordinator.neighbors.add(agent.agent_id)
                    
                    self.network_graph.add_edge(coordinator.agent_id, agent.agent_id)
        
        elif self.topology == SwarmTopology.SMALL_WORLD:
            # Create small-world network
            if len(agents) >= 4:
                # Start with ring topology
                for i, agent in enumerate(agents):
                    agent.neighbors.clear()
                    next_agent = agents[(i + 1) % len(agents)]
                    prev_agent = agents[(i - 1) % len(agents)]
                    
                    agent.neighbors.add(next_agent.agent_id)
                    agent.neighbors.add(prev_agent.agent_id)
                    
                    self.network_graph.add_edge(agent.agent_id, next_agent.agent_id)
                    self.network_graph.add_edge(agent.agent_id, prev_agent.agent_id)
                
                # Add random shortcuts
                num_shortcuts = len(agents) // 4
                for _ in range(num_shortcuts):
                    agent1, agent2 = random.sample(agents, 2)
                    if agent2.agent_id not in agent1.neighbors:
                        agent1.neighbors.add(agent2.agent_id)
                        agent2.neighbors.add(agent1.agent_id)
                        self.network_graph.add_edge(agent1.agent_id, agent2.agent_id)
        
        # Notify agents of topology update
        for agent in agents:
            topology_message = Message(
                message_id=str(uuid.uuid4()),
                sender_id="coordinator",
                receiver_id=agent.agent_id,
                message_type=MessageType.COORDINATION,
                content={
                    'type': 'topology_update',
                    'neighbors': list(agent.neighbors),
                    'topology': self.topology.value
                }
            )
            
            await agent.receive_message(topology_message)
    
    async def reach_consensus(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Reach consensus among agents"""
        active_agents = [agent for agent in self.agents.values() if agent.is_active]
        
        if not active_agents:
            return {'status': 'rejected', 'reason': 'No active agents'}
        
        return await self.consensus_algorithm.reach_consensus(active_agents, proposal)
    
    def get_swarm_metrics(self) -> SwarmMetrics:
        """Get current swarm metrics"""
        active_agents = [agent for agent in self.agents.values() if agent.is_active]
        task_stats = self.task_scheduler.get_task_statistics()
        
        # Calculate performance metrics
        total_tasks = task_stats['completed'] + task_stats['failed']
        efficiency = task_stats['completed'] / max(total_tasks, 1)
        
        # Calculate average response time
        response_times = []
        for agent in active_agents:
            if agent.performance_history:
                avg_time = np.mean([p['execution_time'] for p in agent.performance_history])
                response_times.append(avg_time)
        
        avg_response_time = np.mean(response_times) if response_times else 0
        
        # Calculate throughput (tasks per second)
        throughput = task_stats['completed'] / max(1, time.time() - 3600)  # Last hour
        
        metrics = SwarmMetrics(
            total_agents=len(self.agents),
            active_agents=len(active_agents),
            completed_tasks=task_stats['completed'],
            failed_tasks=task_stats['failed'],
            average_response_time=avg_response_time,
            throughput=throughput,
            efficiency=efficiency,
            consensus_time=0.0,  # Would be calculated from consensus operations
            communication_overhead=0.0  # Would be calculated from message statistics
        )
        
        # Update Prometheus metrics
        SWARM_EFFICIENCY.set(efficiency)
        
        return metrics
    
    async def optimize_swarm(self):
        """Optimize swarm performance using swarm intelligence"""
        logger.info("Optimizing swarm performance")
        
        # Particle Swarm Optimization for agent positioning
        await self.swarm_optimizer.optimize_agent_positions(list(self.agents.values()))
        
        # Load balancing
        await self._balance_load()
        
        # Topology optimization
        await self._optimize_topology()
    
    async def _balance_load(self):
        """Balance load across agents"""
        agents = list(self.agents.values())
        
        # Calculate load distribution
        loads = [len(agent.current_tasks) for agent in agents]
        avg_load = np.mean(loads)
        
        # Identify overloaded and underloaded agents
        overloaded = [agent for agent in agents if len(agent.current_tasks) > avg_load * 1.5]
        underloaded = [agent for agent in agents if len(agent.current_tasks) < avg_load * 0.5]
        
        # Redistribute tasks (simplified)
        for overloaded_agent in overloaded:
            for underloaded_agent in underloaded:
                if len(overloaded_agent.current_tasks) > len(underloaded_agent.current_tasks) + 1:
                    # In a real implementation, this would transfer actual tasks
                    logger.info(f"Would transfer task from {overloaded_agent.agent_id} to {underloaded_agent.agent_id}")
    
    async def _optimize_topology(self):
        """Optimize network topology for better performance"""
        # Analyze current topology performance
        if len(self.agents) < 10:
            optimal_topology = SwarmTopology.FULLY_CONNECTED
        elif len(self.agents) < 50:
            optimal_topology = SwarmTopology.SMALL_WORLD
        else:
            optimal_topology = SwarmTopology.HIERARCHICAL
        
        if optimal_topology != self.topology:
            logger.info(f"Switching topology from {self.topology} to {optimal_topology}")
            self.topology = optimal_topology
            await self._update_topology()

class MessageBroker:
    """Message broker for agent communication"""
    
    def __init__(self):
        self.message_queues = defaultdict(asyncio.Queue)
        self.subscribers = defaultdict(set)
    
    async def publish(self, topic: str, message: Message):
        """Publish message to topic"""
        for subscriber_id in self.subscribers[topic]:
            await self.message_queues[subscriber_id].put(message)
    
    async def subscribe(self, agent_id: str, topic: str):
        """Subscribe agent to topic"""
        self.subscribers[topic].add(agent_id)
    
    async def unsubscribe(self, agent_id: str, topic: str):
        """Unsubscribe agent from topic"""
        self.subscribers[topic].discard(agent_id)
    
    async def get_message(self, agent_id: str) -> Optional[Message]:
        """Get message for agent"""
        try:
            return await asyncio.wait_for(self.message_queues[agent_id].get(), timeout=0.1)
        except asyncio.TimeoutError:
            return None

class MetricsCollector:
    """Collect and analyze swarm metrics"""
    
    def __init__(self):
        self.metrics_history = deque(maxlen=1000)
        self.performance_data = defaultdict(list)
    
    def collect_metrics(self, swarm_metrics: SwarmMetrics):
        """Collect swarm metrics"""
        timestamp = datetime.now()
        
        self.metrics_history.append({
            'timestamp': timestamp,
            'metrics': swarm_metrics
        })
        
        # Store individual metrics for analysis
        self.performance_data['efficiency'].append(swarm_metrics.efficiency)
        self.performance_data['throughput'].append(swarm_metrics.throughput)
        self.performance_data['response_time'].append(swarm_metrics.average_response_time)
    
    def get_performance_trends(self) -> Dict[str, Any]:
        """Get performance trends"""
        trends = {}
        
        for metric_name, values in self.performance_data.items():
            if len(values) >= 2:
                recent_avg = np.mean(values[-10:])  # Last 10 values
                historical_avg = np.mean(values[:-10]) if len(values) > 10 else recent_avg
                
                trend = 'improving' if recent_avg > historical_avg else 'declining'
                
                trends[metric_name] = {
                    'current': recent_avg,
                    'historical': historical_avg,
                    'trend': trend,
                    'change_percent': ((recent_avg - historical_avg) / max(historical_avg, 0.001)) * 100
                }
        
        return trends

class SwarmOptimizer:
    """Swarm intelligence optimization algorithms"""
    
    def __init__(self):
        self.optimization_history = []
    
    async def optimize_agent_positions(self, agents: List[Agent]):
        """Optimize agent positions using Particle Swarm Optimization"""
        if len(agents) < 2:
            return
        
        # PSO parameters
        num_particles = len(agents)
        dimensions = 2  # 2D positioning
        max_iterations = 50
        
        # Initialize particles (agent positions)
        positions = np.array([agent.position for agent in agents])
        velocities = np.random.uniform(-1, 1, (num_particles, dimensions))
        
        # PSO parameters
        w = 0.7  # Inertia weight
        c1 = 1.5  # Cognitive parameter
        c2 = 1.5  # Social parameter
        
        # Best positions
        personal_best_positions = positions.copy()
        personal_best_scores = np.array([self._evaluate_position(pos, agents) for pos in positions])
        
        global_best_idx = np.argmin(personal_best_scores)
        global_best_position = personal_best_positions[global_best_idx].copy()
        global_best_score = personal_best_scores[global_best_idx]
        
        # PSO iterations
        for iteration in range(max_iterations):
            for i in range(num_particles):
                # Update velocity
                r1, r2 = np.random.random(2)
                
                velocities[i] = (w * velocities[i] +
                               c1 * r1 * (personal_best_positions[i] - positions[i]) +
                               c2 * r2 * (global_best_position - positions[i]))
                
                # Update position
                positions[i] += velocities[i]
                
                # Bound positions
                positions[i] = np.clip(positions[i], 0, 100)
                
                # Evaluate new position
                score = self._evaluate_position(positions[i], agents)
                
                # Update personal best
                if score < personal_best_scores[i]:
                    personal_best_scores[i] = score
                    personal_best_positions[i] = positions[i].copy()
                    
                    # Update global best
                    if score < global_best_score:
                        global_best_score = score
                        global_best_position = positions[i].copy()
        
        # Update agent positions
        for i, agent in enumerate(agents):
            agent.position = tuple(positions[i])
        
        logger.info(f"Agent positions optimized. Best score: {global_best_score:.4f}")
    
    def _evaluate_position(self, position: np.ndarray, agents: List[Agent]) -> float:
        """Evaluate the quality of an agent position"""
        # Simple evaluation based on distance to other agents
        # In practice, this would consider communication efficiency, coverage, etc.
        
        total_distance = 0
        for agent in agents:
            agent_pos = np.array(agent.position)
            distance = np.linalg.norm(position - agent_pos)
            total_distance += distance
        
        # Prefer positions that are not too close or too far from other agents
        avg_distance = total_distance / max(len(agents), 1)
        optimal_distance = 20.0  # Optimal distance between agents
        
        return abs(avg_distance - optimal_distance)

class AutonomousAgentSwarmSystem:
    """Complete autonomous agent swarm system"""
    
    def __init__(self, consensus_algorithm: ConsensusAlgorithm = None):
        self.coordinator = SwarmCoordinator(consensus_algorithm)
        self.app = FastAPI(title="Autonomous Agent Swarm System")
        self._setup_routes()
        
        # Background tasks
        self.optimization_task = None
        self.monitoring_task = None
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/health")
        async def health_check():
            return {"status": "healthy", "timestamp": datetime.now().isoformat()}
        
        @self.app.get("/swarm/metrics")
        async def get_swarm_metrics():
            return self.coordinator.get_swarm_metrics().__dict__
        
        @self.app.get("/swarm/agents")
        async def get_agents():
            return {
                agent_id: {
                    'role': agent.role.value,
                    'is_active': agent.is_active,
                    'current_tasks': len(agent.current_tasks),
                    'capabilities': agent.capabilities.__dict__,
                    'position': agent.position,
                    'neighbors': list(agent.neighbors)
                }
                for agent_id, agent in self.coordinator.agents.items()
            }
        
        @self.app.post("/swarm/agents")
        async def add_agent(agent_data: dict):
            try:
                capabilities = AgentCapabilities(**agent_data.get('capabilities', {}))
                role = AgentRole(agent_data.get('role', 'worker'))
                
                agent = Agent(
                    agent_id=agent_data.get('agent_id', str(uuid.uuid4())),
                    role=role,
                    capabilities=capabilities
                )
                
                await self.coordinator.add_agent(agent)
                
                return {"status": "success", "agent_id": agent.agent_id}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.delete("/swarm/agents/{agent_id}")
        async def remove_agent(agent_id: str):
            try:
                await self.coordinator.remove_agent(agent_id)
                return {"status": "success"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.post("/swarm/tasks")
        async def submit_task(task_data: dict):
            try:
                task = Task(
                    task_id=task_data.get('task_id', str(uuid.uuid4())),
                    task_type=TaskType(task_data.get('task_type', 'computation')),
                    priority=task_data.get('priority', 1),
                    required_capabilities=task_data.get('required_capabilities', []),
                    estimated_duration=task_data.get('estimated_duration', 1.0),
                    data=task_data.get('data', {})
                )
                
                await self.coordinator.submit_task(task)
                
                return {"status": "success", "task_id": task.task_id}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.get("/swarm/tasks/stats")
        async def get_task_stats():
            return self.coordinator.task_scheduler.get_task_statistics()
        
        @self.app.post("/swarm/consensus")
        async def reach_consensus(proposal: dict):
            try:
                result = await self.coordinator.reach_consensus(proposal)
                return result
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.post("/swarm/optimize")
        async def optimize_swarm():
            try:
                await self.coordinator.optimize_swarm()
                return {"status": "success", "message": "Swarm optimization completed"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.websocket("/ws/metrics")
        async def websocket_metrics(websocket: WebSocket):
            await websocket.accept()
            try:
                while True:
                    metrics = self.coordinator.get_swarm_metrics()
                    await websocket.send_json(metrics.__dict__)
                    await asyncio.sleep(1)
            except WebSocketDisconnect:
                pass
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
    
    async def start(self, num_agents: int = 5):
        """Start the swarm system"""
        logger.info(f"Starting autonomous agent swarm with {num_agents} agents")
        
        # Create initial agents
        for i in range(num_agents):
            capabilities = AgentCapabilities(
                cpu_cores=random.randint(1, 4),
                memory_gb=random.uniform(1.0, 8.0),
                gpu_available=random.random() > 0.7,
                specialized_skills=random.sample(['computation', 'data_processing', 'optimization', 'search'], 
                                               random.randint(1, 3)),
                max_concurrent_tasks=random.randint(1, 3),
                reliability_score=random.uniform(0.8, 1.0),
                processing_speed=random.uniform(0.5, 2.0)
            )
            
            role = random.choice(list(AgentRole))
            
            agent = Agent(
                agent_id=f"agent_{i}",
                role=role,
                capabilities=capabilities
            )
            
            await self.coordinator.add_agent(agent)
        
        # Start background optimization
        self.optimization_task = asyncio.create_task(self._optimization_loop())
        
        logger.info("Autonomous agent swarm started successfully")
    
    async def stop(self):
        """Stop the swarm system"""
        logger.info("Stopping autonomous agent swarm")
        
        # Stop background tasks
        if self.optimization_task:
            self.optimization_task.cancel()
        
        # Stop all agents
        for agent_id in list(self.coordinator.agents.keys()):
            await self.coordinator.remove_agent(agent_id)
        
        logger.info("Autonomous agent swarm stopped")
    
    async def _optimization_loop(self):
        """Background optimization loop"""
        while True:
            try:
                await asyncio.sleep(60)  # Optimize every minute
                await self.coordinator.optimize_swarm()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Optimization loop error: {e}")
    
    def start_api_server(self, host: str = "0.0.0.0", port: int = 8000):
        """Start API server"""
        logger.info(f"Starting swarm API server on {host}:{port}")
        uvicorn.run(self.app, host=host, port=port)

# Example usage
async def main():
    """Example usage of the Autonomous Agent Swarm System"""
    
    # Create swarm system with PBFT consensus
    swarm_system = AutonomousAgentSwarmSystem(PBFTConsensus())
    
    # Start swarm with 10 agents
    await swarm_system.start(num_agents=10)
    
    # Submit some example tasks
    tasks = [
        Task(
            task_id=f"task_{i}",
            task_type=TaskType.COMPUTATION,
            priority=random.randint(1, 5),
            required_capabilities=['computation'],
            estimated_duration=random.uniform(0.5, 3.0),
            data={'input': [random.random() for _ in range(10)]}
        )
        for i in range(20)
    ]
    
    for task in tasks:
        await swarm_system.coordinator.submit_task(task)
    
    # Wait for tasks to complete
    await asyncio.sleep(10)
    
    # Get swarm metrics
    metrics = swarm_system.coordinator.get_swarm_metrics()
    print(f"Swarm metrics: {metrics}")
    
    # Test consensus
    proposal = {
        'type': 'resource_allocation',
        'resources': {'cpu': 2, 'memory': 1.0},
        'duration': 300
    }
    
    consensus_result = await swarm_system.coordinator.reach_consensus(proposal)
    print(f"Consensus result: {consensus_result}")
    
    # Stop swarm
    await swarm_system.stop()

if __name__ == "__main__":
    asyncio.run(main())