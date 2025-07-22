from abc import ABC, abstractmethod
from decimal import Decimal
from typing import List
from app.core.solana_tracker.models.transaction import TransactionDetail

class IEnhancedSolanaRepository(ABC):
    @abstractmethod
    async def get_transaction(self, tx_hash: str) -> TransactionDetail:
        pass

    @abstractmethod
    async def get_balance(self, address: str) -> Decimal:
        pass

    @abstractmethod
    async def get_transactions_for_address(self, address: str, limit: int) -> List[TransactionDetail]:
        pass
