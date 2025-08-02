# app/core/backend_crypto_tracker/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import time
from functools import wraps

# Metrics Registry
registry = CollectorRegistry()

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

active_analyses = Gauge(
    'custom_analysis_active',
    'Number of currently active analyses',
    registry=registry
)

chain_success_rate = Gauge(
    'custom_analysis_success_rate',
    'Success rate by chain',
    ['chain'],
    registry=registry
)

def track_custom_analysis(chain: str):
    """Decorator für Custom Analysis Monitoring"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            active_analyses.inc()
            
            try:
                result = await func(*args, **kwargs)
                custom_analysis_requests.labels(chain=chain, status='success').inc()
                return result
            except Exception as e:
                custom_analysis_requests.labels(chain=chain, status='error').inc()
                raise
            finally:
                duration = time.time() - start_time
                custom_analysis_duration.labels(chain=chain).observe(duration)
                active_analyses.dec()
        
        return wrapper
    return decorator
