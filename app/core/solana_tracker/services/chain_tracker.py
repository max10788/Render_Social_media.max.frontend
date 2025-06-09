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

    def validate_transaction_signature(self, signature: str) -> bool:
        """
        Validate Solana transaction signature format.
        
        Args:
            signature: Transaction signature to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Sollte base58 decodierbar sein
            decoded = base58.b58decode(signature)
            # Solana Signaturen sind 64 Bytes lang
            return len(decoded) == 64
        except Exception as e:
            logger.error(f"Invalid signature format: {e}")
            return False
        
    async def track_chain(
        self,
        start_tx_hash: str,
        max_depth: int = 10,
        amount: Optional[Decimal] = None
    ) -> List[TrackedTransaction]:
        """
        Track a chain of transactions starting from a given hash.
        """
        if not self.validate_transaction_signature(start_tx_hash):
            logger.error(f"Invalid transaction signature format: {start_tx_hash}")
            return []
            
        visited_signatures: Set[str] = set()
        result_transactions: List[TrackedTransaction] = []
        processing_queue: List[Tuple[str, Optional[Decimal]]] = [(start_tx_hash, amount)]
        
        logger.info(f"Starting chain tracking from {start_tx_hash}")
        
        try:
            async with self.solana_repo as repo:  # Use context manager for proper cleanup
                initial_tx = await self._get_transaction_safe(start_tx_hash)
                
                if not initial_tx:
                    logger.error(f"Initial transaction {start_tx_hash} not found")
                    response = await repo.get_raw_transaction(start_tx_hash)
                    logger.debug(f"RPC Response: {json.dumps(response, indent=2)}")
                    return []
                    
                while processing_queue and len(result_transactions) < max_depth:
                    current_tx_hash, remaining_amount = processing_queue.pop(0)
                    
                    if current_tx_hash in visited_signatures:
                        continue
                        
                    visited_signatures.add(current_tx_hash)
                    tracked_tx = await self._process_transaction(current_tx_hash, remaining_amount)
                    
                    if tracked_tx:
                        result_transactions.append(tracked_tx)
                        next_txs = await self._find_next_transactions(tracked_tx, remaining_amount)
                        
                        for tx_hash, amount in next_txs:
                            if tx_hash not in visited_signatures:
                                processing_queue.append((tx_hash, amount))
                                
            return result_transactions
                
        except Exception as e:
            logger.error(f"Error tracking transaction chain: {e}")
            return []
        
    @retry_with_exponential_backoff(max_retries=3)
    async def _get_transaction_safe(
        self,
        tx_hash: str
    ) -> Optional[TransactionDetail]:
        """Safely fetch transaction with retries."""
        try:
            tx_detail = await self.solana_repo.get_transaction(tx_hash)
            if tx_detail:
                logger.debug(f"Successfully retrieved transaction {tx_hash}")
                return tx_detail
            logger.warning(f"Transaction {tx_hash} not found")
            return None
        except Exception as e:
            logger.error(f"Error fetching transaction {tx_hash}: {e}")
            return None

    async def _process_transaction(
        self,
        tx_hash: str,
        amount: Optional[Decimal]
    ) -> Optional[TrackedTransaction]:
        """Process a single transaction in the chain."""
        tx_detail = await self._get_transaction_safe(tx_hash)
        if not tx_detail:
            return None
            
        try:
            # Extract transfer information
            transfers = self._extract_transfers(tx_detail)
            if not transfers:
                return None
                
            # Filter by amount if specified
            if amount is not None:
                transfers = [t for t in transfers if abs(t["amount"] - amount) <= self.min_amount]
                
            if not transfers:
                return None
                
            # Create tracked transaction from largest transfer
            largest_transfer = max(transfers, key=lambda t: t["amount"])
            return TrackedTransaction(
                tx_hash=tx_hash,
                from_wallet=largest_transfer["from"],
                to_wallet=largest_transfer["to"],
                amount=largest_transfer["amount"],
                timestamp=tx_detail.transaction.timestamp.isoformat(),
                value_in_target_currency=None  # Would be set by exchange rate service
            )
            
        except Exception as e:
            logger.error(f"Error processing transaction {tx_hash}: {e}")
            return None

    def _extract_transfers(
        self,
        tx_detail: TransactionDetail
    ) -> List[Dict]:
        """Extract transfer information from transaction."""
        transfers = []
        
        try:
            # Extract SOL transfers
            for transfer in tx_detail.transfers:
                if transfer.amount >= self.min_amount:  # Remove .amount access
                    transfers.append({
                        "from": transfer.from_address,
                        "to": transfer.to_address,
                        "amount": transfer.amount
                    })
            
            return transfers
            
        except Exception as e:
            logger.error(f"Error extracting transfers: {e}")
            return []
            
    async def _find_next_transactions(
        self,
        tracked_tx: TrackedTransaction,
        amount: Optional[Decimal]
    ) -> List[Tuple[str, Optional[Decimal]]]:
        """Find next transactions in the chain."""
        try:
            signatures = await self.solana_repo.get_transactions_for_address(
                address=tracked_tx.to_wallet,
                limit=5  # Limit to recent transactions
            )
            
            next_txs = []
            for tx in signatures.transactions:
                # Skip if amount doesn't match (with tolerance)
                if amount is not None:
                    transfers = self._extract_transfers(tx)
                    matching_transfers = [
                        t for t in transfers
                        if abs(t["amount"] - amount) <= self.min_amount
                    ]
                    if not matching_transfers:
                        continue
                
                next_txs.append((tx.transaction.tx_hash, amount))
                
            return next_txs
            
        except Exception as e:
            logger.error(f"Error finding next transactions: {e}")
            return []
