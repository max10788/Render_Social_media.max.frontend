from typing import Optional, Tuple, Dict
from app.core.blockchain.interfaces import BlockchainRepository, TransactionDetail

class BlockchainResolver:
    def __init__(self, repositories: Dict[str, BlockchainRepository]):
        self.repositories = repositories
    
    async def find_transaction(self, tx_hash: str) -> Tuple[Optional[BlockchainRepository], Optional[str]]:
        """Identifiziert die Blockchain, auf der eine Transaktion existiert"""
        for chain_name, repo in self.repositories.items():
            try:
                # Prüfe ob die Transaktion in dieser Blockchain existiert
                tx = await repo.get_transaction(tx_hash)
                if tx:
                    return repo, chain_name
            except Exception:
                continue
        
        return None, None
    
    def identify_chain_from_address(self, address: str) -> Optional[str]:
        """Identifiziert die Blockchain anhand einer Adresse"""
        if address.startswith("0x") and len(address) == 42:
            return "ethereum"
        elif address.startswith("bc1") or (len(address) >= 26 and len(address) <= 42):
            return "bitcoin"
        elif len(address) == 44 and all(c in "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" for c in address):
            return "solana"
        elif address.startswith("bnb1") or address.startswith("0x"):
            return "binance_smart_chain"
        return None
    
    async def detect_cross_chain_transfer(self, tx: TransactionDetail) -> Optional[Dict]:
        """Erkennt Cross-Chain Transfers in einer Transaktion"""
        cross_chain_ops = [op for op in tx.operations if op.type == "cross_chain"]
        if cross_chain_ops:
            return {
                "from_chain": tx.chain_id,
                "to_chain": cross_chain_ops[0].raw_data.get("target_chain"),
                "bridge": cross_chain_ops[0].raw_data.get("bridge"),
                "amount": cross_chain_ops[0].value
            }
        return None
