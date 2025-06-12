from typing import List, Set, Dict, Optional, Tuple
from datetime import datetime
import logging
import asyncio
from decimal import Decimal
import base58
import json

from app.core.solana_tracker.models.transaction import TrackedTransaction, TransactionDetail
from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.utils.retry_utils import retry_with_exponential_backoff

logger = logging.getLogger(__name__)

class ChainTracker:
    """Service for tracking chains of related transactions."""
    
    def __init__(
        self,
        solana_repository: SolanaRepository,
        min_amount: Decimal = Decimal("0.000001")
    ):
        self.solana_repo = solana_repository
        self.min_amount = min_amount
        logger.info("ChainTracker initialized with min_amount=%s", min_amount)

    def validate_transaction_signature(self, signature: str) -> bool:
        try:
            decoded = base58.b58decode(signature)
            valid = len(decoded) == 64
            logger.debug("Signature validation for '%s': %s", signature, valid)
            return valid
        except Exception as e:
            logger.error("Invalid signature format for '%s': %s", signature, e)
            return False
        
    async def track_chain(
        self,
        start_tx_hash: str,
        max_depth: int = 10,
        amount: Optional[Decimal] = None
    ) -> List[TrackedTransaction]:
        logger.info("Begin tracking chain from %s (max_depth=%d, amount=%s)", start_tx_hash, max_depth, amount)
        if not self.validate_transaction_signature(start_tx_hash):
            logger.error("Invalid transaction signature format: %s", start_tx_hash)
            return []
            
        visited_signatures: Set[str] = set()
        result_transactions: List[TrackedTransaction] = []
        processing_queue: List[Tuple[str, Optional[Decimal]]] = [(start_tx_hash, amount)]
        
        try:
            async with self.solana_repo as repo:
                initial_tx = await self._get_transaction_safe(start_tx_hash)
                if not initial_tx:
                    logger.error("Initial transaction %s not found", start_tx_hash)
                    response = await repo.get_raw_transaction(start_tx_hash)
                    logger.debug("RPC Response for %s: %s", start_tx_hash, json.dumps(response, indent=2)[:1500])
                    return []
                
                while processing_queue and len(result_transactions) < max_depth:
                    current_tx_hash, remaining_amount = processing_queue.pop(0)
                    logger.debug("Processing tx_hash=%s, remaining_amount=%s", current_tx_hash, remaining_amount)
                    if current_tx_hash in visited_signatures:
                        logger.debug("Already visited tx_hash=%s, skipping", current_tx_hash)
                        continue
                    visited_signatures.add(current_tx_hash)
                    tracked_tx = await self._process_transaction(current_tx_hash, remaining_amount)
                    if tracked_tx:
                        logger.info("Tracked transaction: %s", tracked_tx)
                        result_transactions.append(tracked_tx)
                        next_txs = await self._find_next_transactions(tracked_tx, remaining_amount)
                        logger.debug("Found %d next transactions for tx_hash=%s", len(next_txs), current_tx_hash)
                        for tx_hash, amount in next_txs:
                            if tx_hash not in visited_signatures:
                                logger.debug("Queueing next tx_hash=%s", tx_hash)
                                processing_queue.append((tx_hash, amount))
                    else:
                        logger.warning("No valid tracked_tx found for %s", current_tx_hash)
            logger.info("Chain tracking finished. Found %d transactions.", len(result_transactions))
            return result_transactions
        except Exception as e:
            logger.error("Error tracking transaction chain from %s: %s", start_tx_hash, e, exc_info=True)
            return []
        
    @retry_with_exponential_backoff(max_retries=3)
    async def _get_transaction_safe(
        self,
        tx_hash: str
    ) -> Optional[TransactionDetail]:
        logger.debug("Fetching transaction safely for %s", tx_hash)
        try:
            tx_detail = await self.solana_repo.get_transaction(tx_hash)
            if tx_detail:
                logger.debug("Successfully retrieved transaction %s", tx_hash)
                return tx_detail
            logger.warning("Transaction %s not found", tx_hash)
            return None
        except Exception as e:
            logger.error("Error fetching transaction %s: %s", tx_hash, e, exc_info=True)
            return None

    async def _process_transaction(
        self,
        tx_hash: str,
        amount: Optional[Decimal]
    ) -> Optional[TrackedTransaction]:
        logger.debug("Processing transaction %s with amount filter %s", tx_hash, amount)
        tx_detail = await self._get_transaction_safe(tx_hash)
        if not tx_detail:
            logger.warning("No tx_detail returned for %s", tx_hash)
            return None
            
        try:
            transfers = self._extract_transfers(tx_detail)
            logger.debug("Extracted %d transfers from %s", len(transfers), tx_hash)
            if not transfers:
                logger.info("No valid transfers found in transaction %s", tx_hash)
                return None
                
            if amount is not None:
                transfers = [t for t in transfers if abs(t["amount"] - amount) <= self.min_amount]
                logger.debug("After amount filter: %d transfers remain", len(transfers))
            if not transfers:
                logger.info("No transfers remaining after filtering by amount for %s", tx_hash)
                return None
                
            largest_transfer = max(transfers, key=lambda t: t["amount"])
            logger.info("Largest transfer in %s: %s", tx_hash, largest_transfer)
            return TrackedTransaction(
                tx_hash=tx_hash,
                from_wallet=largest_transfer["from"],
                to_wallet=largest_transfer["to"],
                amount=largest_transfer["amount"],
                timestamp=tx_detail.transaction.timestamp.isoformat(),
                value_in_target_currency=None
            )
        except Exception as e:
            logger.error("Error processing transaction %s: %s", tx_hash, e, exc_info=True)
            return None

    def _extract_transfers(
        self,
        tx_detail: TransactionDetail
    ) -> List[Dict]:
        transfers = []
        try:
            for transfer in tx_detail.transfers:
                logger.debug("Inspecting transfer: %s", transfer)
                if transfer.amount >= self.min_amount:
                    transfers.append({
                        "from": transfer.from_address,
                        "to": transfer.to_address,
                        "amount": transfer.amount
                    })
            logger.debug("Transfer extraction complete: %d valid transfers", len(transfers))
            return transfers
        except Exception as e:
            logger.error("Error extracting transfers: %s", e, exc_info=True)
            return []
            
    async def _find_next_transactions(
        self,
        tracked_tx: TrackedTransaction,
        amount: Optional[Decimal]
    ) -> List[Tuple[str, Optional[Decimal]]]:
        logger.debug("Looking for next transactions from wallet %s", tracked_tx.to_wallet)
        try:
            signatures = await self.solana_repo.get_transactions_for_address(
                address=tracked_tx.to_wallet,
                limit=5
            )
            next_txs = []
            for tx in signatures.transactions:
                if amount is not None:
                    transfers = self._extract_transfers(tx)
                    matching_transfers = [
                        t for t in transfers
                        if abs(t["amount"] - amount) <= self.min_amount
                    ]
                    if not matching_transfers:
                        logger.debug("Skipping tx %s: no matching transfer for amount %s", tx.transaction.tx_hash, amount)
                        continue
                logger.debug("Next transaction candidate: %s", tx.transaction.tx_hash)
                next_txs.append((tx.transaction.tx_hash, amount))
            logger.info("Found %d next transactions for wallet %s", len(next_txs), tracked_tx.to_wallet)
            return next_txs
        except Exception as e:
            logger.error("Error finding next transactions from %s: %s", tracked_tx.to_wallet, e, exc_info=True)
            return []
