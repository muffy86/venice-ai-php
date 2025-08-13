"""
Advanced Model Versioning and Deployment System
Provides comprehensive model lifecycle management, versioning, and deployment capabilities
"""

import os
import json
import yaml
import pickle
import hashlib
import shutil
import tempfile
import asyncio
import aiofiles
import time
from typing import Dict, List, Optional, Any, Union, Callable, Type, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import structlog
from fastapi import FastAPI, Request, Response, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, validator
import boto3
import docker
import kubernetes
from kubernetes import client, config as k8s_config
import mlflow
import mlflow.tracking
from mlflow.tracking import MlflowClient
import wandb
import dvc.api
import git
from git import Repo
import semver
import joblib
import torch
import tensorflow as tf
from sklearn.base import BaseEstimator
import numpy as np
import pandas as pd
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import redis
from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
import uuid
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import threading
import subprocess
from urllib.parse import urlparse
import requests
import zipfile
import tarfile
from contextlib import contextmanager
import psutil
import GPUtil


class ModelStatus(Enum):
    """Model status"""
    TRAINING = "training"
    TRAINED = "trained"
    VALIDATING = "validating"
    VALIDATED = "validated"
    STAGING = "staging"
    PRODUCTION = "production"
    ARCHIVED = "archived"
    FAILED = "failed"
    DEPRECATED = "deprecated"


class DeploymentStatus(Enum):
    """Deployment status"""
    PENDING = "pending"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    ROLLING_BACK = "rolling_back"
    ROLLED_BACK = "rolled_back"
    SCALING = "scaling"
    UPDATING = "updating"


class ModelFramework(Enum):
    """Supported ML frameworks"""
    SKLEARN = "sklearn"
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    ONNX = "onnx"
    CUSTOM = "custom"


class DeploymentTarget(Enum):
    """Deployment targets"""
    LOCAL = "local"
    DOCKER = "docker"
    KUBERNETES = "kubernetes"
    AWS_SAGEMAKER = "aws_sagemaker"
    AWS_ECS = "aws_ecs"
    AWS_LAMBDA = "aws_lambda"
    AZURE_ML = "azure_ml"
    GCP_AI_PLATFORM = "gcp_ai_platform"
    HEROKU = "heroku"


class StorageBackend(Enum):
    """Storage backends"""
    LOCAL = "local"
    S3 = "s3"
    GCS = "gcs"
    AZURE_BLOB = "azure_blob"
    MLFLOW = "mlflow"
    DVC = "dvc"


# Database models
Base = declarative_base()


class ModelVersion(Base):
    """Model version database model"""
    __tablename__ = "model_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    framework = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))
    description = Column(Text)
    tags = Column(Text)  # JSON string
    metrics = Column(Text)  # JSON string
    parameters = Column(Text)  # JSON string
    artifacts_path = Column(String(500))
    model_size_bytes = Column(Integer)
    training_duration_seconds = Column(Float)
    dataset_hash = Column(String(64))
    code_hash = Column(String(64))
    environment_hash = Column(String(64))
    parent_version_id = Column(UUID(as_uuid=True))
    is_active = Column(Boolean, default=True)


class ModelDeployment(Base):
    """Model deployment database model"""
    __tablename__ = "model_deployments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_version_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(255), nullable=False)
    target = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    endpoint_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deployed_by = Column(String(255))
    configuration = Column(Text)  # JSON string
    resource_requirements = Column(Text)  # JSON string
    scaling_config = Column(Text)  # JSON string
    health_check_url = Column(String(500))
    is_active = Column(Boolean, default=True)


@dataclass
class ModelMetadata:
    """Model metadata"""
    name: str
    version: str
    framework: ModelFramework
    description: str = ""
    tags: List[str] = field(default_factory=list)
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    metrics: Dict[str, float] = field(default_factory=dict)
    parameters: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    dataset_info: Dict[str, Any] = field(default_factory=dict)
    training_config: Dict[str, Any] = field(default_factory=dict)
    model_size_bytes: int = 0
    training_duration_seconds: float = 0
    parent_version: Optional[str] = None


@dataclass
class DeploymentConfig:
    """Deployment configuration"""
    name: str
    target: DeploymentTarget
    resource_requirements: Dict[str, Any] = field(default_factory=dict)
    scaling_config: Dict[str, Any] = field(default_factory=dict)
    environment_variables: Dict[str, str] = field(default_factory=dict)
    health_check: Dict[str, Any] = field(default_factory=dict)
    rollback_config: Dict[str, Any] = field(default_factory=dict)
    monitoring_config: Dict[str, Any] = field(default_factory=dict)
    security_config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ModelArtifacts:
    """Model artifacts"""
    model_file: str
    metadata_file: str
    requirements_file: str
    dockerfile: Optional[str] = None
    inference_script: Optional[str] = None
    preprocessing_script: Optional[str] = None
    postprocessing_script: Optional[str] = None
    test_data: Optional[str] = None
    documentation: Optional[str] = None


class ModelStorage:
    """Model storage interface"""
    
    def __init__(self, backend: StorageBackend, config: Dict[str, Any]):
        self.backend = backend
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize backend-specific clients
        if backend == StorageBackend.S3:
            self.s3_client = boto3.client('s3', **config.get('aws_config', {}))
        elif backend == StorageBackend.GCS:
            from google.cloud import storage
            self.gcs_client = storage.Client(**config.get('gcp_config', {}))
        elif backend == StorageBackend.AZURE_BLOB:
            from azure.storage.blob import BlobServiceClient
            self.blob_client = BlobServiceClient(**config.get('azure_config', {}))
        elif backend == StorageBackend.MLFLOW:
            mlflow.set_tracking_uri(config.get('tracking_uri', 'http://localhost:5000'))
    
    async def save_model(self, model: Any, artifacts: ModelArtifacts, 
                        metadata: ModelMetadata) -> str:
        """Save model to storage"""
        
        if self.backend == StorageBackend.LOCAL:
            return await self._save_local(model, artifacts, metadata)
        elif self.backend == StorageBackend.S3:
            return await self._save_s3(model, artifacts, metadata)
        elif self.backend == StorageBackend.MLFLOW:
            return await self._save_mlflow(model, artifacts, metadata)
        else:
            raise NotImplementedError(f"Backend {self.backend} not implemented")
    
    async def load_model(self, model_path: str, metadata: ModelMetadata) -> Any:
        """Load model from storage"""
        
        if self.backend == StorageBackend.LOCAL:
            return await self._load_local(model_path, metadata)
        elif self.backend == StorageBackend.S3:
            return await self._load_s3(model_path, metadata)
        elif self.backend == StorageBackend.MLFLOW:
            return await self._load_mlflow(model_path, metadata)
        else:
            raise NotImplementedError(f"Backend {self.backend} not implemented")
    
    async def _save_local(self, model: Any, artifacts: ModelArtifacts, 
                         metadata: ModelMetadata) -> str:
        """Save model locally"""
        
        # Create model directory
        model_dir = Path(self.config.get('base_path', 'models')) / metadata.name / metadata.version
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model based on framework
        model_path = model_dir / "model"
        
        if metadata.framework == ModelFramework.SKLEARN:
            joblib.dump(model, model_path.with_suffix('.pkl'))
        elif metadata.framework == ModelFramework.PYTORCH:
            torch.save(model.state_dict(), model_path.with_suffix('.pth'))
        elif metadata.framework == ModelFramework.TENSORFLOW:
            model.save(str(model_path))
        else:
            # Generic pickle save
            with open(model_path.with_suffix('.pkl'), 'wb') as f:
                pickle.dump(model, f)
        
        # Save metadata
        metadata_path = model_dir / "metadata.json"
        async with aiofiles.open(metadata_path, 'w') as f:
            await f.write(json.dumps(asdict(metadata), default=str, indent=2))
        
        # Save artifacts
        if artifacts.requirements_file:
            shutil.copy2(artifacts.requirements_file, model_dir / "requirements.txt")
        
        if artifacts.dockerfile:
            shutil.copy2(artifacts.dockerfile, model_dir / "Dockerfile")
        
        if artifacts.inference_script:
            shutil.copy2(artifacts.inference_script, model_dir / "inference.py")
        
        return str(model_dir)
    
    async def _load_local(self, model_path: str, metadata: ModelMetadata) -> Any:
        """Load model locally"""
        
        model_dir = Path(model_path)
        
        if metadata.framework == ModelFramework.SKLEARN:
            return joblib.load(model_dir / "model.pkl")
        elif metadata.framework == ModelFramework.PYTORCH:
            # Note: This requires the model class to be available
            model_state = torch.load(model_dir / "model.pth")
            # You would need to reconstruct the model architecture here
            return model_state
        elif metadata.framework == ModelFramework.TENSORFLOW:
            return tf.keras.models.load_model(str(model_dir / "model"))
        else:
            with open(model_dir / "model.pkl", 'rb') as f:
                return pickle.load(f)
    
    async def _save_s3(self, model: Any, artifacts: ModelArtifacts, 
                      metadata: ModelMetadata) -> str:
        """Save model to S3"""
        
        bucket = self.config['bucket']
        prefix = f"{metadata.name}/{metadata.version}"
        
        # Save model to temporary file first
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Save model
            if metadata.framework == ModelFramework.SKLEARN:
                model_file = temp_path / "model.pkl"
                joblib.dump(model, model_file)
            elif metadata.framework == ModelFramework.PYTORCH:
                model_file = temp_path / "model.pth"
                torch.save(model.state_dict(), model_file)
            elif metadata.framework == ModelFramework.TENSORFLOW:
                model_file = temp_path / "model"
                model.save(str(model_file))
            else:
                model_file = temp_path / "model.pkl"
                with open(model_file, 'wb') as f:
                    pickle.dump(model, f)
            
            # Upload model
            if model_file.is_file():
                self.s3_client.upload_file(
                    str(model_file),
                    bucket,
                    f"{prefix}/model{model_file.suffix}"
                )
            elif model_file.is_dir():
                # Upload directory (for TensorFlow SavedModel)
                for file_path in model_file.rglob('*'):
                    if file_path.is_file():
                        relative_path = file_path.relative_to(model_file)
                        self.s3_client.upload_file(
                            str(file_path),
                            bucket,
                            f"{prefix}/model/{relative_path}"
                        )
            
            # Upload metadata
            metadata_file = temp_path / "metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(asdict(metadata), f, default=str, indent=2)
            
            self.s3_client.upload_file(
                str(metadata_file),
                bucket,
                f"{prefix}/metadata.json"
            )
        
        return f"s3://{bucket}/{prefix}"
    
    async def _save_mlflow(self, model: Any, artifacts: ModelArtifacts, 
                          metadata: ModelMetadata) -> str:
        """Save model to MLflow"""
        
        with mlflow.start_run(run_name=f"{metadata.name}-{metadata.version}"):
            # Log parameters
            for key, value in metadata.parameters.items():
                mlflow.log_param(key, value)
            
            # Log metrics
            for key, value in metadata.metrics.items():
                mlflow.log_metric(key, value)
            
            # Log tags
            for tag in metadata.tags:
                mlflow.set_tag(tag, "true")
            
            # Log model based on framework
            if metadata.framework == ModelFramework.SKLEARN:
                mlflow.sklearn.log_model(model, "model")
            elif metadata.framework == ModelFramework.PYTORCH:
                mlflow.pytorch.log_model(model, "model")
            elif metadata.framework == ModelFramework.TENSORFLOW:
                mlflow.tensorflow.log_model(model, "model")
            else:
                mlflow.sklearn.log_model(model, "model")  # Fallback
            
            # Log artifacts
            if artifacts.requirements_file:
                mlflow.log_artifact(artifacts.requirements_file)
            
            if artifacts.dockerfile:
                mlflow.log_artifact(artifacts.dockerfile)
            
            run = mlflow.active_run()
            return f"runs:/{run.info.run_id}/model"


class ModelVersionManager:
    """Model version management"""
    
    def __init__(self, storage: ModelStorage, db_session: Session):
        self.storage = storage
        self.db_session = db_session
        self.logger = structlog.get_logger(__name__)
        
        # Setup metrics
        self.model_versions_counter = Counter(
            'model_versions_total',
            'Total model versions created',
            ['name', 'framework']
        )
        
        self.model_size_gauge = Gauge(
            'model_size_bytes',
            'Model size in bytes',
            ['name', 'version']
        )
    
    async def create_version(self, model: Any, metadata: ModelMetadata, 
                           artifacts: ModelArtifacts) -> str:
        """Create new model version"""
        
        try:
            # Validate version format
            if not self._is_valid_version(metadata.version):
                raise ValueError(f"Invalid version format: {metadata.version}")
            
            # Check if version already exists
            existing = self.db_session.query(ModelVersion).filter_by(
                name=metadata.name,
                version=metadata.version
            ).first()
            
            if existing:
                raise ValueError(f"Version {metadata.version} already exists for model {metadata.name}")
            
            # Calculate hashes
            model_hash = self._calculate_model_hash(model)
            code_hash = self._calculate_code_hash()
            env_hash = self._calculate_environment_hash()
            
            # Save model to storage
            artifacts_path = await self.storage.save_model(model, artifacts, metadata)
            
            # Calculate model size
            model_size = self._calculate_model_size(artifacts_path)
            
            # Create database record
            db_version = ModelVersion(
                name=metadata.name,
                version=metadata.version,
                framework=metadata.framework.value,
                status=ModelStatus.TRAINED.value,
                created_by=metadata.created_by,
                description=metadata.description,
                tags=json.dumps(metadata.tags),
                metrics=json.dumps(metadata.metrics),
                parameters=json.dumps(metadata.parameters),
                artifacts_path=artifacts_path,
                model_size_bytes=model_size,
                training_duration_seconds=metadata.training_duration_seconds,
                dataset_hash=metadata.dataset_info.get('hash', ''),
                code_hash=code_hash,
                environment_hash=env_hash,
                parent_version_id=self._get_parent_version_id(metadata.parent_version) if metadata.parent_version else None
            )
            
            self.db_session.add(db_version)
            self.db_session.commit()
            
            # Update metrics
            self.model_versions_counter.labels(
                name=metadata.name,
                framework=metadata.framework.value
            ).inc()
            
            self.model_size_gauge.labels(
                name=metadata.name,
                version=metadata.version
            ).set(model_size)
            
            self.logger.info(f"Created model version {metadata.name}:{metadata.version}")
            
            return str(db_version.id)
            
        except Exception as e:
            self.db_session.rollback()
            self.logger.error(f"Failed to create model version: {str(e)}")
            raise
    
    async def get_version(self, name: str, version: str) -> Optional[ModelVersion]:
        """Get model version"""
        
        return self.db_session.query(ModelVersion).filter_by(
            name=name,
            version=version,
            is_active=True
        ).first()
    
    async def list_versions(self, name: str, limit: int = 50) -> List[ModelVersion]:
        """List model versions"""
        
        return self.db_session.query(ModelVersion).filter_by(
            name=name,
            is_active=True
        ).order_by(ModelVersion.created_at.desc()).limit(limit).all()
    
    async def promote_version(self, name: str, version: str, 
                            target_status: ModelStatus) -> bool:
        """Promote model version to new status"""
        
        db_version = await self.get_version(name, version)
        if not db_version:
            raise ValueError(f"Version {name}:{version} not found")
        
        # Validate status transition
        if not self._is_valid_status_transition(
            ModelStatus(db_version.status), target_status
        ):
            raise ValueError(f"Invalid status transition from {db_version.status} to {target_status.value}")
        
        # If promoting to production, demote current production version
        if target_status == ModelStatus.PRODUCTION:
            current_prod = self.db_session.query(ModelVersion).filter_by(
                name=name,
                status=ModelStatus.PRODUCTION.value,
                is_active=True
            ).first()
            
            if current_prod:
                current_prod.status = ModelStatus.ARCHIVED.value
                current_prod.updated_at = datetime.utcnow()
        
        db_version.status = target_status.value
        db_version.updated_at = datetime.utcnow()
        
        self.db_session.commit()
        
        self.logger.info(f"Promoted {name}:{version} to {target_status.value}")
        
        return True
    
    async def delete_version(self, name: str, version: str) -> bool:
        """Delete model version (soft delete)"""
        
        db_version = await self.get_version(name, version)
        if not db_version:
            return False
        
        # Check if version is in production
        if db_version.status == ModelStatus.PRODUCTION.value:
            raise ValueError("Cannot delete production model version")
        
        db_version.is_active = False
        db_version.updated_at = datetime.utcnow()
        
        self.db_session.commit()
        
        self.logger.info(f"Deleted model version {name}:{version}")
        
        return True
    
    def _is_valid_version(self, version: str) -> bool:
        """Validate version format (semantic versioning)"""
        try:
            semver.VersionInfo.parse(version)
            return True
        except ValueError:
            return False
    
    def _is_valid_status_transition(self, current: ModelStatus, target: ModelStatus) -> bool:
        """Validate status transition"""
        
        valid_transitions = {
            ModelStatus.TRAINING: [ModelStatus.TRAINED, ModelStatus.FAILED],
            ModelStatus.TRAINED: [ModelStatus.VALIDATING, ModelStatus.STAGING, ModelStatus.ARCHIVED],
            ModelStatus.VALIDATING: [ModelStatus.VALIDATED, ModelStatus.FAILED],
            ModelStatus.VALIDATED: [ModelStatus.STAGING, ModelStatus.PRODUCTION],
            ModelStatus.STAGING: [ModelStatus.PRODUCTION, ModelStatus.ARCHIVED],
            ModelStatus.PRODUCTION: [ModelStatus.ARCHIVED, ModelStatus.DEPRECATED],
            ModelStatus.ARCHIVED: [ModelStatus.STAGING],
            ModelStatus.FAILED: [ModelStatus.TRAINING],
            ModelStatus.DEPRECATED: [ModelStatus.ARCHIVED]
        }
        
        return target in valid_transitions.get(current, [])
    
    def _calculate_model_hash(self, model: Any) -> str:
        """Calculate model hash"""
        
        # This is a simplified implementation
        # In practice, you'd want to hash the model parameters/weights
        model_str = str(model)
        return hashlib.sha256(model_str.encode()).hexdigest()
    
    def _calculate_code_hash(self) -> str:
        """Calculate code hash from git repository"""
        
        try:
            repo = Repo('.')
            return repo.head.object.hexsha
        except:
            return ""
    
    def _calculate_environment_hash(self) -> str:
        """Calculate environment hash"""
        
        # Hash of installed packages and versions
        try:
            result = subprocess.run(['pip', 'freeze'], capture_output=True, text=True)
            packages = result.stdout
            return hashlib.sha256(packages.encode()).hexdigest()
        except:
            return ""
    
    def _calculate_model_size(self, artifacts_path: str) -> int:
        """Calculate total size of model artifacts"""
        
        if artifacts_path.startswith('s3://'):
            # For S3, you'd need to calculate size differently
            return 0
        
        path = Path(artifacts_path)
        if path.is_file():
            return path.stat().st_size
        elif path.is_dir():
            return sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
        
        return 0
    
    def _get_parent_version_id(self, parent_version: str) -> Optional[str]:
        """Get parent version ID"""
        
        # Parse parent version (format: name:version)
        if ':' in parent_version:
            name, version = parent_version.split(':', 1)
            parent = self.db_session.query(ModelVersion).filter_by(
                name=name,
                version=version,
                is_active=True
            ).first()
            
            return str(parent.id) if parent else None
        
        return None


class ModelDeploymentManager:
    """Model deployment management"""
    
    def __init__(self, storage: ModelStorage, db_session: Session):
        self.storage = storage
        self.db_session = db_session
        self.logger = structlog.get_logger(__name__)
        
        # Initialize deployment clients
        self.docker_client = docker.from_env()
        
        try:
            k8s_config.load_incluster_config()
        except:
            try:
                k8s_config.load_kube_config()
            except:
                self.logger.warning("Kubernetes config not found")
        
        self.k8s_apps_v1 = client.AppsV1Api()
        self.k8s_core_v1 = client.CoreV1Api()
        
        # Setup metrics
        self.deployments_counter = Counter(
            'model_deployments_total',
            'Total model deployments',
            ['target', 'status']
        )
        
        self.deployment_duration = Histogram(
            'model_deployment_duration_seconds',
            'Model deployment duration'
        )
    
    async def deploy_model(self, model_version_id: str, 
                          config: DeploymentConfig) -> str:
        """Deploy model"""
        
        start_time = time.time()
        
        try:
            # Get model version
            db_version = self.db_session.query(ModelVersion).filter_by(
                id=model_version_id,
                is_active=True
            ).first()
            
            if not db_version:
                raise ValueError(f"Model version {model_version_id} not found")
            
            # Create deployment record
            deployment = ModelDeployment(
                model_version_id=model_version_id,
                name=config.name,
                target=config.target.value,
                status=DeploymentStatus.PENDING.value,
                configuration=json.dumps(asdict(config)),
                resource_requirements=json.dumps(config.resource_requirements),
                scaling_config=json.dumps(config.scaling_config)
            )
            
            self.db_session.add(deployment)
            self.db_session.commit()
            
            deployment_id = str(deployment.id)
            
            # Update status to deploying
            deployment.status = DeploymentStatus.DEPLOYING.value
            self.db_session.commit()
            
            # Deploy based on target
            if config.target == DeploymentTarget.DOCKER:
                endpoint_url = await self._deploy_docker(db_version, config, deployment_id)
            elif config.target == DeploymentTarget.KUBERNETES:
                endpoint_url = await self._deploy_kubernetes(db_version, config, deployment_id)
            elif config.target == DeploymentTarget.AWS_SAGEMAKER:
                endpoint_url = await self._deploy_sagemaker(db_version, config, deployment_id)
            else:
                raise NotImplementedError(f"Deployment target {config.target} not implemented")
            
            # Update deployment record
            deployment.status = DeploymentStatus.DEPLOYED.value
            deployment.endpoint_url = endpoint_url
            deployment.updated_at = datetime.utcnow()
            
            self.db_session.commit()
            
            # Update metrics
            duration = time.time() - start_time
            
            self.deployments_counter.labels(
                target=config.target.value,
                status=DeploymentStatus.DEPLOYED.value
            ).inc()
            
            self.deployment_duration.observe(duration)
            
            self.logger.info(f"Deployed model {db_version.name}:{db_version.version} to {config.target.value}")
            
            return deployment_id
            
        except Exception as e:
            # Update deployment status to failed
            if 'deployment' in locals():
                deployment.status = DeploymentStatus.FAILED.value
                deployment.updated_at = datetime.utcnow()
                self.db_session.commit()
            
            self.deployments_counter.labels(
                target=config.target.value,
                status=DeploymentStatus.FAILED.value
            ).inc()
            
            self.logger.error(f"Failed to deploy model: {str(e)}")
            raise
    
    async def _deploy_docker(self, model_version: ModelVersion, 
                           config: DeploymentConfig, deployment_id: str) -> str:
        """Deploy model using Docker"""
        
        # Create Dockerfile if not exists
        dockerfile_content = self._generate_dockerfile(model_version, config)
        
        # Build Docker image
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Copy model artifacts
            if model_version.artifacts_path.startswith('s3://'):
                # Download from S3
                await self._download_s3_artifacts(model_version.artifacts_path, temp_path)
            else:
                # Copy local artifacts
                shutil.copytree(model_version.artifacts_path, temp_path / "model")
            
            # Write Dockerfile
            dockerfile_path = temp_path / "Dockerfile"
            with open(dockerfile_path, 'w') as f:
                f.write(dockerfile_content)
            
            # Build image
            image_tag = f"{model_version.name}:{model_version.version}-{deployment_id[:8]}"
            
            self.docker_client.images.build(
                path=str(temp_path),
                tag=image_tag,
                rm=True
            )
            
            # Run container
            port = config.resource_requirements.get('port', 8000)
            
            container = self.docker_client.containers.run(
                image_tag,
                ports={f'{port}/tcp': port},
                environment=config.environment_variables,
                detach=True,
                name=f"{config.name}-{deployment_id[:8]}"
            )
            
            return f"http://localhost:{port}"
    
    async def _deploy_kubernetes(self, model_version: ModelVersion, 
                               config: DeploymentConfig, deployment_id: str) -> str:
        """Deploy model to Kubernetes"""
        
        namespace = config.resource_requirements.get('namespace', 'default')
        
        # Create deployment manifest
        deployment_manifest = self._generate_k8s_deployment(model_version, config, deployment_id)
        
        # Create service manifest
        service_manifest = self._generate_k8s_service(model_version, config, deployment_id)
        
        # Apply deployment
        self.k8s_apps_v1.create_namespaced_deployment(
            namespace=namespace,
            body=deployment_manifest
        )
        
        # Apply service
        service = self.k8s_core_v1.create_namespaced_service(
            namespace=namespace,
            body=service_manifest
        )
        
        # Wait for deployment to be ready
        await self._wait_for_k8s_deployment(deployment_manifest['metadata']['name'], namespace)
        
        # Return service URL
        if service.spec.type == 'LoadBalancer':
            # Wait for external IP
            external_ip = await self._wait_for_external_ip(service.metadata.name, namespace)
            port = service.spec.ports[0].port
            return f"http://{external_ip}:{port}"
        else:
            # ClusterIP service
            cluster_ip = service.spec.cluster_ip
            port = service.spec.ports[0].port
            return f"http://{cluster_ip}:{port}"
    
    async def _deploy_sagemaker(self, model_version: ModelVersion, 
                              config: DeploymentConfig, deployment_id: str) -> str:
        """Deploy model to AWS SageMaker"""
        
        sagemaker = boto3.client('sagemaker')
        
        # Create model
        model_name = f"{model_version.name}-{model_version.version}-{deployment_id[:8]}"
        
        # Upload model artifacts to S3 if not already there
        if not model_version.artifacts_path.startswith('s3://'):
            # Upload to S3
            model_artifacts_uri = await self._upload_to_s3(model_version.artifacts_path, model_name)
        else:
            model_artifacts_uri = model_version.artifacts_path
        
        # Create SageMaker model
        sagemaker.create_model(
            ModelName=model_name,
            PrimaryContainer={
                'Image': self._get_sagemaker_image(model_version.framework),
                'ModelDataUrl': model_artifacts_uri,
                'Environment': config.environment_variables
            },
            ExecutionRoleArn=config.resource_requirements.get('execution_role_arn')
        )
        
        # Create endpoint configuration
        endpoint_config_name = f"{model_name}-config"
        
        sagemaker.create_endpoint_config(
            EndpointConfigName=endpoint_config_name,
            ProductionVariants=[
                {
                    'VariantName': 'primary',
                    'ModelName': model_name,
                    'InitialInstanceCount': config.scaling_config.get('initial_instance_count', 1),
                    'InstanceType': config.resource_requirements.get('instance_type', 'ml.t2.medium'),
                    'InitialVariantWeight': 1
                }
            ]
        )
        
        # Create endpoint
        endpoint_name = f"{model_name}-endpoint"
        
        sagemaker.create_endpoint(
            EndpointName=endpoint_name,
            EndpointConfigName=endpoint_config_name
        )
        
        # Wait for endpoint to be in service
        waiter = sagemaker.get_waiter('endpoint_in_service')
        waiter.wait(EndpointName=endpoint_name)
        
        return f"https://runtime.sagemaker.{boto3.Session().region_name}.amazonaws.com/endpoints/{endpoint_name}/invocations"
    
    def _generate_dockerfile(self, model_version: ModelVersion, 
                           config: DeploymentConfig) -> str:
        """Generate Dockerfile for model deployment"""
        
        base_image = config.resource_requirements.get('base_image', 'python:3.9-slim')
        
        dockerfile = f"""
FROM {base_image}

WORKDIR /app

# Copy model artifacts
COPY model/ /app/model/

# Install requirements
COPY model/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy inference script
COPY model/inference.py /app/

# Expose port
EXPOSE {config.resource_requirements.get('port', 8000)}

# Set environment variables
"""
        
        for key, value in config.environment_variables.items():
            dockerfile += f"ENV {key}={value}\n"
        
        dockerfile += """
# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run inference server
CMD ["python", "inference.py"]
"""
        
        return dockerfile
    
    def _generate_k8s_deployment(self, model_version: ModelVersion, 
                               config: DeploymentConfig, deployment_id: str) -> Dict[str, Any]:
        """Generate Kubernetes deployment manifest"""
        
        return {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": f"{config.name}-{deployment_id[:8]}",
                "labels": {
                    "app": config.name,
                    "model": model_version.name,
                    "version": model_version.version
                }
            },
            "spec": {
                "replicas": config.scaling_config.get('replicas', 1),
                "selector": {
                    "matchLabels": {
                        "app": config.name
                    }
                },
                "template": {
                    "metadata": {
                        "labels": {
                            "app": config.name,
                            "model": model_version.name,
                            "version": model_version.version
                        }
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": "model-server",
                                "image": f"{model_version.name}:{model_version.version}-{deployment_id[:8]}",
                                "ports": [
                                    {
                                        "containerPort": config.resource_requirements.get('port', 8000)
                                    }
                                ],
                                "env": [
                                    {"name": k, "value": v} 
                                    for k, v in config.environment_variables.items()
                                ],
                                "resources": {
                                    "requests": {
                                        "cpu": config.resource_requirements.get('cpu_request', '100m'),
                                        "memory": config.resource_requirements.get('memory_request', '256Mi')
                                    },
                                    "limits": {
                                        "cpu": config.resource_requirements.get('cpu_limit', '500m'),
                                        "memory": config.resource_requirements.get('memory_limit', '512Mi')
                                    }
                                },
                                "livenessProbe": {
                                    "httpGet": {
                                        "path": "/health",
                                        "port": config.resource_requirements.get('port', 8000)
                                    },
                                    "initialDelaySeconds": 30,
                                    "periodSeconds": 10
                                },
                                "readinessProbe": {
                                    "httpGet": {
                                        "path": "/ready",
                                        "port": config.resource_requirements.get('port', 8000)
                                    },
                                    "initialDelaySeconds": 5,
                                    "periodSeconds": 5
                                }
                            }
                        ]
                    }
                }
            }
        }
    
    def _generate_k8s_service(self, model_version: ModelVersion, 
                            config: DeploymentConfig, deployment_id: str) -> Dict[str, Any]:
        """Generate Kubernetes service manifest"""
        
        return {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": f"{config.name}-service-{deployment_id[:8]}",
                "labels": {
                    "app": config.name
                }
            },
            "spec": {
                "selector": {
                    "app": config.name
                },
                "ports": [
                    {
                        "port": config.resource_requirements.get('port', 8000),
                        "targetPort": config.resource_requirements.get('port', 8000),
                        "protocol": "TCP"
                    }
                ],
                "type": config.resource_requirements.get('service_type', 'ClusterIP')
            }
        }
    
    async def _wait_for_k8s_deployment(self, deployment_name: str, namespace: str, 
                                     timeout: int = 300):
        """Wait for Kubernetes deployment to be ready"""
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            deployment = self.k8s_apps_v1.read_namespaced_deployment(
                name=deployment_name,
                namespace=namespace
            )
            
            if (deployment.status.ready_replicas and 
                deployment.status.ready_replicas == deployment.spec.replicas):
                return
            
            await asyncio.sleep(5)
        
        raise TimeoutError(f"Deployment {deployment_name} not ready after {timeout} seconds")
    
    async def _wait_for_external_ip(self, service_name: str, namespace: str, 
                                  timeout: int = 300) -> str:
        """Wait for external IP assignment"""
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            service = self.k8s_core_v1.read_namespaced_service(
                name=service_name,
                namespace=namespace
            )
            
            if (service.status.load_balancer and 
                service.status.load_balancer.ingress):
                ingress = service.status.load_balancer.ingress[0]
                return ingress.ip or ingress.hostname
            
            await asyncio.sleep(10)
        
        raise TimeoutError(f"External IP not assigned to service {service_name} after {timeout} seconds")
    
    def _get_sagemaker_image(self, framework: str) -> str:
        """Get SageMaker container image for framework"""
        
        # These are example images - use actual SageMaker container images
        images = {
            'sklearn': '246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-scikit-learn:0.23-1-cpu-py3',
            'pytorch': '246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-pytorch-inference:1.8.1-cpu-py3',
            'tensorflow': '246618743249.dkr.ecr.us-west-2.amazonaws.com/sagemaker-tensorflow-serving:2.4.1-cpu'
        }
        
        return images.get(framework, images['sklearn'])


class ModelVersioningSystem:
    """Main model versioning and deployment system"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize database
        db_url = config.get('database_url', 'sqlite:///models.db')
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db_session = SessionLocal()
        
        # Initialize storage
        storage_config = config.get('storage', {})
        storage_backend = StorageBackend(storage_config.get('backend', 'local'))
        self.storage = ModelStorage(storage_backend, storage_config)
        
        # Initialize managers
        self.version_manager = ModelVersionManager(self.storage, self.db_session)
        self.deployment_manager = ModelDeploymentManager(self.storage, self.db_session)
        
        # Setup FastAPI app
        self.app = FastAPI(title="Model Versioning System", version="1.0.0")
        self._setup_routes()
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.post("/models/{name}/versions")
        async def create_model_version(
            name: str,
            version: str,
            framework: str,
            description: str = "",
            tags: List[str] = [],
            metrics: Dict[str, float] = {},
            parameters: Dict[str, Any] = {}
        ):
            """Create new model version"""
            
            # This is a simplified endpoint - in practice, you'd upload the model file
            metadata = ModelMetadata(
                name=name,
                version=version,
                framework=ModelFramework(framework),
                description=description,
                tags=tags,
                metrics=metrics,
                parameters=parameters
            )
            
            # Dummy model for example
            model = {"type": "dummy", "framework": framework}
            artifacts = ModelArtifacts(
                model_file="model.pkl",
                metadata_file="metadata.json",
                requirements_file="requirements.txt"
            )
            
            version_id = await self.version_manager.create_version(model, metadata, artifacts)
            
            return {"version_id": version_id, "status": "created"}
        
        @self.app.get("/models/{name}/versions")
        async def list_model_versions(name: str, limit: int = 50):
            """List model versions"""
            
            versions = await self.version_manager.list_versions(name, limit)
            
            return {
                "versions": [
                    {
                        "id": str(v.id),
                        "version": v.version,
                        "status": v.status,
                        "created_at": v.created_at.isoformat(),
                        "metrics": json.loads(v.metrics) if v.metrics else {}
                    }
                    for v in versions
                ]
            }
        
        @self.app.post("/models/{name}/versions/{version}/promote")
        async def promote_model_version(name: str, version: str, target_status: str):
            """Promote model version"""
            
            success = await self.version_manager.promote_version(
                name, version, ModelStatus(target_status)
            )
            
            return {"success": success, "status": target_status}
        
        @self.app.post("/deployments")
        async def deploy_model(
            model_version_id: str,
            deployment_name: str,
            target: str,
            resource_requirements: Dict[str, Any] = {},
            scaling_config: Dict[str, Any] = {},
            environment_variables: Dict[str, str] = {}
        ):
            """Deploy model"""
            
            config = DeploymentConfig(
                name=deployment_name,
                target=DeploymentTarget(target),
                resource_requirements=resource_requirements,
                scaling_config=scaling_config,
                environment_variables=environment_variables
            )
            
            deployment_id = await self.deployment_manager.deploy_model(model_version_id, config)
            
            return {"deployment_id": deployment_id, "status": "deploying"}
        
        @self.app.get("/deployments/{deployment_id}")
        async def get_deployment(deployment_id: str):
            """Get deployment status"""
            
            deployment = self.db_session.query(ModelDeployment).filter_by(
                id=deployment_id,
                is_active=True
            ).first()
            
            if not deployment:
                raise HTTPException(status_code=404, detail="Deployment not found")
            
            return {
                "id": str(deployment.id),
                "name": deployment.name,
                "status": deployment.status,
                "endpoint_url": deployment.endpoint_url,
                "created_at": deployment.created_at.isoformat(),
                "updated_at": deployment.updated_at.isoformat()
            }
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
        
        @self.app.get("/metrics")
        async def get_metrics():
            """Prometheus metrics endpoint"""
            return Response(generate_latest(), media_type="text/plain")


# Example usage
if __name__ == "__main__":
    import uvicorn
    
    # Configuration
    config = {
        "database_url": "sqlite:///models.db",
        "storage": {
            "backend": "local",
            "base_path": "model_storage"
        }
    }
    
    # Initialize system
    system = ModelVersioningSystem(config)
    
    # Run FastAPI app
    uvicorn.run(system.app, host="0.0.0.0", port=8000)