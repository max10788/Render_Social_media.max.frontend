from typing import List, Optional, Dict, Any
import logging
import asyncio
import aiohttp
from datetime import datetime
from decimal import Decimal

from app.core.solana_tracker.repositories import SolanaRepository
from app.core.solana_tracker.repositories.utils.rpc_endpoint_manager import RpcEndpointManager
from app.core.solana_tracker.repositories.utils.enhanced_retry_utils import (
    enhanced_retry_with_backoff,
    RateLimitBackoff
)
from app.core.solana_reporsitory.utils.rate_limit_metrics import RateLimitMonitor

logger = logging.getLogger(__name__)

class EnhancedSolanaRepository(SolanaRepository):
    """Enhanced Solana repository with improved RPC handling."""
    
    def __init__(
        self,
        primary_rpc_url: str,
        fallback_rpc_urls: List[str] = None,
        rate_limit_config: Dict = None
    ):
        super().__init__(primary_rpc_url)
        
        # Initialize endpoint manager
        self.endpoint_manager = RpcEndpointManager(
            primary_url=primary_rpc_url,
            fallback_urls=fallback_rpc_urls or []
        )
        
        # Initialize rate limiting
        rate_limit_config = rate_limit_config or {
            "rate": 50,  # requests per second
            "capacity": 100  # burst capacity
        }
        self.rate_limiter = RateLimitBackoff(**rate_limit_config)
        
        # Initialize monitoring
        self.monitor = RateLimitMonitor()
        
    async def start(self):
        """Start services."""
        await self.endpoint_manager.start()
        
    async def stop(self):
        """Stop services."""
        await self.endpoint_manager.stop()
        
    @enhanced_retry_with_backoff(
        max_retries=3,
        base_delay=1.0,
        max_delay=10.0,
        jitter=True
    )
    async def _make_rpc_call(self, method: str, params: List) -> Dict:
        """Enhanced RPC call with rate limiting and failover."""
        await self.rate_limiter.wait()  # Wait for rate limit token
        
        endpoint = await self.endpoint_manager.get_healthy_endpoint()
        start_time = datetime.utcnow()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": method,
                    "params": params
                }
                
                async with session.post(endpoint, json=payload) as response:
                    response_time = (datetime.utcnow() - start_time).total_seconds()
                    
                    # Record metrics
                    await self.monitor.record_request(
                        endpoint=endpoint,
                        status_code=response.status,
                        response_time=response_time
                    )
                    
                    # Update endpoint status
                    self.endpoint_manager.record_request_result(
                        endpoint,
                        response.status
                    )
                    
                    if response.status == 429:
                        logger.warning(f"Rate limited by {endpoint}")
                        raise Exception("Rate limit exceeded")
                        
                    response_json = await response.json()
                    if "error" in response_json:
                        raise Exception(f"RPC error: {response_json['error']}")
                        
                    return response_json
                    
        except Exception as e:
            logger.error(f"RPC call failed for {method}: {e}")
            raise
