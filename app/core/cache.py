# app/core/cache.py

from typing import Dict, Any, Optional

class InMemoryCache:
    def __init__(self):
        self.storage: Dict[str, Any] = {}

    def get(self, key: str) -> Optional[Dict]:
        return self.storage.get(key)

    def set(self, key: str, value: Dict, ttl: int = 300):
        self.storage[key] = value
