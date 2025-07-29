import requests
import json
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.endpoint_manager import EndpointManager

logger = get_logger(__name__)
endpoint_manager = EndpointManager()

class SolanaAPIClient:
    def __init__(self):
        self.headers = {"Content-Type": "application/json"}
        logger.info("SolanaAPIClient: Initialisiert")
    
    def _make_request(self, payload):
        """Versucht, eine Anfrage mit verschiedenen Endpoints zu senden"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Hole einen aktiven Endpoint
                endpoint = endpoint_manager.get_endpoint("sol")
                
                logger.debug(f"API: Sende Anfrage an {endpoint}")
                response = requests.post(endpoint, json=payload, headers=self.headers)
                
                logger.debug(f"API: Antwort erhalten (Status: {response.status_code})")
                
                if response.status_code == 200:
                    return response.json()
                
                # Behandle spezifische Fehler
                if response.status_code == 429:  # Too Many Requests
                    logger.warning(f"API: Rate limit erreicht für {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 429)
                elif response.status_code == 402:  # Payment Required
                    logger.warning(f"API: Payment required für {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 402)
                elif response.status_code == 500:
                    logger.warning(f"API: Serverfehler bei {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 500)
                else:
                    logger.warning(f"API: Ungewöhnlicher Fehler bei {endpoint} (Status: {response.status_code})")
                    endpoint_manager.mark_as_failed("sol", endpoint, response.status_code)
                
                retry_count += 1
                
            except Exception as e:
                logger.error(f"API: Fehler bei Anfrage an {endpoint}: {str(e)}", exc_info=True)
                endpoint_manager.mark_as_failed("sol", endpoint, error_message=str(e))
                retry_count += 1
        
        # Wenn alle Versuche fehlschlagen
        logger.error("API: Alle Endpoints für Solana haben versagt")
        raise Exception("Keine verfügbaren Solana-API-Endpoints")

    def get_transaction(self, tx_hash: str) -> dict:
        """
        Holt eine einzelne Transaktion von der Solana-Blockchain.
        """
        logger.info(f"START: Solana-Transaktion abrufen für Hash '{tx_hash}'")
        
        try:
            endpoint = endpoint_manager.get_endpoint("sol")
            
            # Füge maxSupportedTransactionVersion zum Konfigurations-Dictionary hinzu
            config = {
                "encoding": "jsonParsed",
                "maxSupportedTransactionVersion": 0  # Neuer Parameter
            }
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTransaction",
                "params": [
                    tx_hash,
                    config  # Übergebe die Konfiguration
                ]
            }
    
            response = requests.post(endpoint, json=payload)
            
            if response.status_code != 200:
                logger.error(f"HTTP Error: {response.status_code}")
                raise Exception(f"HTTP Error: {response.status_code}")
    
            result = response.json()
            
            if "error" in result:
                logger.error(f"API: Fehler in Antwort: {result['error']}")
                raise Exception(f"API error: {result['error']}")
    
            if "result" in result:
                logger.info("ERFOLG: Solana-Transaktion erfolgreich abgerufen")
                return result["result"]
    
            logger.error("Unerwartetes Antwortformat")
            raise Exception("Invalid response format")
    
        except Exception as e:
            logger.error(f"Fehler bei Solana-Transaktionsabruf: {str(e)}")
            raise
    
    def get_transactions_by_address(self, address: str, limit: int = 10) -> List[dict]:
        """
        Holt mehrere Transaktionen für eine Adresse.
        """
        try:
            endpoint = endpoint_manager.get_endpoint("sol")
            
            # Füge auch hier maxSupportedTransactionVersion hinzu
            config = {
                "limit": limit,
                "encoding": "jsonParsed",
                "maxSupportedTransactionVersion": 0  # Neuer Parameter
            }
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getSignaturesForAddress",
                "params": [
                    address,
                    config  # Übergebe die Konfiguration
                ]
            }
    
            response = requests.post(endpoint, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"HTTP Error: {response.status_code}")
    
            result = response.json()
            
            if "error" in result:
                raise Exception(f"API error: {result['error']}")
    
            if "result" in result:
                # Hole die Details für jede Transaktion
                transactions = []
                for sig in result["result"]:
                    try:
                        tx_details = self.get_transaction(sig["signature"])
                        if tx_details:
                            transactions.append(tx_details)
                    except Exception as e:
                        logger.warning(f"Fehler beim Abrufen der Transaktion {sig['signature']}: {str(e)}")
                        continue
                return transactions
    
            return []
    
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der Transaktionen: {str(e)}")
            return []

    def get_account_info(self, account_pubkey: str) -> dict:
        """Holt Account-Informationen"""
        logger.info(f"API: Account-Info abrufen für {account_pubkey}")
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAccountInfo",
            "params": [account_pubkey]
        }
        try:
            # Verwende _make_request für konsistente Endpoint-Verwaltung
            result = self._make_request(payload)
            if "error" in result:
                logger.error(f"API: Fehler in getAccountInfo Antwort: {result['error']}")
                raise Exception(f"API error: {result['error']}")
            
            logger.info(f"API: Account-Info erfolgreich abgerufen")
            # Greife sicher auf das Ergebnis zu
            return result.get("result", {}).get("value", {})
            
        except Exception as e:
            logger.error(f"API: Fehler bei getAccountInfo: {str(e)}", exc_info=True)
            raise # Re-raise die Exception

