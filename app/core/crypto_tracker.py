# crypto_tracker.py

from typing import Dict, List, Optional
import logging
import re
import json  # Added missing json import
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
        if re.fullmatch(r"^0x[a-fA-F0-9]{64}$", tx_hash):
            return "ETH"
        elif re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{43,88}", tx_hash):
            return "SOL"
        else:
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
    
                # Import base58 with auto-install fallback
                try:
                    import base58
                except ImportError:
                    logger.warning("base58 package not found, installing...")
                    import subprocess
                    import sys
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "base58"])
                    import base58
    
                signature = None
                response = None
    
                # Versuche, die Transaktion abzurufen
                try:
                    decoded_bytes = base58.b58decode(current_tx_hash)
                    if len(decoded_bytes) == 64:
                        signature = Signature.from_bytes(decoded_bytes)
                    else:
                        logger.warning(f"Decoded signature has invalid length: {len(decoded_bytes)} bytes")
                        raise ValueError("Invalid signature length after decoding")
                except Exception as decode_error:
                    logger.warning(f"Base58 decode failed or signature invalid: {decode_error}")
                    signature = Signature(current_tx_hash)
    
                try:
                    tx_response = self.sol_client.get_transaction(
                        tx_sig=signature,
                        encoding="jsonParsed"
                    )
    
                    if hasattr(tx_response, 'value') and hasattr(tx_response.value, 'to_json'):
                        response = {"result": tx_response.value.to_json()}
                    elif hasattr(tx_response, 'to_json'):
                        response = {"result": tx_response.to_json()}
                    else:
                        response = tx_response
    
                except Exception as sig_error:
                    logger.warning(f"Signature error with {current_tx_hash}, trying fallback RPC call")
    
                    # Fallback: direkter RPC-Aufruf über HTTP POST
                    if self.session is None:
                        self.session = aiohttp.ClientSession()
    
                    solana_api_url = settings.SOLANA_RPC_URL
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
    
                if not response or "result" not in response or not response["result"]:
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
        
    def is_valid_solana_tx_hash(self, tx_hash: str) -> bool:
        try:
            import base58
            decoded = base58.b58decode(tx_hash)
            return len(decoded) == 64  # Solana-Signaturen sind immer 64 Bytes
        except Exception:
            return False
    
    async def _find_next_sol_transaction(self, address: str) -> Optional[Dict]:
        try:
            # If address is a dict, extract the pubkey
            if isinstance(address, dict) and 'pubkey' in address:
                address = address['pubkey']
            
            # Convert address to string if it isn't already
            address = str(address)
        
            try:
                sig_response = self.sol_client.get_signatures_for_address(
                    account=address,
                    limit=1,
                    commitment="confirmed"
                )
                
                # Convert the response to a standard format
                if hasattr(sig_response, 'value') and hasattr(sig_response.value, 'to_json'):
                    # Handle object with value attribute
                    signatures_data = {"result": sig_response.value.to_json()}
                elif hasattr(sig_response, 'to_json'):
                    # Handle direct response object
                    signatures_data = {"result": sig_response.to_json()}
                else:
                    # It's already in dict format
                    signatures_data = sig_response
            except Exception as sig_error:
                logger.error(f"Error getting signatures for address {address}: {sig_error}")
                
                # Fallback to direct RPC
                try:
                    if self.session is None:
                        self.session = aiohttp.ClientSession()
                    
                    # Get the RPC URL from settings
                    solana_api_url = settings.SOLANA_RPC_URL
                    
                    payload = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getSignaturesForAddress",
                        "params": [
                            address,
                            {"limit": 1, "commitment": "confirmed"}
                        ]
                    }
                    
                    async with self.session.post(solana_api_url, json=payload) as resp:
                        signatures_data = await resp.json()
                except Exception as alt_error:
                    logger.error(f"Alternative approach failed for signatures: {alt_error}")
                    return None
            
            if not signatures_data or "result" not in signatures_data or not signatures_data["result"]:
                return None
    
            # Extract signature from response
            signatures = signatures_data["result"]
            if not signatures:
                return None
    
            # Get the signature string based on response format
            if isinstance(signatures[0], dict) and "signature" in signatures[0]:
                signature_str = signatures[0]["signature"]
            else:
                # Try to extract the signature from a different format
                signature_str = str(signatures[0])
                
            # Get the transaction data using the signature
            try:
                import base58
                
                # Process the signature
                if len(signature_str) == 88:
                    # For 88-character signatures, decode from base58
                    decoded_bytes = base58.b58decode(signature_str)
                    
                    # Create signature object
                    if hasattr(Signature, 'from_bytes'):
                        signature = Signature.from_bytes(decoded_bytes)
                    else:
                        # Alternative for older versions
                        hex_string = decoded_bytes.hex()[:64]
                        signature = Signature.from_string(hex_string)
                else:
                    signature = Signature(signature_str)
                    
                # Get transaction data
                tx_response = self.sol_client.get_transaction(
                    tx_sig=signature,
                    encoding="jsonParsed"
                )
                
                # Handle response format
                if hasattr(tx_response, 'value') and hasattr(tx_response.value, 'to_json'):
                    transaction_data = {"result": tx_response.value.to_json()}
                elif hasattr(tx_response, 'to_json'):
                    transaction_data = {"result": tx_response.to_json()}
                else:
                    transaction_data = tx_response
                    
            except Exception as tx_error:
                logger.error(f"Error getting transaction data: {tx_error}")
                
                # Fallback to direct RPC
                try:
                    if self.session is None:
                        self.session = aiohttp.ClientSession()
                    
                    # Get the RPC URL from settings
                    solana_api_url = settings.SOLANA_RPC_URL
                    
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
                        transaction_data = await resp.json()
                except Exception as alt_error:
                    logger.error(f"Alternative approach failed for transaction: {alt_error}")
                    return None
    
            if not transaction_data or "result" not in transaction_data or not transaction_data["result"]:
                return None
    
            return self._format_sol_transaction(transaction_data["result"])
    
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
            # Wenn tx ein String ist, versuche ihn zu parsen
            if isinstance(tx, str):
                try:
                    tx = json.loads(tx)
                except json.JSONDecodeError:
                    raise ValueError("Failed to parse transaction string as JSON")
    
            # Für neue solders Versionen, mit .value.to_json()
            if "result" in tx and isinstance(tx["result"], str):
                try:
                    tx = json.loads(tx["result"])
                except json.JSONDecodeError:
                    raise ValueError("Failed to parse result field as JSON")
    
            # Prüfe auf direkte Transaction-Daten
            if "transaction" in tx and "meta" in tx:
                transaction = tx["transaction"]
                meta = tx["meta"]
            elif "message" in tx and "signature" in tx:
                # Fallback für minimale Struktur (z.B. von getSignaturesForAddress)
                transaction = {
                    "message": tx,
                    "signatures": [tx.get("signature", "unknown")]
                }
                meta = {}
            elif "accountKeys" in tx:
                # Direktes Fallback: tx ist bereits der message-body
                transaction = {"message": tx}
                meta = {}
            else:
                raise ValueError("Unknown transaction structure received")
    
            # Extrahiere signifikante Werte
            tx_hash = transaction.get("signatures", ["unknown"])[0]
            message = transaction.get("message", {})
            account_keys = message.get("accountKeys", [])
            
            if len(account_keys) < 2:
                raise ValueError("Insufficient account keys in transaction")
    
            # Balances prüfen
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
            url = "https://api.coingecko.com/api/v3/simple/price"
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
