import asyncio
from typing import Dict, List
from datetime import datetime, timedelta

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
