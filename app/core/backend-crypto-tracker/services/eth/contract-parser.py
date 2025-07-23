from web3 import Web3
from typing import Dict, List

class ContractParser:
    def __init__(self):
        self.w3 = Web3()

    def parse_logs(self, logs: List[Dict]) -> List[Dict]:
        """Parst Logs aus einem ETH-Receipt (z.B. ERC-20 Transfers)"""
        transfers = []
        for log in logs:
            # ERC-20 Transfer-Event (Topic0: Transfer(...))
            if log["topics"][0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef":
                from_addr = self.w3.toChecksumAddress("0x" + log["topics"][1][-40:])
                to_addr = self.w3.toChecksumAddress("0x" + log["topics"][2][-40:])
                value = int(log["data"], 16) / 1e18  # 18 Dezimalstellen
                transfers.append({
                    "from": from_addr,
                    "to": to_addr,
                    "value": value
                })
        return transfers

# Beispiel-Nutzung:
if __name__ == "__main__":
    parser = ContractParser()
    # Beispiel-Log-Daten (vereinfacht)
    logs = [{
        "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000abc123...",
            "0x000000000000000000000000def456..."
        ],
        "data": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"
    }]
    print(parser.parse_logs(logs))
