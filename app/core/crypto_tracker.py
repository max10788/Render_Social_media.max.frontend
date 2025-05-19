# crypto_tracker.py

from typing import Dict, List, Optional
import logging
import re
from datetime import datetime
from solana.rpc.api import Client as SolanaClient
from solders.signature import Signature
from web3 import Web3
import aiohttp
from app.core.config import settings
from app.core.exceptions import APIError, TransactionNotFoundError

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
        self.eth_client = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
        self.sol_client = SolanaClient(settings.SOLANA_RPC_URL)
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def track_transaction_chain(
        self,
        start_tx_hash: str,
        target_currency: str,
        num_transactions: int = 10
    ) -> Dict:
        try:
            source_currency = self._detect_transaction_currency(start_tx_hash)
            logger.info(f"Detected currency for {start_tx_hash}: {source_currency}")

            transactions = await self._get_transactions(
                start_tx_hash, source_currency, num_transactions
            )
            if not transactions:
                raise TransactionNotFoundError(
                    f"No transactions found starting from {start_tx_hash}"
                )

            converted_transactions = await self._convert_transaction_values(
                transactions, source_currency, target_currency
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
            logger.error(f"Error tracking {start_tx_hash}: {e}", exc_info=True)
            raise


    def _detect_transaction_currency(self, tx_hash: str) -> str:
        """Detect the currency type based on transaction hash format"""
        # Update the Solana check to handle 88-character transactions too
        if re.match(r"^0x[a-fA-F0-9]{64}$", tx_hash):
            return "ETH"
        # Modified pattern to match both 43-90 char signatures AND 88-char signatures
        if re.match(r"^[1-9A-HJ-NP-Za-km-z]{43,90}$", tx_hash):
            return "SOL"
        raise ValueError("Unsupported transaction hash format")

    async def _get_transactions(
        self,
        start_tx_hash: str,
        currency: str,
        num_transactions: int
    ) -> List[Dict]:
        if currency == "ETH":
            return await self._get_ethereum_transactions(start_tx_hash, num_transactions)
        elif currency == "SOL":
            return await self._get_solana_transactions(start_tx_hash, num_transactions)
        else:
            raise ValueError(f"Unsupported currency: {currency}")

    async def _get_ethereum_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        try:
            transactions = []
            current_tx_hash = tx_hash
            for _ in range(num_transactions):
                tx = await self.get_cached_transaction(current_tx_hash)
                if not tx:
                    raw_tx = self.eth_client.eth.get_transaction(current_tx_hash)
                    tx = self._format_eth_transaction(raw_tx)
                transactions.append(tx)
                next_tx = await self._find_next_eth_transaction(tx["to_address"])
                if not next_tx:
                    break
                current_tx_hash = next_tx["hash"]
            return transactions
        except Exception as e:
            logger.error(f"Error fetching Ethereum transactions: {e}", exc_info=True)
            raise

    async def _get_solana_transactions(self, tx_hash: str, num_transactions: int) -> List[Dict]:
        try:
            transactions = []
            current_tx_hash = tx_hash
            processed_hashes = set()
    
            for _ in range(num_transactions):
                if current_tx_hash in processed_hashes:
                    logger.warning("Detected loop in transaction chain. Breaking loop.")
                    break
                processed_hashes.add(current_tx_hash)
    
                # Handle 88-character Solana transaction signatures
                try:
                    if len(current_tx_hash) == 88:
                        # For newer format signatures (88 chars), we need to decode from base58
                        # and create the signature differently
                        try:
                            # Try to import base58
                            import base58
                        except ImportError:
                            logger.warning("base58 package not found, installing...")
                            import subprocess
                            import sys
                            subprocess.check_call([sys.executable, "-m", "pip", "install", "base58"])
                            import base58
                        
                        # Decode the base58 signature and create a valid Signature object
                        decoded_bytes = base58.b58decode(current_tx_hash)
                        
                        # Use from_bytes if available, otherwise try other methods
                        if hasattr(Signature, 'from_bytes'):
                            signature = Signature.from_bytes(decoded_bytes)
                        else:
                            # Alternative approach if from_bytes is not available
                            # Convert to a hex string of appropriate length
                            hex_string = decoded_bytes.hex()[:64]
                            signature = Signature.from_string(hex_string)
                            
                        response = await self.sol_client.get_transaction(
                            tx_sig=signature,
                            encoding="jsonParsed"
                        )
                    else:
                        # For standard length signatures
                        response = await self.sol_client.get_transaction(
                            tx_sig=Signature(current_tx_hash),
                            encoding="jsonParsed"
                        )
                except Exception as sig_error:
                    logger.error(f"Error handling signature {current_tx_hash}: {sig_error}")
                    
                    # Try an alternative approach - use the REST API directly if available
                    if self.session is None:
                        self.session = aiohttp.ClientSession()
                    
                    try:
                        # Direct API call to bypass Signature object issues
                        solana_api_url = self.sol_client.url
                        payload = {
                            "jsonrpc": "2.0",
                            "id": 1,
                            "method": "getTransaction",
                            "params": [
                                current_tx_hash,
                                {"encoding": "jsonParsed"}
                            ]
                        }
                        
                        async with self.session.post(solana_api_url, json=payload) as resp:
                            response = await resp.json()
                    except Exception as alt_error:
                        logger.error(f"Alternative approach failed: {alt_error}")
                        raise TransactionNotFoundError(f"Failed to process transaction {current_tx_hash}")
    
                if not response or "result" not in response:
                    raise TransactionNotFoundError(f"No valid response for transaction: {current_tx_hash}")
    
                result = response["result"]
                tx = self._format_sol_transaction(result)
                transactions.append(tx)
    
                next_tx = await self._find_next_sol_transaction(tx["to_address"])
                if not next_tx:
                    break
                current_tx_hash = next_tx["hash"]
    
            return transactions
        except Exception as e:
            logger.error(f"Error fetching Solana transactions: {str(e)}", exc_info=True)
            raise APIError(f"Failed to fetch Solana transactions: {str(e)}")

    async def _find_next_sol_transaction(self, address: str) -> Optional[Dict]:
        try:
            response = await self.sol_client.get_signatures_for_address(
                account=address,
                limit=1,
                commitment="confirmed"
            )
            if not response or "result" not in response:
                return None
    
            signatures = response["result"]
            if not signatures:
                return None
    
            signature_str = signatures[0]["signature"]
            
            # Handle 88-character Solana transaction signatures
            try:
                if len(signature_str) == 88:
                    # For newer format signatures (88 chars), we need to decode from base58
                    try:
                        import base58
                    except ImportError:
                        logger.warning("base58 package not found, installing...")
                        import subprocess
                        import sys
                        subprocess.check_call([sys.executable, "-m", "pip", "install", "base58"])
                        import base58
                    
                    # Decode the base58 signature and create a valid Signature object
                    decoded_bytes = base58.b58decode(signature_str)
                    
                    # Use from_bytes if available, otherwise try other methods
                    if hasattr(Signature, 'from_bytes'):
                        signature = Signature.from_bytes(decoded_bytes)
                    else:
                        # Alternative approach if from_bytes is not available
                        hex_string = decoded_bytes.hex()[:64]
                        signature = Signature.from_string(hex_string)
                        
                    tx_response = await self.sol_client.get_transaction(
                        tx_sig=signature,
                        encoding="jsonParsed"
                    )
                else:
                    # For standard length signatures
                    tx_response = await self.sol_client.get_transaction(
                        tx_sig=Signature(signature_str),
                        encoding="jsonParsed"
                    )
            except Exception as sig_error:
                logger.error(f"Error handling signature in _find_next_sol_transaction: {sig_error}")
                
                # Try an alternative approach - use the REST API directly
                if self.session is None:
                    self.session = aiohttp.ClientSession()
                
                try:
                    # Direct API call to bypass Signature object issues
                    solana_api_url = self.sol_client.url
                    payload = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getTransaction",
                        "params": [
                            signature_str,
                            {"encoding": "jsonParsed"}
                        ]
                    }
                    
                    async with self.session.post(solana_api_url, json=payload) as resp:
                        tx_response = await resp.json()
                except Exception as alt_error:
                    logger.error(f"Alternative approach failed in _find_next_sol_transaction: {alt_error}")
                    return None
    
            if not tx_response or "result" not in tx_response:
                return None
    
            return self._format_sol_transaction(tx_response["result"])
    
        except Exception as e:
            logger.error(f"Error finding next SOL transaction: {str(e)}", exc_info=True)
            return None

    async def _find_next_eth_transaction(self, address: str) -> Optional[Dict]:
        try:
            tx_count = self.eth_client.eth.get_transaction_count(address)
            if tx_count > 0:
                latest_tx = self.eth_client.eth.get_transaction_by_block_number_and_index(
                    self.eth_client.eth.block_number, tx_count - 1
                )
                return self._format_eth_transaction(latest_tx)
        except Exception as e:
            logger.error(f"Error finding next ETH transaction: {e}", exc_info=True)
        return None

    def _format_eth_transaction(self, tx: Dict) -> Dict:
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
        try:
            if not tx or "transaction" not in tx or "meta" not in tx:
                raise ValueError("Invalid transaction data structure")
            transaction = tx["transaction"]
            meta = tx["meta"]
            if not transaction.get("signatures"):
                raise ValueError("No signatures found in transaction")
            tx_hash = transaction["signatures"][0]
            message = transaction.get("message", {})
            account_keys = message.get("accountKeys", [])
            if len(account_keys) < 2:
                raise ValueError("Insufficient account keys in transaction")
            pre_balances = meta.get("preBalances", [0, 0])
            post_balances = meta.get("postBalances", [0, 0])
            if len(pre_balances) < 2 or len(post_balances) < 2:
                raise ValueError("Invalid balance data in transaction")
            amount = (post_balances[1] - pre_balances[1]) / 1e9
            return {
                "hash": tx_hash,
                "from_address": account_keys[0],
                "to_address": account_keys[1],
                "amount": abs(amount),
                "fee": float(meta.get("fee", 0)) / 1e9,
                "timestamp": tx.get("blockTime", int(datetime.now().timestamp())),
                "currency": "SOL",
                "direction": "out"
            }
        except Exception as e:
            logger.error(f"Error formatting Solana transaction: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to format Solana transaction: {str(e)}")

    async def get_cached_transaction(self, tx_hash: str) -> Optional[Dict]:
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
            logger.error(f"Error caching transaction {tx_hash}: {e}", exc_info=True)
            return None

    async def _convert_transaction_values(
        self,
        transactions: List[Dict],
        source_currency: str,
        target_currency: str
    ) -> List[Dict]:
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
            logger.error(f"Error converting currency values: {e}", exc_info=True)
            raise

    async def _get_exchange_rate(self, source_currency: str, target_currency: str) -> float:
        try:
            if source_currency == target_currency:
                return 1.0
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
            url = "https://api.coingecko.com/api/v3/simple/price "
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
            logger.error(f"Error fetching exchange rate: {e}", exc_info=True)
            if source_currency.upper() == target_currency.upper():
                return 1.0
            raise APIError(f"Failed to get exchange rate: {str(e)}")
