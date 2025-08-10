import time
import json
import hashlib
import pickle
from typing import Any, Dict, Optional, Union
from datetime import datetime, timedelta
import redis
import os
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    """
    Manages caching for frequently requested data.
    Supports both in-memory and Redis-based caching.
    """
    
    def __init__(self, 
                 cache_type: str = "memory",
                 redis_host: str = None,
                 redis_port: int = 6379,
                 redis_password: str = None,
                 redis_db: int = 0,
                 default_ttl: int = 3600):
        """
        Initialize the cache manager.
        
        Args:
            cache_type: Type of cache ('memory' or 'redis')
            redis_host: Redis server host
            redis_port: Redis server port
            redis_password: Redis password
            redis_db: Redis database number
            default_ttl: Default time-to-live in seconds
        """
        self.cache_type = cache_type
        self.default_ttl = default_ttl
        
        if cache_type == "memory":
            self._memory_cache: Dict[str, Dict[str, Any]] = {}
        elif cache_type == "redis":
            try:
                self._redis_client = redis.StrictRedis(
                    host=redis_host or os.getenv("REDIS_HOST", "localhost"),
                    port=redis_port,
                    password=redis_password or os.getenv("REDIS_PASSWORD"),
                    db=redis_db,
                    decode_responses=True
                )
                # Test connection
                self._redis_client.ping()
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {str(e)}")
                logger.info("Falling back to in-memory caching")
                self.cache_type = "memory"
                self._memory_cache = {}
        else:
            raise ValueError(f"Unsupported cache type: {cache_type}")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found or expired
        """
        if self.cache_type == "memory":
            return self._get_from_memory(key)
        elif self.cache_type == "redis":
            return self._get_from_redis(key)
        else:
            return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """
        Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if None)
            
        Returns:
            True if successful, False otherwise
        """
        ttl = ttl or self.default_ttl
        
        if self.cache_type == "memory":
            return self._set_in_memory(key, value, ttl)
        elif self.cache_type == "redis":
            return self._set_in_redis(key, value, ttl)
        else:
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful, False otherwise
        """
        if self.cache_type == "memory":
            return self._delete_from_memory(key)
        elif self.cache_type == "redis":
            return self._delete_from_redis(key)
        else:
            return False
    
    def clear(self) -> bool:
        """
        Clear all values from the cache.
        
        Returns:
            True if successful, False otherwise
        """
        if self.cache_type == "memory":
            self._memory_cache.clear()
            return True
        elif self.cache_type == "redis":
            try:
                self._redis_client.flushdb()
                return True
            except Exception as e:
                logger.error(f"Failed to clear Redis cache: {str(e)}")
                return False
        else:
            return False
    
    def _get_from_memory(self, key: str) -> Optional[Any]:
        """Get a value from the in-memory cache."""
        if key not in self._memory_cache:
            return None
        
        cache_entry = self._memory_cache[key]
        
        # Check if expired
        if cache_entry["expires_at"] < time.time():
            del self._memory_cache[key]
            return None
        
        return cache_entry["value"]
    
    def _set_in_memory(self, key: str, value: Any, ttl: int) -> bool:
        """Set a value in the in-memory cache."""
        expires_at = time.time() + ttl
        self._memory_cache[key] = {
            "value": value,
            "expires_at": expires_at
        }
        return True
    
    def _delete_from_memory(self, key: str) -> bool:
        """Delete a value from the in-memory cache."""
        if key in self._memory_cache:
            del self._memory_cache[key]
            return True
        return False
    
    def _get_from_redis(self, key: str) -> Optional[Any]:
        """Get a value from Redis."""
        try:
            serialized_value = self._redis_client.get(key)
            if serialized_value is None:
                return None
            
            # Deserialize the value
            try:
                # Try to deserialize as JSON first
                return json.loads(serialized_value)
            except json.JSONDecodeError:
                # If JSON fails, try pickle
                try:
                    return pickle.loads(serialized_value.encode('latin-1'))
                except Exception:
                    # If all else fails, return as string
                    return serialized_value
        except Exception as e:
            logger.error(f"Failed to get from Redis: {str(e)}")
            return None
    
    def _set_in_redis(self, key: str, value: Any, ttl: int) -> bool:
        """Set a value in Redis."""
        try:
            # Serialize the value
            try:
                # Try to serialize as JSON first
                serialized_value = json.dumps(value)
            except (TypeError, ValueError):
                # If JSON fails, try pickle
                try:
                    serialized_value = pickle.dumps(value).decode('latin-1')
                except Exception as e:
                    logger.error(f"Failed to serialize value for Redis: {str(e)}")
                    return False
            
            # Set in Redis with TTL
            return self._redis_client.setex(key, ttl, serialized_value)
        except Exception as e:
            logger.error(f"Failed to set in Redis: {str(e)}")
            return False
    
    def _delete_from_redis(self, key: str) -> bool:
        """Delete a value from Redis."""
        try:
            return bool(self._redis_client.delete(key))
        except Exception as e:
            logger.error(f"Failed to delete from Redis: {str(e)}")
            return False

def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time-to-live in seconds
        key_prefix: Prefix for the cache key
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create a cache key based on function name and arguments
            arg_string = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            cache_key = f"{key_prefix}{hashlib.md5(arg_string.encode()).hexdigest()}"
            
            # Try to get from cache
            cache_manager = get_cache_manager()
            cached_result = cache_manager.get(cache_key)
            
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # If not in cache, call the function
            logger.debug(f"Cache miss for {cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache
            cache_manager.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

# Global cache manager instance
_cache_manager: Optional[CacheManager] = None

def get_cache_manager() -> CacheManager:
    """Get the global cache manager instance."""
    global _cache_manager
    
    if _cache_manager is None:
        # Initialize cache manager based on environment variables
        cache_type = os.getenv("CACHE_TYPE", "memory")
        
        if cache_type == "redis":
            _cache_manager = CacheManager(
                cache_type=cache_type,
                redis_host=os.getenv("REDIS_HOST"),
                redis_port=int(os.getenv("REDIS_PORT", 6379)),
                redis_password=os.getenv("REDIS_PASSWORD"),
                redis_db=int(os.getenv("REDIS_DB", 0)),
                default_ttl=int(os.getenv("CACHE_TTL", 3600))
            )
        else:
            _cache_manager = CacheManager(
                cache_type=cache_type,
                default_ttl=int(os.getenv("CACHE_TTL", 3600))
            )
    
    return _cache_manager

def init_cache(cache_type: str = "memory", **kwargs) -> CacheManager:
    """
    Initialize the global cache manager.
    
    Args:
        cache_type: Type of cache ('memory' or 'redis')
        **kwargs: Additional arguments for CacheManager
        
    Returns:
        The initialized cache manager
    """
    global _cache_manager
    _cache_manager = CacheManager(cache_type=cache_type, **kwargs)
    return _cache_manager
