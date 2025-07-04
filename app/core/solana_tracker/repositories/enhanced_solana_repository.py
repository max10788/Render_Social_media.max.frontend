from datetime import datetime
from decimal import Decimal
from functools import wraps
from typing import Any, Dict, List, Optional

import asyncio
import httpx
import logging
import time

from app.core.config import SolanaConfig
from app.core.solana_tracker.models.base_models import (
    TransactionDetail,
    TransactionMessageDetail,
    TransactionMetaDetail
)
from app.core.solana_tracker.utils.enhanced_retry_utils import (
    EnhancedRetryError,
    RateLimitBackoff,
    enhanced_retry_with_backoff,
)
from app.core.solana_tracker.utils.rate_limit_metrics import RateLimitMonitor
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager

logger = logging.getLogger(__name__)

# Erstelle eine globale Konfiguration aus den Umgebungsvariablen
solana_config = SolanaConfig()

class EnhancedSolanaRepository:
    def __init__(self, config: SolanaConfig):
        self.config = config
        self.current_rpc_url = self.config.primary_rpc_url
        self.fallback_rpc_urls = self.config.fallback_rpc_urls or []
        self.client = httpx.AsyncClient()
        self.semaphore = asyncio.Semaphore(self.config.rate_limit_rate)
        self.last_request_time = 0
        self.request_count = 0
        self.monitor = RateLimitMonitor()
        self._first_rpc_logged = False
        
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

    @staticmethod
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
    async def _make_rpc_call(self, method: str, params: list) -> Optional[Dict[str, Any]]:
        """
        Verbesserte RPC-Aufrufe mit Versionsunterstützung und Fehlerbehandlung.
        """
        urls = [self.current_rpc_url] + self.fallback_rpc_urls
        
        # Füge Versionsunterstützung zu den Parametern hinzu
        if method == "getTransaction" and isinstance(params, list) and len(params) > 0:
            if len(params) == 1:
                params.append({})
            if isinstance(params[1], dict):
                params[1].update({
                    "maxSupportedTransactionVersion": 0,
                    "encoding": "json"
                })

        for url in urls:
            async with self.semaphore:
                try:
                    response = await self.client.post(
                        url,
                        json={
                            "jsonrpc": "2.0",
                            "id": 1,
                            "method": method,
                            "params": params
                        },
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    response.raise_for_status()
                    response_data = response.json()

                    if not self._first_rpc_logged:
                        logger.info(f"First RPC response received: {response_data}")
                        self._first_rpc_logged = True

                    if isinstance(response_data, dict):
                        # Prüfe auf Version-Fehler
                        if "error" in response_data:
                            error = response_data["error"]
                            if error.get("code") == -32015:  # Version error
                                logger.warning(f"Version error from {url}, retrying with version parameter")
                                continue
                            logger.error(f"RPC error from {url}: {error}")
                            continue

                        result = response_data.get("result")
                        if result is None:
                            logger.debug(f"No 'result' in RPC response from {url}")
                            continue

                        return result

                    else:
                        logger.warning(f"Invalid RPC response type from {url}: {type(response_data)}")
                        continue

                except httpx.HTTPStatusError as e:
                    logger.error(f"RPC error from {url}: {e.response.status_code} - {e.response.text}")
                    continue
                except Exception as e:
                    logger.error(f"Error making RPC call to {url}: {str(e)}")
                    continue

        logger.error("All RPC endpoints failed.")
        return None

    async def get_transaction(self, tx_hash: str) -> Optional[TransactionDetail]:
        """
        Holt Transaktionsdetails mit verbesserter Versionsunterstützung.
        """
        try:
            raw_result = await self._make_rpc_call("getTransaction", [
                tx_hash,
                {
                    "maxSupportedTransactionVersion": 0,
                    "encoding": "json"
                }
            ])

            if not raw_result:
                return None

            transaction_data = raw_result.get("transaction", {})
            meta_data = raw_result.get("meta")
            slot = raw_result.get("slot")

            message_data = transaction_data.get("message", {})
            message = TransactionMessageDetail(**message_data) if message_data else None

            meta = TransactionMetaDetail(**(meta_data or {})) if meta_data else None

            parsed_data = {
                "signatures": transaction_data.get("signatures", []),
                "message": message,
                "slot": slot,
                "meta": meta,
                "block_time": raw_result.get("blockTime"),
                "transaction": transaction_data  # Speichere die kompletten Transaktionsdaten
            }

            return TransactionDetail(**parsed_data)

        except Exception as e:
            logger.error(f"Error fetching transaction {tx_hash}: {str(e)}")
            return None

    async def get_signatures_for_address(
        self,
        address: str,
        limit: int = 10
    ) -> Optional[List[Dict[str, Any]]]:
        try:
            result = await self._make_rpc_call(
                "getSignaturesForAddress",
                [address, {"limit": limit}]
            )
            return result
        except Exception as e:
            logger.error(f"Error fetching signatures for {address}: {e}")
            return None

    async def get_balance(self, address: str) -> Optional[int]:
        try:
            result = await self._make_rpc_call("getBalance", [address])
            return result.get("value") if result else None
        except Exception as e:
            logger.error(f"Error fetching balance for {address}: {e}")
            return None

    async def get_transactions_for_address(
        self,
        address: str,
        before: Optional[str] = None,
        limit: int = 10
    ) -> List[TransactionDetail]:
        """
        Holt Transaktionen für eine bestimmte Adresse.
        """
        try:
            params = [
                address,
                {
                    "limit": limit,
                    "maxSupportedTransactionVersion": 0
                }
            ]
            if before:
                params[1]["before"] = before

            signatures = await self._make_rpc_call(
                "getSignaturesForAddress",
                params
            )

            if not signatures:
                return []

            transactions = []
            for sig_info in signatures:
                tx_hash = sig_info.get("signature")
                if tx_hash:
                    tx_detail = await self.get_transaction(tx_hash)
                    if tx_detail:
                        transactions.append(tx_detail)

            return transactions

        except Exception as e:
            logger.error(f"Error fetching transactions for address {address}: {e}")
            return []

# Instanz erstellen
repository = EnhancedSolanaRepository(config=solana_config)
