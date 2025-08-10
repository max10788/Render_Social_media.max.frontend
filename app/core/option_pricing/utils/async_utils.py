import asyncio
import aiohttp
import time
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import logging

logger = logging.getLogger(__name__)

async def gather_with_concurrency(n: int, *tasks) -> List[Any]:
    """
    Run tasks with a maximum concurrency of n.
    
    Args:
        n: Maximum number of concurrent tasks
        *tasks: Tasks to run
        
    Returns:
        List of results in the same order as tasks
    """
    semaphore = asyncio.Semaphore(n)
    
    async def run_task(task):
        async with semaphore:
            return await task
    
    return await asyncio.gather(*[run_task(task) for task in tasks])

async def fetch_url(session: aiohttp.ClientSession, url: str, method: str = "GET", 
                  headers: Dict[str, str] = None, params: Dict[str, str] = None,
                  data: Dict[str, str] = None, timeout: int = 30) -> Tuple[int, Dict[str, str], str]:
    """
    Fetch a URL with aiohttp.
    
    Args:
        session: aiohttp ClientSession
        url: URL to fetch
        method: HTTP method
        headers: HTTP headers
        params: URL parameters
        data: Request body data
        timeout: Timeout in seconds
        
    Returns:
        Tuple of (status_code, headers, response_text)
    """
    try:
        async with session.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            json=data,
            timeout=aiohttp.ClientTimeout(total=timeout)
        ) as response:
            status = response.status
            headers = dict(response.headers)
            response_text = await response.text()
            return status, headers, response_text
    except asyncio.TimeoutError:
        logger.error(f"Timeout fetching {url}")
        return 408, {}, ""
    except Exception as e:
        logger.error(f"Error fetching {url}: {str(e)}")
        return 500, {}, str(e)

async def fetch_multiple_urls(urls: List[str], max_concurrency: int = 10, 
                             headers: Dict[str, str] = None) -> List[Tuple[int, Dict[str, str], str]]:
    """
    Fetch multiple URLs concurrently.
    
    Args:
        urls: List of URLs to fetch
        max_concurrency: Maximum number of concurrent requests
        headers: HTTP headers
        
    Returns:
        List of (status_code, headers, response_text) tuples
    """
    connector = aiohttp.TCPConnector(limit=max_concurrency)
    
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_url(session, url, headers=headers) for url in urls]
        return await gather_with_concurrency(max_concurrency, *tasks)

def async_timer(func: Callable) -> Callable:
    """
    Decorator to measure execution time of async functions.
    
    Args:
        func: Async function to time
        
    Returns:
        Wrapped function
    """
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        logger.info(f"{func.__name__} executed in {end_time - start_time:.2f} seconds")
        return result
    return wrapper

def retry_async(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0,
               exceptions: Tuple[Exception] = (Exception,)):
    """
    Decorator to retry async functions on failure.
    
    Args:
        max_attempts: Maximum number of attempts
        delay: Initial delay between retries in seconds
        backoff: Backoff factor for delay
        exceptions: Tuple of exceptions to retry on
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            attempt = 0
            current_delay = delay
            
            while attempt < max_attempts:
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    attempt += 1
                    if attempt >= max_attempts:
                        logger.error(f"{func.__name__} failed after {max_attempts} attempts: {str(e)}")
                        raise
                    
                    logger.warning(f"{func.__name__} failed (attempt {attempt}/{max_attempts}): {str(e)}")
                    logger.info(f"Retrying in {current_delay} seconds...")
                    
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        
        return wrapper
    return decorator
