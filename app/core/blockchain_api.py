import re
import requests
import logging
from app.core.config import settings

logging.basicConfig(level=logging.INFO)

def validate_query_and_blockchain(query: str, blockchain: str):
    """
    Validiert den Query-Parameter und die Blockchain.
    
    Args:
        query: Die Adresse oder der Suchbegriff.
        blockchain: Die ausgewählte Blockchain (z. B. "solana", "ethereum").
    
    Raises:
        ValueError: Wenn die Eingaben ungültig sind.
    """
    if not query:
        raise ValueError("Der Query-Parameter darf nicht leer sein.")
    
    if blockchain not in ["solana", "ethereum"]:
        raise ValueError(f"Unsupported blockchain: {blockchain}")
    
    if blockchain == "solana":
        if not re.match(r"^[A-Za-z0-9]{32,44}$", query):  # Solana-Adressen haben eine bestimmte Länge
            raise ValueError("Ungültige Solana-Adresse.")
    elif blockchain == "ethereum":
        if not re.match(r"^0x[a-fA-F0-9]{40}$", query):  # Ethereum-Adressen beginnen mit "0x"
            raise ValueError("Ungültige Ethereum-Adresse.")

def fetch_on_chain_data(query: str, blockchain: str):
    """
    Ruft On-Chain-Daten basierend auf dem Query und der Blockchain ab.
    
    Args:
        query: Die Adresse oder der Suchbegriff.
        blockchain: Die ausgewählte Blockchain (z. B. "solana", "ethereum").
    
    Returns:
        list: Eine Liste von Transaktionen.
    """
    validate_query_and_blockchain(query, blockchain)
    
    try:
        if blockchain == "solana":
            url = f"{settings.SOLANA_RPC_URL}"
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getSignaturesForAddress",
                "params": [query]
            }
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            transactions = data.get("result", [])
            return [
                {
                    "transaction_id": tx.get("signature", ""),
                    "amount": tx.get("meta", {}).get("postBalances", [0])[0],
                    "block_time": tx.get("blockTime", 0),
                    "wallet_address": query,
                    "description": tx.get("memo", "")
                }
                for tx in transactions
            ]
        elif blockchain == "ethereum":
            url = f"{settings.ETHEREUM_RPC_URL}?module=account&action=txlist&address={query}&apikey=YOUR_ETHERSCAN_API_KEY"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get("status") != "1":
                raise ValueError(f"Fehler bei der Ethereum-API: {data.get('message')}")
            transactions = data.get("result", [])
            return [
                {
                    "transaction_id": tx.get("hash", ""),
                    "amount": float(tx.get("value", 0)) / 1e18,
                    "block_time": int(tx.get("timeStamp", 0)),
                    "wallet_address": query,
                    "description": tx.get("input", "")
                }
                for tx in transactions
            ]
    except requests.exceptions.RequestException as e:
        logging.error(f"Fehler beim Abrufen der On-Chain-Daten: {e}")
        return []
    except ValueError as ve:
        logging.error(f"Datenfehler: {ve}")
        return []
