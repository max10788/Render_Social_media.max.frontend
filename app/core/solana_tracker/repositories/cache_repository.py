from typing import Optional, Any, Dict, Generic, TypeVar
from datetime import datetime, timedelta
import logging
import json
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
import aioredis

logger = logging.getLogger(__name__)

T = TypeVar('T')

@dataclass
class CacheEntry(Generic[T]):
    """Represents a cached item with metadata."""
    value: T
    expires_at: datetime
    created_at: datetime = datetime.utcnow()

class CacheRepository(ABC):
    """Abstract base class for cache implementations."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve item from cache."""
        pass
        
    @abstractmethod
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Store item in cache."""
        pass
        
    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Remove item from cache."""
        pass
        
    @abstractmethod
    async def clear(self) -> bool:
        """Clear all items from cache."""
        pass

class InMemoryCache(CacheRepository):
    """Simple in-memory cache implementation."""
    
    def __init__(self, default_ttl: int = 3600):
        self._cache: Dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the cleanup task."""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self):
        """Stop the cleanup task."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    async def get(self, key: str) -> Optional[Any]:
        """
        Retrieve item from cache.
        
        Args:
            key: Cache key to retrieve
            
        Returns:
            Optional[Any]: Cached value if found and not expired
        """
        try:
            entry = self._cache.get(key)
            if not entry:
                return None
                
            if datetime.utcnow() > entry.expires_at:
                await self.delete(key)
                return None
                
            return entry.value
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Store item in cache.
        
        Args:
            key: Cache key
            value: Value to store
            ttl: Time to live in seconds (optional)
            
        Returns:
            bool: True if successful
        """
        try:
            expires_at = datetime.utcnow() + timedelta(
                seconds=ttl if ttl is not None else self._default_ttl
            )
            
            self._cache[key] = CacheEntry(
                value=value,
                expires_at=expires_at
            )
            return True
            
        except Exception as e:
            logger.error(f"Error setting cache value: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Remove item from cache."""
        try:
            self._cache.pop(key, None)
            return True
        except Exception as e:
            logger.error(f"Error deleting from cache: {e}")
            return False

    async def clear(self) -> bool:
        """Clear all items from cache."""
        try:
            self._cache.clear()
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False

    async def _cleanup_loop(self):
        """Background task to clean up expired entries."""
        while True:
            try:
                current_time = datetime.utcnow()
                expired_keys = [
                    key for key, entry in self._cache.items()
                    if current_time > entry.expires_at
                ]
                
                for key in expired_keys:
                    await self.delete(key)
                    
                await asyncio.sleep(60)  # Run cleanup every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")
                await asyncio.sleep(60)

class RedisCache(CacheRepository):
    """Redis-based cache implementation."""
    
    def __init__(
        self,
        redis_url: str,
        default_ttl: int = 3600,
        encoding: str = 'utf-8'
    ):
        self._redis_url = redis_url
        self._default_ttl = default_ttl
        self._encoding = encoding
        self._redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Establish Redis connection."""
        if not self._redis:
            self._redis = await aioredis.from_url(self._redis_url)

    async def disconnect(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve item from Redis."""
        if not self._redis:
            await self.connect()
            
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value.decode(self._encoding))
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving from Redis: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Store item in Redis."""
        if not self._redis:
            await self.connect()
            
        try:
            serialized = json.dumps(value)
            await self._redis.set(
                key,
                serialized,
                ex=ttl if ttl is not None else self._default_ttl
            )
            return True
            
        except Exception as e:
            logger.error(f"Error setting Redis value: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Remove item from Redis."""
        if not self._redis:
            await self.connect()
            
        try:
            await self._redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting from Redis: {e}")
            return False

    async def clear(self) -> bool:
        """Clear all items from Redis."""
        if not self._redis:
            await self.connect()
            
        try:
            await self._redis.flushdb()
            return True
        except Exception as e:
            logger.error(f"Error clearing Redis: {e}")
            return False
