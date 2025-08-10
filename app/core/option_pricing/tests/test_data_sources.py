import pytest
from app.option_pricing.data.sources import DataSourceManager
from app.option_pricing.utils.exceptions import DataUnavailableError

def test_get_current_price():
    manager = DataSourceManager()
    
    # Test mit nicht existierendem Symbol
    with pytest.raises(DataUnavailableError):
        manager.get_current_price('NONEXISTENT', 'ethereum')
    
    # Test mit unterstütztem Symbol
    try:
        price = manager.get_current_price('ETH', 'ethereum')
        assert isinstance(price, float)
        assert price > 0
    except DataUnavailableError:
        # API-Key nicht verfügbar, Test überspringen
        pytest.skip("API key not available")
