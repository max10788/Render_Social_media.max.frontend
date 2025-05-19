from typing import Dict, List, Optional
import logging
from datetime import datetime
import json
import re
from web3 import Web3
from solana.rpc.api import Client as SolanaClient
import aiohttp
from app.core.config import settings
from app.core.exceptions import CryptoTrackerError, APIError, TransactionNotFoundError

logger = logging.getLogger(__name__)

class CryptoTrackingService:
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        """Initialize the CryptoTrackingService."""
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

    # Context Manager Methods
    async def __aenter__(self):
        """Initialize aiohttp session when entering context."""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Close aiohttp session when exiting context."""
        if self.session:
            await self.session.close()

    # Main Public Method
    async def track_transaction_chain(
        self,
        start_tx_hash: str,
        target_currency: str,
        num_transactions: int = 10
    ) -> Dict:
        """Track a chain of cryptocurrency transactions."""
        try:
            # Detect source currency from transaction hash
            source_currency = self._detect_transaction_currency(start_tx_hash)
            logger.info(f"Detected currency for {start_tx_hash}: {source_currency}")
            
            # Get transactions based on currency
            transactions = await self._get_transactions(
                start_tx_hash,
                source_currency,
                num_transactions
            )
            
            if not transactions:
                raise TransactionNotFoundError(f"No transactions found starting from {start_tx_hash}")
                
            logger.info(f"Found transactions: {len(transactions)}")
            
            # Convert values to target currency
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
            if isinstance(e, TransactionNotFoundError):
                raise
            elif isinstance(e, APIError):
                raise
            else:
                raise APIError(f"Error tracking transactions: {str(e)}")

    # Currency Detection and Validation Methods
    def _detect_transaction_currency(self, tx_hash: str) -> str:
        """Detect currency based on transaction hash format."""
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

    # Transaction Fetching Methods
    async def _get_transactions(
        self,
        start_tx_hash: str,
        currency: str,
        num_transactions: int
    ) -> List[Dict]:
        """Get transactions from the respective blockchain."""
        if currency == "ETH":
            return await self._get_ethereum_transactions(start_tx_hash, num_transactions)
        elif currency == "SOL":
            return await self._get_solana_transactions(start_tx_hash, num_transactions)
        else:
            raise ValueError(f"Unsupported currency: {currency}")

    async def _get_ethereum_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        """Fetch Ethereum transactions."""
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
        """Fetch Solana transactions."""
        try:
            transactions = []
            current_tx_hash = tx_hash
            
            for _ in range(num_transactions):
                try:
                    # Validate the transaction hash format
                    if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{87,88}$", current_tx_hash):
                        raise ValueError(f"Invalid Solana transaction signature format: {current_tx_hash}")
                    
                    # Get transaction from Solana
                    response = await self.sol_client.get_transaction(
                        tx_sig=current_tx_hash,
                        encoding="jsonParsed"  # Add explicit encoding
                    )
                    
                    if not response or "result" not in response:
                        logger.error(f"Invalid response format from Solana API: {response}")
                        raise TransactionNotFoundError(f"No valid response for transaction: {current_tx_hash}")
                    
                    result = response["result"]
                    if not result:
                        raise TransactionNotFoundError(f"Transaction not found: {current_tx_hash}")
                    
                    # Format and add the transaction
                    tx = self._format_sol_transaction(result)
                    logger.debug(f"New SOL transaction found: {tx['hash']}")
                    transactions.append(tx)
                    
                    # Find the next transaction
                    next_tx = await self._find_next_sol_transaction(tx["to_address"])
                    if not next_tx:
                        logger.debug(f"No further SOL transaction found after {tx['hash']}")
                        break
                        
                    current_tx_hash = next_tx["hash"]
                    
                except Exception as e:
                    logger.error(f"Error processing Solana transaction {current_tx_hash}: {str(e)}")
                    break
            
            return transactions
                
        except Exception as e:
            logger.error(f"Error fetching Solana transactions: {str(e)}")
            raise APIError(f"Failed to fetch Solana transactions: {str(e)}")

    # Transaction Finding Methods
    async def _find_next_eth_transaction(self, address: str) -> Optional[Dict]:
        """Find the next Ethereum transaction for an address."""
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
    """Find the next Solana transaction for an address."""
    try:
        # Get recent signatures for the address
        response = await self.sol_client.get_signatures_for_address(
            account=address,
            limit=1,
            commitment="confirmed"
        )
        
        if not response or "result" not in response:
            logger.error(f"Invalid response from get_signatures_for_address: {response}")
            return None
            
        signatures = response["result"]
        if not signatures:
            return None
            
        # Get the full transaction details
        signature = signatures[0]["signature"]
        tx_response = await self.sol_client.get_transaction(
            tx_sig=signature,
            encoding="jsonParsed"
        )
        
        if not tx_response or "result" not in tx_response:
            logger.error(f"Invalid response from get_transaction: {tx_response}")
            return None
            
        if tx_response["result"]:
            return self._format_sol_transaction(tx_response["result"])
        
        return None
        
    except Exception as e:
        logger.error(f"Error finding next SOL transaction: {str(e)}")
        return None

    # Transaction Formatting Methods
    def _format_eth_transaction(self, tx: Dict) -> Dict:
        """Format an Ethereum transaction."""
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
    """Format a Solana transaction."""
    try:
        if not tx or "transaction" not in tx or "meta" not in tx:
            raise ValueError("Invalid transaction data structure")
            
        transaction = tx["transaction"]
        meta = tx["meta"]
        
        if not transaction.get("signatures"):
            raise ValueError("No signatures found in transaction")
            
        # Get the first signature as the transaction hash
        tx_hash = transaction["signatures"][0]
        
        # Get the account keys
        message = transaction.get("message", {})
        account_keys = message.get("accountKeys", [])
        if len(account_keys) < 2:
            raise ValueError("Insufficient account keys in transaction")
            
        # Calculate the amount (difference in balances)
        pre_balances = meta.get("preBalances", [0, 0])
        post_balances = meta.get("postBalances", [0, 0])
        if len(pre_balances) < 2 or len(post_balances) < 2:
            raise ValueError("Invalid balance data in transaction")
            
        amount = (post_balances[1] - pre_balances[1]) / 1e9  # Convert lamports to SOL
        
        return {
            "hash": tx_hash,
            "from_address": account_keys[0],
            "to_address": account_keys[1],
            "amount": abs(amount),  # Use absolute value for consistent reporting
            "fee": float(meta.get("fee", 0)) / 1e9,  # Convert lamports to SOL
            "timestamp": tx.get("blockTime", int(datetime.now().timestamp())),
            "currency": "SOL",
            "direction": "out"
        }
    except Exception as e:
        logger.error(f"Error formatting Solana transaction: {str(e)}")
        raise ValueError(f"Failed to format Solana transaction: {str(e)}")

    # Caching and Conversion Methods
    async def get_cached_transaction(self, tx_hash: str) -> Optional[Dict]:
        """Cache for individual transactions."""
        try:
            source_currency = self._detect_transaction_currency(tx_hash)
            if source_currency == "ETH":
                transactions = await self._get_ethereum_transactions(tx_hash, 1)
                return transactions[0] if transactions else None
            elif source_currency == "SOL":
                transactions = await self._get_solana_transactions(tx_hash, 1)
                return transactions[0] if transactions else None
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
        """Convert transaction values to target currency."""
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

    async def _get_exchange_rate(self, source_currency: str, target_currency: str) -> float:
        """Get current exchange rate between two currencies using CoinGecko API."""
        try:
            if source_currency == target_currency:
                return 1.0

            # Map currency codes to CoinGecko IDs
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
            
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            url = f"https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": source,
                "vs_currencies": target.lower(),
                "x_cg_demo_api_key": self.api_keys.get("coingecko", "")
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"CoinGecko API error: Status {response.status}, Response: {error_text}")
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
            if source_currency.upper() == target_currency.upper():
                return 1.0
            raise APIError(f"Failed to get exchange rate: {str(e)}")
