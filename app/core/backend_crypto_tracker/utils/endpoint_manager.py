import time
import random
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

 env: DATABASE_URL=postgresql://render_social_media_db_max_user:YlrrsFkSiEnbw8pdFPr5IPjqCJImRgD3@dpg-d1nphm3e5dus73b5tg20-a.frankfurt-postgres.render.com/render_social_media_db_max
REDIS_URL=redis://localhost:6379/0
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAADpC0AEAAAAAXz%2FCnKNmJuC9TfUN4rA1UdFrGMQ%3D63L6o8AbUX0uHKQg2vZOrKJ63pvF94rTd4GAQjtKpOOt6IJZjw
TWITTER_API_KEY=OjFeO2jYZXJ4ajhe7U5WYZqai
TWITTER_API_SECRET=BbTXs1vpxLyPKK4fw5rlhQFgNafpSQ6Pz6jN4lSAYVXZRtSSDz
TWITTER_ACCESS_TOKEN=1857088983689277441-0E18mG0olpaTe0reVWfNlTHucYGCyU
TWITTER_ACCESS_SECRET=iDbyAmJaHcdon7Cumxmb62WTYppFqCEsKEhdzCaUC7Ecp
# Solana RPC Konfiguration
SOLANA_RPC_URL=https://go.getblock.io/d811eef27ec045a0aa4a68178cae3abf  

# Fallback RPC URLs (durch Komma getrennt)
SOLANA_FALLBACK_RPC_URLS=https://boldest-burned-grass.solana-mainnet.quiknode.pro/0817dc928ed6dacfdcc3b409f5f05eab019f2c95/  ,https://go.getblock.io/a93ec09580384d429fd1dd1075a9e5a7  ,https://lb.drpc.org/ogrpc?network=solana&dkey=AmHVImPCc042lT0AOgT_jPYzltx7Sn0R8I7kKlzbRHZc

# Rate Limiting Einstellungen
SOLANA_RATE_LIMIT_RATE=50
SOLANA_RATE_LIMIT_CAPACITY=100

# Health Check Intervall in Sekunden
SOLANA_HEALTH_CHECK_INTERVAL=60
ETHEREUM_RPC_URL= https://mainnet.infura.io/v3/1JTTMXUDJ2D2DKAW9BU6PED8NZJD7G4G9V 
MORALIS_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImEwZjczNDM3LTU4ZDgtNGE2OC1iMWYwLTMzMTAwMDEwNzE1NyIsIm9yZ0lkIjoiNDMxMjM4IiwidXNlcklkIjoiNDQzNTg3IiwidHlwZUlkIjoiMjFiZTZhNmUtMzA2Yi00MTEyLWFmOTctMmYzODEzYzUzMjgxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3Mzk0ODA5MzksImV4cCI6NDg5NTI0MDkzOX0.cHS5iBrOIoCcXsP2eX2dflF8FSSwz1ce46pO9ZiYQ08
NLTK_DATA=/opt/render/nltk_data
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
COINGECKO_API_KEY=CG-hErvsjn17AgZrTBMoToyTziB
BLOCKCHAIN_INFO_API_KEY=Blockchain.info
DEBUG=True
BTC_API=https://blockchain.info/rawtx/ $tx_hash app/core/backend_crypto_tracker/utils/endpoint_manager.py: import time
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
            "https://api.mainnet-beta.solana.com ": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://solana-api.projectserum.com ": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://ssc-dao.genesysgo.net ": {
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
            " https://cloudflare-eth.com ": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            }
        }
        
        # Für Bitcoin
        self.endpoints["btc"] = {
            "https://blockchain.info ": {
                "status": "active",
                "last_used": 0,
                "error_count": 0,
                "disabled_until": 0
            },
            "https://blockstream.info/api ": {
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
