import numpy as np
import pandas as pd
import pickle
import hashlib
import json
import time
import os
from typing import Any, Dict, Optional, Union, Callable
from datetime import datetime, timedelta
from functools import wraps
import logging
import redis
from pathlib import Path

logger = logging.getLogger(__name__)

class CacheManager:
    """Klasse zur Verwaltung von Caching-Funktionalität"""
    
    def __init__(self, 
                 cache_type: str = 'memory',
                 redis_host: str = 'localhost',
                 redis_port: int = 6379,
                 redis_db: int = 0,
                 redis_password: Optional[str] = None,
                 default_ttl: int = 3600):
        """
        Initialisiere Cache-Manager
        
        Args:
            cache_type: Art des Caches ('memory', 'redis', 'file')
            redis_host: Redis-Host
            redis_port: Redis-Port
            redis_db: Redis-Datenbank
            redis_password: Redis-Passwort
            default_ttl: Standard-TTL in Sekunden
        """
        self.cache_type = cache_type
        self.default_ttl = default_ttl
        
        if cache_type == 'memory':
            self.cache = {}
        elif cache_type == 'redis':
            try:
                self.cache = redis.StrictRedis(
                    host=redis_host,
                    port=redis_port,
                    db=redis_db,
                    password=redis_password,
                    decode_responses=True
                )
                # Teste Verbindung
                self.cache.ping()
                logger.info("Redis-Verbindung erfolgreich")
            except Exception as e:
                logger.error(f"Redis-Verbindung fehlgeschlagen: {str(e)}")
                logger.info("Falle auf In-Memory-Cache zurück")
                self.cache_type = 'memory'
                self.cache = {}
        elif cache_type == 'file':
            self.cache_dir = Path('./cache')
            self.cache_dir.mkdir(exist_ok=True)
        else:
            raise ValueError(f"Unbekannter Cache-Typ: {cache_type}")
    
    def _generate_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """
        Generiere einen eindeutigen Schlüssel für die Cache-Einträge
        
        Args:
            func_name: Name der Funktion
            args: Positionale Argumente
            kwargs: Schlüsselwortargumente
            
        Returns:
            Cache-Schlüssel
        """
        # Konvertiere Argumente in einen hashbaren String
        key_data = {
            'func_name': func_name,
            'args': str(args),
            'kwargs': str(sorted(kwargs.items()))
        }
        
        # Erstelle Hash
        key_hash = hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
        
        return f"{func_name}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Hole Wert aus dem Cache
        
        Args:
            key: Cache-Schlüssel
            
        Returns:
            Gecachter Wert oder None
        """
        if self.cache_type == 'memory':
            return self.cache.get(key)
        elif self.cache_type == 'redis':
            try:
                value = self.cache.get(key)
                if value:
                    return pickle.loads(value)
                return None
            except Exception as e:
                logger.error(f"Fehler beim Abrufen aus Redis: {str(e)}")
                return None
        elif self.cache_type == 'file':
            cache_file = self.cache_dir / f"{key}.pkl"
            if cache_file.exists():
                try:
                    with open(cache_file, 'rb') as f:
                        return pickle.load(f)
                except Exception as e:
                    logger.error(f"Fehler beim Laden aus Datei: {str(e)}")
                    return None
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Speichere Wert im Cache
        
        Args:
            key: Cache-Schlüssel
            value: Zu speichernder Wert
            ttl: Time-to-Live in Sekunden
            
        Returns:
            True bei Erfolg, False bei Fehler
        """
        if ttl is None:
            ttl = self.default_ttl
            
        if self.cache_type == 'memory':
            self.cache[key] = value
            # Setze Ablaufzeit (wird bei get überprüft)
            self.cache[f"{key}_expires"] = time.time() + ttl
            return True
        elif self.cache_type == 'redis':
            try:
                value_bytes = pickle.dumps(value)
                return self.cache.setex(key, ttl, value_bytes)
            except Exception as e:
                logger.error(f"Fehler beim Speichern in Redis: {str(e)}")
                return False
        elif self.cache_type == 'file':
            try:
                cache_file = self.cache_dir / f"{key}.pkl"
                with open(cache_file, 'wb') as f:
                    pickle.dump(value, f)
                
                # Erstelle Metadatei mit Ablaufzeit
                metadata_file = self.cache_dir / f"{key}.meta"
                with open(metadata_file, 'w') as f:
                    json.dump({'expires': time.time() + ttl}, f)
                    
                return True
            except Exception as e:
                logger.error(f"Fehler beim Speichern in Datei: {str(e)}")
                return False
    
    def delete(self, key: str) -> bool:
        """
        Lösche Wert aus dem Cache
        
        Args:
            key: Cache-Schlüssel
            
        Returns:
            True bei Erfolg, False bei Fehler
        """
        if self.cache_type == 'memory':
            if key in self.cache:
                del self.cache[key]
                if f"{key}_expires" in self.cache:
                    del self.cache[f"{key}_expires"]
                return True
            return False
        elif self.cache_type == 'redis':
            try:
                return self.cache.delete(key) > 0
            except Exception as e:
                logger.error(f"Fehler beim Löschen aus Redis: {str(e)}")
                return False
        elif self.cache_type == 'file':
            try:
                cache_file = self.cache_dir / f"{key}.pkl"
                metadata_file = self.cache_dir / f"{key}.meta"
                
                if cache_file.exists():
                    cache_file.unlink()
                if metadata_file.exists():
                    metadata_file.unlink()
                    
                return True
            except Exception as e:
                logger.error(f"Fehler beim Löschen aus Datei: {str(e)}")
                return False
    
    def clear(self) -> bool:
        """
        Lösche alle Einträge aus dem Cache
        
        Returns:
            True bei Erfolg, False bei Fehler
        """
        if self.cache_type == 'memory':
            self.cache.clear()
            return True
        elif self.cache_type == 'redis':
            try:
                return self.cache.flushdb()
            except Exception as e:
                logger.error(f"Fehler beim Löschen von Redis: {str(e)}")
                return False
        elif self.cache_type == 'file':
            try:
                for file in self.cache_dir.glob("*.pkl"):
                    file.unlink()
                for file in self.cache_dir.glob("*.meta"):
                    file.unlink()
                return True
            except Exception as e:
                logger.error(f"Fehler beim Löschen von Dateien: {str(e)}")
                return False
    
    def is_expired(self, key: str) -> bool:
        """
        Prüfe, ob ein Cache-Eintrag abgelaufen ist
        
        Args:
            key: Cache-Schlüssel
            
        Returns:
            True wenn abgelaufen, False sonst
        """
        if self.cache_type == 'memory':
            expires_key = f"{key}_expires"
            if expires_key in self.cache:
                return time.time() > self.cache[expires_key]
            return True
        elif self.cache_type == 'redis':
            # Redis handhabt TTL automatisch
            return not self.cache.exists(key)
        elif self.cache_type == 'file':
            metadata_file = self.cache_dir / f"{key}.meta"
            if metadata_file.exists():
                try:
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    return time.time() > metadata['expires']
                except Exception as e:
                    logger.error(f"Fehler beim Prüfen der Ablaufzeit: {str(e)}")
                    return True
            return True
    
    def cached(self, ttl: Optional[int] = None):
        """
        Dekorator zum Cachen von Funktionen
        
        Args:
            ttl: Time-to-Live in Sekunden
            
        Returns:
            Dekorierte Funktion
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generiere Cache-Schlüssel
                key = self._generate_key(func.__name__, args, kwargs)
                
                # Prüfe Cache
                cached_result = self.get(key)
                if cached_result is not None and not self.is_expired(key):
                    logger.debug(f"Cache-Treffer für {func.__name__}")
                    return cached_result
                
                # Führe Funktion aus
                result = func(*args, **kwargs)
                
                # Speichere im Cache
                self.set(key, result, ttl)
                
                return result
            return wrapper
        return decorator

class DataCache:
    """Spezialisierter Cache für Finanzdaten"""
    
    def __init__(self, cache_manager: CacheManager):
        """
        Initialisiere Daten-Cache
        
        Args:
            cache_manager: Cache-Manager-Instanz
        """
        self.cache = cache_manager
    
    def get_historical_prices(self, 
                             assets: List[str], 
                             start_date: datetime, 
                             end_date: datetime) -> Optional[pd.DataFrame]:
        """
        Hole historische Preise aus dem Cache
        
        Args:
            assets: Liste der Assets
            start_date: Startdatum
            end_date: Enddatum
            
        Returns:
            DataFrame mit historischen Preisen oder None
        """
        key = f"historical_prices:{','.join(assets)}:{start_date.date()}:{end_date.date()}"
        return self.cache.get(key)
    
    def set_historical_prices(self, 
                             assets: List[str], 
                             start_date: datetime, 
                             end_date: datetime, 
                             data: pd.DataFrame, 
                             ttl: int = 86400) -> bool:
        """
        Speichere historische Preise im Cache
        
        Args:
            assets: Liste der Assets
            start_date: Startdatum
            end_date: Enddatum
            data: DataFrame mit historischen Preisen
            ttl: Time-to-Live in Sekunden
            
        Returns:
            True bei Erfolg, False bei Fehler
        """
        key = f"historical_prices:{','.join(assets)}:{start_date.date()}:{end_date.date()}"
        return self.cache.set(key, data, ttl)
    
    def get_volatility(self, 
                      asset: str, 
                      start_date: datetime, 
                      end_date: datetime,
                      model: str = 'historical') -> Optional[float]:
        """
        Hole Volatilität aus dem Cache
        
        Args:
            asset: Asset-Symbol
            start_date: Startdatum
            end_date: Enddatum
            model: Volatilitätsmodell
            
        Returns:
            Volatilität oder None
        """
        key = f"volatility:{asset}:{start_date.date()}:{end_date.date()}:{model}"
        return self.cache.get(key)
    
    def set_volatility(self, 
                      asset: str, 
                      start_date: datetime, 
                      end_date: datetime,
                      model: str,
                      volatility: float, 
                      ttl: int = 3600) -> bool:
        """
        Speichere Volatilität im Cache
        
        Args:
            asset: Asset-Symbol
            start_date: Startdatum
            end_date: Enddatum
            model: Volatilitätsmodell
            volatility: Volatilitätswert
            ttl: Time-to-Live in Sekunden
            
        Returns:
            True bei Erfolg, False bei Fehler
        """
        key = f"volatility:{asset}:{start_date.date()}:{end_date.date()}:{model}"
        return self.cache.set(key, volatility, ttl)
    
    def get_correlation_matrix(self, 
                             assets: List[str], 
                             start_date: datetime, 
                             end_date: datetime) -> Optional[pd.DataFrame]:
        """
        Hole Korrelationsmatrix aus dem Cache
        
        Args:
            assets: Liste der Assets
            start_date: Startdatum
            end_date: Enddatum
            
        Returns:
            Korrelationsmatrix oder None
        """
        key = f"correlation:{','.join(assets)}:{start_date.date()}:{end_date.date()}"
        return self.cache.get(key)
    
    def set_correlation_matrix(self, 
                             assets: List[str], 
                             start_date: datetime, 
                             end_date: datetime,
                             correlation_matrix: pd.DataFrame, 
                             ttl: int = 3600) -> bool:
        """
        Speichere Korrelationsmatrix im Cache
        
        Args:
            assets: Liste der Assets
            start_date: Startdatum
            end_date: Enddatum
            correlation_matrix: Korrelationsmatrix
            ttl: Time-to-Live in Sekunden
            
        Returns:
            True bei Erfolg, False bei Fehler
        """
        key = f"correlation:{','.join(assets)}:{start_date.date()}:{end_date.date()}"
        return self.cache.set(key, correlation_matrix, ttl)
