import httpx
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.core.solana_tracker.blockchain.interfaces import BlockchainRepository, BlockchainConfig
from app.core.solana_tracker.models.transaction import TransactionDetail, OperationDetail, OperationType
from app.core.solana_tracker.utils.rate_limit import RateLimiter
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager
from app.core.solana_tracker.bridges.wormhole import WormholeBridge

class EnhancedSolanaRepository(BlockchainRepository):
    """
    Enhanced repository for interacting with the Solana blockchain.

    This class provides a high-level interface for fetching and parsing
    transaction data from Solana's RPC endpoints. It includes features like
    rate limiting, endpoint management, and detailed parsing of various
    instruction types.
    """
    def __init__(self, config: BlockchainConfig, cache: RedisCache):
        super().__init__(config)
        self.endpoint_manager = RpcEndpointManager(
            primary_url=config.primary_rpc,
            fallback_urls=config.fallback_rpcs
        )
        self.rate_limiter = RateLimiter(rate_limit=10, period=1) # Default rate limit: 10 requests per second
        self.wormhole_bridge = WormholeBridge()
        self.cache = cache
        self.client = httpx.AsyncClient()

    async def get_transaction(self, tx_hash: str) -> Optional[TransactionDetail]:
        """
        Fetches and parses a single transaction from the Solana blockchain.

        Args:
            tx_hash: The signature of the transaction to fetch.

        Returns:
            A TransactionDetail object if the transaction is found, otherwise None.
        """
        cache_key = f"transaction:{tx_hash}"
        cached_tx = await self.cache.get(cache_key)
        if cached_tx:
            return TransactionDetail(**cached_tx.value)

        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()
        
        try:
            response = await self.client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getTransaction",
                    "params": [tx_hash, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}]
                }
            )
            response.raise_for_status()
            
            data = response.json().get("result")
            if data:
                tx = self._parse_transaction(data)
                await self.cache.set(cache_key, tx.dict(), ttl=3600)
                return tx
            return None
        except httpx.HTTPStatusError as e:
            # Handle HTTP errors (e.g., 404, 500)
            print(f"HTTP error fetching transaction {tx_hash}: {e}")
            await self.endpoint_manager.report_failure(url)
            return None
        except Exception as e:
            # Handle other errors (e.g., network issues)
            print(f"Error fetching transaction {tx_hash}: {e}")
            return None

    async def get_transactions_for_address(self, address: str, limit: int = 10) -> List[TransactionDetail]:
        """
        Fetches the most recent transactions for a given address.

        Args:
            address: The address to fetch transactions for.
            limit: The maximum number of transactions to return.

        Returns:
            A list of TransactionDetail objects.
        """
        cache_key = f"transactions_for_address:{address}:{limit}"
        cached_txs = await self.cache.get(cache_key)
        if cached_txs:
            return [TransactionDetail(**tx) for tx in cached_txs.value]

        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()

        try:
            response = await self.client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getSignaturesForAddress",
                    "params": [address, {"limit": limit}]
                }
            )
            response.raise_for_status()

            signatures = [item["signature"] for item in response.json().get("result", [])]
            transactions = []
            for sig in signatures:
                tx = await self.get_transaction(sig)
                if tx:
                    transactions.append(tx)

            await self.cache.set(cache_key, [tx.dict() for tx in transactions], ttl=60)
            return transactions
        except httpx.HTTPStatusError as e:
            print(f"HTTP error fetching transactions for {address}: {e}")
            await self.endpoint_manager.report_failure(url)
            return []
        except Exception as e:
            print(f"Error fetching transactions for {address}: {e}")
            return []

    async def get_balance(self, address: str) -> Decimal:
        """
        Fetches the balance of a given address.

        Args:
            address: The address to fetch the balance for.

        Returns:
            The balance of the address in SOL.
        """
        cache_key = f"balance:{address}"
        cached_balance = await self.cache.get(cache_key)
        if cached_balance:
            return Decimal(cached_balance.value)

        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()

        try:
            response = await self.client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getBalance",
                    "params": [address]
                }
            )
            response.raise_for_status()

            value = response.json().get("result", {}).get("value", 0)
            balance = Decimal(value) / Decimal(1e9)
            await self.cache.set(cache_key, str(balance), ttl=60)
            return balance
        except httpx.HTTPStatusError as e:
            print(f"HTTP error fetching balance for {address}: {e}")
            await self.endpoint_manager.report_failure(url)
            return Decimal(0)
        except Exception as e:
            print(f"Error fetching balance for {address}: {e}")
            return Decimal(0)

    async def get_latest_block(self) -> int:
        """
        Fetches the latest block number from the Solana blockchain.

        Returns:
            The latest block number.
        """
        cache_key = "latest_block"
        cached_block = await self.cache.get(cache_key)
        if cached_block:
            return cached_block.value

        await self.rate_limiter.wait()
        url = await self.endpoint_manager.get_healthy_endpoint()

        try:
            response = await self.client.post(
                url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getSlot",
                    "params": []
                }
            )
            response.raise_for_status()

            latest_block = response.json().get("result", 0)
            await self.cache.set(cache_key, latest_block, ttl=10)
            return latest_block
        except httpx.HTTPStatusError as e:
            print(f"HTTP error fetching latest block: {e}")
            await self.endpoint_manager.report_failure(url)
            return 0
        except Exception as e:
            print(f"Error fetching latest block: {e}")
            return 0

    def _parse_transaction(self, data: Dict) -> TransactionDetail:
        message = data["transaction"]["message"]
        meta = data["meta"]
        
        return TransactionDetail(
            tx_hash=data["transaction"]["signatures"][0],
            from_address=message["accountKeys"][0]["pubkey"],
            to_address=message["accountKeys"][1]["pubkey"] if len(message["accountKeys"]) > 1 else None,
            value=Decimal(meta["postBalances"][0] - meta["preBalances"][0]) / Decimal(1e9),
            fee=Decimal(meta["fee"]) / Decimal(1e9),
            timestamp=datetime.utcfromtimestamp(data["blockTime"]),
            status="confirmed" if meta["err"] is None else "failed",
            operations=self._extract_operations(message, meta),
            raw_data=data
        )
    
    def _extract_operations(self, message: Dict, meta: Dict) -> List[OperationDetail]:
        operations = []
        account_keys = [key["pubkey"] for key in message["accountKeys"]]
        
        for instruction in message["instructions"]:
            program_id = instruction["programId"]

            # Wormhole
            wormhole_op = self.wormhole_bridge.parse_transaction(instruction, account_keys)
            if wormhole_op:
                operations.append(wormhole_op)
                continue

            if program_id == "11111111111111111111111111111111": # System Program
                if instruction["parsed"]["type"] == "transfer":
                    info = instruction["parsed"]["info"]
                    operations.append(OperationDetail(
                        type=OperationType.TRANSFER,
                        from_address=info["source"],
                        to_address=info["destination"],
                        value=Decimal(info["lamports"]) / Decimal(1e9),
                        contract_address=program_id,
                        method="transfer",
                        raw_data=info
                    ))

            elif program_id == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": # Token Program
                parsed_info = instruction.get("parsed", {})
                if parsed_info.get("type") == "transfer":
                    info = parsed_info["info"]
                    operations.append(OperationDetail(
                        type=OperationType.TOKEN_TRANSFER,
                        from_address=info["source"],
                        to_address=info["destination"],
                        value=Decimal(info["amount"]) / Decimal(10**info.get("decimals", 0)),
                        contract_address=info["mint"],
                        method="transfer",
                        raw_data=info
                    ))

        # Fallback for native SOL transfers if not captured by instructions
        if not any(op.type == OperationType.TRANSFER for op in operations):
            for i in range(len(meta["preBalances"])):
                change = meta["postBalances"][i] - meta["preBalances"][i]
                if change != 0:
                    operations.append(OperationDetail(
                        type=OperationType.TRANSFER,
                        from_address=account_keys[i] if change < 0 else "N/A",
                        to_address=account_keys[i] if change > 0 else "N/A",
                        value=Decimal(abs(change)) / Decimal(1e9),
                        contract_address=None,
                        method=None,
                        raw_data={"balance_change": change}
                    ))

        return operations
