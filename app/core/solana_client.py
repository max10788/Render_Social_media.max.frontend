# app/core/solana_client.py

import asyncio
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

# Standard imports
import aiohttp
from base58 import b58decode  # pip install base58

import logging
logger = logging.getLogger(__name__)

# Try to load the Solana SDK
try:
    from solana.rpc.api import Client as SolanaRpcClient
    from solders.signature import Signature
    from solana.rpc.types import GetTransactionResp
    SOLANA_SDK_AVAILABLE = True
except ImportError:
    logger.warning("solana/rpc/types/solders not found – using fallback logic")
    SOLANA_SDK_AVAILABLE = False

# Your modules
from app.core.crypto_tracker import BlockchainClient, Transaction, Currency
from app.core.exceptions import APIError, TransactionNotFoundError
from app.core.config import settings

logger = logging.getLogger(__name__)

class SolanaClient(BlockchainClient):
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.rpc_url = settings.SOLANA_RPC_URL
        self.request_id = 1

        # Use SDK client if available
        self.sdk_client = SolanaRpcClient(self.rpc_url) if SOLANA_SDK_AVAILABLE else None

    async def _make_rpc_call(self, method: str, params: list) -> Optional[Dict]:
        """Sends a JSON-RPC call to the Solana RPC server."""
        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params
        }
        self.request_id += 1

        try:
            async with self.session.post(
                self.rpc_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            ) as response:
                if response.status != 200:
                    logger.error(f"RPC Error {response.status}: {await response.text()}")
                    raise APIError(f"RPC server returned status {response.status}")
                
                data = await response.json()
                if "error" in data:
                    error_msg = data['error'].get('message', str(data['error']))
                    logger.error(f"RPC returned error: {error_msg}")
                    if "not found" in str(error_msg).lower():
                        raise TransactionNotFoundError(f"Transaction not found: {params}")
                    raise APIError(f"RPC error: {error_msg}")
                
                if "result" not in data:
                    raise APIError("Invalid RPC response format: missing 'result' field")
                    
                return data["result"]
                
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error during RPC call: {e}")
            raise APIError(f"HTTP error: {str(e)}")
        except (APIError, TransactionNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error during RPC call: {e}")
            raise APIError(f"Unexpected error: {str(e)}")

    async def get_transaction(self, tx_hash: str, max_retries: int = 3) -> Optional[Transaction]:
        """Fetches a Solana transaction by signature with fallback to HTTP."""
        # Validate signature format before making any calls
        if not self._is_valid_signature(tx_hash):
            logger.error(f"Invalid signature format: {tx_hash}")
            return None

        for attempt in range(max_retries):
            try:
                # Try SDK first
                if SOLANA_SDK_AVAILABLE:
                    try:
                        signature = Signature.from_string(tx_hash)
                        response: GetTransactionResp = self.sdk_client.get_transaction(signature, encoding="jsonParsed")
                        if response.value is not None:
                            return self._format_solana_transaction(response.to_json(), tx_hash)
                    except Exception as sdk_error:
                        logger.warning(f"SDK transaction fetch failed: {sdk_error}")

                # Fallback: Use direct RPC request
                response = await self._make_rpc_call(
                    "getTransaction",
                    [tx_hash, {"encoding": "jsonParsed"}]
                )

                if not response:
                    raise TransactionNotFoundError(f"Transaction not found: {tx_hash}")

                if not isinstance(response, dict):
                    raise APIError(f"Invalid response format for {tx_hash}")

                return self._format_solana_transaction(response, tx_hash)

            except TransactionNotFoundError:
                # Don't retry if transaction is definitely not found
                logger.warning(f"Transaction not found: {tx_hash}")
                return None
            except (APIError, Exception) as e:
                wait_time = min(2 ** attempt, 8)  # Cap maximum wait time at 8 seconds
                if attempt < max_retries - 1:
                    logger.info(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"All attempts failed for transaction {tx_hash}")
                    return None

        return None


    async def find_next_transaction(self, address: str, max_retries: int = 3) -> Optional[Transaction]:
        """Finde die nächste Transaktion eines Wallets."""
        try:
            if isinstance(address, dict) and 'pubkey' in address:
                address = address['pubkey']
            address = str(address)

            # Hole Signatures via RPC
            response = await self._make_rpc_call(
                "getSignaturesForAddress",
                [address, {"limit": 5, "commitment": "confirmed"}]
            )

            if not response or not response.get("result"):
                logger.info(f"No signatures found for address: {address}")
                return None

            signatures = response["result"]
            if not signatures:
                return None

            for sig_info in signatures:
                if isinstance(sig_info, dict) and "signature" in sig_info:
                    tx = await self.get_transaction(sig_info["signature"])
                    if tx:
                        return tx
            return None

        except Exception as e:
            logger.error(f"Error finding next transaction for {address}: {e}")
            return None

    def detect_currency(self, tx_hash: str) -> bool:
        return self._is_valid_signature(tx_hash)

    def _is_valid_signature(self, signature: str) -> bool:
        try:
            decoded = b58decode(signature)
            return len(decoded) == 64
        except Exception:
            return False

    def _format_solana_transaction(self, tx_data: Dict[str, Any], tx_hash: str) -> Transaction:
        """Formatiere Rohdaten aus dem RPC zu einer sauberen Transaktion."""
        try:
            # Handle verschiedene Antwortformate
            if isinstance(tx_data, str):
                tx_data = json.loads(tx_data)

            message = tx_data.get("transaction", {}).get("message", {})
            meta = tx_data.get("meta", {}) or {}

            account_keys = message.get("accountKeys", [])
            if len(account_keys) < 2:
                raise ValueError("Insufficient account keys in transaction")

            from_address = account_keys[0]
            to_address = account_keys[1]

            pre_balances = meta.get("preBalances", [0, 0])
            post_balances = meta.get("postBalances", [0, 0])
            amount = abs((post_balances[1] - pre_balances[1]) / 1e9)

            fee = meta.get("fee", 0) / 1e9
            block_time = tx_data.get("blockTime", int(datetime.now().timestamp()))

            return Transaction(
                hash=tx_hash,
                from_address=from_address,
                to_address=to_address,
                amount=amount,
                fee=fee,
                timestamp=block_time,
                currency=Currency.SOL,
                direction="out",
                block_number=tx_data.get("slot")
            )
        except Exception as e:
            logger.error(f"Error formatting Solana transaction: {e}")
            raise ValueError(f"Failed to format Solana transaction: {str(e)}")
