
from typing import Dict, Any

class BlockchainParser:
    def parse_transaction(self, chain: str, raw_data: Dict) -> Dict:
        """Normalisiert Transaktionsdaten für alle Chains"""
        if chain == "btc":
            return self._parse_btc_transaction(raw_data)
        elif chain == "eth":
            return self._parse_eth_transaction(raw_data)
        elif chain == "sol":
            return self._parse_sol_transaction(raw_data)
        else:
            raise ValueError(f"Unbekannte Chain: {chain}")

    def _parse_btc_transaction(self, data: Dict) -> Dict:
        """Extrahiert BTC-Transaktionsdetails"""
        return {
            "hash": data["hash"],
            "timestamp": data["time"],
            "inputs": [{"address": inp["recipient"], "value": inp["value"]} for inp in data["inputs"]],
            "outputs": [{"address": out["recipient"], "value": out["value"]} for out in data["outputs"]],
            "fee": data["fee"],
            "chain": "btc"
        }

    def _parse_eth_transaction(self, data: Dict) -> Dict:
        """Extrahiert ETH-Transaktionsdetails"""
        return {
            "hash": data["hash"],
            "timestamp": int(data["timestamp"], 16),
            "from_address": data["from"],
            "to_address": data["to"],
            "value": int(data["value"], 16) / 1e18,
            "contract_interactions": self._parse_eth_logs(data.get("logs", [])),
            "chain": "eth"
        }

    def _parse_sol_transaction(self, data: Dict) -> Dict:
        """Extrahiert Solana-Transaktionsdetails"""
        meta = data["meta"]
        return {
            "hash": data["transaction"]["message"]["recentBlockhash"],
            "timestamp": meta["blockTime"],
            "signers": data["transaction"]["message"]["accountKeys"],
            "token_transfers": self._parse_sol_token_transfers(meta.get("postTokenBalances", [])),
            "chain": "sol"
        }

    def _parse_sol_token_transfers(self, balances: list) -> list:
        """Extrahiert SPL-Token-Transfers"""
        transfers = []
        for balance in balances:
            transfers.append({
                "account": balance["accountPubkey"],
                "token": balance["mint"],
                "amount": balance["uiTokenAmount"]["amount"],
                "decimals": balance["uiTokenAmount"]["decimals"]
            })
        return transfers

    def _parse_eth_logs(self, logs: list) -> list:
        """Parst ETH-Logs (z.B. ERC-20 Transfers)"""
        from web3 import Web3
        parser = ContractParser()
        return parser.parse_logs(logs)

# Beispiel-Nutzung:
if __name__ == "__main__":
    parser = BlockchainParser()
    # Beispiel: Rohdaten von Blockchair/Etherscan/Solana
    btc_data = {"hash": "abc123...", "time": "2025-07-23T12:00:00Z", "inputs": [...], "outputs": [...], "fee": 0.0001}
    print(parser.parse_transaction("btc", btc_data))
