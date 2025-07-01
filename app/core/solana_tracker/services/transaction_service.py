from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from decimal import Decimal
import asyncio
from functools import lru_cache

from app.core.solana_tracker.models.base_models import TransactionDetail, TransactionBatch
from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository
from app.core.solana_tracker.repositories.cache_repository import CacheRepository
from app.core.solana_tracker.services.chain_tracker import ChainTracker
from app.core.solana_tracker.services.scenario_detector import ScenarioDetector
from app.core.solana_tracker.utils.retry_utils import retry_with_exponential_backoff

logger = logging.getLogger(__name__)

class TransactionService:
    def __init__(
        self,
        solana_repository: EnhancedSolanaRepository,
        cache_repository: Optional[CacheRepository] = None,
        chain_tracker: Optional[ChainTracker] = None,
        scenario_detector: Optional[ScenarioDetector] = None
    ):
        self.solana_repo = solana_repository
        self.cache = cache_repository
        self.chain_tracker = chain_tracker or ChainTracker(solana_repository)
        self.scenario_detector = scenario_detector or ScenarioDetector()
        logger.info("TransactionService initialized")
        
    async def get_transaction_details(
        self,
        tx_hash: str,
        use_cache: bool = True
    ) -> Optional[TransactionDetail]:
        cache_key = f"tx:{tx_hash}"
        logger.debug("Fetching transaction details for %s (use_cache=%s)", tx_hash, use_cache)
    
        if use_cache and self.cache:
            try:
                cached_data = await self.cache.get(cache_key)
                if cached_data:
                    logger.info("Cache hit for transaction %s", tx_hash)
                    return TransactionDetail(**cached_data)
                else:
                    logger.debug("Cache miss for transaction %s", tx_hash)
            except Exception as e:
                logger.error("Cache lookup error for key %s: %s", cache_key, e)
    
        try:
            tx_detail = await self.solana_repo.get_transaction(tx_hash)
            if tx_detail:
                logger.info("Fetched transaction %s from blockchain", tx_hash)
                if self.cache:
                    try:
                        await self.cache.set(cache_key, tx_detail.dict(), ttl=3600)
                        logger.debug("Transaction %s cached successfully", tx_hash)
                    except Exception as cache_e:
                        logger.error("Error caching transaction %s: %s", tx_hash, cache_e)
            else:
                logger.warning("No transaction detail found for %s on blockchain", tx_hash)
                return None
            return tx_detail
        except Exception as e:
            logger.error("Error fetching transaction %s: %s", tx_hash, e, exc_info=True)
            raise
            
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

    
    @retry_with_exponential_backoff(max_retries=3)
    async def analyze_transaction_chain(
        self,
        start_tx_hash: str,
        max_depth: int = 10,
        target_currency: str = "USD",
        amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        logger.info("Analyzing transaction chain from %s (max_depth=%d, currency=%s, amount=%s)",
                    start_tx_hash, max_depth, target_currency, amount)
        try:
            tracked_txs = await self.chain_tracker.track_chain(
                start_tx_hash,
                max_depth=max_depth,
                amount=amount
            )
            logger.debug("track_chain returned %d transactions", len(tracked_txs))
    
            if not tracked_txs:
                logger.warning("No transaction chain found for %s", start_tx_hash)
                return {
                    "status": "no_chain_found",
                    "transactions": [],
                    "scenarios": []
                }
    
            for tx in tracked_txs:
                if isinstance(tx.timestamp, datetime):
                    tx.timestamp = tx.timestamp.isoformat()
    
            scenarios = await self.scenario_detector.detect_scenarios(tracked_txs)
            logger.info("Scenario detection complete. Found %d scenarios.",
                       len(scenarios) if scenarios else 0)
    
            stats = await self._calculate_chain_statistics(tracked_txs)
            logger.debug("Chain statistics calculated: %s", stats)
    
            return {
                "status": "success",
                "transactions": tracked_txs,
                "scenarios": scenarios if scenarios else [],
                "statistics": stats,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
    
        except Exception as e:
            logger.error("Error analyzing transaction chain from %s: %s",
                        start_tx_hash, e, exc_info=True)
            raise
            
    async def _calculate_chain_statistics(
        self,
        transactions: List[TrackedTransaction]
    ) -> Dict[str, Any]:
        """Calculate statistics for a chain of transactions."""
        logger.debug("Calculating statistics for %d transactions", len(transactions))
        if not transactions:
            logger.warning("No transactions provided for statistics calculation")
            return {}
        try:
            total_amount = sum(tx.amount for tx in transactions)
            unique_addresses = set()
            for tx in transactions:
                unique_addresses.add(tx.from_wallet)
                if tx.to_wallet:
                    unique_addresses.add(tx.to_wallet)
            time_diffs = []
            for i in range(1, len(transactions)):
                t1 = transactions[i-1].timestamp
                t2 = transactions[i].timestamp
                if isinstance(t1, str):
                    t1 = datetime.fromisoformat(t1.replace('Z', '+00:00'))
                if isinstance(t2, str):
                    t2 = datetime.fromisoformat(t2.replace('Z', '+00:00'))
                time_diffs.append((t2 - t1).total_seconds())
            
            first_timestamp = transactions[0].timestamp
            last_timestamp = transactions[-1].timestamp
            if isinstance(first_timestamp, datetime):
                first_timestamp = first_timestamp.isoformat()
            if isinstance(last_timestamp, datetime):
                last_timestamp = last_timestamp.isoformat()
                
            return {
                "total_transactions": len(transactions),
                "total_amount": float(total_amount),
                "unique_addresses": len(unique_addresses),
                "average_time_between_tx": (
                    sum(time_diffs) / len(time_diffs) if time_diffs else 0
                ),
                "first_tx_timestamp": first_timestamp,
                "last_tx_timestamp": last_timestamp
            }
        except Exception as e:
            logger.error("Error calculating chain statistics: %s", e, exc_info=True)
            return {}

    async def get_wallet_transactions(
        self,
        address: str,
        limit: int = 100,
        before: Optional[str] = None
    ) -> TransactionBatch:
        """Fetch transactions for a specific wallet address."""
        logger.info("Fetching wallet transactions for %s (limit=%d, before=%s)", 
                   address, limit, before)
        try:
            batch = await self.solana_repo.get_transactions_for_address(
                address=address,
                before=before,
                limit=limit
            )
            logger.debug("Fetched %d transactions for wallet %s", 
                        len(batch.transactions), address)
            return batch
        except Exception as e:
            logger.error("Error fetching wallet transactions for %s: %s", 
                        address, e, exc_info=True)
            raise

    @lru_cache(maxsize=100)
    def _get_program_name(self, program_id: str) -> str:
        """Get known program name from ID (cached)."""
        KNOWN_PROGRAMS = {
            "TokenkegQfeZyiNwAJbNbGKPE8839dhk8qSu5v3LwRK4": "Token Program",
            "11111111111111111111111111111111": "System Program",
        }
        result = KNOWN_PROGRAMS.get(program_id, "Unknown Program")
        logger.debug("Program name lookup for %s: %s", program_id, result)
        return result
