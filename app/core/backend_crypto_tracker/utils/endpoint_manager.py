import time
import random
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class EndpointManager:
    def __init__(self):
        self.endpoints = defaultdict(dict)
        self.request_counts = defaultdict(int)
        self.last_request_time = time.time()
        self.min_request_interval = 0.5  # Mindestabstand zwischen Anfragen
        self.load_default_endpoints()

    def load_default_endpoints(self):
        """Lädt Endpoints aus Umgebungsvariablen, fallback auf Defaults"""
        # === Solana ===
        solana_primary = os.getenv("SOLANA_RPC_URL")
        solana_fallbacks = os.getenv("SOLANA_FALLBACK_RPC_URLS", "")
        fallback_urls = [url.strip() for url in solana_fallbacks.split(",") if url.strip()]

        self.endpoints["sol"] = {}

        if solana_primary:
            self.endpoints["sol"][solana_primary] = {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            }
        else:
            # Fallback: Nutze öffentliche Solana-Endpunkte, falls nichts in .env
            self.endpoints["sol"]["https://api.mainnet-beta.solana.com"] = {
                "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
            }

        # Fallback-URLs hinzufügen
        for url in fallback_urls:
            if url not in self.endpoints["sol"]:
                self.endpoints["sol"][url] = {
                    "status": "active",
                    "last_used": 0,
                    "error_count": 0,
                    "disabled_until": 0
                }

        # === Ethereum ===
        infura_url = os.getenv("ETHEREUM_RPC_URL")
        etherscan_api_key = os.getenv("ETHERSCAN_API_KEY")
        self.endpoints["eth"] = {}

        if infura_url:
            self.endpoints["eth"][infura_url] = {
                "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
            }

        if etherscan_api_key:
            self.endpoints["eth"][f"https://api.etherscan.io/api?apikey={etherscan_api_key}"] = {
                "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
            }

        # Alternativ: Cloudflare als Fallback
        self.endpoints["eth"]["https://cloudflare-eth.com"] = {
            "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
        }

        # === Bitcoin ===
        btc_api_url = os.getenv("BTC_API", "").replace("$tx_hash", "").strip()
        self.endpoints["btc"] = {}

        if btc_api_url:
            # Entferne $tx_hash oder trailing Leerzeichen
            base_url = btc_api_url.rstrip("/")
            self.endpoints["btc"][base_url] = {
                "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
            }

        # Fallbacks
        self.endpoints["btc"]["https://blockchain.info"] = {
            "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
        }
        self.endpoints["btc"]["https://blockstream.info/api"] = {
            "status": "active", "last_used": 0, "error_count": 0, "disabled_until": 0
        }

        logger.info(f"Endpoint-Manager: Geladene Solana-Endpunkte: {list(self.endpoints['sol'].keys())}")
        logger.info(f"Endpoint-Manager: Geladene Ethereum-Endpunkte: {list(self.endpoints['eth'].keys())}")
        logger.info(f"Endpoint-Manager: Geladene Bitcoin-Endpunkte: {list(self.endpoints['btc'].keys())}")
    
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
