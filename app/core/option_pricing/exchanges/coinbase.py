import requests
from .base import ExchangeClient
from ..utils.exceptions import DataUnavailableError

class CoinbaseClient(ExchangeClient):
    def __init__(self):
        self.api_url = "https://api.coinbase.com/v2"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Coinbase"""
        url = f"{self.api_url}/prices/{symbol}-USD/spot"
        
        try:
            response = requests.get(url)
            data = response.json()
            
            if 'data' in data and 'amount' in data['data']:
                return float(data['data']['amount'])
            else:
                raise DataUnavailableError(f"Coinbase API error: {data}")
        except Exception as e:
            raise DataUnavailableError(f"Failed to get price from Coinbase: {str(e)}")
