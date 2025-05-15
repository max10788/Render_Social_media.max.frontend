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
        """Verfolgt eine Kette von Transaktionen und deren Verzweigungen."""
        try:
            # Initialisiere Tracking-Ergebnisse
            result = {
                "source_currency": "",
                "target_currency": target_currency,
                "start_transaction": start_tx_hash,
                "transactions_count": 0,
                "transactions": [],
                "flow_map": {
                    "nodes": [],  # Wallet-Adressen
                    "edges": [],  # Transaktionen zwischen Wallets
                    "currency_conversions": [],  # Währungsumwandlungen
                    "suspicious_patterns": []  # Auffällige Muster
                }
            }
    
            # Verfolge Transaktionen
            tx_data = await self._run_sync(
                self.tracker.track_transactions,
                start_tx_hash=start_tx_hash,
                target_currency=target_currency,
                num_transactions=num_transactions
            )
    
            if not tx_data:
                raise TransactionNotFoundError(f"Keine Transaktionsdaten gefunden für {start_tx_hash}")
    
            # Extrahiere Transaktionskette
            processed_wallets = set()
            wallet_balances = {}
            
            for tx in tx_data["transactions"]:
                # Füge Quell- und Ziel-Wallets hinzu
                source_wallet = tx.get("from_address")
                target_wallet = tx.get("to_address")
                
                if source_wallet:
                    result["flow_map"]["nodes"].append({
                        "address": source_wallet,
                        "type": "wallet",
                        "total_sent": wallet_balances.get(source_wallet, {}).get("sent", 0),
                        "total_received": wallet_balances.get(source_wallet, {}).get("received", 0),
                        "first_seen": tx["timestamp"],
                        "currencies": set([tx["currency"]])
                    })
                    processed_wallets.add(source_wallet)
    
                if target_wallet:
                    result["flow_map"]["nodes"].append({
                        "address": target_wallet,
                        "type": "wallet",
                        "total_sent": wallet_balances.get(target_wallet, {}).get("sent", 0),
                        "total_received": wallet_balances.get(target_wallet, {}).get("received", 0),
                        "first_seen": tx["timestamp"],
                        "currencies": set([tx["currency"]])
                    })
                    processed_wallets.add(target_wallet)
    
                # Füge Transaktion zur Edge-Liste hinzu
                result["flow_map"]["edges"].append({
                    "from": source_wallet,
                    "to": target_wallet,
                    "hash": tx["hash"],
                    "value": tx["value"],
                    "currency": tx["currency"],
                    "timestamp": tx["timestamp"]
                })
    
                # Erkenne Währungsumwandlungen
                if tx.get("currency_conversion"):
                    result["flow_map"]["currency_conversions"].append({
                        "transaction_hash": tx["hash"],
                        "from_currency": tx["currency"],
                        "to_currency": tx["currency_conversion"]["to_currency"],
                        "from_amount": tx["value"],
                        "to_amount": tx["currency_conversion"]["to_amount"],
                        "exchange_rate": tx["currency_conversion"]["rate"],
                        "exchange_platform": tx["currency_conversion"].get("platform", "unknown")
                    })
    
                # Erkenne verdächtige Muster
                if self._detect_suspicious_pattern(tx):
                    result["flow_map"]["suspicious_patterns"].append({
                        "transaction_hash": tx["hash"],
                        "pattern_type": tx["pattern_type"],
                        "description": tx["pattern_description"],
                        "risk_score": tx["risk_score"]
                    })
    
            # Aktualisiere Basis-Informationen
            result["source_currency"] = tx_data["transactions"][0]["currency"]
            result["transactions"] = tx_data["transactions"]
            result["transactions_count"] = len(tx_data["transactions"])
    
            return result
    
        except Exception as e:
            logger.error(f"Fehler beim Tracking der Transaktion {start_tx_hash}: {e}")
            if "not found" in str(e).lower():
                raise TransactionNotFoundError(f"Transaktion {start_tx_hash} nicht gefunden")
            raise APIError(f"API-Fehler: {str(e)}")
    
    def _detect_suspicious_pattern(self, transaction: Dict) -> bool:
        """Erkennt verdächtige Transaktionsmuster."""
        patterns = {
            "mixing": self._check_mixing_pattern,
            "layering": self._check_layering_pattern,
            "splitting": self._check_splitting_pattern,
            "quick_conversion": self._check_quick_conversion_pattern
        }
        
        for pattern_type, check_func in patterns.items():
            if check_func(transaction):
                transaction["pattern_type"] = pattern_type
                transaction["pattern_description"] = self._get_pattern_description(pattern_type)
                transaction["risk_score"] = self._calculate_risk_score(transaction)
                return True
        
        return False

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
