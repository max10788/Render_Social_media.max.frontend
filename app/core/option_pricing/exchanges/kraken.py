import requests
from typing import List, Dict, Any
from .base import ExchangeClient
from ..utils.exceptions import ExchangeError

class KrakenClient(ExchangeClient):
    def __init__(self):
        self.api_url = "https://api.kraken.com/0/public"
    
    def get_current_price(self, symbol: str) -> float:
        """Holt den aktuellen Preis von Kraken"""
        # Kraken verwendet manchmal andere Symbole, z.B. XBT statt BTC
        kraken_symbol = self._convert_symbol(symbol)
        url = f"{self.api_url}/Ticker"
        params = {'pair': kraken_symbol}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['error']:
                raise ExchangeError(f"Kraken API error: {data['error']}")
            
            # Das Ergebnis ist ein Dict mit einem Key (z.B. 'XXBTZUSD')
            pair_key = list(data['result'].keys())[0]
            ticker_data = data['result'][pair_key]
            
            # Der letzte Preis ist im 'c'-Array (last trade price)
            last_price = float(ticker_data['c'][0])
            return last_price
        except Exception as e:
            raise ExchangeError(f"Failed to get price from Kraken: {str(e)}")
    
    def get_historical_prices(self, symbol: str, days: int = 30) -> List[float]:
        """Holt historische Schlusskurse von Kraken"""
        kraken_symbol = self._convert_symbol(symbol)
        url = f"{self.api_url}/OHLC"
        params = {
            'pair': kraken_symbol,
            'interval': 1440,  # 1 Tag in Minuten
            'since': None  # Standardmäßig die letzten Daten
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['error']:
                raise ExchangeError(f"Kraken API error: {data['error']}")
            
            # Das Ergebnis ist ein Dict mit einem Key (z.B. 'XXBTZUSD')
            pair_key = list(data['result'].keys())[0]
            ohlc_data = data['result'][pair_key]
            
            # Extrahiere die Schlusskurse (Index 4 im Array)
            # Beachte: Die Daten sind in umgekehrter chronologischer Reihenfolge
            closing_prices = [float(candle[4]) for candle in ohlc_data]
            # Wir kehren die Liste um, um chronologische Reihenfolge zu haben
            closing_prices.reverse()
            
            # Wir nehmen nur die letzten 'days' Tage
            return closing_prices[-days:] if len(closing_prices) >= days else closing_prices
        except Exception as e:
            raise ExchangeError(f"Failed to get historical prices from Kraken: {str(e)}")
    
    def get_24h_stats(self, symbol: str) -> Dict[str, Any]:
        """Holt 24-Stunden-Statistiken von Kraken"""
        kraken_symbol = self._convert_symbol(symbol)
        url = f"{self.api_url}/Ticker"
        params = {'pair': kraken_symbol}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['error']:
                raise ExchangeError(f"Kraken API error: {data['error']}")
            
            pair_key = list(data['result'].keys())[0]
            return data['result'][pair_key]
        except Exception as e:
            raise ExchangeError(f"Failed to get 24h stats from Kraken: {str(e)}")
    
    def _convert_symbol(self, symbol: str) -> str:
        """Konvertiert das Symbol in das Kraken-Format"""
        # Kraken verwendet spezielle Symbole, z.B.:
        # BTC -> XBT, ETH -> XETH, etc.
        # Für USD-Paare: XBTUSD, ETHUSD, etc.
        if symbol.upper() == 'BTC':
            return 'XBTUSD'
        elif symbol.upper() == 'ETH':
            return 'ETHUSD'
        else:
            # Für andere Symbole versuchen wir es direkt mit dem Symbol + USD
            return f"{symbol.upper()}USD"
