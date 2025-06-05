from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from decimal import Decimal
import asyncio
from functools import lru_cache

from models.transaction import (
    TransactionDetail, 
    TrackedTransaction, 
    SolanaTransaction,
    TransactionBatch
)
from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.repositories.cache_repository import CacheRepository
from app.core.solana_tracker.services.chain_tracker import ChainTracker
from app.core.solana_tracker.services.scenario_detector import ScenarioDetector
from app.core.solana_tracker.utils.retry_utils import retry_with_exponential_backoff

logger = logging.getLogger(__name__)

class TransactionService:
    """Core business logic for transaction processing and analysis."""
    
    def __init__(
        self,
        solana_repository: SolanaRepository,
        cache_repository: Optional[CacheRepository] = None,
        chain_tracker: Optional[ChainTracker] = None,
        scenario_detector: Optional[ScenarioDetector] = None
    ):
        self.solana_repo = solana_repository
        self.cache = cache_repository
        self.chain_tracker = chain_tracker or ChainTracker(solana_repository)
        self.scenario_detector = scenario_detector or ScenarioDetector()
        
    async def get_transaction_details(
        self,
        tx_hash: str,
        use_cache: bool = True
    ) -> Optional[TransactionDetail]:
        """
        Fetch detailed transaction information with caching.
        
        Args:
            tx_hash: Transaction hash to fetch
            use_cache: Whether to use cache (default: True)
            
        Returns:
            Optional[TransactionDetail]: Transaction details if found
        """
        cache_key = f"tx:{tx_hash}"
        
        # Try cache first
        if use_cache and self.cache:
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"Cache hit for transaction {tx_hash}")
                return TransactionDetail(**cached_data)
        
        # Fetch from blockchain
        try:
            tx_detail = await self.solana_repo.get_transaction(tx_hash)
            
            if tx_detail and self.cache:
                await self.cache.set(cache_key, tx_detail.dict(), ttl=3600)
                
            return tx_detail
            
        except Exception as e:
            logger.error(f"Error fetching transaction {tx_hash}: {e}")
            raise

    @retry_with_exponential_backoff(max_retries=3)
    async def analyze_transaction_chain(
        self,
        start_tx_hash: str,
        max_depth: int = 10,
        target_currency: str = "USD",
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Analyze a chain of transactions starting from a given hash.
        
        Args:
            start_tx_hash: Starting transaction hash
            max_depth: Maximum depth to track
            target_currency: Target currency for conversion
            amount: Amount to track (optional)
            
        Returns:
            Dict containing analysis results
        """
        try:
            # Track transaction chain
            tracked_txs = await self.chain_tracker.track_chain(
                start_tx_hash,
                max_depth=max_depth,
                amount=amount
            )
            
            if not tracked_txs:
                logger.warning(f"No transaction chain found for {start_tx_hash}")
                return {
                    "status": "no_chain_found",
                    "transactions": [],
                    "scenarios": []
                }
            
            # Detect scenarios
            scenarios = await self.scenario_detector.detect_scenarios(tracked_txs)
            
            # Calculate statistics
            stats = await self._calculate_chain_statistics(tracked_txs)
            
            return {
                "status": "success",
                "transactions": [tx.dict() for tx in tracked_txs],
                "scenarios": scenarios,
                "statistics": stats,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing transaction chain: {e}")
            raise

    async def _calculate_chain_statistics(
        self,
        transactions: List[TrackedTransaction]
    ) -> Dict[str, Any]:
        """Calculate statistics for a chain of transactions."""
        if not transactions:
            return {}
            
        try:
            total_amount = sum(tx.amount for tx in transactions)
            unique_addresses = set()
            for tx in transactions:
                unique_addresses.add(tx.from_wallet)
                unique_addresses.add(tx.to_wallet)
                
            time_diffs = []
            for i in range(1, len(transactions)):
                t1 = datetime.fromisoformat(transactions[i-1].timestamp)
                t2 = datetime.fromisoformat(transactions[i].timestamp)
                time_diffs.append((t2 - t1).total_seconds())
                
            return {
                "total_transactions": len(transactions),
                "total_amount": float(total_amount),
                "unique_addresses": len(unique_addresses),
                "average_time_between_tx": (
                    sum(time_diffs) / len(time_diffs) if time_diffs else 0
                ),
                "first_tx_timestamp": transactions[0].timestamp,
                "last_tx_timestamp": transactions[-1].timestamp
            }
            
        except Exception as e:
            logger.error(f"Error calculating chain statistics: {e}")
            return {}

    async def get_wallet_transactions(
        self,
        address: str,
        limit: int = 100,
        before: Optional[str] = None
    ) -> TransactionBatch:
        """
        Fetch transactions for a specific wallet address.
        
        Args:
            address: Wallet address
            limit: Maximum number of transactions
            before: Transaction signature to fetch transactions before
            
        Returns:
            TransactionBatch: Batch of transactions
        """
        try:
            return await self.solana_repo.get_transactions_for_address(
                address=address,
                before=before,
                limit=limit
            )
        except Exception as e:
            logger.error(f"Error fetching wallet transactions: {e}")
            raise

    @lru_cache(maxsize=100)
    def _get_program_name(self, program_id: str) -> str:
        """Get known program name from ID (cached)."""
        # This would be expanded with a complete list of known programs
        KNOWN_PROGRAMS = {
            "TokenkegQfeZyiNwAJbNbGKPE8839dhk8qSu5v3LwRK4": "Token Program",
            "11111111111111111111111111111111": "System Program",
        }
        return KNOWN_PROGRAMS.get(program_id, "Unknown Program")
