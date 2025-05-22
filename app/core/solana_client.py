# app/core/solana_client.py

import asyncio  # Fehlender Import für Retry-Mechanismus
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import aiohttp
from .crypto_tracker_improved import BlockchainClient, Transaction, Currency
from app.core.exceptions import APIError, TransactionNotFoundError
from app.core.config import settings
import base58  # Wird in _is_valid_signature benötigt

logger = logging.getLogger(__name__)

class SolanaClient(BlockchainClient):
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.rpc_url = settings.SOLANA_RPC_URL
        self.request_id = 1

    async def _make_rpc_call(self, method: str, params: list) -> Optional[Dict]:
        """Sendet einen JSON-RPC-Aufruf an den Solana RPC-Server."""
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
                    return None
                data = await response.json()
                if "error" in data:
                    logger.error(f"RPC returned error: {data['error']}")
                    return None
                return data.get("result")
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error during RPC call: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during RPC call: {e}")
            return None

    async def get_transaction(self, tx_hash: str, max_retries: int = 3) -> Optional[Transaction]:
        """Get a Solana transaction by signature with retry mechanism."""
        for attempt in range(max_retries + 1):
            try:
                # Validate signature format
                if not self._is_valid_signature(tx_hash):
                    logger.error(f"Invalid Solana signature format: {tx_hash}")
                    return None
    
                # Make RPC call
                response = await self._make_rpc_call(
                    "getTransaction",
                    [tx_hash, {"encoding": "jsonParsed"}]
                )
    
                if not response or not response.get("result"):
                    logger.warning(f"Transaction not found: {tx_hash}")
                    if attempt < max_retries:
                        wait_time = 2 ** attempt
                        logger.info(f"Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    return None
    
                return self._format_solana_transaction(response["result"], tx_hash)
    
            except Exception as e:
                logger.error(f"Error fetching Solana transaction {tx_hash}: {e}")
                if attempt < max_retries:
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                return None
        return None

    async def find_next_transaction(self, address: str, max_retries: int = 3) -> Optional[Transaction]:
        """Find the next transaction from a given address."""
        try:
            # Clean address format
            if isinstance(address, dict) and 'pubkey' in address:
                address = address['pubkey']
            address = str(address)

            # Get signatures for the address
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

            # Try to get the first valid transaction
            for sig_info in signatures:
                if isinstance(sig_info, dict) and "signature" in sig_info:
                    signature = sig_info["signature"]
                    if sig_info.get("err") is not None:
                        continue
                    tx = await self.get_transaction(signature)
                    if tx:
                        return tx
            return None

        except Exception as e:
            logger.error(f"Error finding next Solana transaction for {address}: {e}")
            return None

    def detect_currency(self, tx_hash: str) -> bool:
        """Check if this transaction hash is a valid Solana signature."""
        return self._is_valid_signature(tx_hash)

    def _is_valid_signature(self, signature: str) -> bool:
        """Validate Solana signature format."""
        try:
            decoded = base58.b58decode(signature)
            return len(decoded) == 64
        except Exception:
            return False

    def _format_solana_transaction(self, tx_data: Dict[str, Any], tx_hash: str) -> Transaction:
        """Format raw Solana transaction data into our Transaction model."""
        try:
            # Handle different formats
            if isinstance(tx_data, str):
                tx_data = json.loads(tx_data)

            transaction = tx_data.get("transaction", {})
            meta = tx_data.get("meta", {}) or {}

            message = transaction.get("message", {})
            account_keys = message.get("accountKeys", [])
            if len(account_keys) < 2:
                raise ValueError("Insufficient account keys in transaction")

            from_address = account_keys[0]
            to_address = account_keys[1]

            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            amount = 0.0
            if len(pre_balances) >= 2 and len(post_balances) >= 2:
                balance_change = (post_balances[1] - pre_balances[1]) / 1e9
                amount = abs(balance_change)

            fee = meta.get("fee", 0) / 1e9
            block_time = tx_data.get("blockTime", int(datetime.now().timestamp()))
            slot = tx_data.get("slot")

            return Transaction(
                hash=tx_hash,
                from_address=from_address,
                to_address=to_address,
                amount=amount,
                fee=fee,
                timestamp=block_time,
                currency=Currency.SOL,
                direction="out",
                block_number=slot
            )

        except Exception as e:
            logger.error(f"Error formatting Solana transaction: {e}")
            raise ValueError(f"Failed to format Solana transaction: {str(e)}")
