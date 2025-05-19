from typing import Dict, List, Optional
import logging
import re
from datetime import datetime
from solana.rpc.api import Client as SolanaClient
from solders.signature import Signature
from web3 import Web3
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

            transactions = await self._get_transactions(start_tx_hash, source_currency, num_transactions)

            if not transactions:
                raise TransactionNotFoundError(f"No transactions found starting from {start_tx_hash}")

            logger.info(f"Found transactions: {len(transactions)}")

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
            if isinstance(e, (TransactionNotFoundError, APIError)):
                raise
            else:
                raise APIError(f"Error tracking transactions: {str(e)}")

    def _detect_transaction_currency(self, tx_hash: str) -> str:
        if re.match(r"^0x[a-fA-F0-9]{64}$", tx_hash):
            return "ETH"
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
                    logger.debug(f"New ETH transaction found: {tx['hash']}")
                transactions.append(tx)
                next_tx = await self._find_next_eth_transaction(tx["to_address"])
                if not next_tx:
                    logger.debug(f"No further ETH transaction found after {tx['hash']}")
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
                    logger.warning(f"Detected loop in transaction chain. Breaking loop.")
                    break
                processed_hashes.add(current_tx_hash)

                if not re.match(r"^[1-9A-HJ-NP-Za-km-z]{87,88}$", current_tx_hash):
                    raise ValueError(f"Invalid Solana transaction signature format: {current_tx_hash}")

                response = await self.sol_client.get_transaction(
                    tx_sig=Signature(current_tx_hash),
                    encoding="jsonParsed"
                )

                if not response or "result" not in response:
                    logger.error(f"Invalid response format from Solana API: {response}")
                    raise TransactionNotFoundError(f"No valid response for transaction: {current_tx_hash}")

                result = response["result"]
                if not result:
                    raise TransactionNotFoundError(f"Transaction not found: {current_tx_hash}")

                tx = self._format_sol_transaction(result)
                logger.debug(f"New SOL transaction found: {tx['hash']}")
                transactions.append(tx)

                next_tx = await self._find_next_sol_transaction(tx["to_address"])
                if not next_tx:
                    logger.debug(f"No further SOL transaction found after {tx['hash']}")
                    break
                current_tx_hash = next_tx["hash"]

            return transactions
        except Exception as e:
            logger.error(f"Error fetching Solana transactions: {str(e)}", exc_info=True)
            raise APIError(f"Failed to fetch Solana transactions: {str(e)}")

    async def _find_next_sol_transaction(self, address: str) -> Optional[Dict]:
        """Find the next Solana transaction for an address."""
        try:
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

            signature_str = signatures[0]["signature"]
            signature = Signature(signature_str)

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
