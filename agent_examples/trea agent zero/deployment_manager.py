"""
Advanced Deployment and Orchestration Manager for Cognitive AI Framework
Supports Docker, Kubernetes, and cloud deployment strategies
"""

import os
import json
import yaml
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
import subprocess
import tempfile
import shutil
from enum import Enum
import docker
from kubernetes import client, config as k8s_config
import boto3
from azure.identity import DefaultAzureCredential
from azure.mgmt.containerinstance import ContainerInstanceManagementClient
from google.cloud import container_v1
import requests


class DeploymentTarget(Enum):
    """Deployment target types"""
    LOCAL = "local"
    DOCKER = "docker"
    KUBERNETES = "kubernetes"
    AWS_ECS = "aws_ecs"
    AWS_LAMBDA = "aws_lambda"
    AZURE_CONTAINER = "azure_container"
    GOOGLE_CLOUD_RUN = "google_cloud_run"
    HEROKU = "heroku"


class ServiceType(Enum):
    """Service types in the AI framework"""
    COGNITIVE_API = "cognitive_api"
    CONSCIOUSNESS_SERVICE = "consciousness_service"
    EMOTIONAL_AI = "emotional_ai"
    VECTOR_DATABASE = "vector_database"
    MONITORING = "monitoring"
    LOAD_BALANCER = "load_balancer"


@dataclass
class ServiceConfig:
    """Configuration for a service deployment"""
    name: str
    service_type: ServiceType
    image: str = ""
    port: int = 8000
    replicas: int = 1
    cpu_request: str = "100m"
    cpu_limit: str = "500m"
    memory_request: str = "128Mi"
    memory_limit: str = "512Mi"
    environment_vars: Dict[str, str] = field(default_factory=dict)
    volumes: List[Dict[str, str]] = field(default_factory=list)
    health_check_path: str = "/health"
    dependencies: List[str] = field(default_factory=list)
    scaling_config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DeploymentConfig:
    """Complete deployment configuration"""
    name: str
    target: DeploymentTarget
    namespace: str = "cognitive-ai"
    services: List[ServiceConfig] = field(default_factory=list)
    ingress_config: Dict[str, Any] = field(default_factory=dict)
    monitoring_config: Dict[str, Any] = field(default_factory=dict)
    secrets: Dict[str, str] = field(default_factory=dict)
    config_maps: Dict[str, Dict[str, str]] = field(default_factory=dict)


class DockerManager:
    """Docker deployment management"""
    
    def __init__(self):
        self.client = docker.from_env()
        self.logger = logging.getLogger(__name__)
    
    def build_image(self, service_config: ServiceConfig, dockerfile_path: str, 
                   context_path: str = ".") -> str:
        """Build Docker image for a service"""
        try:
            image_tag = f"{service_config.name}:latest"
            
            self.logger.info(f"Building Docker image: {image_tag}")
            
            image, logs = self.client.images.build(
                path=context_path,
                dockerfile=dockerfile_path,
                tag=image_tag,
                rm=True,
                forcerm=True
            )
            
            for log in logs:
                if 'stream' in log:
                    self.logger.debug(log['stream'].strip())
            
            self.logger.info(f"Successfully built image: {image_tag}")
            return image_tag
            
        except Exception as e:
            self.logger.error(f"Failed to build Docker image: {e}")
            raise
    
    def run_container(self, service_config: ServiceConfig) -> str:
        """Run a Docker container"""
        try:
            container_name = f"{service_config.name}-container"
            
            # Stop and remove existing container if it exists
            try:
                existing = self.client.containers.get(container_name)
                existing.stop()
                existing.remove()
            except docker.errors.NotFound:
                pass
            
            # Prepare port mapping
            ports = {f"{service_config.port}/tcp": service_config.port}
            
            # Run container
            container = self.client.containers.run(
                service_config.image,
                name=container_name,
                ports=ports,
                environment=service_config.environment_vars,
                detach=True,
                restart_policy={"Name": "unless-stopped"}
            )
            
            self.logger.info(f"Started container: {container_name}")
            return container.id
            
        except Exception as e:
            self.logger.error(f"Failed to run container: {e}")
            raise
    
    def stop_container(self, container_name: str) -> None:
        """Stop a Docker container"""
        try:
            container = self.client.containers.get(container_name)
            container.stop()
            container.remove()
            self.logger.info(f"Stopped container: {container_name}")
        except docker.errors.NotFound:
            self.logger.warning(f"Container not found: {container_name}")
        except Exception as e:
            self.logger.error(f"Failed to stop container: {e}")
            raise
    
    def get_container_logs(self, container_name: str) -> str:
        """Get logs from a Docker container"""
        try:
            container = self.client.containers.get(container_name)
            return container.logs().decode('utf-8')
        except Exception as e:
            self.logger.error(f"Failed to get container logs: {e}")
            return ""


class KubernetesManager:
    """Kubernetes deployment management"""
    
    def __init__(self, kubeconfig_path: Optional[str] = None):
        try:
            if kubeconfig_path:
                k8s_config.load_kube_config(config_file=kubeconfig_path)
            else:
                k8s_config.load_incluster_config()
        except:
            k8s_config.load_kube_config()
        
        self.apps_v1 = client.AppsV1Api()
        self.core_v1 = client.CoreV1Api()
        self.networking_v1 = client.NetworkingV1Api()
        self.autoscaling_v1 = client.AutoscalingV1Api()
        self.logger = logging.getLogger(__name__)
    
    def create_namespace(self, namespace: str) -> None:
        """Create Kubernetes namespace"""
        try:
            namespace_obj = client.V1Namespace(
                metadata=client.V1ObjectMeta(name=namespace)
            )
            self.core_v1.create_namespace(namespace_obj)
            self.logger.info(f"Created namespace: {namespace}")
        except client.exceptions.ApiException as e:
            if e.status == 409:  # Already exists
                self.logger.info(f"Namespace already exists: {namespace}")
            else:
                raise
    
    def deploy_service(self, service_config: ServiceConfig, namespace: str) -> None:
        """Deploy a service to Kubernetes"""
        try:
            # Create deployment
            deployment = self._create_deployment_manifest(service_config)
            self.apps_v1.create_namespaced_deployment(
                namespace=namespace,
                body=deployment
            )
            
            # Create service
            service = self._create_service_manifest(service_config)
            self.core_v1.create_namespaced_service(
                namespace=namespace,
                body=service
            )
            
            # Create HPA if scaling config is provided
            if service_config.scaling_config:
                hpa = self._create_hpa_manifest(service_config)
                self.autoscaling_v1.create_namespaced_horizontal_pod_autoscaler(
                    namespace=namespace,
                    body=hpa
                )
            
            self.logger.info(f"Deployed service: {service_config.name}")
            
        except Exception as e:
            self.logger.error(f"Failed to deploy service: {e}")
            raise
    
    def _create_deployment_manifest(self, service_config: ServiceConfig) -> client.V1Deployment:
        """Create Kubernetes deployment manifest"""
        container = client.V1Container(
            name=service_config.name,
            image=service_config.image,
            ports=[client.V1ContainerPort(container_port=service_config.port)],
            env=[
                client.V1EnvVar(name=k, value=v)
                for k, v in service_config.environment_vars.items()
            ],
            resources=client.V1ResourceRequirements(
                requests={
                    "cpu": service_config.cpu_request,
                    "memory": service_config.memory_request
                },
                limits={
                    "cpu": service_config.cpu_limit,
                    "memory": service_config.memory_limit
                }
            ),
            liveness_probe=client.V1Probe(
                http_get=client.V1HTTPGetAction(
                    path=service_config.health_check_path,
                    port=service_config.port
                ),
                initial_delay_seconds=30,
                period_seconds=10
            ),
            readiness_probe=client.V1Probe(
                http_get=client.V1HTTPGetAction(
                    path=service_config.health_check_path,
                    port=service_config.port
                ),
                initial_delay_seconds=5,
                period_seconds=5
            )
        )
        
        template = client.V1PodTemplateSpec(
            metadata=client.V1ObjectMeta(
                labels={"app": service_config.name}
            ),
            spec=client.V1PodSpec(containers=[container])
        )
        
        spec = client.V1DeploymentSpec(
            replicas=service_config.replicas,
            selector=client.V1LabelSelector(
                match_labels={"app": service_config.name}
            ),
            template=template
        )
        
        return client.V1Deployment(
            api_version="apps/v1",
            kind="Deployment",
            metadata=client.V1ObjectMeta(name=service_config.name),
            spec=spec
        )
    
    def _create_service_manifest(self, service_config: ServiceConfig) -> client.V1Service:
        """Create Kubernetes service manifest"""
        spec = client.V1ServiceSpec(
            selector={"app": service_config.name},
            ports=[client.V1ServicePort(
                port=service_config.port,
                target_port=service_config.port
            )],
            type="ClusterIP"
        )
        
        return client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=client.V1ObjectMeta(name=service_config.name),
            spec=spec
        )
    
    def _create_hpa_manifest(self, service_config: ServiceConfig) -> client.V1HorizontalPodAutoscaler:
        """Create Horizontal Pod Autoscaler manifest"""
        spec = client.V1HorizontalPodAutoscalerSpec(
            scale_target_ref=client.V1CrossVersionObjectReference(
                api_version="apps/v1",
                kind="Deployment",
                name=service_config.name
            ),
            min_replicas=service_config.scaling_config.get("min_replicas", 1),
            max_replicas=service_config.scaling_config.get("max_replicas", 10),
            target_cpu_utilization_percentage=service_config.scaling_config.get("target_cpu", 70)
        )
        
        return client.V1HorizontalPodAutoscaler(
            api_version="autoscaling/v1",
            kind="HorizontalPodAutoscaler",
            metadata=client.V1ObjectMeta(name=f"{service_config.name}-hpa"),
            spec=spec
        )
    
    def delete_service(self, service_name: str, namespace: str) -> None:
        """Delete a service from Kubernetes"""
        try:
            # Delete deployment
            self.apps_v1.delete_namespaced_deployment(
                name=service_name,
                namespace=namespace
            )
            
            # Delete service
            self.core_v1.delete_namespaced_service(
                name=service_name,
                namespace=namespace
            )
            
            # Delete HPA if exists
            try:
                self.autoscaling_v1.delete_namespaced_horizontal_pod_autoscaler(
                    name=f"{service_name}-hpa",
                    namespace=namespace
                )
            except client.exceptions.ApiException:
                pass  # HPA might not exist
            
            self.logger.info(f"Deleted service: {service_name}")
            
        except Exception as e:
            self.logger.error(f"Failed to delete service: {e}")
            raise
    
    def get_service_status(self, service_name: str, namespace: str) -> Dict[str, Any]:
        """Get status of a deployed service"""
        try:
            deployment = self.apps_v1.read_namespaced_deployment(
                name=service_name,
                namespace=namespace
            )
            
            pods = self.core_v1.list_namespaced_pod(
                namespace=namespace,
                label_selector=f"app={service_name}"
            )
            
            return {
                "name": service_name,
                "replicas": {
                    "desired": deployment.spec.replicas,
                    "ready": deployment.status.ready_replicas or 0,
                    "available": deployment.status.available_replicas or 0
                },
                "pods": [
                    {
                        "name": pod.metadata.name,
                        "status": pod.status.phase,
                        "ready": all(
                            condition.status == "True"
                            for condition in pod.status.conditions or []
                            if condition.type == "Ready"
                        )
                    }
                    for pod in pods.items
                ]
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get service status: {e}")
            return {"error": str(e)}


class CloudDeploymentManager:
    """Cloud-specific deployment management"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def deploy_to_aws_ecs(self, deployment_config: DeploymentConfig) -> Dict[str, Any]:
        """Deploy to AWS ECS"""
        try:
            ecs_client = boto3.client('ecs')
            
            # Create cluster if it doesn't exist
            cluster_name = deployment_config.name
            try:
                ecs_client.create_cluster(clusterName=cluster_name)
            except ecs_client.exceptions.ClusterAlreadyExistsException:
                pass
            
            # Deploy each service
            deployed_services = []
            for service_config in deployment_config.services:
                task_definition = self._create_ecs_task_definition(service_config)
                
                # Register task definition
                response = ecs_client.register_task_definition(**task_definition)
                task_def_arn = response['taskDefinition']['taskDefinitionArn']
                
                # Create service
                service_response = ecs_client.create_service(
                    cluster=cluster_name,
                    serviceName=service_config.name,
                    taskDefinition=task_def_arn,
                    desiredCount=service_config.replicas
                )
                
                deployed_services.append({
                    "name": service_config.name,
                    "arn": service_response['service']['serviceArn']
                })
            
            return {
                "cluster": cluster_name,
                "services": deployed_services
            }
            
        except Exception as e:
            self.logger.error(f"Failed to deploy to AWS ECS: {e}")
            raise
    
    def _create_ecs_task_definition(self, service_config: ServiceConfig) -> Dict[str, Any]:
        """Create ECS task definition"""
        return {
            "family": service_config.name,
            "networkMode": "awsvpc",
            "requiresCompatibilities": ["FARGATE"],
            "cpu": "256",
            "memory": "512",
            "containerDefinitions": [
                {
                    "name": service_config.name,
                    "image": service_config.image,
                    "portMappings": [
                        {
                            "containerPort": service_config.port,
                            "protocol": "tcp"
                        }
                    ],
                    "environment": [
                        {"name": k, "value": v}
                        for k, v in service_config.environment_vars.items()
                    ],
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": f"/ecs/{service_config.name}",
                            "awslogs-region": "us-east-1",
                            "awslogs-stream-prefix": "ecs"
                        }
                    }
                }
            ]
        }


class DeploymentManager:
    """Main deployment orchestration manager"""
    
    def __init__(self):
        self.docker_manager = DockerManager()
        self.k8s_manager = None
        self.cloud_manager = CloudDeploymentManager()
        self.logger = logging.getLogger(__name__)
        
        # Try to initialize Kubernetes manager
        try:
            self.k8s_manager = KubernetesManager()
        except Exception:
            self.logger.warning("Kubernetes not available")
    
    async def deploy(self, deployment_config: DeploymentConfig) -> Dict[str, Any]:
        """Deploy the AI framework based on configuration"""
        try:
            self.logger.info(f"Starting deployment: {deployment_config.name}")
            
            if deployment_config.target == DeploymentTarget.DOCKER:
                return await self._deploy_docker(deployment_config)
            elif deployment_config.target == DeploymentTarget.KUBERNETES:
                return await self._deploy_kubernetes(deployment_config)
            elif deployment_config.target == DeploymentTarget.AWS_ECS:
                return await self.cloud_manager.deploy_to_aws_ecs(deployment_config)
            else:
                raise ValueError(f"Unsupported deployment target: {deployment_config.target}")
                
        except Exception as e:
            self.logger.error(f"Deployment failed: {e}")
            raise
    
    async def _deploy_docker(self, deployment_config: DeploymentConfig) -> Dict[str, Any]:
        """Deploy using Docker"""
        deployed_containers = []
        
        for service_config in deployment_config.services:
            # Build image if needed
            if not service_config.image:
                dockerfile_path = f"docker/{service_config.service_type.value}/Dockerfile"
                service_config.image = self.docker_manager.build_image(
                    service_config, dockerfile_path
                )
            
            # Run container
            container_id = self.docker_manager.run_container(service_config)
            deployed_containers.append({
                "name": service_config.name,
                "container_id": container_id,
                "port": service_config.port
            })
        
        return {
            "deployment_type": "docker",
            "containers": deployed_containers
        }
    
    async def _deploy_kubernetes(self, deployment_config: DeploymentConfig) -> Dict[str, Any]:
        """Deploy using Kubernetes"""
        if not self.k8s_manager:
            raise RuntimeError("Kubernetes not available")
        
        # Create namespace
        self.k8s_manager.create_namespace(deployment_config.namespace)
        
        # Deploy services
        deployed_services = []
        for service_config in deployment_config.services:
            self.k8s_manager.deploy_service(service_config, deployment_config.namespace)
            deployed_services.append(service_config.name)
        
        return {
            "deployment_type": "kubernetes",
            "namespace": deployment_config.namespace,
            "services": deployed_services
        }
    
    def create_deployment_manifests(self, deployment_config: DeploymentConfig, 
                                  output_dir: str = "manifests") -> None:
        """Create deployment manifests for the AI framework"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Create Docker Compose file
        self._create_docker_compose(deployment_config, output_path)
        
        # Create Kubernetes manifests
        self._create_kubernetes_manifests(deployment_config, output_path)
        
        # Create Dockerfiles
        self._create_dockerfiles(deployment_config, output_path)
        
        self.logger.info(f"Deployment manifests created in: {output_path}")
    
    def _create_docker_compose(self, deployment_config: DeploymentConfig, 
                              output_path: Path) -> None:
        """Create Docker Compose file"""
        compose_config = {
            "version": "3.8",
            "services": {},
            "networks": {
                "cognitive-ai": {
                    "driver": "bridge"
                }
            }
        }
        
        for service_config in deployment_config.services:
            compose_config["services"][service_config.name] = {
                "build": {
                    "context": ".",
                    "dockerfile": f"docker/{service_config.service_type.value}/Dockerfile"
                },
                "ports": [f"{service_config.port}:{service_config.port}"],
                "environment": service_config.environment_vars,
                "networks": ["cognitive-ai"],
                "restart": "unless-stopped"
            }
            
            if service_config.dependencies:
                compose_config["services"][service_config.name]["depends_on"] = service_config.dependencies
        
        with open(output_path / "docker-compose.yml", 'w') as f:
            yaml.dump(compose_config, f, default_flow_style=False)
    
    def _create_kubernetes_manifests(self, deployment_config: DeploymentConfig, 
                                   output_path: Path) -> None:
        """Create Kubernetes manifest files"""
        k8s_path = output_path / "kubernetes"
        k8s_path.mkdir(exist_ok=True)
        
        # Create namespace manifest
        namespace_manifest = {
            "apiVersion": "v1",
            "kind": "Namespace",
            "metadata": {
                "name": deployment_config.namespace
            }
        }
        
        with open(k8s_path / "namespace.yaml", 'w') as f:
            yaml.dump(namespace_manifest, f)
        
        # Create service manifests
        for service_config in deployment_config.services:
            manifests = []
            
            # Deployment manifest
            deployment_manifest = {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {
                    "name": service_config.name,
                    "namespace": deployment_config.namespace
                },
                "spec": {
                    "replicas": service_config.replicas,
                    "selector": {
                        "matchLabels": {
                            "app": service_config.name
                        }
                    },
                    "template": {
                        "metadata": {
                            "labels": {
                                "app": service_config.name
                            }
                        },
                        "spec": {
                            "containers": [
                                {
                                    "name": service_config.name,
                                    "image": service_config.image or f"{service_config.name}:latest",
                                    "ports": [
                                        {
                                            "containerPort": service_config.port
                                        }
                                    ],
                                    "env": [
                                        {"name": k, "value": v}
                                        for k, v in service_config.environment_vars.items()
                                    ],
                                    "resources": {
                                        "requests": {
                                            "cpu": service_config.cpu_request,
                                            "memory": service_config.memory_request
                                        },
                                        "limits": {
                                            "cpu": service_config.cpu_limit,
                                            "memory": service_config.memory_limit
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
            manifests.append(deployment_manifest)
            
            # Service manifest
            service_manifest = {
                "apiVersion": "v1",
                "kind": "Service",
                "metadata": {
                    "name": service_config.name,
                    "namespace": deployment_config.namespace
                },
                "spec": {
                    "selector": {
                        "app": service_config.name
                    },
                    "ports": [
                        {
                            "port": service_config.port,
                            "targetPort": service_config.port
                        }
                    ],
                    "type": "ClusterIP"
                }
            }
            manifests.append(service_manifest)
            
            # Write manifests to file
            with open(k8s_path / f"{service_config.name}.yaml", 'w') as f:
                yaml.dump_all(manifests, f, default_flow_style=False)
    
    def _create_dockerfiles(self, deployment_config: DeploymentConfig, 
                           output_path: Path) -> None:
        """Create Dockerfile templates"""
        docker_path = output_path / "docker"
        docker_path.mkdir(exist_ok=True)
        
        dockerfile_templates = {
            ServiceType.COGNITIVE_API: """
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "cognitive_api:app", "--host", "0.0.0.0", "--port", "8000"]
""",
            ServiceType.EMOTIONAL_AI: """
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    libsndfile1 \\
    ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["python", "-m", "uvicorn", "emotional_api:app", "--host", "0.0.0.0", "--port", "8001"]
""",
            ServiceType.CONSCIOUSNESS_SERVICE: """
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["python", "-m", "uvicorn", "consciousness_api:app", "--host", "0.0.0.0", "--port", "8002"]
""",
            ServiceType.VECTOR_DATABASE: """
FROM qdrant/qdrant:latest

EXPOSE 6333

CMD ["./qdrant"]
""",
            ServiceType.MONITORING: """
FROM prom/prometheus:latest

COPY prometheus.yml /etc/prometheus/

EXPOSE 9090

CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--web.console.libraries=/etc/prometheus/console_libraries", "--web.console.templates=/etc/prometheus/consoles"]
"""
        }
        
        for service_config in deployment_config.services:
            service_docker_path = docker_path / service_config.service_type.value
            service_docker_path.mkdir(exist_ok=True)
            
            dockerfile_content = dockerfile_templates.get(
                service_config.service_type,
                dockerfile_templates[ServiceType.COGNITIVE_API]
            )
            
            with open(service_docker_path / "Dockerfile", 'w') as f:
                f.write(dockerfile_content.strip())


def create_default_deployment_config() -> DeploymentConfig:
    """Create a default deployment configuration"""
    services = [
        ServiceConfig(
            name="cognitive-api",
            service_type=ServiceType.COGNITIVE_API,
            port=8000,
            replicas=2,
            environment_vars={
                "ENVIRONMENT": "production",
                "LOG_LEVEL": "INFO"
            },
            scaling_config={
                "min_replicas": 1,
                "max_replicas": 5,
                "target_cpu": 70
            }
        ),
        ServiceConfig(
            name="emotional-ai",
            service_type=ServiceType.EMOTIONAL_AI,
            port=8001,
            replicas=2,
            environment_vars={
                "ENVIRONMENT": "production",
                "LOG_LEVEL": "INFO"
            }
        ),
        ServiceConfig(
            name="consciousness-service",
            service_type=ServiceType.CONSCIOUSNESS_SERVICE,
            port=8002,
            replicas=1,
            environment_vars={
                "ENVIRONMENT": "production",
                "LOG_LEVEL": "INFO"
            }
        ),
        ServiceConfig(
            name="vector-db",
            service_type=ServiceType.VECTOR_DATABASE,
            port=6333,
            replicas=1,
            cpu_request="200m",
            cpu_limit="1000m",
            memory_request="512Mi",
            memory_limit="2Gi"
        ),
        ServiceConfig(
            name="monitoring",
            service_type=ServiceType.MONITORING,
            port=9090,
            replicas=1
        )
    ]
    
    return DeploymentConfig(
        name="cognitive-ai-framework",
        target=DeploymentTarget.KUBERNETES,
        namespace="cognitive-ai",
        services=services
    )


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Deployment Manager")
    parser.add_argument("--create-manifests", action="store_true",
                       help="Create deployment manifests")
    parser.add_argument("--deploy", choices=["docker", "kubernetes", "aws"],
                       help="Deploy to specified target")
    parser.add_argument("--config", type=str,
                       help="Path to deployment configuration file")
    parser.add_argument("--output-dir", type=str, default="manifests",
                       help="Output directory for manifests")
    
    args = parser.parse_args()
    
    # Create deployment manager
    manager = DeploymentManager()
    
    # Load or create configuration
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config_data = yaml.safe_load(f)
        # Convert to DeploymentConfig object (simplified)
        deployment_config = create_default_deployment_config()
    else:
        deployment_config = create_default_deployment_config()
    
    if args.create_manifests:
        manager.create_deployment_manifests(deployment_config, args.output_dir)
        print(f"Deployment manifests created in: {args.output_dir}")
    
    if args.deploy:
        if args.deploy == "docker":
            deployment_config.target = DeploymentTarget.DOCKER
        elif args.deploy == "kubernetes":
            deployment_config.target = DeploymentTarget.KUBERNETES
        elif args.deploy == "aws":
            deployment_config.target = DeploymentTarget.AWS_ECS
        
        # Run deployment
        asyncio.run(manager.deploy(deployment_config))