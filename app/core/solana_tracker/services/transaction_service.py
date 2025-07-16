# Standard Library Imports
from fastapi import HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from decimal import Decimal
import asyncio
from functools import lru_cache

# Local Imports - Models
from app.core.solana_tracker.models.base_models import (
    TransactionDetail,
    TransactionBatch,
    TrackedTransaction
)

# Local Imports - Repositories
from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository
from app.core.solana_tracker.repositories.cache_repository import CacheRepository

# Local Imports - Services
from app.core.solana_tracker.services.chain_tracker import ChainTracker
from app.core.solana_tracker.services.scenario_detector import ScenarioDetector

# Local Imports - Utils
from app.core.solana_tracker.utils.enhanced_retry_utils import (
    enhanced_retry_with_backoff as retry_with_exponential_backoff
)

from app.core.exceptions import (
    CryptoTrackerError,
    MultiSigAccessError,
    TransactionNotFoundError,
    TransactionValidationError,
    RateLimitExceededError,
    BlockchainConnectionError
)

logger = logging.getLogger(__name__)

class TransactionService:
    def __init__(
        self,
        solana_repository: EnhancedSolanaRepository,
        scenario_detector: Optional[ScenarioDetector] = None
    ):
        self.solana_repo = solana_repository
        self.scenario_detector = scenario_detector or ScenarioDetector()
        
    async def get_transaction_details(self, tx_hash: str) -> Optional[TransactionDetail]:
        """Get transaction details with improved error handling."""
        try:
            tx_detail = await self._get_transaction_safe(tx_hash)
            if not tx_detail:
                logger.warning(f"Keine Transaktionsdetails gefunden für {tx_hash}")
                return None
                
            # Prüfe auf Versionskompatibilität
            if hasattr(tx_detail, 'version') and tx_detail.version > 0:
                logger.info(f"Transaktion {tx_hash} verwendet Version {tx_detail.version}")
                
            return tx_detail
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Transaktionsdetails: {e}", exc_info=True)
            return None

    @retry_with_exponential_backoff(max_retries=3)
    async def analyze_transaction_chain(
        self,
        start_tx_hash: str,
        max_depth: int = 10,
        target_currency: str = "USD",
        amount: Optional[Decimal] = None,
        data_level: str = "standard"  # Neuer Parameter
    ) -> Dict[str, Any]:
        """
        Analysiert eine Transaktionskette mit verbesserter Fehlerbehandlung.
        
        Args:
            start_tx_hash: Hash der Ausgangstransaktion
            max_depth: Maximale Tiefe der Analyse
            target_currency: Zielwährung für Umrechnungen
            amount: Optionaler Betrag für Tracking
            
        Returns:
            Dict mit Analyseergebnissen
            
        Raises:
            MultiSigAccessError: Bei Problemen mit Multi-Sig Zugriff
            TransactionValidationError: Bei ungültigen Transaktionen
            HTTPException: Bei allgemeinen API-Fehlern
        """
        try:
            # Validiere Input
            if not self._validate_transaction_hash(start_tx_hash):
                raise TransactionValidationError(f"Ungültige Transaktions-Hash: {start_tx_hash}")

            # Hole initiale Transaktion
            initial_tx = await self._get_transaction_safe(start_tx_hash)
            if not initial_tx:
                raise TransactionValidationError(f"Ausgangstransaktion nicht gefunden: {start_tx_hash}")

            # Prüfe auf Multi-Sig
            if self._is_multi_sig_transaction(initial_tx):
                try:
                    await self._validate_multi_sig_access(initial_tx)
                except MultiSigAccessError as e:
                    logger.error(f"Multi-Sig Zugriffsfehler: {e}")
                    raise

            # Tracke Transaktionskette
            tracked_txs = await self._track_transaction_chain(
                start_tx_hash=start_tx_hash,
                max_depth=max_depth,
                amount=amount,
                data_level=data_level  # Übergebe data_level
            )

            # Konvertiere Timestamps
            for tx in tracked_txs:
                if isinstance(tx.timestamp, datetime):
                    tx.timestamp = tx.timestamp.isoformat()
    
            # Erkenne Szenarien
            scenarios = await self.scenario_detector.detect_scenarios(tracked_txs)
            logger.info(f"Szenarienerkennung abgeschlossen. {len(scenarios) if scenarios else 0} Szenarien gefunden.")
            
            if any(self._is_multi_sig_transaction(tx) for tx in tracked_txs):
                scenarios.append({
                    "type": "multi_sig_transfer",
                    "description": "Erkannte Multi-Signatur-Transaktion innerhalb der Kette",
                    "risk_level": "medium",
                    "affected_transactions": [tx.tx_hash for tx in tracked_txs if self._is_multi_sig_transaction(tx)]
                })
    
            # Berechne Statistiken
            stats = await self._calculate_chain_statistics(tracked_txs)
            logger.debug(f"Kettenstatistiken berechnet: {stats}")
    
            return {
                "status": "success",
                "transactions": tracked_txs,
                "scenarios": scenarios if scenarios else [],
                "statistics": stats,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
    
        except MultiSigAccessError as e:
            logger.error(f"Multi-Sig Zugriffsfehler bei {start_tx_hash}: {e}", exc_info=True)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "multi_sig_access_denied",
                    "message": str(e),
                    "required_signers": e.required_signers if hasattr(e, 'required_signers') else None
                }
            )
            
        except TransactionValidationError as e:
            logger.error(f"Validierungsfehler bei {start_tx_hash}: {e}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "validation_error",
                    "message": str(e)
                }
            )
            
        except Exception as e:
            logger.error(f"Fehler bei der Analyse der Transaktionskette von {start_tx_hash}: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "internal_error",
                    "message": "Ein interner Fehler ist aufgetreten"
                }
            )

    async def _get_transaction_safe(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Retrieve a transaction with error handling."""
        try:
            # Fetch from repository (which uses Solana's RPC internally)
            return await self.solana_repo.get_transaction(tx_hash)
        except Exception as e:
            logger.error(f"Error fetching transaction {tx_hash}: {e}")
            return None
    
    async def _track_transaction_chain(
        self, 
        start_tx_hash: str,
        max_depth: int,
        amount: Optional[Decimal],
        data_level: str = "standard"
    ) -> List[TrackedTransaction]:
        """
        Verfolgt eine Kette von Transaktionen mit verbessertem Logging.
        """
        visited_txs = set()
        tracked_txs = []
        queue = [(start_tx_hash, amount)]
        
        logger.info(f"Starting transaction chain tracking: hash={start_tx_hash}, max_depth={max_depth}, data_level={data_level}")
    
        while queue and len(tracked_txs) < max_depth:
            current_hash, remaining_amount = queue.pop(0)
            
            logger.info(f"Processing transaction: {current_hash}")
            
            if current_hash in visited_txs:
                logger.debug(f"Transaction {current_hash} already processed, skipping")
                continue
                
            visited_txs.add(current_hash)
            
            try:
                tx_detail = await self._get_transaction_safe(current_hash)
                if not tx_detail:
                    logger.warning(f"No transaction details found for {current_hash}")
                    continue
    
                # Multi-Sig Handling
                if self._is_multi_sig_transaction(tx_detail):
                    logger.info(f"Multi-sig transaction detected: {current_hash}")
                    await self._handle_multi_sig_transaction(tx_detail)
    
                # Create TrackedTransaction
                tracked_tx = await self._create_tracked_transaction(
                    tx_detail=tx_detail,
                    remaining_amount=remaining_amount,
                    data_level=data_level
                )
                
                if tracked_tx:
                    logger.info(
                        f"Transaction tracked: hash={tracked_tx.tx_hash}, "
                        f"from={tracked_tx.from_wallet}, "
                        f"to={tracked_tx.to_wallet}, "
                        f"amount={tracked_tx.amount if hasattr(tracked_tx, 'amount') else 'N/A'}"
                    )
                    tracked_txs.append(tracked_tx)
    
                    if data_level != "basic":
                        next_txs = await self._get_next_transactions(tracked_tx)
                        logger.info(f"Found {len(next_txs)} next transactions for {current_hash}")
                        for next_tx in next_txs:
                            if next_tx.tx_hash not in visited_txs:
                                queue.append((next_tx.tx_hash, tracked_tx.remaining_amount))
    
            except Exception as e:
                logger.error(f"Error processing transaction {current_hash}: {str(e)}", exc_info=True)
                continue
    
        logger.info(
            f"Chain tracking completed: processed {len(tracked_txs)} transactions, "
            f"visited {len(visited_txs)} unique transactions"
        )
        return tracked_txs

    def retry_with_exponential_backoff(max_retries=3, initial_delay=1):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                retries = 0
                current_delay = initial_delay
                while retries < max_retries:
                    try:
                        return await func(*args, **kwargs)  # ✅ Korrekt
                    except Exception as e:
                        retries += 1
                        if retries == max_retries:
                            logger.error(f"Max retries ({max_retries}) reached for {func.__name__}")
                            raise e
                # ❌ Fehlender return hier!
            return wrapper  # ❌ Fehlender return hier!
        return decorator  # ❌ Fehlender return hier!
            
    def _is_multi_sig_transaction(self, tx_detail: Dict[str, Any]) -> bool:
        """
        Prüft, ob eine Transaktion eine Multi-Sig-Transaktion ist.
        """
        try:
            # Sicherer Zugriff auf verschachtelte Daten
            message = tx_detail.get("transaction", {}).get("message", {})
            account_keys = message.get("accountKeys", [])
            header = message.get("header", {})
            required_sigs = header.get("numRequiredSignatures", 1)
    
            if required_sigs > 1:
                logger.info(f"Multi-signature transaction detected with {required_sigs} signatures")
                return True
    
            if any("MultiSig" in str(acc) for acc in account_keys):
                logger.info(f"Multi-signature transaction detected by account key check")
                return True
    
            return False
        except Exception as e:
            logger.warning(f"Fehler beim Prüfen der Multi-Sig-Eigenschaft: {e}")
            return False

    async def _validate_multi_sig_access(self, tx_detail: TransactionDetail) -> None:
        """
        Validiert den Zugriff auf eine Multi-Sig Transaktion.
        """
        required_signers = tx_detail.required_signatures
        available_signers = len(tx_detail.signatures)
        
        if available_signers < required_signers:
            raise MultiSigAccessError(
                f"Nicht genügend Signaturen für Multi-Sig Zugriff. "
                f"Benötigt: {required_signers}, Verfügbar: {available_signers}",
                required_signers=required_signers,
                available_signers=available_signers
            )

    async def _handle_multi_sig_transaction(self, tx_detail: TransactionDetail) -> None:
        """
        Behandelt eine Multi-Sig Transaktion.
        """
        try:
            await self._validate_multi_sig_access(tx_detail)
            # Hier können weitere Multi-Sig spezifische Verarbeitungen erfolgen
            
        except MultiSigAccessError:
            # Log und re-raise für höhere Ebenen
            raise

    async def _calculate_chain_statistics(self, transactions: List[TrackedTransaction]) -> Dict[str, Any]:
        """
        Berechnet Statistiken für die Transaktionskette.
        """
        if not transactions:
            return {}
            
        total_amount = sum(tx.amount for tx in transactions if tx.amount is not None)
        avg_amount = total_amount / len(transactions) if transactions else 0
        
        return {
            "total_transactions": len(transactions),
            "total_amount": float(total_amount),
            "average_amount": float(avg_amount),
            "multi_sig_count": sum(1 for tx in transactions if tx.status == "multi_sig_restricted"),
            "successful_transactions": sum(1 for tx in transactions if tx.status == "success"),
            "failed_transactions": sum(1 for tx in transactions if tx.status == "failed"),
            "unique_wallets": len(set(tx.to_wallet for tx in transactions if tx.to_wallet))
        }

    def _validate_transaction_hash(self, tx_hash: str) -> bool:
        """
        Validiert das Format einer Transaktions-Hash.
        """
        import re
        # Solana Transaktion Hash Format
        return bool(re.match(r'^[1-9A-HJ-NP-Za-km-z]{87,88}$', tx_hash))

    async def _create_tracked_transaction(
        self,
        tx_detail: dict,
        remaining_amount: Optional[Decimal] = None,
        data_level: str = "standard"
    ) -> Optional[TrackedTransaction]:
        try:
            # Extrahiere Signatur und Basisdaten
            signatures = tx_detail.get("signatures", [])
            transaction_data = tx_detail.get("transaction", {})
            message = transaction_data.get("message", {})
            meta = tx_detail.get("meta", {})
            
            # Validierung auf vollständige Transaktionsdaten
            if not transaction_data or not message or not meta:
                logger.warning("Unvollständige Transaktionsdaten")
                return None
            
            account_keys = message.get("accountKeys", [])
            if not account_keys:
                logger.warning("Keine Account-Keys in der Transaktion")
                return None
    
            # Extrahiere Balance-Änderungen
            pre_balances = meta.get("pre_balances", [])
            post_balances = meta.get("post_balances", [])
            
            if not pre_balances or not post_balances or len(pre_balances) != len(post_balances):
                logger.warning("Ungültige oder ungleiche Balance-Daten")
                return None
    
            # Finde Sender und Empfänger basierend auf Balance-Änderungen
            changes = []
            for i in range(len(pre_balances)):
                if i >= len(account_keys):
                    continue
                try:
                    change = int(post_balances[i]) - int(pre_balances[i])
                    if abs(change) > 5000:  # Nur signifikante Änderungen (>0,000005 SOL)
                        changes.append({
                            "account": account_keys[i],
                            "change": change
                        })
                except (TypeError, ValueError):
                    continue
    
            # Bestimme Sender (negativer Betrag) und Empfänger (positiver Betrag)
            sender = next((c for c in changes if c["change"] < 0), None)
            receiver = next((c for c in changes if c["change"] > 0), None)
    
            if not sender or not receiver:
                logger.warning("Konnte Sender oder Empfänger nicht identifizieren")
                return None
    
            from_wallet = sender["account"]
            to_wallet = receiver["account"]
            amount = Decimal(abs(sender["change"])) / Decimal(1e9)  # Lamports → SOL
    
            # Baue Transaktionsdaten
            tx_data = {
                "tx_hash": signatures[0] if signatures else "",
                "from_wallet": from_wallet,
                "to_wallet": to_wallet,
            }
    
            if data_level in ["standard", "full"]:
                block_time = tx_detail.get("blockTime")
                tx_data.update({
                    "amount": amount,
                    "timestamp": datetime.fromtimestamp(block_time) if isinstance(block_time, int) else datetime.utcnow(),
                })
    
            return TrackedTransaction(**tx_data)
    
        except Exception as e:
            logger.error(f"Fehler beim Erstellen der TrackedTransaction: {e}", exc_info=True)
            return None
        
    async def _get_next_transactions(
        self,
        tracked_tx: TrackedTransaction,
        limit: int = 5
    ) -> List[TrackedTransaction]:
        """
        Ermittelt die nächsten Transaktionen basierend auf einer TrackedTransaction.
    
        Args:
            tracked_tx: Die aktuelle TrackedTransaction
            limit: Maximale Anzahl der zurückzugebenden Transaktionen
    
        Returns:
            Liste von TrackedTransactions
        """
        try:
            # Hole Transaktionen für die Ziel-Wallet
            batch = await self.solana_repo.get_transactions_for_address(
                address=tracked_tx.to_wallet,
                limit=limit
            )
    
            next_txs = []
            for tx_detail in batch:
                next_tracked = await self._create_tracked_transaction(
                    tx_detail,
                    tracked_tx.remaining_amount
                )
                if next_tracked:
                    next_txs.append(next_tracked)
    
            return next_txs
    
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der nächsten Transaktionen: {e}", exc_info=True)
            return []
