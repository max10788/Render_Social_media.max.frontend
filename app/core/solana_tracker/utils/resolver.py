from typing import Optional, Tuple
from app.core.blockchain.interfaces import BlockchainRepository, TransactionDetail

class BlockchainResolver:
    def __init__(self, repositories: Dict[str, BlockchainRepository]):
        self.repositories = repositories
    
    async def find_transaction(self, tx_hash: str) -> Tuple[Optional[BlockchainRepository], Optional[str]]:
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
        # Implementiere Logik zur Identifizierung der Blockchain anhand der Adresse
        if address.startswith("0x") and len(address) == 42:
            return "ethereum"
        elif address.startswith("bc1") or (len(address) >= 26 and len(address) <= 42):
            return "bitcoin"
        elif len(address) == 44 and all(c in "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" for c in address):
            return "solana"
        return None
