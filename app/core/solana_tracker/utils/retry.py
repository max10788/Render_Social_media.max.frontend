import asyncio
import functools
import logging
import time
from typing import Callable, Any, Optional

logger = logging.getLogger(__name__)

def retry_with_exponential_backoff(max_retries: int = 3, initial_delay: float = 1.0, max_delay: float = 10.0):
    """Dekorator für Wiederholungen mit exponentiellem Backoff"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            retries = 0
            delay = initial_delay
            
            while retries <= max_retries:
                try:
                    return await func(*args, **kwargs)
                except (BlockchainConnectionError, RateLimitExceededError) as e:
                    if retries < max_retries:
                        logger.warning(f"{str(e)}. Wiederhole in {delay:.2f}s (Versuch {retries+1}/{max_retries})")
                        await asyncio.sleep(delay)
                        retries += 1
                        delay = min(delay * 2, max_delay)
                    else:
                        logger.error(f"Maximale Wiederholungen erreicht. {str(e)}")
                        raise
                except Exception as e:
                    logger.error(f"Unerwarteter Fehler: {str(e)}")
                    if retries < max_retries:
                        await asyncio.sleep(delay)
                        retries += 1
                        delay = min(delay * 2, max_delay)
                    else:
                        raise
            return None
        return wrapper
    return decorator

def enhanced_retry_with_backoff(max_retries: int = 3, initial_delay: float = 1.0, max_delay: float = 30.0):
    """Erweiterte Wiederholungslogik mit spezifischerem Fehlerhandling"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            retries = 0
            delay = initial_delay
            
            while True:
                try:
                    return await func(*args, **kwargs)
                except (BlockchainConnectionError, RateLimitExceededError) as e:
                    if retries >= max_retries:
                        raise
                    logger.warning(f"{str(e)}. Wiederhole in {delay:.2f}s (Versuch {retries+1}/{max_retries})")
                    await asyncio.sleep(delay)
                    retries += 1
                    delay = min(delay * 2, max_delay)
                except Exception as e:
                    if retries >= max_retries or not isinstance(e, (ConnectionError, TimeoutError)):
                        raise
                    logger.warning(f"Netzwerkfehler: {str(e)}. Wiederhole in {delay:.2f}s")
                    await asyncio.sleep(delay)
                    retries += 1
                    delay = min(delay * 2, max_delay)
            return None
        return wrapper
    return decorator

class RetryPolicy:
    """Klasse zur Verwaltung von Wiederholungsrichtlinien"""
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
    
    def calculate_delay(self, attempt: int) -> float:
        """Berechnet die Verzögerung für einen Versuch"""
        return min(self.base_delay * (2 ** attempt), 30.0)
    
    def should_retry(self, error: Exception, attempt: int) -> bool:
        """Entscheidet, ob eine Wiederholung erfolgen soll"""
        if attempt >= self.max_retries:
            return False
            
        if isinstance(error, (BlockchainConnectionError, RateLimitExceededError)):
            return True
            
        if isinstance(error, (ConnectionError, TimeoutError)):
            return True
            
        return False
