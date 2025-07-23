import requests
import os
from typing import Dict

class BTCAddressAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("BLOCKCHAIR_API_KEY")
        if not self.api_key:
            raise ValueError("BLOCKCHAIR_API_KEY nicht gesetzt")
        self.base_url = f"https://api.blockchair.com/bitcoin/address/{{address}}?key={self.api_key}"

    def analyze_address(self, address: str) -> Dict:
        """Analysiert eine BTC-Adresse (Saldo, Transaktionshistorie)"""
        url = self.base_url.format(address=address)
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            return {
                "address": address,
                "balance": data["data"][address]["balance"],
                "total_received": data["data"][address]["total_received"],
                "transaction_count": data["data"][address]["transaction_count"]
            }
        except requests.exceptions.RequestException as e:
            raise Exception(f"BTC-Adressanalyse Fehler: {str(e)}")

# Beispiel-Nutzung:
if __name__ == "__main__":
    analyzer = BTCAddressAnalyzer()
    address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"  # Genesis-Adresse
    print(analyzer.analyze_address(address))
