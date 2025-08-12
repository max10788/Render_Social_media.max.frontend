"""
Hauptanalyse-Engine für Wallet-Aktivitäten.
"""
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import logging

from api.solana_api import SolanaAPI
from api.solscan_api import SolscanAPI
from api.gmgn_api import GMGNAPI
from storage.cache import CacheManager
from storage.database import DatabaseManager
from storage.models import WalletData, AnalysisResult
from .filters import BaseFilter
from .scoring import BaseScorer
from .alerts import AlertManager


@dataclass
class AnalysisConfig:
    """Konfigurationsklasse für die Analyse."""
    use_cache: bool = True
    cache_ttl: int = 3600  # 1 Stunde
    save_results: bool = True
    max_wallets: int = 100


class WalletAnalyzer:
    """Hauptklasse für die Wallet-Analyse."""
    
    def __init__(self, config: Optional[AnalysisConfig] = None):
        """
        Initialisiert die Wallet-Analyse.
        
        Args:
            config: Analysekonfiguration
        """
        self.config = config or AnalysisConfig()
        self.logger = logging.getLogger(__name__)
        
        # APIs initialisieren
        self.solana_api = SolanaAPI()
        self.solscan_api = SolscanAPI()
        self.gmgn_api = GMGNAPI()
        
        # Speicher-Systeme
        self.cache = CacheManager(ttl=self.config.cache_ttl) if self.config.use_cache else None
        self.db = DatabaseManager() if self.config.save_results else None
        
        # Analyse-Komponenten
        self.filters: List[BaseFilter] = []
        self.scorer: Optional[BaseScorer] = None
        self.alert_manager = AlertManager()
        
        self.logger.info("WalletAnalyzer initialisiert")
    
    def add_filter(self, filter_obj: BaseFilter) -> None:
        """Fügt einen Filter zur Analyse hinzu."""
        self.filters.append(filter_obj)
        self.logger.debug(f"Filter hinzugefügt: {filter_obj.__class__.__name__}")
    
    def set_scorer(self, scorer: BaseScorer) -> None:
        """Setzt den Scorer für die Analyse."""
        self.scorer = scorer
        self.logger.debug(f"Scorer gesetzt: {scorer.__class__.__name__}")
    
    def analyze_wallets(self, wallet_addresses: List[str]) -> List[AnalysisResult]:
        """
        Analysiert eine Liste von Wallet-Adressen.
        
        Args:
            wallet_addresses: Liste der zu analysierenden Wallet-Adressen
            
        Returns:
            Liste der Analyseergebnisse
        """
        self.logger.info(f"Starte Analyse von {len(wallet_addresses)} Wallets")
        
        # Wallet-Daten abrufen
        wallet_data_list = self._fetch_wallet_data(wallet_addresses)
        
        # Filter anwenden
        filtered_wallets = self._apply_filters(wallet_data_list)
        
        # Scores berechnen
        scored_wallets = self._calculate_scores(filtered_wallets)
        
        # Ergebnisse erstellen
        results = self._create_results(scored_wallets)
        
        # Ergebnisse speichern
        if self.db:
            self._save_results(results)
        
        self.logger.info(f"Analyse abgeschlossen. {len(results)} Wallets verarbeitet")
        return results
    
    def _fetch_wallet_data(self, wallet_addresses: List[str]) -> List[WalletData]:
        """Ruft Wallet-Daten von APIs oder Cache ab."""
        wallet_data_list = []
        
        for address in wallet_addresses:
            # Prüfen, ob Daten im Cache vorhanden sind
            cache_key = f"wallet_data:{address}"
            cached_data = self.cache.get(cache_key) if self.cache else None
            
            if cached_data:
                wallet_data_list.append(cached_data)
                continue
            
            # Daten von APIs abrufen
            try:
                # Basisdaten von Solana API
                solana_data = self.solana_api.get_account_info(address)
                
                # Erweiterte Daten von Solscan
                solscan_data = self.solscan_api.get_account_details(address)
                
                # Analyse-Daten von GMGN
                gmgn_data = self.gmgn_api.get_wallet_analysis(address)
                
                # Wallet-Daten-Objekt erstellen
                wallet_data = WalletData(
                    address=address,
                    solana_data=solana_data,
                    solscan_data=solscan_data,
                    gmgn_data=gmgn_data,
                    timestamp=time.time()
                )
                
                # Im Cache speichern
                if self.cache:
                    self.cache.set(cache_key, wallet_data)
                
                wallet_data_list.append(wallet_data)
                
            except Exception as e:
                self.logger.error(f"Fehler beim Abrufen der Daten für {address}: {e}")
                continue
        
        return wallet_data_list
    
    def _apply_filters(self, wallet_data_list: List[WalletData]) -> List[WalletData]:
        """Wendet alle registrierten Filter an."""
        filtered_wallets = wallet_data_list
        
        for filter_obj in self.filters:
            filtered_wallets = filter_obj.apply(filtered_wallets)
            self.logger.debug(f"Filter {filter_obj.__class__.__name__} angewendet. "
                            f"Verbleibende Wallets: {len(filtered_wallets)}")
        
        return filtered_wallets
    
    def _calculate_scores(self, wallet_data_list: List[WalletData]) -> List[WalletData]:
        """Berechnet Scores für die Wallets."""
        if not self.scorer:
            self.logger.warning("Kein Scorer gesetzt. Überspringe Score-Berechnung.")
            return wallet_data_list
        
        scored_wallets = []
        for wallet_data in wallet_data_list:
            try:
                scored_wallet = self.scorer.calculate_score(wallet_data)
                scored_wallets.append(scored_wallet)
            except Exception as e:
                self.logger.error(f"Fehler bei der Score-Berechnung für {wallet_data.address}: {e}")
                scored_wallets.append(wallet_data)
        
        return scored_wallets
    
    def _create_results(self, wallet_data_list: List[WalletData]) -> List[AnalysisResult]:
        """Erstellt Analyseergebnisse aus den Wallet-Daten."""
        results = []
        
        for wallet_data in wallet_data_list:
            # Alerts prüfen
            alerts = self.alert_manager.check_alerts(wallet_data)
            
            # Ergebnis erstellen
            result = AnalysisResult(
                wallet_address=wallet_data.address,
                score=wallet_data.score,
                risk_level=wallet_data.risk_level,
                alerts=alerts,
                data=wallet_data,
                timestamp=time.time()
            )
            
            results.append(result)
        
        return results
    
    def _save_results(self, results: List[AnalysisResult]) -> None:
        """Speichert die Ergebnisse in der Datenbank."""
        try:
            for result in results:
                self.db.save_analysis_result(result)
            self.logger.info(f"{len(results)} Ergebnisse in der Datenbank gespeichert")
        except Exception as e:
            self.logger.error(f"Fehler beim Speichern der Ergebnisse: {e}")