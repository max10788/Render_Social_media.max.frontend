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
            result = self._make_request(payload)
            
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
    
    def get_transactions_by_address(self, address, limit=5):
        """
        Holt alle Transaktionen, an denen eine Adresse beteiligt ist.
        
        Args:
            address: Die Solana-Adresse
            limit: Maximale Anzahl der zurückzugebenden Transaktionen (max. 5)
        
        Returns:
            Liste von Transaktions-Objekten
        """
        # Stelle sicher, dass das Limit nicht höher als 5 ist
        safe_limit = min(limit, 5)
        logger.info(f"SOLANA: Suche bis zu {safe_limit} Transaktionen für Adresse {address}")
        
        try:
            # Solana-spezifische API-Anfrage
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getSignaturesForAddress",
                "params": [
                    address,
                    {
                        "limit": safe_limit
                    }
                ]
            }
            
            result = self._make_request(payload)
            
            if "error" in result:
                logger.error(f"SOLANA: API error: {result['error']}")
                raise Exception(f"API error: {result['error']}")
            
            if "result" not in result or not result["result"]:
                logger.warning(f"SOLANA: Keine Transaktionen gefunden für Adresse {address}")
                return []
            
            # Hole die vollständigen Transaktionsdetails für jede Signatur
            transactions = []
            for sig in result["result"]:
                tx_payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getTransaction",
                    "params": [
                        sig["signature"],
                        "jsonParsed"
                    ]
                }
                
                try:
                    tx_result = self._make_request(tx_payload)
                    if "result" in tx_result and tx_result["result"]:
                        transactions.append(tx_result["result"])
                except Exception as e:
                    logger.error(f"Fehler beim Abrufen der Transaktionsdetails für {sig['signature']}: {str(e)}")
            
            logger.info(f"SOLANA: Erfolgreich {len(transactions)} Transaktionen abgerufen")
            return transactions[:safe_limit]
            
        except Exception as e:
            logger.error(f"SOLANA: Fehler bei Transaktionsabfrage: {str(e)}", exc_info=True)
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
