# services/multichain/token_registry.py
import asyncio
import logging
from typing import Dict, List, Optional, Any
from utils.logger import get_logger
from utils.cache import Cache
from utils.exceptions import APIException, DataNotFoundException
from processor.database.models.token import Token
from processor.database.manager import DatabaseManager

logger = get_logger(__name__)

class TokenRegistry:
    """Central registry for token information across multiple blockchains"""
    
    def __init__(self, cache_ttl: int = 3600):
        self.cache = Cache(ttl=cache_ttl)
        self.db_manager = None
        self._tokens_by_address = {}
        self._tokens_by_symbol = {}
        self._initialized = False
    
    async def initialize(self):
        """Initialize the token registry with data from the database"""
        if self._initialized:
            return
            
        self.db_manager = DatabaseManager()
        await self.db_manager.initialize()
        
        try:
            # Load all tokens from the database
            tokens = await self.db_manager.get_all_tokens()
            
            # Build in-memory indexes
            for token in tokens:
                key = f"{token.chain}:{token.address.lower()}"
                self._tokens_by_address[key] = token
                
                symbol_key = f"{token.chain}:{token.symbol.lower()}"
                if symbol_key not in self._tokens_by_symbol:
                    self._tokens_by_symbol[symbol_key] = []
                self._tokens_by_symbol[symbol_key].append(token)
            
            self._initialized = True
            logger.info(f"Token registry initialized with {len(tokens)} tokens")
            
        except Exception as e:
            logger.error(f"Failed to initialize token registry: {e}")
            raise
    
    async def close(self):
        """Close database connections"""
        if self.db_manager:
            await self.db_manager.close()
    
    async def get_token_by_address(self, address: str, chain: str) -> Optional[Token]:
        """Get token by address and chain"""
        if not self._initialized:
            await self.initialize()
            
        key = f"{chain}:{address.lower()}"
        
        # Try cache first
        cached_token = await self.cache.get(key)
        if cached_token:
            return cached_token
            
        # Try in-memory index
        token = self._tokens_by_address.get(key)
        if token:
            await self.cache.set(key, token)
            return token
            
        # Try database
        if self.db_manager:
            token = await self.db_manager.get_token_by_address(address, chain)
            if token:
                # Update indexes
                self._tokens_by_address[key] = token
                
                symbol_key = f"{chain}:{token.symbol.lower()}"
                if symbol_key not in self._tokens_by_symbol:
                    self._tokens_by_symbol[symbol_key] = []
                if token not in self._tokens_by_symbol[symbol_key]:
                    self._tokens_by_symbol[symbol_key].append(token)
                
                await self.cache.set(key, token)
                return token
        
        return None
    
    async def get_tokens_by_symbol(self, symbol: str, chain: str = None) -> List[Token]:
        """Get tokens by symbol, optionally filtered by chain"""
        if not self._initialized:
            await self.initialize()
            
        if chain:
            key = f"{chain}:{symbol.lower()}"
            # Try cache first
            cached_tokens = await self.cache.get(key)
            if cached_tokens:
                return cached_tokens
                
            # Try in-memory index
            tokens = self._tokens_by_symbol.get(key, [])
            if tokens:
                await self.cache.set(key, tokens)
                return tokens
        else:
            # Search across all chains
            result = []
            for chain_name in ['ethereum', 'bsc', 'solana', 'sui']:
                tokens = await self.get_tokens_by_symbol(symbol, chain_name)
                result.extend(tokens)
            return result
        
        return []
    
    async def register_token(self, token: Token) -> bool:
        """Register a new token in the registry"""
        if not self._initialized:
            await self.initialize()
            
        if not self.db_manager:
            logger.error("Database manager not initialized")
            return False
            
        try:
            # Save to database
            token_id = await self.db_manager.save_token(token)
            if token_id:
                # Update indexes
                key = f"{token.chain}:{token.address.lower()}"
                self._tokens_by_address[key] = token
                
                symbol_key = f"{token.chain}:{token.symbol.lower()}"
                if symbol_key not in self._tokens_by_symbol:
                    self._tokens_by_symbol[symbol_key] = []
                if token not in self._tokens_by_symbol[symbol_key]:
                    self._tokens_by_symbol[symbol_key].append(token)
                
                # Update cache
                await self.cache.set(key, token)
                await self.cache.set(symbol_key, self._tokens_by_symbol[symbol_key])
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to register token: {e}")
            return False
    
    async def update_token(self, token: Token) -> bool:
        """Update an existing token in the registry"""
        if not self._initialized:
            await self.initialize()
            
        if not self.db_manager:
            logger.error("Database manager not initialized")
            return False
            
        try:
            # Update in database
            success = await self.db_manager.update_token(token)
            if success:
                # Update indexes
                key = f"{token.chain}:{token.address.lower()}"
                self._tokens_by_address[key] = token
                
                symbol_key = f"{token.chain}:{token.symbol.lower()}"
                if symbol_key not in self._tokens_by_symbol:
                    self._tokens_by_symbol[symbol_key] = []
                
                # Remove old version if exists
                self._tokens_by_symbol[symbol_key] = [
                    t for t in self._tokens_by_symbol[symbol_key] 
                    if not (t.chain == token.chain and t.address.lower() == token.address.lower())
                ]
                
                # Add updated version
                self._tokens_by_symbol[symbol_key].append(token)
                
                # Update cache
                await self.cache.set(key, token)
                await self.cache.set(symbol_key, self._tokens_by_symbol[symbol_key])
                
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to update token: {e}")
            return False
    
    async def search_tokens(self, query: str, chain: str = None, limit: int = 50) -> List[Token]:
        """Search tokens by name or symbol"""
        if not self._initialized:
            await self.initialize()
            
        query = query.lower()
        results = []
        
        # Search in memory
        if chain:
            # Search in specific chain
            for key, token in self._tokens_by_address.items():
                if token.chain == chain and (
                    query in token.symbol.lower() or 
                    query in token.name.lower()
                ):
                    results.append(token)
                    if len(results) >= limit:
                        break
        else:
            # Search in all chains
            for key, token in self._tokens_by_address.items():
                if query in token.symbol.lower() or query in token.name.lower():
                    results.append(token)
                    if len(results) >= limit:
                        break
        
        return results
    
    async def get_low_cap_tokens(self, max_market_cap: float = 5_000_000, limit: int = 100) -> List[Token]:
        """Get low-cap tokens from the registry"""
        if not self._initialized:
            await self.initialize()
            
        results = []
        for token in self._tokens_by_address.values():
            if token.market_cap and token.market_cap <= max_market_cap:
                results.append(token)
                if len(results) >= limit:
                    break
        
        # Sort by market cap (descending)
        results.sort(key=lambda t: t.market_cap or 0, reverse=True)
        return results
    
    async def get_tokens_by_chain(self, chain: str, limit: int = 100) -> List[Token]:
        """Get tokens by blockchain"""
        if not self._initialized:
            await self.initialize()
            
        results = []
        for key, token in self._tokens_by_address.items():
            if token.chain == chain:
                results.append(token)
                if len(results) >= limit:
                        break
        
        return results
