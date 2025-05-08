from typing import Dict, List, Optional
import logging
from datetime import datetime
from functools import lru_cache
import json
from ..crypto_tracker_backend import CryptoTracker
from .config import settings
from .exceptions import CryptoTrackerError, APIError, TransactionNotFoundError

logger = logging.getLogger(__name__)

class CryptoTrackingService:
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        if api_keys is None:
            api_keys = {
                "infura": settings.INFURA_API_KEY,
                "etherscan": settings.ETHERSCAN_API_KEY,
                "coingecko": settings.COINGECKO_API_KEY,
            }
        self.tracker = CryptoTracker(api_keys)
        self.cache_ttl = 3600  # 1 Stunde Cache-Zeit
       
    async def track_transaction_chain(self,
        start_tx_hash: str,
        target_currency: str,
        num_transactions: int = 10
    ) -> Dict:
        try:
            return self.tracker.track_transactions(
                start_tx_hash=start_tx_hash,
                target_currency=target_currency,
                num_transactions=num_transactions
            )
        except Exception as e:
            logger.error(f"Fehler beim Tracking der Transaktion {start_tx_hash}: {e}")
            if "not found" in str(e).lower():
                raise TransactionNotFoundError(f"Transaktion {start_tx_hash} nicht gefunden")
            raise APIError(f"API-Fehler: {str(e)}")

    @lru_cache(maxsize=1000)
    async def get_cached_transaction(self, tx_hash: str):
        """Cache für einzelne Transaktionen"""
        try:
            source_currency = self.tracker._detect_transaction_currency(tx_hash)
            if not source_currency:
                raise TransactionNotFoundError(f"Währung für Transaktion {tx_hash} nicht erkennbar")
               
            if source_currency == "BTC":
                return self.tracker.track_bitcoin_transactions(tx_hash, 1)[0]
            elif source_currency == "ETH":
                return self.tracker.track_ethereum_transactions(tx_hash, 1)[0]
            elif source_currency == "SOL":
                return self.tracker.track_solana_transactions(tx_hash, 1)[0]
        except Exception as e:
            logger.error(f"Error caching transaction {tx_hash}: {e}")
            raise APIError(f"API-Fehler beim Abrufen der gecachten Transaktion: {str(e)}")
