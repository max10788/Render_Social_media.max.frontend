from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException
import logging
import asyncio
from functools import lru_cache

from app.core.blockchain.interfaces import BlockchainRepository
from app.core.models.transaction import TransactionDetail
from app.core.services.chain_tracker import ChainTracker
from app.core.services.scenario_detector import ScenarioDetector
from app.core.exceptions import TransactionNotFoundError
from app.core.utils.retry import enhanced_retry_with_backoff
from app.core.utils.rate_limit import RateLimiter

logger = logging.getLogger(__name__)

class TransactionService:
    def __init__(self, blockchain_repo: BlockchainRepository):
        self.blockchain_repo = blockchain_repo
        self.chain_tracker = ChainTracker()
        self.scenario_detector = ScenarioDetector()
        self.rate_limiter = RateLimiter(rate=10, capacity=20)
    
    @enhanced_retry_with_backoff(max_retries=3)
    async def get_transaction_safe(self, tx_hash: str) -> Optional[TransactionDetail]:
        """Sichere Methode zum Abrufen einer Transaktion mit Wiederholungslogik"""
        try:
            return await self.blockchain_repo.get_transaction(tx_hash)
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Transaktion {tx_hash}: {str(e)}")
            return None
    
    async def analyze_transaction_chain(self, start_tx_hash: str, max_depth: int = 10) -> Dict[str, Any]:
        """Analysiert eine Transaktionskette mit vollständiger Szenarienerkennung"""
        try:
            # Starte die Transaktionskette
            chain = await self.chain_tracker.track_chain(start_tx_hash, max_depth)
            
            # Analysiere die Kette auf Szenarien
            scenarios = self.scenario_detector.detect_scenarios(chain["transactions"])
            
            # Berechne Statistiken
            stats = await self._calculate_chain_statistics(chain["transactions"])
            
            return {
                "chain": chain,
                "scenarios": scenarios,
                "statistics": stats,
                "analysis_time": datetime.utcnow().isoformat()
            }
        except TransactionNotFoundError as e:
            raise HTTPException(status_code=404, detail={
                "error": "transaction_not_found",
                "message": str(e),
                "tx_hash": e.tx_hash
            })
        except Exception as e:
            logger.error(f"Fehler bei der Kettenanalyse: {str(e)}")
            raise HTTPException(status_code=500, detail={
                "error": "chain_analysis_failed",
                "message": str(e)
            })
    
    async def _calculate_chain_statistics(self, transactions: List[TransactionDetail]) -> Dict[str, Any]:
        """Berechnet Statistiken für eine Transaktionskette"""
        if not transactions:
            return {}
        
        total_amount = sum(tx.value for tx in transactions if tx.value)
        avg_amount = total_amount / len(transactions)
        
        return {
            "total_transactions": len(transactions),
            "total_value": float(total_amount),
            "average_value": float(avg_amount),
            "unique_wallets": len(set(tx.to_address for tx in transactions if tx.to_address)),
            "successful_transactions": sum(1 for tx in transactions if tx.status == "confirmed"),
            "failed_transactions": sum(1 for tx in transactions if tx.status == "failed")
        }
    
    @lru_cache(maxsize=128)
    async def get_cached_transaction(self, tx_hash: str) -> Optional[TransactionDetail]:
        """Holt eine Transaktion mit Caching"""
        return await self.get_transaction_safe(tx_hash)
    
    async def validate_transaction_path(self, path: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validiert einen Transaktionspfad auf Konsistenz"""
        try:
            validated = []
            for item in path:
                tx = await self.get_transaction_safe(item["tx_hash"])
                if tx and tx.status == "confirmed":
                    validated.append({
                        "tx_hash": tx.tx_hash,
                        "valid": True,
                        "value": float(tx.value),
                        "timestamp": tx.timestamp.isoformat()
                    })
                else:
                    validated.append({
                        "tx_hash": item["tx_hash"],
                        "valid": False,
                        "reason": "not_confirmed" if tx else "not_found"
                    })
            
            return {
                "path_valid": all(item["valid"] for item in validated),
                "details": validated,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Fehler bei der Pfadvalidierung: {str(e)}")
            return {
                "path_valid": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
