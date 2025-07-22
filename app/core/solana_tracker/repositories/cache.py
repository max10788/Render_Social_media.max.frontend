from typing import Optional, Any, Dict, Generic, TypeVar
from datetime import datetime, timedelta
import logging
import json
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
import aioredis

T = TypeVar('T')

@dataclass
class CacheEntry(Generic[T]):
    value: T
    expires_at: datetime
    created_at: datetime = datetime.utcnow()

class CacheRepository(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[CacheEntry]:
        pass
    
    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> bool:
        pass

class RedisCache(CacheRepository):
    def __init__(self, redis_url: str, default_ttl: int = 3600):
        self._redis_url = redis_url
        self._default_ttl = default_ttl
        self._redis: Optional[aioredis.Redis] = None
    
    async def connect(self):
        self._redis = await aioredis.from_url(self._redis_url)
    
    async def get(self, key: str) -> Optional[CacheEntry]:
        if not self._redis:
            await self.connect()
        data = await self._redis.get(key)
        if data:
            entry = json.loads(data)
            return CacheEntry(
                value=entry["value"],
                expires_at=datetime.fromisoformat(entry["expires_at"]),
                created_at=datetime.fromisoformat(entry["created_at"])
            )
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        if not self._redis:
            await self.connect()
        entry = CacheEntry(
            value=value,
            expires_at=datetime.utcnow() + timedelta(seconds=ttl),
            created_at=datetime.utcnow()
        )
        return await self._redis.setex(key, ttl, json.dumps(entry.__dict__))
    
    async def delete(self, key: str) -> bool:
        if not self._redis:
            await self.connect()
        return bool(await self._redis.delete(key))
