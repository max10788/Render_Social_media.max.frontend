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
        return data.get("result", [])
    elif blockchain == "ethereum":
        url = f"{settings.ETHEREUM_RPC_URL}?module=account&action=txlist&address={query}&apikey=YOUR_ETHERSCAN_API_KEY"
        response = requests.get(url)
        data = response.json()
        return data.get("result", [])
    elif blockchain == "moralis":
        url = f"{settings.MORALIS_BASE_URL}/{query}/transactions"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": settings.MORALIS_API_KEY
        }
        params = {
            "chain": "eth",
            "address": query
        }
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        return data.get("result", [])
    else:
        raise ValueError(f"Unsupported blockchain: {blockchain}")
