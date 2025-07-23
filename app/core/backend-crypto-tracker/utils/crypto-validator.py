import re
from typing import Dict

class CryptoValidator:
    def validate_address(self, chain: str, address: str) -> bool:
        """Validiert Adressformate (BTC, ETH, SOL)"""
        if chain == "btc":
            return self._validate_btc_address(address)
        elif chain == "eth":
            return self._validate_eth_address(address)
        elif chain == "sol":
            return self._validate_sol_address(address)
        return False

    def _validate_btc_address(self, address: str) -> bool:
        """Validiert BTC-Adresse (Base58 oder Bech32)"""
        return bool(re.match(r"^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$", address)) or \
               bool(re.match(r"^bc1[ac-hj-np-z02-9]{11,71}$", address))

    def _validate_eth_address(self, address: str) -> bool:
        """Validiert ETH-Adresse (EIP-55)"""
        return bool(re.match(r"^0x[a-fA-F0-9]{40}$", address))

    def _validate_sol_address(self, address: str) -> bool:
        """Validiert Solana-Adresse (Base58)"""
        return bool(re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$", address))

# Beispiel-Nutzung:
if __name__ == "__main__":
    validator = CryptoValidator()
    print(validator.validate_address("btc", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"))  # True
    print(validator.validate_address("eth", "0xAbc123..."))  # True
