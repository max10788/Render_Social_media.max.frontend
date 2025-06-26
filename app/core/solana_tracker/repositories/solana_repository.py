from typing import Protocol, List, Optional, AsyncIterator, Dict, Any
from datetime import datetime
import logging
from abc import ABC, abstractmethod
import asyncio
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.signature import Signature
import base58
import aiohttp
import json
from decimal import Decimal
from dataclasses import dataclass
import httpx

from app.core.solana_tracker.models.transaction import (
    SolanaTransaction, 
    TransactionDetail, 
    TransactionBatch,
    Transfer
)
from app.core.solana_tracker.models.scenario import (
    ScenarioType,
    ScenarioDetails,
    DetectedScenario,
    ScenarioRule,
    ScenarioConfig,
    AmountThreshold,
    LargeDepositRule,
    ScenarioPattern,
    DeFiProtocol
)
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

        self.max_retries = max_retries
        self._connection_checked = False
        self._session: Optional[aiohttp.ClientSession] = None
        self.config = config
        self.current_rpc_url = self.config.primary_rpc_url
        self.fallback_rpc_urls = self.config.fallback_rpc_urls
        self.client = httpx.AsyncClient()
        self.semaphore = asyncio.Semaphore(self.config.rate_limit_rate)
        self.last_request_time = 0
        self.request_count = 0

    solana_config = SolanaConfig()
    repository = EnhancedSolanaRepository(config=solana_config)

    async def __aenter__(self):
        """Async context manager entry."""
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if hasattr(self, 'close'):
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

    async def _make_rpc_call(self, method: str, params: list) -> dict:
        urls = [self.current_rpc_url] + self.fallback_rpc_urls

        for url in urls:
            async with self.semaphore:
                try:
                    response = await self.client.post(
                        url,
                        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    response.raise_for_status()
                    response_data = response.json()

                    if isinstance(response_data, dict) and "result" in response_data:
                        return response_data
                    else:
                        logger.error(f"Unexpected RPC response format from {url}: {response_data}")
                        continue

                except httpx.HTTPStatusError as e:
                    logger.error(f"RPC error from {url}: {e.response.status_code} - {e.response.text}")
                    continue
                except Exception as e:
                    logger.error(f"Error making RPC call to {url}: {str(e)}")
                    continue

        # Wenn alle URLs fehlschlagen
        logger.error("All RPC endpoints failed.")
        raise Exception("All RPC endpoints failed.")
            
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

    @staticmethod
    def extract_transfers_from_rpc_response(
        rpc_tx: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extract all SOL and SPL token transfers from a Solana RPC transaction response.
        Returns:
            List of dicts with: from_address, to_address, amount, currency, mint (optional), decimals
        """
        transfers = []

        try:
            # 1. SOL transfers (via pre-/postBalances)
            meta = rpc_tx.get("meta", {})
            message = rpc_tx.get("transaction", {}).get("message", {})
            account_keys = message.get("accountKeys", [])
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])

            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                diff = post - pre
                if diff != 0:
                    direction = "in" if diff > 0 else "out"
                    transfers.append({
                        "from_address": account_keys[i] if direction == "out" else None,
                        "to_address": account_keys[i] if direction == "in" else None,
                        "amount": abs(Decimal(diff) / Decimal(1_000_000_000)),
                        "currency": "SOL",
                        "decimals": 9,
                    })

            # 2. SPL Token transfers (from innerInstructions)
            for inner in meta.get("innerInstructions", []):
                for inst in inner.get("instructions", []):
                    # Only parse if the instruction is a SPL token transfer
                    try:
                        program_id_index = inst.get("programIdIndex")
                        if program_id_index is not None:
                            # Map programIdIndex to account_keys
                            program_id = account_keys[program_id_index]
                            if program_id != TOKEN_PROGRAM_ID:
                                continue
                        else:
                            continue

                        data = inst.get("data")
                        # SPL token transfer instructions start with 3, 12, 7 etc (base58 encoded)
                        # Most wallet transfers use "transfer" (3) or "transferChecked" (12)
                        if not data:
                            continue

                        # Parse base58 data if present
                        from base58 import b58decode
                        decoded = b58decode(data)
                        if len(decoded) < 9:
                            continue
                        instruction_type = decoded[0]
                        if instruction_type not in [3, 12]:  # transfer, transferChecked
                            continue

                        # Amount is bytes 1:9 as little-endian
                        amount = int.from_bytes(decoded[1:9], "little")
                        decimals = 9  # By default for SPL, but can be different

                        accounts = inst.get("accounts", [])
                        if len(accounts) < 2:
                            continue

                        from_addr = account_keys[accounts[0]]
                        to_addr = account_keys[accounts[1]]
                        mint_addr = None
                        if instruction_type == 12 and len(accounts) > 3:
                            mint_addr = account_keys[accounts[3]]

                        transfers.append({
                            "from_address": from_addr,
                            "to_address": to_addr,
                            "amount": Decimal(amount) / Decimal(10 ** decimals),
                            "currency": "SPL",
                            "decimals": decimals,
                            "mint": mint_addr,
                        })
                    except Exception as ex:
                        logger.debug(f"Failed to parse SPL transfer: {ex}")

            return transfers
        except Exception as e:
            logger.error(f"Failed to extract transfers: {e}")
            return []

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
            logger.debug(f"get_transaction raw response: {json.dumps(response, indent=2)[:2000]}")
    
            if "error" in response:
                logger.error(f"Error fetching transaction {signature}: {response['error']}")
                return None
    
            result = response.get("result")
            if not result:
                logger.debug(f"No transaction found for signature: {signature}")
                return None
    
            # --- EXTRACT AND LOG TRANSFERS ---
            extracted_transfers = self.extract_transfers_from_rpc_response(result)
            if extracted_transfers:
                logger.info(
                    f"Extracted transfers for signature {signature}: {json.dumps(extracted_transfers, indent=2, default=str)[:2000]}"
                )
            else:
                logger.info(
                    f"No transfers extracted for signature {signature}."
                )
            # --- END LOG ---
    
            return await self._parse_transaction_response(result)
    
        except Exception as e:
            logger.error(f"Error fetching transaction {signature}: {e}")
            raise
        
    async def _parse_transaction_response(self, tx_value: dict) -> Optional[TransactionDetail]:
        """Parse raw transaction response into TransactionDetail model."""
        try:
            logger.debug(f"Parsing transaction response: {json.dumps(tx_value, indent=2)[:2000]}")
            # Extract basic transaction information
            signature = tx_value.get("transaction", {}).get("signatures", [""])[0]
            message = tx_value.get("transaction", {}).get("message", {})
            meta = tx_value.get("meta", {})
            
            # Get timestamp
            block_time = tx_value.get("blockTime", 0)
            timestamp = datetime.fromtimestamp(block_time) if block_time else datetime.utcnow()
            
            # Extract account keys and program IDs
            account_keys = message.get("accountKeys", [])
            program_ids = [key for key in account_keys if self._is_program_id(key)]
            
            # Extract pre and post balances
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            
            # Detect scenario first
            scenario = await self._detect_transaction_scenario(
                program_ids=program_ids,
                pre_balances=pre_balances,
                post_balances=post_balances,
                account_keys=account_keys,
                meta=meta
            )
            
            # Calculate transfers with scenario context
            transfers = []
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                if i < len(account_keys):
                    change = Decimal(str(post - pre)) / Decimal("1000000000")
                    if change != 0:
                        try:
                            transfer = Transfer(
                                from_address=account_keys[i],
                                to_address=account_keys[i+1] if i+1 < len(account_keys) else None,
                                amount=abs(change),
                                direction="out" if change < 0 else "in",
                                scenario_type=scenario.type if scenario else None,
                                scenario_description=scenario.details.user_message if scenario else None
                            )
                            transfers.append(transfer)
                        except Exception as e:
                            logger.error(f"Failed to create Transfer object: {e}")
                            continue
    
            # Create SolanaTransaction instance
            solana_tx = SolanaTransaction(
                tx_hash=signature,
                timestamp=timestamp,
                block_time=block_time,
                success=meta.get("err") is None,
                signatures=tx_value.get("transaction", {}).get("signatures", []),
                fee=Decimal(str(meta.get("fee", 0))) / Decimal("1000000000"),
                scenario=scenario,
                instructions=[],
                program_ids=program_ids
            )
    
            return TransactionDetail(
                signature=signature,
                timestamp=timestamp,
                transfers=transfers,
                transaction=solana_tx,
                scenario=scenario
            )
            
        except Exception as e:
            logger.error(f"Error parsing transaction response: {e}")
            logger.debug(f"Raw transaction value: {json.dumps(tx_value, indent=2)[:2000]}")
            return None
    
    def _is_program_id(self, address: str) -> bool:
        """Check if address is likely a program ID."""
        # Program IDs are usually longer than 32 chars and start with specific patterns
        return len(address) >= 32 and not address.startswith("1111")

    @dataclass
    class Transfer:
        """Represents a transfer of SOL between addresses."""
        from_address: str
        to_address: Optional[str]
        amount: Decimal
        direction: str  # "in" or "out"
        scenario_type: Optional[str] = None
        scenario_description: Optional[str] = None
    
    async def _detect_transaction_scenario(
        self,
        program_ids: List[str],
        pre_balances: List[int],
        post_balances: List[int],
        account_keys: List[str],
        meta: Dict
    ) -> Optional[DetectedScenario]:
        """
        Detect special transaction scenarios.
        
        Returns:
            Optional[DetectedScenario]: Detected scenario or None
        """
        try:
            # Known program IDs
            STAKE_PROGRAM = "Stake11111111111111111111111111111111111111"
            TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPE8839dhk8qSu5v3LwRK4"
            SYSTEM_PROGRAM = "11111111111111111111111111111111"
            
            current_time = datetime.utcnow().isoformat()
            
            # Case 1: Check for burned tokens
            if any(addr.startswith("1111") and addr != SYSTEM_PROGRAM for addr in account_keys):
                return DetectedScenario(
                    type=ScenarioType.burned,
                    confidence=1.0,
                    details=ScenarioDetails(
                        type=ScenarioType.burned,
                        confidence_score=1.0,
                        detection_time=current_time,
                        relevant_addresses=[addr for addr in account_keys if addr.startswith("1111")],
                        metadata={
                            "is_terminal": True,
                            "can_be_recovered": False
                        }
                    ),
                    related_transactions=[],
                    detection_rules_matched=["burn_address_pattern"],
                    user_message="Tokens were permanently burned and cannot be recovered."
                )
                
            # Case 2: Check for staking
            if STAKE_PROGRAM in program_ids:
                return DetectedScenario(
                    type=ScenarioType.delegated_staking,
                    confidence=0.9,
                    details=ScenarioDetails(
                        type=ScenarioType.delegated_staking,
                        confidence_score=0.9,
                        detection_time=current_time,
                        relevant_addresses=account_keys,
                        metadata={
                            "is_terminal": False,
                            "can_be_recovered": True,
                            "expected_duration": "until unstaked"
                        }
                    ),
                    related_transactions=[],
                    detection_rules_matched=["stake_program_interaction"],
                    user_message="Funds are staked and earning rewards. You can unstake them later."
                )
                
            # Case 3: Dust amounts
            total_change = sum(post - pre for post, pre in zip(post_balances, pre_balances))
            if abs(total_change) < 1000:  # Less than 0.000001 SOL
                return DetectedScenario(
                    type=ScenarioType.lost_or_dust,
                    confidence=1.0,
                    details=ScenarioDetails(
                        type=ScenarioType.lost_or_dust,
                        confidence_score=1.0,
                        detection_time=current_time,
                        relevant_addresses=[],
                        metadata={
                            "is_terminal": True,
                            "can_be_recovered": False,
                            "amount": str(total_change / 1000000000)
                        }
                    ),
                    related_transactions=[],
                    detection_rules_matched=["dust_amount"],
                    user_message="Amount is too small to be economically recovered (dust)."
                )
                
            # Case 4: Failed transaction
            if meta.get("err"):
                return DetectedScenario(
                    type=ScenarioType.failed_transaction,
                    confidence=1.0,
                    details=ScenarioDetails(
                        type=ScenarioType.failed_transaction,
                        confidence_score=1.0,
                        detection_time=current_time,
                        relevant_addresses=account_keys,
                        metadata={
                            "is_terminal": True,
                            "error": str(meta["err"]),
                            "can_be_recovered": False
                        }
                    ),
                    related_transactions=[],
                    detection_rules_matched=["transaction_error"],
                    user_message=f"Transaction failed to execute: {meta['err']}"
                )
    
            return None
            
        except Exception as e:
            logger.error(f"Error detecting transaction scenario: {e}")
            return None

    
    def _is_program_id(self, address: str) -> bool:
        """Check if address is likely a program ID."""
        # Program IDs are usually longer than 32 chars and start with specific patterns
        return len(address) >= 32 and not address.startswith("1111")
    
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

            logger.debug(f"get_transactions_for_address raw response: {json.dumps(response, indent=2)[:2000]}")
            
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

    async def get_recent_blockhash(self) -> str:
        """Get recent blockhash for transaction construction."""
        await self._ensure_connection()
        
        try:
            response = await self._make_rpc_call(
                "getRecentBlockhash",
                []
            )

            logger.debug(f"get_recent_blockhash raw response: {json.dumps(response, indent=2)[:2000]}")
            
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

            logger.debug(f"get_minimum_balance_for_rent_exemption raw response: {json.dumps(response, indent=2)[:2000]}")
            
            if "error" in response:
                raise ValueError(f"Could not fetch minimum balance: {response['error']}")
                
            return response.get("result", 0)
            
        except Exception as e:
            logger.error(f"Error fetching minimum balance: {e}")
            raise

    async def close(self):
        """Close aiohttp session and cleanup resources."""
        if hasattr(self, '_session') and self._session and not self._session.closed:
            await self._session.close()
            self._session = None

