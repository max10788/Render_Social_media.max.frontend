from typing import TypeVar, Callable, Optional, Any
from functools import wraps
import asyncio
import logging
import time
from datetime import datetime, timedelta
import random
import math

logger = logging.getLogger(__name__)

T = TypeVar('T')

class EnhancedRetryError(Exception):
    """Enhanced retry error with detailed failure information."""
    def __init__(self, message: str, attempts: int, total_delay: float):
        self.attempts = attempts
        self.total_delay = total_delay
        super().__init__(f"{message} (attempts={attempts}, total_delay={total_delay:.2f}s)")

def enhanced_retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retry_on: tuple = (Exception,),
    skip_on: tuple = ()
):
    """
    Enhanced decorator for retrying async functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exponential_base: Base for exponential backoff calculation
        jitter: Whether to add random jitter to delays
        retry_on: Tuple of exceptions to retry on
        skip_on: Tuple of exceptions to not retry on
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_error = None
            attempt = 0
            total_delay = 0.0
            
            while attempt <= max_retries:
                try:
                    return await func(*args, **kwargs)
                    
                except skip_on as e:
                    logger.warning(f"Skipping retry for expected error: {e}")
                    raise
                    
                except retry_on as e:
                    last_error = e
                    attempt += 1
                    
                    if attempt > max_retries:
                        logger.error(
                            f"All {max_retries} retry attempts failed for {func.__name__}"
                        )
                        raise EnhancedRetryError(
                            f"Max retries exceeded: {str(last_error)}",
                            attempt,
                            total_delay
                        ) from last_error
                    
                    # Calculate delay with optional jitter
                    delay = min(
                        base_delay * (exponential_base ** (attempt - 1)),
                        max_delay
                    )
                    
                    if jitter:
                        # Add random jitter between -25% and +25%
                        jitter_multiplier = 1 + random.uniform(-0.25, 0.25)
                        delay *= jitter_multiplier
                    
                    total_delay += delay
                    
                    logger.warning(
                        f"Attempt {attempt}/{max_retries} failed for {func.__name__}: "
                        f"{str(e)}. Retrying in {delay:.2f}s..."
                    )
                    
                    await asyncio.sleep(delay)
            
            raise EnhancedRetryError(
                "Unexpected retry loop exit",
                attempt,
                total_delay
            )
            
        return wrapper
    return decorator

class RateLimitBackoff:
    """Rate limit backoff handler with token bucket algorithm."""
    
    def __init__(
        self,
        rate: float,
        capacity: int,
        window: float = 1.0
    ):
        self.rate = rate
        self.capacity = capacity
        self.window = window
        self.tokens = capacity
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> bool:
        """
        Attempt to acquire a rate limit token.
        
        Returns:
            bool: Whether token was acquired
        """
        async with self._lock:
            now = time.monotonic()
            time_passed = now - self.last_update
            self.tokens = min(
                self.capacity,
                self.tokens + time_passed * self.rate
            )
            self.last_update = now
            
            if self.tokens >= 1:
                self.tokens -= 1
                return True
                
            return False

    async def wait(self) -> None:
        """Wait until a token becomes available."""
        while not await self.acquire():
            await asyncio.sleep(self.window / self.rate)
