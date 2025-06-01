from fastapi import HTTPException
from typing import List, Set, Dict
from solana.rpc.api import Client
from solders.pubkey import Pubkey as PublicKey
from solders.signature import Signature
from solana.rpc.types import TxOpts
from datetime import datetime
import base58
import logging
import asyncio
import traceback
from functools import wraps
from app.models.schemas import (
    TransactionTrackRequest,
    TransactionTrackResponse,
    TrackedTransaction,
    ScenarioType,
    FinalStatusEnum,
)

# Improved logger configuration
logger = logging.getLogger(__name__)
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s][%(levelname)s][%(name)s]: %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

def handle_rpc_errors(func):
    """Decorator to handle RPC errors consistently and with better logging."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValueError as ve:
            logger.error(f"ValueError in {func.__name__}: {ve!r}\n{traceback.format_exc()}")
            raise HTTPException(status_code=400, detail=str(ve))
        except HTTPException as he:
            logger.error(f"HTTPException in {func.__name__}: {he.detail!r}\n{traceback.format_exc()}")
            raise
        except Exception as e:
            logger.error(f"Exception in {func.__name__}: {e!r}\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Internal error in {func.__name__}: {str(e)}")
    return wrapper

class SolanaClient:
    def __init__(self, rpc_url: str = "https://api.devnet.solana.com"): 
        self.rpc_url = rpc_url
        self.client = Client(rpc_url)
        self.KNOWN_BRIDGES = {
            "wormhole": {
                "address_prefixes": ["Bridge1p5g8jV1tPF3X8D79uHQfLpHDEPw5tsqZ9t6vG2K"],
                "target_chain": "Ethereum",
                "protocol": "Wormhole"
            },
            "allbridge": {
                "address_prefixes": ["allBRigjtX11x8wfeUB4A6Z7eDnUwKhRcpJqiQ8D7Eqyuf"],
                "target_chain": "Ethereum",
                "protocol": "Allbridge"
            }
        }

    def _convert_to_signature(self, signature_str: str) -> Signature:
        """Convert string signature to Solana Signature object."""
        try:
            sig = Signature.from_string(signature_str)
            logger.debug(f"Signature converted directly: {signature_str} -> {sig}")
            return sig
        except Exception:
            try:
                decoded = base58.b58decode(signature_str)
                sig = Signature.from_bytes(decoded)
                logger.debug(f"Signature converted from base58: {signature_str} -> {sig}")
                return sig
            except Exception as e:
                logger.error(f"Failed to convert signature '{signature_str}': {e!r}\n{traceback.format_exc()}")
                raise ValueError(f"Invalid signature format: {str(e)}")

    @handle_rpc_errors
    async def get_transaction(self, tx_signature: str):
        """Get transaction details from Solana blockchain."""
        signature = self._convert_to_signature(tx_signature)
        loop = asyncio.get_running_loop()
        try:
            logger.debug(f"Requesting transaction: {tx_signature} ({signature})")
            # Pass encoding and max_supported_transaction_version as keyword arguments!
            response = await loop.run_in_executor(
                None,
                lambda: self.client.get_transaction(
                    signature,
                    encoding="json",
                    max_supported_transaction_version=0
                )
            )
            if response is None or not hasattr(response, "value") or response.value is None:
                logger.error(f"Transaction not found or empty response for: {tx_signature}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Transaction {tx_signature} not found"
                )
            logger.debug(f"Transaction response for {tx_signature}: {response}")
            return response
        except Exception as e:
            logger.error(f"Error fetching transaction {tx_signature}: {e!r}\n{traceback.format_exc()}")
            raise

    def is_spl_token_transfer(self, logs: List[str]) -> bool:
        return any(
            "transfer" in log and "TokenkegQfeZyiNwAJbNbGKL67dsAqYh6UPjvF9ME8k8eX5" in log 
            for log in logs or []
        )

    def parse_spl_token_data(self, logs: List[str]) -> dict:
        token_data = {"token_symbol": "Unknown", "amount": 0.0, "decimals": 9, "mint_address": None}
        for log in logs or []:
            if "Program log:" in log:
                continue
            if "transfer" in log:
                parts = log.split()
                if len(parts) > 3:
                    try:
                        from_wallet = parts[2]
                        to_wallet = parts[4]
                        amount = float(parts[-2])
                        token_data.update({"from": from_wallet, "to": to_wallet, "amount": amount})
                    except Exception as e:
                        logger.warning(f"Error parsing SPL token data from log '{log}': {e!r}\n{traceback.format_exc()}")
        return token_data

    @handle_rpc_errors
    async def parse_solana_transaction(self, tx_signature: str) -> dict:
        tx_resp = await self.get_transaction(tx_signature)
        if not hasattr(tx_resp, "value") or tx_resp.value is None:
            logger.error(f"Transaction response missing value for: {tx_signature}")
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {tx_signature} not found"
            )
        try:
            tx = tx_resp.value.transaction
            meta = tx_resp.value.meta
            message = tx.transaction.message
            account_keys = [str(pk) for pk in getattr(message, "account_keys", [])]
        except Exception as e:
            logger.error(f"Error extracting transaction/meta/message: {e!r}\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail="Malformed transaction response")

        try:
            timestamp = datetime.utcfromtimestamp(meta.block_time).isoformat()
        except Exception:
            timestamp = None

        transfers_SOL = []
        try:
            pre_balances = getattr(meta, "pre_balances", [])
            post_balances = getattr(meta, "post_balances", [])
            for i, post_balance in enumerate(post_balances):
                change = (post_balance - pre_balances[i]) / 1e9  # Lamports to SOL
                if change != 0:
                    transfers_SOL.append({
                        "wallet": account_keys[i] if i < len(account_keys) else "unknown",
                        "amount_change": change
                    })
        except Exception as e:
            logger.warning(f"Error parsing SOL transfers: {e!r}\n{traceback.format_exc()}")

        # SPL Token Transfers
        transfers_SPL = []
        logs = getattr(meta, "log_messages", []) or []
        if self.is_spl_token_transfer(logs):
            spl_data = self.parse_spl_token_data(logs)
            transfers_SPL.append(spl_data)

        logger.debug(f"Parsed tx {tx_signature}: SOL={transfers_SOL}, SPL={transfers_SPL}")
        return {
            "tx_hash": tx_signature,
            "account_keys": account_keys,
            "transfers_SOL": transfers_SOL,
            "transfers_SPL": transfers_SPL,
            "timestamp": timestamp,
        }

    @handle_rpc_errors
    async def get_next_transactions(self, wallet_address: str, limit: int = 1) -> List[str]:
        try:
            pubkey = PublicKey.from_string(wallet_address)
            loop = asyncio.get_running_loop()
            logger.debug(f"Fetching next transactions for wallet: {wallet_address}")
            resp = await loop.run_in_executor(
                None,
                lambda: self.client.get_signatures_for_address(pubkey, limit=limit)
            )
            sigs = [sig.signature.to_string() for sig in getattr(resp, "value", [])]
            logger.debug(f"Next transactions for wallet {wallet_address}: {sigs}")
            return sigs
        except Exception as e:
            logger.error(f"Error fetching wallet history for {wallet_address}: {e!r}\n{traceback.format_exc()}")
            raise

    @handle_rpc_errors
    async def track_transaction_chain(self, start_tx_hash: str, amount_SOL: float, max_depth: int = 10) -> List[TrackedTransaction]:
        visited_signatures: Set[str] = set()
        queue = [(start_tx_hash, amount_SOL)]
        result_transactions = []

        while queue and len(result_transactions) < max_depth:
            current_tx_hash, remaining_amount = queue.pop(0)
            if current_tx_hash in visited_signatures:
                logger.debug(f"Signature {current_tx_hash} already visited")
                continue
            visited_signatures.add(current_tx_hash)
            try:
                tx_data = await self.parse_solana_transaction(current_tx_hash)
            except HTTPException as he:
                logger.warning(f"Skipping tx {current_tx_hash} due to HTTPException: {he.detail}")
                continue
            except Exception as e:
                logger.error(f"Error parsing transaction {current_tx_hash}: {e!r}\n{traceback.format_exc()}")
                continue

            # Find sender and receiver with positive change (SOL)
            incoming_SOL = [t for t in tx_data["transfers_SOL"] if t["amount_change"] > 0]
            for incoming in incoming_SOL:
                from_wallet = tx_data["account_keys"][0] if tx_data["account_keys"] else "unknown"
                to_wallet = incoming["wallet"]
                transfer_amount = abs(incoming["amount_change"])
                tracked_tx = TrackedTransaction(
                    tx_hash=current_tx_hash,
                    from_wallet=from_wallet,
                    to_wallet=to_wallet,
                    amount=transfer_amount,
                    timestamp=tx_data["timestamp"],
                    value_in_target_currency=None,
                )
                result_transactions.append(tracked_tx)
                if len(result_transactions) < max_depth:
                    try:
                        next_signatures = await self.get_next_transactions(to_wallet, limit=1)
                        for sig in next_signatures:
                            if sig not in visited_signatures:
                                queue.append((sig, transfer_amount))
                    except Exception as e:
                        logger.warning(f"Error fetching next transactions for {to_wallet}: {e!r}\n{traceback.format_exc()}")

            # Handle SPL tokens if present
            for spl in tx_data["transfers_SPL"]:
                from_wallet = spl.get("from", "unknown")
                to_wallet = spl.get("to", "unknown")
                transfer_amount = spl.get("amount", 0.0)
                tracked_tx = TrackedTransaction(
                    tx_hash=current_tx_hash,
                    from_wallet=from_wallet,
                    to_wallet=to_wallet,
                    amount=transfer_amount,
                    timestamp=tx_data["timestamp"],
                    value_in_target_currency=None,
                )
                result_transactions.append(tracked_tx)
                if len(result_transactions) < max_depth:
                    try:
                        next_signatures = await self.get_next_transactions(to_wallet, limit=1)
                        for sig in next_signatures:
                            if sig not in visited_signatures:
                                queue.append((sig, transfer_amount))
                    except Exception as e:
                        logger.warning(f"Error fetching next SPL transactions for {to_wallet}: {e!r}\n{traceback.format_exc()}")

        logger.info(f"Tracked {len(result_transactions)} transactions in chain (max_depth={max_depth})")
        return result_transactions

    def detect_scenarios(self, transactions: List[TrackedTransaction]) -> Dict[str, Dict]:
        scenarios = []
        details = {}
        if any("Stake" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.delegated_staking)
            details[ScenarioType.delegated_staking] = {"validator": "Solana Validator A"}
        if any("Raydium" in t.to_wallet or "Orca" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.defi_deposit)
            details[ScenarioType.defi_deposit] = {"protocol": "Raydium", "pool": "SOL-USDC"}
        if any("NFTMarketplace" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.nft_investment)
            details[ScenarioType.nft_investment] = {"marketplace": "MagicEden", "nft_id": "ME_123456"}
        if any("USDC" in t.to_wallet or "StableCoin" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.converted_to_stablecoin)
            details[ScenarioType.converted_to_stablecoin] = {"target_token": "USDC"}
        if any("DonationWallet" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.donation_or_grant)
            details[ScenarioType.donation_or_grant] = {"organization": "Solana Foundation"}

        for tx in transactions:
            for bridge_name, bridge_info in self.KNOWN_BRIDGES.items():
                if any(prefix in tx.to_wallet for prefix in bridge_info["address_prefixes"]):
                    scenarios.append(ScenarioType.cross_chain_bridge)
                    details[ScenarioType.cross_chain_bridge] = {
                        "protocol": bridge_info["protocol"],
                        "target_chain": bridge_info["target_chain"],
                        "bridge_address_used": tx.to_wallet,
                        "tx_hash": tx.tx_hash
                    }
                    break

        if any("MultiSig" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.multi_sig_storage)
            details[ScenarioType.multi_sig_storage] = {"signers_required": 2}

        if any(t.amount < 0.001 for t in transactions):
            scenarios.append(ScenarioType.lost_or_dust)
            details[ScenarioType.lost_or_dust] = {"threshold_sol": 0.001}

        logger.info(f"Scenarios detected: {scenarios}, details: {details}")
        return {"scenarios": scenarios, "details": details}
