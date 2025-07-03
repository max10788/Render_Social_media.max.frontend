from typing import Optional, List, Any, Optional, Union
from datetime import datetime, timezone
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from app.models.schemas import RateLimitConfig, EndpointMetrics, RpcError
from dataclasses import dataclass
from app.core.solana_tracker.models.base_models import BaseTransaction, TransactionDetail

class RateLimiter:
    """Rate limiter using token bucket algorithm."""
    
    def __init__(self, config: RateLimitConfig):
        self.rate = config.rate
        self.capacity = config.capacity
        self.tokens = config.capacity
        self.last_update = asyncio.get_event_loop().time()
        self._lock = asyncio.Lock()

    async def acquire(self) -> bool:
        """Attempt to acquire a token."""
        async with self._lock:
            now = asyncio.get_event_loop().time()
            time_passed = now - self.last_update
            
            # Refill tokens
            self.tokens = min(
                self.capacity,
                self.tokens + time_passed * self.rate
            )
            self.last_update = now
            
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False

    async def wait(self) -> None:
        """Wait until a token is available."""
        while not await self.acquire():
            await asyncio.sleep(1.0 / self.rate)

class EndpointManager:
    """Manages multiple RPC endpoints with health checking."""
    
    def __init__(
        self,
        primary_url: str,
        fallback_urls: Optional[List[str]] = None,
        check_interval: int = 60
    ):
        self.primary_url = primary_url
        self.fallback_urls = fallback_urls or []
        self.check_interval = check_interval
        self.endpoints: Dict[str, EndpointMetrics] = {}
        self._initialize_endpoints()
        self._health_check_task: Optional[asyncio.Task] = None

    def _initialize_endpoints(self):
        """Initialize endpoint metrics."""
        self.endpoints[self.primary_url] = EndpointMetrics(url=self.primary_url)
        for url in self.fallback_urls:
            self.endpoints[url] = EndpointMetrics(url=url)

    async def start(self):
        """Start health checking."""
        if not self._health_check_task:
            self._health_check_task = asyncio.create_task(self._health_check_loop())

    async def stop(self):
        """Stop health checking."""
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass

    async def get_healthy_endpoint(self) -> str:
        """Get URL of a healthy endpoint."""
        healthy_urls = [
            url for url, metrics in self.endpoints.items()
            if metrics.healthy
        ]
        if not healthy_urls:
            # Reset all endpoints if none are healthy
            for metrics in self.endpoints.values():
                metrics.healthy = True
            return self.primary_url
        return healthy_urls[0]

    async def _health_check_loop(self):
        """Continuous health check loop."""
        while True:
            try:
                for url in self.endpoints:
                    await self._check_endpoint(url)
                await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(self.check_interval)

    async def _check_endpoint(self, url: str):
        """Check health of specific endpoint."""
        metrics = self.endpoints[url]
        try:
            # Implement your health check logic here
            metrics.healthy = True
            metrics.last_check = datetime.utcnow()
        except Exception as e:
            logger.error(f"Endpoint {url} health check failed: {e}")
            metrics.healthy = False
            metrics.failed_requests += 1

    def record_request(self, url: str, status_code: int, response_time: float):
        """Record metrics for a request."""
        if url in self.endpoints:
            metrics = self.endpoints[url]
            metrics.total_requests += 1
            
            if status_code == 200:
                metrics.success_requests += 1
            elif status_code == 429:
                metrics.rate_limited_requests += 1
            else:
                metrics.failed_requests += 1
                
            # Update average response time
            if metrics.total_requests > 1:
                metrics.average_response_time = (
                    (metrics.average_response_time * (metrics.total_requests - 1) + response_time)
                    / metrics.total_requests
                )
            else:
                metrics.average_response_time = response_time
              
class EnhancedTransactionProcessor:
    """Enhanced transaction processor with rate limiting."""
    
    def __init__(
        self,
        primary_rpc_url: str,
        fallback_urls: Optional[List[str]] = None,
        rate_limit_config: Optional[RateLimitConfig] = None
    ):
        self.endpoint_manager = EndpointManager(
            primary_url=primary_rpc_url,
            fallback_urls=fallback_urls
        )
        self.rate_limiter = RateLimiter(
            rate_limit_config or RateLimitConfig()
        )

    async def start(self):
        """Start services."""
        await self.endpoint_manager.start()

    async def stop(self):
        """Stop services."""
        await self.endpoint_manager.stop()

    async def process_transaction(self, tx_hash: str) -> dict[str, any]:
        """Process transaction with rate limiting and failover."""
        await self.rate_limiter.wait()
        
        url = await self.endpoint_manager.get_healthy_endpoint()
        start_time = datetime.utcnow()
        
        try:
            # Implement your transaction processing logic here
            result = {"status": "success", "tx_hash": tx_hash}
            
            # Record successful request
            self.endpoint_manager.record_request(
                url=url,
                status_code=200,
                response_time=(datetime.utcnow() - start_time).total_seconds()
            )
            
            return result
            
        except Exception as e:
            # Record failed request
            self.endpoint_manager.record_request(
                url=url,
                status_code=500,
                response_time=(datetime.utcnow() - start_time).total_seconds()
            )
            raise
