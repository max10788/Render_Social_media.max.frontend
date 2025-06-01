from fastapi import APIRouter, HTTPException
from typing import List, Set, Dict, Optional
from solana.rpc.api import Client
from solders.pubkey import Pubkey as PublicKey
from solders.signature import Signature
from solana.rpc.types import TxOpts
from datetime import datetime
import base58
import logging
import asyncio
from functools import wraps
# Import your schemas
from app.models.schemas import (
    TransactionTrackRequest,
    TransactionTrackResponse,
    TrackedTransaction,
    ScenarioType,
    FinalStatusEnum
)

# Configure logging
logger = logging.getLogger(__name__)

def handle_rpc_errors(func):
    """Decorator to handle RPC errors consistently."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValueError as ve:
            logger.error(f"Value error in {func.__name__}: {str(ve)}")
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    return wrapper

class SolanaClient:
    def __init__(self, rpc_url: str = "https://api.devnet.solana.com"): 
        """Initialize SolanaClient with RPC URL."""
        self.rpc_url = rpc_url
        self.client = Client(rpc_url)  # Sync client
        # Known bridge addresses for Solana
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
            # First try direct conversion
            return Signature.from_string(signature_str)
        except ValueError:
            try:
                # Try base58 decode if direct conversion fails
                decoded = base58.b58decode(signature_str)
                return Signature.from_bytes(decoded)
            except Exception as e:
                logger.error(f"Failed to convert signature {signature_str}: {str(e)}")
                raise ValueError(f"Invalid signature format: {str(e)}")

    @handle_rpc_errors
    async def get_transaction(self, tx_signature: str):
        """Get transaction details from Solana blockchain."""
        signature = self._convert_to_signature(tx_signature)

        # Run sync call in executor
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, self.client.get_transaction, signature, "json", 0)
        
        if response is None or response.value is None:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {tx_signature} not found"
            )
        return response

    def is_spl_token_transfer(self, logs: List[str]) -> bool:
        """Check if transaction logs contain SPL token transfer."""
        return any("transfer" in log and "TokenkegQfeZyiNwAJbNbGKL67dsAqYh6UPjvF9ME8k8eX5" in log for log in logs)

    def parse_spl_token_data(self, logs: List[str]) -> dict:
        """Parse SPL token transfer data from transaction logs."""
        token_data = {"token_symbol": "Unknown", "amount": 0.0, "decimals": 9, "mint_address": None}
        for log in logs:
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
                        logger.warning(f"Error parsing SPL token data: {str(e)}")
        return token_data

    @handle_rpc_errors
    async def parse_solana_transaction(self, tx_signature: str) -> dict:
        """Parse Solana transaction details."""
        tx_resp = await self.get_transaction(tx_signature)
        if not tx_resp.value:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction {tx_signature} not found"
            )
        tx = tx_resp.value.transaction
        meta = tx_resp.value.meta
        message = tx.transaction.message
        account_keys = [str(pk) for pk in message.account_keys]
        # Extract timestamp
        timestamp = datetime.utcfromtimestamp(meta.block_time).isoformat()

        # Find all SOL transfers
        transfers_SOL = []
        pre_balances = meta.pre_balances
        post_balances = meta.post_balances
        for i, post_balance in enumerate(post_balances):
            change = (post_balance - pre_balances[i]) / 1e9  # Lamports to SOL
            if change != 0:
                transfers_SOL.append({
                    "wallet": account_keys[i],
                    "amount_change": change
                })

        # Find SPL token transfers
        transfers_SPL = []
        logs = meta.log_messages or []
        if self.is_spl_token_transfer(logs):
            spl_data = self.parse_spl_token_data(logs)
            transfers_SPL.append(spl_data)

        return {
            "tx_hash": tx_signature,
            "account_keys": account_keys,
            "transfers_SOL": transfers_SOL,
            "transfers_SPL": transfers_SPL,
            "timestamp": timestamp,
        }

    @handle_rpc_errors
    async def get_next_transactions(self, wallet_address: str, limit: int = 1) -> List[str]:
        """Get next transactions for a wallet address."""
        pubkey = PublicKey.from_string(wallet_address)

        # Run sync call in executor
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, self.client.get_signatures_for_address, pubkey, limit)

        return [sig.signature.to_string() for sig in resp.value]

    @handle_rpc_errors
    async def track_transaction_chain(self, start_tx_hash: str, amount_SOL: float, max_depth: int = 10) -> List[TrackedTransaction]:
        """Track a chain of transactions starting from a given hash."""
        visited_signatures: Set[str] = set()
        queue = [(start_tx_hash, amount_SOL)]
        result_transactions = []

        while queue and len(result_transactions) < max_depth:
            current_tx_hash, remaining_amount = queue.pop(0)
            if current_tx_hash in visited_signatures:
                continue
            visited_signatures.add(current_tx_hash)
            tx_data = await self.parse_solana_transaction(current_tx_hash)

            # Find sender and receiver with positive change (SOL)
            incoming_SOL = [t for t in tx_data["transfers_SOL"] if t["amount_change"] > 0]
            for incoming in incoming_SOL:
                from_wallet = tx_data["account_keys"][0]
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
                # Follow recursively
                if len(result_transactions) < max_depth:
                    next_signatures = await self.get_next_transactions(to_wallet, limit=1)
                    for sig in next_signatures:
                        queue.append((sig, transfer_amount))

            # Handle SPL tokens if present
            for spl in tx_data["transfers_SPL"]:
                from_wallet = spl["from"]
                to_wallet = spl["to"]
                transfer_amount = spl["amount"]
                tracked_tx = TrackedTransaction(
                    tx_hash=current_tx_hash,
                    from_wallet=from_wallet or "unknown",
                    to_wallet=to_wallet or "unknown",
                    amount=transfer_amount,
                    timestamp=tx_data["timestamp"],
                    value_in_target_currency=None,
                )
                result_transactions.append(tracked_tx)
                # Follow recursively
                if len(result_transactions) < max_depth:
                    next_signatures = await self.get_next_transactions(to_wallet, limit=1)
                    for sig in next_signatures:
                        queue.append((sig, transfer_amount))

        return result_transactions

    def detect_scenarios(self, transactions: List[TrackedTransaction]) -> Dict[str, Dict]:
        """Detect transaction scenarios."""
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
                    break  # Nur einmal pro Brücke hinzufügen

        if any("MultiSig" in t.to_wallet for t in transactions):
            scenarios.append(ScenarioType.multi_sig_storage)
            details[ScenarioType.multi_sig_storage] = {"signers_required": 2}

        if any(t.amount < 0.001 for t in transactions):  # Kleinstbeträge könnten als "lost"
            scenarios.append(ScenarioType.lost_or_dust)
            details[ScenarioType.lost_or_dust] = {"threshold_sol": 0.001}

        return {"scenarios": scenarios, "details": details}
