"""
Dashboard-Implementierung für die Visualisierung der Analyseergebnisse.
"""
import os
from typing import Dict, Any, Optional
from pathlib import Path
import logging
from flask import Flask, render_template, jsonify, request
import plotly.graph_objects as go
import plotly.express as px

from modes.base import BaseMode
from storage.models import AnalysisResult
from .charts import ChartGenerator


class Dashboard:
    """Dashboard-Klasse zur Visualisierung der Analyseergebnisse."""
    
    def __init__(self, mode: BaseMode, port: int = 8080, host: str = "127.0.0.1"):
        """
        Initialisiert das Dashboard.
        
        Args:
            mode: Der anzuzeigende Analysemodus
            port: Port für den Webserver
            host: Host für den Webserver
        """
        self.mode = mode
        self.port = port
        self.host = host
        self.logger = logging.getLogger(__name__)
        
        # Flask-App initialisieren
        template_dir = Path(__file__).parent / "templates"
        static_dir = Path(__file__).parent / "static"
        self.app = Flask(__name__, 
                         template_folder=str(template_dir),
                         static_folder=str(static_dir))
        
        # Chart-Generator
        self.chart_generator = ChartGenerator()
        
        # Routen einrichten
        self._setup_routes()
        
        self.logger.info(f"Dashboard für Modus {mode.__class__.__name__} initialisiert")
    
    def _setup_routes(self) -> None:
        """Richtet die Flask-Routen ein."""
        
        @self.app.route('/')
        def index():
            """Hauptseite des Dashboards."""
            return render_template(
                'dashboard.html',
                mode_name=self.mode.__class__.__name__,
                mode_description=self.mode.description
            )
        
        @self.app.route('/api/analyze', methods=['POST'])
        def analyze_wallets():
            """API-Endpunkt zur Wallet-Analyse."""
            data = request.get_json()
            wallet_addresses = data.get('wallets', [])
            
            if not wallet_addresses:
                return jsonify({'error': 'Keine Wallet-Adressen angegeben'}), 400
            
            try:
                results = self.mode.analyze_wallets(wallet_addresses)
                return jsonify({
                    'status': 'success',
                    'results': [result.to_dict() for result in results]
                })
            except Exception as e:
                self.logger.error(f"Fehler bei der Wallet-Analyse: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/api/chart/<chart_type>')
        def get_chart(chart_type: str):
            """API-Endpunkt für Chart-Daten."""
            try:
                # Wallet-Adressen aus den Abfrageparametern holen
                wallet_addresses = request.args.getlist('wallets')
                
                if not wallet_addresses:
                    return jsonify({'error': 'Keine Wallet-Adressen angegeben'}), 400
                
                # Ergebnisse abrufen
                results = self.mode.analyze_wallets(wallet_addresses)
                
                # Chart generieren
                if chart_type == 'wallet_activity':
                    fig = self.chart_generator.create_wallet_activity_chart(results)
                elif chart_type == 'token_distribution':
                    fig = self.chart_generator.create_token_distribution_chart(results)
                elif chart_type == 'profit_loss':
                    fig = self.chart_generator.create_profit_loss_chart(results)
                elif chart_type == 'risk_analysis':
                    fig = self.chart_generator.create_risk_analysis_chart(results)
                elif chart_type == 'score_comparison':
                    fig = self.chart_generator.create_score_comparison_chart(results)
                else:
                    return jsonify({'error': f'Unbekannter Chart-Typ: {chart_type}'}), 400
                
                return jsonify(fig.to_dict())
                
            except Exception as e:
                self.logger.error(f"Fehler bei der Chart-Generierung: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/api/modes')
        def get_modes():
            """API-Endpunkt für verfügbare Modi."""
            from modes.factory import ModeFactory
            return jsonify(ModeFactory.available_modes())
    
    def run(self, debug: bool = False) -> None:
        """
        Startet das Dashboard.
        
        Args:
            debug: Ob der Debug-Modus aktiviert werden soll
        """
        self.logger.info(f"Starte Dashboard auf {self.host}:{self.port}")
        self.app.run(host=self.host, port=self.port, debug=debug)