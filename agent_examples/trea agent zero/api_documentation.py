"""
Advanced API Documentation and Testing System
Provides comprehensive API documentation, testing, and validation capabilities
"""

import os
import json
import yaml
import asyncio
import aiohttp
import time
import statistics
from typing import Dict, List, Optional, Any, Union, Callable, Type
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import structlog
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator
import pytest
import requests
from jinja2 import Template, Environment, FileSystemLoader
import markdown
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import subprocess
import tempfile
import shutil
from urllib.parse import urljoin, urlparse
import re
from jsonschema import validate, ValidationError
import openapi_spec_validator
from openapi_spec_validator.readers import read_from_filename
from openapi_spec_validator.validation.exceptions import OpenAPIValidationError


class TestType(Enum):
    """Test types"""
    UNIT = "unit"
    INTEGRATION = "integration"
    LOAD = "load"
    SECURITY = "security"
    FUNCTIONAL = "functional"
    SMOKE = "smoke"
    REGRESSION = "regression"


class TestStatus(Enum):
    """Test execution status"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class HTTPMethod(Enum):
    """HTTP methods"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"


@dataclass
class APIEndpoint:
    """API endpoint definition"""
    path: str
    method: HTTPMethod
    summary: str
    description: str = ""
    tags: List[str] = field(default_factory=list)
    parameters: List[Dict[str, Any]] = field(default_factory=list)
    request_body: Optional[Dict[str, Any]] = None
    responses: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    security: List[Dict[str, Any]] = field(default_factory=list)
    deprecated: bool = False
    examples: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class TestCase:
    """Test case definition"""
    id: str
    name: str
    description: str
    test_type: TestType
    endpoint: APIEndpoint
    test_data: Dict[str, Any] = field(default_factory=dict)
    expected_status: int = 200
    expected_response: Optional[Dict[str, Any]] = None
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30
    retry_count: int = 0
    prerequisites: List[str] = field(default_factory=list)
    cleanup: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)


@dataclass
class TestResult:
    """Test execution result"""
    test_case_id: str
    status: TestStatus
    execution_time: float
    timestamp: datetime
    request_data: Dict[str, Any] = field(default_factory=dict)
    response_data: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    assertions: List[Dict[str, Any]] = field(default_factory=list)
    performance_metrics: Dict[str, float] = field(default_factory=dict)


@dataclass
class LoadTestConfig:
    """Load test configuration"""
    concurrent_users: int = 10
    duration_seconds: int = 60
    ramp_up_seconds: int = 10
    requests_per_second: int = 100
    think_time_seconds: float = 1.0
    scenarios: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class DocumentationConfig:
    """Documentation configuration"""
    title: str = "AI Framework API"
    version: str = "1.0.0"
    description: str = "Advanced AI Framework API Documentation"
    contact: Dict[str, str] = field(default_factory=dict)
    license: Dict[str, str] = field(default_factory=dict)
    servers: List[Dict[str, str]] = field(default_factory=list)
    theme: str = "default"
    include_examples: bool = True
    include_schemas: bool = True
    generate_postman: bool = True
    generate_insomnia: bool = True


class OpenAPIGenerator:
    """OpenAPI specification generator"""
    
    def __init__(self, config: DocumentationConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.endpoints: List[APIEndpoint] = []
        self.schemas: Dict[str, Any] = {}
        self.security_schemes: Dict[str, Any] = {}
    
    def add_endpoint(self, endpoint: APIEndpoint):
        """Add endpoint to documentation"""
        self.endpoints.append(endpoint)
    
    def add_schema(self, name: str, schema: Dict[str, Any]):
        """Add schema definition"""
        self.schemas[name] = schema
    
    def add_security_scheme(self, name: str, scheme: Dict[str, Any]):
        """Add security scheme"""
        self.security_schemes[name] = scheme
    
    def generate_openapi_spec(self) -> Dict[str, Any]:
        """Generate OpenAPI 3.0 specification"""
        
        spec = {
            "openapi": "3.0.3",
            "info": {
                "title": self.config.title,
                "version": self.config.version,
                "description": self.config.description
            },
            "servers": self.config.servers or [{"url": "http://localhost:8000"}],
            "paths": {},
            "components": {
                "schemas": self.schemas,
                "securitySchemes": self.security_schemes
            }
        }
        
        # Add contact and license if provided
        if self.config.contact:
            spec["info"]["contact"] = self.config.contact
        
        if self.config.license:
            spec["info"]["license"] = self.config.license
        
        # Generate paths
        for endpoint in self.endpoints:
            path = endpoint.path
            method = endpoint.method.value.lower()
            
            if path not in spec["paths"]:
                spec["paths"][path] = {}
            
            operation = {
                "summary": endpoint.summary,
                "description": endpoint.description,
                "tags": endpoint.tags,
                "responses": endpoint.responses or {"200": {"description": "Success"}}
            }
            
            # Add parameters
            if endpoint.parameters:
                operation["parameters"] = endpoint.parameters
            
            # Add request body
            if endpoint.request_body:
                operation["requestBody"] = endpoint.request_body
            
            # Add security
            if endpoint.security:
                operation["security"] = endpoint.security
            
            # Add deprecation
            if endpoint.deprecated:
                operation["deprecated"] = True
            
            spec["paths"][path][method] = operation
        
        return spec
    
    def validate_spec(self, spec: Dict[str, Any]) -> List[str]:
        """Validate OpenAPI specification"""
        errors = []
        
        try:
            # Write spec to temporary file for validation
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
                yaml.dump(spec, f)
                temp_file = f.name
            
            try:
                openapi_spec_validator.validate_spec(read_from_filename(temp_file))
            except OpenAPIValidationError as e:
                errors.append(str(e))
            finally:
                os.unlink(temp_file)
                
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
        
        return errors
    
    def generate_postman_collection(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Postman collection from OpenAPI spec"""
        
        collection = {
            "info": {
                "name": spec["info"]["title"],
                "description": spec["info"]["description"],
                "version": spec["info"]["version"],
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            "item": [],
            "variable": []
        }
        
        # Add server variables
        if spec.get("servers"):
            for i, server in enumerate(spec["servers"]):
                collection["variable"].append({
                    "key": f"baseUrl{i}",
                    "value": server["url"],
                    "type": "string"
                })
        
        # Generate requests
        for path, methods in spec.get("paths", {}).items():
            folder = {
                "name": path,
                "item": []
            }
            
            for method, operation in methods.items():
                if method.upper() in [m.value for m in HTTPMethod]:
                    request_item = self._generate_postman_request(
                        path, method.upper(), operation, spec
                    )
                    folder["item"].append(request_item)
            
            if folder["item"]:
                collection["item"].append(folder)
        
        return collection
    
    def _generate_postman_request(self, path: str, method: str, 
                                 operation: Dict[str, Any], spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Postman request item"""
        
        request = {
            "name": operation.get("summary", f"{method} {path}"),
            "request": {
                "method": method,
                "header": [],
                "url": {
                    "raw": "{{baseUrl0}}" + path,
                    "host": ["{{baseUrl0}}"],
                    "path": path.strip("/").split("/") if path != "/" else []
                }
            },
            "response": []
        }
        
        # Add description
        if operation.get("description"):
            request["request"]["description"] = operation["description"]
        
        # Add parameters
        if operation.get("parameters"):
            query_params = []
            path_params = []
            headers = []
            
            for param in operation["parameters"]:
                if param["in"] == "query":
                    query_params.append({
                        "key": param["name"],
                        "value": param.get("example", ""),
                        "description": param.get("description", "")
                    })
                elif param["in"] == "path":
                    path_params.append(param["name"])
                elif param["in"] == "header":
                    headers.append({
                        "key": param["name"],
                        "value": param.get("example", ""),
                        "description": param.get("description", "")
                    })
            
            if query_params:
                request["request"]["url"]["query"] = query_params
            
            if headers:
                request["request"]["header"].extend(headers)
        
        # Add request body
        if operation.get("requestBody"):
            content = operation["requestBody"].get("content", {})
            if "application/json" in content:
                request["request"]["body"] = {
                    "mode": "raw",
                    "raw": json.dumps(
                        content["application/json"].get("example", {}), 
                        indent=2
                    ),
                    "options": {
                        "raw": {
                            "language": "json"
                        }
                    }
                }
                request["request"]["header"].append({
                    "key": "Content-Type",
                    "value": "application/json"
                })
        
        return request


class DocumentationGenerator:
    """HTML documentation generator"""
    
    def __init__(self, config: DocumentationConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.template_dir = Path(__file__).parent / "templates"
        self.static_dir = Path(__file__).parent / "static"
        
        # Create directories if they don't exist
        self.template_dir.mkdir(exist_ok=True)
        self.static_dir.mkdir(exist_ok=True)
        
        # Setup Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=True
        )
        
        self._create_default_templates()
    
    def _create_default_templates(self):
        """Create default HTML templates"""
        
        # Main documentation template
        main_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config.title }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" rel="stylesheet">
    <style>
        .sidebar { height: 100vh; overflow-y: auto; }
        .content { height: 100vh; overflow-y: auto; }
        .endpoint { margin-bottom: 2rem; }
        .method-badge { font-size: 0.8rem; }
        .response-example { max-height: 300px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 bg-light sidebar">
                <div class="p-3">
                    <h4>{{ config.title }}</h4>
                    <p class="text-muted">{{ config.description }}</p>
                    
                    <h6>Endpoints</h6>
                    <ul class="list-unstyled">
                        {% for endpoint in endpoints %}
                        <li>
                            <a href="#{{ endpoint.path | replace('/', '_') }}_{{ endpoint.method.value }}" 
                               class="text-decoration-none">
                                <span class="badge bg-{{ method_color(endpoint.method.value) }} method-badge">
                                    {{ endpoint.method.value }}
                                </span>
                                {{ endpoint.path }}
                            </a>
                        </li>
                        {% endfor %}
                    </ul>
                </div>
            </div>
            
            <!-- Main content -->
            <div class="col-md-9 content">
                <div class="p-4">
                    <h1>{{ config.title }}</h1>
                    <p class="lead">{{ config.description }}</p>
                    
                    {% if config.servers %}
                    <div class="mb-4">
                        <h5>Base URLs</h5>
                        {% for server in config.servers %}
                        <code>{{ server.url }}</code><br>
                        {% endfor %}
                    </div>
                    {% endif %}
                    
                    <!-- Endpoints -->
                    {% for endpoint in endpoints %}
                    <div class="endpoint" id="{{ endpoint.path | replace('/', '_') }}_{{ endpoint.method.value }}">
                        <div class="card">
                            <div class="card-header">
                                <h5>
                                    <span class="badge bg-{{ method_color(endpoint.method.value) }}">
                                        {{ endpoint.method.value }}
                                    </span>
                                    {{ endpoint.path }}
                                </h5>
                                <p class="mb-0">{{ endpoint.summary }}</p>
                            </div>
                            <div class="card-body">
                                {% if endpoint.description %}
                                <p>{{ endpoint.description }}</p>
                                {% endif %}
                                
                                {% if endpoint.parameters %}
                                <h6>Parameters</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Required</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {% for param in endpoint.parameters %}
                                            <tr>
                                                <td><code>{{ param.name }}</code></td>
                                                <td>{{ param.get('schema', {}).get('type', 'string') }}</td>
                                                <td>{{ 'Yes' if param.get('required') else 'No' }}</td>
                                                <td>{{ param.get('description', '') }}</td>
                                            </tr>
                                            {% endfor %}
                                        </tbody>
                                    </table>
                                </div>
                                {% endif %}
                                
                                {% if endpoint.request_body %}
                                <h6>Request Body</h6>
                                <pre><code class="language-json">{{ endpoint.request_body | tojson(indent=2) }}</code></pre>
                                {% endif %}
                                
                                {% if endpoint.responses %}
                                <h6>Responses</h6>
                                {% for status, response in endpoint.responses.items() %}
                                <div class="mb-2">
                                    <strong>{{ status }}</strong> - {{ response.get('description', '') }}
                                    {% if response.get('content') %}
                                    <div class="response-example">
                                        <pre><code class="language-json">{{ response.content | tojson(indent=2) }}</code></pre>
                                    </div>
                                    {% endif %}
                                </div>
                                {% endfor %}
                                {% endif %}
                                
                                {% if endpoint.examples %}
                                <h6>Examples</h6>
                                {% for example in endpoint.examples %}
                                <div class="mb-3">
                                    <strong>{{ example.name }}</strong>
                                    <pre><code class="language-bash">{{ example.request }}</code></pre>
                                    {% if example.response %}
                                    <pre><code class="language-json">{{ example.response | tojson(indent=2) }}</code></pre>
                                    {% endif %}
                                </div>
                                {% endfor %}
                                {% endif %}
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/autoloader/prism-autoloader.min.js"></script>
</body>
</html>
        """
        
        template_file = self.template_dir / "documentation.html"
        with open(template_file, 'w') as f:
            f.write(main_template)
    
    def generate_html_documentation(self, openapi_spec: Dict[str, Any], 
                                  endpoints: List[APIEndpoint]) -> str:
        """Generate HTML documentation"""
        
        def method_color(method: str) -> str:
            colors = {
                'GET': 'primary',
                'POST': 'success',
                'PUT': 'warning',
                'PATCH': 'info',
                'DELETE': 'danger'
            }
            return colors.get(method.upper(), 'secondary')
        
        template = self.jinja_env.get_template("documentation.html")
        
        return template.render(
            config=self.config,
            openapi_spec=openapi_spec,
            endpoints=endpoints,
            method_color=method_color
        )


class APITestRunner:
    """API test execution engine"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.logger = structlog.get_logger(__name__)
        self.session = aiohttp.ClientSession()
        self.test_results: List[TestResult] = []
        
        # Setup metrics
        self.test_counter = Counter(
            'api_tests_total',
            'Total API tests executed',
            ['status', 'test_type']
        )
        
        self.test_duration = Histogram(
            'api_test_duration_seconds',
            'API test execution duration'
        )
    
    async def run_test_case(self, test_case: TestCase) -> TestResult:
        """Execute a single test case"""
        
        start_time = time.time()
        timestamp = datetime.utcnow()
        
        try:
            # Prepare request
            url = urljoin(self.base_url, test_case.endpoint.path)
            method = test_case.endpoint.method.value
            
            # Replace path parameters
            for key, value in test_case.test_data.get('path_params', {}).items():
                url = url.replace(f'{{{key}}}', str(value))
            
            # Prepare request data
            request_data = {
                'method': method,
                'url': url,
                'headers': test_case.headers,
                'timeout': aiohttp.ClientTimeout(total=test_case.timeout)
            }
            
            # Add query parameters
            if test_case.test_data.get('query_params'):
                request_data['params'] = test_case.test_data['query_params']
            
            # Add request body
            if test_case.test_data.get('body'):
                if test_case.headers.get('Content-Type') == 'application/json':
                    request_data['json'] = test_case.test_data['body']
                else:
                    request_data['data'] = test_case.test_data['body']
            
            # Execute request
            async with self.session.request(**request_data) as response:
                response_data = {
                    'status': response.status,
                    'headers': dict(response.headers),
                    'body': await response.text()
                }
                
                # Try to parse JSON response
                try:
                    response_data['json'] = await response.json()
                except:
                    pass
            
            # Validate response
            assertions = self._validate_response(test_case, response_data)
            
            # Determine test status
            status = TestStatus.PASSED if all(a['passed'] for a in assertions) else TestStatus.FAILED
            
            execution_time = time.time() - start_time
            
            result = TestResult(
                test_case_id=test_case.id,
                status=status,
                execution_time=execution_time,
                timestamp=timestamp,
                request_data=request_data,
                response_data=response_data,
                assertions=assertions,
                performance_metrics={
                    'response_time': execution_time,
                    'response_size': len(response_data.get('body', ''))
                }
            )
            
            self.test_counter.labels(
                status=status.value,
                test_type=test_case.test_type.value
            ).inc()
            
            self.test_duration.observe(execution_time)
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            result = TestResult(
                test_case_id=test_case.id,
                status=TestStatus.ERROR,
                execution_time=execution_time,
                timestamp=timestamp,
                error_message=str(e)
            )
            
            self.test_counter.labels(
                status=TestStatus.ERROR.value,
                test_type=test_case.test_type.value
            ).inc()
            
            return result
    
    def _validate_response(self, test_case: TestCase, response_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Validate response against test expectations"""
        
        assertions = []
        
        # Status code assertion
        assertions.append({
            'name': 'status_code',
            'expected': test_case.expected_status,
            'actual': response_data['status'],
            'passed': response_data['status'] == test_case.expected_status,
            'message': f"Expected status {test_case.expected_status}, got {response_data['status']}"
        })
        
        # Response body assertions
        if test_case.expected_response:
            for key, expected_value in test_case.expected_response.items():
                actual_value = response_data.get('json', {}).get(key)
                
                assertions.append({
                    'name': f'response_field_{key}',
                    'expected': expected_value,
                    'actual': actual_value,
                    'passed': actual_value == expected_value,
                    'message': f"Expected {key}={expected_value}, got {actual_value}"
                })
        
        # Response time assertion (if specified)
        if 'max_response_time' in test_case.test_data:
            max_time = test_case.test_data['max_response_time']
            actual_time = response_data.get('response_time', 0)
            
            assertions.append({
                'name': 'response_time',
                'expected': f"<= {max_time}s",
                'actual': f"{actual_time}s",
                'passed': actual_time <= max_time,
                'message': f"Response time {actual_time}s exceeded maximum {max_time}s"
            })
        
        return assertions
    
    async def run_test_suite(self, test_cases: List[TestCase], 
                           parallel: bool = True, max_workers: int = 10) -> List[TestResult]:
        """Run multiple test cases"""
        
        if parallel:
            # Run tests in parallel
            semaphore = asyncio.Semaphore(max_workers)
            
            async def run_with_semaphore(test_case):
                async with semaphore:
                    return await self.run_test_case(test_case)
            
            tasks = [run_with_semaphore(tc) for tc in test_cases]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle exceptions
            test_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    test_results.append(TestResult(
                        test_case_id=test_cases[i].id,
                        status=TestStatus.ERROR,
                        execution_time=0,
                        timestamp=datetime.utcnow(),
                        error_message=str(result)
                    ))
                else:
                    test_results.append(result)
        else:
            # Run tests sequentially
            test_results = []
            for test_case in test_cases:
                result = await self.run_test_case(test_case)
                test_results.append(result)
        
        self.test_results.extend(test_results)
        return test_results
    
    async def run_load_test(self, test_case: TestCase, config: LoadTestConfig) -> Dict[str, Any]:
        """Run load test"""
        
        results = []
        start_time = time.time()
        
        # Create semaphore for concurrent users
        semaphore = asyncio.Semaphore(config.concurrent_users)
        
        async def load_test_worker():
            async with semaphore:
                while time.time() - start_time < config.duration_seconds:
                    result = await self.run_test_case(test_case)
                    results.append(result)
                    
                    # Think time
                    if config.think_time_seconds > 0:
                        await asyncio.sleep(config.think_time_seconds)
        
        # Start workers
        workers = [load_test_worker() for _ in range(config.concurrent_users)]
        await asyncio.gather(*workers, return_exceptions=True)
        
        # Calculate statistics
        response_times = [r.execution_time for r in results if r.status == TestStatus.PASSED]
        
        if response_times:
            stats = {
                'total_requests': len(results),
                'successful_requests': len(response_times),
                'failed_requests': len(results) - len(response_times),
                'success_rate': len(response_times) / len(results) * 100,
                'avg_response_time': statistics.mean(response_times),
                'min_response_time': min(response_times),
                'max_response_time': max(response_times),
                'median_response_time': statistics.median(response_times),
                'p95_response_time': statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times),
                'requests_per_second': len(results) / (time.time() - start_time)
            }
        else:
            stats = {
                'total_requests': len(results),
                'successful_requests': 0,
                'failed_requests': len(results),
                'success_rate': 0,
                'requests_per_second': 0
            }
        
        return stats
    
    async def close(self):
        """Close the test runner"""
        await self.session.close()


class TestReportGenerator:
    """Test report generator"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
    
    def generate_html_report(self, test_results: List[TestResult], 
                           test_cases: List[TestCase]) -> str:
        """Generate HTML test report"""
        
        # Calculate summary statistics
        total_tests = len(test_results)
        passed_tests = sum(1 for r in test_results if r.status == TestStatus.PASSED)
        failed_tests = sum(1 for r in test_results if r.status == TestStatus.FAILED)
        error_tests = sum(1 for r in test_results if r.status == TestStatus.ERROR)
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Group results by test type
        results_by_type = {}
        for result in test_results:
            test_case = next((tc for tc in test_cases if tc.id == result.test_case_id), None)
            if test_case:
                test_type = test_case.test_type.value
                if test_type not in results_by_type:
                    results_by_type[test_type] = []
                results_by_type[test_type].append(result)
        
        html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-error { color: #ffc107; }
        .test-details { display: none; }
    </style>
</head>
<body>
    <div class="container-fluid py-4">
        <h1>API Test Report</h1>
        <p class="text-muted">Generated on {{ timestamp }}</p>
        
        <!-- Summary -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title">{{ total_tests }}</h5>
                        <p class="card-text">Total Tests</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title status-passed">{{ passed_tests }}</h5>
                        <p class="card-text">Passed</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title status-failed">{{ failed_tests }}</h5>
                        <p class="card-text">Failed</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title">{{ success_rate }}%</h5>
                        <p class="card-text">Success Rate</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Test Results Distribution</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="resultsChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Response Time Distribution</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="responseTimeChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Test Results -->
        <div class="card">
            <div class="card-header">
                <h5>Test Results</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Test Case</th>
                                <th>Status</th>
                                <th>Response Time</th>
                                <th>Timestamp</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for result in test_results %}
                            <tr>
                                <td>{{ result.test_case_id }}</td>
                                <td>
                                    <span class="status-{{ result.status.value }}">
                                        {{ result.status.value.upper() }}
                                    </span>
                                </td>
                                <td>{{ "%.3f"|format(result.execution_time) }}s</td>
                                <td>{{ result.timestamp.strftime('%Y-%m-%d %H:%M:%S') }}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="toggleDetails('{{ result.test_case_id }}')">
                                        Details
                                    </button>
                                </td>
                            </tr>
                            <tr id="details-{{ result.test_case_id }}" class="test-details">
                                <td colspan="5">
                                    <div class="p-3 bg-light">
                                        {% if result.error_message %}
                                        <div class="alert alert-danger">
                                            <strong>Error:</strong> {{ result.error_message }}
                                        </div>
                                        {% endif %}
                                        
                                        {% if result.assertions %}
                                        <h6>Assertions</h6>
                                        <ul class="list-group list-group-flush">
                                            {% for assertion in result.assertions %}
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                {{ assertion.name }}
                                                <span class="badge bg-{{ 'success' if assertion.passed else 'danger' }}">
                                                    {{ 'PASS' if assertion.passed else 'FAIL' }}
                                                </span>
                                            </li>
                                            {% endfor %}
                                        </ul>
                                        {% endif %}
                                        
                                        {% if result.response_data %}
                                        <h6 class="mt-3">Response</h6>
                                        <pre class="bg-white p-2 border rounded"><code>{{ result.response_data | tojson(indent=2) }}</code></pre>
                                        {% endif %}
                                    </div>
                                </td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Results chart
        const resultsCtx = document.getElementById('resultsChart').getContext('2d');
        new Chart(resultsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Error'],
                datasets: [{
                    data: [{{ passed_tests }}, {{ failed_tests }}, {{ error_tests }}],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107']
                }]
            }
        });
        
        // Response time chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        const responseTimes = {{ response_times | tojson }};
        new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: responseTimes.map((_, i) => i + 1),
                datasets: [{
                    label: 'Response Time (s)',
                    data: responseTimes,
                    borderColor: '#007bff',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        function toggleDetails(testId) {
            const details = document.getElementById('details-' + testId);
            details.style.display = details.style.display === 'none' ? 'table-row' : 'none';
        }
    </script>
</body>
</html>
        """
        
        template = Template(html_template)
        
        response_times = [r.execution_time for r in test_results]
        
        return template.render(
            timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            error_tests=error_tests,
            success_rate=round(success_rate, 2),
            test_results=test_results,
            response_times=response_times
        )
    
    def generate_json_report(self, test_results: List[TestResult]) -> Dict[str, Any]:
        """Generate JSON test report"""
        
        return {
            "summary": {
                "total_tests": len(test_results),
                "passed": sum(1 for r in test_results if r.status == TestStatus.PASSED),
                "failed": sum(1 for r in test_results if r.status == TestStatus.FAILED),
                "errors": sum(1 for r in test_results if r.status == TestStatus.ERROR),
                "success_rate": sum(1 for r in test_results if r.status == TestStatus.PASSED) / len(test_results) * 100 if test_results else 0
            },
            "results": [asdict(result) for result in test_results],
            "generated_at": datetime.utcnow().isoformat()
        }


class APIDocumentationSystem:
    """Main API documentation and testing system"""
    
    def __init__(self, config: DocumentationConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize components
        self.openapi_generator = OpenAPIGenerator(config)
        self.doc_generator = DocumentationGenerator(config)
        self.test_runner = None
        self.report_generator = TestReportGenerator()
        
        # Storage
        self.endpoints: List[APIEndpoint] = []
        self.test_cases: List[TestCase] = []
        self.test_results: List[TestResult] = []
    
    def add_endpoint(self, endpoint: APIEndpoint):
        """Add API endpoint"""
        self.endpoints.append(endpoint)
        self.openapi_generator.add_endpoint(endpoint)
    
    def add_test_case(self, test_case: TestCase):
        """Add test case"""
        self.test_cases.append(test_case)
    
    def generate_documentation(self, output_dir: str = "docs"):
        """Generate complete API documentation"""
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Generate OpenAPI spec
        openapi_spec = self.openapi_generator.generate_openapi_spec()
        
        # Validate spec
        validation_errors = self.openapi_generator.validate_spec(openapi_spec)
        if validation_errors:
            self.logger.warning(f"OpenAPI validation errors: {validation_errors}")
        
        # Save OpenAPI spec
        with open(output_path / "openapi.yaml", 'w') as f:
            yaml.dump(openapi_spec, f, default_flow_style=False)
        
        with open(output_path / "openapi.json", 'w') as f:
            json.dump(openapi_spec, f, indent=2)
        
        # Generate HTML documentation
        html_doc = self.doc_generator.generate_html_documentation(openapi_spec, self.endpoints)
        with open(output_path / "index.html", 'w') as f:
            f.write(html_doc)
        
        # Generate Postman collection
        if self.config.generate_postman:
            postman_collection = self.openapi_generator.generate_postman_collection(openapi_spec)
            with open(output_path / "postman_collection.json", 'w') as f:
                json.dump(postman_collection, f, indent=2)
        
        self.logger.info(f"Documentation generated in {output_path}")
        
        return {
            "openapi_spec": openapi_spec,
            "html_documentation": html_doc,
            "validation_errors": validation_errors
        }
    
    async def run_tests(self, base_url: str, parallel: bool = True) -> Dict[str, Any]:
        """Run all test cases"""
        
        if not self.test_runner:
            self.test_runner = APITestRunner(base_url)
        
        try:
            results = await self.test_runner.run_test_suite(self.test_cases, parallel)
            self.test_results.extend(results)
            
            # Generate reports
            html_report = self.report_generator.generate_html_report(results, self.test_cases)
            json_report = self.report_generator.generate_json_report(results)
            
            return {
                "results": results,
                "html_report": html_report,
                "json_report": json_report
            }
            
        finally:
            await self.test_runner.close()
    
    async def run_load_test(self, base_url: str, test_case_id: str, 
                           config: LoadTestConfig) -> Dict[str, Any]:
        """Run load test for specific endpoint"""
        
        test_case = next((tc for tc in self.test_cases if tc.id == test_case_id), None)
        if not test_case:
            raise ValueError(f"Test case {test_case_id} not found")
        
        if not self.test_runner:
            self.test_runner = APITestRunner(base_url)
        
        try:
            stats = await self.test_runner.run_load_test(test_case, config)
            return stats
        finally:
            await self.test_runner.close()


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def main():
        # Create documentation configuration
        config = DocumentationConfig(
            title="AI Framework API",
            version="1.0.0",
            description="Advanced AI Framework with Cognitive, Emotional, and Consciousness capabilities",
            servers=[{"url": "http://localhost:8000"}]
        )
        
        # Initialize documentation system
        doc_system = APIDocumentationSystem(config)
        
        # Add sample endpoints
        cognitive_endpoint = APIEndpoint(
            path="/cognitive/process",
            method=HTTPMethod.POST,
            summary="Process cognitive input",
            description="Process input through the cognitive AI framework",
            tags=["cognitive"],
            request_body={
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "input_text": {"type": "string"},
                                "context": {"type": "object"}
                            }
                        }
                    }
                }
            },
            responses={
                "200": {
                    "description": "Successful processing",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "response": {"type": "string"},
                                    "confidence": {"type": "number"}
                                }
                            }
                        }
                    }
                }
            }
        )
        
        doc_system.add_endpoint(cognitive_endpoint)
        
        # Add test case
        test_case = TestCase(
            id="test_cognitive_process",
            name="Test Cognitive Processing",
            description="Test the cognitive processing endpoint",
            test_type=TestType.FUNCTIONAL,
            endpoint=cognitive_endpoint,
            test_data={
                "body": {
                    "input_text": "Hello, how are you?",
                    "context": {"user_id": "test_user"}
                }
            },
            headers={"Content-Type": "application/json"},
            expected_status=200
        )
        
        doc_system.add_test_case(test_case)
        
        # Generate documentation
        doc_result = doc_system.generate_documentation("api_docs")
        print(f"Documentation generated with {len(doc_result['validation_errors'])} validation errors")
        
        # Run tests (if server is running)
        # test_result = await doc_system.run_tests("http://localhost:8000")
        # print(f"Tests completed: {len(test_result['results'])} tests run")
    
    asyncio.run(main())