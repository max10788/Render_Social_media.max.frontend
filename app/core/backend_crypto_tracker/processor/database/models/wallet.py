# app/core/backend_crypto_tracker/database/models/wallet.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class WalletType(Enum):
    DEV_WALLET = "dev_wallet"
    LIQUIDITY_WALLET = "liquidity_wallet"
    WHALE_WALLET = "whale_wallet"
    DEX_CONTRACT = "dex_contract"
    BURN_WALLET = "burn_wallet"
    CEX_WALLET = "cex_wallet"
    SNIPER_WALLET = "sniper_wallet"
    RUGPULL_SUSPECT = "rugpull_suspect"
    UNKNOWN = "unknown"

@dataclass
class WalletAnalysis:
    address: str
    wallet_type: WalletType
    balance: float
    percentage_of_supply: float
    transaction_count: int # Might need separate table/link
    first_transaction: datetime # Might need separate table/link
    last_transaction: datetime # Might need separate table/link
    risk_score: float

