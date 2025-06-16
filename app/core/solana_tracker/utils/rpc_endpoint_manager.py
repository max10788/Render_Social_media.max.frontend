from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging
import random
import aiohttp
import asyncio
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class EndpointStatus:
    url: str
    healthy: bool = True
    last_check: datetime = datetime.utcnow()
    failed_requests: int = 0
    rate_limited_requests: int = 0
    success_requests: int = 0
    last_response_time: float = 0.0

class RpcEndpointManager:
    def __init__(
        self,
        primary_url: str,
        fallback_urls: List[str] = None,
        health_check_interval: int = 60,
        max_failures: int = 3
    ):
        self.endpoints: Dict[str, EndpointStatus] = {}
        self.primary_url = primary_url
        self.fallback_urls = fallback_urls or []
        self.health_check_interval = health_check_interval
        self.max_failures = max_failures
        self._initialize_endpoints()
        self._health_check_task: Optional[asyncio.Task] = None

    def _initialize_endpoints(self):
        """Initialize endpoint status tracking."""
        self.endpoints[self.primary_url] = EndpointStatus(url=self.primary_url)
        for url in self.fallback_urls:
            self.endpoints[url] = EndpointStatus(url=url)

    async def start(self):
        """Start health check monitoring."""
        if not self._health_check_task:
            self._health_check_task = asyncio.create_task(self._health_check_loop())

    async def stop(self):
        """Stop health check monitoring."""
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
            self._health_check_task = None

    async def get_healthy_endpoint(self) -> str:
        """Get a healthy endpoint URL."""
        healthy_endpoints = [
            url for url, status in self.endpoints.items()
            if status.healthy
        ]
        if not healthy_endpoints:
            # Reset all endpoints if none are healthy
            for status in self.endpoints.values():
                status.healthy = True
            healthy_endpoints = list(self.endpoints.keys())
            
        # Prefer primary if healthy
        if self.primary_url in healthy_endpoints:
            return self.primary_url
            
        return random.choice(healthy_endpoints)

    async def _health_check_loop(self):
        """Continuous health check loop."""
        while True:
            try:
                for url in self.endpoints:
                    await self._check_endpoint_health(url)
                await asyncio.sleep(self.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(self.health_check_interval)

    async def _check_endpoint_health(self, url: str):
        """Check health of a specific endpoint."""
        try:
            async with aiohttp.ClientSession() as session:
                start_time = datetime.utcnow()
                async with session.post(
                    url,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getHealth",
                        "params": []
                    },
                    timeout=5
                ) as response:
                    response_time = (datetime.utcnow() - start_time).total_seconds()
                    
                    status = self.endpoints[url]
                    status.last_check = datetime.utcnow()
                    status.last_response_time = response_time
                    
                    if response.status == 200:
                        status.success_requests += 1
                        status.healthy = True
                    elif response.status == 429:
                        status.rate_limited_requests += 1
                        if status.rate_limited_requests >= self.max_failures:
                            status.healthy = False
                    else:
                        status.failed_requests += 1
                        if status.failed_requests >= self.max_failures:
                            status.healthy = False
                            
        except Exception as e:
            logger.error(f"Health check failed for {url}: {e}")
            status = self.endpoints[url]
            status.failed_requests += 1
            if status.failed_requests >= self.max_failures:
                status.healthy = False

    def record_request_result(self, url: str, status_code: int):
        """Record the result of an RPC request."""
        if url in self.endpoints:
            status = self.endpoints[url]
            if status_code == 200:
                status.success_requests += 1
            elif status_code == 429:
                status.rate_limited_requests += 1
            else:
                status.failed_requests += 1
