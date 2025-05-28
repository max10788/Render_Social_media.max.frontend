from fastapi import APIRouter, HTTPException
from typing import List, Set, Dict, Optional
from solana.rpc.api import Client
from solders.pubkey import Pubkey as PublicKey
from solana.rpc.types import TxOpts
from datetime import datetime

# Importiere deine Schemas
from .schemas import (
    TransactionTrackRequest,
    TransactionTrackResponse,
    TrackedTransaction,
    ScenarioType,
    FinalStatusEnum
)

router = APIRouter()

# Solana RPC-Client
SOLANA_RPC_URL = "https://api.devnet.solana.com "
solana_client = Client(SOLANA_RPC_URL)

# Bekannte Bridge-Adressen für Solana
KNOWN_BRIDGES = {
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

def is_spl_token_transfer(logs: List[str]) -> bool:
    return any("transfer" in log and "TokenkegQfeZyiNwAJbNbGKL67dsAqYh6UPjvF9ME8k8eX5" in log for log in logs)

def parse_spl_token_data(logs: List[str]) -> dict:
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
                    pass
    return token_data

def parse_solana_transaction(tx_signature: str) -> dict:
    try:
        tx_resp = solana_client.get_transaction(tx_signature, "json", TxOpts(encoding="json"))
        if not tx_resp.value:
            raise HTTPException(status_code=404, detail=f"Transaction {tx_signature} not found")

        tx = tx_resp.value.transaction
        meta = tx_resp.value.meta
        message = tx.transaction.message
        account_keys = [str(pk) for pk in message.account_keys]

        # Extrahiere Timestamp
        timestamp = datetime.utcfromtimestamp(meta.block_time).isoformat()

        # Finde alle Überweisungen (SOL)
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

        # Finde SPL-Token Transfers
        transfers_SPL = []
        logs = meta.log_messages or []
        if is_spl_token_transfer(logs):
            spl_data = parse_spl_token_data(logs)
            transfers_SPL.append(spl_data)

        return {
            "tx_hash": tx_signature,
            "account_keys": account_keys,
            "transfers_SOL": transfers_SOL,
            "transfers_SPL": transfers_SPL,
            "timestamp": timestamp,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing transaction {tx_signature}: {str(e)}")

def track_transaction_chain(start_tx_hash: str, amount_SOL: float, max_depth: int = 10) -> List[TrackedTransaction]:
    visited_signatures: Set[str] = set()
    queue = [(start_tx_hash, amount_SOL)]
    result_transactions = []

    while queue and len(result_transactions) < max_depth:
        current_tx_hash, remaining_amount = queue.pop(0)
        if current_tx_hash in visited_signatures:
            continue

        visited_signatures.add(current_tx_hash)
        tx_data = parse_solana_transaction(current_tx_hash)

        # Finde Sender und Empfänger mit positiver Änderung (SOL)
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

            # Rekursiv weiterverfolgen
            if len(result_transactions) < max_depth:
                next_signatures = get_next_transactions(to_wallet, limit=1)
                for sig in next_signatures:
                    queue.append((sig, transfer_amount))

        # Behandle SPL-Token falls vorhanden
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

            # Rekursiv weiterverfolgen
            if len(result_transactions) < max_depth:
                next_signatures = get_next_transactions(to_wallet, limit=1)
                for sig in next_signatures:
                    queue.append((sig, transfer_amount))

    return result_transactions

def get_next_transactions(wallet_address: str, limit: int = 1) -> List[str]:
    try:
        pubkey = PublicKey(wallet_address)
        resp = solana_client.get_signatures_for_address(pubkey, limit=limit)
        return [sig.signature.hex() for sig in resp.value]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching wallet history: {str(e)}")

def detect_scenarios(transactions: List[TrackedTransaction]) -> Dict[ScenarioType, Dict]:
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
        for bridge_name, bridge_info in KNOWN_BRIDGES.items():
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
