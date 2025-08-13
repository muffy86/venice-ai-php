"""
Advanced Data Pipeline and ETL System for AI Training Data
Supports multiple data sources, transformations, and destinations
"""

import os
import json
import asyncio
import logging
import time
import hashlib
import pickle
from typing import Dict, List, Optional, Any, Callable, Union, Iterator, AsyncIterator
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import pandas as pd
import numpy as np
import aiofiles
import aiohttp
import asyncpg
import motor.motor_asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import redis.asyncio as aioredis
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import boto3
from azure.storage.blob.aio import BlobServiceClient
from google.cloud import storage as gcs
import structlog
from prometheus_client import Counter, Histogram, Gauge
import yaml
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from functools import partial
import dask.dataframe as dd
from dask.distributed import Client, as_completed
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import great_expectations as ge
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import spacy
import nltk
from transformers import AutoTokenizer, AutoModel
import torch
import cv2
import librosa
from PIL import Image
import pyarrow as pa
import pyarrow.parquet as pq


class DataSourceType(Enum):
    """Data source types"""
    FILE = "file"
    DATABASE = "database"
    API = "api"
    STREAM = "stream"
    CLOUD_STORAGE = "cloud_storage"
    MESSAGE_QUEUE = "message_queue"


class DataFormat(Enum):
    """Data formats"""
    CSV = "csv"
    JSON = "json"
    PARQUET = "parquet"
    AVRO = "avro"
    XML = "xml"
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    BINARY = "binary"


class TransformationType(Enum):
    """Transformation types"""
    CLEAN = "clean"
    NORMALIZE = "normalize"
    ENCODE = "encode"
    FEATURE_EXTRACT = "feature_extract"
    AUGMENT = "augment"
    FILTER = "filter"
    AGGREGATE = "aggregate"
    JOIN = "join"
    SPLIT = "split"
    VALIDATE = "validate"


@dataclass
class DataSource:
    """Data source configuration"""
    name: str
    type: DataSourceType
    format: DataFormat
    connection_config: Dict[str, Any]
    schema: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DataDestination:
    """Data destination configuration"""
    name: str
    type: DataSourceType
    format: DataFormat
    connection_config: Dict[str, Any]
    schema: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TransformationStep:
    """Data transformation step"""
    name: str
    type: TransformationType
    function: Callable
    parameters: Dict[str, Any] = field(default_factory=dict)
    parallel: bool = False
    batch_size: Optional[int] = None


@dataclass
class PipelineConfig:
    """Pipeline configuration"""
    name: str
    description: str
    sources: List[DataSource]
    destinations: List[DataDestination]
    transformations: List[TransformationStep]
    schedule: Optional[str] = None  # Cron expression
    parallel_workers: int = 4
    batch_size: int = 1000
    error_handling: str = "continue"  # continue, stop, retry
    retry_attempts: int = 3
    monitoring: Dict[str, Any] = field(default_factory=dict)


class DataQualityValidator:
    """Data quality validation using Great Expectations"""
    
    def __init__(self, config_path: str = "data_quality_config.yaml"):
        self.config_path = config_path
        self.context = None
        self.logger = structlog.get_logger(__name__)
        self._setup_context()
    
    def _setup_context(self):
        """Setup Great Expectations context"""
        try:
            self.context = ge.get_context()
        except Exception as e:
            self.logger.warning(f"Failed to setup GE context: {e}")
    
    async def validate_dataframe(self, df: pd.DataFrame, 
                                expectation_suite: str) -> Dict[str, Any]:
        """Validate DataFrame using expectation suite"""
        try:
            if self.context is None:
                return {"valid": True, "results": [], "errors": ["GE context not available"]}
            
            # Create dataset
            dataset = self.context.get_dataset(df, expectation_suite_name=expectation_suite)
            
            # Run validation
            results = dataset.validate()
            
            return {
                "valid": results.success,
                "results": results.results,
                "statistics": results.statistics,
                "meta": results.meta
            }
            
        except Exception as e:
            self.logger.error(f"Data validation failed: {e}")
            return {"valid": False, "errors": [str(e)]}
    
    def create_expectation_suite(self, name: str, expectations: List[Dict[str, Any]]):
        """Create expectation suite"""
        try:
            if self.context is None:
                return
            
            suite = self.context.create_expectation_suite(name)
            
            for expectation in expectations:
                suite.add_expectation(expectation)
            
            self.context.save_expectation_suite(suite)
            
        except Exception as e:
            self.logger.error(f"Failed to create expectation suite: {e}")


class DataReader:
    """Data reader for various sources"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
    
    async def read_file(self, source: DataSource) -> AsyncIterator[pd.DataFrame]:
        """Read data from file"""
        file_path = source.connection_config.get('path')
        batch_size = source.connection_config.get('batch_size', 10000)
        
        try:
            if source.format == DataFormat.CSV:
                # Read CSV in chunks
                for chunk in pd.read_csv(file_path, chunksize=batch_size):
                    yield chunk
            
            elif source.format == DataFormat.JSON:
                # Read JSON
                async with aiofiles.open(file_path, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    
                    if isinstance(data, list):
                        # Split into batches
                        for i in range(0, len(data), batch_size):
                            batch = data[i:i + batch_size]
                            yield pd.DataFrame(batch)
                    else:
                        yield pd.DataFrame([data])
            
            elif source.format == DataFormat.PARQUET:
                # Read Parquet
                df = pd.read_parquet(file_path)
                for i in range(0, len(df), batch_size):
                    yield df.iloc[i:i + batch_size]
            
            else:
                raise ValueError(f"Unsupported file format: {source.format}")
                
        except Exception as e:
            self.logger.error(f"Failed to read file {file_path}: {e}")
            raise
    
    async def read_database(self, source: DataSource) -> AsyncIterator[pd.DataFrame]:
        """Read data from database"""
        config = source.connection_config
        query = config.get('query')
        batch_size = config.get('batch_size', 10000)
        
        try:
            if config.get('type') == 'postgresql':
                # PostgreSQL
                conn_str = f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
                engine = create_async_engine(conn_str)
                
                async with engine.begin() as conn:
                    result = await conn.execute(text(query))
                    
                    while True:
                        rows = result.fetchmany(batch_size)
                        if not rows:
                            break
                        
                        df = pd.DataFrame(rows, columns=result.keys())
                        yield df
            
            elif config.get('type') == 'mongodb':
                # MongoDB
                client = motor.motor_asyncio.AsyncIOMotorClient(config['connection_string'])
                db = client[config['database']]
                collection = db[config['collection']]
                
                cursor = collection.find(config.get('filter', {}))
                
                batch = []
                async for document in cursor:
                    batch.append(document)
                    
                    if len(batch) >= batch_size:
                        yield pd.DataFrame(batch)
                        batch = []
                
                if batch:
                    yield pd.DataFrame(batch)
            
            else:
                raise ValueError(f"Unsupported database type: {config.get('type')}")
                
        except Exception as e:
            self.logger.error(f"Failed to read from database: {e}")
            raise
    
    async def read_api(self, source: DataSource) -> AsyncIterator[pd.DataFrame]:
        """Read data from API"""
        config = source.connection_config
        url = config.get('url')
        headers = config.get('headers', {})
        params = config.get('params', {})
        batch_size = config.get('batch_size', 1000)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if isinstance(data, list):
                            for i in range(0, len(data), batch_size):
                                batch = data[i:i + batch_size]
                                yield pd.DataFrame(batch)
                        else:
                            yield pd.DataFrame([data])
                    else:
                        raise Exception(f"API request failed: {response.status}")
                        
        except Exception as e:
            self.logger.error(f"Failed to read from API {url}: {e}")
            raise
    
    async def read_cloud_storage(self, source: DataSource) -> AsyncIterator[pd.DataFrame]:
        """Read data from cloud storage"""
        config = source.connection_config
        provider = config.get('provider')  # aws, azure, gcp
        
        try:
            if provider == 'aws':
                # AWS S3
                s3 = boto3.client('s3',
                    aws_access_key_id=config['access_key'],
                    aws_secret_access_key=config['secret_key']
                )
                
                bucket = config['bucket']
                key = config['key']
                
                obj = s3.get_object(Bucket=bucket, Key=key)
                content = obj['Body'].read()
                
                if source.format == DataFormat.CSV:
                    df = pd.read_csv(content)
                elif source.format == DataFormat.JSON:
                    data = json.loads(content)
                    df = pd.DataFrame(data)
                else:
                    raise ValueError(f"Unsupported format for S3: {source.format}")
                
                batch_size = config.get('batch_size', 10000)
                for i in range(0, len(df), batch_size):
                    yield df.iloc[i:i + batch_size]
            
            elif provider == 'azure':
                # Azure Blob Storage
                blob_service = BlobServiceClient(
                    account_url=config['account_url'],
                    credential=config['credential']
                )
                
                container = config['container']
                blob_name = config['blob_name']
                
                async with blob_service.get_blob_client(
                    container=container, blob=blob_name
                ) as blob_client:
                    content = await blob_client.download_blob()
                    data = await content.readall()
                    
                    if source.format == DataFormat.CSV:
                        df = pd.read_csv(data)
                    elif source.format == DataFormat.JSON:
                        json_data = json.loads(data)
                        df = pd.DataFrame(json_data)
                    else:
                        raise ValueError(f"Unsupported format for Azure: {source.format}")
                    
                    batch_size = config.get('batch_size', 10000)
                    for i in range(0, len(df), batch_size):
                        yield df.iloc[i:i + batch_size]
            
            elif provider == 'gcp':
                # Google Cloud Storage
                client = gcs.Client()
                bucket = client.bucket(config['bucket'])
                blob = bucket.blob(config['blob_name'])
                
                content = blob.download_as_text()
                
                if source.format == DataFormat.CSV:
                    df = pd.read_csv(content)
                elif source.format == DataFormat.JSON:
                    data = json.loads(content)
                    df = pd.DataFrame(data)
                else:
                    raise ValueError(f"Unsupported format for GCS: {source.format}")
                
                batch_size = config.get('batch_size', 10000)
                for i in range(0, len(df), batch_size):
                    yield df.iloc[i:i + batch_size]
            
            else:
                raise ValueError(f"Unsupported cloud provider: {provider}")
                
        except Exception as e:
            self.logger.error(f"Failed to read from cloud storage: {e}")
            raise


class DataTransformer:
    """Data transformation engine"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
        self.nlp = None
        self.tokenizer = None
        self._load_models()
    
    def _load_models(self):
        """Load NLP models"""
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            self.logger.warning("spaCy model not found, some NLP features disabled")
        
        try:
            # Load transformer tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
        except Exception:
            self.logger.warning("BERT tokenizer not available")
    
    async def transform(self, df: pd.DataFrame, 
                       transformations: List[TransformationStep]) -> pd.DataFrame:
        """Apply transformations to DataFrame"""
        result_df = df.copy()
        
        for step in transformations:
            try:
                self.logger.info(f"Applying transformation: {step.name}")
                
                if step.parallel and len(result_df) > 1000:
                    # Parallel processing for large datasets
                    result_df = await self._parallel_transform(result_df, step)
                else:
                    # Sequential processing
                    result_df = await self._apply_transformation(result_df, step)
                
            except Exception as e:
                self.logger.error(f"Transformation {step.name} failed: {e}")
                raise
        
        return result_df
    
    async def _parallel_transform(self, df: pd.DataFrame, 
                                 step: TransformationStep) -> pd.DataFrame:
        """Apply transformation in parallel"""
        batch_size = step.batch_size or 1000
        batches = [df.iloc[i:i + batch_size] for i in range(0, len(df), batch_size)]
        
        with ProcessPoolExecutor() as executor:
            futures = [
                executor.submit(self._apply_transformation_sync, batch, step)
                for batch in batches
            ]
            
            results = []
            for future in futures:
                results.append(future.result())
        
        return pd.concat(results, ignore_index=True)
    
    def _apply_transformation_sync(self, df: pd.DataFrame, 
                                  step: TransformationStep) -> pd.DataFrame:
        """Synchronous transformation for multiprocessing"""
        return asyncio.run(self._apply_transformation(df, step))
    
    async def _apply_transformation(self, df: pd.DataFrame, 
                                   step: TransformationStep) -> pd.DataFrame:
        """Apply single transformation step"""
        if step.type == TransformationType.CLEAN:
            return self._clean_data(df, step.parameters)
        elif step.type == TransformationType.NORMALIZE:
            return self._normalize_data(df, step.parameters)
        elif step.type == TransformationType.ENCODE:
            return self._encode_data(df, step.parameters)
        elif step.type == TransformationType.FEATURE_EXTRACT:
            return await self._extract_features(df, step.parameters)
        elif step.type == TransformationType.AUGMENT:
            return await self._augment_data(df, step.parameters)
        elif step.type == TransformationType.FILTER:
            return self._filter_data(df, step.parameters)
        elif step.type == TransformationType.AGGREGATE:
            return self._aggregate_data(df, step.parameters)
        elif step.type == TransformationType.SPLIT:
            return self._split_data(df, step.parameters)
        else:
            # Custom transformation function
            return step.function(df, **step.parameters)
    
    def _clean_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Clean data (remove nulls, duplicates, etc.)"""
        result = df.copy()
        
        # Remove duplicates
        if params.get('remove_duplicates', True):
            result = result.drop_duplicates()
        
        # Handle missing values
        null_strategy = params.get('null_strategy', 'drop')
        if null_strategy == 'drop':
            result = result.dropna()
        elif null_strategy == 'fill':
            fill_value = params.get('fill_value', 0)
            result = result.fillna(fill_value)
        elif null_strategy == 'interpolate':
            result = result.interpolate()
        
        # Remove outliers
        if params.get('remove_outliers', False):
            numeric_columns = result.select_dtypes(include=[np.number]).columns
            for col in numeric_columns:
                Q1 = result[col].quantile(0.25)
                Q3 = result[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                result = result[(result[col] >= lower_bound) & (result[col] <= upper_bound)]
        
        return result
    
    def _normalize_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Normalize numerical data"""
        result = df.copy()
        method = params.get('method', 'standard')
        columns = params.get('columns', result.select_dtypes(include=[np.number]).columns)
        
        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        else:
            raise ValueError(f"Unknown normalization method: {method}")
        
        result[columns] = scaler.fit_transform(result[columns])
        return result
    
    def _encode_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Encode categorical data"""
        result = df.copy()
        method = params.get('method', 'label')
        columns = params.get('columns', result.select_dtypes(include=['object']).columns)
        
        for col in columns:
            if method == 'label':
                encoder = LabelEncoder()
                result[col] = encoder.fit_transform(result[col].astype(str))
            elif method == 'onehot':
                dummies = pd.get_dummies(result[col], prefix=col)
                result = pd.concat([result.drop(col, axis=1), dummies], axis=1)
        
        return result
    
    async def _extract_features(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Extract features from data"""
        result = df.copy()
        feature_type = params.get('type', 'text')
        
        if feature_type == 'text':
            text_column = params.get('column')
            if text_column and text_column in df.columns:
                # TF-IDF features
                if params.get('tfidf', True):
                    vectorizer = TfidfVectorizer(
                        max_features=params.get('max_features', 1000),
                        stop_words='english'
                    )
                    tfidf_features = vectorizer.fit_transform(df[text_column].astype(str))
                    tfidf_df = pd.DataFrame(
                        tfidf_features.toarray(),
                        columns=[f"tfidf_{i}" for i in range(tfidf_features.shape[1])]
                    )
                    result = pd.concat([result, tfidf_df], axis=1)
                
                # NLP features
                if params.get('nlp_features', False) and self.nlp:
                    nlp_features = []
                    for text in df[text_column].astype(str):
                        doc = self.nlp(text)
                        features = {
                            'num_tokens': len(doc),
                            'num_sentences': len(list(doc.sents)),
                            'num_entities': len(doc.ents),
                            'avg_word_length': np.mean([len(token.text) for token in doc])
                        }
                        nlp_features.append(features)
                    
                    nlp_df = pd.DataFrame(nlp_features)
                    result = pd.concat([result, nlp_df], axis=1)
        
        elif feature_type == 'image':
            # Image feature extraction would go here
            pass
        
        elif feature_type == 'audio':
            # Audio feature extraction would go here
            pass
        
        return result
    
    async def _augment_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Augment data (create synthetic samples)"""
        result = df.copy()
        augmentation_type = params.get('type', 'noise')
        factor = params.get('factor', 1.0)  # Augmentation factor
        
        if augmentation_type == 'noise':
            # Add noise to numerical columns
            numeric_columns = result.select_dtypes(include=[np.number]).columns
            noise_level = params.get('noise_level', 0.01)
            
            for _ in range(int(len(df) * factor)):
                noisy_row = result.iloc[np.random.randint(len(result))].copy()
                for col in numeric_columns:
                    noise = np.random.normal(0, noise_level * noisy_row[col])
                    noisy_row[col] += noise
                result = pd.concat([result, noisy_row.to_frame().T], ignore_index=True)
        
        elif augmentation_type == 'smote':
            # SMOTE for imbalanced datasets
            try:
                from imblearn.over_sampling import SMOTE
                target_column = params.get('target_column')
                if target_column and target_column in df.columns:
                    X = df.drop(target_column, axis=1)
                    y = df[target_column]
                    
                    # Only use numerical columns for SMOTE
                    X_numeric = X.select_dtypes(include=[np.number])
                    
                    smote = SMOTE(random_state=42)
                    X_resampled, y_resampled = smote.fit_resample(X_numeric, y)
                    
                    result = pd.concat([
                        pd.DataFrame(X_resampled, columns=X_numeric.columns),
                        pd.Series(y_resampled, name=target_column)
                    ], axis=1)
            except ImportError:
                self.logger.warning("imbalanced-learn not available for SMOTE")
        
        return result
    
    def _filter_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Filter data based on conditions"""
        result = df.copy()
        conditions = params.get('conditions', [])
        
        for condition in conditions:
            column = condition.get('column')
            operator = condition.get('operator')
            value = condition.get('value')
            
            if column in result.columns:
                if operator == 'eq':
                    result = result[result[column] == value]
                elif operator == 'ne':
                    result = result[result[column] != value]
                elif operator == 'gt':
                    result = result[result[column] > value]
                elif operator == 'lt':
                    result = result[result[column] < value]
                elif operator == 'gte':
                    result = result[result[column] >= value]
                elif operator == 'lte':
                    result = result[result[column] <= value]
                elif operator == 'in':
                    result = result[result[column].isin(value)]
                elif operator == 'contains':
                    result = result[result[column].str.contains(value, na=False)]
        
        return result
    
    def _aggregate_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Aggregate data"""
        group_by = params.get('group_by', [])
        aggregations = params.get('aggregations', {})
        
        if group_by:
            result = df.groupby(group_by).agg(aggregations).reset_index()
        else:
            result = df.agg(aggregations).to_frame().T
        
        return result
    
    def _split_data(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """Split data (for train/test/validation)"""
        split_type = params.get('type', 'random')
        test_size = params.get('test_size', 0.2)
        val_size = params.get('val_size', 0.1)
        target_column = params.get('target_column')
        
        if split_type == 'random':
            if target_column and target_column in df.columns:
                X = df.drop(target_column, axis=1)
                y = df[target_column]
                
                X_train, X_temp, y_train, y_temp = train_test_split(
                    X, y, test_size=test_size + val_size, random_state=42
                )
                
                if val_size > 0:
                    val_ratio = val_size / (test_size + val_size)
                    X_val, X_test, y_val, y_test = train_test_split(
                        X_temp, y_temp, test_size=1-val_ratio, random_state=42
                    )
                    
                    # Add split indicators
                    train_df = pd.concat([X_train, y_train], axis=1)
                    train_df['split'] = 'train'
                    
                    val_df = pd.concat([X_val, y_val], axis=1)
                    val_df['split'] = 'validation'
                    
                    test_df = pd.concat([X_test, y_test], axis=1)
                    test_df['split'] = 'test'
                    
                    result = pd.concat([train_df, val_df, test_df], ignore_index=True)
                else:
                    train_df = pd.concat([X_train, y_train], axis=1)
                    train_df['split'] = 'train'
                    
                    test_df = pd.concat([X_temp, y_temp], axis=1)
                    test_df['split'] = 'test'
                    
                    result = pd.concat([train_df, test_df], ignore_index=True)
            else:
                # Random split without target
                indices = np.random.permutation(len(df))
                train_size = int(len(df) * (1 - test_size - val_size))
                val_size_abs = int(len(df) * val_size)
                
                train_indices = indices[:train_size]
                val_indices = indices[train_size:train_size + val_size_abs]
                test_indices = indices[train_size + val_size_abs:]
                
                result = df.copy()
                result['split'] = 'train'
                result.loc[val_indices, 'split'] = 'validation'
                result.loc[test_indices, 'split'] = 'test'
        
        return result


class DataWriter:
    """Data writer for various destinations"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
    
    async def write_file(self, df: pd.DataFrame, destination: DataDestination):
        """Write data to file"""
        file_path = destination.connection_config.get('path')
        
        try:
            if destination.format == DataFormat.CSV:
                df.to_csv(file_path, index=False)
            elif destination.format == DataFormat.JSON:
                df.to_json(file_path, orient='records', indent=2)
            elif destination.format == DataFormat.PARQUET:
                df.to_parquet(file_path, index=False)
            else:
                raise ValueError(f"Unsupported file format: {destination.format}")
                
        except Exception as e:
            self.logger.error(f"Failed to write file {file_path}: {e}")
            raise
    
    async def write_database(self, df: pd.DataFrame, destination: DataDestination):
        """Write data to database"""
        config = destination.connection_config
        table_name = config.get('table')
        
        try:
            if config.get('type') == 'postgresql':
                # PostgreSQL
                conn_str = f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
                engine = create_engine(conn_str)
                
                df.to_sql(table_name, engine, if_exists='append', index=False)
            
            elif config.get('type') == 'mongodb':
                # MongoDB
                client = motor.motor_asyncio.AsyncIOMotorClient(config['connection_string'])
                db = client[config['database']]
                collection = db[config['collection']]
                
                records = df.to_dict('records')
                await collection.insert_many(records)
            
            else:
                raise ValueError(f"Unsupported database type: {config.get('type')}")
                
        except Exception as e:
            self.logger.error(f"Failed to write to database: {e}")
            raise


class DataPipeline:
    """Main data pipeline orchestrator"""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.reader = DataReader()
        self.transformer = DataTransformer()
        self.writer = DataWriter()
        self.validator = DataQualityValidator()
        self.logger = structlog.get_logger(__name__)
        
        # Metrics
        self._setup_metrics()
        
        # State
        self.is_running = False
        self.current_batch = 0
        self.total_processed = 0
        self.errors = []
    
    def _setup_metrics(self):
        """Setup Prometheus metrics"""
        self.records_processed = Counter(
            'pipeline_records_processed_total',
            'Total records processed',
            ['pipeline', 'source']
        )
        
        self.processing_time = Histogram(
            'pipeline_processing_seconds',
            'Time spent processing batches',
            ['pipeline', 'stage']
        )
        
        self.pipeline_errors = Counter(
            'pipeline_errors_total',
            'Total pipeline errors',
            ['pipeline', 'stage', 'error_type']
        )
        
        self.active_pipelines = Gauge(
            'pipeline_active_count',
            'Number of active pipelines'
        )
    
    async def run(self) -> Dict[str, Any]:
        """Run the data pipeline"""
        self.is_running = True
        self.active_pipelines.inc()
        start_time = time.time()
        
        try:
            self.logger.info(f"Starting pipeline: {self.config.name}")
            
            # Process each data source
            for source in self.config.sources:
                await self._process_source(source)
            
            duration = time.time() - start_time
            
            result = {
                "pipeline": self.config.name,
                "status": "completed",
                "duration": duration,
                "total_processed": self.total_processed,
                "batches": self.current_batch,
                "errors": len(self.errors)
            }
            
            self.logger.info(f"Pipeline completed: {result}")
            return result
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}")
            self.pipeline_errors.labels(
                pipeline=self.config.name,
                stage="pipeline",
                error_type=type(e).__name__
            ).inc()
            
            return {
                "pipeline": self.config.name,
                "status": "failed",
                "error": str(e),
                "total_processed": self.total_processed,
                "batches": self.current_batch
            }
        
        finally:
            self.is_running = False
            self.active_pipelines.dec()
    
    async def _process_source(self, source: DataSource):
        """Process a single data source"""
        self.logger.info(f"Processing source: {source.name}")
        
        try:
            # Read data
            async for batch_df in self._read_data(source):
                await self._process_batch(batch_df, source)
                
        except Exception as e:
            self.logger.error(f"Failed to process source {source.name}: {e}")
            if self.config.error_handling == "stop":
                raise
            else:
                self.errors.append({
                    "source": source.name,
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    async def _read_data(self, source: DataSource) -> AsyncIterator[pd.DataFrame]:
        """Read data from source"""
        with self.processing_time.labels(
            pipeline=self.config.name,
            stage="read"
        ).time():
            
            if source.type == DataSourceType.FILE:
                async for batch in self.reader.read_file(source):
                    yield batch
            elif source.type == DataSourceType.DATABASE:
                async for batch in self.reader.read_database(source):
                    yield batch
            elif source.type == DataSourceType.API:
                async for batch in self.reader.read_api(source):
                    yield batch
            elif source.type == DataSourceType.CLOUD_STORAGE:
                async for batch in self.reader.read_cloud_storage(source):
                    yield batch
            else:
                raise ValueError(f"Unsupported source type: {source.type}")
    
    async def _process_batch(self, df: pd.DataFrame, source: DataSource):
        """Process a single batch of data"""
        self.current_batch += 1
        batch_size = len(df)
        
        try:
            self.logger.info(f"Processing batch {self.current_batch} with {batch_size} records")
            
            # Data validation
            if self.config.monitoring.get('validate_input', False):
                validation_result = await self.validator.validate_dataframe(
                    df, 
                    self.config.monitoring.get('input_expectation_suite', 'default')
                )
                
                if not validation_result['valid']:
                    self.logger.warning(f"Input validation failed: {validation_result}")
                    if self.config.error_handling == "stop":
                        raise ValueError("Input validation failed")
            
            # Apply transformations
            with self.processing_time.labels(
                pipeline=self.config.name,
                stage="transform"
            ).time():
                transformed_df = await self.transformer.transform(df, self.config.transformations)
            
            # Output validation
            if self.config.monitoring.get('validate_output', False):
                validation_result = await self.validator.validate_dataframe(
                    transformed_df,
                    self.config.monitoring.get('output_expectation_suite', 'default')
                )
                
                if not validation_result['valid']:
                    self.logger.warning(f"Output validation failed: {validation_result}")
                    if self.config.error_handling == "stop":
                        raise ValueError("Output validation failed")
            
            # Write to destinations
            with self.processing_time.labels(
                pipeline=self.config.name,
                stage="write"
            ).time():
                for destination in self.config.destinations:
                    await self._write_data(transformed_df, destination)
            
            # Update metrics
            self.records_processed.labels(
                pipeline=self.config.name,
                source=source.name
            ).inc(batch_size)
            
            self.total_processed += batch_size
            
        except Exception as e:
            self.logger.error(f"Failed to process batch {self.current_batch}: {e}")
            self.pipeline_errors.labels(
                pipeline=self.config.name,
                stage="batch",
                error_type=type(e).__name__
            ).inc()
            
            if self.config.error_handling == "stop":
                raise
            else:
                self.errors.append({
                    "batch": self.current_batch,
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    async def _write_data(self, df: pd.DataFrame, destination: DataDestination):
        """Write data to destination"""
        try:
            if destination.type == DataSourceType.FILE:
                await self.writer.write_file(df, destination)
            elif destination.type == DataSourceType.DATABASE:
                await self.writer.write_database(df, destination)
            else:
                raise ValueError(f"Unsupported destination type: {destination.type}")
                
        except Exception as e:
            self.logger.error(f"Failed to write to destination {destination.name}: {e}")
            raise


class PipelineScheduler:
    """Pipeline scheduler for automated execution"""
    
    def __init__(self):
        self.pipelines: Dict[str, DataPipeline] = {}
        self.schedules: Dict[str, str] = {}  # pipeline_name -> cron expression
        self.logger = structlog.get_logger(__name__)
        self.is_running = False
    
    def register_pipeline(self, pipeline: DataPipeline, schedule: Optional[str] = None):
        """Register a pipeline with optional schedule"""
        self.pipelines[pipeline.config.name] = pipeline
        if schedule:
            self.schedules[pipeline.config.name] = schedule
    
    async def start(self):
        """Start the scheduler"""
        self.is_running = True
        self.logger.info("Pipeline scheduler started")
        
        # Start scheduler loop
        asyncio.create_task(self._scheduler_loop())
    
    async def stop(self):
        """Stop the scheduler"""
        self.is_running = False
        self.logger.info("Pipeline scheduler stopped")
    
    async def run_pipeline(self, pipeline_name: str) -> Dict[str, Any]:
        """Run a specific pipeline"""
        if pipeline_name not in self.pipelines:
            raise ValueError(f"Pipeline not found: {pipeline_name}")
        
        pipeline = self.pipelines[pipeline_name]
        return await pipeline.run()
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                current_time = datetime.utcnow()
                
                for pipeline_name, cron_expr in self.schedules.items():
                    if self._should_run(cron_expr, current_time):
                        self.logger.info(f"Scheduled execution: {pipeline_name}")
                        asyncio.create_task(self.run_pipeline(pipeline_name))
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                self.logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(5)
    
    def _should_run(self, cron_expr: str, current_time: datetime) -> bool:
        """Check if pipeline should run based on cron expression"""
        # Simplified cron parsing - in production, use a proper cron library
        # Format: "minute hour day month weekday"
        parts = cron_expr.split()
        if len(parts) != 5:
            return False
        
        minute, hour, day, month, weekday = parts
        
        # Check minute
        if minute != '*' and int(minute) != current_time.minute:
            return False
        
        # Check hour
        if hour != '*' and int(hour) != current_time.hour:
            return False
        
        # Add more cron logic as needed
        return True


# Example usage and configuration
def create_example_pipeline() -> PipelineConfig:
    """Create an example data pipeline configuration"""
    
    # Data source
    source = DataSource(
        name="user_data",
        type=DataSourceType.FILE,
        format=DataFormat.CSV,
        connection_config={
            "path": "data/users.csv",
            "batch_size": 1000
        }
    )
    
    # Data destination
    destination = DataDestination(
        name="processed_data",
        type=DataSourceType.FILE,
        format=DataFormat.PARQUET,
        connection_config={
            "path": "output/processed_users.parquet"
        }
    )
    
    # Transformations
    transformations = [
        TransformationStep(
            name="clean_data",
            type=TransformationType.CLEAN,
            function=None,
            parameters={
                "remove_duplicates": True,
                "null_strategy": "drop",
                "remove_outliers": True
            }
        ),
        TransformationStep(
            name="normalize_features",
            type=TransformationType.NORMALIZE,
            function=None,
            parameters={
                "method": "standard",
                "columns": ["age", "income", "score"]
            }
        ),
        TransformationStep(
            name="encode_categories",
            type=TransformationType.ENCODE,
            function=None,
            parameters={
                "method": "onehot",
                "columns": ["category", "region"]
            }
        ),
        TransformationStep(
            name="extract_text_features",
            type=TransformationType.FEATURE_EXTRACT,
            function=None,
            parameters={
                "type": "text",
                "column": "description",
                "tfidf": True,
                "max_features": 500,
                "nlp_features": True
            }
        )
    ]
    
    # Pipeline configuration
    config = PipelineConfig(
        name="user_data_pipeline",
        description="Process user data for ML training",
        sources=[source],
        destinations=[destination],
        transformations=transformations,
        schedule="0 2 * * *",  # Daily at 2 AM
        parallel_workers=4,
        batch_size=1000,
        error_handling="continue",
        retry_attempts=3,
        monitoring={
            "validate_input": True,
            "validate_output": True,
            "input_expectation_suite": "user_data_input",
            "output_expectation_suite": "user_data_output"
        }
    )
    
    return config


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Data Pipeline")
    parser.add_argument("--config", type=str, required=True,
                       help="Path to pipeline configuration file")
    parser.add_argument("--run-once", action="store_true",
                       help="Run pipeline once and exit")
    parser.add_argument("--schedule", action="store_true",
                       help="Run pipeline scheduler")
    
    args = parser.parse_args()
    
    async def main():
        # Load configuration
        with open(args.config, 'r') as f:
            config_dict = yaml.safe_load(f)
        
        # Create pipeline configuration
        # (In practice, you'd have a proper config parser)
        config = create_example_pipeline()  # Placeholder
        
        if args.run_once:
            # Run pipeline once
            pipeline = DataPipeline(config)
            result = await pipeline.run()
            print(f"Pipeline result: {result}")
        
        elif args.schedule:
            # Run scheduler
            scheduler = PipelineScheduler()
            pipeline = DataPipeline(config)
            scheduler.register_pipeline(pipeline, config.schedule)
            
            await scheduler.start()
            
            try:
                # Keep running
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                await scheduler.stop()
        
        else:
            print("Please specify --run-once or --schedule")
    
    asyncio.run(main())