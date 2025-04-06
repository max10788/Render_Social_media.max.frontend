import requests
from datetime import datetime
from app.core.config import settings

def fetch_on_chain_data(query: str, blockchain: str):
    """
    Abrufen von On-Chain-Daten basierend auf dem Suchbegriff und der ausgewählten Blockchain.
    """
    if blockchain == "solana":
        return fetch_solana_data(query)
    elif blockchain == "ethereum":
        return fetch_ethereum_data(query)
    elif blockchain == "moralis":
        return fetch_moralis_data(query)
    else:
        raise ValueError(f"Unsupported blockchain: {blockchain}")

def fetch_solana_data(query: str):
    url = settings.SOLANA_RPC_URL
    headers = {"Content-Type": "application/json"}

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSignaturesForAddress",
        "params": [query]
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        return data.get("result", [])
    except Exception as e:
        print(f"Fehler beim Abrufen von Solana-Daten: {e}")
        return []

def fetch_ethereum_data(query: str):
    url = f"{settings.ETHEREUM_RPC_URL}?module=account&action=txlist&address={query}&apikey=YOUR_ETHERSCAN_API_KEY"
    try:
        response = requests.get(url)
        data = response.json()
        return data.get("result", [])
    except Exception as e:
        print(f"Fehler beim Abrufen von Ethereum-Daten: {e}")
        return []

def fetch_moralis_data(query: str):
    url = f"{settings.MORALIS_BASE_URL}/{query}/transactions"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": settings.MORALIS_API_KEY
    }

    params = {
        "chain": "eth",  # Unterstützte Chains: "eth", "polygon", "bsc", etc.
        "address": query
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        return data.get("result", [])
    except Exception as e:
        print(f"Fehler beim Abrufen von Moralis-Daten: {e}")
        return []
