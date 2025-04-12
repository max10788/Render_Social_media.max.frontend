import requests
from app.core.config import settings

def fetch_on_chain_data(query: str, blockchain: str):
    url = ""
    headers = {}
    params = {}

    if blockchain == "solana":
        url = f"{settings.SOLANA_RPC_URL}"
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignaturesForAddress",
            "params": [query]
        }
        response = requests.post(url, json=payload)
        data = response.json()
        transactions = data.get("result", [])
        return [
            {
                "transaction_id": tx["signature"],
                "amount": tx.get("meta", {}).get("postBalances", [0])[0],
                "block_time": tx["blockTime"],
                "wallet_address": query,
                "description": tx.get("memo", "")
            }
            for tx in transactions
        ]
    elif blockchain == "ethereum":
        url = f"{settings.ETHEREUM_RPC_URL}?module=account&action=txlist&address={query}&apikey=YOUR_ETHERSCAN_API_KEY"
        response = requests.get(url)
        data = response.json()
        transactions = data.get("result", [])
        return [
            {
                "transaction_id": tx["hash"],
                "amount": float(tx["value"]) / 1e18,  # Konvertieren von Wei zu ETH
                "block_time": int(tx["timeStamp"]),
                "wallet_address": query,
                "description": tx.get("input", "")
            }
            for tx in transactions
        ]
    else:
        raise ValueError(f"Unsupported blockchain: {blockchain}")
