"""
Circuit Breaker Pattern Implementation
Provides fault tolerance and prevents cascading failures
"""

import time
import threading
from typing import Any, Callable, Optional, Type, Union
from enum import Enum
from dataclasses import dataclass
import logging
import asyncio
from functools import wraps


class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, blocking requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5          # Number of failures to open circuit
    recovery_timeout: int = 60          # Seconds to wait before trying again
    success_threshold: int = 3          # Successes needed to close circuit in half-open
    timeout: float = 30.0               # Request timeout in seconds
    expected_exception: Type[Exception] = Exception


class CircuitBreakerError(Exception):
    """Circuit breaker is open"""
    pass


class CircuitBreaker:
    """
    Circuit breaker implementation for fault tolerance
    
    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Circuit is open, requests fail immediately
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    """
    
    def __init__(self, 
                 failure_threshold: int = 5,
                 recovery_timeout: int = 60,
                 success_threshold: int = 3,
                 timeout: float = 30.0,
                 expected_exception: Type[Exception] = Exception,
                 name: str = "CircuitBreaker"):
        
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.timeout = timeout
        self.expected_exception = expected_exception
        self.name = name
        
        # State management
        self._state = CircuitBreakerState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._lock = threading.RLock()
        
        # Statistics
        self._total_requests = 0
        self._total_failures = 0
        self._total_successes = 0
        self._total_timeouts = 0
        self._total_circuit_open_calls = 0
        
        self.logger = logging.getLogger(f"{__name__}.{name}")
    
    @property
    def state(self) -> str:
        """Get current circuit breaker state"""
        return self._state.value
    
    @property
    def failure_count(self) -> int:
        """Get current failure count"""
        return self._failure_count
    
    @property
    def success_count(self) -> int:
        """Get current success count (in half-open state)"""
        return self._success_count
    
    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit breaker"""
        if self._state != CircuitBreakerState.OPEN:
            return False
        
        if self._last_failure_time is None:
            return True
        
        return time.time() - self._last_failure_time >= self.recovery_timeout
    
    def _reset(self):
        """Reset circuit breaker to closed state"""
        with self._lock:
            self._state = CircuitBreakerState.CLOSED
            self._failure_count = 0
            self._success_count = 0
            self.logger.info(f"Circuit breaker {self.name} reset to CLOSED")
    
    def _trip(self):
        """Trip circuit breaker to open state"""
        with self._lock:
            self._state = CircuitBreakerState.OPEN
            self._last_failure_time = time.time()
            self.logger.warning(
                f"Circuit breaker {self.name} tripped to OPEN "
                f"(failures: {self._failure_count}/{self.failure_threshold})"
            )
    
    def _attempt_reset(self):
        """Attempt to reset circuit breaker to half-open state"""
        with self._lock:
            if self._should_attempt_reset():
                self._state = CircuitBreakerState.HALF_OPEN
                self._success_count = 0
                self.logger.info(f"Circuit breaker {self.name} attempting reset to HALF_OPEN")
    
    def record_success(self):
        """Record a successful operation"""
        with self._lock:
            self._total_requests += 1
            self._total_successes += 1
            
            if self._state == CircuitBreakerState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._reset()
            elif self._state == CircuitBreakerState.CLOSED:
                # Reset failure count on success
                self._failure_count = 0
    
    def record_failure(self, exception: Optional[Exception] = None):
        """Record a failed operation"""
        with self._lock:
            self._total_requests += 1
            self._total_failures += 1
            
            # Only count expected exceptions as failures
            if exception and not isinstance(exception, self.expected_exception):
                return
            
            if self._state == CircuitBreakerState.HALF_OPEN:
                # Go back to open state on any failure in half-open
                self._trip()
            elif self._state == CircuitBreakerState.CLOSED:
                self._failure_count += 1
                if self._failure_count >= self.failure_threshold:
                    self._trip()
    
    def record_timeout(self):
        """Record a timeout"""
        with self._lock:
            self._total_timeouts += 1
            self.record_failure()
    
    def can_execute(self) -> bool:
        """Check if request can be executed"""
        with self._lock:
            if self._state == CircuitBreakerState.CLOSED:
                return True
            elif self._state == CircuitBreakerState.OPEN:
                if self._should_attempt_reset():
                    self._attempt_reset()
                    return True
                else:
                    self._total_circuit_open_calls += 1
                    return False
            elif self._state == CircuitBreakerState.HALF_OPEN:
                return True
            
            return False
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection
        
        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
            
        Raises:
            CircuitBreakerError: If circuit is open
            Exception: Any exception from the function
        """
        if not self.can_execute():
            raise CircuitBreakerError(
                f"Circuit breaker {self.name} is OPEN. "
                f"Last failure: {self._last_failure_time}, "
                f"Recovery timeout: {self.recovery_timeout}s"
            )
        
        try:
            # Execute with timeout
            start_time = time.time()
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Check for timeout
            if execution_time > self.timeout:
                self.record_timeout()
                raise TimeoutError(f"Function execution exceeded timeout: {self.timeout}s")
            
            self.record_success()
            return result
            
        except Exception as e:
            self.record_failure(e)
            raise
    
    async def acall(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute async function with circuit breaker protection
        
        Args:
            func: Async function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
            
        Raises:
            CircuitBreakerError: If circuit is open
            Exception: Any exception from the function
        """
        if not self.can_execute():
            raise CircuitBreakerError(
                f"Circuit breaker {self.name} is OPEN. "
                f"Last failure: {self._last_failure_time}, "
                f"Recovery timeout: {self.recovery_timeout}s"
            )
        
        try:
            # Execute with timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.timeout
            )
            
            self.record_success()
            return result
            
        except asyncio.TimeoutError:
            self.record_timeout()
            raise TimeoutError(f"Async function execution exceeded timeout: {self.timeout}s")
        except Exception as e:
            self.record_failure(e)
            raise
    
    def get_stats(self) -> dict:
        """Get circuit breaker statistics"""
        with self._lock:
            return {
                "name": self.name,
                "state": self._state.value,
                "failure_count": self._failure_count,
                "success_count": self._success_count,
                "total_requests": self._total_requests,
                "total_failures": self._total_failures,
                "total_successes": self._total_successes,
                "total_timeouts": self._total_timeouts,
                "total_circuit_open_calls": self._total_circuit_open_calls,
                "failure_rate": self._total_failures / max(self._total_requests, 1),
                "success_rate": self._total_successes / max(self._total_requests, 1),
                "last_failure_time": self._last_failure_time,
                "config": {
                    "failure_threshold": self.failure_threshold,
                    "recovery_timeout": self.recovery_timeout,
                    "success_threshold": self.success_threshold,
                    "timeout": self.timeout
                }
            }
    
    def reset_stats(self):
        """Reset statistics"""
        with self._lock:
            self._total_requests = 0
            self._total_failures = 0
            self._total_successes = 0
            self._total_timeouts = 0
            self._total_circuit_open_calls = 0
    
    def force_open(self):
        """Force circuit breaker to open state"""
        with self._lock:
            self._state = CircuitBreakerState.OPEN
            self._last_failure_time = time.time()
            self.logger.warning(f"Circuit breaker {self.name} forced to OPEN")
    
    def force_close(self):
        """Force circuit breaker to closed state"""
        with self._lock:
            self._reset()
            self.logger.info(f"Circuit breaker {self.name} forced to CLOSED")
    
    def force_half_open(self):
        """Force circuit breaker to half-open state"""
        with self._lock:
            self._state = CircuitBreakerState.HALF_OPEN
            self._success_count = 0
            self.logger.info(f"Circuit breaker {self.name} forced to HALF_OPEN")


def circuit_breaker(failure_threshold: int = 5,
                   recovery_timeout: int = 60,
                   success_threshold: int = 3,
                   timeout: float = 30.0,
                   expected_exception: Type[Exception] = Exception,
                   name: Optional[str] = None):
    """
    Decorator for circuit breaker pattern
    
    Args:
        failure_threshold: Number of failures to open circuit
        recovery_timeout: Seconds to wait before trying again
        success_threshold: Successes needed to close circuit in half-open
        timeout: Request timeout in seconds
        expected_exception: Exception type that counts as failure
        name: Circuit breaker name
    """
    def decorator(func):
        cb_name = name or f"{func.__module__}.{func.__name__}"
        cb = CircuitBreaker(
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            success_threshold=success_threshold,
            timeout=timeout,
            expected_exception=expected_exception,
            name=cb_name
        )
        
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                return await cb.acall(func, *args, **kwargs)
            
            # Attach circuit breaker to wrapper
            async_wrapper.circuit_breaker = cb
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                return cb.call(func, *args, **kwargs)
            
            # Attach circuit breaker to wrapper
            sync_wrapper.circuit_breaker = cb
            return sync_wrapper
    
    return decorator


class CircuitBreakerRegistry:
    """Registry for managing multiple circuit breakers"""
    
    def __init__(self):
        self._circuit_breakers: dict[str, CircuitBreaker] = {}
        self._lock = threading.RLock()
    
    def register(self, name: str, circuit_breaker: CircuitBreaker):
        """Register a circuit breaker"""
        with self._lock:
            self._circuit_breakers[name] = circuit_breaker
    
    def get(self, name: str) -> Optional[CircuitBreaker]:
        """Get a circuit breaker by name"""
        return self._circuit_breakers.get(name)
    
    def create(self, name: str, **kwargs) -> CircuitBreaker:
        """Create and register a new circuit breaker"""
        with self._lock:
            if name in self._circuit_breakers:
                return self._circuit_breakers[name]
            
            cb = CircuitBreaker(name=name, **kwargs)
            self._circuit_breakers[name] = cb
            return cb
    
    def remove(self, name: str) -> bool:
        """Remove a circuit breaker"""
        with self._lock:
            if name in self._circuit_breakers:
                del self._circuit_breakers[name]
                return True
            return False
    
    def list_all(self) -> list[str]:
        """List all registered circuit breaker names"""
        return list(self._circuit_breakers.keys())
    
    def get_all_stats(self) -> dict:
        """Get statistics for all circuit breakers"""
        with self._lock:
            return {
                name: cb.get_stats()
                for name, cb in self._circuit_breakers.items()
            }
    
    def reset_all_stats(self):
        """Reset statistics for all circuit breakers"""
        with self._lock:
            for cb in self._circuit_breakers.values():
                cb.reset_stats()
    
    def force_open_all(self):
        """Force all circuit breakers to open state"""
        with self._lock:
            for cb in self._circuit_breakers.values():
                cb.force_open()
    
    def force_close_all(self):
        """Force all circuit breakers to closed state"""
        with self._lock:
            for cb in self._circuit_breakers.values():
                cb.force_close()


# Global registry instance
registry = CircuitBreakerRegistry()


# Example usage and testing
if __name__ == "__main__":
    import random
    import time
    
    # Example 1: Using circuit breaker directly
    print("=== Circuit Breaker Direct Usage ===")
    
    def unreliable_service():
        """Simulates an unreliable service"""
        if random.random() < 0.7:  # 70% failure rate
            raise Exception("Service unavailable")
        return "Success!"
    
    cb = CircuitBreaker(
        failure_threshold=3,
        recovery_timeout=5,
        name="test-service"
    )
    
    # Test the circuit breaker
    for i in range(20):
        try:
            result = cb.call(unreliable_service)
            print(f"Request {i+1}: {result}")
        except CircuitBreakerError as e:
            print(f"Request {i+1}: Circuit breaker open - {e}")
        except Exception as e:
            print(f"Request {i+1}: Service error - {e}")
        
        time.sleep(0.5)
        
        # Print stats every 5 requests
        if (i + 1) % 5 == 0:
            stats = cb.get_stats()
            print(f"Stats: State={stats['state']}, "
                  f"Failures={stats['failure_count']}, "
                  f"Total={stats['total_requests']}")
            print()
    
    print("\n=== Circuit Breaker Decorator Usage ===")
    
    # Example 2: Using decorator
    @circuit_breaker(failure_threshold=2, recovery_timeout=3, name="decorated-service")
    def another_unreliable_service():
        if random.random() < 0.6:  # 60% failure rate
            raise Exception("Decorated service failed")
        return "Decorated success!"
    
    for i in range(10):
        try:
            result = another_unreliable_service()
            print(f"Decorated request {i+1}: {result}")
        except CircuitBreakerError as e:
            print(f"Decorated request {i+1}: Circuit open")
        except Exception as e:
            print(f"Decorated request {i+1}: Service error")
        
        time.sleep(0.3)
    
    # Print final stats
    print("\n=== Final Statistics ===")
    stats = cb.get_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    # Test async version
    print("\n=== Async Circuit Breaker ===")
    
    async def async_unreliable_service():
        await asyncio.sleep(0.1)  # Simulate async work
        if random.random() < 0.5:
            raise Exception("Async service failed")
        return "Async success!"
    
    async def test_async():
        async_cb = CircuitBreaker(
            failure_threshold=2,
            recovery_timeout=2,
            name="async-service"
        )
        
        for i in range(8):
            try:
                result = await async_cb.acall(async_unreliable_service)
                print(f"Async request {i+1}: {result}")
            except CircuitBreakerError:
                print(f"Async request {i+1}: Circuit open")
            except Exception as e:
                print(f"Async request {i+1}: Service error - {e}")
            
            await asyncio.sleep(0.5)
    
    # Run async test
    asyncio.run(test_async())