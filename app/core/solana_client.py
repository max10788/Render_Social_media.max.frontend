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

# Versuche, das Solana SDK zu laden
try:
    from solana.rpc.api import Client as SolanaRpcClient
    from solders.signature import Signature
    from solana.rpc.types import GetTransactionResp
    SOLANA_SDK_AVAILABLE = True
except ImportError:
    logger.warning("solana/rpc/types/solders not found – using fallback logic")
    SOLANA_SDK_AVAILABLE = False

# Deine Module
from app.core.crypto_tracker import BlockchainClient, Transaction, Currency
from app.core.exceptions import APIError, TransactionNotFoundError
from app.core.config import settings

logger = logging.getLogger(__name__)

class SolanaClient(BlockchainClient):
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.rpc_url = settings.SOLANA_RPC_URL
        self.request_id = 1

        # Falls solana SDK verfügbar ist, nutze es zusätzlich
        self.sdk_client = SolanaRpcClient(self.rpc_url) if SOLANA_SDK_AVAILABLE else None

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
        """Holt eine Solana-Transaktion per Signature mit fallback auf HTTP."""
        for attempt in range(max_retries + 1):
            try:
                # Prüfe zuerst das SDK
                if SOLANA_SDK_AVAILABLE:
                    try:
                        signature = Signature.from_string(tx_hash)
                        response: GetTransactionResp = self.sdk_client.get_transaction(signature, encoding="jsonParsed")
                        if response.value is not None:
                            return self._format_solana_transaction(response.to_json(), tx_hash)
                    except Exception as sdk_error:
                        logger.warning(f"SDK transaction fetch failed: {sdk_error}")

                # Fallback: Nutze direkte RPC-Anfrage
                response = await self._make_rpc_call(
                    "getTransaction",
                    [tx_hash, {"encoding": "jsonParsed"}]
                )

                if not response or not isinstance(response, dict):
                    logger.warning(f"Invalid RPC response format for {tx_hash}")
                    if attempt < max_retries:
                        wait_time = 2 ** attempt
                        logger.info(f"Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    return None

                return self._format_solana_transaction(response, tx_hash)

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
