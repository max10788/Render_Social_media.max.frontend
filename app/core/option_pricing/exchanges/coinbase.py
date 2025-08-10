import requests
from typing import List, Dict, Any
from .base import ExchangeClient
from ..utils.exceptions import ExchangeError

class CoinbaseClient(ExchangeClient):
    def __init__(self, api_url: str = None):
        self.api_url = api_url or "https://api.coinbase.com/v2"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Coinbase"""
        url = f"{self.api_url}/prices/{symbol}-USD/spot"
        
        try:
            response = requests.get(url)
            data = response.json()
            
            if 'data' in data and 'amount' in data['data']:
                return float(data['data']['amount'])
            else:
                raise ExchangeError(f"Coinbase API error: {data}")
        except Exception as e:
            raise ExchangeError(f"Failed to get price from Coinbase: {str(e)}")
    
    def get_historical_prices(self, symbol: str, days: int = 30) -> List[float]:
        """Holt historische Preise von Coinbase"""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        url = f"{self.api_url}/prices/{symbol}-USD/historic"
        params = {
            'start': start_date.strftime('%Y-%m-%d'),
            'end': end_date.strftime('%Y-%m-%d'),
            'granularity': 86400  # 1 Tag
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if 'data' in data and 'prices' in data['data']:
                return [float(price['price']) for price in data['data']['prices']]
            else:
                raise ExchangeError(f"Coinbase API error: {data}")
        except Exception as e:
            raise ExchangeError(f"Failed to get historical prices from Coinbase: {str(e)}")
    
    def get_exchange_rates(self, base_currency: str = 'BTC') -> Dict[str, float]:
        """Holt Wechselkurse von Coinbase"""
        url = f"{self.api_url}/exchange-rates"
        params = {'currency': base_currency}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if 'data' in data and 'rates' in data['data']:
                return {k: float(v) for k, v in data['data']['rates'].items()}
            else:
                raise ExchangeError(f"Coinbase API error: {data}")
        except Exception as e:
            raise ExchangeError(f"Failed to get exchange rates from Coinbase: {str(e)}")
