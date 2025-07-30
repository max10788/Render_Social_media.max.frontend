import requests
from typing import Optional, List, Dict, Any
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.endpoint_manager import EndpointManager

logger = get_logger(__name__)
endpoint_manager = EndpointManager()

class SolanaAPIClient:
    def __init__(self):
        self.headers = {"Content-Type": "application/json"}
        logger.info("SolanaAPIClient: Initialisiert")
    
    def _make_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Versucht, eine Anfrage mit verschiedenen Endpoints zu senden"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Hole einen aktiven Endpoint
                endpoint = endpoint_manager.get_endpoint("sol")
                
                logger.info(f"API: Sende Anfrage an {endpoint}") # Info statt Debug
                response = requests.post(endpoint, json=payload, headers=self.headers, timeout=30)
                
                logger.info(f"API: Antwort erhalten (Status: {response.status_code})") # Info statt Debug
                
                if response.status_code == 200:
                    return response.json()
                
                # Behandle spezifische Fehler
                if response.status_code == 429:  # Too Many Requests
                    logger.warning(f"API: Rate limit erreicht für {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 429)
                elif response.status_code == 402:  # Payment Required
                    logger.warning(f"API: Payment required für {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 402)
                elif response.status_code == 403: # Forbidden / Limit erreicht
                    logger.warning(f"API: Zugriff verweigert (Limit?) für {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 403)
                elif response.status_code == 500:
                    logger.warning(f"API: Serverfehler bei {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 500)
                elif response.status_code == 503: # Service Unavailable
                    logger.warning(f"API: Service nicht verfügbar bei {endpoint}")
                    endpoint_manager.mark_as_failed("sol", endpoint, 503)
                else:
                    logger.warning(f"API: Unerwarteter Fehler bei {endpoint} (Status: {response.status_code}) - {response.text}")
                    endpoint_manager.mark_as_failed("sol", endpoint, response.status_code)
                
                retry_count += 1
                
            except requests.exceptions.Timeout:
                logger.error(f"API: Timeout bei Anfrage an {endpoint}")
                endpoint_manager.mark_as_failed("sol", endpoint, error_message="Timeout")
                retry_count += 1
            except requests.exceptions.ConnectionError as e:
                logger.error(f"API: Verbindungsfehler bei Anfrage an {endpoint}: {str(e)}")
                endpoint_manager.mark_as_failed("sol", endpoint, error_message="ConnectionError")
                retry_count += 1
            except Exception as e:
                logger.error(f"API: Unerwarteter Fehler bei Anfrage an {endpoint}: {str(e)}", exc_info=True)
                endpoint_manager.mark_as_failed("sol", endpoint, error_message=str(e))
                retry_count += 1
        
        # Wenn alle Versuche fehlschlagen
        logger.critical("API: Alle Endpoints für Solana haben versagt")
        raise Exception("Keine verfügbaren Solana-API-Endpoints")

    def get_transaction(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """
        Holt Transaktionsdaten von der Solana-API mit robuster Validierung.
        
        Args:
            tx_hash (str): Der Hash der abzurufenden Transaktion
            
        Returns:
            Optional[Dict]: Transaktionsdaten oder None bei Fehler
            
        Raises:
            Exception: Bei API-Fehlern oder ungültigen Daten
        """

        logger.info(f"START: Solana-Transaktion abrufen für Hash '{tx_hash}'")
        
        try:
            # 1. Request vorbereiten
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTransaction",
                "params": [
                    tx_hash,
                    {
                        "encoding": "jsonParsed",
                        "maxSupportedTransactionVersion": 0,
                        "commitment": "confirmed" # Explizites Commitment für Stabilität
                    }
                ]
            }
            
            # 2. Request ausführen über _make_request für konsistente Endpoint-Verwaltung
            result = self._make_request(payload)
            
            # 3. Response validieren
            # Prüfe auf API Fehler
            if "error" in result:
                error = result["error"]
                error_code = error.get("code", "Unbekannt")
                error_message = error.get("message", "Unbekannter API-Fehler")
                logger.error(f"API-Fehler (Code {error_code}): {error_message}")
                
                # Spezifische Fehler behandeln
                if "not found" in error_message.lower() or error_code == -32003: # Bekannter "not found" Code
                    logger.info(f"Transaktion {tx_hash} wurde als 'nicht gefunden' gemeldet")
                    raise Exception(f"Transaktion nicht gefunden: {tx_hash}")
                raise Exception(f"API-Fehler (Code {error_code}): {error_message}")
            
            # 4. Erfolgsfall validieren
            if "result" not in result:
                logger.error("Keine 'result' in Antwort")
                raise Exception("Ungültige API-Antwort: Keine 'result' in Antwort")
            
            tx_data = result["result"]
            if tx_data is None:
                logger.info(f"Transaktion {tx_hash} wurde von der API als 'None' zurückgegeben (wird als 'nicht gefunden' behandelt)")
                # Dies ist ein häufiger Fall, wenn die Transaktion nicht existiert
                raise Exception(f"Transaktion nicht gefunden: {tx_hash}")
            
            # 5. Minimale Datenvalidierung
            if not isinstance(tx_data, dict):
                logger.error("Transaktionsdaten sind kein Dictionary")
                raise Exception("Ungültiges Datenformat")
                
            if "transaction" not in tx_data or not isinstance(tx_data["transaction"], dict):
                logger.error("Feld 'transaction' fehlt oder ist ungültig")
                raise Exception("Ungültige Transaktionsdaten: 'transaction' fehlt")
                
            if "meta" not in tx_data or not isinstance(tx_data["meta"], dict):
                logger.error("Feld 'meta' fehlt oder ist ungültig")
                raise Exception("Ungültige Transaktionsdaten: 'meta' fehlt")
            
            # 6. Erfolg nur loggen wenn alle Validierungen bestanden
            logger.info(f"ERFOLG: Transaktion {tx_hash[:10]}... erfolgreich abgerufen und validiert")
            return tx_data
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout beim Abrufen der Transaktion {tx_hash}")
            raise Exception(f"Timeout beim Abrufen der Transaktion {tx_hash}")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Netzwerkfehler beim Abrufen von {tx_hash}: {str(e)}")
            raise Exception(f"Netzwerkfehler: {str(e)}")
            
        except ValueError as e:
            logger.error(f"JSON Parsing Fehler bei Transaktion {tx_hash}: {str(e)}")
            raise Exception(f"Ungültige API-Antwort: {str(e)}")
            
        except Exception:
            # Re-raise alle anderen Exceptions (inkl. der von uns geworfenen)
            raise
            
    def get_transactions_by_address(self, address: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Holt mehrere Transaktionen für eine Adresse.
        """
        logger.info(f"START: Hole bis zu {limit} Transaktionen für Adresse {address[:10]}...")
        
        try:
            # 1. Request vorbereiten
            config = {
                "limit": min(limit, 20), # Sicherheitslimit
                "encoding": "jsonParsed",
                "maxSupportedTransactionVersion": 0
            }
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getSignaturesForAddress",
                "params": [
                    address,
                    config
                ]
            }
    
            # 2. Request ausführen
            result = self._make_request(payload)
            
            # 3. Response validieren
            if "error" in result:
                error = result["error"]
                error_message = error.get("message", "Unbekannter API-Fehler")
                logger.error(f"API-Fehler bei getSignaturesForAddress: {error_message}")
                raise Exception(f"API-Fehler bei Transaktionssuche: {error_message}")
    
            if "result" not in result:
                logger.warning("Keine 'result' in getSignaturesForAddress Antwort")
                return []
                
            signatures_data = result["result"]
            
            if not isinstance(signatures_data, list):
                logger.error("Signaturdaten sind keine Liste")
                return []
            
            if not signatures_data:
                logger.info(f"Keine Transaktionen für Adresse {address[:10]}... gefunden")
                return []
            
            logger.info(f"ERFOLG: {len(signatures_data)} Transaktionssignaturen für {address[:10]}... gefunden")
            
            # 4. Hole die Details für jede Transaktion (mit Fehlerbehandlung)
            transactions = []
            successful_fetches = 0
            failed_fetches = 0
            
            for i, sig_info in enumerate(signatures_data):
                if not isinstance(sig_info, dict):
                    logger.warning(f"Ungültiger Eintrag in Signatur-Liste (Index {i})")
                    continue
                    
                signature = sig_info.get("signature")
                if not signature:
                    logger.warning(f"Fehlende Signatur in Eintrag (Index {i})")
                    continue
                
                try:
                    logger.debug(f"Fetching transaction details for {signature[:10]}...")
                    tx_details = self.get_transaction(signature)
                    if tx_details:
                        transactions.append(tx_details)
                        successful_fetches += 1
                        logger.debug(f"Erfolgreich Transaktion {signature[:10]}... abgerufen")
                    else:
                        failed_fetches += 1
                        logger.warning(f"Keine Details für Transaktion {signature[:10]}... erhalten")
                        
                except Exception as e:
                    failed_fetches += 1
                    logger.warning(f"Fehler beim Abrufen der Transaktion {signature[:10]}...: {str(e)}")
                    # Bei bestimmten Fehlern (z.B. "nicht gefunden") fortfahren, 
                    # bei anderen (z.B. API-Limit) könnte man evtl. früher abbrechen
                    continue
                    
                # Kleine Verzögerung, um die API nicht zu überlasten (optional)
                # import time
                # time.sleep(0.1)
            
            logger.info(f"Transaktionsdetails abgerufen: {successful_fetches} erfolgreich, {failed_fetches} fehlgeschlagen")
            return transactions
    
        except Exception as e:
            logger.error(f"Kritischer Fehler beim Abrufen der Transaktionen für {address[:10]}...: {str(e)}", exc_info=True)
            # Je nach Anwendungsfall: Leere Liste zurückgeben oder Exception werfen
            # Hier werfen wir sie, damit der Aufrufer entscheiden kann
            raise

    def get_account_info(self, account_pubkey: str) -> Dict[str, Any]:
        """Holt Account-Informationen"""
        logger.info(f"API: Account-Info abrufen für {account_pubkey[:10]}...")
        
        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getAccountInfo",
                "params": [
                    account_pubkey,
                    {
                        "encoding": "base64" # Oder "jsonParsed" je nach Bedarf
                    }
                ]
            }
            
            # Verwende _make_request für konsistente Endpoint-Verwaltung
            result = self._make_request(payload)
            
            if "error" in result:
                error = result["error"]
                error_message = error.get("message", "Unbekannter API-Fehler")
                logger.error(f"API: Fehler in getAccountInfo Antwort: {error_message}")
                raise Exception(f"API-Fehler bei Account-Info: {error_message}")
            
            logger.info(f"API: Account-Info erfolgreich abgerufen für {account_pubkey[:10]}...")
            # Greife sicher auf das Ergebnis zu
            return result.get("result", {}).get("value", {})
            
        except Exception as e:
            logger.error(f"API: Fehler bei getAccountInfo für {account_pubkey[:10]}...: {str(e)}", exc_info=True)
            raise # Re-raise die Exception
