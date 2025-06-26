from typing import List, Optional, Dict, Any
import logging
import asyncio
import aiohttp
from datetime import datetime
from decimal import Decimal
from functools import wraps
import httpx

from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager
from app.core.solana_tracker.utils.enhanced_retry_utils import (
    EnhancedRetryError,
    RateLimitBackoff,
    enhanced_retry_with_backoff
)
from app.core.solana_tracker.utils.rate_limit_metrics import RateLimitMonitor
from app.core.solana_tracker.models.transaction import TransactionDetail

logger = logging.getLogger(__name__)

class EnhancedSolanaRepository(SolanaRepository):
    """Enhanced Solana repository with improved RPC handling."""

    def __init__(
        self.config = config
        self.current_rpc_url = self.config.primary_rpc_url
        self.fallback_rpc_urls = self.config.fallback_rpc_urls
        self.client = httpx.AsyncClient()
        self.semaphore = asyncio.Semaphore(self.config.rate_limit_rate)
        self.last_request_time = 0
        self.request_count = 0
        self,
        rate_limit_config: Optional[Dict] = None

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

    def retry_with_exponential_backoff(max_retries=3, initial_delay=1):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                retries = 0
                while retries < max_retries:
                    try:
                        return await func(*args, **kwargs)
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code == 429:
                            delay = initial_delay * (2 ** retries)
                            logger.warning(f"Rate limited. Retrying in {delay} seconds...")
                            time.sleep(delay)
                            retries += 1
                        else:
                            raise
                logger.error(f"Max retries ({max_retries}) reached for {func.__name__}")
                raise
            return wrapper
        return decorator
    
    @enhanced_retry_with_backoff(
        max_retries=5, base_delay=2.0, max_delay=30.0, retry_on=(Exception,)
    )
    async def _make_rpc_call(self, method: str, params: list) -> dict:
        urls = [self.current_rpc_url] + self.fallback_rpc_urls

        for url in urls:
            async with self.semaphore:
                try:
                    response = await self.client.post(
                        url,
                        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    response.raise_for_status()
                    response_data = response.json()

                    if isinstance(response_data, dict) and "result" in response_data:
                        return response_data
                    else:
                        logger.error(f"Unexpected RPC response format from {url}: {response_data}")
                        continue

                except httpx.HTTPStatusError as e:
                    logger.error(f"RPC error from {url}: {e.response.status_code} - {e.response.text}")
                    continue
                except Exception as e:
                    logger.error(f"Error making RPC call to {url}: {str(e)}")
                    continue

        # Wenn alle URLs fehlschlagen
        logger.error("All RPC endpoints failed.")
        raise Exception("All RPC endpoints failed.")

    # You may want to override or add additional methods to use _make_rpc_call
    # Example:
    async def get_transaction(self, tx_hash: str) -> Optional[TransactionDetail]:
        try:
            response_data = await self._make_rpc_call("getTransaction", [tx_hash])
            if response_data and "result" in response_data:
                return TransactionDetail(**response_data["result"])
            else:
                logger.warning(f"No result found in response for tx hash {tx_hash}")
                return None
        except Exception as e:
            logger.error(f"Error fetching transaction {tx_hash}: {str(e)}")
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
