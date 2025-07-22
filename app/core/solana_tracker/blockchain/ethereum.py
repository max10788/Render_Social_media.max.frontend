from web3 import AsyncWeb3
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
from app.core.blockchain.interfaces import BlockchainRepository, BlockchainConfig
from app.core.models.transaction import TransactionDetail, OperationDetail, OperationType

class EthereumRepository(BlockchainRepository):
    def __init__(self, config: BlockchainConfig):
        super().__init__(config)
        self.w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(config.primary_rpc))
        self.fallbacks = [AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(url)) for url in config.fallback_rpcs]
    
    async def get_transaction(self, tx_hash: str) -> TransactionDetail:
        raw_tx = await self.w3.eth.get_transaction(tx_hash)
        receipt = await self.w3.eth.get_transaction_receipt(tx_hash)
        
        operations = await self._extract_operations(raw_tx, receipt)
        
        return TransactionDetail(
            tx_hash=tx_hash,
            from_address=raw_tx["from"],
            to_address=raw_tx.get("to"),
            value=Decimal(raw_tx["value"]) / Decimal(1e18),
            fee=Decimal(raw_tx["gas"]) * Decimal(raw_tx["gasPrice"]) / Decimal(1e18),
            timestamp=datetime.utcfromtimestamp((await self.w3.eth.get_block(raw_tx["blockNumber"]))["timestamp"]),
            status="confirmed" if receipt["status"] == 1 else "failed",
            operations=operations,
            raw_data=raw_tx
        )
    
    async def _extract_operations(self, tx, receipt) -> List[OperationDetail]:
        operations = []
        
        # Native Transfer
        operations.append(OperationDetail(
            type=OperationType.TRANSFER,
            from_address=tx["from"],
            to_address=tx.get("to"),
            value=Decimal(tx["value"]) / Decimal(1e18),
            raw_data=tx
        ))
        
        # Token Transfers
        if receipt.get("logs"):
            for log in receipt["logs"]:
                if self._is_erc20_transfer(log):
                    token_data = self._parse_erc20_transfer(log)
                    operations.append(OperationDetail(
                        type=OperationType.TOKEN_TRANSFER,
                        **token_data
                    ))
        
        return operations
    
    def _is_erc20_transfer(self, log):
        return log["topics"][0].hex() == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    
    def _parse_erc20_transfer(self, log):
        # Implementiere ERC-20 Transfer Parsing Logik
        return {
            "from_address": "0x" + log["topics"][1].hex()[26:],
            "to_address": "0x" + log["topics"][2].hex()[26:],
            "value": Decimal(int(log["data"].hex(), 16)) / Decimal(1e18),
            "contract_address": log["address"],
            "raw_data": log
        }
