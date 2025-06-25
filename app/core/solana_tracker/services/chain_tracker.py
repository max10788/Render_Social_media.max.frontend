from typing import List, Set, Dict, Optional, Tuple, Union
from datetime import datetime
import logging
import asyncio
from decimal import Decimal
import base58
import json

from app.core.solana_tracker.models.transaction import TrackedTransaction, TransactionDetail
from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.utils.retry_utils import retry_with_exponential_backoff
from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository

def log_rpc_json(method: str, params: list, response: dict):
    # Truncate very long responses for readability
    logger.info(f"RPC {method}{{params}} response: {json.dumps(response, indent=2)[:1500]}")

logger = logging.getLogger(__name__)

class ChainTracker:
    """Chain tracking service for monitoring blockchain activity."""

    # Class level constants
    MIN_AMOUNT = Decimal('0.000001')

    def __init__(self, solana_repo: Optional[SolanaRepository] = None):
        """Initialize the chain tracker."""
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
                tx_detail = await self._get_transaction_safe(start_tx_hash)
                if not tx_detail:
                    logger.error("Initial transaction %s not found", start_tx_hash)
                    return []
                transfers = self._extract_transfers(tx_detail)
                logger.info("First parsed transfers: %s", transfers)
                if not transfers:
                    logger.warning("No valid transfers in initial tx %s", start_tx_hash)
                    return []
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
                    sol_balance_response = await repo._make_rpc_call(
                        "getBalance", [current_wallet]
                    )
                    log_rpc_json("getBalance", [current_wallet], sol_balance_response)
                    sol_balance = sol_balance_response.get('result', {}).get('value', 0)
                    get_sigs_params = [current_wallet, {"limit": 10}]
                    sigs_response = await repo._make_rpc_call(
                        "getSignaturesForAddress", get_sigs_params
                    )
                    log_rpc_json("getSignaturesForAddress", get_sigs_params, sigs_response)
                    sig_infos = sigs_response.get("result", [])
                    if not sig_infos:
                        logger.info(f"No outgoing signatures found for {current_wallet}, chain ends here.")
                        break
                    found_next = False
                    for sig_info in sig_infos:
                        tx_hash = sig_info.get("signature")
                        if not tx_hash:
                            continue
                        next_tx_detail = await self._get_transaction_safe(tx_hash)
                        if not next_tx_detail:
                            continue
                        tx_transfers = self._extract_transfers(next_tx_detail)
                        out_transfers = [
                            t for t in tx_transfers
                            if t["from"] == current_wallet and t["amount"] >= self.MIN_AMOUNT
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
                            break
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
        logger.debug("Starting transfer extraction from tx_detail type: %s", type(tx_detail).__name__)
    
        try:
            if isinstance(tx_detail, dict):
                logger.debug("Processing raw dictionary from RPC response")
                result = tx_detail.get('result', {})
                transaction_data = result.get('transaction', {})
                message = transaction_data.get('message', {})
                instructions = message.get('instructions', [])
    
                for instr in instructions:
                    program_id = instr.get('programId')
                    parsed = instr.get('parsed')
    
                    if not parsed or not isinstance(parsed, dict):
                        continue
    
                    instruction_type = parsed.get('type')
                    info = parsed.get('info', {})
    
                    # SOL Transfer
                    if program_id == "11111111111111111111111111111111" and instruction_type == "transfer":
                        amount_sol = Decimal(info.get('lamports', 0)) / Decimal(1_000_000_000)
                        if amount_sol >= self.MIN_AMOUNT:
                            logger.info("Found SOL transfer: from=%s to=%s amount=%.9f SOL",
                                        info['source'], info['destination'], amount_sol)
                            transfers.append({
                                "from": info['source'],
                                "to": info['destination'],
                                "amount": amount_sol
                            })
    
                    # SPL Token Transfer
                    elif program_id == "TokenkegQfeZyiNwAJbNbGKL6Qiw7P11pZyD7CwxbK1cd" and instruction_type == "transfer":
                        mint = info.get('mint')
                        amount_raw = info.get('tokenAmount', {}).get('uiAmount') or info.get('amount', 0)
                        amount_token = Decimal(amount_raw) if amount_raw else Decimal(0)
                        if amount_token >= self.MIN_AMOUNT:
                            logger.info("Found SPL token transfer: from=%s to=%s mint=%s amount=%.9f tokens",
                                        info['source'], info['destination'], mint, amount_token)
                            transfers.append({
                                "from": info['source'],
                                "to": info['destination'],
                                "amount": amount_token,
                                "mint": mint
                            })
    
                logger.debug("Extracted %d transfers from raw dictionary", len(transfers))
                return transfers
    
            elif isinstance(tx_detail, TransactionDetail):
                if hasattr(tx_detail, 'transfers'):
                    for transfer in tx_detail.transfers:
                        if transfer.amount >= self.MIN_AMOUNT:
                            logger.info("Found pre-parsed transfer: from=%s to=%s amount=%.9f",
                                        transfer.from_address, transfer.to_address, transfer.amount)
                            transfers.append({
                                "from": transfer.from_address,
                                "to": transfer.to_address,
                                "amount": transfer.amount
                            })
                logger.debug("Found %d transfers from TransactionDetail object", len(transfers))
                return transfers
    
            else:
                logger.warning("Unsupported tx_detail type for transfer extraction: %s", type(tx_detail).__name__)
                return []
    
        except Exception as e:
            logger.error("Error extracting transfers: %s", e, exc_info=True)
            return transfers


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
