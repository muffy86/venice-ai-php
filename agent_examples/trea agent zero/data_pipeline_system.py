"""
Advanced Data Pipeline System
Provides comprehensive ETL operations, data processing, validation, and monitoring.
"""

import asyncio
import logging
import json
import yaml
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union, Callable, Type, Iterator
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import hashlib
import time
from datetime import datetime, timedelta
import threading
import queue
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import sqlite3
import psycopg2
import pymongo
import redis
import boto3
import requests
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import dask.dataframe as dd
from dask.distributed import Client
import great_expectations as ge
from great_expectations.core import ExpectationSuite
import airflow
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.bash_operator import BashOperator
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel, Field, validator
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import structlog

# Database setup
Base = declarative_base()

class PipelineStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"

class DataSourceType(Enum):
    FILE = "file"
    DATABASE = "database"
    API = "api"
    STREAM = "stream"
    QUEUE = "queue"
    S3 = "s3"
    KAFKA = "kafka"
    REDIS = "redis"
    MONGODB = "mongodb"

class DataFormat(Enum):
    CSV = "csv"
    JSON = "json"
    PARQUET = "parquet"
    AVRO = "avro"
    XML = "xml"
    YAML = "yaml"
    EXCEL = "excel"
    BINARY = "binary"

class ProcessingEngine(Enum):
    PANDAS = "pandas"
    DASK = "dask"
    SPARK = "spark"
    BEAM = "beam"
    NATIVE = "native"

class ValidationLevel(Enum):
    NONE = "none"
    BASIC = "basic"
    STRICT = "strict"
    CUSTOM = "custom"

@dataclass
class DataSource:
    name: str
    type: DataSourceType
    connection_string: str
    format: DataFormat
    schema: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, str]] = None
    options: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DataTarget:
    name: str
    type: DataSourceType
    connection_string: str
    format: DataFormat
    schema: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, str]] = None
    options: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ProcessingStep:
    name: str
    function: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    retry_count: int = 3
    timeout: Optional[int] = None

@dataclass
class PipelineConfig:
    name: str
    description: str
    sources: List[DataSource]
    targets: List[DataTarget]
    steps: List[ProcessingStep]
    engine: ProcessingEngine = ProcessingEngine.PANDAS
    validation_level: ValidationLevel = ValidationLevel.BASIC
    schedule: Optional[str] = None
    max_workers: int = 4
    chunk_size: int = 10000
    enable_monitoring: bool = True
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class PipelineRun:
    id: str
    pipeline_name: str
    status: PipelineStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    logs: List[str] = field(default_factory=list)

# Database Models
class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text)
    config = Column(JSON, nullable=False)
    status = Column(String(50), default=PipelineStatus.PENDING.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_run_at = Column(DateTime)
    next_run_at = Column(DateTime)
    enabled = Column(Boolean, default=True)
    tags = Column(JSON)

class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"
    
    id = Column(Integer, primary_key=True)
    pipeline_id = Column(Integer, nullable=False, index=True)
    run_id = Column(String(255), nullable=False, unique=True, index=True)
    status = Column(String(50), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    metrics = Column(JSON)
    logs = Column(Text)
    input_records = Column(Integer)
    output_records = Column(Integer)
    processing_time = Column(Float)

class DataQualityCheck(Base):
    __tablename__ = "data_quality_checks"
    
    id = Column(Integer, primary_key=True)
    pipeline_id = Column(Integer, nullable=False, index=True)
    run_id = Column(String(255), nullable=False, index=True)
    check_name = Column(String(255), nullable=False)
    check_type = Column(String(100), nullable=False)
    passed = Column(Boolean, nullable=False)
    result = Column(JSON)
    checked_at = Column(DateTime, default=datetime.utcnow)

# Prometheus Metrics
REGISTRY = CollectorRegistry()
PIPELINE_RUNS = Counter('pipeline_runs_total', 'Total pipeline runs', ['pipeline', 'status'], registry=REGISTRY)
PIPELINE_DURATION = Histogram('pipeline_duration_seconds', 'Pipeline execution duration', ['pipeline'], registry=REGISTRY)
PIPELINE_RECORDS = Counter('pipeline_records_total', 'Total records processed', ['pipeline', 'type'], registry=REGISTRY)
ACTIVE_PIPELINES = Gauge('active_pipelines', 'Number of active pipelines', registry=REGISTRY)

class DataConnector:
    """Base class for data connectors"""
    
    def __init__(self, source: DataSource):
        self.source = source
        self.logger = structlog.get_logger()
    
    async def read(self, **kwargs) -> Iterator[pd.DataFrame]:
        """Read data from source"""
        raise NotImplementedError
    
    async def write(self, data: pd.DataFrame, target: DataTarget, **kwargs):
        """Write data to target"""
        raise NotImplementedError
    
    def validate_connection(self) -> bool:
        """Validate connection to data source"""
        raise NotImplementedError

class FileConnector(DataConnector):
    """File-based data connector"""
    
    async def read(self, **kwargs) -> Iterator[pd.DataFrame]:
        """Read data from file"""
        file_path = Path(self.source.connection_string)
        chunk_size = kwargs.get('chunk_size', 10000)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if self.source.format == DataFormat.CSV:
            for chunk in pd.read_csv(file_path, chunksize=chunk_size, **self.source.options):
                yield chunk
        elif self.source.format == DataFormat.JSON:
            data = pd.read_json(file_path, **self.source.options)
            for i in range(0, len(data), chunk_size):
                yield data.iloc[i:i+chunk_size]
        elif self.source.format == DataFormat.PARQUET:
            data = pd.read_parquet(file_path, **self.source.options)
            for i in range(0, len(data), chunk_size):
                yield data.iloc[i:i+chunk_size]
        elif self.source.format == DataFormat.EXCEL:
            data = pd.read_excel(file_path, **self.source.options)
            for i in range(0, len(data), chunk_size):
                yield data.iloc[i:i+chunk_size]
        else:
            raise ValueError(f"Unsupported file format: {self.source.format}")
    
    async def write(self, data: pd.DataFrame, target: DataTarget, **kwargs):
        """Write data to file"""
        file_path = Path(target.connection_string)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        mode = kwargs.get('mode', 'w')
        
        if target.format == DataFormat.CSV:
            header = mode == 'w'
            data.to_csv(file_path, mode=mode, header=header, index=False, **target.options)
        elif target.format == DataFormat.JSON:
            if mode == 'a' and file_path.exists():
                existing_data = pd.read_json(file_path)
                combined_data = pd.concat([existing_data, data], ignore_index=True)
                combined_data.to_json(file_path, **target.options)
            else:
                data.to_json(file_path, **target.options)
        elif target.format == DataFormat.PARQUET:
            data.to_parquet(file_path, **target.options)
        elif target.format == DataFormat.EXCEL:
            data.to_excel(file_path, index=False, **target.options)
        else:
            raise ValueError(f"Unsupported file format: {target.format}")
    
    def validate_connection(self) -> bool:
        """Validate file connection"""
        file_path = Path(self.source.connection_string)
        return file_path.parent.exists()

class DatabaseConnector(DataConnector):
    """Database data connector"""
    
    async def read(self, **kwargs) -> Iterator[pd.DataFrame]:
        """Read data from database"""
        engine = create_engine(self.source.connection_string)
        query = kwargs.get('query', f"SELECT * FROM {self.source.options.get('table', 'data')}")
        chunk_size = kwargs.get('chunk_size', 10000)
        
        for chunk in pd.read_sql(query, engine, chunksize=chunk_size):
            yield chunk
    
    async def write(self, data: pd.DataFrame, target: DataTarget, **kwargs):
        """Write data to database"""
        engine = create_engine(target.connection_string)
        table_name = target.options.get('table', 'data')
        if_exists = kwargs.get('if_exists', 'append')
        
        data.to_sql(table_name, engine, if_exists=if_exists, index=False, **target.options)
    
    def validate_connection(self) -> bool:
        """Validate database connection"""
        try:
            engine = create_engine(self.source.connection_string)
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            return True
        except Exception:
            return False

class APIConnector(DataConnector):
    """API data connector"""
    
    async def read(self, **kwargs) -> Iterator[pd.DataFrame]:
        """Read data from API"""
        url = self.source.connection_string
        headers = self.source.credentials or {}
        params = self.source.options.get('params', {})
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        if self.source.format == DataFormat.JSON:
            data = response.json()
            if isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = pd.json_normalize(data)
            
            chunk_size = kwargs.get('chunk_size', 10000)
            for i in range(0, len(df), chunk_size):
                yield df.iloc[i:i+chunk_size]
        else:
            raise ValueError(f"Unsupported API format: {self.source.format}")
    
    async def write(self, data: pd.DataFrame, target: DataTarget, **kwargs):
        """Write data to API"""
        url = target.connection_string
        headers = target.credentials or {}
        headers.setdefault('Content-Type', 'application/json')
        
        if target.format == DataFormat.JSON:
            payload = data.to_dict('records')
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
        else:
            raise ValueError(f"Unsupported API format: {target.format}")
    
    def validate_connection(self) -> bool:
        """Validate API connection"""
        try:
            response = requests.head(self.source.connection_string, timeout=10)
            return response.status_code < 400
        except Exception:
            return False

class DataValidator:
    """Data validation and quality checks"""
    
    def __init__(self):
        self.expectations = {}
        self.logger = structlog.get_logger()
    
    def add_expectation(self, name: str, expectation: Callable[[pd.DataFrame], bool]):
        """Add a custom expectation"""
        self.expectations[name] = expectation
    
    async def validate_data(self, data: pd.DataFrame, checks: List[str]) -> Dict[str, Any]:
        """Validate data against specified checks"""
        results = {}
        
        for check in checks:
            try:
                if check == "not_null":
                    results[check] = self._check_not_null(data)
                elif check == "unique":
                    results[check] = self._check_unique(data)
                elif check == "data_types":
                    results[check] = self._check_data_types(data)
                elif check == "range":
                    results[check] = self._check_range(data)
                elif check in self.expectations:
                    results[check] = self.expectations[check](data)
                else:
                    self.logger.warning(f"Unknown validation check: {check}")
            except Exception as e:
                self.logger.error(f"Validation check {check} failed: {e}")
                results[check] = {"passed": False, "error": str(e)}
        
        return results
    
    def _check_not_null(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Check for null values"""
        null_counts = data.isnull().sum()
        total_rows = len(data)
        
        return {
            "passed": null_counts.sum() == 0,
            "null_counts": null_counts.to_dict(),
            "null_percentage": (null_counts / total_rows * 100).to_dict()
        }
    
    def _check_unique(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Check for duplicate rows"""
        duplicate_count = data.duplicated().sum()
        total_rows = len(data)
        
        return {
            "passed": duplicate_count == 0,
            "duplicate_count": int(duplicate_count),
            "duplicate_percentage": float(duplicate_count / total_rows * 100)
        }
    
    def _check_data_types(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Check data types"""
        type_info = {}
        for column in data.columns:
            type_info[column] = {
                "dtype": str(data[column].dtype),
                "non_null_count": int(data[column].count()),
                "null_count": int(data[column].isnull().sum())
            }
        
        return {
            "passed": True,
            "type_info": type_info
        }
    
    def _check_range(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Check numeric ranges"""
        numeric_columns = data.select_dtypes(include=[np.number]).columns
        range_info = {}
        
        for column in numeric_columns:
            range_info[column] = {
                "min": float(data[column].min()),
                "max": float(data[column].max()),
                "mean": float(data[column].mean()),
                "std": float(data[column].std())
            }
        
        return {
            "passed": True,
            "range_info": range_info
        }

class DataProcessor:
    """Data processing and transformation"""
    
    def __init__(self):
        self.functions = {}
        self.logger = structlog.get_logger()
        self._register_builtin_functions()
    
    def _register_builtin_functions(self):
        """Register built-in processing functions"""
        self.functions.update({
            'drop_nulls': self._drop_nulls,
            'fill_nulls': self._fill_nulls,
            'drop_duplicates': self._drop_duplicates,
            'filter_rows': self._filter_rows,
            'select_columns': self._select_columns,
            'rename_columns': self._rename_columns,
            'add_column': self._add_column,
            'transform_column': self._transform_column,
            'aggregate': self._aggregate,
            'sort': self._sort,
            'join': self._join,
            'pivot': self._pivot,
            'melt': self._melt,
            'normalize': self._normalize,
            'encode_categorical': self._encode_categorical
        })
    
    def register_function(self, name: str, function: Callable):
        """Register a custom processing function"""
        self.functions[name] = function
    
    async def process_data(self, data: pd.DataFrame, step: ProcessingStep) -> pd.DataFrame:
        """Process data using specified step"""
        function_name = step.function
        
        if function_name not in self.functions:
            raise ValueError(f"Unknown processing function: {function_name}")
        
        try:
            function = self.functions[function_name]
            result = function(data, **step.parameters)
            
            self.logger.info(f"Applied {function_name}", 
                           input_rows=len(data), 
                           output_rows=len(result))
            
            return result
        except Exception as e:
            self.logger.error(f"Processing step {function_name} failed: {e}")
            raise
    
    def _drop_nulls(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Drop rows with null values"""
        subset = kwargs.get('subset')
        how = kwargs.get('how', 'any')
        return data.dropna(subset=subset, how=how)
    
    def _fill_nulls(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Fill null values"""
        value = kwargs.get('value')
        method = kwargs.get('method')
        columns = kwargs.get('columns')
        
        if columns:
            data = data.copy()
            for column in columns:
                if column in data.columns:
                    if value is not None:
                        data[column] = data[column].fillna(value)
                    elif method:
                        data[column] = data[column].fillna(method=method)
        else:
            if value is not None:
                data = data.fillna(value)
            elif method:
                data = data.fillna(method=method)
        
        return data
    
    def _drop_duplicates(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Drop duplicate rows"""
        subset = kwargs.get('subset')
        keep = kwargs.get('keep', 'first')
        return data.drop_duplicates(subset=subset, keep=keep)
    
    def _filter_rows(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Filter rows based on conditions"""
        condition = kwargs.get('condition')
        if condition:
            return data.query(condition)
        return data
    
    def _select_columns(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Select specific columns"""
        columns = kwargs.get('columns', [])
        if columns:
            return data[columns]
        return data
    
    def _rename_columns(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Rename columns"""
        mapping = kwargs.get('mapping', {})
        return data.rename(columns=mapping)
    
    def _add_column(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Add a new column"""
        name = kwargs.get('name')
        value = kwargs.get('value')
        expression = kwargs.get('expression')
        
        data = data.copy()
        
        if expression:
            data[name] = data.eval(expression)
        else:
            data[name] = value
        
        return data
    
    def _transform_column(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Transform a column"""
        column = kwargs.get('column')
        function = kwargs.get('function')
        
        if column in data.columns:
            data = data.copy()
            if function == 'upper':
                data[column] = data[column].str.upper()
            elif function == 'lower':
                data[column] = data[column].str.lower()
            elif function == 'strip':
                data[column] = data[column].str.strip()
            elif function == 'log':
                data[column] = np.log(data[column])
            elif function == 'sqrt':
                data[column] = np.sqrt(data[column])
        
        return data
    
    def _aggregate(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Aggregate data"""
        group_by = kwargs.get('group_by', [])
        agg_functions = kwargs.get('functions', {})
        
        if group_by:
            return data.groupby(group_by).agg(agg_functions).reset_index()
        else:
            return data.agg(agg_functions).to_frame().T
    
    def _sort(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Sort data"""
        by = kwargs.get('by', [])
        ascending = kwargs.get('ascending', True)
        return data.sort_values(by=by, ascending=ascending)
    
    def _join(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Join with another dataset"""
        # This would need additional data source
        # For now, return original data
        return data
    
    def _pivot(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Pivot data"""
        index = kwargs.get('index')
        columns = kwargs.get('columns')
        values = kwargs.get('values')
        
        return data.pivot(index=index, columns=columns, values=values).reset_index()
    
    def _melt(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Melt data"""
        id_vars = kwargs.get('id_vars')
        value_vars = kwargs.get('value_vars')
        var_name = kwargs.get('var_name', 'variable')
        value_name = kwargs.get('value_name', 'value')
        
        return data.melt(id_vars=id_vars, value_vars=value_vars, 
                        var_name=var_name, value_name=value_name)
    
    def _normalize(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Normalize numeric columns"""
        columns = kwargs.get('columns', [])
        method = kwargs.get('method', 'min_max')
        
        data = data.copy()
        
        if not columns:
            columns = data.select_dtypes(include=[np.number]).columns
        
        for column in columns:
            if column in data.columns:
                if method == 'min_max':
                    min_val = data[column].min()
                    max_val = data[column].max()
                    data[column] = (data[column] - min_val) / (max_val - min_val)
                elif method == 'z_score':
                    mean_val = data[column].mean()
                    std_val = data[column].std()
                    data[column] = (data[column] - mean_val) / std_val
        
        return data
    
    def _encode_categorical(self, data: pd.DataFrame, **kwargs) -> pd.DataFrame:
        """Encode categorical columns"""
        columns = kwargs.get('columns', [])
        method = kwargs.get('method', 'label')
        
        data = data.copy()
        
        for column in columns:
            if column in data.columns:
                if method == 'label':
                    data[column] = pd.Categorical(data[column]).codes
                elif method == 'onehot':
                    dummies = pd.get_dummies(data[column], prefix=column)
                    data = pd.concat([data.drop(column, axis=1), dummies], axis=1)
        
        return data

class PipelineEngine:
    """Pipeline execution engine"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connectors = {}
        self.processor = DataProcessor()
        self.validator = DataValidator()
        self.logger = structlog.get_logger()
        
        # Setup database
        db_url = config.get('database_url', 'sqlite:///pipelines.db')
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.db_session = Session()
        
        # Initialize connector registry
        self._register_connectors()
    
    def _register_connectors(self):
        """Register data connectors"""
        self.connectors = {
            DataSourceType.FILE: FileConnector,
            DataSourceType.DATABASE: DatabaseConnector,
            DataSourceType.API: APIConnector,
        }
    
    def register_connector(self, source_type: DataSourceType, connector_class: Type[DataConnector]):
        """Register a custom connector"""
        self.connectors[source_type] = connector_class
    
    async def execute_pipeline(self, pipeline_config: PipelineConfig) -> PipelineRun:
        """Execute a data pipeline"""
        run_id = f"{pipeline_config.name}_{int(time.time())}"
        run = PipelineRun(
            id=run_id,
            pipeline_name=pipeline_config.name,
            status=PipelineStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        
        try:
            # Record pipeline execution start
            execution = PipelineExecution(
                pipeline_id=self._get_pipeline_id(pipeline_config.name),
                run_id=run_id,
                status=PipelineStatus.RUNNING.value,
                started_at=run.started_at
            )
            self.db_session.add(execution)
            self.db_session.commit()
            
            # Update metrics
            PIPELINE_RUNS.labels(pipeline=pipeline_config.name, status='started').inc()
            ACTIVE_PIPELINES.inc()
            
            with PIPELINE_DURATION.labels(pipeline=pipeline_config.name).time():
                # Execute pipeline steps
                await self._execute_pipeline_steps(pipeline_config, run)
            
            # Mark as completed
            run.status = PipelineStatus.COMPLETED
            run.completed_at = datetime.utcnow()
            
            # Update database
            execution.status = PipelineStatus.COMPLETED.value
            execution.completed_at = run.completed_at
            execution.metrics = run.metrics
            execution.logs = '\n'.join(run.logs)
            self.db_session.commit()
            
            # Update metrics
            PIPELINE_RUNS.labels(pipeline=pipeline_config.name, status='completed').inc()
            ACTIVE_PIPELINES.dec()
            
        except Exception as e:
            run.status = PipelineStatus.FAILED
            run.error_message = str(e)
            run.completed_at = datetime.utcnow()
            
            # Update database
            execution.status = PipelineStatus.FAILED.value
            execution.completed_at = run.completed_at
            execution.error_message = str(e)
            self.db_session.commit()
            
            # Update metrics
            PIPELINE_RUNS.labels(pipeline=pipeline_config.name, status='failed').inc()
            ACTIVE_PIPELINES.dec()
            
            self.logger.error(f"Pipeline {pipeline_config.name} failed: {e}")
        
        return run
    
    async def _execute_pipeline_steps(self, config: PipelineConfig, run: PipelineRun):
        """Execute pipeline processing steps"""
        total_input_records = 0
        total_output_records = 0
        
        # Read data from sources
        all_data = []
        for source in config.sources:
            connector_class = self.connectors.get(source.type)
            if not connector_class:
                raise ValueError(f"No connector available for source type: {source.type}")
            
            connector = connector_class(source)
            
            async for chunk in connector.read(chunk_size=config.chunk_size):
                all_data.append(chunk)
                total_input_records += len(chunk)
                
                # Update metrics
                PIPELINE_RECORDS.labels(pipeline=config.name, type='input').inc(len(chunk))
        
        # Combine all data
        if all_data:
            data = pd.concat(all_data, ignore_index=True)
        else:
            data = pd.DataFrame()
        
        run.logs.append(f"Loaded {total_input_records} records from {len(config.sources)} sources")
        
        # Apply processing steps
        for step in config.steps:
            try:
                data = await self.processor.process_data(data, step)
                run.logs.append(f"Applied step '{step.name}': {len(data)} records")
            except Exception as e:
                run.logs.append(f"Step '{step.name}' failed: {e}")
                raise
        
        # Validate data if required
        if config.validation_level != ValidationLevel.NONE:
            validation_checks = ['not_null', 'unique', 'data_types']
            validation_results = await self.validator.validate_data(data, validation_checks)
            
            for check, result in validation_results.items():
                quality_check = DataQualityCheck(
                    pipeline_id=self._get_pipeline_id(config.name),
                    run_id=run.id,
                    check_name=check,
                    check_type='validation',
                    passed=result.get('passed', False),
                    result=result
                )
                self.db_session.add(quality_check)
            
            self.db_session.commit()
            run.logs.append(f"Data validation completed: {len(validation_results)} checks")
        
        # Write data to targets
        for target in config.targets:
            connector_class = self.connectors.get(target.type)
            if not connector_class:
                raise ValueError(f"No connector available for target type: {target.type}")
            
            # Create a dummy source for the connector (we're writing, not reading)
            dummy_source = DataSource(
                name=target.name,
                type=target.type,
                connection_string=target.connection_string,
                format=target.format,
                credentials=target.credentials,
                options=target.options
            )
            
            connector = connector_class(dummy_source)
            await connector.write(data, target)
            
            total_output_records += len(data)
            PIPELINE_RECORDS.labels(pipeline=config.name, type='output').inc(len(data))
        
        run.logs.append(f"Wrote {total_output_records} records to {len(config.targets)} targets")
        
        # Store metrics
        run.metrics = {
            'input_records': total_input_records,
            'output_records': total_output_records,
            'processing_time': (datetime.utcnow() - run.started_at).total_seconds(),
            'steps_executed': len(config.steps),
            'sources_processed': len(config.sources),
            'targets_written': len(config.targets)
        }
    
    def _get_pipeline_id(self, pipeline_name: str) -> int:
        """Get pipeline ID from database"""
        pipeline = self.db_session.query(Pipeline).filter(
            Pipeline.name == pipeline_name
        ).first()
        
        if not pipeline:
            # Create new pipeline record
            pipeline = Pipeline(
                name=pipeline_name,
                description="Auto-created pipeline",
                config={}
            )
            self.db_session.add(pipeline)
            self.db_session.commit()
        
        return pipeline.id
    
    def get_pipeline_runs(self, pipeline_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get pipeline execution history"""
        pipeline_id = self._get_pipeline_id(pipeline_name)
        
        executions = self.db_session.query(PipelineExecution).filter(
            PipelineExecution.pipeline_id == pipeline_id
        ).order_by(PipelineExecution.started_at.desc()).limit(limit).all()
        
        return [
            {
                'run_id': exec.run_id,
                'status': exec.status,
                'started_at': exec.started_at.isoformat(),
                'completed_at': exec.completed_at.isoformat() if exec.completed_at else None,
                'processing_time': exec.processing_time,
                'input_records': exec.input_records,
                'output_records': exec.output_records,
                'error_message': exec.error_message
            }
            for exec in executions
        ]
    
    def cleanup(self):
        """Cleanup resources"""
        self.db_session.close()

class PipelineAPI:
    """REST API for pipeline management"""
    
    def __init__(self, engine: PipelineEngine):
        self.engine = engine
        self.app = FastAPI(title="Data Pipeline API")
        self.setup_routes()
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.post("/api/pipelines/execute")
        async def execute_pipeline(config: Dict[str, Any], background_tasks: BackgroundTasks):
            """Execute a data pipeline"""
            try:
                pipeline_config = PipelineConfig(**config)
                
                # Execute pipeline in background
                background_tasks.add_task(self.engine.execute_pipeline, pipeline_config)
                
                return {"message": "Pipeline execution started", "pipeline": pipeline_config.name}
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
        
        @self.app.get("/api/pipelines/{pipeline_name}/runs")
        async def get_pipeline_runs(pipeline_name: str, limit: int = 10):
            """Get pipeline execution history"""
            runs = self.engine.get_pipeline_runs(pipeline_name, limit)
            return {"runs": runs}
        
        @self.app.get("/api/pipelines/metrics")
        async def get_metrics():
            """Get pipeline metrics"""
            from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
            return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)
        
        @self.app.get("/api/health")
        async def health_check():
            """Health check endpoint"""
            return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Example usage
if __name__ == "__main__":
    # Configuration
    config = {
        'database_url': 'sqlite:///pipelines.db',
        'max_workers': 4,
        'chunk_size': 10000
    }
    
    # Create pipeline engine
    engine = PipelineEngine(config)
    
    # Example pipeline configuration
    pipeline_config = PipelineConfig(
        name="example_etl",
        description="Example ETL pipeline",
        sources=[
            DataSource(
                name="input_csv",
                type=DataSourceType.FILE,
                connection_string="./data/input.csv",
                format=DataFormat.CSV
            )
        ],
        targets=[
            DataTarget(
                name="output_json",
                type=DataSourceType.FILE,
                connection_string="./data/output.json",
                format=DataFormat.JSON
            )
        ],
        steps=[
            ProcessingStep(
                name="drop_nulls",
                function="drop_nulls"
            ),
            ProcessingStep(
                name="normalize_data",
                function="normalize",
                parameters={"method": "min_max"}
            )
        ],
        engine=ProcessingEngine.PANDAS,
        validation_level=ValidationLevel.BASIC
    )
    
    # Create API
    api = PipelineAPI(engine)
    
    async def main():
        # Execute example pipeline
        run = await engine.execute_pipeline(pipeline_config)
        print(f"Pipeline execution completed: {run.status}")
        
        # Run the API server
        uvicorn.run(api.app, host="0.0.0.0", port=8000)
    
    # Run the system
    asyncio.run(main())