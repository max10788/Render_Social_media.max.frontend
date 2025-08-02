# app/core/backend_crypto_tracker/services/sui/sui_api.py
import aiohttp
import logging
from typing import List, Dict, Optional
import json

logger = logging.getLogger(__name__)

class SuiAPIService:
    def __init__(self, rpc_url: str = "https://fullnode.mainnet.sui.io:443"):
        self.rpc_url = rpc_url
    
    async def get_coin_metadata(self, session: aiohttp.ClientSession,
                               coin_type: str) -> Optional[Dict]:
        """Holt Coin-Metadaten von Sui"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_getCoinMetadata",
            "params": [coin_type]
        }
        
        try:
            async with session.post(self.rpc_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'result' in data:
                        return data['result']
                return None
        except Exception as e:
            logger.error(f"Error fetching Sui coin metadata: {e}")
            return None
    
    async def get_total_supply(self, session: aiohttp.ClientSession,
                              coin_type: str) -> Optional[str]:
        """Holt Total Supply für Sui Coin"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_getTotalSupply",
            "params": [coin_type]
        }
        
        try:
            async with session.post(self.rpc_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'result' in data:
                        return data['result']['value']
                return None
        except Exception as e:
            logger.error(f"Error fetching Sui total supply: {e}")
            return None

async def get_token_holders(session: aiohttp.ClientSession, coin_type: str,
                           limit: int = 100) -> List[Dict]:
    """
    Holt Token-Holder für Sui Coins
    Sui hat eine andere Architektur - Coins sind Objekte, nicht Accounts
    """
    sui_service = SuiAPIService()
    
    # Sui-spezifische Implementierung
    # Dies ist komplexer da Sui eine objekt-basierte Architektur hat
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_getCoins",
        "params": [
            None,  # owner (None für alle)
            coin_type,
            None,  # cursor
            limit
        ]
    }
    
    try:
        async with session.post(sui_service.rpc_url, json=payload) as response:
            if response.status == 200:
                data = await response.json()
                if 'result' in data:
                    coins = data['result']['data']
                    
                    # Gruppiere nach Owner und summiere Balances
                    owner_balances = {}
                    for coin in coins:
                        owner = coin['owner']['AddressOwner'] if 'AddressOwner' in coin['owner'] else None
                        if owner:
                            balance = int(coin['balance'])
                            owner_balances[owner] = owner_balances.get(owner, 0) + balance
                    
                    # Sortiere nach Balance
                    sorted_holders = sorted(
                        owner_balances.items(),
                        key=lambda x: x[1],
                        reverse=True
                    )[:limit]
                    
                    return [
                        {
                            'address': owner,
                            'balance': balance,
                            'rank': idx + 1
                        }
                        for idx, (owner, balance) in enumerate(sorted_holders)
                    ]
    except Exception as e:
        logger.error(f"Error fetching Sui holders: {e}")
    
    return []
