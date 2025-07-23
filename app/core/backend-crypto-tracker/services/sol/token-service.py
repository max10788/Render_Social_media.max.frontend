import requests
import os
import json
from typing import Dict

class SolanaAPIClient:
    def __init__(self):
        self.rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")

    def get_transaction(self, tx_hash: str) -> Dict:
        """Holt Solana-Transaktionsdetails [[8]]"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getConfirmedTransaction",
            "params": [tx_hash]
        }
        try:
            response = requests.post(self.rpc_url, json=payload)
            response.raise_for_status()
            return response.json()["result"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Solana RPC Fehler: {str(e)}")

    def get_account_info(self, account_pubkey: str) -> Dict:
        """Holt Account-Informationen"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAccountInfo",
            "params": [account_pubkey]
        }
        response = requests.post(self.rpc_url, json=payload)
        return response.json()["result"]["value"]

# Beispiel-Nutzung:
if __name__ == "__main__":
    client = SolanaAPIClient()
    tx_hash = "abc123..."  # Ersetze mit gültigem SOL-Hash
    print(json.dumps(client.get_transaction(tx_hash), indent=2))
