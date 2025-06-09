from typing import Protocol, List, Optional, AsyncIterator, Dict
from datetime import datetime
import logging
from abc import ABC, abstractmethod
import asyncio
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.signature import Signature
import base58
import aiohttp
from decimal import Decimal
from dataclasses import dataclass

from app.core.solana_tracker.models.transaction import (
    SolanaTransaction, 
    TransactionDetail, 
    TransactionBatch,
    Transfer
)
from app.core.solana_tracker.utils.retry_utils import retry_with_exponential_backoff
from app.core.solana_tracker.utils.signature_utils import validate_signature

logger = logging.getLogger(__name__)

@dataclass
class Transfer:
    """Represents a transfer of SOL between addresses."""
    from_address: str
    to_address: Optional[str]
    amount: Decimal
    direction: str  # "in" or "out"

class SolanaRepositoryProtocol(Protocol):
    """Protocol defining the interface for Solana blockchain interaction."""
    
    async def get_transaction(self, signature: str) -> Optional[TransactionDetail]:
        """Fetch a single transaction by signature."""
        ...

    async def get_transactions_for_address(
        self, 
        address: str, 
        before: Optional[str] = None,
        limit: int = 100
    ) -> TransactionBatch:
        """Fetch transactions for a given address."""
        ...

    async def get_recent_blockhash(self) -> str:
        """Get recent blockhash for transaction construction."""
        ...

    async def get_minimum_balance_for_rent_exemption(self, size: int) -> int:
        """Get minimum balance required for rent exemption."""
        ...

class SolanaRepository:
    """Implementation of Solana blockchain repository."""
    
    def __init__(self, rpc_url: str, max_retries: int = 3):
        self.rpc_url = rpc_url
        self.client = Client(rpc_url)
        self.max_retries = max_retries
        self._connection_checked = False
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry."""
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def _ensure_session(self):
        """Ensure aiohttp session exists."""
        if not self._session:
            self._session = aiohttp.ClientSession()

    async def _ensure_connection(self) -> None:
        """Ensure RPC connection is available."""
        if not self._connection_checked:
            try:
                await self._health_check()
                self._connection_checked = True
            except Exception as e:
                logger.error(f"Failed to establish RPC connection: {e}")
                raise ConnectionError("Could not establish Solana RPC connection")

    @retry_with_exponential_backoff(max_retries=3, base_delay=1)
    async def _health_check(self) -> bool:
        """Check RPC endpoint health."""
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: self.client.is_connected()
        )
        if not response:
            raise ConnectionError("Solana RPC endpoint is not responding")
        return True

    
    async def _make_rpc_call(self, method: str, params: List) -> Dict:
        """Make RPC call to Solana network."""
        await self._ensure_session()
        try:
            # Add maxSupportedTransactionVersion parameter to fix version compatibility error
            if method == "getTransaction":
                params[1]["maxSupportedTransactionVersion"] = 0

            async with self._session.post(
                self.rpc_url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": method,
                    "params": params
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"RPC error: {response.status} - {error_text}")
                    return {"error": f"RPC error: {response.status}"}
                    
                return await response.json()
                
        except Exception as e:
            logger.error(f"RPC call failed: {e}")
            return {"error": str(e)}

    async def get_raw_transaction(self, tx_hash: str) -> Dict:
        """
        Get raw transaction response for debugging.
        
        Args:
            tx_hash: Transaction signature to fetch
            
        Returns:
            Dict: Raw RPC response
        """
        return await self._make_rpc_call(
            "getTransaction",
            [
                tx_hash,
                {"encoding": "json", "commitment": "confirmed"}
            ]
        )

    async def get_transaction(self, signature: str) -> Optional[TransactionDetail]:
        """
        Fetch transaction details by signature.
        
        Args:
            signature: Transaction signature to fetch
            
        Returns:
            Optional[TransactionDetail]: Transaction details if found
            
        Raises:
            ValueError: If signature is invalid
            ConnectionError: If RPC connection fails
        """
        await self._ensure_connection()
        
        # Validate signature format
        try:
            validated_sig = validate_signature(signature)
        except ValueError as e:
            logger.error(f"Invalid signature format: {e}")
            raise
            
        try:
            response = await self.get_raw_transaction(validated_sig)
            
            if "error" in response:
                logger.error(f"Error fetching transaction {signature}: {response['error']}")
                return None
                
            result = response.get("result")
            if not result:
                logger.debug(f"No transaction found for signature: {signature}")
                return None
                
            return await self._parse_transaction_response(result)
            
        except Exception as e:
            logger.error(f"Error fetching transaction {signature}: {e}")
            raise

    async def get_transactions_for_address(
        self,
        address: str,
        before: Optional[str] = None,
        limit: int = 100
    ) -> TransactionBatch:
        """
        Fetch transactions for a given address.
        
        Args:
            address: Wallet address to fetch transactions for
            before: Optional signature to fetch transactions before
            limit: Maximum number of transactions to fetch
            
        Returns:
            TransactionBatch: Batch of transactions
        """
        await self._ensure_connection()
        
        try:
            params = [address, {"limit": limit}]
            if before:
                params[1]["before"] = validate_signature(before)
                
            response = await self._make_rpc_call(
                "getSignaturesForAddress",
                params
            )
            
            if "error" in response:
                logger.error(f"Error fetching transactions for {address}: {response['error']}")
                return TransactionBatch(transactions=[], total_count=0)
                
            result = response.get("result", [])
            
            # Fetch full transaction details
            transactions = []
            for sig_info in result:
                tx = await self.get_transaction(sig_info["signature"])
                if tx:
                    transactions.append(tx)
                    
            return TransactionBatch(
                transactions=transactions,
                total_count=len(transactions),
                start_index=0
            )
            
        except Exception as e:
            logger.error(f"Error fetching transactions for {address}: {e}")
            raise

    async def _parse_transaction_response(self, tx_value: dict) -> Optional[TransactionDetail]:
        """Parse raw transaction response into TransactionDetail model."""
        try:
            # Extract basic transaction information
            signature = tx_value.get("transaction", {}).get("signatures", [""])[0]
            message = tx_value.get("transaction", {}).get("message", {})
            meta = tx_value.get("meta", {})
            
            # Get timestamp
            block_time = tx_value.get("blockTime", 0)
            timestamp = datetime.fromtimestamp(block_time) if block_time else datetime.utcnow()
            
            # Extract account keys
            account_keys = message.get("accountKeys", [])
            
            # Extract pre and post balances
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            
            # Calculate transfers
            transfers: List[Transfer] = []
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                if i < len(account_keys):
                    change = Decimal(str((post - pre))) / Decimal("1000000000")  # Convert lamports to SOL
                    if change != 0:
                        transfers.append(Transfer(
                            from_address=account_keys[i],
                            to_address=account_keys[i+1] if i+1 < len(account_keys) else None,
                            amount=Decimal(str(abs(change))),
                            direction="out" if change < 0 else "in"
                        ))
    
            # Create SolanaTransaction instance with all required fields
            solana_tx = SolanaTransaction(
                tx_hash=signature,
                timestamp=timestamp,
                block_time=block_time,
                success=meta.get("err") is None,
                signatures=tx_value.get("transaction", {}).get("signatures", []),
                fee=Decimal(str(meta.get("fee", 0))) / Decimal("1000000000")  # Convert lamports to SOL
            )
    
            return TransactionDetail(
                signature=signature,
                timestamp=timestamp,
                transfers=transfers,
                transaction=solana_tx
            )
            
        except Exception as e:
            logger.error(f"Error parsing transaction response: {e}")
            return None

    async def get_recent_blockhash(self) -> str:
        """Get recent blockhash for transaction construction."""
        await self._ensure_connection()
        
        try:
            response = await self._make_rpc_call(
                "getRecentBlockhash",
                []
            )
            
            if "error" in response:
                raise ValueError(f"Could not fetch recent blockhash: {response['error']}")
                
            result = response.get("result", {})
            return result.get("value", {}).get("blockhash")
            
        except Exception as e:
            logger.error(f"Error fetching recent blockhash: {e}")
            raise

    async def get_minimum_balance_for_rent_exemption(self, size: int) -> int:
        """Get minimum balance required for rent exemption."""
        await self._ensure_connection()
        
        try:
            response = await self._make_rpc_call(
                "getMinimumBalanceForRentExemption",
                [size]
            )
            
            if "error" in response:
                raise ValueError(f"Could not fetch minimum balance: {response['error']}")
                
            return response.get("result", 0)
            
        except Exception as e:
            logger.error(f"Error fetching minimum balance: {e}")
            raise

    async def close(self):
        """Close aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None
