import pytest
import numpy as np
from app.option_pricing.core.simulation import MonteCarloSimulation

def test_monte_carlo_simulation():
    params = {
        'assets': [
            {'symbol': 'BTC', 'spot_price': 50000, 'volatility': 0.7, 'weight': 0.6},
            {'symbol': 'ETH', 'spot_price': 3000, 'volatility': 0.9, 'weight': 0.4}
        ],
        'correlation': 0.65,
        'risk_free_rate': 0.03,
        'time_to_maturity': 0.5,
        'strike_price': 35000,
        'num_simulations': 1000,  # Reduziert für schnellere Tests
        'num_timesteps': 252
    }
    
    result = MonteCarloSimulation.run_simulation(params)
    
    assert 'option_price' in result
    assert 'confidence_interval' in result
    assert isinstance(result['option_price'], float)
    assert result['option_price'] > 0
    assert result['confidence_interval']['lower'] < result['option_price']
    assert result['confidence_interval']['upper'] > result['option_price']
