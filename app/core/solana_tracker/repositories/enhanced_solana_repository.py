from datetime import datetime
from decimal import Decimal
from functools import wraps
from typing import Any, Dict, List, Optional

import asyncio
import httpx
import logging
import time

from app.core.config import SolanaConfig
from app.core.solana_tracker.models.transaction import TransactionDetail
from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.utils.enhanced_retry_utils import (
    EnhancedRetryError,
    RateLimitBackoff,
    enhanced_retry_with_backoff,
)
from app.core.solana_tracker.utils.rate_limit_metrics import RateLimitMonitor
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager

logger = logging.getLogger(__name__)

# Erstelle eine globale Konfiguration aus den Umgebungsvariablen
solana_config = SolanaConfig()  # Liest automatisch aus Umgebungsvariablen wie SOLANA_RPC_URL usw.


class EnhancedSolanaRepository(SolanaRepository):
    def __init__(self, config: SolanaConfig):
        super().__init__(config)  # Aufruf des Elternkonstruktors (könnte auch leer sein)
        self.config = config
        self.current_rpc_url = self.config.primary_rpc_url
        self.fallback_rpc_urls = self.config.fallback_rpc_urls or []
        self.client = httpx.AsyncClient()
        self.semaphore = asyncio.Semaphore(self.config.rate_limit_rate)
        self.last_request_time = 0
        self.request_count = 0
        self.monitor = RateLimitMonitor()
        self.endpoint_manager = RpcEndpointManager(
            primary_url=self.config.primary_rpc_url,
            fallback_urls=self.config.fallback_rpc_urls
        )

        # Rate Limit Config verarbeiten
        if isinstance(self.config.rate_limit_capacity, int):
            self.rate_limit_config = {
                "rate": self.config.rate_limit_capacity,
                "capacity": 100
            }
        else:
            try:
                parsed_capacity = int(self.config.rate_limit_capacity)
                self.rate_limit_config = {"rate": parsed_capacity, "capacity": 100}
            except (ValueError, TypeError):
                self.rate_limit_config = {
                    "rate": 50,
                    "capacity": 100
                }

        # Neues Attribut hinzugefügt
        self._connection_checked = False
    
        self.last_request_time = 0
        self.request_count = 0
        self.monitor = RateLimitMonitor()
        self.endpoint_manager = RpcEndpointManager(
            primary_url=self.config.primary_rpc_url,
            fallback_urls=self.config.fallback_rpc_urls
        )

    async def start(self):
        """Start background services like health checks."""
        await self.endpoint_manager.start()

    async def stop(self):
        """Stop background services."""
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
                # Erster Versuch ohne maxSupportedTransactionVersion (falls kompatibel)
                call_params = params.copy()
                response = await self.client.post(
                    url,
                    json={"jsonrpc": "2.0", "id": 1, "method": method, "params": call_params},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )

                # Wenn 400 und Hinweis auf Transaktionsversion → erneut mit maxSupportedTransactionVersion
                if response.status_code == 400 and "Transaction version" in response.text:
                    logger.warning(f"{url} requires maxSupportedTransactionVersion")
                    call_params = params + [{"maxSupportedTransactionVersion": 0}]
                    response = await self.client.post(
                        url,
                        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": call_params},
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

    logger.error("All RPC endpoints failed.")
    raise Exception("All RPC endpoints failed.")

    async def get_transaction(self, tx_hash: str) -> Optional[TransactionDetail]:
        try:
            # Nur den Transaktionshash als Ausgangspunkt verwenden
            result = await self._make_rpc_call("getTransaction", [tx_hash])
    
            if result and "result" in result:
                return TransactionDetail(**result["result"])
            else:
                logger.warning(f"No result found in response for tx hash {tx_hash}")
                return None
        except Exception as e:
            logger.error(f"Error fetching transaction {tx_hash}: {str(e)}")
            return None

    async def get_signatures_for_address(self, address: str, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        try:
            result = await self._make_rpc_call("getSignaturesForAddress", [address, {"limit": limit}])
            return result.get("result")
        except Exception as e:
            logger.error(f"Error fetching signatures for {address}: {e}")
            return None

    async def get_balance(self, address: str) -> Optional[int]:
        try:
            result = await self._make_rpc_call("getBalance", [address])
            return result.get("result", {}).get("value")
        except Exception as e:
            logger.error(f"Error fetching balance for {address}: {e}")
            return None


# Instanz erstellen – nutzt automatisch Umgebungsvariablen via SolanaConfig
repository = EnhancedSolanaRepository(config=solana_config)
