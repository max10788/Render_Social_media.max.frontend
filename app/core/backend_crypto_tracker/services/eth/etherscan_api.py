import requests
import os
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.endpoint_manager import EndpointManager

logger = get_logger(__name__)
endpoint_manager = EndpointManager()

class EtherscanETHClient:
    def __init__(self):
        self.api_key = os.getenv('ETHERSCAN_API_KEY', '')
        logger.info("EtherscanETHClient: Initialisiert")
    
    def _make_request(self, url):
        """Versucht, eine Anfrage mit verschiedenen Endpoints zu senden"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Hole einen aktiven Endpoint
                endpoint = endpoint_manager.get_endpoint("eth")
                full_url = endpoint.replace("{ETHERSCAN_API_KEY}", self.api_key) + f"&{url}"
                
                logger.debug(f"API: Sende Anfrage an {full_url}")
                response = requests.get(full_url)
                
                logger.debug(f"API: Antwort erhalten (Status: {response.status_code})")
                
                if response.status_code == 200:
                    return response.json()
                
                # Behandle spezifische Fehler
                if response.status_code == 429:  # Too Many Requests
                    logger.warning(f"API: Rate limit erreicht für {endpoint}")
                    endpoint_manager.mark_as_failed("eth", endpoint, 429)
                elif response.status_code == 401:  # Unauthorized
                    logger.warning(f"API: Ungültiger API-Schlüssel für {endpoint}")
                    # Keine Deaktivierung, da dies ein API-Key-Problem ist
                elif response.status_code == 500:
                    logger.warning(f"API: Serverfehler bei {endpoint}")
                    endpoint_manager.mark_as_failed("eth", endpoint, 500)
                else:
                    logger.warning(f"API: Ungewöhnlicher Fehler bei {endpoint} (Status: {response.status_code})")
                    endpoint_manager.mark_as_failed("eth", endpoint, response.status_code)
                
                retry_count += 1
                
            except Exception as e:
                logger.error(f"API: Fehler bei Anfrage an {endpoint}: {str(e)}", exc_info=True)
                endpoint_manager.mark_as_failed("eth", endpoint, error_message=str(e))
                retry_count += 1
        
        # Wenn alle Versuche fehlschlagen
        logger.error("API: Alle Endpoints für Ethereum haben versagt")
        raise Exception("Keine verfügbaren Ethereum-API-Endpoints")

    def get_transaction(self, tx_hash):
        logger.info(f"START: Ethereum-Transaktion abrufen für Hash '{tx_hash}'")
        logger.debug(f"Aufruf: get_transaction('{tx_hash}') wird ausgeführt")
        
        try:
            result = self._make_request(f"module=proxy&action=eth_getTransactionByHash&txhash={tx_hash}")
            
            if result["status"] != "1":
                logger.error(f"API: Fehler bei Transaktionsabruf: {result.get('message', 'Unknown error')}")
                raise Exception(f"API error: {result.get('message', 'Unknown error')}")
            
            logger.info(f"ERFOLG: Ethereum-Transaktion erfolgreich abgerufen")
            return result["result"]
            
        except Exception as e:
            logger.error(f"Fehler bei Ethereum-Transaktionsabruf: {str(e)}", exc_info=True)
            raise
    
    def get_transactions_by_address(self, address, limit=5):
        """
        Holt externe Transaktionen für eine Ethereum-Adresse.
        
        Args:
            address: Die Ethereum-Adresse
            limit: Maximale Anzahl der zurückzugebenden Transaktionen
        
        Returns:
            Liste von Transaktions-Objekten
        """
        logger.info(f"ETHEREUM: Suche Transaktionen für Adresse {address}")
        
        try:
            # Etherscan API Anfrage für externe Transaktionen
            result = self._make_request(
                f"module=account&action=txlist&address={address}&sort=desc&offset={limit}"
            )
            
            if result["status"] != "1":
                logger.error(f"ETHEREUM: API error: {result['message']}")
                raise Exception(f"API error: {result['message']}")
            
            # Filtere und begrenze die Transaktionen
            transactions = result["result"][:limit]
            logger.info(f"ETHEREUM: Erfolgreich {len(transactions)} Transaktionen abgerufen")
            return transactions
            
        except Exception as e:
            logger.error(f"ETHEREUM: Fehler bei Transaktionsabfrage: {str(e)}", exc_info=True)
            raise

    def get_transaction_receipt(self, tx_hash: str) -> dict:
        """Holt den Receipt einer ETH-Transaktion (für Logs)"""
        params = {
            "module": "proxy",
            "action": "eth_getTransactionReceipt",
            "txhash": tx_hash,
            "apikey": self.api_key
        }
        response = requests.get(self.base_url, params=params)
        return response.json()["result"]
