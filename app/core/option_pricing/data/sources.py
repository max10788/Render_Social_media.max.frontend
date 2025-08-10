from typing import Dict, List, Optional
from ..blockchain.base import BlockchainClient
from ..exchanges.base import ExchangeClient
from ..utils.exceptions import DataUnavailableError

class DataSourceManager:
    def __init__(self):
        self.blockchain_clients = {
            'ethereum': None,  # Wird lazy initialisiert
            'solana': None
        }
        self.exchange_clients = {
            'binance': None,
            'coinbase': None
        }
    
    def get_current_price(self, symbol: str, blockchain: str, exchanges: Optional[List[str]] = None) -> float:
        """Holt den aktuellen Preis von der Blockchain oder Börsen"""
        try:
            # Zuerst versuchen, den Preis von der Blockchain zu bekommen
            client = self._get_blockchain_client(blockchain)
            return client.get_current_price(symbol)
        except DataUnavailableError:
            # Fallback zu Börsendaten
            if exchanges:
                for exchange in exchanges:
                    try:
                        client = self._get_exchange_client(exchange)
                        return client.get_current_price(symbol)
                    except Exception:
                        continue
            raise DataUnavailableError(f"Price data unavailable for {symbol}")
    
    def get_historical_prices(self, symbol: str, blockchain: str, days: int = 30) -> List[float]:
        """Holt historische Preise für die Volatilitätsberechnung"""
        client = self._get_blockchain_client(blockchain)
        return client.get_historical_prices(symbol, days)
    
    def get_volatility(self, symbol: str, blockchain: str, days: int = 30) -> float:
        """Berechnet die Volatilität aus historischen Preisen"""
        prices = self.get_historical_prices(symbol, blockchain, days)
        returns = [prices[i+1]/prices[i] - 1 for i in range(len(prices)-1)]
        return np.std(returns) * np.sqrt(365)  # Annualisierte Volatilität
    
    def _get_blockchain_client(self, blockchain: str) -> BlockchainClient:
        """Lazy Initialisierung der Blockchain-Clients"""
        if self.blockchain_clients[blockchain] is None:
            if blockchain == 'ethereum':
                from ..blockchain.ethereum import EthereumClient
                self.blockchain_clients[blockchain] = EthereumClient()
            elif blockchain == 'solana':
                from ..blockchain.solana import SolanaClient
                self.blockchain_clients[blockchain] = SolanaClient()
        return self.blockchain_clients[blockchain]
    
    def _get_exchange_client(self, exchange: str) -> ExchangeClient:
        """Lazy Initialisierung der Börsen-Clients"""
        if self.exchange_clients[exchange] is None:
            if exchange == 'binance':
                from ..exchanges.binance import BinanceClient
                self.exchange_clients[exchange] = BinanceClient()
            elif exchange == 'coinbase':
                from ..exchanges.coinbase import CoinbaseClient
                self.exchange_clients[exchange] = CoinbaseClient()
        return self.exchange_clients[exchange]
