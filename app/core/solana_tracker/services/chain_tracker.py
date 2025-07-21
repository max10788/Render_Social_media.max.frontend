from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime
from decimal import Decimal
import logging
import asyncio

# Base models
from app.core.solana_tracker.models.base_models import (
    TransactionDetail,
    TrackedTransaction
)

# Scenario models
from app.core.solana_tracker.models.scenario import (
    ScenarioType,
    DetectedScenario
)

# Repository
from app.core.solana_tracker.repositories.enhanced_solana_repository import repository as solana_repo

# Core exceptions
from app.core.exceptions import (
    MultiSigAccessError,
    TransactionNotFoundError
)

def log_rpc_json(method: str, params: list, response: dict):
    # Truncate very long responses for readability
    logger.info(f"RPC {method}{{params}} response: {json.dumps(response, indent=2)[:1500]}")

logger = logging.getLogger(__name__)

class ChainTracker:
    """Chain tracking service for monitoring blockchain activity."""

    # Class level constants
    MIN_AMOUNT = Decimal('0.001')

    def __init__(self, solana_repo: EnhancedSolanaRepository = solana_repo):
        self.solana_repo = solana_repo
        self.last_update = datetime.utcnow()
        self.active = False

    async def start(self):
        """Start the chain tracker."""
        self.active = True
        logger.info("Chain tracker started")

    async def stop(self):
        """Stop the chain tracker."""
        self.active = False
        logger.info("Chain tracker stopped")

    def get_min_amount(self) -> Decimal:
        """Get minimum tracking amount."""
        return self.MIN_AMOUNT

    def validate_transaction_signature(self, signature: str) -> bool:
        try:
            decoded = base58.b58decode(signature)
            valid = len(decoded) == 64
            logger.debug("Signature validation for '%s': %s", signature, valid)
            return valid
        except Exception as e:
            logger.error("Invalid signature format for '%s': %s", signature, e)
            return False

    async def track_chain(self, start_tx_hash: str, max_depth: int = 10, amount: Optional[Decimal] = None) -> List[TrackedTransaction]:
        """Verfolgt eine Transaktionskette mit verbesserten Fallback-Werten für unvollständige oder fehlende Daten."""
        logger.info("Starte Kettenverfolgung für %s (max_depth=%d, amount=%s)", start_tx_hash, max_depth, amount)
    
        if not self.validate_transaction_signature(start_tx_hash):
            logger.error("Ungültige Transaktions-Signatur: %s", start_tx_hash)
            return [TrackedTransaction(
                tx_hash="Fehler",
                from_wallet="Unbekannt",
                to_wallet="Ziel",
                amount=Decimal("0"),
                timestamp=datetime.now().timestamp(),
                value_in_target_currency=None
            )]
    
        result_transactions: List[TrackedTransaction] = []
        visited_addresses: Set[str] = set()
    
        try:
            async with self.solana_repo as repo:
                # Extrahiere Starttransaktion
                tx_detail = await self._get_transaction_safe(start_tx_hash)
                if not tx_detail:
                    logger.warning("Starttransaktion nicht gefunden: %s", start_tx_hash)
                    result_transactions.append(TrackedTransaction(
                        tx_hash=start_tx_hash,
                        from_wallet="Unbekannt",
                        to_wallet="Ziel",
                        amount=Decimal("0"),
                        timestamp=datetime.now().timestamp(),
                        value_in_target_currency=None
                    ))
                    return result_transactions
    
                # Extrahiere erste Transfers
                transfers = self._extract_transfers(tx_detail)
                if not transfers or all(t["amount"] == Decimal("0") for t in transfers):
                    logger.warning("Keine gültigen Transfers in der Starttransaktion: %s", start_tx_hash)
                    result_transactions.append(TrackedTransaction(
                        tx_hash=start_tx_hash,
                        from_wallet="Unbekannt",
                        to_wallet="Ziel",
                        amount=Decimal("0"),
                        timestamp=tx_detail.get("blockTime", datetime.now().timestamp()),
                        value_in_target_currency=None
                    ))
                    return result_transactions
    
                # Filtere nach optionaler Betragsübereinstimmung
                if amount is not None:
                    filtered = [t for t in transfers if abs(t["amount"] - amount) <= self.MIN_AMOUNT]
                    if filtered:
                        transfers = filtered
                    else:
                        logger.warning("Keine Transfer mit dem gesuchten Betrag: %s", amount)
    
                # Wähle den größten Transfer
                main_transfer = max(transfers, key=lambda t: t["amount"])
                result_transactions.append(TrackedTransaction(
                    tx_hash=tx_detail["signature"],
                    from_wallet=main_transfer["from"],
                    to_wallet=main_transfer["to"],
                    amount=main_transfer["amount"],
                    timestamp=tx_detail.get("blockTime", datetime.now().timestamp()),
                    value_in_target_currency=None
                ))
    
                current_wallet = main_transfer["to"]
    
                # Verfolge weitere Transaktionen
                for depth in range(1, max_depth):
                    if not current_wallet or current_wallet in visited_addresses:
                        logger.info("Kette endet bei Tiefe %d", depth)
                        break
    
                    visited_addresses.add(current_wallet)
    
                    # Hole Signaturen für das aktuelle Wallet
                    sigs_response = await repo._make_rpc_call("getSignaturesForAddress", [current_wallet, {"limit": 10}])
                    if not sigs_response or not isinstance(sigs_response, list):
                        logger.warning("Keine Signaturen für %s gefunden", current_wallet)
                        result_transactions.append(TrackedTransaction(
                            tx_hash="",
                            from_wallet=current_wallet,
                            to_wallet="Ende der Kette",
                            amount=Decimal("0"),
                            timestamp=datetime.now().timestamp(),
                            value_in_target_currency=None
                        ))
                        break
    
                    found_next = False
                    for sig_info in sigs_response:
                        tx_hash = sig_info.get("signature")
                        if not tx_hash:
                            continue
    
                        next_tx = await self._get_transaction_safe(tx_hash)
                        if not next_tx:
                            continue
    
                        next_transfers = self._extract_transfers(next_tx)
                        if amount is not None:
                            next_transfers = [t for t in next_transfers if abs(t["amount"] - amount) <= self.MIN_AMOUNT]
    
                        out_transfers = [t for t in next_transfers if t["from"] == current_wallet and t["amount"] > 0]
    
                        if out_transfers:
                            next_transfer = max(out_transfers, key=lambda t: t["amount"])
                            result_transactions.append(TrackedTransaction(
                                tx_hash=tx_hash,
                                from_wallet=next_transfer["from"],
                                to_wallet=next_transfer["to"],
                                amount=next_transfer["amount"],
                                timestamp=next_tx.get("blockTime", datetime.now().timestamp()),
                                value_in_target_currency=None
                            ))
                            current_wallet = next_transfer["to"]
                            found_next = True
                            break
    
                    if not found_next:
                        logger.info("Keine weiteren Transaktionen von %s gefunden", current_wallet)
                        result_transactions.append(TrackedTransaction(
                            tx_hash="",
                            from_wallet=current_wallet,
                            to_wallet="Ende der Kette",
                            amount=Decimal("0"),
                            timestamp=datetime.now().timestamp(),
                            value_in_target_currency=None
                        ))
                        break
    
                logger.info("Kettenverfolgung abgeschlossen. %d Transaktionen gefunden.", len(result_transactions))
                return result_transactions

        except Exception as e:
            logger.error("Fehler bei der Kettenverfolgung: %s", str(e), exc_info=True)
            return [TrackedTransaction(
                tx_hash="Fehler",
                from_wallet="Unbekannt",
                to_wallet="Ziel",
                amount=Decimal("0"),
                timestamp=datetime.now().timestamp(),
                value_in_target_currency=None
            )]

    def retry_with_exponential_backoff(max_retries=3, initial_delay=1):
        """Decorator für exponentielles Backoff bei Wiederholungsversuchen."""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                retries = 0
                current_delay = initial_delay
                
                while retries < max_retries:
                    try:
                        return await func(*args, **kwargs)
                    except Exception as e:
                        retries += 1
                        if retries == max_retries:
                            logger.error(f"Max retries ({max_retries}) reached for {func.__name__}")
                            raise e
                        
                        logger.warning(f"Attempt {retries} failed, retrying in {current_delay} seconds")
                        await asyncio.sleep(current_delay)
                        current_delay *= 2  # Exponentielles Backoff
                
                return None  # Sollte nie erreicht werden
            return wrapper
        return decorator

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
                transfers = [t for t in transfers if abs(t["amount"] - amount) <= self.MIN_AMOUNT]
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
                timestamp=tx_detail.transaction.timestamp,
                value_in_target_currency=None
            )
        except Exception as e:
            logger.error("Error processing transaction %s: %s", tx_hash, e, exc_info=True)
            return None

    def _extract_transfers(self, tx_detail: Union[TransactionDetail, Dict]) -> List[Dict]:
        transfers = []
        try:
            if isinstance(tx_detail, dict):
                meta = tx_detail.get('result', {}).get('meta', {})
                pre_balances = meta.get('pre_balances', [])
                post_balances = meta.get('post_balances', [])
                account_keys = tx_detail.get('result', {}).get('transaction', {}).get('message', {}).get('accountKeys', [])
                
                # Finde Sender (negativer Betrag)
                sender_index = None
                for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                    if post - pre < 0:  # Sender
                        sender_index = i
                        break
                
                if sender_index is not None:
                    # Finde Empfänger (positiver Betrag)
                    for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                        if i != sender_index and post - pre > 0:  # Empfänger
                            transfers.append({
                                "from": account_keys[sender_index],
                                "to": account_keys[i],
                                "amount": Decimal(abs(post - pre)) / Decimal(1_000_000_000)
                            })
                            break  # Nur den ersten Empfänger nehmen
                            
            return transfers
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren von Transfers: {e}")
            return transfers

    async def _get_initial_sender(self, tx_hash: str) -> Optional[str]:
        """
        Lädt die Starttransaktion und gibt den Sender zurück.
        Gibt None zurück, wenn die Transaktion nicht gefunden wird oder keine Senderdaten enthält.
        """
        try:
            tx_detail = await self.solana_repo.get_transaction(tx_hash)
            if not tx_detail:
                logger.warning(f"Starttransaktion {tx_hash} nicht gefunden.")
                return None
    
            transfers = self._extract_transfers(tx_detail)
            if not transfers:
                logger.warning(f"Keine Transfers in der Starttransaktion {tx_hash} gefunden.")
                return None
    
            # Nutze den ersten Sender
            return transfers[0]["from"]
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren des Senders aus {tx_hash}: {str(e)}")
            return None

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
                        if abs(t["amount"] - amount) <= self.MIN_AMOUNT
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
