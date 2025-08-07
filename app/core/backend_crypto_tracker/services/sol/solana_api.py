# services/sol/solana_api.py
import aiohttp
import logging
import os
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from utils.logger import get_logger
from utils.exceptions import APIException, RateLimitExceededException
from utils.rate_limiter import RateLimiter

logger = get_logger(__name__)

@dataclass
class SolanaTokenHolder:
    address: str
    balance: float
    percentage: float
    rank: int = 0

class SolanaAPIService:
    def __init__(self, rpc_url: str = "https://api.mainnet-beta.solana.com", 
                 helius_api_key: Optional[str] = None):
        self.rpc_url = rpc_url
        self.helius_api_key = helius_api_key or os.getenv('HELIUS_API_KEY')
        self.rate_limiter = RateLimiter()
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def _make_rpc_request(self, method: str, params: List[Any]) -> Dict[str, Any]:
        """Interne Methode für RPC-Anfragen mit Rate-Limiting"""
        if not await self.rate_limiter.acquire("solana_rpc", 10, 1):  # 10 Anfragen pro Sekunde
            raise RateLimitExceededException("Solana RPC", 10, "second")
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        
        try:
            async with self.session.post(self.rpc_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'error' in data:
                        error_msg = data['error'].get('message', 'Unknown RPC error')
                        raise APIException(f"Solana RPC error: {error_msg}")
                    return data
                else:
                    raise APIException(f"HTTP error: {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"Network error: {e}")
            raise APIException(f"Network error: {str(e)}")
    
    async def get_token_metadata(self, token_address: str) -> Optional[Dict[str, Any]]:
        """Holt Token-Metadaten von Solana"""
        try:
            data = await self._make_rpc_request("getAccountInfo", [
                token_address,
                {"encoding": "jsonParsed"}
            ])
            
            if 'result' in data and data['result']['value']:
                return data['result']['value']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana token metadata: {e}")
            raise APIException(f"Error fetching token metadata: {str(e)}")
    
    async def get_token_supply(self, token_address: str) -> Optional[Dict[str, Any]]:
        """Holt Token-Supply Informationen"""
        try:
            data = await self._make_rpc_request("getTokenSupply", [token_address])
            
            if 'result' in data:
                return data['result']['value']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana token supply: {e}")
            raise APIException(f"Error fetching token supply: {str(e)}")
    
    async def get_token_largest_accounts(self, token_address: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Holt die größten Token-Accounts"""
        try:
            data = await self._make_rpc_request("getTokenLargestAccounts", [token_address])
            
            if 'result' in data:
                accounts = data['result']['value'][:limit]
                return accounts
            return []
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana token largest accounts: {e}")
            raise APIException(f"Error fetching token largest accounts: {str(e)}")
    
    async def get_token_holders(self, token_address: str, limit: int = 100) -> List[SolanaTokenHolder]:
        """Holt Token-Holder für Solana Token"""
        try:
            # Versuche zuerst, Helius API zu verwenden, wenn ein API-Key verfügbar ist
            if self.helius_api_key:
                return await self._get_holders_helius(token_address, limit)
            
            # Fallback: Eigene Implementierung über RPC
            return await self._get_holders_rpc(token_address, limit)
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana token holders: {e}")
            raise APIException(f"Error fetching token holders: {str(e)}")
    
    async def _get_holders_helius(self, token_address: str, limit: int) -> List[SolanaTokenHolder]:
        """Holt Holder über Helius API"""
        if not self.helius_api_key:
            raise APIException("Helius API key is required")
        
        if not await self.rate_limiter.acquire("helius_api", 100, 60):  # 100 Anfragen pro Minute
            raise RateLimitExceededException("Helius", 100, "minute")
        
        url = f"https://api.helius.xyz/v0/tokens/{token_address}/holders"
        params = {
            'api-key': self.helius_api_key,
            'limit': limit
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    holders_data = data.get('holders', [])
                    
                    # Berechne Gesamtmenge für Prozentsätze
                    total_supply = sum(float(holder['amount']) for holder in holders_data)
                    
                    return [
                        SolanaTokenHolder(
                            address=holder['owner'],
                            balance=float(holder['amount']),
                            percentage=(float(holder['amount']) / total_supply * 100) if total_supply > 0 else 0,
                            rank=holder.get('rank', 0)
                        )
                        for holder in holders_data
                    ]
                else:
                    raise APIException(f"Helius API error: {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"Error fetching Solana holders via Helius: {e}")
            raise APIException(f"Error fetching holders via Helius: {str(e)}")
    
    async def _get_holders_rpc(self, token_address: str, limit: int) -> List[SolanaTokenHolder]:
        """Fallback: Holder über RPC ermitteln"""
        try:
            # Hole die größten Konten
            accounts = await self.get_token_largest_accounts(token_address, limit)
            
            # Berechne Gesamtmenge für Prozentsätze
            total_supply = sum(float(acc['uiAmount']) if acc['uiAmount'] else 0 for acc in accounts)
            
            return [
                SolanaTokenHolder(
                    address=acc['address'],
                    balance=float(acc['uiAmount']) if acc['uiAmount'] else 0,
                    percentage=(float(acc['uiAmount']) / total_supply * 100) if total_supply > 0 else 0,
                    rank=idx + 1
                )
                for idx, acc in enumerate(accounts)
            ]
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana holders via RPC: {e}")
            raise APIException(f"Error fetching holders via RPC: {str(e)}")
    
    async def get_account_info(self, account_address: str) -> Optional[Dict[str, Any]]:
        """Holt Account-Informationen"""
        try:
            data = await self._make_rpc_request("getAccountInfo", [
                account_address,
                {"encoding": "jsonParsed"}
            ])
            
            if 'result' in data and data['result']['value']:
                return data['result']['value']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana account info: {e}")
            raise APIException(f"Error fetching account info: {str(e)}")
    
    async def get_transaction(self, transaction_signature: str) -> Optional[Dict[str, Any]]:
        """Holt Transaktionsinformationen"""
        try:
            data = await self._make_rpc_request("getTransaction", [
                transaction_signature,
                {"encoding": "jsonParsed"}
            ])
            
            if 'result' in data:
                return data['result']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana transaction: {e}")
            raise APIException(f"Error fetching transaction: {str(e)}")
    
    async def get_latest_slot(self) -> int:
        """Holt den neuesten Slot"""
        try:
            data = await self._make_rpc_request("getSlot", [])
            
            if 'result' in data:
                return data['result']
            return 0
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching latest Solana slot: {e}")
            raise APIException(f"Error fetching latest slot: {str(e)}")
    
    async def get_transactions_in_slot_range(self, start: int, end: int) -> List[Dict[str, Any]]:
        """Holt Transaktionen in einem Slot-Bereich"""
        transactions = []
        
        try:
            for slot in range(start, end + 1):
                # Hole Block für den Slot
                block_data = await self._make_rpc_request("getBlock", [slot, {"encoding": "jsonParsed"}])
                
                if 'result' in block_data and 'transactions' in block_data['result']:
                    for tx in block_data['result']['transactions']:
                        transactions.append(tx)
            
            return transactions
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Solana transactions in slot range: {e}")
            raise APIException(f"Error fetching transactions in slot range: {str(e)}")
