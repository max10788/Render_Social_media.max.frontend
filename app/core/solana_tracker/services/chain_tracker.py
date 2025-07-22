from typing import List, Dict, Optional, Tuple
from decimal import Decimal
from datetime import datetime
from app.core.blockchain.interfaces import BlockchainRepository
from app.core.models.transaction import TransactionDetail
from app.core.utils.resolver import BlockchainResolver

class ChainTracker:
    def __init__(self, repositories: Dict[str, BlockchainRepository]):
        self.repositories = repositories
        self.resolver = BlockchainResolver(repositories)
    
    async def track_chain(self, start_tx_hash: str, max_depth: int = 10) -> Dict:
        chain = []
        visited = set()
        current_hash = start_tx_hash
        current_chain = None
        
        while len(chain) < max_depth and current_hash not in visited:
            visited.add(current_hash)
            
            # Bestimme die richtige Blockchain
            repo, chain_name = await self.resolver.find_transaction(current_hash)
            if not repo:
                break
            
            # Hole Transaktion
            tx = await repo.get_transaction(current_hash)
            chain.append({
                "chain": chain_name,
                "transaction": tx
            })
            
            # Finde nächste Transaktion
            next_tx = await self._find_next_transaction(tx, repo)
            if not next_tx:
                break
                
            current_hash = next_tx
            
        return {
            "chain": chain,
            "depth": len(chain),
            "cross_chain_transfers": self._detect_cross_chain_transfers(chain)
        }
    
    async def _find_next_transaction(self, tx: TransactionDetail, repo: BlockchainRepository) -> Optional[str]:
        # Prüfe auf Cross-Chain Events in den Operationen
        for op in tx.operations:
            if op.type == "cross_chain":
                return op.raw_data.get("next_tx_hash")
        
        # Standard: Suche nach Transaktionen mit dem gleichen Wert an der Zieladresse
        if tx.to_address:
            txs = await repo.get_transactions_for_address(tx.to_address, limit=5)
            for candidate in txs:
                if abs(candidate.value - tx.value) < Decimal("0.001"):
                    return candidate.tx_hash
        
        return None
    
    def _detect_cross_chain_transfers(self, chain):
        cross_chain_events = []
        for i in range(1, len(chain)):
            if chain[i]["chain"] != chain[i-1]["chain"]:
                cross_chain_events.append({
                    "from_chain": chain[i-1]["chain"],
                    "to_chain": chain[i]["chain"],
                    "tx_hash": chain[i]["transaction"].tx_hash,
                    "timestamp": chain[i]["transaction"].timestamp
                })
        return cross_chain_events
