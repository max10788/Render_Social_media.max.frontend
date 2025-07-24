import requests
import os
import json
from typing import Dict, List

class EtherscanETHClient:
    def __init__(self):
        self.api_key = os.getenv("ETHERSCAN_API_KEY")
        if not self.api_key:
            raise ValueError("ETHERSCAN_API_KEY nicht gesetzt")
        self.base_url = "https://api.etherscan.io/api"

    def get_transaction(self, tx_hash: str) -> Dict:
        """Holt ETH-Transaktionsdetails via Etherscan [[8]]"""
        params = {
            "module": "proxy",
            "action": "eth_getTransactionByHash",
            "txhash": tx_hash,
            "apikey": self.api_key
        }
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            if data["status"] != "1":
                raise ValueError(f"Etherscan Fehler: {data['message']}")
            return data["result"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Etherscan API Fehler: {str(e)}")

    def get_transaction_receipt(self, tx_hash: str) -> Dict:
        """Holt den Receipt einer ETH-Transaktion (für Logs)"""
        params = {
            "module": "proxy",
            "action": "eth_getTransactionReceipt",
            "txhash": tx_hash,
            "apikey": self.api_key
        }
        response = requests.get(self.base_url, params=params)
        return response.json()["result"]

# Beispiel-Nutzung:
if __name__ == "__main__":
    client = EtherscanETHClient()
    tx_hash = "abc123..."  # Ersetze mit gültigem ETH-Hash
    print(json.dumps(client.get_transaction(tx_hash), indent=2))
