from typing import List, Optional, Dict, Any
import logging
import asyncio
import aiohttp
from datetime import datetime
from decimal import Decimal

from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager
from app.core.solana_tracker.utils.enhanced_retry_utils import (
    EnhancedRetryError,
    RateLimitBackoff,
    enhanced_retry_with_backoff
)
from app.core.solana_tracker.utils.rate_limit_metrics import RateLimitMonitor

logger = logging.getLogger(__name__)

class EnhancedSolanaRepository(SolanaRepository):
    """Enhanced Solana repository with improved RPC handling."""

    def __init__(
        self,
        primary_rpc_url: str,
        fallback_rpc_urls: Optional[List[str]] = None,
        rate_limit_config: Optional[Dict] = None
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
        max_retries=5, base_delay=2.0, max_delay=30.0, retry_on=(Exception,)
    )
    async def _make_rpc_call(self, method: str, params: List) -> Dict:
        """
        Enhanced RPC call with rate limiting, failover, backoff, and logging.
        Returns:
            Dict: The JSON-RPC response.
        Raises:
            EnhancedRetryError: If all retries fail.
        """
        await self.rate_limiter.wait()  # Wait for rate limit token
        endpoint = await self.endpoint_manager.get_healthy_endpoint()
        start_time = datetime.utcnow()
    
        try:
            async with aiohttp.ClientSession() as session:
                # Add maxSupportedTransactionVersion if the method is getTransaction
                if method == 'getTransaction':
                    if isinstance(params[1], dict):
                        params[1]['maxSupportedTransactionVersion'] = 0
                    else:
                        params.append({'maxSupportedTransactionVersion': 0})
    
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": method,
                    "params": params
                }
    
                async with session.post(endpoint, json=payload, timeout=15) as response:
                    response_time = (datetime.utcnow() - start_time).total_seconds()
                    await self.monitor.record_request(
                        endpoint=endpoint,
                        status_code=response.status,
                        response_time=response_time
                    )
                    self.endpoint_manager.record_request_result(endpoint, response.status)
    
                    if response.status == 429:
                        logger.warning(f"Rate limited by {endpoint}, marking as unhealthy.")
                        self.endpoint_manager.endpoints[endpoint].healthy = False
                        raise Exception("Rate limit exceeded (429)")
    
                    if response.status != 200:
                        logger.error(f"Non-200 RPC response from {endpoint}: {response.status}")
                        raise Exception(f"Non-200 RPC response: {response.status}")
    
                    response_json = await response.json()
                    if "error" in response_json:
                        logger.error(f"RPC error from {endpoint}: {response_json['error']}")
                        raise Exception(f"RPC error: {response_json['error']}")
    
                    # Optional: Log pretty-printed response
                    logger.info(f"RPC {method}({params}) response: {json.dumps(response_json, indent=2)}")
    
                    return response_json
    
        except asyncio.TimeoutError:
            logger.error(f"RPC call timeout for {method} at {endpoint}")
            self.endpoint_manager.endpoints[endpoint].healthy = False
            raise

    except Exception as e:
        logger.error(f"RPC call failed for {method} at {endpoint}: {e}")
        self.endpoint_manager.endpoints[endpoint].failed_requests += 1
        if self.endpoint_manager.endpoints[endpoint].failed_requests >= self.endpoint_manager.max_failures:
            self.endpoint_manager.endpoints[endpoint].healthy = False
        raise

    # You may want to override or add additional methods to use _make_rpc_call
    # Example:
    async def get_transaction(self, signature: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a Solana transaction by its signature.
        """
        try:
            result = await self._make_rpc_call("getTransaction", [signature, {"encoding": "json", "commitment": "finalized"}])
            return result.get("result")
        except Exception as e:
            logger.error(f"Error fetching transaction {signature}: {e}")
            return None

    async def get_signatures_for_address(self, address: str, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch recent signatures for an address.
        """
        try:
            result = await self._make_rpc_call("getSignaturesForAddress", [address, {"limit": limit}])
            return result.get("result")
        except Exception as e:
            logger.error(f"Error fetching signatures for {address}: {e}")
            return None

    async def get_balance(self, address: str) -> Optional[int]:
        """
        Fetch the balance for an address.
        """
        try:
            result = await self._make_rpc_call("getBalance", [address])
            return result.get("result", {}).get("value")
        except Exception as e:
            logger.error(f"Error fetching balance for {address}: {e}")
            return None
