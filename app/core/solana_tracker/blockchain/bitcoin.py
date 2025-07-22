from bit import AsyncKey, AsyncBit, AsyncMultisig
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
from app.core.blockchain.interfaces import BlockchainRepository, BlockchainConfig
from app.core.models.transaction import TransactionDetail, OperationDetail, OperationType

class BitcoinRepository(BlockchainRepository):
    def __init__(self, config: BlockchainConfig):
        super().__init__(config)
        self.bit = AsyncBit(config.primary_rpc_url)
        self.fallbacks = [AsyncBit(url) for url in config.fallback_rpcs]
    
    async def get_transaction(self, tx_hash: str) -> TransactionDetail:
        raw_tx = await self.bit.get_transaction(tx_hash)
        
        return TransactionDetail(
            tx_hash=tx_hash,
            from_address=raw_tx["inputs"][0]["address"],
            to_address=raw_tx["outputs"][0]["address"],
            value=Decimal(raw_tx["outputs"][0]["value"]) / Decimal(1e8),
            fee=Decimal(raw_tx["fee"]),
            timestamp=datetime.utcfromtimestamp(raw_tx["timestamp"]),
            status="confirmed" if raw_tx["confirmations"] > 0 else "pending",
            operations=self._extract_operations(raw_tx),
            raw_data=raw_tx
        )
    
    def _extract_operations(self, tx) -> List[OperationDetail]:
        operations = []
        
        # Native UTXO-Transfers
        for output in tx["outputs"]:
            operations.append(OperationDetail(
                type=OperationType.TRANSFER,
                from_address=tx["inputs"][0]["address"] if tx["inputs"] else None,
                to_address=output["address"],
                value=Decimal(output["value"]) / Decimal(1e8),
                raw_data=output
            ))
        
        return operations
    
    async def get_balance(self, address: str) -> Decimal:
        balance = await self.bit.get_balance(address)
        return Decimal(balance) / Decimal(1e8)
