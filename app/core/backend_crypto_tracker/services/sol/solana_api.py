# app/core/backend_crypto_tracker/services/solana/solana_api.py
import aiohttp
import logging
from typing import List, Dict, Optional
import json

logger = logging.getLogger(__name__)

class SolanaAPIService:
    def __init__(self, rpc_url: str = "https://api.mainnet-beta.solana.com"):
        self.rpc_url = rpc_url
    
    async def get_token_metadata(self, session: aiohttp.ClientSession, 
                                token_address: str) -> Optional[Dict]:
        """Holt Token-Metadaten von Solana"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAccountInfo",
            "params": [
                token_address,
                {"encoding": "jsonParsed"}
            ]
        }
        
        try:
            async with session.post(self.rpc_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'result' in data and data['result']['value']:
                        return data['result']['value']
                return None
        except Exception as e:
            logger.error(f"Error fetching Solana token metadata: {e}")
            return None
    
    async def get_token_supply(self, session: aiohttp.ClientSession, 
                              token_address: str) -> Optional[Dict]:
        """Holt Token-Supply Informationen"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenSupply",
            "params": [token_address]
        }
        
        try:
            async with session.post(self.rpc_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'result' in data:
                        return data['result']['value']
                return None
        except Exception as e:
            logger.error(f"Error fetching Solana token supply: {e}")
            return None

async def get_token_holders(session: aiohttp.ClientSession, token_address: str,
                           limit: int = 100) -> List[Dict]:
    """
    Holt Token-Holder für Solana Token
    Nutzt externe APIs wie Helius oder SolanaFM für Holder-Daten
    """
    # Helius API Beispiel (benötigt API Key)
    helius_api_key = os.getenv('HELIUS_API_KEY')
    if helius_api_key:
        return await _get_holders_helius(session, token_address, helius_api_key, limit)
    
    # Fallback: Eigene Implementierung über RPC (aufwendiger)
    return await _get_holders_rpc(session, token_address, limit)

async def _get_holders_helius(session: aiohttp.ClientSession, token_address: str,
                             api_key: str, limit: int) -> List[Dict]:
    """Holt Holder über Helius API"""
    url = f"https://api.helius.xyz/v0/tokens/{token_address}/holders"
    params = {
        'api-key': api_key,
        'limit': limit
    }
    
    try:
        async with session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return [
                    {
                        'address': holder['owner'],
                        'balance': float(holder['amount']),
                        'rank': holder.get('rank', 0)
                    }
                    for holder in data.get('holders', [])
                ]
    except Exception as e:
        logger.error(f"Error fetching Solana holders via Helius: {e}")
    
    return []

async def _get_holders_rpc(session: aiohttp.ClientSession, token_address: str,
                          limit: int) -> List[Dict]:
    """Fallback: Holder über RPC ermitteln (vereinfacht)"""
    # Implementierung über getTokenLargestAccounts und weitere RPC Calls
    # Dies ist komplexer und weniger effizient als spezialisierte APIs
    solana_service = SolanaAPIService()
    
    rpc_url = "https://api.mainnet-beta.solana.com"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTokenLargestAccounts",
        "params": [token_address]
    }
    
    try:
        async with session.post(rpc_url, json=payload) as response:
            if response.status == 200:
                data = await response.json()
                if 'result' in data:
                    accounts = data['result']['value']
                    return [
                        {
                            'address': acc['address'],
                            'balance': float(acc['uiAmount']) if acc['uiAmount'] else 0,
                            'rank': idx + 1
                        }
                        for idx, acc in enumerate(accounts[:limit])
                    ]
    except Exception as e:
        logger.error(f"Error fetching Solana holders via RPC: {e}")
    
    return []
