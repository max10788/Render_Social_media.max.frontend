from typing import Dict, Any
from ..utils.exceptions import PricingError

def validate_request(request: Dict[str, Any]) -> None:
    # Prüfen, ob die Gewichte summiert 1 ergeben
    weights_sum = sum(asset['weight'] for asset in request['assets'])
    if abs(weights_sum - 1.0) > 1e-10:
        raise PricingError("Weights must sum to 1")
    
    # Mindestanzahl an Simulationen
    if request['num_simulations'] < 10000:
        raise PricingError("Number of simulations must be at least 10,000")
    
    # Mindestanzahl an Zeitschritten
    if request['num_timesteps'] < 12:
        raise PricingError("Number of timesteps must be at least 12")
    
    # Prüfen, ob Blockchain unterstützt wird
    supported_blockchains = ['ethereum', 'solana']
    if request['blockchain'].lower() not in supported_blockchains:
        raise PricingError(f"Unsupported blockchain. Supported: {supported_blockchains}")
    
    # Prüfen, ob Korrelation im gültigen Bereich ist
    if 'correlation' in request and request['correlation'] is not None:
        correlation = request['correlation']
        if not (-1 <= correlation <= 1):
            raise PricingError("Correlation must be between -1 and 1")
