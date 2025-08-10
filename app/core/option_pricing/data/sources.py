from typing import Dict, List, Optional
from ..blockchain.base import BlockchainClient
from ..exchanges.base import ExchangeClient
from ..exchanges.binance import BinanceClient
from ..exchanges.coinbase import CoinbaseClient
from ..exchanges.kraken import KrakenClient
from ..exchanges.bitget import BitgetClient
from ..utils.exceptions import DataUnavailableError
import os
from dotenv import load_dotenv

load_dotenv()

class DataSourceManager:
    def __init__(self):
        self.blockchain_clients = {
            'ethereum': None,
            'solana': None
        }
        self.exchange_clients = {
            'binance': None,
            'coinbase': None,
            'kraken': None,
            'bitget': None
        }
        
        # API Endpoints aus .env lesen
        self.endpoints = {
            'ethereum': os.getenv('ETHEREUM_API_URL', 'https://api.etherscan.io/api'),
            'solana': os.getenv('SOLANA_API_URL', 'https://api.mainnet-beta.solana.com'),
            'binance': os.getenv('BINANCE_API_URL', 'https://api.binance.com/api/v3'),
            'coinbase': os.getenv('COINBASE_API_URL', 'https://api.coinbase.com/v2'),
            'kraken': os.getenv('KRAKEN_API_URL', 'https://api.kraken.com/0/public'),
            'bitget': os.getenv('BITGET_API_URL', 'https://api.bitget.com/api/spot/v1')
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
        import numpy as np
        return np.std(returns) * np.sqrt(365)  # Annualisierte Volatilität
    
    def _get_blockchain_client(self, blockchain: str) -> BlockchainClient:
        """Lazy Initialisierung der Blockchain-Clients"""
        if self.blockchain_clients[blockchain] is None:
            if blockchain == 'ethereum':
                from ..blockchain.ethereum import EthereumClient
                self.blockchain_clients[blockchain] = EthereumClient(self.endpoints['ethereum'])
            elif blockchain == 'solana':
                from ..blockchain.solana import SolanaClient
                self.blockchain_clients[blockchain] = SolanaClient(self.endpoints['solana'])
        return self.blockchain_clients[blockchain]
    
    def _get_exchange_client(self, exchange: str) -> ExchangeClient:
        """Lazy Initialisierung der Börsen-Clients"""
        if self.exchange_clients[exchange] is None:
            if exchange == 'binance':
                self.exchange_clients[exchange] = BinanceClient(self.endpoints['binance'])
            elif exchange == 'coinbase':
                self.exchange_clients[exchange] = CoinbaseClient(self.endpoints['coinbase'])
            elif exchange == 'kraken':
                self.exchange_clients[exchange] = KrakenClient(self.endpoints['kraken'])
            elif exchange == 'bitget':
                self.exchange_clients[exchange] = BitgetClient(self.endpoints['bitget'])
        return self.exchange_clients[exchange]
