from typing import List, Set, Dict, Any, Optional
from fastapi import HTTPException
from solana.rpc.api import Client
from solders.pubkey import Pubkey as PublicKey
from solders.signature import Signature
from datetime import datetime
import base58
import logging
import asyncio
from functools import wraps
from app.models.schemas import (
    TransactionTrackRequest,
    TransactionTrackResponse,
    TrackedTransaction,
    ScenarioType,
    FinalStatusEnum
)
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def handle_rpc_errors(func):
    """Decorator to handle RPC errors consistently."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValueError as ve:
            logger.error(f"Value error in {func.__name__}: {str(ve)}")
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    return wrapper

class SolanaClient:
    def __init__(self, rpc_url: str = None): 
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
        self.client = Client(self.rpc_url)
        self.KNOWN_BRIDGES = {
            "wormhole": {
                "address_prefixes": ["Bridge1p5g8jV1tPF3X8D79uHQfLpHDEPw5tsqZ9t6vG2K"],
                "target_chain": "Ethereum",
                "protocol": "Wormhole"
            },
            "allbridge": {
                "address_prefixes": ["allBRigjtX11x8wfeUB4A6Z7eDnUwKhRcpJqiQ8D7Eqyuf"],
                "target_chain": "Ethereum",
                "protocol": "Allbridge"
            }
        }

    def _convert_to_signature(self, signature_str: str) -> Signature:
        """
        Convert string signature to Solana Signature object with improved validation.
        """
        if not signature_str:
            raise ValueError("Signature cannot be empty")
            
        # Remove any whitespace
        signature_str = signature_str.strip()
        
        try:
            # First try: direct bytes conversion
            try:
                decoded = base58.b58decode(signature_str)
                if len(decoded) == 64:  # Valid Solana signature length
                    return Signature.from_bytes(decoded)
            except Exception as e:
                logger.debug(f"Base58 decode attempt failed: {e}")
                
            # Second try: direct string conversion
            try:
                return Signature.from_string(signature_str)
            except Exception as e:
                logger.debug(f"Direct string conversion failed: {e}")
                
            # Final try: normalized string
            normalized = ''.join(c for c in signature_str if c.isalnum())
            return Signature.from_string(normalized)
                
        except Exception as e:
            error_msg = f"Invalid signature format: {signature_str}. Error: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    async def _get_transaction_with_retry(self, tx_signature: str, retries: int = 3, delay: float = 1.0):
        """
        Fetch transaction with retries and improved error handling.
        
        Args:
            tx_signature (str): The transaction signature to fetch
            retries (int): Number of retry attempts (default: 3)
            delay (float): Base delay between retries in seconds (default: 1.0)
            
        Returns:
            dict: Transaction data if found
            
        Raises:
            HTTPException: If transaction cannot be fetched after retries
        """
        last_error = None
        
        try:
            # Validate signature first - if invalid, fail fast
            signature = self._convert_to_signature(tx_signature)
        except ValueError as ve:
            logger.error(f"Invalid signature format: {ve}")
            raise HTTPException(status_code=400, detail=str(ve))
        
        for attempt in range(retries):
            try:
                response = self.client.get_transaction(
                    signature,
                    "json",
                    0,
                    max_supported_transaction_version=0
                )
                
                if response and getattr(response, "result", None):
                    return response.result
                    
                logger.warning(f"Attempt {attempt + 1}: Transaction {tx_signature} not found")
                
            except Exception as e:
                last_error = e
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                
                if attempt < retries - 1:
                    # Exponential backoff
                    wait_time = delay * (2 ** attempt)
                    logger.info(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    
        error_msg = f"Failed to fetch transaction {tx_signature} after {retries} attempts"
        if last_error:
            error_msg += f": {str(last_error)}"
            
        logger.error(error_msg)
        raise HTTPException(status_code=404, detail=error_msg)

    def _extract_transaction_data(self, tx_value) -> Optional[Any]:
        """Extract transaction data handling different response formats."""
        if hasattr(tx_value, "transaction"):
            tx = tx_value.transaction
            if hasattr(tx, "transaction"):
                return tx.transaction
            elif hasattr(tx, "value"):
                return tx.value
            return tx
        return None

    def _extract_message_data(self, transaction) -> Optional[Any]:
        """Extract message data from transaction."""
        if hasattr(transaction, "message"):
            return transaction.message
        elif isinstance(transaction, dict) and "message" in transaction:
            return transaction["message"]
        return None

    def _parse_account_keys(self, message) -> List[str]:
        """Parse account keys from message data."""
        if hasattr(message, "account_keys"):
            return [str(key) for key in message.account_keys]
        elif isinstance(message, dict) and "accountKeys" in message:
            return message["accountKeys"]
        return []

    def _fallback_account_keys(self, tx_value) -> List[str]:
        """Fallback method to extract account keys from raw transaction."""
        try:
            if hasattr(tx_value, "transaction"):
                raw_message = tx_value.transaction.message
                if hasattr(raw_message, "account_keys"):
                    return [str(key) for key in raw_message.account_keys]
            return []
        except Exception as e:
            logger.warning(f"Fallback account keys extraction failed: {e}")
            return []

    def _extract_meta_data(self, tx_value) -> Optional[Any]:
        """Extract metadata handling different response formats."""
        if hasattr(tx_value, "meta"):
            return tx_value.meta
        elif isinstance(tx_value, dict) and "meta" in tx_value:
            return tx_value["meta"]
        return None

    def _parse_transfer_data(self, meta, account_keys: List[str]) -> dict:
        """Parse transfer data from transaction metadata."""
        result = {
            "transfers_SOL": [],
            "transfers_SPL": []
        }

        try:
            pre_balances = getattr(meta, "pre_balances", [])
            post_balances = getattr(meta, "post_balances", [])

            # Parse SOL transfers
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                change = (post - pre) / 1e9  # Lamports to SOL
                if change != 0 and i < len(account_keys):
                    result["transfers_SOL"].append({
                        "wallet": account_keys[i],
                        "amount_change": change
                    })

            # Parse SPL token transfers from logs
            logs = getattr(meta, "log_messages", []) or []
            if self.is_spl_token_transfer(logs):
                spl_data = self.parse_spl_token_data(logs)
                if spl_data:
                    result["transfers_SPL"].append(spl_data)

        except Exception as e:
            logger.warning(f"Error parsing transfer data: {e}")

        return result

    def _fallback_transfer_data(self, tx_value) -> dict:
        """Fallback method to extract basic transfer data."""
        return {
            "transfers_SOL": [],
            "transfers_SPL": []
        }

    def is_spl_token_transfer(self, logs: List[str]) -> bool:
        return any(
            "transfer" in log and "TokenkegQfeZyiNwAJbNbGKL67dsAqYh6UPjvF9ME8k8eX5" in log 
            for log in logs or []
        )

    def parse_spl_token_data(self, logs: List[str]) -> dict:
        token_data = {"token_symbol": "Unknown", "amount": 0.0, "decimals": 9, "mint_address": None}
        for log in logs or []:
            if "Program log:" in log:
                continue
            if "transfer" in log:
                parts = log.split()
                if len(parts) > 3:
                    try:
                        from_wallet = parts[2]
                        to_wallet = parts[4]
                        amount = float(parts[-2])
                        token_data.update({"from": from_wallet, "to": to_wallet, "amount": amount})
                    except Exception as e:
                        logger.warning(f"Error parsing SPL token data from log '{log}': {e}")
        return token_data

    @handle_rpc_errors
    async def get_transaction(self, tx_signature: str):
        """Get transaction details from Solana blockchain."""
        try:
            signature = self._convert_to_signature(tx_signature)
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.get_transaction(
                    signature,
                    encoding="json",
                    max_supported_transaction_version=0
                )
            )
            if response is None or not hasattr(response, "value"):
                raise HTTPException(
                    status_code=404,
                    detail=f"Transaction {tx_signature} not found"
                )
            return response
        except ValueError as ve:
            logger.error(f"Invalid signature format: {ve}")
            raise HTTPException(status_code=400, detail=str(ve))

    async def parse_solana_transaction(self, tx_signature: str) -> dict:
        """Parse a Solana transaction with improved validation and logging."""
        try:
            tx_resp = await self.get_transaction(tx_signature)
            if not hasattr(tx_resp, "value") or tx_resp.value is None:
                logger.error(f"Transaction response missing value for: {tx_signature}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Transaction {tx_signature} not found"
                )
    
            tx_value = tx_resp.value
            result = {
                "tx_hash": tx_signature,
                "account_keys": [],
                "transfers_SOL": [],
                "transfers_SPL": [],
                "timestamp": None,
            }
    
            # Extract timestamp with validation
            try:
                block_time = getattr(tx_value, "block_time", None)
                if block_time:
                    result["timestamp"] = datetime.utcfromtimestamp(block_time).isoformat()
                    logger.debug(f"Transaction timestamp: {result['timestamp']}")
                else:
                    logger.warning(f"No block time found for transaction {tx_signature}")
            except Exception as e:
                logger.warning(f"Error parsing block time: {e}")
    
            # Parse transaction data with detailed logging
            try:
                transaction = self._extract_transaction_data(tx_value)
                if transaction is None:
                    logger.warning(f"Could not extract transaction data for {tx_signature}")
                    raise ValueError("Could not extract transaction data")
    
                message = self._extract_message_data(transaction)
                if message:
                    result["account_keys"] = self._parse_account_keys(message)
                    logger.debug(f"Found {len(result['account_keys'])} account keys")
                else:
                    logger.warning(f"No message data found in transaction {tx_signature}")
            except Exception as e:
                logger.warning(f"Error parsing transaction data: {e}")
                result["account_keys"] = self._fallback_account_keys(tx_value)
                logger.info(f"Using fallback account keys, found: {len(result['account_keys'])}")
    
            # Parse transfer data with validation
            try:
                meta = self._extract_meta_data(tx_value)
                if meta:
                    transfer_data = self._parse_transfer_data(meta, result["account_keys"])
                    result.update(transfer_data)
                    
                    # Log transfer details
                    if transfer_data["transfers_SOL"]:
                        logger.info(f"Found {len(transfer_data['transfers_SOL'])} SOL transfers")
                    if transfer_data["transfers_SPL"]:
                        logger.info(f"Found {len(transfer_data['transfers_SPL'])} SPL transfers")
                    
                    if not transfer_data["transfers_SOL"] and not transfer_data["transfers_SPL"]:
                        logger.warning(f"No transfers found in transaction {tx_signature}")
                else:
                    logger.warning(f"No metadata found for transaction {tx_signature}")
                    result.update(self._fallback_transfer_data(tx_value))
            except Exception as e:
                logger.warning(f"Error parsing transfer data: {e}")
                result.update(self._fallback_transfer_data(tx_value))
    
            return result
    
        except Exception as e:
            logger.error(f"Error parsing transaction {tx_signature}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @handle_rpc_errors
    async def get_next_transactions(self, wallet_address: str, limit: int = 1) -> List[str]:
        try:
            pubkey = PublicKey.from_string(wallet_address)
            loop = asyncio.get_running_loop()
            logger.debug(f"Fetching next transactions for wallet: {wallet_address}")
            resp = await loop.run_in_executor(
                None,
                lambda: self.client.get_signatures_for_address(pubkey, limit=limit)
            )
            sigs = [sig.signature.to_string() for sig in getattr(resp, "value", [])]
            logger.debug(f"Next transactions for wallet {wallet_address}: {sigs}")
            return sigs
        except Exception as e:
            logger.error(f"Error fetching wallet history for {wallet_address}: {e}")
            raise

    async def _get_transaction_with_retry(self, tx_signature: str, retries: int = 3, delay: float = 1.0):
        """
        Fetch a transaction with retries in case of failure.

        Args:
            tx_signature (str): The transaction signature to fetch.
            retries (int): Number of retry attempts.
            delay (float): Delay in seconds between retries.

        Returns:
            dict: Transaction details if successful.

        Raises:
            HTTPException: If the transaction cannot be fetched after retries.
        """
        for attempt in range(retries):
            try:
                response = self.client.get_transaction(tx_signature)
                if response and response.get("result"):
                    return response["result"]
                logger.warning(f"Attempt {attempt + 1}: Transaction {tx_signature} not found.")
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed with error: {e}")
            await asyncio.sleep(delay)
        logger.error(f"Failed to fetch transaction {tx_signature} after {retries} attempts.")
        raise HTTPException(status_code=404, detail=f"Transaction {tx_signature} not found after retries.")
    
    @handle_rpc_errors
    async def track_transaction_chain(
        self, 
        start_tx_hash: str, 
        amount_SOL: float, 
        max_depth: int = 10
    ) -> List[TrackedTransaction]:
        """
        Track a chain of transactions with improved validation and logging.
        
        Args:
            start_tx_hash (str): The starting transaction hash
            amount_SOL (float): Amount of SOL to track
            max_depth (int): Maximum depth of transaction chain
            
        Returns:
            List[TrackedTransaction]: List of tracked transactions
            
        Raises:
            ValueError: If input parameters are invalid
            HTTPException: If transaction processing fails
        """
        # Validate input parameters
        if not start_tx_hash:
            raise ValueError("start_tx_hash cannot be empty")
        if amount_SOL <= 0:
            raise ValueError("amount_SOL must be positive")
        if max_depth <= 0:
            raise ValueError("max_depth must be positive")

        visited_signatures: Set[str] = set()
        queue = [(start_tx_hash, amount_SOL)]
        result_transactions = []
        
        logger.info(f"Starting transaction chain tracking for {start_tx_hash}")
        logger.debug(f"Parameters: amount_SOL={amount_SOL}, max_depth={max_depth}")

        try:
            # Verify initial transaction exists
            initial_tx = await self._get_transaction_with_retry(start_tx_hash)
            if not initial_tx:
                logger.error(f"Initial transaction {start_tx_hash} not found")
                return []
        except Exception as e:
            logger.error(f"Failed to verify initial transaction: {e}")
            return []

        while queue and len(result_transactions) < max_depth:
            current_tx_hash, remaining_amount = queue.pop(0)
            
            if current_tx_hash in visited_signatures:
                logger.debug(f"Skipping already visited transaction {current_tx_hash}")
                continue
                
            visited_signatures.add(current_tx_hash)
            logger.debug(f"Processing transaction {current_tx_hash} ({len(visited_signatures)}/{max_depth})")

            try:
                # Get transaction data with retry
                tx_data = await self.parse_solana_transaction(current_tx_hash)
                
                if not tx_data["account_keys"]:
                    logger.warning(f"No account keys found in transaction {current_tx_hash}")
                    continue

                # Process SOL transfers
                incoming_SOL = [t for t in tx_data["transfers_SOL"] if t["amount_change"] > 0]
                if incoming_SOL:
                    logger.info(f"Found {len(incoming_SOL)} incoming SOL transfers in {current_tx_hash}")
                    
                    for incoming in incoming_SOL:
                        from_wallet = tx_data["account_keys"][0] if tx_data["account_keys"] else "unknown"
                        to_wallet = incoming["wallet"]
                        transfer_amount = abs(incoming["amount_change"])
                        
                        if transfer_amount < 0.000001:  # Filter dust transfers
                            logger.debug(f"Skipping dust transfer of {transfer_amount} SOL")
                            continue
                        
                        logger.debug(f"Processing transfer: {transfer_amount} SOL from {from_wallet} to {to_wallet}")
                        
                        tracked_tx = TrackedTransaction(
                            tx_hash=current_tx_hash,
                            from_wallet=from_wallet,
                            to_wallet=to_wallet,
                            amount=transfer_amount,
                            timestamp=tx_data["timestamp"],
                            value_in_target_currency=None,
                        )
                        result_transactions.append(tracked_tx)
                        
                        if len(result_transactions) < max_depth:
                            try:
                                next_signatures = await self.get_next_transactions(to_wallet, limit=1)
                                logger.debug(f"Found {len(next_signatures)} next transactions for {to_wallet}")
                                
                                for sig in next_signatures:
                                    if sig not in visited_signatures:
                                        queue.append((sig, transfer_amount))
                                        logger.debug(f"Added transaction {sig} to processing queue")
                            except Exception as e:
                                logger.warning(f"Error fetching next transactions for {to_wallet}: {e}")

                # Process SPL transfers
                if tx_data["transfers_SPL"]:
                    logger.info(f"Found {len(tx_data['transfers_SPL'])} SPL transfers in {current_tx_hash}")
                    
                    for spl in tx_data["transfers_SPL"]:
                        from_wallet = spl.get("from", "unknown")
                        to_wallet = spl.get("to", "unknown")
                        transfer_amount = spl.get("amount", 0.0)
                        
                        if not all([from_wallet, to_wallet, transfer_amount]):
                            logger.warning(f"Invalid SPL transfer data in {current_tx_hash}")
                            continue
                        
                        logger.debug(f"Processing SPL transfer: {transfer_amount} tokens from {from_wallet} to {to_wallet}")
                        
                        tracked_tx = TrackedTransaction(
                            tx_hash=current_tx_hash,
                            from_wallet=from_wallet,
                            to_wallet=to_wallet,
                            amount=transfer_amount,
                            timestamp=tx_data["timestamp"],
                            value_in_target_currency=None,
                        )
                        result_transactions.append(tracked_tx)
                        
                        if len(result_transactions) < max_depth:
                            try:
                                next_signatures = await self.get_next_transactions(to_wallet, limit=1)
                                logger.debug(f"Found {len(next_signatures)} next transactions for {to_wallet}")
                                
                                for sig in next_signatures:
                                    if sig not in visited_signatures:
                                        queue.append((sig, transfer_amount))
                                        logger.debug(f"Added transaction {sig} to processing queue")
                            except Exception as e:
                                logger.warning(f"Error fetching next SPL transactions for {to_wallet}: {e}")

            except HTTPException as he:
                logger.warning(f"Skipping tx {current_tx_hash} due to HTTPException: {he.detail}")
                continue
            except Exception as e:
                logger.error(f"Error processing transaction {current_tx_hash}: {e}")
                continue

        if not result_transactions:
            logger.warning(
                f"No transactions tracked for hash {start_tx_hash}. "
                f"Queue processed: {len(visited_signatures)}, "
                f"Max depth: {max_depth}"
            )
        else:
            logger.info(
                f"Tracked {len(result_transactions)} transactions in chain "
                f"(max_depth={max_depth}, visited={len(visited_signatures)})"
            )

        return result_transactions
        def detect_scenarios(self, transactions: List[TrackedTransaction]) -> Dict[str, Dict]:
            scenarios = []
            details = {}
            if any("Stake" in t.to_wallet for t in transactions):
                scenarios.append(ScenarioType.delegated_staking)
                details[ScenarioType.delegated_staking] = {"validator": "Solana Validator A"}
            if any("Raydium" in t.to_wallet or "Orca" in t.to_wallet for t in transactions):
                scenarios.append(ScenarioType.defi_deposit)
                details[ScenarioType.defi_deposit] = {"protocol": "Raydium", "pool": "SOL-USDC"}
            if any("NFTMarketplace" in t.to_wallet for t in transactions):
                scenarios.append(ScenarioType.nft_investment)
                details[ScenarioType.nft_investment] = {"marketplace": "MagicEden", "nft_id": "ME_123456"}
            if any("USDC" in t.to_wallet or "StableCoin" in t.to_wallet for t in transactions):
                scenarios.append(ScenarioType.converted_to_stablecoin)
                details[ScenarioType.converted_to_stablecoin] = {"target_token": "USDC"}
            if any("DonationWallet" in t.to_wallet for t in transactions):
                scenarios.append(ScenarioType.donation_or_grant)
                details[ScenarioType.donation_or_grant] = {"organization": "Solana Foundation"}
    
            for tx in transactions:
                for bridge_name, bridge_info in self.KNOWN_BRIDGES.items():
                    if any(prefix in tx.to_wallet for prefix in bridge_info["address_prefixes"]):
                        scenarios.append(ScenarioType.cross_chain_bridge)
                        details[ScenarioType.cross_chain_bridge] = {
                            "protocol": bridge_info["protocol"],
                            "target_chain": bridge_info["target_chain"],
                            "bridge_address_used": tx.to_wallet,
                            "tx_hash": tx.tx_hash
                        }
                        break
    
            if any("MultiSig" in t.to_wallet for t in transactions):
                scenarios.append(ScenarioType.multi_sig_storage)
                details[ScenarioType.multi_sig_storage] = {"signers_required": 2}
    
            if any(t.amount < 0.001 for t in transactions):
                scenarios.append(ScenarioType.lost_or_dust)
                details[ScenarioType.lost_or_dust] = {"threshold_sol": 0.001}
    
            logger.info(f"Scenarios detected: {scenarios}, details: {details}")
            return {"scenarios": scenarios, "details": details}
