from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.core.blockchain.interfaces import BlockchainRepository, BlockchainConfig
from app.core.models.base_models import TransactionDetail, InstructionDetail
from app.core.utils.rate_limit import RateLimiter
from app.core.utils.rpc_endpoint_manager import RpcEndpointManager

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
        
        return TransactionDetail(
            tx_hash=data["transaction"]["signatures"][0],
            from_address=message["accountKeys"][0],
            to_address=message["accountKeys"][1] if len(message["accountKeys"]) > 1 else None,
            value=Decimal(meta["postBalances"][0] - meta["preBalances"][0]) / Decimal(1e9),
            fee=Decimal(meta["fee"]) / Decimal(1e9),
            timestamp=datetime.utcfromtimestamp(data["blockTime"]),
            status="confirmed" if meta["err"] is None else "failed",
            operations=self._extract_operations(message, meta),
            raw_data=data
        )
    
    def _extract_operations(self, message, meta) -> List[OperationDetail]:
        operations = []
        account_keys = message["accountKeys"]
        
        # Native SOL Transfers
        for idx, (pre, post) in enumerate(zip(meta["preBalances"], meta["postBalances"])):
            if pre != post:
                change = post - pre
                if change != 0:
                    operations.append(OperationDetail(
                        type=OperationType.TRANSFER,
                        from_address=account_keys[idx] if change < 0 else None,
                        to_address=account_keys[idx] if change > 0 else None,
                        value=Decimal(abs(change)) / Decimal(1e9),
                        raw_data={"balance_change": change}
                    ))
        
        return operations
