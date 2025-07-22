from abc import ABC, abstractmethod
from typing import Dict
from app.core.solana_tracker.models.transaction import TransactionDetail

class ScenarioRule(ABC):
    @property
    @abstractmethod
    def type(self) -> str:
        pass

    @property
    @abstractmethod
    def confidence(self) -> float:
        pass

    @abstractmethod
    def matches(self, tx: TransactionDetail) -> bool:
        pass

    @abstractmethod
    def get_metadata(self, tx: TransactionDetail) -> Dict:
        pass
