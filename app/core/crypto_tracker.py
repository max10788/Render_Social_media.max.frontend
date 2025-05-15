from typing import Dict, List, Optional
import logging
from datetime import datetime
from functools import lru_cache
import re
from web3 import Web3
from solana.rpc.api import Client as SolanaClient
from app.core.config import settings
from app.core.exceptions import CryptoTrackerError, APIError, TransactionNotFoundError

logger = logging.getLogger(__name__)

class CryptoTrackingService:
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        if api_keys is None:
            api_keys = {
                "etherscan": settings.ETHERSCAN_API_KEY,
                "coingecko": settings.COINGECKO_API_KEY,
            }
        self.api_keys = api_keys
        self.cache_ttl = 3600  # 1 Stunde Cache-Zeit
        
        # Initialize blockchain clients
        self.eth_client = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
        self.sol_client = SolanaClient(settings.SOLANA_RPC_URL)

    def _detect_transaction_currency(self, tx_hash: str) -> str:
    """
    Erkennt die Währung anhand des Transaction-Hash-Formats
    
    Args:
        tx_hash: Der Transaction-Hash als String
        
    Returns:
        str: "ETH" für Ethereum oder "SOL" für Solana
        
    Raises:
        ValueError: Wenn das Format nicht erkannt wird
    """
    # Ethereum: 0x gefolgt von 64 Hex-Zeichen
    if re.match(r"^0x[a-fA-F0-9]{64}$", tx_hash):
        return "ETH"
    
    # Solana: Base58-String, Länge zwischen 86 und 90 Zeichen
    # Erweiterte Prüfung für Solana-Signaturen
    if re.match(r"^[1-9A-HJ-NP-Za-km-z]{86,90}$", tx_hash):
        return "SOL"
        
    # Base58-String beliebiger Länge für Solana (fallback)
    if re.match(r"^[1-9A-HJ-NP-Za-km-z]{43,88}$", tx_hash):
        return "SOL"
    
    raise ValueError(
        f"Nicht unterstütztes Transaction-Hash-Format: {tx_hash}. "
        "Nur Ethereum (0x + 64 Hex-Zeichen) und Solana (Base58-String) werden unterstützt."
    )

    async def track_transaction_chain(
        self,
        start_tx_hash: str,
        target_currency: str,
        num_transactions: int = 10
    ) -> Dict:
        """
        Verfolgt eine Kette von Transaktionen.
        
        Args:
            start_tx_hash: Hash der Ausgangstransaktion
            target_currency: Zielwährung für die Konvertierung
            num_transactions: Maximale Anzahl zu verfolgender Transaktionen
            
        Returns:
            Dict mit Transaktionsdaten
        """
        try:
            # Ermittle die Ausgangswährung
            source_currency = self._detect_transaction_currency(start_tx_hash)
            
            # Hole Transaktionen basierend auf der Währung
            transactions = await self._get_transactions(
                start_tx_hash,
                source_currency,
                num_transactions
            )
            
            # Konvertiere Werte in Zielwährung
            converted_transactions = await self._convert_transaction_values(
                transactions,
                source_currency,
                target_currency
            )
            
            return {
                "transactions": converted_transactions,
                "source_currency": source_currency,
                "target_currency": target_currency,
                "start_transaction": start_tx_hash,
                "transactions_count": len(converted_transactions)
            }
            
        except Exception as e:
            logger.error(f"Fehler beim Tracking von {start_tx_hash}: {e}")
            raise CryptoTrackerError(f"Tracking-Fehler: {str(e)}")

    async def _get_transactions(
        self,
        start_tx_hash: str,
        currency: str,
        num_transactions: int
    ) -> List[Dict]:
        """
        Holt Transaktionen von der jeweiligen Blockchain
        """
        if currency == "ETH":
            return await self._get_ethereum_transactions(start_tx_hash, num_transactions)
        elif currency == "SOL":
            return await self._get_solana_transactions(start_tx_hash, num_transactions)
        else:
            raise ValueError(f"Nicht unterstützte Währung: {currency}")

    async def _get_ethereum_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        """
        Holt Ethereum-Transaktionen
        """
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    tx = self.eth_client.eth.get_transaction(current_tx_hash)
                    tx = self._format_eth_transaction(tx)
                
                transactions.append(tx)
                
                # Finde die nächste verknüpfte Transaktion
                if tx.get("to_address"):
                    next_tx = await self._find_next_eth_transaction(tx["to_address"])
                    if not next_tx:
                        break
                    current_tx_hash = next_tx["hash"]
                else:
                    break
            
            return transactions
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Ethereum-Transaktionen: {e}")
            raise

    async def _get_solana_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        """
        Holt Solana-Transaktionen
        """
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    tx = self.sol_client.get_transaction(current_tx_hash)
                    tx = self._format_sol_transaction(tx)
                
                transactions.append(tx)
                
                # Finde die nächste verknüpfte Transaktion
                if tx.get("to_address"):
                    next_tx = await self._find_next_sol_transaction(tx["to_address"])
                    if not next_tx:
                        break
                    current_tx_hash = next_tx["hash"]
                else:
                    break
            
            return transactions
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Solana-Transaktionen: {e}")
            raise

    async def _convert_transaction_values(
        self,
        transactions: List[Dict],
        source_currency: str,
        target_currency: str
    ) -> List[Dict]:
        """
        Konvertiert Transaktionswerte in die Zielwährung
        """
        try:
            rate = await self._get_exchange_rate(source_currency, target_currency)
            
            for tx in transactions:
                if "value" in tx:
                    tx["value_converted"] = tx["value"] * rate
                if "amount" in tx:
                    tx["amount_converted"] = tx["amount"] * rate
                    
            return transactions
        except Exception as e:
            logger.error(f"Fehler bei der Währungsumrechnung: {e}")
            raise

    async def _get_exchange_rate(self, source_currency: str, target_currency: str) -> float:
        """
        Holt den aktuellen Wechselkurs von CoinGecko
        """
        try:
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={source_currency.lower()}&vs_currencies={target_currency.lower()}"
            async with self.session.get(url) as response:
                data = await response.json()
                return data[source_currency.lower()][target_currency.lower()]
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des Wechselkurses: {e}")
            raise

    def _format_eth_transaction(self, tx: Dict) -> Dict:
        """
        Formatiert eine Ethereum-Transaktion
        """
        return {
            "hash": tx["hash"].hex(),
            "from_address": tx["from"],
            "to_address": tx["to"],
            "value": Web3.from_wei(tx["value"], "ether"),
            "gas_price": Web3.from_wei(tx["gasPrice"], "gwei"),
            "timestamp": tx.get("timestamp", datetime.now().timestamp()),
            "currency": "ETH"
        }

    def _format_sol_transaction(self, tx: Dict) -> Dict:
        """
        Formatiert eine Solana-Transaktion
        """
        return {
            "hash": tx["transaction"]["signatures"][0],
            "from_address": tx["transaction"]["message"]["accountKeys"][0],
            "to_address": tx["transaction"]["message"]["accountKeys"][1],
            "amount": tx["meta"]["postBalances"][1] - tx["meta"]["preBalances"][1],
            "fee": tx["meta"]["fee"],
            "timestamp": tx["blockTime"],
            "currency": "SOL"
        }

    @lru_cache(maxsize=1000)
    async def get_cached_transaction(self, tx_hash: str):
        """
        Cache für einzelne Transaktionen
        """
        try:
            source_currency = self._detect_transaction_currency(tx_hash)
            if not source_currency:
                raise TransactionNotFoundError(f"Währung für Transaktion {tx_hash} nicht erkennbar")
               
            if source_currency == "ETH":
                return await self._get_ethereum_transactions(tx_hash, 1)[0]
            elif source_currency == "SOL":
                return await self._get_solana_transactions(tx_hash, 1)[0]
            else:
                raise ValueError("Nur Ethereum und Solana Transaktionen werden unterstützt")
        except Exception as e:
            logger.error(f"Error caching transaction {tx_hash}: {e}")
            raise APIError(f"API-Fehler beim Abrufen der gecachten Transaktion: {str(e)}")
