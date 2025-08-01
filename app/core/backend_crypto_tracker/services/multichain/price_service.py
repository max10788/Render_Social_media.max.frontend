# app/core/backend_crypto_tracker/services/multichain/price_service.py
import aiohttp
import logging
from typing import List, Optional
from ...database.models import token # For TokenData

logger = logging.getLogger(__name__)

async def get_low_cap_tokens(session: aiohttp.ClientSession, coingecko_key: Optional[str] = None,
                             max_market_cap: float = 5000000) -> List[token.TokenData]:
    """Holt Low-Cap Tokens von CoinGecko"""
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        'vs_currency': 'usd',
        'order': 'market_cap_desc',
        'per_page': 250,
        'page': 1,
        'sparkline': False,
        'price_change_percentage': '24h'
    }
    if coingecko_key:
        params['x-cg-pro-api-key'] = coingecko_key

    try:
        async with session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                tokens = []
                for coin in data:
                    if coin['market_cap'] and coin['market_cap'] < max_market_cap:
                        # Check for Ethereum or BSC platform
                        eth_address = coin.get('platforms', {}).get('ethereum')
                        bsc_address = coin.get('platforms', {}).get('binance-smart-chain')

                        if eth_address:
                            chain = 'ethereum'
                            address = eth_address
                        elif bsc_address:
                            chain = 'bsc'
                            address = bsc_address
                        else:
                            continue # Skip if not on supported chains

                        tokens.append(token.TokenData(
                            address=address,
                            name=coin['name'],
                            symbol=coin['symbol'].upper(), # Consistent symbol casing
                            market_cap=coin['market_cap'] or 0,
                            volume_24h=coin['total_volume'] or 0,
                            liquidity=0,  # Wird später berechnet
                            holders_count=0,  # Wird später geholt
                            contract_verified=False,  # Wird später geprüft
                            creation_date=None,  # Placeholder, needs fetching
                            chain=chain
                        ))
                logger.info(f"Gefunden: {len(tokens)} Low-Cap Tokens")
                return tokens
            else:
                logger.error(f"CoinGecko API Fehler: {response.status}")
                return []
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Tokens: {e}")
        return []

