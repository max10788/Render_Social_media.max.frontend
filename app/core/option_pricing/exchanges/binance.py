import requests
from typing import List, Dict, Any
from .base import ExchangeClient
from ..utils.exceptions import ExchangeError

class BinanceClient(ExchangeClient):
    def __init__(self, api_url: str = None):
        self.api_url = api_url or "https://api.binance.com/api/v3"
    
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
                raise ExchangeError(f"Binance API error: {data}")
        except Exception as e:
            raise ExchangeError(f"Failed to get price from Binance: {str(e)}")
    
    def get_historical_prices(self, symbol: str, days: int = 30) -> List[float]:
        """Holt historische Schlusskurse von Binance"""
        url = f"{self.api_url}/klines"
        params = {
            'symbol': f"{symbol}USDT",
            'interval': '1d',
            'limit': days
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            # Extrahiere die Schlusskurse (Index 4 im Array)
            return [float(candle[4]) for candle in data]
        except Exception as e:
            raise ExchangeError(f"Failed to get historical prices from Binance: {str(e)}")
    
    def get_24h_stats(self, symbol: str) -> Dict[str, Any]:
        """Holt 24-Stunden-Statistiken von Binance"""
        url = f"{self.api_url}/ticker/24hr"
        params = {'symbol': f"{symbol}USDT"}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            return data
        except Exception as e:
            raise ExchangeError(f"Failed to get 24h stats from Binance: {str(e)}")
