"""
Advanced Model Training and Evaluation System
Supports multiple ML frameworks, automated hyperparameter tuning, and comprehensive evaluation
"""

import os
import json
import asyncio
import logging
import time
import pickle
import joblib
import hashlib
from typing import Dict, List, Optional, Any, Callable, Union, Tuple, Type
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import (
    train_test_split, cross_val_score, GridSearchCV, RandomizedSearchCV,
    StratifiedKFold, KFold, TimeSeriesSplit
)
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_squared_error, mean_absolute_error, r2_score, classification_report,
    confusion_matrix, roc_curve, precision_recall_curve
)
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier,
    GradientBoostingRegressor, AdaBoostClassifier, AdaBoostRegressor
)
from sklearn.linear_model import (
    LogisticRegression, LinearRegression, Ridge, Lasso, ElasticNet
)
from sklearn.svm import SVC, SVR
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
import xgboost as xgb
import lightgbm as lgb
import catboost as cb
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import tensorflow as tf
from tensorflow import keras
import optuna
from hyperopt import hp, fmin, tpe, Trials, STATUS_OK
import mlflow
import mlflow.sklearn
import mlflow.pytorch
import mlflow.tensorflow
from mlflow.tracking import MlflowClient
import wandb
import structlog
from prometheus_client import Counter, Histogram, Gauge
import yaml
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from functools import partial
import warnings
warnings.filterwarnings('ignore')


class ModelType(Enum):
    """Model types"""
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    DEEP_LEARNING = "deep_learning"
    TIME_SERIES = "time_series"
    NLP = "nlp"
    COMPUTER_VISION = "computer_vision"


class Framework(Enum):
    """ML frameworks"""
    SKLEARN = "sklearn"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    KERAS = "keras"


class OptimizationMethod(Enum):
    """Hyperparameter optimization methods"""
    GRID_SEARCH = "grid_search"
    RANDOM_SEARCH = "random_search"
    BAYESIAN = "bayesian"
    OPTUNA = "optuna"
    HYPEROPT = "hyperopt"


@dataclass
class ModelConfig:
    """Model configuration"""
    name: str
    type: ModelType
    framework: Framework
    algorithm: str
    hyperparameters: Dict[str, Any] = field(default_factory=dict)
    optimization: Optional[Dict[str, Any]] = None
    cross_validation: Dict[str, Any] = field(default_factory=dict)
    early_stopping: Dict[str, Any] = field(default_factory=dict)
    feature_selection: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TrainingConfig:
    """Training configuration"""
    experiment_name: str
    models: List[ModelConfig]
    data_config: Dict[str, Any]
    evaluation_metrics: List[str]
    validation_strategy: str = "holdout"  # holdout, cv, time_series
    test_size: float = 0.2
    validation_size: float = 0.1
    random_state: int = 42
    n_jobs: int = -1
    verbose: bool = True
    save_models: bool = True
    model_registry: Dict[str, Any] = field(default_factory=dict)
    tracking: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExperimentResult:
    """Experiment result"""
    experiment_id: str
    model_name: str
    framework: str
    algorithm: str
    hyperparameters: Dict[str, Any]
    metrics: Dict[str, float]
    training_time: float
    prediction_time: float
    model_size: int
    feature_importance: Optional[Dict[str, float]] = None
    confusion_matrix: Optional[np.ndarray] = None
    roc_curve: Optional[Tuple[np.ndarray, np.ndarray, np.ndarray]] = None
    artifacts: Dict[str, str] = field(default_factory=dict)


class ModelFactory:
    """Factory for creating ML models"""
    
    @staticmethod
    def create_model(config: ModelConfig):
        """Create model based on configuration"""
        framework = config.framework
        algorithm = config.algorithm
        params = config.hyperparameters
        
        if framework == Framework.SKLEARN:
            return ModelFactory._create_sklearn_model(algorithm, params)
        elif framework == Framework.XGBOOST:
            return ModelFactory._create_xgboost_model(config.type, params)
        elif framework == Framework.LIGHTGBM:
            return ModelFactory._create_lightgbm_model(config.type, params)
        elif framework == Framework.CATBOOST:
            return ModelFactory._create_catboost_model(config.type, params)
        elif framework == Framework.PYTORCH:
            return ModelFactory._create_pytorch_model(config, params)
        elif framework == Framework.TENSORFLOW:
            return ModelFactory._create_tensorflow_model(config, params)
        else:
            raise ValueError(f"Unsupported framework: {framework}")
    
    @staticmethod
    def _create_sklearn_model(algorithm: str, params: Dict[str, Any]):
        """Create scikit-learn model"""
        models = {
            'random_forest_classifier': RandomForestClassifier,
            'random_forest_regressor': RandomForestRegressor,
            'gradient_boosting_classifier': GradientBoostingClassifier,
            'gradient_boosting_regressor': GradientBoostingRegressor,
            'logistic_regression': LogisticRegression,
            'linear_regression': LinearRegression,
            'ridge': Ridge,
            'lasso': Lasso,
            'elastic_net': ElasticNet,
            'svc': SVC,
            'svr': SVR,
            'mlp_classifier': MLPClassifier,
            'mlp_regressor': MLPRegressor,
            'decision_tree_classifier': DecisionTreeClassifier,
            'decision_tree_regressor': DecisionTreeRegressor,
            'gaussian_nb': GaussianNB,
            'knn_classifier': KNeighborsClassifier,
            'knn_regressor': KNeighborsRegressor,
            'ada_boost_classifier': AdaBoostClassifier,
            'ada_boost_regressor': AdaBoostRegressor
        }
        
        if algorithm not in models:
            raise ValueError(f"Unknown sklearn algorithm: {algorithm}")
        
        return models[algorithm](**params)
    
    @staticmethod
    def _create_xgboost_model(model_type: ModelType, params: Dict[str, Any]):
        """Create XGBoost model"""
        if model_type == ModelType.CLASSIFICATION:
            return xgb.XGBClassifier(**params)
        elif model_type == ModelType.REGRESSION:
            return xgb.XGBRegressor(**params)
        else:
            raise ValueError(f"XGBoost doesn't support model type: {model_type}")
    
    @staticmethod
    def _create_lightgbm_model(model_type: ModelType, params: Dict[str, Any]):
        """Create LightGBM model"""
        if model_type == ModelType.CLASSIFICATION:
            return lgb.LGBMClassifier(**params)
        elif model_type == ModelType.REGRESSION:
            return lgb.LGBMRegressor(**params)
        else:
            raise ValueError(f"LightGBM doesn't support model type: {model_type}")
    
    @staticmethod
    def _create_catboost_model(model_type: ModelType, params: Dict[str, Any]):
        """Create CatBoost model"""
        if model_type == ModelType.CLASSIFICATION:
            return cb.CatBoostClassifier(**params)
        elif model_type == ModelType.REGRESSION:
            return cb.CatBoostRegressor(**params)
        else:
            raise ValueError(f"CatBoost doesn't support model type: {model_type}")
    
    @staticmethod
    def _create_pytorch_model(config: ModelConfig, params: Dict[str, Any]):
        """Create PyTorch model"""
        # This would create custom PyTorch models based on config
        # For now, return a simple neural network
        class SimpleNN(nn.Module):
            def __init__(self, input_size, hidden_sizes, output_size, dropout=0.2):
                super(SimpleNN, self).__init__()
                layers = []
                
                prev_size = input_size
                for hidden_size in hidden_sizes:
                    layers.append(nn.Linear(prev_size, hidden_size))
                    layers.append(nn.ReLU())
                    layers.append(nn.Dropout(dropout))
                    prev_size = hidden_size
                
                layers.append(nn.Linear(prev_size, output_size))
                
                if config.type == ModelType.CLASSIFICATION:
                    layers.append(nn.Softmax(dim=1))
                
                self.network = nn.Sequential(*layers)
            
            def forward(self, x):
                return self.network(x)
        
        input_size = params.get('input_size', 10)
        hidden_sizes = params.get('hidden_sizes', [64, 32])
        output_size = params.get('output_size', 1)
        dropout = params.get('dropout', 0.2)
        
        return SimpleNN(input_size, hidden_sizes, output_size, dropout)
    
    @staticmethod
    def _create_tensorflow_model(config: ModelConfig, params: Dict[str, Any]):
        """Create TensorFlow/Keras model"""
        input_size = params.get('input_size', 10)
        hidden_sizes = params.get('hidden_sizes', [64, 32])
        output_size = params.get('output_size', 1)
        dropout = params.get('dropout', 0.2)
        
        model = keras.Sequential()
        model.add(keras.layers.Dense(hidden_sizes[0], activation='relu', input_shape=(input_size,)))
        
        for hidden_size in hidden_sizes[1:]:
            model.add(keras.layers.Dense(hidden_size, activation='relu'))
            model.add(keras.layers.Dropout(dropout))
        
        if config.type == ModelType.CLASSIFICATION:
            activation = 'softmax' if output_size > 1 else 'sigmoid'
        else:
            activation = 'linear'
        
        model.add(keras.layers.Dense(output_size, activation=activation))
        
        return model


class HyperparameterOptimizer:
    """Hyperparameter optimization"""
    
    def __init__(self, method: OptimizationMethod = OptimizationMethod.OPTUNA):
        self.method = method
        self.logger = structlog.get_logger(__name__)
    
    def optimize(self, model_config: ModelConfig, X_train: np.ndarray, 
                y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray,
                n_trials: int = 100) -> Dict[str, Any]:
        """Optimize hyperparameters"""
        
        if self.method == OptimizationMethod.OPTUNA:
            return self._optimize_with_optuna(model_config, X_train, y_train, X_val, y_val, n_trials)
        elif self.method == OptimizationMethod.HYPEROPT:
            return self._optimize_with_hyperopt(model_config, X_train, y_train, X_val, y_val, n_trials)
        elif self.method == OptimizationMethod.GRID_SEARCH:
            return self._optimize_with_grid_search(model_config, X_train, y_train)
        elif self.method == OptimizationMethod.RANDOM_SEARCH:
            return self._optimize_with_random_search(model_config, X_train, y_train)
        else:
            raise ValueError(f"Unsupported optimization method: {self.method}")
    
    def _optimize_with_optuna(self, model_config: ModelConfig, X_train: np.ndarray,
                             y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray,
                             n_trials: int) -> Dict[str, Any]:
        """Optimize using Optuna"""
        
        def objective(trial):
            # Define hyperparameter search space
            params = self._get_optuna_search_space(model_config, trial)
            
            # Create and train model
            config_copy = ModelConfig(
                name=model_config.name,
                type=model_config.type,
                framework=model_config.framework,
                algorithm=model_config.algorithm,
                hyperparameters=params
            )
            
            model = ModelFactory.create_model(config_copy)
            
            try:
                model.fit(X_train, y_train)
                predictions = model.predict(X_val)
                
                # Calculate metric based on model type
                if model_config.type == ModelType.CLASSIFICATION:
                    score = accuracy_score(y_val, predictions)
                else:
                    score = -mean_squared_error(y_val, predictions)  # Negative for minimization
                
                return score
                
            except Exception as e:
                self.logger.warning(f"Trial failed: {e}")
                return float('-inf')
        
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=n_trials)
        
        return {
            'best_params': study.best_params,
            'best_score': study.best_value,
            'n_trials': len(study.trials)
        }
    
    def _get_optuna_search_space(self, model_config: ModelConfig, trial) -> Dict[str, Any]:
        """Define Optuna search space for different algorithms"""
        algorithm = model_config.algorithm
        framework = model_config.framework
        
        if framework == Framework.SKLEARN:
            if algorithm == 'random_forest_classifier' or algorithm == 'random_forest_regressor':
                return {
                    'n_estimators': trial.suggest_int('n_estimators', 10, 200),
                    'max_depth': trial.suggest_int('max_depth', 3, 20),
                    'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
                    'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
                    'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', None])
                }
            elif algorithm == 'logistic_regression':
                return {
                    'C': trial.suggest_float('C', 0.01, 100, log=True),
                    'penalty': trial.suggest_categorical('penalty', ['l1', 'l2', 'elasticnet']),
                    'solver': trial.suggest_categorical('solver', ['liblinear', 'saga'])
                }
            elif algorithm == 'svc':
                return {
                    'C': trial.suggest_float('C', 0.01, 100, log=True),
                    'kernel': trial.suggest_categorical('kernel', ['linear', 'rbf', 'poly']),
                    'gamma': trial.suggest_categorical('gamma', ['scale', 'auto'])
                }
        
        elif framework == Framework.XGBOOST:
            return {
                'n_estimators': trial.suggest_int('n_estimators', 50, 300),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'reg_alpha': trial.suggest_float('reg_alpha', 0, 10),
                'reg_lambda': trial.suggest_float('reg_lambda', 0, 10)
            }
        
        elif framework == Framework.LIGHTGBM:
            return {
                'n_estimators': trial.suggest_int('n_estimators', 50, 300),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'reg_alpha': trial.suggest_float('reg_alpha', 0, 10),
                'reg_lambda': trial.suggest_float('reg_lambda', 0, 10),
                'num_leaves': trial.suggest_int('num_leaves', 10, 100)
            }
        
        # Default empty params
        return {}
    
    def _optimize_with_hyperopt(self, model_config: ModelConfig, X_train: np.ndarray,
                               y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray,
                               n_trials: int) -> Dict[str, Any]:
        """Optimize using Hyperopt"""
        # Implementation would be similar to Optuna but using Hyperopt syntax
        # For brevity, returning placeholder
        return {'best_params': {}, 'best_score': 0.0, 'n_trials': n_trials}
    
    def _optimize_with_grid_search(self, model_config: ModelConfig, 
                                  X_train: np.ndarray, y_train: np.ndarray) -> Dict[str, Any]:
        """Optimize using Grid Search"""
        model = ModelFactory.create_model(model_config)
        param_grid = model_config.optimization.get('param_grid', {})
        
        grid_search = GridSearchCV(
            model, param_grid, cv=5, scoring='accuracy', n_jobs=-1
        )
        grid_search.fit(X_train, y_train)
        
        return {
            'best_params': grid_search.best_params_,
            'best_score': grid_search.best_score_,
            'n_trials': len(grid_search.cv_results_['params'])
        }
    
    def _optimize_with_random_search(self, model_config: ModelConfig,
                                    X_train: np.ndarray, y_train: np.ndarray) -> Dict[str, Any]:
        """Optimize using Random Search"""
        model = ModelFactory.create_model(model_config)
        param_distributions = model_config.optimization.get('param_distributions', {})
        n_iter = model_config.optimization.get('n_iter', 100)
        
        random_search = RandomizedSearchCV(
            model, param_distributions, n_iter=n_iter, cv=5, 
            scoring='accuracy', n_jobs=-1, random_state=42
        )
        random_search.fit(X_train, y_train)
        
        return {
            'best_params': random_search.best_params_,
            'best_score': random_search.best_score_,
            'n_trials': n_iter
        }


class ModelEvaluator:
    """Model evaluation and metrics calculation"""
    
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
    
    def evaluate_model(self, model, X_test: np.ndarray, y_test: np.ndarray,
                      model_type: ModelType, metrics: List[str]) -> Dict[str, Any]:
        """Evaluate model performance"""
        
        start_time = time.time()
        predictions = model.predict(X_test)
        prediction_time = time.time() - start_time
        
        results = {
            'prediction_time': prediction_time,
            'n_samples': len(X_test)
        }
        
        if model_type == ModelType.CLASSIFICATION:
            results.update(self._evaluate_classification(y_test, predictions, model, X_test, metrics))
        elif model_type == ModelType.REGRESSION:
            results.update(self._evaluate_regression(y_test, predictions, metrics))
        
        return results
    
    def _evaluate_classification(self, y_true: np.ndarray, y_pred: np.ndarray,
                               model, X_test: np.ndarray, metrics: List[str]) -> Dict[str, Any]:
        """Evaluate classification model"""
        results = {}
        
        # Basic metrics
        if 'accuracy' in metrics:
            results['accuracy'] = accuracy_score(y_true, y_pred)
        
        if 'precision' in metrics:
            results['precision'] = precision_score(y_true, y_pred, average='weighted')
        
        if 'recall' in metrics:
            results['recall'] = recall_score(y_true, y_pred, average='weighted')
        
        if 'f1' in metrics:
            results['f1'] = f1_score(y_true, y_pred, average='weighted')
        
        # ROC AUC (for binary classification or with predict_proba)
        if 'roc_auc' in metrics:
            try:
                if hasattr(model, 'predict_proba'):
                    y_proba = model.predict_proba(X_test)
                    if y_proba.shape[1] == 2:  # Binary classification
                        results['roc_auc'] = roc_auc_score(y_true, y_proba[:, 1])
                    else:  # Multi-class
                        results['roc_auc'] = roc_auc_score(y_true, y_proba, multi_class='ovr')
            except Exception as e:
                self.logger.warning(f"Could not calculate ROC AUC: {e}")
        
        # Confusion matrix
        results['confusion_matrix'] = confusion_matrix(y_true, y_pred).tolist()
        
        # Classification report
        results['classification_report'] = classification_report(y_true, y_pred, output_dict=True)
        
        return results
    
    def _evaluate_regression(self, y_true: np.ndarray, y_pred: np.ndarray,
                           metrics: List[str]) -> Dict[str, Any]:
        """Evaluate regression model"""
        results = {}
        
        if 'mse' in metrics:
            results['mse'] = mean_squared_error(y_true, y_pred)
        
        if 'rmse' in metrics:
            results['rmse'] = np.sqrt(mean_squared_error(y_true, y_pred))
        
        if 'mae' in metrics:
            results['mae'] = mean_absolute_error(y_true, y_pred)
        
        if 'r2' in metrics:
            results['r2'] = r2_score(y_true, y_pred)
        
        # Additional regression metrics
        if 'mape' in metrics:
            results['mape'] = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        
        return results
    
    def cross_validate_model(self, model, X: np.ndarray, y: np.ndarray,
                           model_type: ModelType, cv_config: Dict[str, Any]) -> Dict[str, Any]:
        """Perform cross-validation"""
        
        cv_method = cv_config.get('method', 'kfold')
        n_splits = cv_config.get('n_splits', 5)
        
        if cv_method == 'kfold':
            cv = KFold(n_splits=n_splits, shuffle=True, random_state=42)
        elif cv_method == 'stratified':
            cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        elif cv_method == 'time_series':
            cv = TimeSeriesSplit(n_splits=n_splits)
        else:
            raise ValueError(f"Unknown CV method: {cv_method}")
        
        # Choose scoring metric
        if model_type == ModelType.CLASSIFICATION:
            scoring = cv_config.get('scoring', 'accuracy')
        else:
            scoring = cv_config.get('scoring', 'neg_mean_squared_error')
        
        scores = cross_val_score(model, X, y, cv=cv, scoring=scoring, n_jobs=-1)
        
        return {
            'cv_scores': scores.tolist(),
            'cv_mean': scores.mean(),
            'cv_std': scores.std(),
            'cv_method': cv_method,
            'n_splits': n_splits
        }


class ExperimentTracker:
    """Experiment tracking and logging"""
    
    def __init__(self, tracking_config: Dict[str, Any]):
        self.config = tracking_config
        self.logger = structlog.get_logger(__name__)
        self.mlflow_client = None
        self.wandb_run = None
        
        self._setup_tracking()
    
    def _setup_tracking(self):
        """Setup experiment tracking"""
        if self.config.get('mlflow', {}).get('enabled', False):
            mlflow_config = self.config['mlflow']
            mlflow.set_tracking_uri(mlflow_config.get('tracking_uri', 'sqlite:///mlflow.db'))
            self.mlflow_client = MlflowClient()
        
        if self.config.get('wandb', {}).get('enabled', False):
            wandb_config = self.config['wandb']
            wandb.init(
                project=wandb_config.get('project', 'ml-experiments'),
                entity=wandb_config.get('entity'),
                config=wandb_config.get('config', {})
            )
            self.wandb_run = wandb.run
    
    def start_experiment(self, experiment_name: str) -> str:
        """Start a new experiment"""
        experiment_id = f"{experiment_name}_{int(time.time())}"
        
        if self.mlflow_client:
            try:
                mlflow.create_experiment(experiment_name)
            except Exception:
                pass  # Experiment might already exist
            mlflow.set_experiment(experiment_name)
        
        return experiment_id
    
    def log_model_training(self, model_config: ModelConfig, model, 
                          metrics: Dict[str, Any], artifacts: Dict[str, str] = None):
        """Log model training results"""
        
        if self.mlflow_client:
            with mlflow.start_run():
                # Log parameters
                mlflow.log_params(model_config.hyperparameters)
                mlflow.log_param("algorithm", model_config.algorithm)
                mlflow.log_param("framework", model_config.framework.value)
                
                # Log metrics
                for metric_name, metric_value in metrics.items():
                    if isinstance(metric_value, (int, float)):
                        mlflow.log_metric(metric_name, metric_value)
                
                # Log model
                if model_config.framework == Framework.SKLEARN:
                    mlflow.sklearn.log_model(model, "model")
                elif model_config.framework == Framework.PYTORCH:
                    mlflow.pytorch.log_model(model, "model")
                elif model_config.framework == Framework.TENSORFLOW:
                    mlflow.tensorflow.log_model(model, "model")
                
                # Log artifacts
                if artifacts:
                    for artifact_name, artifact_path in artifacts.items():
                        mlflow.log_artifact(artifact_path, artifact_name)
        
        if self.wandb_run:
            # Log to Weights & Biases
            wandb.log({
                **model_config.hyperparameters,
                **metrics,
                "algorithm": model_config.algorithm,
                "framework": model_config.framework.value
            })
    
    def log_hyperparameter_optimization(self, optimization_results: Dict[str, Any]):
        """Log hyperparameter optimization results"""
        
        if self.mlflow_client:
            with mlflow.start_run():
                mlflow.log_params(optimization_results['best_params'])
                mlflow.log_metric("best_score", optimization_results['best_score'])
                mlflow.log_metric("n_trials", optimization_results['n_trials'])
        
        if self.wandb_run:
            wandb.log({
                "best_score": optimization_results['best_score'],
                "n_trials": optimization_results['n_trials'],
                **optimization_results['best_params']
            })


class ModelTrainingSystem:
    """Main model training and evaluation system"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        self.optimizer = HyperparameterOptimizer()
        self.evaluator = ModelEvaluator()
        self.tracker = ExperimentTracker(config.tracking)
        
        # Metrics
        self._setup_metrics()
        
        # Results storage
        self.experiment_results: List[ExperimentResult] = []
    
    def _setup_metrics(self):
        """Setup Prometheus metrics"""
        self.models_trained = Counter(
            'models_trained_total',
            'Total models trained',
            ['experiment', 'algorithm', 'framework']
        )
        
        self.training_time = Histogram(
            'model_training_seconds',
            'Time spent training models',
            ['algorithm', 'framework']
        )
        
        self.model_accuracy = Gauge(
            'model_accuracy',
            'Model accuracy score',
            ['experiment', 'model_name']
        )
    
    async def run_experiment(self, X: np.ndarray, y: np.ndarray) -> List[ExperimentResult]:
        """Run complete ML experiment"""
        
        experiment_id = self.tracker.start_experiment(self.config.experiment_name)
        self.logger.info(f"Starting experiment: {experiment_id}")
        
        # Data splitting
        X_train, X_test, y_train, y_test = self._split_data(X, y)
        
        # Train models
        results = []
        for model_config in self.config.models:
            try:
                result = await self._train_and_evaluate_model(
                    model_config, X_train, y_train, X_test, y_test, experiment_id
                )
                results.append(result)
                
            except Exception as e:
                self.logger.error(f"Failed to train model {model_config.name}: {e}")
        
        # Store results
        self.experiment_results.extend(results)
        
        # Generate experiment summary
        summary = self._generate_experiment_summary(results)
        self.logger.info(f"Experiment completed: {summary}")
        
        return results
    
    def _split_data(self, X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, ...]:
        """Split data into train/validation/test sets"""
        
        if self.config.validation_strategy == "holdout":
            # Simple train/test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=self.config.test_size, 
                random_state=self.config.random_state,
                stratify=y if len(np.unique(y)) > 1 else None
            )
            
            # Further split training data for validation if needed
            if self.config.validation_size > 0:
                X_train, X_val, y_train, y_val = train_test_split(
                    X_train, y_train, test_size=self.config.validation_size,
                    random_state=self.config.random_state,
                    stratify=y_train if len(np.unique(y_train)) > 1 else None
                )
                return X_train, X_val, X_test, y_train, y_val, y_test
            else:
                return X_train, X_test, y_train, y_test
        
        elif self.config.validation_strategy == "time_series":
            # Time series split
            split_point = int(len(X) * (1 - self.config.test_size))
            X_train, X_test = X[:split_point], X[split_point:]
            y_train, y_test = y[:split_point], y[split_point:]
            return X_train, X_test, y_train, y_test
        
        else:
            raise ValueError(f"Unknown validation strategy: {self.config.validation_strategy}")
    
    async def _train_and_evaluate_model(self, model_config: ModelConfig,
                                       X_train: np.ndarray, y_train: np.ndarray,
                                       X_test: np.ndarray, y_test: np.ndarray,
                                       experiment_id: str) -> ExperimentResult:
        """Train and evaluate a single model"""
        
        self.logger.info(f"Training model: {model_config.name}")
        
        # Hyperparameter optimization
        best_params = model_config.hyperparameters.copy()
        if model_config.optimization:
            self.logger.info("Starting hyperparameter optimization")
            
            # Split training data for optimization
            X_train_opt, X_val_opt, y_train_opt, y_val_opt = train_test_split(
                X_train, y_train, test_size=0.2, random_state=42
            )
            
            optimization_results = self.optimizer.optimize(
                model_config, X_train_opt, y_train_opt, X_val_opt, y_val_opt,
                n_trials=model_config.optimization.get('n_trials', 100)
            )
            
            best_params.update(optimization_results['best_params'])
            self.tracker.log_hyperparameter_optimization(optimization_results)
        
        # Create model with best parameters
        optimized_config = ModelConfig(
            name=model_config.name,
            type=model_config.type,
            framework=model_config.framework,
            algorithm=model_config.algorithm,
            hyperparameters=best_params
        )
        
        model = ModelFactory.create_model(optimized_config)
        
        # Train model
        start_time = time.time()
        
        if model_config.framework in [Framework.PYTORCH, Framework.TENSORFLOW]:
            # Deep learning training
            model = await self._train_deep_learning_model(
                model, X_train, y_train, model_config
            )
        else:
            # Traditional ML training
            model.fit(X_train, y_train)
        
        training_time = time.time() - start_time
        
        # Evaluate model
        evaluation_results = self.evaluator.evaluate_model(
            model, X_test, y_test, model_config.type, self.config.evaluation_metrics
        )
        
        # Cross-validation if configured
        cv_results = {}
        if model_config.cross_validation:
            cv_results = self.evaluator.cross_validate_model(
                model, X_train, y_train, model_config.type, model_config.cross_validation
            )
        
        # Feature importance
        feature_importance = self._get_feature_importance(model, model_config.framework)
        
        # Model size
        model_size = self._get_model_size(model)
        
        # Create result
        result = ExperimentResult(
            experiment_id=experiment_id,
            model_name=model_config.name,
            framework=model_config.framework.value,
            algorithm=model_config.algorithm,
            hyperparameters=best_params,
            metrics={**evaluation_results, **cv_results},
            training_time=training_time,
            prediction_time=evaluation_results.get('prediction_time', 0),
            model_size=model_size,
            feature_importance=feature_importance
        )
        
        # Log to tracking systems
        self.tracker.log_model_training(optimized_config, model, result.metrics)
        
        # Update Prometheus metrics
        self.models_trained.labels(
            experiment=self.config.experiment_name,
            algorithm=model_config.algorithm,
            framework=model_config.framework.value
        ).inc()
        
        self.training_time.labels(
            algorithm=model_config.algorithm,
            framework=model_config.framework.value
        ).observe(training_time)
        
        if 'accuracy' in result.metrics:
            self.model_accuracy.labels(
                experiment=self.config.experiment_name,
                model_name=model_config.name
            ).set(result.metrics['accuracy'])
        
        # Save model if configured
        if self.config.save_models:
            model_path = self._save_model(model, model_config, experiment_id)
            result.artifacts['model_path'] = model_path
        
        return result
    
    async def _train_deep_learning_model(self, model, X_train: np.ndarray, 
                                        y_train: np.ndarray, config: ModelConfig):
        """Train deep learning model"""
        
        if config.framework == Framework.PYTORCH:
            return await self._train_pytorch_model(model, X_train, y_train, config)
        elif config.framework == Framework.TENSORFLOW:
            return await self._train_tensorflow_model(model, X_train, y_train, config)
        else:
            raise ValueError(f"Unsupported deep learning framework: {config.framework}")
    
    async def _train_pytorch_model(self, model, X_train: np.ndarray, 
                                  y_train: np.ndarray, config: ModelConfig):
        """Train PyTorch model"""
        
        # Convert to tensors
        X_tensor = torch.FloatTensor(X_train)
        y_tensor = torch.FloatTensor(y_train)
        
        # Create data loader
        dataset = TensorDataset(X_tensor, y_tensor)
        dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
        
        # Setup training
        criterion = nn.MSELoss() if config.type == ModelType.REGRESSION else nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        
        # Training loop
        model.train()
        epochs = config.hyperparameters.get('epochs', 100)
        
        for epoch in range(epochs):
            total_loss = 0
            for batch_X, batch_y in dataloader:
                optimizer.zero_grad()
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            
            if epoch % 10 == 0:
                self.logger.info(f"Epoch {epoch}, Loss: {total_loss/len(dataloader):.4f}")
        
        return model
    
    async def _train_tensorflow_model(self, model, X_train: np.ndarray,
                                     y_train: np.ndarray, config: ModelConfig):
        """Train TensorFlow/Keras model"""
        
        # Compile model
        if config.type == ModelType.CLASSIFICATION:
            loss = 'sparse_categorical_crossentropy'
            metrics = ['accuracy']
        else:
            loss = 'mse'
            metrics = ['mae']
        
        model.compile(
            optimizer='adam',
            loss=loss,
            metrics=metrics
        )
        
        # Train model
        epochs = config.hyperparameters.get('epochs', 100)
        batch_size = config.hyperparameters.get('batch_size', 32)
        
        history = model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0
        )
        
        return model
    
    def _get_feature_importance(self, model, framework: Framework) -> Optional[Dict[str, float]]:
        """Get feature importance from model"""
        
        try:
            if framework == Framework.SKLEARN:
                if hasattr(model, 'feature_importances_'):
                    importances = model.feature_importances_
                    return {f"feature_{i}": float(imp) for i, imp in enumerate(importances)}
                elif hasattr(model, 'coef_'):
                    coefficients = model.coef_
                    if coefficients.ndim > 1:
                        coefficients = coefficients[0]  # Take first class for multi-class
                    return {f"feature_{i}": float(coef) for i, coef in enumerate(coefficients)}
            
            elif framework in [Framework.XGBOOST, Framework.LIGHTGBM, Framework.CATBOOST]:
                if hasattr(model, 'feature_importances_'):
                    importances = model.feature_importances_
                    return {f"feature_{i}": float(imp) for i, imp in enumerate(importances)}
            
        except Exception as e:
            self.logger.warning(f"Could not extract feature importance: {e}")
        
        return None
    
    def _get_model_size(self, model) -> int:
        """Get model size in bytes"""
        try:
            import sys
            return sys.getsizeof(pickle.dumps(model))
        except Exception:
            return 0
    
    def _save_model(self, model, config: ModelConfig, experiment_id: str) -> str:
        """Save trained model"""
        
        model_dir = Path("models") / experiment_id
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / f"{config.name}.pkl"
        
        try:
            if config.framework == Framework.SKLEARN:
                joblib.dump(model, model_path)
            elif config.framework == Framework.PYTORCH:
                torch.save(model.state_dict(), model_path.with_suffix('.pth'))
            elif config.framework == Framework.TENSORFLOW:
                model.save(model_path.with_suffix('.h5'))
            else:
                # Fallback to pickle
                with open(model_path, 'wb') as f:
                    pickle.dump(model, f)
            
            return str(model_path)
            
        except Exception as e:
            self.logger.error(f"Failed to save model: {e}")
            return ""
    
    def _generate_experiment_summary(self, results: List[ExperimentResult]) -> Dict[str, Any]:
        """Generate experiment summary"""
        
        if not results:
            return {"message": "No models trained successfully"}
        
        # Find best model
        best_model = max(results, key=lambda r: r.metrics.get('accuracy', r.metrics.get('r2', 0)))
        
        # Calculate averages
        avg_training_time = np.mean([r.training_time for r in results])
        avg_accuracy = np.mean([r.metrics.get('accuracy', 0) for r in results if 'accuracy' in r.metrics])
        
        summary = {
            "total_models": len(results),
            "best_model": {
                "name": best_model.model_name,
                "algorithm": best_model.algorithm,
                "framework": best_model.framework,
                "score": best_model.metrics.get('accuracy', best_model.metrics.get('r2', 0))
            },
            "average_training_time": avg_training_time,
            "average_accuracy": avg_accuracy if avg_accuracy > 0 else None,
            "frameworks_used": list(set(r.framework for r in results)),
            "algorithms_used": list(set(r.algorithm for r in results))
        }
        
        return summary
    
    def get_experiment_results(self) -> List[ExperimentResult]:
        """Get all experiment results"""
        return self.experiment_results
    
    def get_best_model(self, metric: str = 'accuracy') -> Optional[ExperimentResult]:
        """Get best model based on metric"""
        if not self.experiment_results:
            return None
        
        return max(self.experiment_results, key=lambda r: r.metrics.get(metric, 0))


# Example usage and configuration
def create_example_training_config() -> TrainingConfig:
    """Create example training configuration"""
    
    # Model configurations
    models = [
        ModelConfig(
            name="random_forest",
            type=ModelType.CLASSIFICATION,
            framework=Framework.SKLEARN,
            algorithm="random_forest_classifier",
            hyperparameters={
                "n_estimators": 100,
                "max_depth": 10,
                "random_state": 42
            },
            optimization={
                "method": "optuna",
                "n_trials": 50
            },
            cross_validation={
                "method": "stratified",
                "n_splits": 5
            }
        ),
        ModelConfig(
            name="xgboost",
            type=ModelType.CLASSIFICATION,
            framework=Framework.XGBOOST,
            algorithm="xgboost",
            hyperparameters={
                "n_estimators": 100,
                "max_depth": 6,
                "learning_rate": 0.1,
                "random_state": 42
            },
            optimization={
                "method": "optuna",
                "n_trials": 50
            }
        ),
        ModelConfig(
            name="neural_network",
            type=ModelType.CLASSIFICATION,
            framework=Framework.PYTORCH,
            algorithm="neural_network",
            hyperparameters={
                "input_size": 10,
                "hidden_sizes": [64, 32],
                "output_size": 2,
                "epochs": 100,
                "dropout": 0.2
            }
        )
    ]
    
    # Training configuration
    config = TrainingConfig(
        experiment_name="classification_experiment",
        models=models,
        data_config={
            "target_column": "target",
            "feature_columns": ["feature_1", "feature_2", "feature_3"]
        },
        evaluation_metrics=["accuracy", "precision", "recall", "f1", "roc_auc"],
        validation_strategy="holdout",
        test_size=0.2,
        validation_size=0.1,
        random_state=42,
        n_jobs=-1,
        verbose=True,
        save_models=True,
        tracking={
            "mlflow": {
                "enabled": True,
                "tracking_uri": "sqlite:///mlflow.db"
            },
            "wandb": {
                "enabled": False,
                "project": "ml-experiments"
            }
        }
    )
    
    return config


if __name__ == "__main__":
    import argparse
    from sklearn.datasets import make_classification, make_regression
    
    parser = argparse.ArgumentParser(description="Model Training System")
    parser.add_argument("--config", type=str, help="Path to training configuration file")
    parser.add_argument("--data", type=str, help="Path to training data")
    parser.add_argument("--experiment", type=str, default="test_experiment",
                       help="Experiment name")
    
    args = parser.parse_args()
    
    async def main():
        # Create example data if no data file provided
        if not args.data:
            print("Generating example classification data...")
            X, y = make_classification(
                n_samples=1000, n_features=10, n_classes=2, 
                n_informative=8, random_state=42
            )
        else:
            # Load data from file
            data = pd.read_csv(args.data)
            X = data.drop('target', axis=1).values
            y = data['target'].values
        
        # Create or load configuration
        if args.config:
            with open(args.config, 'r') as f:
                config_dict = yaml.safe_load(f)
            # Convert to TrainingConfig object (implementation needed)
            config = create_example_training_config()  # Placeholder
        else:
            config = create_example_training_config()
        
        config.experiment_name = args.experiment
        
        # Run training
        training_system = ModelTrainingSystem(config)
        results = await training_system.run_experiment(X, y)
        
        # Print results
        print(f"\nExperiment completed! Trained {len(results)} models.")
        
        best_model = training_system.get_best_model()
        if best_model:
            print(f"Best model: {best_model.model_name} ({best_model.algorithm})")
            print(f"Best score: {best_model.metrics.get('accuracy', 'N/A')}")
        
        # Save results
        results_file = f"experiment_results_{args.experiment}.json"
        with open(results_file, 'w') as f:
            json.dump([
                {
                    "model_name": r.model_name,
                    "algorithm": r.algorithm,
                    "framework": r.framework,
                    "metrics": r.metrics,
                    "training_time": r.training_time
                }
                for r in results
            ], f, indent=2)
        
        print(f"Results saved to {results_file}")
    
    asyncio.run(main())