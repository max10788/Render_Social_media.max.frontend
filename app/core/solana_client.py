# app/core/solana_client.py
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import aiohttp
from app.core.crypto_tracker import BlockchainClient, Transaction, Currency
from app.core.exceptions import APIError, TransactionNotFoundError
from app.core.config import settings

logger = logging.getLogger(__name__)

class SolanaClient(BlockchainClient):
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.rpc_url = settings.SOLANA_RPC_URL
        self.request_id = 1

    async def get_transaction(self, tx_hash: str, max_retries: int = 3) -> Optional[Transaction]:
        """Get a Solana transaction by signature."""
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
        try:
            if isinstance(address, dict) and 'pubkey' in address:
                address = address['pubkey']
            address = str(address)

            payload = {
                "jsonrpc": "2.0",
                "id": self.request_id,
                "method": "getSignaturesForAddress",
                "params": [
                    address,
                    {"limit": 5}
                ]
            }
            self.request_id += 1

            async with self.session.post(self.rpc_url, json=payload) as response:
                if response.status != 200:
                    logger.warning(f"RPC Error {response.status}: {await response.text()}")
                    return None
                data = await response.json()
                if not data.get("result"):
                    logger.info(f"No signatures found for address {address}")
                    return None

                signatures = data["result"]
                for sig_info in signatures:
                    if isinstance(sig_info, dict) and sig_info.get("err") is None:
                        next_tx = await self.get_transaction(sig_info["signature"])
                        if next_tx:
                            return next_tx
        except Exception as e:
            logger.error(f"Error finding next Solana transaction for {address}: {e}")
        return None

    def detect_currency(self, tx_hash: str) -> bool:
        return self._is_valid_signature(tx_hash)

    def _is_valid_signature(self, signature: str) -> bool:
        try:
            import base58
            decoded = base58.b58decode(signature)
            return len(decoded) == 64
        except Exception:
            return False

    def _format_solana_transaction(self, tx_data: Dict, tx_hash: str) -> Transaction:
        try:
            # Handle verschiedene Antwortformate
            if isinstance(tx_data, str):
                tx_data = json.loads(tx_data)

            message = tx_data.get("transaction", {}).get("message", {})
            meta = tx_data.get("meta", {}) or {}
            account_keys = message.get("accountKeys", [])
            if len(account_keys) < 2:
                raise ValueError("Insufficient account keys in transaction")

            from_addr = account_keys[0]
            to_addr = account_keys[1]

            pre_balances = meta.get("preBalances", [0, 0])
            post_balances = meta.get("postBalances", [0, 0])
            amount = abs((post_balances[1] - pre_balances[1]) / 1e9)

            fee = meta.get("fee", 0) / 1e9
            block_time = tx_data.get("blockTime", int(datetime.now().timestamp()))

            return Transaction(
                hash=tx_hash,
                from_address=from_addr,
                to_address=to_addr,
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
