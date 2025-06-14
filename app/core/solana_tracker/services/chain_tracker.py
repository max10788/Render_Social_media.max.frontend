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

def log_rpc_json(method: str, params: list, response: dict):
    # Truncate very long responses for readability
    logger.info(
        f"RPC {method}({params}) response: {json.dumps(response, indent=2)[:1500]}"
    )

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
        result_transactions: List[TrackedTransaction] = []
        visited_addresses: Set[str] = set()
        try:
            async with self.solana_repo as repo:
                # 1. Hole erste Transaktion (NUR JSON loggen, kein raw!)
                tx_detail = await self._get_transaction_safe(start_tx_hash)
                if not tx_detail:
                    logger.error("Initial transaction %s not found", start_tx_hash)
                    return []
                transfers = self._extract_transfers(tx_detail)
                logger.info("First parsed transfers: %s", transfers)
                if not transfers:
                    logger.warning("No valid transfers in initial tx %s", start_tx_hash)
                    return []
                # 2. Nehme Empfänger-Adresse des größten Transfers als Startpunkt
                main_transfer = max(transfers, key=lambda t: t["amount"])
                current_wallet = main_transfer["to"]
                result_transactions.append(TrackedTransaction(
                    tx_hash=tx_detail.signature,
                    from_wallet=main_transfer["from"],
                    to_wallet=current_wallet,
                    amount=main_transfer["amount"],
                    timestamp=tx_detail.transaction.timestamp,
                    value_in_target_currency=None
                ))
                for depth in range(1, max_depth):
                    if not current_wallet or current_wallet in visited_addresses:
                        logger.info("End of chain reached at depth=%d", depth)
                        break
                    visited_addresses.add(current_wallet)

                    # Logge die JSON-Antwort der Balance-Query:
                    sol_balance_response = await repo._make_rpc_call(
                        "getBalance", [current_wallet]
                    )
                    log_rpc_json("getBalance", [current_wallet], sol_balance_response)
                    sol_balance = sol_balance_response.get('result', {}).get('value', 0)

                    # Logge die JSON-Antwort der Signature-Query:
                    get_sigs_params = [current_wallet, {"limit": 10}]
                    sigs_response = await repo._make_rpc_call(
                        "getSignaturesForAddress", get_sigs_params
                    )
                    log_rpc_json("getSignaturesForAddress", get_sigs_params, sigs_response)
                    # Parse out signatures:
                    sig_infos = sigs_response.get("result", [])
                    if not sig_infos:
                        logger.info(f"No outgoing signatures found for {current_wallet}, chain ends here.")
                        break

                    # Hole Transaktionen wie bisher, logge dabei die JSON-Antworten einzeln:
                    found_next = False
                    for sig_info in sig_infos:
                        tx_hash = sig_info.get("signature")
                        if not tx_hash:
                            continue
                        next_tx_detail = await self._get_transaction_safe(tx_hash)
                        # Die Methode _get_transaction_safe ruft get_transaction, welches bereits NUR JSON loggt!
                        if not next_tx_detail:
                            continue
                        tx_transfers = self._extract_transfers(next_tx_detail)
                        out_transfers = [
                            t for t in tx_transfers
                            if t["from"] == current_wallet and t["amount"] >= self.min_amount
                        ]
                        if out_transfers:
                            next_transfer = max(out_transfers, key=lambda t: t["amount"])
                            result_transactions.append(TrackedTransaction(
                                tx_hash=next_tx_detail.signature,
                                from_wallet=current_wallet,
                                to_wallet=next_transfer["to"],
                                amount=next_transfer["amount"],
                                timestamp=next_tx_detail.transaction.timestamp,
                                value_in_target_currency=None
                            ))
                            current_wallet = next_transfer["to"]
                            found_next = True
                            break  # Nimm nur den ersten relevanten Outflow
                    if not found_next:
                        logger.info(f"No outgoing transfer found from {current_wallet}, chain ends here.")
                        break
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
                timestamp=tx_detail.transaction.timestamp,  # <-- datetime!
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
