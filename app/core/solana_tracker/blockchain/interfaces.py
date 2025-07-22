from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

class TransactionDetail(BaseModel):
    tx_hash: str
    from_address: str
    to_address: Optional[str]
    value: Decimal
    fee: Decimal
    timestamp: datetime
    status: str  # "confirmed", "failed", "pending"
    operations: List[Dict]  # Token Transfers, Smart Contract Calls
    raw_data: Dict  # Blockchain-spezifische Rohdaten

class BlockchainConfig:
    def __init__(self, chain_id: str, name: str, 
                 primary_rpc: str, fallback_rpcs: List[str],
                 currency: str, decimals: int):
        self.chain_id = chain_id
        self.name = name
        self.primary_rpc = primary_rpc
        self.fallback_rpcs = fallback_rpcs
        self.currency = currency
        self.decimals = decimals

class BlockchainRepository(ABC):
    def __init__(self, config: BlockchainConfig):
        self.config = config
    
    @abstractmethod
    async def get_transaction(self, tx_hash: str) -> TransactionDetail:
        pass
    
    @abstractmethod
    async def get_transactions_for_address(self, address: str, limit: int) -> List[TransactionDetail]:
        pass
    
    @abstractmethod
    async def get_balance(self, address: str) -> Decimal:
        pass
    
    @abstractmethod
    async def get_latest_block(self) -> int:
        pass
