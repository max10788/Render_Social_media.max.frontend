from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import httpx
from app.core.solana_tracker.blockchain.interfaces import BlockchainRepository, BlockchainConfig
from app.core.solana_tracker.models.transaction import TransactionDetail, OperationDetail, OperationType
from app.core.solana_tracker.utils.rate_limit import RateLimiter
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager

class EnhancedSolanaRepository(BlockchainRepository):
    def __init__(self, config: BlockchainConfig):
        super().__init__(config)
        self.endpoint_manager = RpcEndpointManager(
            primary_url=config.primary_rpc_url,
            fallback_urls=config.fallback_rpc_urls
        )
        self.rate_limiter = RateLimiter(config.rate_limit_config)
    
    async def get_transaction(self, tx_hash: str) -> TransactionDetail:
        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getTransaction",
                    "params": [tx_hash, {"encoding": "json"}]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_transaction(data["result"])
            return None
    
    def _parse_transaction(self, data: Dict) -> TransactionDetail:
        message = data["transaction"]["message"]
        meta = data["meta"]
        
        operations = self._extract_operations(message, meta)

        # For simplicity, we'll leave the main from/to addresses and value as placeholders
        # and let the operations list provide the detailed information.
        from_address = message["accountKeys"][0]
        to_address = None # This will be determined by the operations
        value = Decimal(0)

        if operations:
            # Heuristic to determine the primary "to" address
            # This could be improved based on the specific use case
            if operations[0].to_address:
                to_address = operations[0].to_address
            value = sum(op.value for op in operations if op.type == OperationType.TRANSFER)

        return TransactionDetail(
            tx_hash=data["transaction"]["signatures"][0],
            from_address=from_address,
            to_address=to_address,
            value=value,
            fee=Decimal(meta["fee"]) / Decimal(1e9),
            timestamp=datetime.utcfromtimestamp(data["blockTime"]),
            status="confirmed" if meta["err"] is None else "failed",
            operations=operations,
            raw_data=data
        )
    
    def _extract_operations(self, message: Dict, meta: Dict) -> List[OperationDetail]:
        operations: List[OperationDetail] = []
        account_keys = [str(key) for key in message["accountKeys"]]
        
        # Native SOL Transfers
        balance_changes = {}
        for i, acc_key in enumerate(account_keys):
            pre_balance = meta["preBalances"][i]
            post_balance = meta["postBalances"][i]
            balance_changes[acc_key] = post_balance - pre_balance

        # A simple heuristic for identifying a transfer: one account decreases, another increases.
        # This is a simplification and might not cover all cases (e.g., multiple recipients).
        senders = [addr for addr, change in balance_changes.items() if change < 0]
        receivers = [addr for addr, change in balance_changes.items() if change > 0]

        # For simplicity, we'll assume a single sender and receiver for native transfers for now.
        if len(senders) == 1 and len(receivers) == 1:
            sender = senders[0]
            receiver = receivers[0]
            # The value is the absolute change from the sender's account.
            value = abs(balance_changes[sender])

            operations.append(OperationDetail(
                type=OperationType.TRANSFER,
                from_address=sender,
                to_address=receiver,
                value=Decimal(value) / Decimal(1e9),
                raw_data={"balance_change": value}
            ))

        # SPL Token Transfers & Smart Contract Interactions
        log_messages = meta.get("logMessages", [])
        for log in log_messages:
            # SPL Token Transfer
            if "Instruction: Transfer" in log:
                # Example log: "Program log: Instruction: Transfer"
                # The actual details (from, to, amount) are typically in subsequent logs or instructions.
                # This requires more sophisticated parsing based on the program's logging format.
                # For now, we'll just identify that a token transfer occurred.
                program_id = self._find_program_id_for_log(log, message["instructions"], account_keys)
                if program_id == "TokenkegQfeZyiNwAJbNbGKL61KC715e85e6d735":
                    # This is a standard SPL token transfer. We need to parse the instruction data.
                    # This is a placeholder for the complex parsing logic required.
                    operations.append(OperationDetail(
                        type=OperationType.TOKEN_TRANSFER,
                        from_address=None, # Placeholder
                        to_address=None, # Placeholder
                        value=Decimal(0), # Placeholder
                        contract_address=program_id,
                        method="transfer",
                        raw_data={"log": log}
                    ))

            # Cross-chain events (Wormhole example)
            if "Program log: Instruction: PostMessage" in log:
                program_id = self._find_program_id_for_log(log, message["instructions"], account_keys)
                if "worm2ZoG2kUd4vFXLJ2evDPZZ_rYnC" in program_id: # Wormhole Program ID
                     operations.append(OperationDetail(
                        type=OperationType.CROSS_CHAIN,
                        from_address=None, # Placeholder
                        to_address=None, # Placeholder
                        value=Decimal(0), # Placeholder
                        contract_address=program_id,
                        method="post_message",
                        raw_data={"log": log}
                    ))
        
        # Generic Smart Contract Interaction
        for instruction in message["instructions"]:
            program_id = account_keys[instruction["programIdIndex"]]
            if program_id not in ["TokenkegQfeZyiNwAJbNbGKL61KC715e85e6d735", "11111111111111111111111111111111"]:
                operations.append(OperationDetail(
                    type=OperationType.CONTRACT_CALL,
                    from_address=message["accountKeys"][0], # Fee payer
                    to_address=None,
                    value=Decimal(0),
                    contract_address=program_id,
                    method=None, # Method would need to be decoded from instruction data
                    raw_data={"instruction": instruction}
                ))

        return operations

    def _find_program_id_for_log(self, log, instructions, account_keys):
        # This is a simple heuristic. A more robust solution would be needed for complex transactions.
        # It assumes the log is for the most recent instruction.
        # A better approach would be to process logs and instructions in order.
        if "Program log:" in log:
            # The program ID is not directly in the log message, so we have to infer it.
            # This is a significant challenge in Solana transaction parsing.
            # We will return a placeholder for now.
            return "Unknown"
        return "Unknown"

    async def get_transactions_for_address(self, address: str, limit: int = 50) -> List[TransactionDetail]:
        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getSignaturesForAddress",
                    "params": [address, {"limit": limit}]
                }
            )

            if response.status_code == 200:
                signatures = response.json()["result"]
                transactions = []
                for sig in signatures:
                    tx = await self.get_transaction(sig["signature"])
                    if tx:
                        transactions.append(tx)
                return transactions
            return []

    async def get_balance(self, address: str) -> Decimal:
        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getBalance",
                    "params": [address]
                }
            )

            if response.status_code == 200:
                balance = response.json()["result"]["value"]
                return Decimal(balance) / Decimal(1e9)
            return Decimal(0)

    async def get_latest_block(self) -> int:
        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getSlot",
                    "params": []
                }
            )

            if response.status_code == 200:
                return response.json()["result"]
            return 0
