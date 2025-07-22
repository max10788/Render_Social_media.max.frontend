import asyncio
from typing import Dict, List
from datetime import datetime, timedelta
from app.core.utils.retry import retry_with_exponential_backoff

class RateLimitMonitor:
    def __init__(self):
        self.requests: Dict[str, List[datetime]] = {}
        self.locks: Dict[str, asyncio.Lock] = {}
    
    def record_request(self, chain: str):
        now = datetime.utcnow()
        if chain not in self.requests:
            self.requests[chain] = []
        self.requests[chain] = [t for t in self.requests[chain] if t > now - timedelta(seconds=60)]
        self.requests[chain].append(now)
    
    def get_rate_limit(self, chain: str, max_per_minute: int = 100) -> float:
        if chain not in self.requests:
            return 0
        count = len(self.requests[chain])
        if count >= max_per_minute:
            oldest = self.requests[chain][0]
            time_remaining = 60 - (datetime.utcnow() - oldest).total_seconds()
            return time_remaining / (max_per_minute - count + 1)
        return 0

class RateLimiter:
    def __init__(self, config: RateLimitConfig):
        self.rate = config.rate
        self.capacity = config.capacity
        self.tokens = config.capacity
        self.last_update = asyncio.get_event_loop().time()
        self._lock = asyncio.Lock()
    
    @retry_with_exponential_backoff(max_retries=3, initial_delay=1)
    async def acquire(self) -> bool:
        async with self._lock:
            now = asyncio.get_event_loop().time()
            time_passed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + time_passed * self.rate)
            self.last_update = now
            
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False
    
    async def wait(self) -> None:
        while not await self.acquire():
            await asyncio.sleep(1.0 / self.rate)
