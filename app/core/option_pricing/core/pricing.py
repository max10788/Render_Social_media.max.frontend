import time
from typing import Dict, Any
from .simulation import MonteCarloSimulation
from .validation import validate_request
from ..data.sources import DataSourceManager
from ..data.processors import DataProcessor
from ..utils.exceptions import PricingError, DataUnavailableError

class OptionPricingService:
    def __init__(self):
        self.simulation = MonteCarloSimulation()
        self.data_manager = DataSourceManager()
        self.processor = DataProcessor()
    
    def calculate_basket_option_price(self, request: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        
        # Validierung der Anfrage
        validate_request(request)
        
        try:
            # Datenbeschaffung
            blockchain = request['blockchain']
            assets = self._get_assets_data(request['assets'], blockchain)
            
            # Datenverarbeitung
            processed_data = self.processor.process_assets_data(assets, blockchain)
            
            # Simulation durchführen
            simulation_params = {
                **request,
                'assets': processed_data['assets'],
                'correlation': processed_data['correlation']
            }
            
            result = self.simulation.run_simulation(simulation_params)
            
            # Metadaten hinzufügen
            result['computational_time_ms'] = round((time.time() - start_time) * 1000, 2)
            result['assets_used'] = assets
            result['data_source'] = request['data_source']
            
            return result
        except Exception as e:
            raise PricingError(f"Calculation failed: {str(e)}")
    
    def _get_assets_data(self, assets: list, blockchain: str) -> list:
        result = []
        for asset in assets:
            symbol = asset['symbol']
            
            # Wenn Spot-Preis nicht angegeben, von Datenquelle holen
            if asset.get('spot_price') is None:
                try:
                    spot_price = self.data_manager.get_current_price(symbol, blockchain)
                except DataUnavailableError:
                    raise PricingError(f"Could not retrieve spot price for {symbol}")
            else:
                spot_price = asset['spot_price']
            
            # Wenn Volatilität nicht angegeben, berechnen
            if asset.get('volatility') is None:
                try:
                    volatility = self.data_manager.get_volatility(symbol, blockchain)
                except DataUnavailableError:
                    raise PricingError(f"Could not calculate volatility for {symbol}")
            else:
                volatility = asset['volatility']
            
            result.append({
                'symbol': symbol,
                'spot_price': spot_price,
                'volatility': volatility,
                'weight': asset['weight']
            })
        
        return result
