# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, Info
import time
from functools import wraps
from typing import Dict, Any, Optional
from app.core.backend_crypto_tracker.utils.logger import get_logger

logger = get_logger(__name__)

# Metrics Registry
registry = CollectorRegistry()

# API Metrics
api_requests_total = Counter(
    'api_requests_total',
    'Total number of API requests',
    ['endpoint', 'method', 'status_code'],
    registry=registry
)

api_request_duration = Histogram(
    'api_request_duration_seconds',
    'Time spent processing API requests',
    ['endpoint', 'method'],
    registry=registry
)

# Database Metrics
db_operations_total = Counter(
    'db_operations_total',
    'Total number of database operations',
    ['operation', 'table', 'status'],
    registry=registry
)

db_operation_duration = Histogram(
    'db_operation_duration_seconds',
    'Time spent on database operations',
    ['operation', 'table'],
    registry=registry
)

db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections',
    registry=registry
)

# Scanner Metrics
scanner_jobs_total = Counter(
    'scanner_jobs_total',
    'Total number of scanner jobs',
    ['chain', 'status'],
    registry=registry
)

scanner_job_duration = Histogram(
    'scanner_job_duration_seconds',
    'Time spent on scanner jobs',
    ['chain'],
    registry=registry
)

scanner_tokens_processed = Counter(
    'scanner_tokens_processed_total',
    'Total number of tokens processed by scanner',
    ['chain'],
    registry=registry
)

active_scanner_jobs = Gauge(
    'scanner_active_jobs',
    'Number of currently active scanner jobs',
    registry=registry
)

# Custom Analysis Metrics
custom_analysis_requests = Counter(
    'custom_analysis_requests_total',
    'Total number of custom analysis requests',
    ['chain', 'status'],
    registry=registry
)

custom_analysis_duration = Histogram(
    'custom_analysis_duration_seconds',
    'Time spent on custom analysis',
    ['chain'],
    registry=registry
)

active_custom_analyses = Gauge(
    'custom_analysis_active',
    'Number of currently active analyses',
    registry=registry
)

# Blockchain Metrics
blockchain_api_requests = Counter(
    'blockchain_api_requests_total',
    'Total number of blockchain API requests',
    ['blockchain', 'api', 'status'],
    registry=registry
)

blockchain_api_duration = Histogram(
    'blockchain_api_duration_seconds',
    'Time spent on blockchain API requests',
    ['blockchain', 'api'],
    registry=registry
)

# System Metrics
system_info = Info(
    'system_info',
    'System information',
    registry=registry
)

def track_api_requests(endpoint: str, method: str = 'GET'):
    """Decorator für API-Request-Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status_code = 200
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status_code = 500
                raise
            finally:
                duration = time.time() - start_time
                api_requests_total.labels(
                    endpoint=endpoint,
                    method=method,
                    status_code=status_code
                ).inc()
                api_request_duration.labels(
                    endpoint=endpoint,
                    method=method
                ).observe(duration)
        
        return wrapper
    return decorator

def track_db_operations(operation: str, table: str):
    """Decorator für Datenbank-Operations-Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                db_operations_total.labels(
                    operation=operation,
                    table=table,
                    status=status
                ).inc()
                db_operation_duration.labels(
                    operation=operation,
                    table=table
                ).observe(duration)
        
        return wrapper
    return decorator

def track_scanner_job(chain: str):
    """Decorator für Scanner-Job-Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            active_scanner_jobs.inc()
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                scanner_jobs_total.labels(
                    chain=chain,
                    status=status
                ).inc()
                scanner_job_duration.labels(chain=chain).observe(duration)
                active_scanner_jobs.dec()
        
        return wrapper
    return decorator

def track_custom_analysis(chain: str):
    """Decorator für Custom Analysis Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            active_custom_analyses.inc()
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                custom_analysis_requests.labels(
                    chain=chain,
                    status=status
                ).inc()
                custom_analysis_duration.labels(chain=chain).observe(duration)
                active_custom_analyses.dec()
        
        return wrapper
    return decorator

def track_blockchain_api(blockchain: str, api: str):
    """Decorator für Blockchain-API-Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                blockchain_api_requests.labels(
                    blockchain=blockchain,
                    api=api,
                    status=status
                ).inc()
                blockchain_api_duration.labels(
                    blockchain=blockchain,
                    api=api
                ).observe(duration)
        
        return wrapper
    return decorator

def update_system_info(info: Dict[str, Any]):
    """Aktualisiert die System-Informationen"""
    system_info.info(info)

def increment_tokens_processed(chain: str, count: int = 1):
    """Erhöht den Zähler für verarbeitete Tokens"""
    scanner_tokens_processed.labels(chain=chain).inc(count)

def get_metrics() -> str:
    """Gibt alle Metriken im Prometheus-Format zurück"""
    from prometheus_client import generate_latest
    return generate_latest(registry).decode('utf-8')
