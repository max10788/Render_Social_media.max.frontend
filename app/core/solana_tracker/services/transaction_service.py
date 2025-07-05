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

    async def _track_transaction_chain(
        self, 
        start_tx_hash: str,
        max_depth: int,
        amount: Optional[Decimal]
    ) -> List[TrackedTransaction]:
        """
        Verfolgt eine Kette von Transaktionen mit verbesserter Multi-Sig Behandlung.
        """
        visited_txs = set()
        tracked_txs = []
        queue = [(start_tx_hash, amount)]

        while queue and len(tracked_txs) < max_depth:
            current_hash, remaining_amount = queue.pop(0)
            
            if current_hash in visited_txs:
                continue
                
            visited_txs.add(current_hash)
            
            try:
                tx_detail = await self._get_transaction_safe(current_hash)
                if not tx_detail:
                    continue

                # Multi-Sig Handling
                if self._is_multi_sig_transaction(tx_detail):
                    await self._handle_multi_sig_transaction(tx_detail)

                # Erstelle TrackedTransaction
                tracked_tx = await self._create_tracked_transaction(tx_detail, remaining_amount)
                if tracked_tx:
                    tracked_txs.append(tracked_tx)

                    # Füge Folgetransaktionen zur Queue hinzu
                    next_txs = await self._get_next_transactions(tracked_tx)
                    for next_tx in next_txs:
                        if next_tx.tx_hash not in visited_txs:
                            queue.append((next_tx.tx_hash, tracked_tx.remaining_amount))

            except MultiSigAccessError as e:
                logger.warning(f"Multi-Sig Zugriffsproblem bei {current_hash}: {e}")
                # Füge Transaktion trotzdem hinzu, aber markiere als nicht zugreifbar
                tracked_txs.append(
                    TrackedTransaction(
                        tx_hash=current_hash,
                        status="multi_sig_restricted",
                        error_details=str(e)
                    )
                )
                
            except Exception as e:
                logger.error(f"Fehler beim Tracking von {current_hash}: {e}")
                continue

        return tracked_txs

    async def _get_transaction_safe(
        self,
        tx_hash: str
    ) -> Optional[TransactionDetail]:
        """
        Ruft eine Transaktion sicher ab mit verbessertem Error Handling.
        """
        logger.debug(f"Rufe Transaktion sicher ab für {tx_hash}")
        try:
            tx_detail = await self.solana_repo.get_transaction(tx_hash)
            if tx_detail:
                logger.debug(f"Transaktion {tx_hash} erfolgreich abgerufen")
                return tx_detail
            logger.warning(f"Transaktion {tx_hash} nicht gefunden")
            return None
            
        except Exception as e:
            logger.error(f"Fehler beim Abruf der Transaktion {tx_hash}: {e}", exc_info=True)
            return None

    def _is_multi_sig_transaction(self, tx_detail: TransactionDetail) -> bool:
        """Check if transaction is multi-sig."""
        try:
            if not tx_detail or not tx_detail.message:
                return False
                
            # Account keys are in the message structure
            account_keys = tx_detail.message.accountKeys if hasattr(tx_detail.message, 'accountKeys') else []
            
            # Check for MultiSig accounts in the account keys
            has_multi_sig = any("MultiSig" in account for account in account_keys)
            
            # Check required signatures from header
            if hasattr(tx_detail.message, 'header'):
                required_sigs = tx_detail.message.header.get('numRequiredSignatures', 1)
                if required_sigs > 1:
                    return True
                    
            return has_multi_sig
        except Exception as e:
            logger.error(f"Error checking multi-sig transaction: {e}")
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
    tx_detail: TransactionDetail,
    remaining_amount: Optional[Decimal] = None,
    data_level: str = "basic"  # Neuer Parameter für Datentiefe
) -> Optional[TrackedTransaction]:
    """
    Erstellt eine TrackedTransaction aus den TransactionDetails mit kontrollierbarer Datentiefe.

    Args:
        tx_detail: Die Transaktionsdetails
        remaining_amount: Optional verbleibender zu trackender Betrag
        data_level: Kontrollebene für zurückgegebene Daten:
                   - "basic": Nur Wallet-Adressen und Transaktion-Hash
                   - "standard": Basic + Beträge und Zeitstempel
                   - "full": Alle verfügbaren Details
    Returns:
        TrackedTransaction oder None wenn die Transaktion nicht verarbeitet werden kann
    """
    try:
        if not tx_detail or not tx_detail.message:
            logger.warning("Keine gültigen Transaktionsdetails verfügbar")
            return None

        # Extrahiere relevante Adressen
        account_keys = tx_detail.account_keys
        if not account_keys:
            logger.warning("Keine Account Keys in der Transaktion gefunden")
            return None

        # Bestimme From und To Wallets aus den Instructions
        from_wallet = None
        to_wallet = None
        amount = Decimal('0')

        if tx_detail.message and tx_detail.message.instructions:
            for instruction in tx_detail.message.instructions:
                # System Program Transfer
                if instruction.get('programIdIndex') == 11:  # System Program
                    accounts = instruction.get('accounts', [])
                    if len(accounts) >= 2:
                        from_idx = accounts[0]
                        to_idx = accounts[1]
                        if 0 <= from_idx < len(account_keys) and 0 <= to_idx < len(account_keys):
                            from_wallet = account_keys[from_idx]
                            to_wallet = account_keys[to_idx]
                            if data_level in ["standard", "full"]:
                                # Extrahiere Betrag nur für standard und full
                                if 'data' in instruction:
                                    try:
                                        amount = Decimal(instruction.get('amount', 0)) / Decimal(1e9)
                                    except:
                                        pass
                            break

        if not from_wallet or not to_wallet:
            logger.warning("Konnte From/To Wallets nicht bestimmen")
            return None

        # Basis-Transaktion erstellen
        tracked_tx = {
            "tx_hash": tx_detail.signatures[0] if tx_detail.signatures else "",
            "from_wallet": from_wallet,
            "to_wallet": to_wallet,
        }

        # Füge zusätzliche Daten basierend auf data_level hinzu
        if data_level in ["standard", "full"]:
            tracked_tx.update({
                "amount": amount,
                "timestamp": datetime.fromtimestamp(tx_detail.block_time) if tx_detail.block_time else datetime.utcnow(),
            })

        if data_level == "full":
            tracked_tx.update({
                "value_in_target_currency": None,  # Könnte später hinzugefügt werden
                "status": "success" if not tx_detail.error_details else "failed",
                "remaining_amount": remaining_amount,
                "is_multi_sig": self._is_multi_sig_transaction(tx_detail),
                "required_signatures": len(tx_detail.signatures) if tx_detail.signatures else None,
            })

        return TrackedTransaction(**tracked_tx)

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
            for tx_detail in batch.transactions:
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
