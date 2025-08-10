import requests
from typing import List
from .base import BlockchainClient
from ..utils.exceptions import DataUnavailableError

class SolanaClient(BlockchainClient):
    def __init__(self):
        self.api_url = "https://api.mainnet-beta.solana.com"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Solana"""
        if symbol.upper() == "SOL":
            try:
                # Hier würde die tatsächliche Implementierung stehen
                # Für dieses Beispiel geben wir einen Dummy-Wert zurück
                return 100.0
            except Exception as e:
                raise DataUnavailableError(f"Failed to get SOL price: {str(e)}")
        else:
            raise DataUnavailableError(f"Price for {symbol} not implemented")
    
    def get_historical_prices(self, symbol: str, days: int) -> List[float]:
        """Holt historische Preise von Solana"""
        # Implementierung würde hier erfolgen
        raise DataUnavailableError("Historical prices not implemented")
