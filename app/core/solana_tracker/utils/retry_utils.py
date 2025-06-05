from typing import TypeVar, Callable, Optional, Any
from functools import wraps
import asyncio
import logging
import time
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

T = TypeVar('T')

class RetryError(Exception):
    """Raised when all retry attempts fail."""
    pass

def retry_with_exponential_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True
):
    """
    Decorator for retrying async functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exponential_base: Base for exponential backoff calculation
        jitter: Whether to add random jitter to delays
        
    Returns:
        Callable: Decorated function
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_error = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                    
                except Exception as e:
                    last_error = e
                    
                    if attempt == max_retries:
                        logger.error(
                            f"All {max_retries} retry attempts failed for {func.__name__}"
                        )
                        raise RetryError(
                            f"Max retries exceeded: {str(last_error)}"
                        ) from last_error
                    
                    # Calculate delay
                    delay = min(
                        base_delay * (exponential_base ** attempt),
                        max_delay
                    )
                    
                    if jitter:
                        delay *= (0.5 + random.random())
                    
                    logger.warning(
                        f"Attempt {attempt + 1} failed for {func.__name__}: {str(e)}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    
                    await asyncio.sleep(delay)
            
            raise RetryError("Unexpected retry loop exit")
            
        return wrapper
    return decorator

class CircuitBreaker:
    """
    Circuit breaker pattern implementation.
    
    Prevents repeated calls to failing services by tracking failure rates
    and opening the circuit when threshold is exceeded.
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: int = 60,
        half_open_timeout: int = 30
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.half_open_timeout = half_open_timeout
        
        self.failures = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = "closed"
        
    async def call(
        self,
        func: Callable[..., Any],
        *args: Any,
        **kwargs: Any
    ) -> Any:
        """
        Call function with circuit breaker protection.
        
        Args:
            func: Function to call
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Any: Function result
            
        Raises:
            Exception: If circuit is open or function fails
        """
        await self._check_state()
        
        try:
            result = await func(*args, **kwargs)
            await self._handle_success()
            return result
            
        except Exception as e:
            await self._handle_failure()
            raise

    async def _check_state(self) -> None:
        """Check and update circuit state."""
        if self.state == "open":
            if self.last_failure_time:
                elapsed = datetime.now() - self.last_failure_time
                if elapsed.seconds >= self.reset_timeout:
                    self.state = "half-open"
                    logger.info("Circuit changed to half-open state")
                else:
                    raise RetryError("Circuit is open")
                    
    async def _handle_success(self) -> None:
        """Handle successful call."""
        if self.state == "half-open":
            self.state = "closed"
            self.failures = 0
            self.last_failure_time = None
            logger.info("Circuit closed after successful half-open call")

    async def _handle_failure(self) -> None:
        """Handle failed call."""
        self.failures += 1
        self.last_failure_time = datetime.now()
        
        if self.failures >= self.failure_threshold:
            self.state = "open"
            logger.warning(
                f"Circuit opened after {self.failures} failures"
            )

class RateLimiter:
    """
    Rate limiter implementation.
    
    Controls the rate of function calls using token bucket algorithm.
    """
    
    def __init__(
        self,
        calls: int,
        period: float,
        burst: Optional[int] = None
    ):
        self.calls = calls
        self.period = period
        self.burst = burst or calls
        
        self.tokens = self.burst
        self.last_update = time.monotonic()
        self.lock = asyncio.Lock()
        
    async def acquire(self) -> bool:
        """
        Acquire a token for making a call.
        
        Returns:
            bool: Whether token was acquired
        """
        async with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            
            # Add new tokens based on elapsed time
            new_tokens = int(elapsed * (self.calls / self.period))
            self.tokens = min(self.burst, self.tokens + new_tokens)
            self.last_update = now
            
            if self.tokens > 0:
                self.tokens -= 1
                return True
                
            return False
            
    async def __call__(
        self,
        func: Callable[..., Any],
        *args: Any,
        **kwargs: Any
    ) -> Any:
        """
        Call function with rate limiting.
        
        Args:
            func: Function to call
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Any: Function result
            
        Raises:
            RetryError: If rate limit is exceeded
        """
        if not await self.acquire():
            raise RetryError("Rate limit exceeded")
            
        return await func(*args, **kwargs)
