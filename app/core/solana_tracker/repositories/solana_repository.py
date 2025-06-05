
from typing import Protocol, List, Optional, AsyncIterator
from datetime import datetime
import logging
from abc import ABC, abstractmethod
import asyncio
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.signature import Signature
import base58

from app.core.solana_tracker.models.transaction import SolanaTransaction, TransactionDetail, TransactionBatch
from app.core.solana_tracker.utils.retry_utils import retry_with_exponential_backoff
from app.core.solana_tracker.utils.signature_utils import validate_signature

logger = logging.getLogger(__name__)

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
        self.client = Client(rpc_url)
        self.max_retries = max_retries
        self._connection_checked = False

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
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.get_transaction(
                    Signature.from_string(validated_sig),
                    encoding="json",
                    max_supported_transaction_version=0
                )
            )
            
            if not response or not response.value:
                logger.debug(f"No transaction found for signature: {signature}")
                return None
                
            return await self._parse_transaction_response(response.value)
            
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
            
        Raises:
            ValueError: If address is invalid
            ConnectionError: If RPC connection fails
        """
        await self._ensure_connection()
        
        try:
            pubkey = Pubkey.from_string(address)
            loop = asyncio.get_running_loop()
            
            # Prepare parameters for signature fetch
            params = {"limit": limit}
            if before:
                params["before"] = validate_signature(before)
                
            # Fetch signatures
            signatures_response = await loop.run_in_executor(
                None,
                lambda: self.client.get_signatures_for_address(
                    pubkey,
                    **params
                )
            )
            
            if not signatures_response or not signatures_response.value:
                return TransactionBatch(transactions=[], total_count=0)
                
            # Fetch transactions for signatures
            transactions = []
            for sig_info in signatures_response.value:
                tx = await self.get_transaction(sig_info.signature.to_string())
                if tx:
                    transactions.append(tx)
                    
            return TransactionBatch(
                transactions=transactions,
                total_count=len(transactions),
                start_index=0
            )
            
        except ValueError as ve:
            logger.error(f"Invalid address format: {ve}")
            raise
        except Exception as e:
            logger.error(f"Error fetching transactions for {address}: {e}")
            raise

    async def _parse_transaction_response(self, tx_value: dict) -> TransactionDetail:
        """Parse raw transaction response into TransactionDetail model."""
        # Implementation of transaction parsing logic
        # This would include parsing of:
        # - Transaction metadata
        # - Instructions
        # - Account updates
        # - Token transfers
        # This is a placeholder for the actual implementation
        pass

    async def get_recent_blockhash(self) -> str:
        """Get recent blockhash for transaction construction."""
        await self._ensure_connection()
        
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.get_recent_blockhash()
            )
            
            if not response or not response.value:
                raise ValueError("Could not fetch recent blockhash")
                
            return response.value.blockhash.to_string()
            
        except Exception as e:
            logger.error(f"Error fetching recent blockhash: {e}")
            raise

    async def get_minimum_balance_for_rent_exemption(self, size: int) -> int:
        """Get minimum balance required for rent exemption."""
        await self._ensure_connection()
        
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.get_minimum_balance_for_rent_exemption(size)
            )
            
            if not response or not response.value:
                raise ValueError("Could not fetch minimum balance")
                
            return response.value
            
        except Exception as e:
            logger.error(f"Error fetching minimum balance: {e}")
            raise
