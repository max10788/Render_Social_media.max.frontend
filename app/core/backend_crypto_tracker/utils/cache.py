# app/core/backend_crypto_tracker/utils/cache.py
import asyncio
import time
from typing import Any, Optional, Dict

class AnalysisCache:
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.locks: Dict[str, asyncio.Lock] = {}
    
    def _get_cache_key(self, token_address: str, chain: str) -> str:
        return f"{chain}:{token_address.lower()}"
    
    async def get(self, token_address: str, chain: str, ttl: int = 3600) -> Optional[Dict]:
        """Holt cached Analysis Result"""
        cache_key = self._get_cache_key(token_address, chain)
        
        if cache_key not in self.cache:
            return None
        
        cached_data = self.cache[cache_key]
        if time.time() - cached_data['timestamp'] > ttl:
            # Cache expired
            del self.cache[cache_key]
            return None
        
        return cached_data['data']
    
    async def set(self, token_address: str, chain: str, data: Dict) -> None:
        """Speichert Analysis Result im Cache"""
        cache_key = self._get_cache_key(token_address, chain)
        
        self.cache[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }
    
    async def clear_expired(self, ttl: int = 3600) -> int:
        """Entfernt abgelaufene Cache Einträge"""
        current_time = time.time()
        expired_keys = []
        
        for key, cached_data in self.cache.items():
            if current_time - cached_data['timestamp'] > ttl:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)
