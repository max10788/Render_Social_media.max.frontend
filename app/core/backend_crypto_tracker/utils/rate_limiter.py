# app/core/backend_crypto_tracker/utils/rate_limiter.py
import asyncio
import time
from typing import Dict, Optional
from collections import defaultdict, deque

class RateLimiter:
    def __init__(self):
        self.request_times: Dict[str, deque] = defaultdict(deque)
        self.locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
    
    async def acquire(self, key: str, max_requests: int, time_window: int) -> bool:
        """
        Versucht ein Rate Limit Token zu bekommen
        Returns True wenn Request erlaubt ist, False wenn Rate Limit erreicht
        """
        async with self.locks[key]:
            now = time.time()
            
            # Entferne alte Requests außerhalb des Time Windows
            while (self.request_times[key] and 
                   self.request_times[key][0] < now - time_window):
                self.request_times[key].popleft()
            
            # Prüfe ob Rate Limit erreicht
            if len(self.request_times[key]) >= max_requests:
                return False
            
            # Füge aktuellen Request hinzu
            self.request_times[key].append(now)
            return True

