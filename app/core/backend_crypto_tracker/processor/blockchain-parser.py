from datetime import datetime

class BlockchainParser:
    def parse_transaction(self, chain: str, raw_data: dict) -> dict:
        """Normalisiert Transaktionsdaten für alle Chains"""
        if chain == "btc":
            return self._parse_btc(raw_data)
        elif chain == "eth":
            return self._parse_eth(raw_data)
        elif chain == "sol":
            return self._parse_sol(raw_data)
        else:
            raise ValueError(f"Unbekannte Chain: {chain}")

    def _parse_btc(self, data: dict) -> dict:
        """BTC-Transaktionsparser"""
        return {
            "tx_hash": data["hash"],
            "chain": "btc",
            "timestamp": datetime.fromtimestamp(data["time"]),
            "from_address": data["inputs"][0]["recipient"] if data["inputs"] else None,
            "to_address": data["outputs"][0]["recipient"] if data["outputs"] else None,
            "amount": float(data["value"]),
            "currency": "BTC",
            "fee": float(data["fee"]),
            "next_hashes": [tx["hash"] for tx in data.get("next_transactions", [])]
        }

    def _parse_eth(self, data: dict) -> dict:
        """ETH-Transaktionsparser"""
        return {
            "tx_hash": data["hash"],
            "chain": "eth",
            "timestamp": datetime.fromtimestamp(int(data["timestamp"], 16)),
            "from_address": data["from"],
            "to_address": data["to"],
            "amount": float(int(data["value"], 16) / 1e18),
            "currency": "ETH",
            "contract_interactions": self._parse_eth_logs(data.get("logs", [])),
            "next_hashes": []  # ETH benötigt andere Logik für nächste Transaktionen
        }

    def _parse_sol(self, data: dict) -> dict:
        """Solana-Transaktionsparser"""
        meta = data["meta"]
        return {
            "tx_hash": data["transaction"]["message"]["recentBlockhash"],
            "chain": "sol",
            "timestamp": datetime.fromtimestamp(meta["blockTime"]),
            "signers": data["transaction"]["message"]["accountKeys"],
            "token_transfers": self._parse_sol_token_transfers(meta.get("postTokenBalances", [])),
            "next_hashes": []  # Solana benötigt andere Logik für nächste Transaktionen
        }

    def _parse_sol_token_transfers(self, balances: list) -> list:
        """Extrahiert SPL-Token-Transfers"""
        transfers = []
        for balance in balances:
            transfers.append({
                "account": balance["accountPubkey"],
                "token": balance["mint"],
                "amount": float(balance["uiTokenAmount"]["amount"]),
                "decimals": balance["uiTokenAmount"]["decimals"]
            })
        return transfers
