# app/core/backend_crypto_tracker/scanner/token_discovery.py
import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

from app.core.backend_crypto_tracker.services.multichain.price_service import PriceService, TokenPriceData
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.exceptions import APIException

logger = get_logger(__name__)

@dataclass
class TokenData:
    """Datenklasse für Token-Informationen"""
    address: str
    name: str
    symbol: str
    chain: str
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    liquidity: Optional[float] = None
    holders_count: Optional[int] = None
    contract_verified: Optional[bool] = None
    creation_date: Optional[datetime] = None
    last_analyzed: Optional[datetime] = None
    token_score: Optional[float] = None

class TokenDiscoveryService:
    """Service für die Entdeckung neuer Low-Cap Tokens"""
    
    def __init__(self):
        self.price_service = None
        self.supported_chains = ["ethereum", "bsc", "solana", "sui"]
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.price_service = PriceService()
        await self.price_service.__aenter__()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.price_service:
            await self.price_service.__aexit__(exc_type, exc_val, exc_tb)
    
    async def discover_tokens(
        self, 
        chain: str, 
        max_market_cap: float = 5_000_000, 
        limit: int = 100
    ) -> List[TokenData]:
        """
        Entdeckt neue Tokens auf einer bestimmten Blockchain
        
        Args:
            chain: Blockchain (ethereum, bsc, solana, sui)
            max_market_cap: Maximale Marktkapitalisierung
            limit: Maximale Anzahl der zurückgegebenen Tokens
            
        Returns:
            Liste der entdeckten Tokens
        """
        try:
            logger.info(f"Discovering tokens on {chain} with max market cap ${max_market_cap:,}")
            
            if chain not in self.supported_chains:
                logger.warning(f"Unsupported chain: {chain}")
                return []
            
            # Tokens vom Preis-Service holen
            if not self.price_service:
                async with PriceService() as price_service:
                    tokens = await price_service.get_low_cap_tokens(
                        max_market_cap=max_market_cap,
                        limit=limit
                    )
            else:
                tokens = await self.price_service.get_low_cap_tokens(
                    max_market_cap=max_market_cap,
                    limit=limit
                )
            
            # Filtere Tokens für die spezifische Chain
            chain_tokens = [
                token for token in tokens 
                if token.chain.lower() == chain.lower()
            ]
            
            # Konvertiere zu TokenData-Objekten
            result_tokens = []
            for token in chain_tokens:
                token_data = TokenData(
                    address=token.address,
                    name=token.name,
                    symbol=token.symbol,
                    chain=token.chain,
                    market_cap=token.market_cap,
                    volume_24h=token.volume_24h,
                    liquidity=token.liquidity,
                    holders_count=token.holders_count,
                    contract_verified=token.contract_verified,
                    creation_date=token.creation_date,
                    last_analyzed=datetime.utcnow(),
                    token_score=0.0  # Wird später berechnet
                )
                result_tokens.append(token_data)
            
            logger.info(f"Discovered {len(result_tokens)} tokens on {chain}")
            return result_tokens
            
        except APIException as e:
            logger.error(f"API error discovering tokens on {chain}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error discovering tokens on {chain}: {e}")
            raise APIException(f"Failed to discover tokens on {chain}: {str(e)}")
    
    async def discover_trending_tokens(
        self, 
        chain: str, 
        min_volume: float = 10000,
        limit: int = 50
    ) -> List[TokenData]:
        """
        Entdeckt Trending Tokens mit hohem Volumen
        
        Args:
            chain: Blockchain
            min_volume: Minimales Handelsvolumen (24h)
            limit: Maximale Anzahl der zurückgegebenen Tokens
            
        Returns:
            Liste der Trending Tokens
        """
        try:
            logger.info(f"Discovering trending tokens on {chain} with min volume ${min_volume:,}")
            
            if chain not in self.supported_chains:
                logger.warning(f"Unsupported chain: {chain}")
                return []
            
            # Trending Tokens vom Preis-Service holen
            if not self.price_service:
                async with PriceService() as price_service:
                    tokens = await price_service.get_trending_tokens(
                        chain=chain,
                        min_volume=min_volume,
                        limit=limit
                    )
            else:
                tokens = await self.price_service.get_trending_tokens(
                    chain=chain,
                    min_volume=min_volume,
                    limit=limit
                )
            
            # Konvertiere zu TokenData-Objekten
            result_tokens = []
            for token in tokens:
                token_data = TokenData(
                    address=token.get('address', ''),
                    name=token.get('name', ''),
                    symbol=token.get('symbol', ''),
                    chain=chain,
                    market_cap=token.get('market_cap'),
                    volume_24h=token.get('volume_24h'),
                    liquidity=token.get('liquidity'),
                    holders_count=token.get('holders_count'),
                    contract_verified=token.get('contract_verified'),
                    last_analyzed=datetime.utcnow(),
                    token_score=0.0
                )
                result_tokens.append(token_data)
            
            logger.info(f"Discovered {len(result_tokens)} trending tokens on {chain}")
            return result_tokens
            
        except APIException as e:
            logger.error(f"API error discovering trending tokens on {chain}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error discovering trending tokens on {chain}: {e}")
            raise APIException(f"Failed to discover trending tokens on {chain}: {str(e)}")
    
    async def discover_new_listings(
        self, 
        chain: str, 
        hours_ago: int = 24,
        limit: int = 50
    ) -> List[TokenData]:
        """
        Entdeckt kürzlich gelistete Tokens
        
        Args:
            chain: Blockchain
            hours_ago: Zeitraum in Stunden für neue Listings
            limit: Maximale Anzahl der zurückgegebenen Tokens
            
        Returns:
            Liste der kürzlich gelisteten Tokens
        """
        try:
            logger.info(f"Discovering new listings on {chain} from last {hours_ago} hours")
            
            if chain not in self.supported_chains:
                logger.warning(f"Unsupported chain: {chain}")
                return []
            
            cutoff_time = datetime.utcnow() - timedelta(hours=hours_ago)
            
            # Neue Listings vom Preis-Service holen
            if not self.price_service:
                async with PriceService() as price_service:
                    tokens = await price_service.get_new_listings(
                        chain=chain,
                        cutoff_time=cutoff_time,
                        limit=limit
                    )
            else:
                tokens = await self.price_service.get_new_listings(
                    chain=chain,
                    cutoff_time=cutoff_time,
                    limit=limit
                )
            
            # Konvertiere zu TokenData-Objekten
            result_tokens = []
            for token in tokens:
                token_data = TokenData(
                    address=token.get('address', ''),
                    name=token.get('name', ''),
                    symbol=token.get('symbol', ''),
                    chain=chain,
                    market_cap=token.get('market_cap'),
                    volume_24h=token.get('volume_24h'),
                    liquidity=token.get('liquidity'),
                    holders_count=token.get('holders_count'),
                    contract_verified=token.get('contract_verified'),
                    creation_date=token.get('creation_date'),
                    last_analyzed=datetime.utcnow(),
                    token_score=0.0
                )
                result_tokens.append(token_data)
            
            logger.info(f"Discovered {len(result_tokens)} new listings on {chain}")
            return result_tokens
            
        except APIException as e:
            logger.error(f"API error discovering new listings on {chain}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error discovering new listings on {chain}: {e}")
            raise APIException(f"Failed to discover new listings on {chain}: {str(e)}")
    
    async def analyze_token_potential(self, token_data: TokenData) -> Dict[str, Any]:
        """
        Analysiert das Potenzial eines Tokens basierend auf verschiedenen Metriken
        
        Args:
            token_data: Token-Informationen
            
        Returns:
            Analyse-Ergebnis mit Potenzial-Score
        """
        try:
            logger.info(f"Analyzing potential for token {token_data.symbol} on {token_data.chain}")
            
            score = 0
            factors = []
            
            # Marktkapitalisierung analysieren
            if token_data.market_cap:
                if token_data.market_cap < 100000:  # < $100k
                    score += 30
                    factors.append("very_low_market_cap")
                elif token_data.market_cap < 500000:  # < $500k
                    score += 20
                    factors.append("low_market_cap")
                elif token_data.market_cap < 1000000:  # < $1M
                    score += 10
                    factors.append("moderate_market_cap")
            
            # Liquidität analysieren
            if token_data.liquidity:
                if token_data.liquidity < 50000:  # < $50k
                    score += 25
                    factors.append("low_liquidity")
                elif token_data.liquidity < 100000:  # < $100k
                    score += 15
                    factors.append("moderate_liquidity")
            
            # Handelsvolumen analysieren
            if token_data.volume_24h:
                volume_to_mc_ratio = token_data.volume_24h / token_data.market_cap if token_data.market_cap else 0
                if volume_to_mc_ratio > 0.1:  # > 10% des MC pro Tag
                    score += 20
                    factors.append("high_volume_ratio")
                elif volume_to_mc_ratio > 0.05:  # > 5% des MC pro Tag
                    score += 10
                    factors.append("moderate_volume_ratio")
            
            # Holder-Anzahl analysieren
            if token_data.holders_count:
                if token_data.holders_count < 100:
                    score += 15
                    factors.append("very_few_holders")
                elif token_data.holders_count < 500:
                    score += 10
                    factors.append("few_holders")
            
            # Contract-Verifikation
            if not token_data.contract_verified:
                score += 20
                factors.append("unverified_contract")
            
            # Alter des Tokens analysieren
            if token_data.creation_date:
                token_age = (datetime.utcnow() - token_data.creation_date).days
                if token_age < 7:  # Jünger als 7 Tage
                    score += 15
                    factors.append("very_new_token")
                elif token_age < 30:  # Jünger als 30 Tage
                    score += 10
                    factors.append("new_token")
            
            # Normalisiere den Score (0-100)
            max_possible_score = 145  # Summe aller möglichen Punkte
            normalized_score = min(100, (score / max_possible_score) * 100)
            
            result = {
                "token_address": token_data.address,
                "symbol": token_data.symbol,
                "chain": token_data.chain,
                "potential_score": normalized_score,
                "risk_level": "high" if normalized_score > 70 else "medium" if normalized_score > 40 else "low",
                "factors": factors,
                "analysis_date": datetime.utcnow().isoformat(),
                "metrics": {
                    "market_cap": token_data.market_cap,
                    "volume_24h": token_data.volume_24h,
                    "liquidity": token_data.liquidity,
                    "holders_count": token_data.holders_count,
                    "contract_verified": token_data.contract_verified,
                    "token_age_days": (datetime.utcnow() - token_data.creation_date).days if token_data.creation_date else None
                }
            }
            
            logger.info(f"Potential analysis completed for {token_data.symbol}: {normalized_score:.1f}/100")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing token potential for {token_data.symbol}: {e}")
            raise APIException(f"Failed to analyze token potential: {str(e)}")
