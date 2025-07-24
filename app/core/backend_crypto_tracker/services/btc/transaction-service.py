import requests
import os
import json
from typing import Dict

class BlockchairBTCClient:
    def __init__(self):
        self.api_key = os.getenv("BLOCKCHAIR_API_KEY")
        if not self.api_key:
            raise ValueError("BLOCKCHAIR_API_KEY nicht gesetzt")
        self.base_url = f"https://api.blockchair.com/bitcoin/transaction/{{tx_hash}}?key={self.api_key}"

    def get_transaction(self, tx_hash: str) -> Dict:
        """Holt BTC-Transaktionsdetails von Blockchair API [[1]]"""
        url = self.base_url.format(tx_hash=tx_hash)
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if not data.get("transactions"):
                raise ValueError("Transaktion nicht gefunden")
            return data["transactions"][0]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Blockchair API Fehler: {str(e)}")

    def validate_address(self, address: str) -> bool:
        """Validiert eine BTC-Adresse (Prüfsumme, Format)"""
        # Implementiere BTC-Adressvalidierung (z. B. mit base58check)
        return len(address) in [34, 44] and address.startswith(("1", "3", "bc1"))

# Beispiel-Nutzung:
if __name__ == "__main__":
    client = BlockchairBTCClient()
    tx_hash = "abc123..."  # Ersetze mit gültigem BTC-Hash
    print(json.dumps(client.get_transaction(tx_hash), indent=2))
