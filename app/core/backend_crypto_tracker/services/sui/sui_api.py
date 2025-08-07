# app/core/backend_crypto_tracker/services/sui/sui_api.py
import aiohttp
import logging
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from utils.logger import get_logger
from utils.exceptions import APIException, RateLimitExceededException
from utils.rate_limiter import RateLimiter

logger = get_logger(__name__)

@dataclass
class SuiTokenHolder:
    address: str
    balance: float
    percentage: float
    rank: int = 0

class SuiAPIService:
    def __init__(self, rpc_url: str = "https://fullnode.mainnet.sui.io:443"):
        self.rpc_url = rpc_url
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
        if not await self.rate_limiter.acquire("sui_rpc", 10, 1):  # 10 Anfragen pro Sekunde
            raise RateLimitExceededException("Sui RPC", 10, "second")
        
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
                        raise APIException(f"Sui RPC error: {error_msg}")
                    return data
                else:
                    raise APIException(f"HTTP error: {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"Network error: {e}")
            raise APIException(f"Network error: {str(e)}")
    
    async def get_object(self, object_id: str, options: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """Holt ein Objekt von Sui"""
        params = [object_id]
        if options:
            params.append(options)
        
        try:
            data = await self._make_rpc_request("sui_getObject", params)
            
            if 'result' in data:
                return data['result']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui object: {e}")
            raise APIException(f"Error fetching object: {str(e)}")
    
    async def get_coin_metadata(self, coin_type: str) -> Optional[Dict[str, Any]]:
        """Holt Coin-Metadaten von Sui"""
        try:
            data = await self._make_rpc_request("suix_getCoinMetadata", [coin_type])
            
            if 'result' in data:
                return data['result']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui coin metadata: {e}")
            raise APIException(f"Error fetching coin metadata: {str(e)}")
    
    async def get_total_supply(self, coin_type: str) -> Optional[str]:
        """Holt Total Supply für Sui Coin"""
        try:
            data = await self._make_rpc_request("suix_getTotalSupply", [coin_type])
            
            if 'result' in data:
                return data['result']['value']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui total supply: {e}")
            raise APIException(f"Error fetching total supply: {str(e)}")
    
    async def get_balance(self, address: str, coin_type: Optional[str] = None) -> Optional[int]:
        """Holt den Balance für eine Adresse"""
        params = [address]
        if coin_type:
            params.append(coin_type)
        
        try:
            data = await self._make_rpc_request("suix_getBalance", params)
            
            if 'result' in data:
                return int(data['result']['totalBalance'])
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui balance: {e}")
            raise APIException(f"Error fetching balance: {str(e)}")
    
    async def get_all_balances(self, address: str) -> List[Dict[str, Any]]:
        """Holt alle Balances für eine Adresse"""
        try:
            data = await self._make_rpc_request("suix_getAllBalances", [address])
            
            if 'result' in data:
                return data['result']
            return []
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui all balances: {e}")
            raise APIException(f"Error fetching all balances: {str(e)}")
    
    async def get_coins(self, address: str, coin_type: Optional[str] = None, 
                       limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        """Holt Coins für eine Adresse"""
        params = [address]
        if coin_type:
            params.append(coin_type)
        
        options = {"limit": limit}
        if cursor:
            options["cursor"] = cursor
        
        params.append(options)
        
        try:
            data = await self._make_rpc_request("suix_getCoins", params)
            
            if 'result' in data:
                return data['result']
            return {}
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui coins: {e}")
            raise APIException(f"Error fetching coins: {str(e)}")
    
    async def get_token_holders(self, coin_type: str, limit: int = 100) -> List[SuiTokenHolder]:
        """Holt Token-Holder für Sui Coins"""
        try:
            # Sui hat eine andere Architektur - Coins sind Objekte, nicht Accounts
            # Wir verwenden getCoins mit einem leeren Owner, um alle Coins des Typs zu erhalten
            coins_data = await self.get_coins(None, coin_type, limit)
            
            if not coins_data or 'data' not in coins_data:
                return []
            
            coins = coins_data['data']
            
            # Gruppiere nach Owner und summiere Balances
            owner_balances = {}
            total_supply = 0
            
            for coin in coins:
                owner = coin.get('owner', {}).get('AddressOwner')
                if owner:
                    balance = int(coin.get('balance', 0))
                    owner_balances[owner] = owner_balances.get(owner, 0) + balance
                    total_supply += balance
            
            # Sortiere nach Balance
            sorted_holders = sorted(
                owner_balances.items(),
                key=lambda x: x[1],
                reverse=True
            )[:limit]
            
            return [
                SuiTokenHolder(
                    address=owner,
                    balance=balance,
                    percentage=(balance / total_supply * 100) if total_supply > 0 else 0,
                    rank=idx + 1
                )
                for idx, (owner, balance) in enumerate(sorted_holders)
            ]
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui token holders: {e}")
            raise APIException(f"Error fetching token holders: {str(e)}")
    
    async def get_transaction(self, transaction_digest: str) -> Optional[Dict[str, Any]]:
        """Holt Transaktionsinformationen"""
        try:
            data = await self._make_rpc_request("sui_getTransaction", [
                transaction_digest,
                {"showInput": True, "showEffects": True, "showEvents": True}
            ])
            
            if 'result' in data:
                return data['result']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui transaction: {e}")
            raise APIException(f"Error fetching transaction: {str(e)}")
    
    async def get_latest_checkpoint_sequence_number(self) -> int:
        """Holt die neueste Checkpoint-Sequenznummer"""
        try:
            data = await self._make_rpc_request("sui_getLatestCheckpointSequenceNumber", [])
            
            if 'result' in data:
                return data['result']
            return 0
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching latest Sui checkpoint: {e}")
            raise APIException(f"Error fetching latest checkpoint: {str(e)}")
    
    async def get_checkpoint(self, sequence_number: int) -> Optional[Dict[str, Any]]:
        """Holt einen Checkpoint"""
        try:
            data = await self._make_rpc_request("sui_getCheckpoint", [
                sequence_number,
                {"showTransactions": True}
            ])
            
            if 'result' in data:
                return data['result']
            return None
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui checkpoint: {e}")
            raise APIException(f"Error fetching checkpoint: {str(e)}")
    
    async def get_transactions_in_checkpoint_range(self, start: int, end: int) -> List[Dict[str, Any]]:
        """Holt Transaktionen in einem Checkpoint-Bereich"""
        transactions = []
        
        try:
            for sequence_number in range(start, end + 1):
                checkpoint = await self.get_checkpoint(sequence_number)
                
                if checkpoint and 'transactions' in checkpoint:
                    for tx_digest in checkpoint['transactions']:
                        transaction = await self.get_transaction(tx_digest)
                        if transaction:
                            transactions.append(transaction)
            
            return transactions
        except APIException:
            raise
        except Exception as e:
            logger.error(f"Error fetching Sui transactions in checkpoint range: {e}")
            raise APIException(f"Error fetching transactions in checkpoint range: {str(e)}")
