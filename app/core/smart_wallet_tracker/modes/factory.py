"""
Factory-Klasse zur Erstellung von Analyse-Modi.
"""
from typing import Dict, Any, Optional, Type
import json
from pathlib import Path

from .base import BaseMode
from .alpha_hunter import AlphaHunterMode
from .smart_investor import SmartInvestorMode
from .security_first import SecurityFirstMode
from .custom_lab import CustomLabMode
from config.settings import MODES_CONFIG_PATH


class ModeFactory:
    """Factory zur Erstellung von Analyse-Modi."""
    
    _MODE_REGISTRY: Dict[str, Type[BaseMode]] = {
        'alpha_hunter': AlphaHunterMode,
        'smart_investor': SmartInvestorMode,
        'security_first': SecurityFirstMode,
        'custom_lab': CustomLabMode,
    }
    
    def __init__(self):
        """Initialisiert die Factory mit Modus-Konfigurationen."""
        with open(MODES_CONFIG_PATH, 'r') as f:
            self._modes_config = json.load(f).get('modes', {})
    
    def create_mode(self, mode_name: str, config_path: Optional[Path] = None) -> BaseMode:
        """
        Erstellt einen Modus basierend auf dem Namen.
        
        Args:
            mode_name: Name des zu erstellenden Modus
            config_path: Pfad zur benutzerdefinierten Konfigurationsdatei
            
        Returns:
            Instanz des angeforderten Modus
            
        Raises:
            ValueError: Wenn der Modus nicht existiert
        """
        if mode_name not in self._MODE_REGISTRY:
            raise ValueError(f"Unbekannter Modus: {mode_name}")
        
        mode_class = self._MODE_REGISTRY[mode_name]
        mode_config = self._modes_config.get(mode_name, {})
        
        if mode_name == 'custom_lab' and config_path:
            return mode_class(config_path)
        
        return mode_class(mode_config)
    
    @classmethod
    def available_modes(cls) -> Dict[str, str]:
        """
        Gibt eine Liste der verfügbaren Modi zurück.
        
        Returns:
            Dictionary mit Modus-Namen und Beschreibungen
        """
        return {
            'alpha_hunter': 'Echtzeit-Signale, Arbitrage, Sniping',
            'smart_investor': 'Fundamentale Stärke, Portfolio-Insights',
            'security_first': 'Fake-Wallet-Erkennung, Betrugsprävention',
            'custom_lab': 'Voll anpassbare Analyseumgebung'
        }