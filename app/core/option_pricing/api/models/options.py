from pydantic import BaseModel, validator
from typing import List, Optional

class Asset(BaseModel):
    symbol: str
    weight: float
    spot_price: Optional[float] = None
    volatility: Optional[float] = None
    
    @validator('weight')
    def validate_weight(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Weight must be between 0 and 1')
        return v

class BasketOptionRequest(BaseModel):
    assets: List[Asset]
    correlation: Optional[float] = None
    risk_free_rate: float
    time_to_maturity: float
    strike_price: float
    num_simulations: int = 100000
    num_timesteps: int = 252
    blockchain: str = "ethereum"
    exchanges: Optional[List[str]] = None
    data_source: str = "blockchain"
    
    @validator('assets')
    def validate_assets(cls, v):
        if len(v) < 2:
            raise ValueError('At least 2 assets required')
        if sum(asset.weight for asset in v) != 1.0:
            raise ValueError('Weights must sum to 1')
        return v
    
    @validator('num_simulations')
    def validate_simulations(cls, v):
        if v < 10000:
            raise ValueError('Minimum 10,000 simulations required')
        return v
    
    @validator('num_timesteps')
    def validate_timesteps(cls, v):
        if v < 12:
            raise ValueError('Minimum 12 timesteps required')
        return v

class PricingResponse(BaseModel):
    option_price: float
    confidence_interval: dict
    computational_time_ms: float
    assets_used: List[dict]
    data_source: str
