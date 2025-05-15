from typing import Dict, List, Optional
import logging
from datetime import datetime
from functools import lru_cache
import json
import asyncio
from app.core.crypto_tracker_backend import CryptoTracker
from app.core.config import settings
from app.core.exceptions import CryptoTrackerError, APIError, TransactionNotFoundError

# Configure logger
logger = logging.getLogger(__name__)

class CryptoTrackingService:
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        if api_keys is None:
            api_keys = {
                "etherscan": settings.ETHERSCAN_API_KEY or "",
                "coingecko": settings.COINGECKO_API_KEY or "",
            }
        self.tracker = CryptoTracker(api_keys)
        self.cache_ttl = 3600  # 1 hour cache time
    
    async def _run_sync(self, func, *args, **kwargs):
        """Helper method to run synchronous methods in async context"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
       
    async def track_transaction_chain(
        self,
        start_tx_hash: str,
        target_currency: str,
        num_transactions: int = 10
    ) -> Dict:
        """Track a chain of cryptocurrency transactions."""
        try:
            # Validate inputs
            if not start_tx_hash:
                raise ValueError("Start transaction hash is required")
            if not target_currency:
                raise ValueError("Target currency is required")
            if num_transactions < 1 or num_transactions > 100:
                raise ValueError("Number of transactions must be between 1 and 100")

            # Run the synchronous track_transactions method in an async context
            result = await self._run_sync(
                self.tracker.track_transactions,
                start_tx_hash=start_tx_hash,
                target_currency=target_currency.upper(),
                num_transactions=num_transactions
            )

            if not result:
                raise TransactionNotFoundError(f"No transaction data found for hash {start_tx_hash}")

            # Add tracking timestamp to the result
            result["tracking_timestamp"] = int(datetime.utcnow().timestamp())
            return result

        except Exception as e:
            logger.error(f"Error tracking transaction {start_tx_hash}: {str(e)}")
            if "not found" in str(e).lower():
                raise TransactionNotFoundError(f"Transaction {start_tx_hash} not found")
            raise APIError(f"API Error: {str(e)}")

    @lru_cache(maxsize=1000)
    async def get_cached_transaction(self, tx_hash: str):
        """Cache for individual transactions."""
        try:
            # Run the synchronous detect_transaction_currency method in an async context
            source_currency = await self._run_sync(
                self.tracker._detect_transaction_currency,
                tx_hash
            )
            
            if not source_currency:
                raise TransactionNotFoundError(f"Currency not detectable for transaction {tx_hash}")
            
            # Run the appropriate synchronous tracking method in an async context
            if source_currency == "BTC":
                result = await self._run_sync(
                    self.tracker.track_bitcoin_transactions,
                    tx_hash,
                    1
                )
            elif source_currency == "ETH":
                result = await self._run_sync(
                    self.tracker.track_ethereum_transactions,
                    tx_hash,
                    1
                )
            elif source_currency == "SOL":
                result = await self._run_sync(
                    self.tracker.track_solana_transactions,
                    tx_hash,
                    1
                )
            else:
                raise ValueError(f"Unsupported currency: {source_currency}")

            return result[0] if result else None

        except Exception as e:
            logger.error(f"Error caching transaction {tx_hash}: {str(e)}")
            raise APIError(f"API Error while retrieving cached transaction: {str(e)}")
