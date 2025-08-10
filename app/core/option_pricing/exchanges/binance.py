import requests
from .base import ExchangeClient
from ..utils.exceptions import DataUnavailableError

class BinanceClient(ExchangeClient):
    def __init__(self):
        self.api_url = "https://api.binance.com/api/v3"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Binance"""
        url = f"{self.api_url}/ticker/price"
        params = {'symbol': f"{symbol}USDT"}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if 'price' in data:
                return float(data['price'])
            else:
                raise DataUnavailableError(f"Binance API error: {data}")
        except Exception as e:
            raise DataUnavailableError(f"Failed to get price from Binance: {str(e)}")
