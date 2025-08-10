import asyncio
import numpy as np
from typing import Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta
from ..utils.exceptions import DataFetchError, ValidationError
from ..blockchain.base import BaseBlockchainClient
from ..exchanges.base import BaseExchangeClient
import logging

logger = logging.getLogger(__name__)

class DataAggregator:
    """
    Aggregates data from multiple sources (blockchain clients and exchanges)
    to provide a unified view of cryptocurrency prices.
    """
    
    def __init__(self, 
                 blockchain_clients: Dict[str, BaseBlockchainClient] = None,
                 exchange_clients: Dict[str, BaseExchangeClient] = None,
                 exchange_priority: List[str] = None):
        """
        Initialize the data aggregator.
        
        Args:
            blockchain_clients: Dictionary mapping blockchain names to their clients
            exchange_clients: Dictionary mapping exchange names to their clients
            exchange_priority: List of exchange names in order of priority
        """
        self.blockchain_clients = blockchain_clients or {}
        self.exchange_clients = exchange_clients or {}
        self.exchange_priority = exchange_priority or []
        
        # Cache for storing fetched data
        self._price_cache = {}
        self._historical_price_cache = {}
        self._cache_expiry = {}
        
        # Default cache TTL (in seconds)
        self._price_cache_ttl = 60  # 1 minute for current prices
        self._historical_price_cache_ttl = 3600  # 1 hour for historical prices
    
    async def get_current_price(self, 
                               blockchain: str, 
                               token_address: str = None,
                               use_exchanges: bool = True) -> float:
        """
        Get the current price of a cryptocurrency from blockchain data or exchanges.
        
        Args:
            blockchain: Blockchain name (e.g., "ethereum", "solana")
            token_address: Optional token address (None for native currency)
            use_exchanges: Whether to fall back to exchange data if blockchain data is unavailable
            
        Returns:
            Current price in USD
        """
        # Check cache first
        cache_key = f"{blockchain}_{token_address or 'native'}_current"
        if self._is_cache_valid(cache_key, self._price_cache_ttl):
            return self._price_cache[cache_key]
        
        # Try to get price from blockchain client
        if blockchain in self.blockchain_clients:
            try:
                price = self.blockchain_clients[blockchain].get_current_price(token_address)
                self._update_cache(cache_key, price)
                return price
            except Exception as e:
                logger.warning(f"Failed to get price from {blockchain} blockchain client: {str(e)}")
        
        # Fall back to exchanges if enabled
        if use_exchanges:
            for exchange_name in self.exchange_priority:
                if exchange_name in self.exchange_clients:
                    try:
                        # For exchanges, we need to map blockchain and token to a trading pair
                        symbol = self._map_to_exchange_symbol(blockchain, token_address, exchange_name)
                        price = await self.exchange_clients[exchange_name].get_current_price(symbol)
                        self._update_cache(cache_key, price)
                        return price
                    except Exception as e:
                        logger.warning(f"Failed to get price from {exchange_name}: {str(e)}")
        
        raise DataFetchError(f"Unable to fetch current price for {blockchain} {token_address or 'native'}")
    
    async def get_historical_prices(self, 
                                   blockchain: str, 
                                   token_address: str = None,
                                   days: int = 30,
                                   use_exchanges: bool = True) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices for a cryptocurrency from blockchain data or exchanges.
        
        Args:
            blockchain: Blockchain name (e.g., "ethereum", "solana")
            token_address: Optional token address (None for native currency)
            days: Number of days of historical data to retrieve
            use_exchanges: Whether to fall back to exchange data if blockchain data is unavailable
            
        Returns:
            List of dictionaries with timestamp and price
        """
        # Check cache first
        cache_key = f"{blockchain}_{token_address or 'native'}_historical_{days}"
        if self._is_cache_valid(cache_key, self._historical_price_cache_ttl):
            return self._historical_price_cache[cache_key]
        
        # Try to get historical prices from blockchain client
        if blockchain in self.blockchain_clients:
            try:
                prices = self.blockchain_clients[blockchain].get_historical_prices(token_address, days)
                self._update_cache(cache_key, prices)
                return prices
            except Exception as e:
                logger.warning(f"Failed to get historical prices from {blockchain} blockchain client: {str(e)}")
        
        # Fall back to exchanges if enabled
        if use_exchanges:
            for exchange_name in self.exchange_priority:
                if exchange_name in self.exchange_clients:
                    try:
                        # For exchanges, we need to map blockchain and token to a trading pair
                        symbol = self._map_to_exchange_symbol(blockchain, token_address, exchange_name)
                        prices = await self.exchange_clients[exchange_name].get_historical_prices(symbol, days)
                        self._update_cache(cache_key, prices)
                        return prices
                    except Exception as e:
                        logger.warning(f"Failed to get historical prices from {exchange_name}: {str(e)}")
        
        raise DataFetchError(f"Unable to fetch historical prices for {blockchain} {token_address or 'native'}")
    
    async def get_correlation_matrix(self, 
                                    assets: List[Tuple[str, Optional[str]]],
                                    days: int = 30) -> np.ndarray:
        """
        Calculate the correlation matrix between multiple assets.
        
        Args:
            assets: List of tuples (blockchain, token_address)
            days: Number of days of historical data to use
            
        Returns:
            Correlation matrix as a numpy array
        """
        if len(assets) < 2:
            raise ValidationError("At least two assets are required to calculate correlation")
        
        # Fetch historical prices for all assets
        price_data = {}
        for blockchain, token_address in assets:
            try:
                prices = await self.get_historical_prices(blockchain, token_address, days)
                # Extract just the prices for correlation calculation
                price_data[(blockchain, token_address or "native")] = [p["price"] for p in prices]
            except Exception as e:
                logger.error(f"Failed to fetch historical prices for {blockchain} {token_address or 'native'}: {str(e)}")
                raise DataFetchError(f"Failed to fetch historical prices for correlation calculation: {str(e)}")
        
        # Convert to numpy array
        price_matrix = np.array(list(price_data.values()))
        
        # Calculate correlation matrix
        correlation_matrix = np.corrcoef(price_matrix)
        
        return correlation_matrix
    
    def _map_to_exchange_symbol(self, blockchain: str, token_address: str, exchange: str) -> str:
        """
        Map a blockchain and token address to an exchange symbol.
        
        Args:
            blockchain: Blockchain name
            token_address: Token address (None for native currency)
            exchange: Exchange name
            
        Returns:
            Exchange symbol
        """
        # This is a simplified mapping
        # In a real-world scenario, you would have a more sophisticated mapping system
        # possibly using a database or configuration file
        
        if blockchain.lower() == "ethereum":
            if token_address is None:
                return "ETHUSDT"  # ETH/USDT pair
            else:
                # For ERC-20 tokens, we would need a mapping from token address to symbol
                # This is a simplified example
                return "TOKENUSDT"  # Placeholder
        
        elif blockchain.lower() == "solana":
            if token_address is None:
                return "SOLUSDT"  # SOL/USDT pair
            else:
                # For SPL tokens, we would need a mapping from token address to symbol
                # This is a simplified example
                return "TOKENUSDT"  # Placeholder
        
        else:
            raise ValidationError(f"Unsupported blockchain: {blockchain}")
    
    def _is_cache_valid(self, key: str, ttl: int) -> bool:
        """
        Check if a cache entry is still valid.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            True if cache entry is valid, False otherwise
        """
        if key not in self._cache_expiry:
            return False
        
        expiry_time = self._cache_expiry[key]
        current_time = datetime.now().timestamp()
        
        return current_time < expiry_time
    
    def _update_cache(self, key: str, value: any):
        """
        Update a cache entry.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self._price_cache[key] = value
        self._historical_price_cache[key] = value
        
        # Set expiry time
        current_time = datetime.now().timestamp()
        self._cache_expiry[key] = current_time + self._price_cache_ttl
    
    def clear_cache(self):
        """Clear all cached data."""
        self._price_cache.clear()
        self._historical_price_cache.clear()
        self._cache_expiry.clear()
