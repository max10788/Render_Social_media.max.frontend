import time
import random
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class EndpointManager:
    """
    Verwaltet mehrere API-Endpoints für verschiedene Blockchains und wechselt automatisch
    zwischen ihnen, wenn Limits erreicht sind oder Fehler auftreten.
    """
    
    def __init__(self):
        # Struktur: {blockchain: {endpoint: {status, last_used, error_count, disabled_until}}}
        self.endpoints = defaultdict(dict)
        self.load_default_endpoints()
        self.request_counts = defaultdict(int)
        self.last_request_time = time.time()
        self.min_request_interval = 0.5  # Mindestabstand zwischen Anfragen in Sekunden
    
    def load_default_endpoints(self):
        """Lädt Standard-Endpoints aus der Konfigurationsdatei oder setzt Standardwerte"""
        # Für Solana
        self.endpoints["sol"] = {
            "https://api.mainnet-beta.solana.com": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://solana-api.projectserum.com": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://ssc-dao.genesysgo.net": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            }
        }
        
        # Für Ethereum
        self.endpoints["eth"] = {
            f"https://api.etherscan.io/api?apikey={{ETHERSCAN_API_KEY}}": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://cloudflare-eth.com": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            }
        }
        
        # Für Bitcoin
        self.endpoints["btc"] = {
            "https://blockchain.info": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://blockstream.info/api": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            }
        }
        
        logger.info("Endpoint-Manager: Standard-Endpoints geladen")
    
    def get_endpoint(self, blockchain):
        """Gibt einen aktiven Endpoint für die angegebene Blockchain zurück"""
        current_time = time.time()
        
        # Überprüfe, ob genug Zeit seit der letzten Anfrage vergangen ist
        if current_time - self.last_request_time < self.min_request_interval:
            time.sleep(self.min_request_interval - (current_time - self.last_request_time))
        
        # Aktualisiere den Zeitstempel der letzten Anfrage
        self.last_request_time = time.time()
        
        # Entferne abgelaufene Deaktivierungen
        self._cleanup_disabled_endpoints()
        
        # Filtere aktive Endpoints
        active_endpoints = [
            endpoint for endpoint, info in self.endpoints[blockchain].items() 
            if info["status"] == "active"
        ]
        
        if not active_endpoints:
            logger.warning(f"Keine aktiven Endpoints für {blockchain} verfügbar. Versuche, deaktivierte Endpoints zu reaktivieren.")
            self._reactivate_all_endpoints(blockchain)
            active_endpoints = [
                endpoint for endpoint, info in self.endpoints[blockchain].items() 
                if info["status"] == "active"
            ]
            
            if not active_endpoints:
                logger.error(f"Keine verfügbaren Endpoints für {blockchain} nach Reaktivierungsversuch")
                raise Exception(f"Keine verfügbaren API-Endpoints für {blockchain}")
        
        # Wähle einen zufälligen aktiven Endpoint
        selected_endpoint = random.choice(active_endpoints)
        self.endpoints[blockchain][selected_endpoint]["last_used"] = time.time()
        
        # Erhöhe den Anfragezähler
        self.request_counts[blockchain] += 1
        
        logger.info(f"Endpoint-Manager: Wähle Endpoint für {blockchain}: {selected_endpoint}")
        return selected_endpoint
    
    def mark_as_failed(self, blockchain, endpoint, status_code=None, error_message=None):
        """Markiert einen Endpoint als fehlgeschlagen und erhöht den Fehlerzähler"""
        if endpoint not in self.endpoints[blockchain]:
            logger.warning(f"Endpoint {endpoint} für {blockchain} nicht im Manager registriert")
            return
        
        info = self.endpoints[blockchain][endpoint]
        info["error_count"] += 1
        
        # Bestimme die Dauer der Deaktivierung basierend auf dem Fehler
        disable_duration = 60  # Standard: 1 Minute
        
        if status_code == 429:  # Too Many Requests
            disable_duration = 300  # 5 Minuten
        elif status_code == 402:  # Payment Required
            disable_duration = 3600  # 1 Stunde
        elif status_code == 500:
            disable_duration = 120  # 2 Minuten
        
        info["disabled_until"] = time.time() + disable_duration
        info["status"] = "disabled"
        
        logger.warning(
            f"Endpoint-Manager: Endpoint {endpoint} für {blockchain} deaktiviert "
            f"wegen Fehler (Status: {status_code}, Fehlermeldung: {error_message}). "
            f"Wird reaktiviert in {disable_duration} Sekunden."
        )
    
    def _cleanup_disabled_endpoints(self):
        """Reaktiviert Endpoints, deren Deaktivierungszeit abgelaufen ist"""
        current_time = time.time()
        for blockchain in self.endpoints:
            for endpoint, info in self.endpoints[blockchain].items():
                if info["status"] == "disabled" and current_time > info["disabled_until"]:
                    info["status"] = "active"
                    info["error_count"] = max(0, info["error_count"] - 1)  # Verringere Fehlerzähler
                    logger.info(f"Endpoint-Manager: Endpoint {endpoint} für {blockchain} reaktiviert")
    
    def _reactivate_all_endpoints(self, blockchain):
        """Reaktiviert alle Endpoints für eine Blockchain (für Notfälle)"""
        current_time = time.time()
        for endpoint, info in self.endpoints[blockchain].items():
            if info["status"] == "disabled":
                # Reaktiviere nur Endpoints, die nicht kürzlich fehlgeschlagen sind
                if current_time - info["last_used"] > 300:  # 5 Minuten
                    info["status"] = "active"
                    logger.info(f"Endpoint-Manager: Endpoint {endpoint} für {blockchain} NOTFALL-REAKTIVIERUNG")
    
    def get_stats(self):
        """Gibt Statistiken über die Endpoint-Nutzung zurück"""
        return {
            "total_requests": sum(self.request_counts.values()),
            "requests_by_blockchain": dict(self.request_counts),
            "active_endpoints": {
                blockchain: len([e for e, i in endpoints.items() if i["status"] == "active"])
                for blockchain, endpoints in self.endpoints.items()
            },
            "disabled_endpoints": {
                blockchain: len([e for e, i in endpoints.items() if i["status"] == "disabled"])
                for blockchain, endpoints in self.endpoints.items()
            }
        }
