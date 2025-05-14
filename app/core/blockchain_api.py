from datetime import date, datetime, timedelta
import json
import os
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

def validate_blockchain_params(blockchain: str, contract_address: str, start_date: date, end_date: date) -> str:
    """
    Validiert die Blockchain-Parameter für die Analyse.
    
    Args:
        blockchain: Name der Blockchain (ethereum, binance, polygon, solana)
        contract_address: Adresse des Smart Contracts
        start_date: Startdatum für die Analyse
        end_date: Enddatum für die Analyse
        
    Returns:
        Fehlermeldung als String falls Validierungsfehler, None wenn alles valide ist
    """
    # Prüfe, ob die Blockchain unterstützt wird
    supported_blockchains = ["ethereum", "binance", "polygon", "solana"]
    if blockchain not in supported_blockchains:
        return f"Blockchain {blockchain} wird nicht unterstützt. Unterstützte Blockchains: {', '.join(supported_blockchains)}"
    
    # Validiere das Contract-Format
    if blockchain in ["ethereum", "binance", "polygon"]:
        if not contract_address.startswith("0x") or len(contract_address) != 42:
            return f"{blockchain}-Adressen müssen mit 0x beginnen und 42 Zeichen lang sein"
    elif blockchain == "solana":
        if len(contract_address) != 44:
            return "Solana-Adressen müssen 44 Zeichen lang sein"
    
    # Prüfe, ob das Enddatum nach dem Startdatum liegt
    if end_date < start_date:
        return "Das Enddatum muss nach dem Startdatum liegen"
    
    # Prüfe, ob der Zeitraum nicht zu groß ist (z.B. max. 90 Tage)
    max_days = 90
    if (end_date - start_date).days > max_days:
        return f"Der Analysezeitraum darf maximal {max_days} Tage betragen"
    
    # Prüfe, ob das Startdatum nicht zu weit in der Vergangenheit liegt
    max_history_days = 365 * 5  # 5 Jahre
    if (datetime.now().date() - start_date).days > max_history_days:
        return f"Das Startdatum darf nicht mehr als {max_history_days} Tage in der Vergangenheit liegen"
    
    # Prüfe, ob das Enddatum nicht in der Zukunft liegt
    if end_date > datetime.now().date():
        return "Das Enddatum darf nicht in der Zukunft liegen"
    
    # Alle Validierungen bestanden
    return None

def validate_blockchain_type(blockchain_endpoint: str) -> str:
    """
    Ermittelt den Blockchain-Typ aus dem Endpoint.
    
    Args:
        blockchain_endpoint: Die URL des Blockchain-RPC-Endpoints.
        
    Returns:
        str: Der erkannte Blockchain-Typ oder None wenn nicht erkannt.
    """
    endpoint_lower = blockchain_endpoint.lower()
    if "solana" in endpoint_lower:
        return "solana"
    elif "ethereum" in endpoint_lower:
        return "ethereum"
    elif "binance" in endpoint_lower:
        return "binance"
    elif "polygon" in endpoint_lower:
        return "polygon"
    return None

def fetch_on_chain_data(blockchain_endpoint: str, contract_address: str) -> list:
    """
    Ruft On-Chain-Daten basierend auf dem Endpoint und der Contract-Adresse ab.
    
    Args:
        blockchain_endpoint: Die URL des Blockchain-RPC-Endpoints.
        contract_address: Die Adresse des Smart Contracts.
    
    Returns:
        list: Eine Liste von Transaktionen.
    """
    try:
        if not blockchain_endpoint or not contract_address:
            raise ValueError("Blockchain endpoint and contract address are required")

        blockchain_type = validate_blockchain_type(blockchain_endpoint)
        if not blockchain_type:
            raise ValueError(f"Unsupported blockchain endpoint: {blockchain_endpoint}")

        # Validate contract address format
        if blockchain_type in ["ethereum", "binance", "polygon"]:
            if not contract_address.startswith("0x") or len(contract_address) != 42:
                raise ValueError(f"Invalid {blockchain_type} contract address format")
        elif blockchain_type == "solana":
            if len(contract_address) != 44:
                raise ValueError("Invalid Solana contract address format")

        # Fetch data based on blockchain type
        if blockchain_type == "solana":
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getSignaturesForAddress",
                "params": [contract_address]
            }
            response = requests.post(blockchain_endpoint, json=payload)
            response.raise_for_status()
            data = response.json()
            transactions = data.get("result", [])
            return [
                {
                    "transaction_id": tx.get("signature", ""),
                    "amount": tx.get("meta", {}).get("postBalances", [0])[0],
                    "block_time": tx.get("blockTime", 0),
                    "wallet_address": contract_address,
                    "description": tx.get("memo", "")
                }
                for tx in transactions
            ]
        else:  # ethereum, binance, polygon
            params = {
                "module": "account",
                "action": "txlist",
                "address": contract_address,
                "apikey": settings.get_blockchain_api_key(blockchain_type)
            }
            response = requests.get(blockchain_endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "1":
                raise ValueError(f"API Error: {data.get('message')}")
                
            transactions = data.get("result", [])
            return [
                {
                    "transaction_id": tx.get("hash", ""),
                    "amount": float(tx.get("value", 0)) / 1e18,
                    "block_time": int(tx.get("timeStamp", 0)),
                    "wallet_address": contract_address,
                    "description": tx.get("input", "")
                }
                for tx in transactions
            ]

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching on-chain data: {e}")
        return []
    except ValueError as ve:
        logging.error(f"Validation error: {ve}")
        return []
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return []
