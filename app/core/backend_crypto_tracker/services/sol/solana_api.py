import requests
import json
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.endpoint_manager import EndpointManager
from typing import List, Optional

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

    def get_transaction(self, tx_hash: str) -> Optional[dict]:
        """
        Holt Transaktionsdaten von der Solana-API mit robuster Validierung.
        
        Args:
            tx_hash (str): Der Hash der abzurufenden Transaktion
            
        Returns:
            Optional[Dict]: Transaktionsdaten oder None bei Fehler
            
        Raises:
            Exception: Bei API-Fehlern oder ungültigen Daten
        """
        timestamp = datetime(2025, 7, 29, 16, 12, 5)
        self.logger.info(f"START: Solana-Transaktion abrufen für Hash '{tx_hash}'")
        
        try:
            # 1. Endpoint aus Manager holen
            endpoint = endpoint_manager.get_endpoint("sol")
            if not endpoint:
                self.logger.error("Kein verfügbarer Endpoint")
                raise Exception("Kein API-Endpoint verfügbar")
            
            # 2. Request vorbereiten
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTransaction",
                "params": [
                    tx_hash,
                    {
                        "encoding": "jsonParsed",
                        "maxSupportedTransactionVersion": 0
                    }
                ]
            }
            
            # 3. Request ausführen
            response = requests.post(
                endpoint,
                json=payload,
                timeout=10
            )
            
            # 4. HTTP Status prüfen
            if response.status_code != 200:
                self.logger.error(f"HTTP {response.status_code}: {response.text}")
                raise Exception(f"HTTP Fehler {response.status_code}")
            
            # 5. Response validieren
            result = response.json()
            
            # Prüfe auf API Fehler
            if "error" in result:
                error = result["error"]
                error_message = error.get("message", "Unbekannter API-Fehler")
                self.logger.error(f"API-Fehler: {error_message}")
                
                if "not found" in error_message.lower():
                    raise Exception(f"Transaktion nicht gefunden: {tx_hash}")
                raise Exception(f"API-Fehler: {error_message}")
            
            # 6. Erfolgsfall validieren
            if "result" not in result:
                self.logger.error("Keine 'result' in Antwort")
                raise Exception("Ungültige API-Antwort: Keine 'result' in Antwort")
            
            tx_data = result["result"]
            if tx_data is None:
                self.logger.error(f"Transaktion {tx_hash} nicht gefunden")
                raise Exception(f"Transaktion nicht gefunden: {tx_hash}")
            
            # 7. Minimale Datenvalidierung
            if not isinstance(tx_data, dict):
                self.logger.error("Transaktionsdaten sind kein Dictionary")
                raise Exception("Ungültiges Datenformat")
                
            if "transaction" not in tx_data or not isinstance(tx_data["transaction"], dict):
                self.logger.error("Feld 'transaction' fehlt oder ist ungültig")
                raise Exception("Ungültige Transaktionsdaten: 'transaction' fehlt")
                
            if "meta" not in tx_data or not isinstance(tx_data["meta"], dict):
                self.logger.error("Feld 'meta' fehlt oder ist ungültig")
                raise Exception("Ungültige Transaktionsdaten: 'meta' fehlt")
            
            # 8. Erfolg nur loggen wenn alle Validierungen bestanden
            self.logger.info(f"ERFOLG: Transaktion {tx_hash[:8]}... erfolgreich abgerufen und validiert")
            return tx_data
            
        except requests.exceptions.Timeout:
            self.logger.error(f"Timeout beim Abrufen der Transaktion {tx_hash}")
            raise Exception("API-Timeout")
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Netzwerkfehler: {str(e)}")
            raise Exception(f"Netzwerkfehler: {str(e)}")
            
        except ValueError as e:
            self.logger.error(f"JSON Parsing Fehler: {str(e)}")
            raise Exception(f"Ungültige API-Antwort: {str(e)}")
            
        except Exception as e:
            self.logger.error(f"Unerwarteter Fehler: {str(e)}")
            raise
            
    def get_transactions_by_address(self, address: str, limit: int = 10) -> list[dict]:
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

