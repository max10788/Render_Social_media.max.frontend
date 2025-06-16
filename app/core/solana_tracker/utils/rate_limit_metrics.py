from typing import Dict, Optional
from datetime import datetime, timedelta
import logging
from collections import deque
import asyncio
import json
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class RateLimitMetrics:
    """Rate limit metrics for a time window."""
    total_requests: int = 0
    rate_limited_requests: int = 0
    success_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    last_rate_limit: Optional[datetime] = None
    window_start: datetime = datetime.utcnow()

class RateLimitMonitor:
    """Monitor and track rate limiting metrics."""
    
    def __init__(
        self,
        window_size: int = 3600,  # 1 hour default
        alert_threshold: float = 0.1  # 10% rate limits trigger alert
    ):
        self.window_size = window_size
        self.alert_threshold = alert_threshold
        self.metrics: Dict[str, RateLimitMetrics] = {}
        self.response_times: Dict[str, deque] = {}
        self._lock = asyncio.Lock()
        
    async def record_request(
        self,
        endpoint: str,
        status_code: int,
        response_time: float
    ):
        """Record a request and its outcome."""
        async with self._lock:
            if endpoint not in self.metrics:
                self.metrics[endpoint] = RateLimitMetrics()
                self.response_times[endpoint] = deque(maxlen=1000)
                
            metrics = self.metrics[endpoint]
            metrics.total_requests += 1
            
            # Record response time
            self.response_times[endpoint].append(response_time)
            metrics.average_response_time = sum(self.response_times[endpoint]) / len(self.response_times[endpoint])
            
            # Update request counts
            if status_code == 200:
                metrics.success_requests += 1
            elif status_code == 429:
                metrics.rate_limited_requests += 1
                metrics.last_rate_limit = datetime.utcnow()
                await self._check_alert_threshold(endpoint)
            else:
                metrics.failed_requests += 1
                
    async def _check_alert_threshold(self, endpoint: str):
        """Check if rate limiting has exceeded alert threshold."""
        metrics = self.metrics[endpoint]
        rate_limit_ratio = metrics.rate_limited_requests / max(metrics.total_requests, 1)
        
        if rate_limit_ratio >= self.alert_threshold:
            logger.warning(
                f"Rate limit alert for {endpoint}: "
                f"{rate_limit_ratio:.1%} of requests rate limited"
            )
            # Here you could implement additional alerting (email, Slack, etc.)
            
    async def get_metrics(self, endpoint: str) -> Optional[Dict]:
        """Get current metrics for an endpoint."""
        async with self._lock:
            if endpoint in self.metrics:
                return asdict(self.metrics[endpoint])
            return None
            
    async def reset_metrics(self, endpoint: str):
        """Reset metrics for an endpoint."""
        async with self._lock:
            if endpoint in self.metrics:
                self.metrics[endpoint] = RateLimitMetrics()
                self.response_times[endpoint].clear()
                
    def export_metrics(self) -> str:
        """Export all metrics as JSON string."""
        return json.dumps({
            endpoint: asdict(metrics)
            for endpoint, metrics in self.metrics.items()
        }, default=str)
