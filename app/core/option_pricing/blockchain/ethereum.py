import requests
from typing import List
from .base import BlockchainClient
from ..utils.exceptions import DataUnavailableError

class EthereumClient(BlockchainClient):
    def __init__(self):
        self.api_url = "https://api.etherscan.io/api"
        self.api_key = "YOUR_ETHERSCAN_API_KEY"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Etherscan"""
        if symbol.upper() == "ETH":
            params = {
                'module': 'stats',
                'action': 'ethprice',
                'apikey': self.api_key
            }
            
            try:
                response = requests.get(self.api_url, params=params)
                data = response.json()
                
                if data['status'] == '1':
                    return float(data['result']['ethusd'])
                else:
                    raise DataUnavailableError(f"Etherscan API error: {data['message']}")
            except Exception as e:
                raise DataUnavailableError(f"Failed to get ETH price: {str(e)}")
        else:
            # Für andere Tokens müsste man den Preis über DEXs abfragen
            raise DataUnavailableError(f"Price for {symbol} not implemented")
    
    def get_historical_prices(self, symbol: str, days: int) -> List[float]:
        """Holt historische Preise von Etherscan"""
        # Implementierung würde hier erfolgen
        # Für echte Implementierung müsste man auf einen anderen Dienst zurückgreifen
        raise DataUnavailableError("Historical prices not implemented")
