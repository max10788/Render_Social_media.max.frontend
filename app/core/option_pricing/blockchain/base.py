from abc import ABC, abstractmethod
from typing import List

class BlockchainClient(ABC):
    @abstractmethod
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis eines Assets"""
        pass
    
    @abstractmethod
    def get_historical_prices(self, symbol: str, days: int) -> List[float]:
        """Holt historische Preise für die Volatilitätsberechnung"""
        pass
