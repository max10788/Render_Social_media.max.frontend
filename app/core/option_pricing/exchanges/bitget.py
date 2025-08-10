import requests
from typing import List, Dict, Any
from .base import ExchangeClient
from ..utils.exceptions import ExchangeError

class BitgetClient(ExchangeClient):
    def __init__(self, api_url: str = None):
        self.api_url = api_url or "https://api.bitget.com/api/spot/v1"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Bitget"""
        url = f"{self.api_url}/ticker"
        params = {'symbol': f"{symbol}USDT"}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data.get('code') == '00000' and 'data' in data:
                return float(data['data']['closePr'])
            else:
                raise ExchangeError(f"Bitget API error: {data.get('msg', 'Unknown error')}")
        except Exception as e:
            raise ExchangeError(f"Failed to get price from Bitget: {str(e)}")
    
    def get_historical_prices(self, symbol: str, days: int = 30) -> List[float]:
        """Holt historische Schlusskurse von Bitget"""
        url = f"{self.api_url}/candles"
        params = {
            'symbol': f"{symbol}USDT",
            'granularity': '1D',  # 1 Tag
            'limit': days
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data.get('code') == '00000' and 'data' in data:
                # Bitget gibt Daten in umgekehrter chronologischer Reihenfolge zurück
                candles = data['data']
                closing_prices = [float(candle[4]) for candle in candles]
                closing_prices.reverse()  # Umkehren für chronologische Reihenfolge
                return closing_prices
            else:
                raise ExchangeError(f"Bitget API error: {data.get('msg', 'Unknown error')}")
        except Exception as e:
            raise ExchangeError(f"Failed to get historical prices from Bitget: {str(e)}")
    
    def get_24h_stats(self, symbol: str) -> Dict[str, Any]:
        """Holt 24-Stunden-Statistiken von Bitget"""
        url = f"{self.api_url}/ticker"
        params = {'symbol': f"{symbol}USDT"}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data.get('code') == '00000' and 'data' in data:
                return data['data']
            else:
                raise ExchangeError(f"Bitget API error: {data.get('msg', 'Unknown error')}")
        except Exception as e:
            raise ExchangeError(f"Failed to get 24h stats from Bitget: {str(e)}")
