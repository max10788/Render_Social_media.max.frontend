import requests
import os
import json
from typing import Dict
from app.core.backend_crypto_tracker.utils.logger import get_logger
logger = get_logger(__name__)

class SolanaAPIClient:
    def __init__(self):
        self.rpc_url = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        logger.info("SolanaAPIClient: Initialisiert mit Mainnet RPC")

    def get_transaction(self, tx_hash):
        logger.info(f"START: Solana-Transaktion abrufen für Hash '{tx_hash}'")
        logger.debug(f"Aufruf: get_transaction('{tx_hash}') wird ausgeführt")
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [
                tx_hash,
                "jsonParsed"
            ]
        }
        
        try:
            logger.debug(f"API: Sende Anfrage an {self.rpc_url}")
            logger.debug(f"API: Payload vorbereitet (Größe: {len(str(payload))} Zeichen)")
            
            response = requests.post(self.rpc_url, json=payload, headers=self.headers)
            
            logger.debug(f"API: Antwort erhalten (Status: {response.status_code})")
            logger.debug(f"API: Antwort-Größe: {len(response.text)} Zeichen")
            
            if response.status_code != 200:
                logger.error(f"API: Fehlerhafte Antwort (Status: {response.status_code})")
                logger.debug(f"API: Fehlerdetails: {response.text[:500]}")
                raise Exception(f"API request failed with status {response.status_code}")
            
            result = response.json()
            
            if "error" in result:
                logger.error(f"API: Fehler in Antwort: {result['error']}")
                raise Exception(f"API error: {result['error']}")
            
            if "result" not in result or result["result"] is None:
                logger.error(f"API: Keine Transaktionsdaten in der Antwort")
                raise Exception("Transaction not found")
            
            logger.info(f"ERFOLG: Solana-Transaktion erfolgreich abgerufen")
            logger.debug(f"API: Transaktionsdaten erhalten (Block: {result['result'].get('slot', 'N/A')})")
            return result["result"]
            
        except Exception as e:
            logger.error(f"Fehler bei Solana-Transaktionsabruf: {str(e)}", exc_info=True)
            raise

    def get_account_info(self, account_pubkey: str) -> Dict:
        """Holt Account-Informationen"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAccountInfo",
            "params": [account_pubkey]
        }
        response = requests.post(self.rpc_url, json=payload)
        return response.json()["result"]["value"]
