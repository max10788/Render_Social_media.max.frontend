from abc import ABC, abstractmethod

class ExchangeClient(ABC):
    @abstractmethod
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von der Börse"""
        pass
