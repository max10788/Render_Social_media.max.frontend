# app/core/backend_crypto_tracker/database/models/token.py
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TokenData:
    address: str
    name: str
    symbol: str
    market_cap: float
    volume_24h: float
    liquidity: float # Might need separate table/link
    holders_count: int # Might need separate table/link
    contract_verified: bool # Might need separate table/link
    creation_date: datetime # Might need separate table/link
    chain: str # 'ethereum' or 'bsc'

