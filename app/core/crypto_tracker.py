from typing import Dict, List, Optional
import logging
from datetime import datetime
#from functools import lru_cache # Remove the cache
import json
import re
from web3 import Web3
from solana.rpc.api import Client as SolanaClient
from solana.rpc.types import TxRpcRequestConfig, Signature
import aiohttp
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
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

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
        
        # Solana: Base58-String, variable Länge
        if re.match(r"^[1-9A-HJ-NP-Za-km-z]{43,90}$", tx_hash):
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
            logger.info(f"Erkannte Währung für {start_tx_hash}: {source_currency}")
            
            # Hole Transaktionen basierend auf der Währung
            transactions = await self._get_transactions(
                start_tx_hash,
                source_currency,
                num_transactions
            )
            logger.info(f"Gefundene Transaktionen: {len(transactions)}")
            
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
                "transactions_count": len(converted_transactions),
                "tracking_timestamp": int(datetime.now().timestamp())
            }
            
        except Exception as e:
            logger.error(f"Fehler beim Tracking von {start_tx_hash}: {e}")
            if "not found" in str(e).lower():
                raise TransactionNotFoundError(f"Transaktion {start_tx_hash} nicht gefunden")
            raise APIError(f"API-Fehler: {str(e)}")

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
        """Holt Ethereum-Transaktionen"""
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                # Versuche zuerst aus dem Cache zu laden
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    # Wenn nicht im Cache, hole von der Blockchain
                    raw_tx = self.eth_client.eth.get_transaction(current_tx_hash)
                    tx = self._format_eth_transaction(raw_tx)
                    logger.debug(f"Neue ETH-Transaktion gefunden: {tx['hash']}")
                
                transactions.append(tx)
                
                # Suche nach der nächsten verknüpften Transaktion
                next_tx = await self._find_next_eth_transaction(tx["to_address"])
                if not next_tx:
                    logger.debug(f"Keine weitere ETH-Transaktion gefunden nach {tx['hash']}")
                    break
                    
                current_tx_hash = next_tx["hash"]
            
            return transactions
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Ethereum-Transaktionen: {e}")
            raise

    async def _get_solana_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        """Holt Solana-Transaktionen"""
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                # Convert tx_hash to the appropriate type if required
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    # If not cached, fetch from blockchain
                    try:
                        signature = Signature(current_tx_hash) # Convert to Signature object
                        response = await self.sol_client.get_transaction(signature)
                        if response["result"]:
                            tx = self._format_sol_transaction(response["result"])
                            logger.debug(f"Neue SOL-Transaktion gefunden: {tx['hash']}")
                        else:
                            raise TransactionNotFoundError(f"Solana-Transaktion nicht gefunden: {current_tx_hash}")
                    except Exception as e:
                        logger.error(f"Error getting solana transaction: {e}")
                        raise
                
                transactions.append(tx)
                
                # Find the next linked transaction
                next_tx = await self._find_next_sol_transaction(tx["to_address"])
                if not next_tx:
                    logger.debug(f"Keine weitere SOL-Transaktion gefunden nach {tx['hash']}")
                    break
                    
                current_tx_hash = next_tx["hash"]
            
            return transactions
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Solana-Transaktionen: {e}")
            raise

    async def _find_next_eth_transaction(self, address: str) -> Optional[Dict]:
        """Findet die nächste Ethereum-Transaktion für eine Adresse"""
        try:
            tx_count = self.eth_client.eth.get_transaction_count(address)
            if tx_count > 0:
                latest_tx = self.eth_client.eth.get_transaction_by_block_number_and_index(
                    self.eth_client.eth.block_number, 
                    tx_count - 1
                )
                return self._format_eth_transaction(latest_tx)
        except Exception as e:
            logger.error(f"Fehler beim Suchen der nächsten ETH-Transaktion: {e}")
        return None

    async def _find_next_eth_transaction(self, address: str) -> Optional[Dict]:
        """Findet die nächste Ethereum-Transaktion für eine Adresse"""
        try:
            tx_count = self.eth_client.eth.get_transaction_count(address)
            if tx_count > 0:
                latest_tx = self.eth_client.eth.get_transaction_by_block_number_and_index(
                    self.eth_client.eth.block_number, 
                    tx_count - 1
                )
                return self._format_eth_transaction(latest_tx)
        except Exception as e:
            logger.error(f"Fehler beim Suchen der nächsten ETH-Transaktion: {e}")
        return None
    
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
            "timestamp": tx.get("timestamp", int(datetime.now().timestamp())),
            "currency": "ETH",
            "direction": "out"
        }

    def _format_sol_transaction(self, tx: Dict) -> Dict:
        """
        Formatiert eine Solana-Transaktion
        """
        return {
            "hash": tx["transaction"]["signatures"][0],
            "from_address": tx["transaction"]["message"]["accountKeys"][0],
            "to_address": tx["transaction"]["message"]["accountKeys"][1],
            "amount": float(tx["meta"]["postBalances"][1] - tx["meta"]["preBalances"][1]) / 1e9,
            "fee": float(tx["meta"]["fee"]) / 1e9,
            "timestamp": tx["blockTime"],
            "currency": "SOL",
            "direction": "out"
        }

#    @lru_cache(maxsize=1000) # Remove the cache
    async def get_cached_transaction(self, tx_hash: str):
        """Cache für einzelne Transaktionen"""
        try:
            source_currency = self._detect_transaction_currency(tx_hash)
            if source_currency == "ETH":
                transactions = await self._get_ethereum_transactions(tx_hash, 1)
                return transactions[0]
            elif source_currency == "SOL":
                transactions = await self._get_solana_transactions(tx_hash, 1)
                return transactions[0]
            else:
                raise ValueError("Nur Ethereum und Solana Transaktionen werden unterstützt")
        except Exception as e:
            logger.error(f"Error caching transaction {tx_hash}: {e}")
            return None
    
    async def _convert_transaction_values(
        self,
        transactions: List[Dict],
        source_currency: str,
        target_currency: str
    ) -> List[Dict]:
        """Konvertiert Transaktionswerte in die Zielwährung"""
        try:
            if source_currency == target_currency:
                return transactions
                
            rate = await self._get_exchange_rate(source_currency, target_currency)
            logger.info(f"Wechselkurs {source_currency} -> {target_currency}: {rate}")
            
            for tx in transactions:
                if "value" in tx:
                    tx["value_converted"] = tx["value"] * rate
                if "amount" in tx:
                    tx["amount_converted"] = tx["amount"] * rate
                if "fee" in tx:
                    tx["fee_converted"] = tx["fee"] * rate
                    
            return transactions
            
        except Exception as e:
            logger.error(f"Fehler bei der Währungsumrechnung: {e}")
            raise
        except Exception as e:
            logger.error(f"Fehler bei der Währungsumrechnung: {e}")
            raise
