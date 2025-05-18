from typing import Dict, List, Optional
import logging
from datetime import datetime
import json
import re
from web3 import Web3
from solana.rpc.api import Client as SolanaClient
import aiohttp
import base58
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
        self.cache_ttl = 3600  # 1 hour cache time
        
        # Initialize blockchain clients
        self.eth_client = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
        self.sol_client = SolanaClient(settings.SOLANA_RPC_URL)
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close(

    # Main public method
    async def track_transaction_chain(
        self,
        start_tx_hash: str,
        target_currency: str,
        num_transactions: int = 10
    ) -> Dict:
        """
        Tracks a chain of transactions.
        
        Args:
            start_tx_hash: Initial transaction hash
            target_currency: Target currency for conversion
            num_transactions: Maximum number of transactions to track
            
        Returns:
            Dict containing transaction data
        """
        try:
            source_currency = self._detect_transaction_currency(start_tx_hash)
            logger.info(f"Detected currency for {start_tx_hash}: {source_currency}")
            
            transactions = await self._get_transactions(
                start_tx_hash,
                source_currency,
                num_transactions
            )
            logger.info(f"Found transactions: {len(transactions)}")
            
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
            logger.error(f"Error tracking {start_tx_hash}: {e}")
            if "not found" in str(e).lower():
                raise TransactionNotFoundError(f"Transaction {start_tx_hash} not found")
            raise APIError(f"API Error: {str(e)}")

    # Currency detection and validation methods
    def _detect_transaction_currency(self, tx_hash: str) -> str:
        """Detects currency based on transaction hash format."""
        # Ethereum: 0x followed by 64 hex characters
        if re.match(r"^0x[a-fA-F0-9]{64}$", tx_hash):
            return "ETH"
        
        # Solana: Base58 string, variable length
        if re.match(r"^[1-9A-HJ-NP-Za-km-z]{43,90}$", tx_hash):
            return "SOL"
        
        raise ValueError(
            f"Unsupported transaction hash format: {tx_hash}. "
            "Only Ethereum (0x + 64 hex chars) and Solana (Base58 string) supported."
        )

    def _validate_solana_signature(self, signature: str) -> bool:
        """
        Validates if a string is a valid Solana transaction signature.
        """
        try:
            if not isinstance(signature, str):
                return False
            
            # Check if it matches the Solana signature pattern
            return bool(re.match(r"^[1-9A-HJ-NP-Za-km-z]{87,88}$", signature))
                
        except Exception as e:
            logger.error(f"Error validating Solana signature: {e}")
            return False
    async def _get_exchange_rate(self, source_currency: str, target_currency: str) -> float:
        """
        Gets the current exchange rate between two currencies using CoinGecko API.
        
        Args:
            source_currency: The source currency (e.g., "ETH", "SOL")
            target_currency: The target currency (e.g., "ETH", "SOL", "USD")
            
        Returns:
            float: The exchange rate
            
        Raises:
            APIError: If there's an error fetching the exchange rate
        """
        try:
            # Map our currency codes to CoinGecko IDs
            currency_map = {
                "ETH": "ethereum",
                "SOL": "solana",
                "BTC": "bitcoin",
                "USD": "usd"
            }
            
            source = currency_map.get(source_currency.upper())
            target = currency_map.get(target_currency.upper())
            
            if not source or not target:
                raise ValueError(f"Unsupported currency pair: {source_currency}-{target_currency}")
            
            # Construct CoinGecko API URL
            url = f"https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": source,
                "vs_currencies": target.lower(),
                "x_cg_demo_api_key": self.api_keys.get("coingecko", "")
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    raise APIError(f"CoinGecko API error: {response.status}")
                
                data = await response.json()
                if not data or source not in data:
                    raise APIError("Invalid response from CoinGecko API")
                
                rate = data[source].get(target.lower())
                if rate is None:
                    raise APIError(f"Exchange rate not found for {source_currency}-{target_currency}")
                
                return float(rate)
                
        except Exception as e:
            logger.error(f"Error fetching exchange rate: {e}")
            raise APIError(f"Failed to get exchange rate: {str(e)}")
    
    # Transaction fetching methods
    async def _get_transactions(
        self,
        start_tx_hash: str,
        currency: str,
        num_transactions: int
    ) -> List[Dict]:
        """Gets transactions from the respective blockchain."""
        if currency == "ETH":
            return await self._get_ethereum_transactions(start_tx_hash, num_transactions)
        elif currency == "SOL":
            return await self._get_solana_transactions(start_tx_hash, num_transactions)
        else:
            raise ValueError(f"Unsupported currency: {currency}")

    async def _get_ethereum_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        """Fetches Ethereum transactions."""
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    raw_tx = self.eth_client.eth.get_transaction(current_tx_hash)
                    tx = self._format_eth_transaction(raw_tx)
                    logger.debug(f"New ETH transaction found: {tx['hash']}")
                
                transactions.append(tx)
                
                next_tx = await self._find_next_eth_transaction(tx["to_address"])
                if not next_tx:
                    logger.debug(f"No further ETH transaction found after {tx['hash']}")
                    break
                    
                current_tx_hash = next_tx["hash"]
            
            return transactions
            
        except Exception as e:
            logger.error(f"Error fetching Ethereum transactions: {e}")
            raise

    
    async def _get_solana_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        """Fetches Solana transactions."""
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                if not self._validate_solana_signature(current_tx_hash):
                    raise ValueError(f"Invalid Solana signature format: {current_tx_hash}")
                
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    response = await self.sol_client.get_transaction(current_tx_hash)
                    if response["result"]:
                        tx = self._format_sol_transaction(response["result"])
                        logger.debug(f"New SOL transaction found: {tx['hash']}")
                    else:
                        raise TransactionNotFoundError(f"Solana transaction not found: {current_tx_hash}")
                
                transactions.append(tx)
                
                next_tx = await self._find_next_sol_transaction(tx["to_address"])
                if not next_tx:
                    logger.debug(f"No further SOL transaction found after {tx['hash']}")
                    break
                    
                current_tx_hash = next_tx["hash"]
            
            return transactions
            
        except Exception as e:
            logger.error(f"Error fetching Solana transactions: {e}")
            raise

    # Transaction finding methods
    async def _find_next_eth_transaction(self, address: str) -> Optional[Dict]:
        """Finds the next Ethereum transaction for an address."""
        try:
            tx_count = self.eth_client.eth.get_transaction_count(address)
            if tx_count > 0:
                latest_tx = self.eth_client.eth.get_transaction_by_block_number_and_index(
                    self.eth_client.eth.block_number, 
                    tx_count - 1
                )
                return self._format_eth_transaction(latest_tx)
        except Exception as e:
            logger.error(f"Error finding next ETH transaction: {e}")
        return None

    async def _find_next_sol_transaction(self, address: str) -> Optional[Dict]:
        """
        Finds the next Solana transaction for an address.
        
        Args:
            address: The Solana address to check
            
        Returns:
            Optional[Dict]: The next transaction if found, None otherwise
        """
        try:
            # Get recent transactions for the address
            response = await self.sol_client.get_signatures_for_address(
                address,
                limit=1  # We only need the most recent one
            )
            
            if response["result"]:
                # Get the full transaction details
                signature = response["result"][0]["signature"]
                if self._validate_solana_signature(signature):
                    tx_response = await self.sol_client.get_transaction(signature)
                    if tx_response["result"]:
                        return self._format_sol_transaction(tx_response["result"])
            
            return None
        except Exception as e:
            logger.error(f"Error finding next SOL transaction: {e}")
            return None

    # Transaction formatting methods
    def _format_eth_transaction(self, tx: Dict) -> Dict:
        """Formats an Ethereum transaction."""
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
        """Formats a Solana transaction."""
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

    # Caching and conversion methods
    async def get_cached_transaction(self, tx_hash: str) -> Optional[Dict]:
        """Caches individual transactions."""
        try:
            source_currency = self._detect_transaction_currency(tx_hash)
            if source_currency == "ETH":
                transactions = await self._get_ethereum_transactions(tx_hash, 1)
                return transactions[0]
            elif source_currency == "SOL":
                transactions = await self._get_solana_transactions(tx_hash, 1)
                return transactions[0]
            else:
                raise ValueError("Only Ethereum and Solana transactions supported")
        except Exception as e:
            logger.error(f"Error caching transaction {tx_hash}: {e}")
            return None

    async def _convert_transaction_values(
        self,
        transactions: List[Dict],
        source_currency: str,
        target_currency: str
    ) -> List[Dict]:
        """Converts transaction values to target currency."""
        try:
            if source_currency == target_currency:
                return transactions
                
            rate = await self._get_exchange_rate(source_currency, target_currency)
            logger.info(f"Exchange rate {source_currency} -> {target_currency}: {rate}")
            
            for tx in transactions:
                if "value" in tx:
                    tx["value_converted"] = tx["value"] * rate
                if "amount" in tx:
                    tx["amount_converted"] = tx["amount"] * rate
                if "fee" in tx:
                    tx["fee_converted"] = tx["fee"] * rate
                    
            return transactions
            
        except Exception as e:
            logger.error(f"Error converting currency values: {e}")
            raise
