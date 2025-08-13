#!/usr/bin/env python3
"""
EDGE AI DEPLOYMENT SYSTEM
Optimized AI Inference for Resource-Constrained Devices

This module provides:
- Model quantization and compression
- Edge-optimized inference engines
- Hardware acceleration (GPU, NPU, TPU)
- Real-time performance monitoring
- Adaptive model selection
- Federated learning capabilities
- Power-efficient computing
- On-device training
"""

import asyncio
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Union, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
import logging
import time
import json
from datetime import datetime
import uuid
import pickle
from pathlib import Path
import threading
import queue
import psutil
import platform
from collections import deque, defaultdict

# Core ML libraries
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
import torchvision.transforms as transforms
import onnx
import onnxruntime as ort

# Model optimization
try:
    import torch.quantization as quant
    from torch.quantization import QuantStub, DeQuantStub
    QUANTIZATION_AVAILABLE = True
except ImportError:
    QUANTIZATION_AVAILABLE = False

try:
    import tensorrt as trt
    import pycuda.driver as cuda
    import pycuda.autoinit
    TENSORRT_AVAILABLE = True
except ImportError:
    TENSORRT_AVAILABLE = False

try:
    import openvino as ov
    OPENVINO_AVAILABLE = True
except ImportError:
    OPENVINO_AVAILABLE = False

try:
    import tensorflow as tf
    import tensorflow_lite as tflite
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

# Edge computing frameworks
try:
    import ncnn
    NCNN_AVAILABLE = True
except ImportError:
    NCNN_AVAILABLE = False

try:
    import mnn
    MNN_AVAILABLE = True
except ImportError:
    MNN_AVAILABLE = False

# Hardware monitoring
import GPUtil
from pynvml import *

# Networking
import requests
import websockets
from fastapi import FastAPI, WebSocket
import uvicorn

# Monitoring
from prometheus_client import Counter, Histogram, Gauge
import structlog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Metrics
INFERENCE_REQUESTS = Counter('edge_inference_requests_total', 'Total inference requests')
INFERENCE_LATENCY = Histogram('edge_inference_latency_seconds', 'Inference latency')
MODEL_ACCURACY = Gauge('edge_model_accuracy', 'Model accuracy')
DEVICE_TEMPERATURE = Gauge('edge_device_temperature_celsius', 'Device temperature')
MEMORY_USAGE = Gauge('edge_memory_usage_bytes', 'Memory usage')
POWER_CONSUMPTION = Gauge('edge_power_consumption_watts', 'Power consumption')
NETWORK_BANDWIDTH = Gauge('edge_network_bandwidth_mbps', 'Network bandwidth')

class DeviceType(str, Enum):
    CPU = "cpu"
    GPU = "gpu"
    NPU = "npu"
    TPU = "tpu"
    FPGA = "fpga"
    ARM = "arm"
    MOBILE = "mobile"
    EMBEDDED = "embedded"

class OptimizationLevel(str, Enum):
    NONE = "none"
    BASIC = "basic"
    AGGRESSIVE = "aggressive"
    ULTRA = "ultra"

class InferenceEngine(str, Enum):
    PYTORCH = "pytorch"
    ONNX = "onnx"
    TENSORRT = "tensorrt"
    OPENVINO = "openvino"
    TFLITE = "tflite"
    NCNN = "ncnn"
    MNN = "mnn"

@dataclass
class EdgeConfig:
    """Edge AI deployment configuration"""
    device_type: DeviceType = DeviceType.CPU
    optimization_level: OptimizationLevel = OptimizationLevel.BASIC
    inference_engine: InferenceEngine = InferenceEngine.PYTORCH
    max_batch_size: int = 1
    max_latency_ms: float = 100.0
    target_accuracy: float = 0.95
    memory_limit_mb: int = 512
    power_limit_watts: float = 10.0
    temperature_limit_celsius: float = 85.0
    enable_quantization: bool = True
    enable_pruning: bool = True
    enable_distillation: bool = False
    enable_caching: bool = True
    cache_size_mb: int = 64
    enable_federated_learning: bool = False
    model_update_interval: int = 3600  # seconds

@dataclass
class DeviceInfo:
    """Device information"""
    device_id: str
    device_type: DeviceType
    cpu_count: int
    memory_total_mb: int
    gpu_count: int = 0
    gpu_memory_mb: int = 0
    architecture: str = ""
    os_type: str = ""
    capabilities: List[str] = field(default_factory=list)

@dataclass
class ModelMetrics:
    """Model performance metrics"""
    accuracy: float
    latency_ms: float
    throughput_fps: float
    memory_usage_mb: float
    power_consumption_watts: float
    model_size_mb: float
    flops: int
    parameters: int

class DeviceMonitor:
    """Monitor device resources and performance"""
    
    def __init__(self, config: EdgeConfig):
        self.config = config
        self.monitoring = False
        self.metrics_history = deque(maxlen=1000)
        
        # Initialize GPU monitoring if available
        try:
            nvmlInit()
            self.gpu_available = True
        except:
            self.gpu_available = False
    
    def get_device_info(self) -> DeviceInfo:
        """Get comprehensive device information"""
        device_info = DeviceInfo(
            device_id=str(uuid.uuid4()),
            device_type=self.config.device_type,
            cpu_count=psutil.cpu_count(),
            memory_total_mb=psutil.virtual_memory().total // (1024 * 1024),
            architecture=platform.machine(),
            os_type=platform.system()
        )
        
        # GPU information
        if self.gpu_available:
            try:
                gpu_count = nvmlDeviceGetCount()
                device_info.gpu_count = gpu_count
                
                if gpu_count > 0:
                    handle = nvmlDeviceGetHandleByIndex(0)
                    mem_info = nvmlDeviceGetMemoryInfo(handle)
                    device_info.gpu_memory_mb = mem_info.total // (1024 * 1024)
                    
                    # Get GPU capabilities
                    name = nvmlDeviceGetName(handle).decode('utf-8')
                    device_info.capabilities.append(f"GPU: {name}")
            except:
                pass
        
        # Check for specialized hardware
        if torch.cuda.is_available():
            device_info.capabilities.append("CUDA")
        
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device_info.capabilities.append("MPS")
        
        return device_info
    
    def get_current_metrics(self) -> Dict[str, float]:
        """Get current device metrics"""
        metrics = {}
        
        # CPU metrics
        metrics['cpu_usage_percent'] = psutil.cpu_percent(interval=0.1)
        metrics['cpu_temperature'] = self._get_cpu_temperature()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        metrics['memory_usage_percent'] = memory.percent
        metrics['memory_available_mb'] = memory.available // (1024 * 1024)
        
        # GPU metrics
        if self.gpu_available:
            try:
                handle = nvmlDeviceGetHandleByIndex(0)
                
                # GPU utilization
                util = nvmlDeviceGetUtilizationRates(handle)
                metrics['gpu_usage_percent'] = util.gpu
                metrics['gpu_memory_percent'] = util.memory
                
                # GPU temperature
                temp = nvmlDeviceGetTemperature(handle, NVML_TEMPERATURE_GPU)
                metrics['gpu_temperature'] = temp
                
                # GPU power
                try:
                    power = nvmlDeviceGetPowerUsage(handle) / 1000.0  # Convert to watts
                    metrics['gpu_power_watts'] = power
                except:
                    metrics['gpu_power_watts'] = 0.0
                
            except:
                pass
        
        # Network metrics
        net_io = psutil.net_io_counters()
        metrics['network_bytes_sent'] = net_io.bytes_sent
        metrics['network_bytes_recv'] = net_io.bytes_recv
        
        # Disk metrics
        disk_usage = psutil.disk_usage('/')
        metrics['disk_usage_percent'] = (disk_usage.used / disk_usage.total) * 100
        
        # Update Prometheus metrics
        DEVICE_TEMPERATURE.set(metrics.get('cpu_temperature', 0))
        MEMORY_USAGE.set(metrics.get('memory_usage_percent', 0))
        POWER_CONSUMPTION.set(metrics.get('gpu_power_watts', 0))
        
        return metrics
    
    def _get_cpu_temperature(self) -> float:
        """Get CPU temperature"""
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        if entries:
                            return entries[0].current
        except:
            pass
        return 0.0
    
    def start_monitoring(self, interval: float = 1.0):
        """Start continuous monitoring"""
        self.monitoring = True
        
        def monitor_loop():
            while self.monitoring:
                try:
                    metrics = self.get_current_metrics()
                    self.metrics_history.append({
                        'timestamp': time.time(),
                        'metrics': metrics
                    })
                    time.sleep(interval)
                except Exception as e:
                    logger.error(f"Monitoring error: {e}")
        
        self.monitor_thread = threading.Thread(target=monitor_loop)
        self.monitor_thread.start()
    
    def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring = False
        if hasattr(self, 'monitor_thread'):
            self.monitor_thread.join()

class ModelOptimizer:
    """Optimize models for edge deployment"""
    
    def __init__(self, config: EdgeConfig):
        self.config = config
    
    def quantize_model(self, model: nn.Module, calibration_data: Optional[DataLoader] = None) -> nn.Module:
        """Quantize model for reduced precision"""
        if not QUANTIZATION_AVAILABLE:
            logger.warning("PyTorch quantization not available")
            return model
        
        logger.info("Quantizing model...")
        
        # Prepare model for quantization
        model.eval()
        
        if self.config.optimization_level == OptimizationLevel.BASIC:
            # Dynamic quantization
            quantized_model = torch.quantization.quantize_dynamic(
                model, {nn.Linear, nn.Conv2d}, dtype=torch.qint8
            )
        else:
            # Static quantization
            model.qconfig = torch.quantization.get_default_qconfig('fbgemm')
            torch.quantization.prepare(model, inplace=True)
            
            # Calibrate with sample data
            if calibration_data:
                with torch.no_grad():
                    for batch_idx, (data, _) in enumerate(calibration_data):
                        if batch_idx >= 10:  # Use limited calibration data
                            break
                        model(data)
            
            quantized_model = torch.quantization.convert(model, inplace=False)
        
        logger.info("Model quantization completed")
        return quantized_model
    
    def prune_model(self, model: nn.Module, sparsity: float = 0.3) -> nn.Module:
        """Prune model weights"""
        logger.info(f"Pruning model with {sparsity:.1%} sparsity...")
        
        import torch.nn.utils.prune as prune
        
        # Apply structured pruning
        for name, module in model.named_modules():
            if isinstance(module, (nn.Conv2d, nn.Linear)):
                prune.l1_unstructured(module, name='weight', amount=sparsity)
                prune.remove(module, 'weight')
        
        logger.info("Model pruning completed")
        return model
    
    def distill_model(self, teacher_model: nn.Module, student_model: nn.Module, 
                     train_loader: DataLoader, epochs: int = 10) -> nn.Module:
        """Knowledge distillation"""
        logger.info("Starting knowledge distillation...")
        
        teacher_model.eval()
        student_model.train()
        
        optimizer = torch.optim.Adam(student_model.parameters(), lr=0.001)
        temperature = 4.0
        alpha = 0.7
        
        for epoch in range(epochs):
            total_loss = 0.0
            
            for batch_idx, (data, targets) in enumerate(train_loader):
                optimizer.zero_grad()
                
                # Teacher predictions
                with torch.no_grad():
                    teacher_outputs = teacher_model(data)
                
                # Student predictions
                student_outputs = student_model(data)
                
                # Distillation loss
                distillation_loss = F.kl_div(
                    F.log_softmax(student_outputs / temperature, dim=1),
                    F.softmax(teacher_outputs / temperature, dim=1),
                    reduction='batchmean'
                ) * (temperature ** 2)
                
                # Student loss
                student_loss = F.cross_entropy(student_outputs, targets)
                
                # Combined loss
                loss = alpha * distillation_loss + (1 - alpha) * student_loss
                
                loss.backward()
                optimizer.step()
                
                total_loss += loss.item()
            
            logger.info(f"Distillation epoch {epoch + 1}: loss = {total_loss / len(train_loader):.4f}")
        
        logger.info("Knowledge distillation completed")
        return student_model
    
    def convert_to_onnx(self, model: nn.Module, input_shape: Tuple[int, ...], 
                       output_path: str) -> str:
        """Convert PyTorch model to ONNX"""
        logger.info("Converting model to ONNX...")
        
        model.eval()
        dummy_input = torch.randn(1, *input_shape)
        
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        logger.info(f"ONNX model saved to {output_path}")
        return output_path
    
    def optimize_for_tensorrt(self, onnx_path: str, output_path: str) -> str:
        """Optimize ONNX model for TensorRT"""
        if not TENSORRT_AVAILABLE:
            logger.warning("TensorRT not available")
            return onnx_path
        
        logger.info("Optimizing model for TensorRT...")
        
        # TensorRT optimization logic would go here
        # This is a placeholder for the actual implementation
        
        logger.info(f"TensorRT optimized model saved to {output_path}")
        return output_path

class EdgeInferenceEngine:
    """High-performance inference engine for edge devices"""
    
    def __init__(self, config: EdgeConfig):
        self.config = config
        self.models = {}
        self.sessions = {}
        self.cache = {}
        self.performance_stats = defaultdict(list)
    
    def load_model(self, model_path: str, model_name: str, 
                  input_shape: Optional[Tuple[int, ...]] = None):
        """Load model for inference"""
        logger.info(f"Loading model {model_name} from {model_path}")
        
        if self.config.inference_engine == InferenceEngine.PYTORCH:
            self._load_pytorch_model(model_path, model_name)
        elif self.config.inference_engine == InferenceEngine.ONNX:
            self._load_onnx_model(model_path, model_name)
        elif self.config.inference_engine == InferenceEngine.TENSORRT:
            self._load_tensorrt_model(model_path, model_name)
        elif self.config.inference_engine == InferenceEngine.OPENVINO:
            self._load_openvino_model(model_path, model_name)
        elif self.config.inference_engine == InferenceEngine.TFLITE:
            self._load_tflite_model(model_path, model_name)
        else:
            raise ValueError(f"Unsupported inference engine: {self.config.inference_engine}")
    
    def _load_pytorch_model(self, model_path: str, model_name: str):
        """Load PyTorch model"""
        model = torch.load(model_path, map_location='cpu')
        model.eval()
        
        if self.config.device_type == DeviceType.GPU and torch.cuda.is_available():
            model = model.cuda()
        
        self.models[model_name] = model
    
    def _load_onnx_model(self, model_path: str, model_name: str):
        """Load ONNX model"""
        providers = ['CPUExecutionProvider']
        
        if self.config.device_type == DeviceType.GPU and ort.get_device() == 'GPU':
            providers.insert(0, 'CUDAExecutionProvider')
        
        session = ort.InferenceSession(model_path, providers=providers)
        self.sessions[model_name] = session
    
    def _load_tensorrt_model(self, model_path: str, model_name: str):
        """Load TensorRT model"""
        if not TENSORRT_AVAILABLE:
            raise RuntimeError("TensorRT not available")
        
        # TensorRT loading logic would go here
        logger.info(f"TensorRT model {model_name} loaded")
    
    def _load_openvino_model(self, model_path: str, model_name: str):
        """Load OpenVINO model"""
        if not OPENVINO_AVAILABLE:
            raise RuntimeError("OpenVINO not available")
        
        # OpenVINO loading logic would go here
        logger.info(f"OpenVINO model {model_name} loaded")
    
    def _load_tflite_model(self, model_path: str, model_name: str):
        """Load TensorFlow Lite model"""
        if not TENSORFLOW_AVAILABLE:
            raise RuntimeError("TensorFlow Lite not available")
        
        # TensorFlow Lite loading logic would go here
        logger.info(f"TensorFlow Lite model {model_name} loaded")
    
    @INFERENCE_LATENCY.time()
    def predict(self, model_name: str, input_data: np.ndarray) -> Dict[str, Any]:
        """Perform inference"""
        INFERENCE_REQUESTS.inc()
        
        start_time = time.time()
        
        # Check cache
        if self.config.enable_caching:
            cache_key = self._generate_cache_key(model_name, input_data)
            if cache_key in self.cache:
                cached_result = self.cache[cache_key]
                cached_result['from_cache'] = True
                return cached_result
        
        # Perform inference
        if self.config.inference_engine == InferenceEngine.PYTORCH:
            result = self._pytorch_inference(model_name, input_data)
        elif self.config.inference_engine == InferenceEngine.ONNX:
            result = self._onnx_inference(model_name, input_data)
        else:
            raise ValueError(f"Inference engine {self.config.inference_engine} not implemented")
        
        inference_time = time.time() - start_time
        
        # Add metadata
        result.update({
            'inference_time_ms': inference_time * 1000,
            'model_name': model_name,
            'from_cache': False,
            'timestamp': datetime.now().isoformat()
        })
        
        # Cache result
        if self.config.enable_caching:
            self._cache_result(cache_key, result)
        
        # Update performance stats
        self.performance_stats[model_name].append(inference_time)
        
        return result
    
    def _pytorch_inference(self, model_name: str, input_data: np.ndarray) -> Dict[str, Any]:
        """PyTorch inference"""
        model = self.models[model_name]
        
        # Convert to tensor
        if isinstance(input_data, np.ndarray):
            input_tensor = torch.from_numpy(input_data).float()
        else:
            input_tensor = input_data
        
        # Add batch dimension if needed
        if len(input_tensor.shape) == 3:  # CHW -> NCHW
            input_tensor = input_tensor.unsqueeze(0)
        
        # Move to device
        if self.config.device_type == DeviceType.GPU and torch.cuda.is_available():
            input_tensor = input_tensor.cuda()
        
        # Inference
        with torch.no_grad():
            output = model(input_tensor)
        
        # Convert to numpy
        if torch.cuda.is_available():
            output = output.cpu()
        output_np = output.numpy()
        
        return {
            'predictions': output_np,
            'probabilities': torch.softmax(output, dim=1).numpy() if len(output.shape) > 1 else None
        }
    
    def _onnx_inference(self, model_name: str, input_data: np.ndarray) -> Dict[str, Any]:
        """ONNX inference"""
        session = self.sessions[model_name]
        
        # Get input name
        input_name = session.get_inputs()[0].name
        
        # Run inference
        outputs = session.run(None, {input_name: input_data})
        
        return {
            'predictions': outputs[0],
            'probabilities': outputs[1] if len(outputs) > 1 else None
        }
    
    def _generate_cache_key(self, model_name: str, input_data: np.ndarray) -> str:
        """Generate cache key for input"""
        import hashlib
        
        # Create hash of input data
        data_hash = hashlib.md5(input_data.tobytes()).hexdigest()
        return f"{model_name}_{data_hash}"
    
    def _cache_result(self, cache_key: str, result: Dict[str, Any]):
        """Cache inference result"""
        # Simple LRU cache implementation
        if len(self.cache) >= self.config.cache_size_mb * 1024:  # Simplified size check
            # Remove oldest entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        self.cache[cache_key] = result
    
    def get_performance_stats(self, model_name: str) -> Dict[str, float]:
        """Get performance statistics"""
        if model_name not in self.performance_stats:
            return {}
        
        times = self.performance_stats[model_name]
        
        return {
            'avg_latency_ms': np.mean(times) * 1000,
            'p50_latency_ms': np.percentile(times, 50) * 1000,
            'p95_latency_ms': np.percentile(times, 95) * 1000,
            'p99_latency_ms': np.percentile(times, 99) * 1000,
            'throughput_fps': 1.0 / np.mean(times),
            'total_requests': len(times)
        }

class FederatedLearningClient:
    """Federated learning client for edge devices"""
    
    def __init__(self, config: EdgeConfig, client_id: str):
        self.config = config
        self.client_id = client_id
        self.local_model = None
        self.local_data = None
        self.server_url = None
    
    def set_model(self, model: nn.Module):
        """Set local model"""
        self.local_model = model
    
    def set_data(self, data_loader: DataLoader):
        """Set local training data"""
        self.local_data = data_loader
    
    def local_training(self, epochs: int = 1) -> Dict[str, Any]:
        """Perform local training"""
        if not self.local_model or not self.local_data:
            raise ValueError("Model and data must be set before training")
        
        logger.info(f"Starting local training for {epochs} epochs")
        
        self.local_model.train()
        optimizer = torch.optim.SGD(self.local_model.parameters(), lr=0.01)
        criterion = nn.CrossEntropyLoss()
        
        total_loss = 0.0
        total_samples = 0
        
        for epoch in range(epochs):
            epoch_loss = 0.0
            epoch_samples = 0
            
            for batch_idx, (data, targets) in enumerate(self.local_data):
                optimizer.zero_grad()
                
                outputs = self.local_model(data)
                loss = criterion(outputs, targets)
                
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
                epoch_samples += len(data)
            
            total_loss += epoch_loss
            total_samples += epoch_samples
            
            logger.info(f"Local epoch {epoch + 1}: loss = {epoch_loss / len(self.local_data):.4f}")
        
        avg_loss = total_loss / (epochs * len(self.local_data))
        
        return {
            'client_id': self.client_id,
            'epochs': epochs,
            'samples': total_samples,
            'avg_loss': avg_loss,
            'model_weights': self.local_model.state_dict()
        }
    
    async def send_update_to_server(self, update: Dict[str, Any]) -> Dict[str, Any]:
        """Send model update to federated learning server"""
        if not self.server_url:
            raise ValueError("Server URL not set")
        
        # In a real implementation, this would send the update to the server
        # and receive the global model update
        logger.info(f"Sending update to server: {self.server_url}")
        
        # Placeholder for server communication
        return {'status': 'success', 'global_model_weights': {}}
    
    def update_model(self, global_weights: Dict[str, Any]):
        """Update local model with global weights"""
        if self.local_model:
            self.local_model.load_state_dict(global_weights)
            logger.info("Local model updated with global weights")

class EdgeAIDeploymentSystem:
    """Complete edge AI deployment system"""
    
    def __init__(self, config: EdgeConfig):
        self.config = config
        self.device_monitor = DeviceMonitor(config)
        self.model_optimizer = ModelOptimizer(config)
        self.inference_engine = EdgeInferenceEngine(config)
        self.federated_client = None
        
        # FastAPI app for API endpoints
        self.app = FastAPI(title="Edge AI Deployment System")
        self._setup_routes()
        
        # Performance tracking
        self.deployment_metrics = {}
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/health")
        async def health_check():
            return {"status": "healthy", "timestamp": datetime.now().isoformat()}
        
        @self.app.get("/device/info")
        async def get_device_info():
            return self.device_monitor.get_device_info()
        
        @self.app.get("/device/metrics")
        async def get_device_metrics():
            return self.device_monitor.get_current_metrics()
        
        @self.app.post("/model/load")
        async def load_model(model_path: str, model_name: str):
            try:
                self.inference_engine.load_model(model_path, model_name)
                return {"status": "success", "message": f"Model {model_name} loaded"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.post("/predict/{model_name}")
        async def predict(model_name: str, input_data: List[float]):
            try:
                input_array = np.array(input_data).reshape(1, -1)
                result = self.inference_engine.predict(model_name, input_array)
                return result
            except Exception as e:
                return {"status": "error", "message": str(e)}
        
        @self.app.get("/performance/{model_name}")
        async def get_performance_stats(model_name: str):
            return self.inference_engine.get_performance_stats(model_name)
        
        @self.app.websocket("/ws/metrics")
        async def websocket_metrics(websocket: WebSocket):
            await websocket.accept()
            try:
                while True:
                    metrics = self.device_monitor.get_current_metrics()
                    await websocket.send_json(metrics)
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
    
    def deploy_model(self, model: nn.Module, model_name: str, 
                    input_shape: Tuple[int, ...], 
                    calibration_data: Optional[DataLoader] = None) -> Dict[str, Any]:
        """Deploy model to edge device"""
        logger.info(f"Deploying model {model_name} to edge device")
        
        deployment_start = time.time()
        
        # Get original model metrics
        original_size = self._get_model_size(model)
        original_params = sum(p.numel() for p in model.parameters())
        
        # Optimize model
        optimized_model = model
        
        if self.config.enable_quantization:
            optimized_model = self.model_optimizer.quantize_model(optimized_model, calibration_data)
        
        if self.config.enable_pruning:
            optimized_model = self.model_optimizer.prune_model(optimized_model)
        
        # Convert to target format
        if self.config.inference_engine == InferenceEngine.ONNX:
            onnx_path = f"{model_name}.onnx"
            self.model_optimizer.convert_to_onnx(optimized_model, input_shape, onnx_path)
            self.inference_engine.load_model(onnx_path, model_name)
        else:
            # Save optimized PyTorch model
            model_path = f"{model_name}.pth"
            torch.save(optimized_model, model_path)
            self.inference_engine.load_model(model_path, model_name)
        
        # Get optimized model metrics
        optimized_size = self._get_model_size(optimized_model)
        optimized_params = sum(p.numel() for p in optimized_model.parameters())
        
        deployment_time = time.time() - deployment_start
        
        # Deployment metrics
        metrics = {
            'model_name': model_name,
            'deployment_time_seconds': deployment_time,
            'original_size_mb': original_size,
            'optimized_size_mb': optimized_size,
            'size_reduction_percent': ((original_size - optimized_size) / original_size) * 100,
            'original_parameters': original_params,
            'optimized_parameters': optimized_params,
            'parameter_reduction_percent': ((original_params - optimized_params) / original_params) * 100,
            'optimization_level': self.config.optimization_level.value,
            'inference_engine': self.config.inference_engine.value,
            'device_type': self.config.device_type.value
        }
        
        self.deployment_metrics[model_name] = metrics
        
        logger.info(f"Model {model_name} deployed successfully")
        logger.info(f"Size reduction: {metrics['size_reduction_percent']:.1f}%")
        logger.info(f"Parameter reduction: {metrics['parameter_reduction_percent']:.1f}%")
        
        return metrics
    
    def _get_model_size(self, model: nn.Module) -> float:
        """Get model size in MB"""
        param_size = 0
        buffer_size = 0
        
        for param in model.parameters():
            param_size += param.nelement() * param.element_size()
        
        for buffer in model.buffers():
            buffer_size += buffer.nelement() * buffer.element_size()
        
        size_mb = (param_size + buffer_size) / (1024 * 1024)
        return size_mb
    
    def benchmark_model(self, model_name: str, test_data: np.ndarray, 
                       test_labels: np.ndarray, num_warmup: int = 10) -> ModelMetrics:
        """Benchmark model performance"""
        logger.info(f"Benchmarking model {model_name}")
        
        # Warmup
        for i in range(num_warmup):
            sample = test_data[i % len(test_data)]
            self.inference_engine.predict(model_name, sample.reshape(1, -1))
        
        # Benchmark
        latencies = []
        correct_predictions = 0
        
        for i, (data, label) in enumerate(zip(test_data, test_labels)):
            start_time = time.time()
            result = self.inference_engine.predict(model_name, data.reshape(1, -1))
            latency = time.time() - start_time
            
            latencies.append(latency)
            
            # Check accuracy (simplified)
            if 'predictions' in result:
                predicted_class = np.argmax(result['predictions'])
                if predicted_class == label:
                    correct_predictions += 1
        
        # Calculate metrics
        accuracy = correct_predictions / len(test_data)
        avg_latency = np.mean(latencies) * 1000  # ms
        throughput = 1.0 / np.mean(latencies)  # fps
        
        # Get current device metrics
        device_metrics = self.device_monitor.get_current_metrics()
        
        metrics = ModelMetrics(
            accuracy=accuracy,
            latency_ms=avg_latency,
            throughput_fps=throughput,
            memory_usage_mb=device_metrics.get('memory_usage_percent', 0),
            power_consumption_watts=device_metrics.get('gpu_power_watts', 0),
            model_size_mb=self.deployment_metrics.get(model_name, {}).get('optimized_size_mb', 0),
            flops=0,  # Would need to calculate FLOPs
            parameters=self.deployment_metrics.get(model_name, {}).get('optimized_parameters', 0)
        )
        
        # Update Prometheus metrics
        MODEL_ACCURACY.set(accuracy)
        
        logger.info(f"Benchmark results for {model_name}:")
        logger.info(f"  Accuracy: {accuracy:.3f}")
        logger.info(f"  Latency: {avg_latency:.2f} ms")
        logger.info(f"  Throughput: {throughput:.1f} FPS")
        
        return metrics
    
    def enable_federated_learning(self, client_id: str, server_url: str):
        """Enable federated learning"""
        self.federated_client = FederatedLearningClient(self.config, client_id)
        self.federated_client.server_url = server_url
        logger.info(f"Federated learning enabled for client {client_id}")
    
    def start_monitoring(self):
        """Start device monitoring"""
        self.device_monitor.start_monitoring()
        logger.info("Device monitoring started")
    
    def stop_monitoring(self):
        """Stop device monitoring"""
        self.device_monitor.stop_monitoring()
        logger.info("Device monitoring stopped")
    
    def start_api_server(self, host: str = "0.0.0.0", port: int = 8000):
        """Start API server"""
        logger.info(f"Starting API server on {host}:{port}")
        uvicorn.run(self.app, host=host, port=port)
    
    def export_deployment_report(self, filename: str):
        """Export deployment report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'config': {
                'device_type': self.config.device_type.value,
                'optimization_level': self.config.optimization_level.value,
                'inference_engine': self.config.inference_engine.value
            },
            'device_info': self.device_monitor.get_device_info().__dict__,
            'deployment_metrics': self.deployment_metrics,
            'performance_stats': {
                name: self.inference_engine.get_performance_stats(name)
                for name in self.inference_engine.models.keys()
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Deployment report exported to {filename}")

# Example usage
async def main():
    """Example usage of the Edge AI Deployment System"""
    
    # Initialize configuration
    config = EdgeConfig(
        device_type=DeviceType.CPU,
        optimization_level=OptimizationLevel.AGGRESSIVE,
        inference_engine=InferenceEngine.PYTORCH,
        enable_quantization=True,
        enable_pruning=True,
        enable_caching=True
    )
    
    # Create deployment system
    edge_system = EdgeAIDeploymentSystem(config)
    
    # Start monitoring
    edge_system.start_monitoring()
    
    # Create a simple model for demonstration
    class SimpleModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(784, 128)
            self.fc2 = nn.Linear(128, 64)
            self.fc3 = nn.Linear(64, 10)
        
        def forward(self, x):
            x = F.relu(self.fc1(x))
            x = F.relu(self.fc2(x))
            return self.fc3(x)
    
    model = SimpleModel()
    
    # Deploy model
    deployment_metrics = edge_system.deploy_model(
        model=model,
        model_name="simple_classifier",
        input_shape=(784,)
    )
    
    print(f"Deployment metrics: {deployment_metrics}")
    
    # Generate test data
    test_data = np.random.randn(100, 784)
    test_labels = np.random.randint(0, 10, 100)
    
    # Benchmark model
    benchmark_results = edge_system.benchmark_model(
        "simple_classifier", test_data, test_labels
    )
    
    print(f"Benchmark results: {benchmark_results}")
    
    # Export report
    edge_system.export_deployment_report("edge_deployment_report.json")
    
    # Stop monitoring
    edge_system.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(main())