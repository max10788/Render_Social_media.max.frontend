# app/core/backend_crypto_tracker/utils/rate_limiter.py
import asyncio
import time
from typing import Dict, Optional, List
from collections import defaultdict, deque
from dataclasses import dataclass, field  # <-- FEHLENDES IMPORT HINZUGEFÜGT
from app.core.backend_crypto_tracker.utils.logger import get_logger

logger = get_logger(__name__)

@dataclass
class RateLimit:
    """Repräsentiert ein Rate-Limit für einen Schlüssel"""
    max_requests: int
    time_window: int
    request_times: deque = field(default_factory=deque)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    blocked_until: float = 0.0

class RateLimiter:
    def __init__(self):
        self.rate_limits: Dict[str, RateLimit] = {}
        self.global_stats = {
            'total_requests': 0,
            'blocked_requests': 0,
            'active_limits': 0
        }
    
    def add_limit(self, key: str, max_requests: int, time_window: int) -> None:
        """
        Fügt ein Rate-Limit für einen Schlüssel hinzu
        
        Args:
            key: Eindeutiger Schlüssel für das Limit
            max_requests: Maximale Anzahl von Anfragen im Zeitfenster
            time_window: Zeitfenster in Sekunden
        """
        if key not in self.rate_limits:
            self.rate_limits[key] = RateLimit(
                max_requests=max_requests,
                time_window=time_window
            )
            self.global_stats['active_limits'] += 1
            logger.debug(f"Added rate limit for key: {key} ({max_requests} requests per {time_window}s)")
    
    async def acquire(self, key: str, max_requests: int, time_window: int) -> bool:
        """
        Versucht, ein Rate-Limit-Token zu erhalten
        
        Args:
            key: Eindeutiger Schlüssel für das Limit
            max_requests: Maximale Anzahl von Anfragen im Zeitfenster
            time_window: Zeitfenster in Sekunden
            
        Returns:
            True, wenn die Anfrage erlaubt ist, False wenn das Limit erreicht wurde
        """
        self.global_stats['total_requests'] += 1
        
        # Stelle sicher, dass das Limit existiert
        if key not in self.rate_limits:
            self.add_limit(key, max_requests, time_window)
        
        limit = self.rate_limits[key]
        
        async with limit.lock:
            now = time.time()
            
            # Prüfe, ob der Schlüssel blockiert ist
            if now < limit.blocked_until:
                self.global_stats['blocked_requests'] += 1
                logger.debug(f"Request blocked for key: {key} (blocked until {limit.blocked_until})")
                return False
            
            # Entferne alte Anfragen außerhalb des Zeitfensters
            while limit.request_times and limit.request_times[0] <= now - time_window:
                limit.request_times.popleft()
            
            # Prüfe, ob das Limit erreicht wurde
            if len(limit.request_times) >= max_requests:
                # Blockiere den Schlüssel für eine kurze Zeit
                limit.blocked_until = now + (time_window / 10)  # 10% des Zeitfensters
                self.global_stats['blocked_requests'] += 1
                logger.debug(f"Rate limit exceeded for key: {key} (blocked until {limit.blocked_until})")
                return False
            
            # Füge die aktuelle Anfrage hinzu
            limit.request_times.append(now)
            logger.debug(f"Request allowed for key: {key} ({len(limit.request_times)}/{max_requests})")
            return True
    
    async def wait_if_needed(self, key: str, max_requests: int, time_window: int) -> bool:
        """
        Wartet, falls notwendig, bis eine Anfrage gemacht werden kann
        
        Args:
            key: Eindeutiger Schlüssel für das Limit
            max_requests: Maximale Anzahl von Anfragen im Zeitfenster
            time_window: Zeitfenster in Sekunden
            
        Returns:
            True, wenn die Anfrage gemacht wurde, False wenn ein Timeout auftrat
        """
        # Stelle sicher, dass das Limit existiert
        if key not in self.rate_limits:
            self.add_limit(key, max_requests, time_window)
        
        limit = self.rate_limits[key]
        
        async with limit.lock:
            now = time.time()
            
            # Prüfe, ob der Schlüssel blockiert ist
            if now < limit.blocked_until:
                wait_time = limit.blocked_until - now
                logger.debug(f"Waiting {wait_time:.2f}s for blocked key: {key}")
                await asyncio.sleep(wait_time)
            
            # Entferne alte Anfragen außerhalb des Zeitfensters
            while limit.request_times and limit.request_times[0] <= now - time_window:
                limit.request_times.popleft()
            
            # Prüfe, ob das Limit erreicht wurde
            if len(limit.request_times) >= max_requests:
                # Berechne, wann die älteste Anfrage abläuft
                if limit.request_times:
                    wait_time = limit.request_times[0] + time_window - now
                    if wait_time > 0:
                        logger.debug(f"Rate limit reached, waiting {wait_time:.2f}s for key: {key}")
                        await asyncio.sleep(wait_time)
                        
                        # Nach dem Warten erneut prüfen
                        now = time.time()
                        while limit.request_times and limit.request_times[0] <= now - time_window:
                            limit.request_times.popleft()
                
                # Immer noch nicht möglich?
                if len(limit.request_times) >= max_requests:
                    self.global_stats['blocked_requests'] += 1
                    logger.debug(f"Rate limit still exceeded after waiting for key: {key}")
                    return False
            
            # Füge die aktuelle Anfrage hinzu
            limit.request_times.append(now)
            logger.debug(f"Request allowed after waiting for key: {key}")
            return True
    
    def get_stats(self) -> Dict:
        """Gibt Statistiken des Rate-Limiters zurück"""
        limits_stats = {}
        
        for key, limit in self.rate_limits.items():
            limits_stats[key] = {
                'max_requests': limit.max_requests,
                'time_window': limit.time_window,
                'current_requests': len(limit.request_times),
                'blocked_until': limit.blocked_until
            }
        
        return {
            'global_stats': self.global_stats.copy(),
            'limits': limits_stats
        }
    
    def reset(self, key: Optional[str] = None) -> None:
        """
        Setzt die Zähler für einen Schlüssel oder alle Schlüssel zurück
        
        Args:
            key: Schlüssel, der zurückgesetzt werden soll. Wenn None, werden alle zurückgesetzt.
        """
        if key:
            if key in self.rate_limits:
                self.rate_limits[key].request_times.clear()
                self.rate_limits[key].blocked_until = 0.0
                logger.debug(f"Reset rate limit for key: {key}")
        else:
            for limit in self.rate_limits.values():
                limit.request_times.clear()
                limit.blocked_until = 0.0
            logger.debug("Reset all rate limits")

# Globale Rate-Limiter-Instanz
rate_limiter = RateLimiter()

# Hilfsfunktionen für die einfache Verwendung
async def limit_api_requests(api_name: str, max_requests: int, time_window: int) -> bool:
    """Hilfsfunktion für API-Rate-Limiting"""
    return await rate_limiter.acquire(api_name, max_requests, time_window)

async def wait_for_api_slot(api_name: str, max_requests: int, time_window: int) -> bool:
    """Hilfsfunktion, die auf einen freien API-Slot wartet"""
    return await rate_limiter.wait_if_needed(api_name, max_requests, time_window)
