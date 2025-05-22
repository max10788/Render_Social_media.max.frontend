# app/core/ethereum_client.py
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import aiohttp
from web3 import Web3
from .crypto_tracker import BlockchainClient, Transaction, Currency
from ..exceptions import APIError, TransactionNotFoundError

logger = logging.getLogger(__name__)

class EthereumClient(BlockchainClient):
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.web3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))

    async def get_transaction(self, tx_hash: str) -> Optional[Transaction]:
        try:
            tx = self.web3.eth.get_transaction(tx_hash)
            receipt = self.web3.eth.get_transaction_receipt(tx_hash)
            return self._format_ethereum_transaction(tx, receipt)
        except Exception as e:
            logger.error(f"Error fetching Ethereum transaction {tx_hash}: {e}")
            return None

    async def find_next_transaction(self, address: str) -> Optional[Transaction]:
        try:
            count = self.web3.eth.get_transaction_count(address)
            if count > 0:
                latest_tx = self.web3.eth.get_transaction_by_block_number_and_index('latest', count - 1)
                return self._format_ethereum_transaction(latest_tx)
            return None
        except Exception as e:
            logger.error(f"Error finding next Ethereum transaction for {address}: {e}")
            return None

    def detect_currency(self, tx_hash: str) -> bool:
        import re
        return bool(re.fullmatch(r"^0x[a-fA-F0-9]{64}$", tx_hash))

    def _format_ethereum_transaction(self, tx: Dict, receipt: Optional[Dict] = None) -> Transaction:
        tx_hash = tx.get("hash").hex()
        from_addr = tx.get("from")
        to_addr = tx.get("to") or "unknown"
        value_wei = tx.get("value", 0)
        value_eth = Web3.from_wei(value_wei, "ether")
        gas_used = receipt.get("gasUsed", 21000) if receipt else 21000
        gas_price = tx.get("gasPrice", 0)
        fee = Web3.from_wei(gas_price * gas_used, "ether")
        timestamp = int(datetime.now().timestamp())
        return Transaction(
            hash=tx_hash,
            from_address=from_addr,
            to_address=to_addr,
            amount=float(value_eth),
            fee=float(fee),
            timestamp=timestamp,
            currency=Currency.ETH,
            direction="out"
        )
