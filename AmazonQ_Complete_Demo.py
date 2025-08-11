"""
Amazon Q Developer Complete Demo & Optimization Guide
====================================================

This comprehensive demo showcases how to optimize Amazon Q suggestions
and AI completions for maximum productivity and accuracy.

Features:
- Advanced type hints and dataclasses for better AI understanding
- Comprehensive docstrings that trigger Amazon Q suggestions
- Complex data structures and algorithms
- AWS SDK patterns and best practices
- Error handling and logging patterns
- Database operations and API integrations
- Testing patterns and mock data
- Performance optimization techniques
"""

import asyncio
import logging
import json
import sqlite3
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union, Any, Callable, Protocol
from datetime import datetime, timedelta
from pathlib import Path
from abc import ABC, abstractmethod
import uuid
import hashlib
import re

# Constants for configuration
DEFAULT_DB_NAME = "amazon_q_demo.db"
DEFAULT_LOG_FILE = "amazon_q_demo.log"
DEFAULT_CACHE_TTL = 300

# Configure logging for better Amazon Q context
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(DEFAULT_LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Advanced dataclass definitions for Amazon Q to understand data structures
@dataclass
class User:
    """
    Comprehensive user model with all essential fields.
    Amazon Q will suggest methods and properties based on this structure.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    username: str = ""
    email: str = ""
    first_name: str = ""
    last_name: str = ""
    age: Optional[int] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    preferences: Dict[str, Any] = field(default_factory=dict)
    roles: List[str] = field(default_factory=list)

    def __post_init__(self):
        """Initialize user after creation."""
        if not self.email and self.username:
            self.email = f"{self.username}@example.com"

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return "admin" in self.roles

    def update_last_login(self) -> None:
        """Update user's last login timestamp."""
        self.updated_at = datetime.now()
        logger.info(f"Updated last login for user: {self.username}")

@dataclass
class APIResponse:
    """
    Standard API response structure for consistent data handling.
    Amazon Q will suggest appropriate status codes and error handling.
    """
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: int = 200
    timestamp: datetime = field(default_factory=datetime.now)
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))

@dataclass
class DatabaseConfig:
    """Database configuration with connection pooling settings."""
    host: str = "localhost"
    port: int = 5432
    database: str = "amazon_q_demo"
    username: str = "admin"
    password: str = ""
    max_connections: int = 20
    connection_timeout: int = 30

# Protocol definitions for better type checking and Amazon Q suggestions
class DatabaseProtocol(Protocol):
    """Protocol defining database operations interface."""

    def connect(self) -> bool:
        """Establish database connection."""
        ...

    def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict]:
        """Execute SQL query and return results."""
        ...

    def close(self) -> None:
        """Close database connection."""
        ...

class UserRepositoryProtocol(Protocol):
    """Protocol for user data access operations."""

    def create_user(self, user: User) -> User:
        """Create new user in database."""
        ...

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Retrieve user by ID."""
        ...

    def update_user(self, user: User) -> User:
        """Update existing user."""
        ...

    def delete_user(self, user_id: str) -> bool:
        """Delete user from database."""
        ...

# Abstract base classes for service layer patterns
class BaseService(ABC):
    """
    Abstract base service class with common functionality.
    Amazon Q will suggest standard service patterns.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def initialize(self) -> bool:
        """Initialize service resources."""
        pass

    @abstractmethod
    def cleanup(self) -> None:
        """Cleanup service resources."""
        pass

    def validate_input(self, data: Dict[str, Any], required_fields: List[str]) -> List[str]:
        """
        Validate input data against required fields.
        Returns list of missing fields.
        """
        missing_fields = []
        for field in required_fields:
            if field not in data or data[field] is None:
                missing_fields.append(field)
        return missing_fields

# Concrete implementations
class SQLiteDatabase:
    """
    SQLite database implementation with connection management.
    Amazon Q will suggest database patterns and best practices.
    """

    def __init__(self, db_path: str = DEFAULT_DB_NAME):
        self.db_path = db_path
        self.connection: Optional[sqlite3.Connection] = None
        self.logger = logging.getLogger(__name__)

    def connect(self) -> bool:
        """
        Establish database connection with error handling.
        Amazon Q should suggest connection patterns.
        """
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row  # Enable dict-like access
            self.logger.info(f"Connected to database: {self.db_path}")
            return True
        except sqlite3.Error as e:
            self.logger.error(f"Database connection failed: {e}")
            return False

    def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict]:
        """
        Execute SQL query with parameter binding and error handling.
        Amazon Q should suggest SQL patterns and security practices.
        """
        if not self.connection:
            raise RuntimeError("Database not connected")

        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            if query.strip().lower().startswith('select'):
                results = [dict(row) for row in cursor.fetchall()]
                return results
            else:
                self.connection.commit()
                return [{"rows_affected": cursor.rowcount}]

        except sqlite3.Error as e:
            self.logger.error(f"Query execution failed: {e}")
            self.connection.rollback()
            raise

    def close(self) -> None:
        """Close database connection safely."""
        if self.connection:
            self.connection.close()
            self.connection = None
            self.logger.info("Database connection closed")

class UserService(BaseService):
    """
    User management service with CRUD operations.
    Amazon Q will suggest service layer patterns and validation.
    """

    def __init__(self, config: Dict[str, Any], db: DatabaseProtocol):
        super().__init__(config)
        self.db = db
        self.cache: Dict[str, User] = {}

    def initialize(self) -> bool:
        """
        Initialize user service and create database tables.
        Amazon Q should suggest initialization patterns.
        """
        try:
            self.db.connect()
            self._create_tables()
            self.logger.info("User service initialized successfully")
            return True
        except Exception as e:
            self.logger.error(f"User service initialization failed: {e}")
            return False

    def _create_tables(self) -> None:
        """Create user table if it doesn't exist."""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT,
            last_name TEXT,
            age INTEGER,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            preferences TEXT,
            roles TEXT
        )
        """
        self.db.execute_query(create_table_sql)

    def create_user(self, user_data: Dict[str, Any]) -> APIResponse:
        """
        Create new user with validation and error handling.
        Amazon Q should suggest validation patterns and error responses.
        """
        required_fields = ["username", "email"]
        missing_fields = self.validate_input(user_data, required_fields)

        if missing_fields:
            return APIResponse(
                success=False,
                error=f"Missing required fields: {', '.join(missing_fields)}",
                status_code=400
            )

        try:
            # Validate email format
            if not self._is_valid_email(user_data["email"]):
                return APIResponse(
                    success=False,
                    error="Invalid email format",
                    status_code=400
                )

            user = User(
                username=user_data["username"],
                email=user_data["email"],
                first_name=user_data.get("first_name", ""),
                last_name=user_data.get("last_name", ""),
                age=user_data.get("age"),
                preferences=user_data.get("preferences", {}),
                roles=user_data.get("roles", ["user"])
            )

            # Insert into database
            insert_sql = """
            INSERT INTO users (id, username, email, first_name, last_name, age,
                             is_active, created_at, updated_at, preferences, roles)
            VALUES (:id, :username, :email, :first_name, :last_name, :age,
                    :is_active, :created_at, :updated_at, :preferences, :roles)
            """

            params = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "age": user.age,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
                "preferences": json.dumps(user.preferences),
                "roles": json.dumps(user.roles)
            }

            self.db.execute_query(insert_sql, params)

            # Cache the user
            self.cache[user.id] = user

            self.logger.info(f"User created successfully: {user.username}")

            return APIResponse(
                success=True,
                data={"user_id": user.id, "username": user.username},
                status_code=201
            )

        except Exception as e:
            self.logger.error(f"User creation failed: {e}")
            return APIResponse(
                success=False,
                error="User creation failed",
                status_code=500
            )

    def get_user_by_id(self, user_id: str) -> APIResponse:
        """
        Retrieve user by ID with caching.
        Amazon Q should suggest caching patterns and optimizations.
        """
        # Check cache first
        if user_id in self.cache:
            user = self.cache[user_id]
            return APIResponse(
                success=True,
                data=self._user_to_dict(user)
            )

        try:
            query = "SELECT * FROM users WHERE id = :id"
            results = self.db.execute_query(query, {"id": user_id})

            if not results:
                return APIResponse(
                    success=False,
                    error="User not found",
                    status_code=404
                )

            user_data = results[0]
            user = self._dict_to_user(user_data)

            # Cache the user
            self.cache[user_id] = user

            return APIResponse(
                success=True,
                data=self._user_to_dict(user)
            )

        except Exception as e:
            self.logger.error(f"Failed to retrieve user {user_id}: {e}")
            return APIResponse(
                success=False,
                error="Failed to retrieve user",
                status_code=500
            )

    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> APIResponse:
        """
        Update user with validation and optimistic locking.
        Amazon Q should suggest update patterns and conflict resolution.
        """
        try:
            # First, get the current user
            current_user_response = self.get_user_by_id(user_id)
            if not current_user_response.success:
                return current_user_response

            # Validate email if provided
            if "email" in update_data and not self._is_valid_email(update_data["email"]):
                return APIResponse(
                    success=False,
                    error="Invalid email format",
                    status_code=400
                )

            # Build update query dynamically
            update_fields = []
            params = {"id": user_id, "updated_at": datetime.now().isoformat()}

            for field, value in update_data.items():
                if field in ["username", "email", "first_name", "last_name", "age", "is_active"]:
                    update_fields.append(f"{field} = :{field}")
                    params[field] = value
                elif field == "preferences":
                    update_fields.append("preferences = :preferences")
                    params["preferences"] = json.dumps(value)
                elif field == "roles":
                    update_fields.append("roles = :roles")
                    params["roles"] = json.dumps(value)

            if not update_fields:
                return APIResponse(
                    success=False,
                    error="No valid fields to update",
                    status_code=400
                )

            update_fields.append("updated_at = :updated_at")

            update_sql = f"""
            UPDATE users
            SET {', '.join(update_fields)}
            WHERE id = :id
            """

            self.db.execute_query(update_sql, params)

            # Remove from cache to force refresh
            if user_id in self.cache:
                del self.cache[user_id]

            self.logger.info(f"User updated successfully: {user_id}")

            return APIResponse(
                success=True,
                data={"message": "User updated successfully"}
            )

        except Exception as e:
            self.logger.error(f"User update failed: {e}")
            return APIResponse(
                success=False,
                error="User update failed",
                status_code=500
            )

    def delete_user(self, user_id: str) -> APIResponse:
        """
        Soft delete user (mark as inactive).
        Amazon Q should suggest deletion patterns and data retention.
        """
        try:
            # Soft delete by setting is_active to False
            update_sql = """
            UPDATE users
            SET is_active = 0, updated_at = :updated_at
            WHERE id = :id
            """

            params = {
                "id": user_id,
                "updated_at": datetime.now().isoformat()
            }

            result = self.db.execute_query(update_sql, params)

            if result[0]["rows_affected"] == 0:
                return APIResponse(
                    success=False,
                    error="User not found",
                    status_code=404
                )

            # Remove from cache
            if user_id in self.cache:
                del self.cache[user_id]

            self.logger.info(f"User deleted successfully: {user_id}")

            return APIResponse(
                success=True,
                data={"message": "User deleted successfully"}
            )

        except Exception as e:
            self.logger.error(f"User deletion failed: {e}")
            return APIResponse(
                success=False,
                error="User deletion failed",
                status_code=500
            )

    def list_users(self, limit: int = 50, offset: int = 0, active_only: bool = True) -> APIResponse:
        """
        List users with pagination and filtering.
        Amazon Q should suggest pagination patterns and performance optimizations.
        """
        try:
            where_clause = "WHERE is_active = 1" if active_only else ""
            query = f"""
            SELECT * FROM users
            {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """

            params = {"limit": limit, "offset": offset}
            results = self.db.execute_query(query, params)

            users = [self._dict_to_user(user_data) for user_data in results]
            user_dicts = [self._user_to_dict(user) for user in users]

            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM users {where_clause}"
            count_result = self.db.execute_query(count_query)
            total = count_result[0]["total"]

            return APIResponse(
                success=True,
                data={
                    "users": user_dicts,
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                    "has_more": (offset + limit) < total
                }
            )

        except Exception as e:
            self.logger.error(f"Failed to list users: {e}")
            return APIResponse(
                success=False,
                error="Failed to list users",
                status_code=500
            )

    def search_users(self, query: str, limit: int = 20) -> APIResponse:
        """
        Search users by username, email, or name.
        Amazon Q should suggest search patterns and indexing strategies.
        """
        try:
            search_sql = """
            SELECT * FROM users
            WHERE is_active = 1 AND (
                username LIKE :query OR
                email LIKE :query OR
                first_name LIKE :query OR
                last_name LIKE :query
            )
            ORDER BY username ASC
            LIMIT :limit
            """

            search_pattern = f"%{query}%"
            params = {"query": search_pattern, "limit": limit}

            results = self.db.execute_query(search_sql, params)
            users = [self._dict_to_user(user_data) for user_data in results]
            user_dicts = [self._user_to_dict(user) for user in users]

            return APIResponse(
                success=True,
                data={
                    "users": user_dicts,
                    "query": query,
                    "count": len(user_dicts)
                }
            )

        except Exception as e:
            self.logger.error(f"User search failed: {e}")
            return APIResponse(
                success=False,
                error="User search failed",
                status_code=500
            )

    def cleanup(self) -> None:
        """Cleanup service resources."""
        self.cache.clear()
        self.db.close()
        self.logger.info("User service cleanup completed")

    def _is_valid_email(self, email: str) -> bool:
        """
        Validate email format using regex.
        Amazon Q should suggest validation patterns.
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    def _user_to_dict(self, user: User) -> Dict[str, Any]:
        """Convert User object to dictionary for API response."""
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.full_name,
            "age": user.age,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
            "preferences": user.preferences,
            "roles": user.roles
        }

    def _dict_to_user(self, data: Dict[str, Any]) -> User:
        """Convert dictionary to User object."""
        return User(
            id=data["id"],
            username=data["username"],
            email=data["email"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            age=data.get("age"),
            is_active=bool(data.get("is_active", True)),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            preferences=json.loads(data.get("preferences", "{}")),
            roles=json.loads(data.get("roles", '["user"]'))
        )

# Async patterns for Amazon Q to suggest
class AsyncUserService:
    """
    Asynchronous user service for high-performance applications.
    Amazon Q should suggest async patterns and concurrency best practices.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.semaphore = asyncio.Semaphore(10)  # Limit concurrent operations

    async def batch_create_users(self, users_data: List[Dict[str, Any]]) -> List[APIResponse]:
        """
        Create multiple users concurrently with rate limiting.
        Amazon Q should suggest batch processing patterns.
        """
        async def create_single_user(user_data: Dict[str, Any]) -> APIResponse:
            async with self.semaphore:
                # Simulate async database operation
                await asyncio.sleep(0.1)

                # Validate and create user (simplified for demo)
                required_fields = ["username", "email"]
                missing_fields = []
                for field in required_fields:
                    if field not in user_data or not user_data[field]:
                        missing_fields.append(field)

                if missing_fields:
                    return APIResponse(
                        success=False,
                        error=f"Missing fields: {', '.join(missing_fields)}",
                        status_code=400
                    )

                user_id = str(uuid.uuid4())
                return APIResponse(
                    success=True,
                    data={"user_id": user_id, "username": user_data["username"]},
                    status_code=201
                )

        # Process all users concurrently
        tasks = [create_single_user(user_data) for user_data in users_data]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        responses = []
        for result in results:
            if isinstance(result, Exception):
                responses.append(APIResponse(
                    success=False,
                    error=f"Unexpected error: {str(result)}",
                    status_code=500
                ))
            else:
                responses.append(result)

        return responses

# Testing patterns and fixtures for Amazon Q
class UserServiceTest:
    """
    Test class with comprehensive test patterns.
    Amazon Q should suggest testing patterns and assertions.
    """

    def __init__(self):
        self.db = SQLiteDatabase(":memory:")  # In-memory database for testing
        self.user_service = UserService({}, self.db)

    def setup(self) -> None:
        """Setup test environment."""
        self.user_service.initialize()

    def teardown(self) -> None:
        """Cleanup test environment."""
        self.user_service.cleanup()

    def test_create_user_success(self) -> bool:
        """
        Test successful user creation.
        Amazon Q should suggest test patterns and assertions.
        """
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "age": 25
        }

        response = self.user_service.create_user(user_data)

        assert response.success is True
        assert response.status_code == 201
        assert "user_id" in response.data
        assert response.data["username"] == "testuser"

        print("✓ test_create_user_success passed")
        return True

    def test_create_user_missing_fields(self) -> bool:
        """Test user creation with missing required fields."""
        user_data = {"username": "testuser"}  # Missing email

        response = self.user_service.create_user(user_data)

        assert response.success is False
        assert response.status_code == 400
        assert "email" in response.error

        print("✓ test_create_user_missing_fields passed")
        return True

    def test_get_user_not_found(self) -> bool:
        """Test retrieving non-existent user."""
        response = self.user_service.get_user_by_id("nonexistent-id")

        assert response.success is False
        assert response.status_code == 404
        assert "not found" in response.error.lower()

        print("✓ test_get_user_not_found passed")
        return True

    def run_all_tests(self) -> bool:
        """
        Run all test methods.
        Amazon Q should suggest test runner patterns.
        """
        self.setup()

        try:
            test_methods = [
                self.test_create_user_success,
                self.test_create_user_missing_fields,
                self.test_get_user_not_found
            ]

            passed = 0
            total = len(test_methods)

            for test_method in test_methods:
                try:
                    if test_method():
                        passed += 1
                except Exception as e:
                    print(f"✗ {test_method.__name__} failed: {e}")

            success_rate = (passed / total) * 100
            print(f"\nTest Results: {passed}/{total} passed ({success_rate:.1f}%)")

            return passed == total

        finally:
            self.teardown()

# Performance optimization patterns
class PerformanceOptimizer:
    """
    Performance optimization utilities and patterns.
    Amazon Q should suggest optimization techniques and profiling.
    """

    @staticmethod
    def time_function(func: Callable) -> Callable:
        """
        Decorator to measure function execution time.
        Amazon Q should suggest profiling patterns.
        """
        def wrapper(*args, **kwargs):
            start_time = datetime.now()
            result = func(*args, **kwargs)
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()

            logger.info(f"{func.__name__} executed in {execution_time:.4f} seconds")
            return result

        return wrapper

    @staticmethod
    def cache_result(ttl_seconds: int = 300):
        """
        Decorator to cache function results with TTL.
        Amazon Q should suggest caching patterns and strategies.
        """
        cache = {}

        def decorator(func: Callable) -> Callable:
            def wrapper(*args, **kwargs):
                # Create cache key from function arguments
                cache_key = hashlib.md5(
                    f"{func.__name__}:{str(args)}:{str(kwargs)}".encode()
                ).hexdigest()

                # Check if result is cached and not expired
                if cache_key in cache:
                    cached_result, timestamp = cache[cache_key]
                    if (datetime.now() - timestamp).total_seconds() < ttl_seconds:
                        logger.debug(f"Cache hit for {func.__name__}")
                        return cached_result

                # Execute function and cache result
                result = func(*args, **kwargs)
                cache[cache_key] = (result, datetime.now())
                logger.debug(f"Cache miss for {func.__name__}, result cached")

                return result

            return wrapper
        return decorator

# Main demo application
class AmazonQDemoApp:
    """
    Main application demonstrating Amazon Q optimization patterns.
    Amazon Q should suggest application architecture and initialization patterns.
    """

    def __init__(self):
        self.config = self._load_config()
        self.db = SQLiteDatabase(DEFAULT_DB_NAME)
        self.user_service = UserService(self.config, self.db)
        self.logger = logging.getLogger(__name__)

    def _load_config(self) -> Dict[str, Any]:
        """
        Load application configuration.
        Amazon Q should suggest configuration patterns and environment variables.
        """
        config = {
            "database": {
                "path": DEFAULT_DB_NAME,
                "timeout": 30
            },
            "api": {
                "rate_limit": 100,
                "timeout": 30
            },            "logging": {
                "level": "INFO",
                "file": DEFAULT_LOG_FILE
            },
            "cache": {
                "ttl": 300,
                "max_size": 1000
            }
        }

        # Override with environment variables if available
        import os
        if os.getenv("DB_PATH"):
            config["database"]["path"] = os.getenv("DB_PATH")

        return config

    def initialize(self) -> bool:
        """
        Initialize application components.
        Amazon Q should suggest initialization patterns and error handling.
        """
        try:
            self.logger.info("Initializing Amazon Q Demo Application")

            # Initialize database and services
            if not self.user_service.initialize():
                raise RuntimeError("Failed to initialize user service")

            # Create sample data
            self._create_sample_data()

            self.logger.info("Application initialized successfully")
            return True

        except Exception as e:
            self.logger.error(f"Application initialization failed: {e}")
            return False

    def _create_sample_data(self) -> None:
        """
        Create sample users for demonstration.
        Amazon Q should suggest data seeding patterns.
        """
        sample_users = [
            {
                "username": "alice",
                "email": "alice@example.com",
                "first_name": "Alice",
                "last_name": "Johnson",
                "age": 28,
                "roles": ["user", "admin"]
            },
            {
                "username": "bob",
                "email": "bob@example.com",
                "first_name": "Bob",
                "last_name": "Smith",
                "age": 35,
                "preferences": {"theme": "dark", "notifications": True}
            },
            {
                "username": "charlie",
                "email": "charlie@example.com",
                "first_name": "Charlie",
                "last_name": "Brown",
                "age": 22,
                "roles": ["user", "moderator"]
            }
        ]

        for user_data in sample_users:
            response = self.user_service.create_user(user_data)
            if response.success:
                self.logger.info(f"Created sample user: {user_data['username']}")
            else:
                self.logger.warning(f"Failed to create sample user {user_data['username']}: {response.error}")

    @PerformanceOptimizer.time_function
    def run_demo(self) -> None:
        """
        Run comprehensive demo showing all features.
        Amazon Q should suggest demo patterns and user interaction flows.
        """
        print("\n🚀 Amazon Q Developer Demo & Optimization Guide")
        print("=" * 60)

        # Demo 1: User Management
        print("\n📊 Demo 1: User Management Operations")
        print("-" * 40)

        # List all users
        response = self.user_service.list_users()
        if response.success:
            users = response.data["users"]
            print(f"Found {len(users)} users:")
            for user in users[:3]:  # Show first 3 users
                print(f"  • {user['full_name']} ({user['username']}) - {user['email']}")

        # Search users
        search_response = self.user_service.search_users("alice")
        if search_response.success:
            found_users = search_response.data["users"]
            print(f"\nSearch for 'alice' found {len(found_users)} users")

        # Demo 2: User Creation and Updates
        print("\n👤 Demo 2: User Creation and Updates")
        print("-" * 40)

        new_user_data = {
            "username": "demo_user",
            "email": "demo@example.com",
            "first_name": "Demo",
            "last_name": "User",
            "age": 30,
            "preferences": {"language": "en", "timezone": "UTC"}
        }

        create_response = self.user_service.create_user(new_user_data)
        if create_response.success:
            user_id = create_response.data["user_id"]
            print(f"✓ Created new user: {user_id}")

            # Update the user
            update_data = {"age": 31, "preferences": {"language": "es", "timezone": "PST"}}
            update_response = self.user_service.update_user(user_id, update_data)
            if update_response.success:
                print("✓ Updated user successfully")

            # Get updated user
            get_response = self.user_service.get_user_by_id(user_id)
            if get_response.success:
                updated_user = get_response.data
                print(f"✓ Retrieved updated user: age={updated_user['age']}")

        # Demo 3: Error Handling
        print("\n⚠️  Demo 3: Error Handling Patterns")
        print("-" * 40)

        # Try to create user with invalid email
        invalid_user = {"username": "invalid", "email": "not-an-email"}
        error_response = self.user_service.create_user(invalid_user)
        print(f"✓ Handled invalid email: {error_response.error}")

        # Try to get non-existent user
        not_found_response = self.user_service.get_user_by_id("non-existent-id")
        print(f"✓ Handled not found: {not_found_response.error}")

        # Demo 4: Performance Testing
        print("\n⚡ Demo 4: Performance Testing")
        print("-" * 40)

        # Measure list performance
        start_time = datetime.now()
        large_list_response = self.user_service.list_users(limit=100)
        end_time = datetime.now()

        if large_list_response.success:
            execution_time = (end_time - start_time).total_seconds()
            print(f"✓ Listed {large_list_response.data['total']} users in {execution_time:.4f}s")

        print("\n🎉 Demo completed successfully!")
        print("Amazon Q should now provide optimal suggestions for:")
        print("  • Database operations and SQL patterns")
        print("  • Error handling and validation")
        print("  • Async/await patterns and concurrency")
        print("  • Type hints and data structures")
        print("  • Testing patterns and assertions")
        print("  • Performance optimization")
        print("  • API design and REST patterns")
        print("  • Configuration management")
        print("  • Logging and monitoring")

    def run_tests(self) -> bool:
        """
        Run all tests to validate functionality.
        Amazon Q should suggest testing integration patterns.
        """
        print("\n🧪 Running Tests")
        print("=" * 30)

        test_suite = UserServiceTest()
        return test_suite.run_all_tests()

    def cleanup(self) -> None:
        """Cleanup application resources."""
        self.user_service.cleanup()
        self.logger.info("Application cleanup completed")

# Async demo for concurrent operations
async def async_demo():
    """
    Demonstrate asynchronous patterns for Amazon Q.
    Amazon Q should suggest async/await patterns and error handling.
    """
    print("\n🔄 Async Operations Demo")
    print("-" * 30)

    async_service = AsyncUserService({})

    # Prepare batch user data
    batch_users = [
        {"username": f"async_user_{i}", "email": f"async{i}@example.com"}
        for i in range(5)
    ]

    start_time = datetime.now()
    responses = await async_service.batch_create_users(batch_users)
    end_time = datetime.now()

    successful_creations = sum(1 for r in responses if r.success)
    execution_time = (end_time - start_time).total_seconds()

    print(f"✓ Created {successful_creations}/{len(batch_users)} users concurrently")
    print(f"✓ Execution time: {execution_time:.4f} seconds")

    return responses

# Entry point with comprehensive error handling
def main():
    """
    Main entry point with comprehensive error handling and logging.
    Amazon Q should suggest main function patterns and exception handling.
    """
    try:
        # Initialize application
        app = AmazonQDemoApp()

        if not app.initialize():
            print("❌ Failed to initialize application")
            return 1

        # Run comprehensive demo
        app.run_demo()

        # Run tests
        tests_passed = app.run_tests()
        if not tests_passed:
            print("❌ Some tests failed")

        # Run async demo
        try:
            asyncio.run(async_demo())
        except Exception as e:
            logger.error(f"Async demo failed: {e}")

        # Cleanup
        app.cleanup()

        print("\n✅ Amazon Q Demo completed successfully!")
        print("Your development environment is now optimized for AI suggestions.")

        return 0

    except KeyboardInterrupt:
        print("\n⚠️  Demo interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
