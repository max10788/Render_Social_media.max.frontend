from typing import Dict, List

class SPLTokenService:
    def __init__(self, solana_client):
        self.solana_client = solana_client

    def parse_token_transfers(self, tx_data: Dict) -> List[Dict]:
        """Extrahiert SPL-Token-Transfers aus einer Transaktion"""
        meta = tx_data.get("meta", {})
        pre_balances = meta.get("preTokenBalances", [])
        post_balances = meta.get("postTokenBalances", [])
        transfers = []

        for pre, post in zip(pre_balances, post_balances):
            if pre["uiTokenAmount"]["amount"] != post["uiTokenAmount"]["amount"]:
                delta = int(post["uiTokenAmount"]["amount"]) - int(pre["uiTokenAmount"]["amount"])
                transfers.append({
                    "account": pre["accountPubkey"],
                    "token": pre["mint"],
                    "change": delta,
                    "decimals": pre["uiTokenAmount"]["decimals"]
                })
        return transfers

# Beispiel-Nutzung:
if __name__ == "__main__":
    from solana_api import SolanaAPIClient
    sol_client = SolanaAPIClient()
    token_service = SPLTokenService(sol_client)
    tx_hash = "abc123..."  # Ersetze mit gültigem SOL-Hash
    tx_data = sol_client.get_transaction(tx_hash)
    print(token_service.parse_token_transfers(tx_data))
