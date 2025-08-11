from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any
from datetime import datetime
from enum import Enum

class OptionType(str, Enum):
    """Optionstypen"""
    CALL = "call"
    PUT = "put"

class VolatilityModel(str, Enum):
    """Volatilitätsmodelle"""
    HISTORICAL = "historical"
    EWMA = "ewma"
    GARCH = "garch"

class CorrelationMethod(str, Enum):
    """Korrelationsmethoden"""
    PEARSON = "pearson"
    SPEARMAN = "spearman"
    KENDALL = "kendall"

class StochasticModel(str, Enum):
    """Stochastische Modelle"""
    GBM = "gbm"
    JUMP_DIFFUSION = "jump_diffusion"
    HESTON = "heston"

class AssetInfo(BaseModel):
    """Modell für Asset-Informationen"""
    symbol: str = Field(..., description="Asset-Symbol")
    name: str = Field(..., description="Vollständiger Name des Assets")
    type: str = Field(..., description="Typ des Assets (z.B. Kryptowährung)")
    exchanges: List[str] = Field(..., description="Börsen, die dieses Asset listen")
    blockchains: List[str] = Field(..., description="Blockchains, auf denen dieses Asset existiert")

class ExchangeInfo(BaseModel):
    """Modell für Börsen-Informationen"""
    name: str = Field(..., description="Name der Börse")
    api_url: str = Field(..., description="API-URL der Börse")
    features: List[str] = Field(..., description="Verfügbare Funktionen der Börse")
    rate_limits: Dict[str, int] = Field(..., description="Rate Limits der Börse")

class BlockchainInfo(BaseModel):
    """Modell für Blockchain-Informationen"""
    name: str = Field(..., description="Name der Blockchain")
    api_url: str = Field(..., description="API-URL der Blockchain")
    features: List[str] = Field(..., description="Verfügbare Funktionen der Blockchain")
    tokens: List[str] = Field(..., description="Unterstützte Tokens")

class SystemConfig(BaseModel):
    """Modell für Systemkonfiguration"""
    default_num_simulations: int = Field(100000, description="Standardanzahl der Simulationen")
    default_num_timesteps: int = Field(252, description="Standardanzahl der Zeitschritte")
    default_risk_free_rate: float = Field(0.03, description="Standard risikofreier Zinssatz")
    exchange_priority: List[str] = Field(..., description="Priorität der Börsen")
    supported_volatility_models: List[VolatilityModel] = Field(..., description="Unterstützte Volatilitätsmodelle")
    supported_stochastic_models: List[StochasticModel] = Field(..., description="Unterstützte stochastische Modelle")
    max_assets_per_basket: int = Field(10, description="Maximale Anzahl an Assets pro Basket")

class AssetPriceRequest(BaseModel):
    """Modell für Anfrage von Asset-Preisen"""
    assets: List[str] = Field(..., description="Liste der Asset-Symbole")
    start_date: datetime = Field(..., description="Startdatum")
    end_date: datetime = Field(..., description="Enddatum")
    exchanges: Optional[List[str]] = Field(None, description="Liste der zu verwendenden Börsen")
    blockchains: Optional[List[str]] = Field(None, description="Liste der zu verwendenden Blockchains")

class AssetPriceResponse(BaseModel):
    """Modell für Antwort mit Asset-Preisen"""
    assets: List[str]
    prices: Dict[str, List[float]]
    dates: List[str]
    sources: Dict[str, str]
    statistics: Optional[Dict[str, Dict[str, float]]] = Field(None, description="Statistiken für jedes Asset")

class VolatilityRequest(BaseModel):
    """Modell für Anfrage von Volatilitätsdaten"""
    asset: str = Field(..., description="Asset-Symbol")
    start_date: datetime = Field(..., description="Startdatum")
    end_date: datetime = Field(..., description="Enddatum")
    model: VolatilityModel = Field(VolatilityModel.HISTORICAL, description="Zu verwendendes Volatilitätsmodell")
    window: Optional[int] = Field(30, description="Fenstergröße für die Berechnung")
    halflife: Optional[int] = Field(30, description="Halbwertszeit für EWMA")
    garch_params: Optional[Dict[str, float]] = Field(None, description="Parameter für GARCH-Modell")

class VolatilityResponse(BaseModel):
    """Modell für Antwort mit Volatilitätsdaten"""
    asset: str
    volatility: float
    model: VolatilityModel
    parameters: Optional[Dict[str, float]]
    forecast: Optional[List[float]]
    forecast_dates: Optional[List[str]]
    confidence_intervals: Optional[Dict[str, List[float]]] = Field(None, description="Konfidenzintervalle für die Prognose")

class CorrelationRequest(BaseModel):
    """Modell für Anfrage von Korrelationsdaten"""
    assets: List[str] = Field(..., description="Liste der Asset-Symbole")
    start_date: datetime = Field(..., description="Startdatum")
    end_date: datetime = Field(..., description="Enddatum")
    method: CorrelationMethod = Field(CorrelationMethod.PEARSON, description="Zu verwendende Korrelationsmethode")
    window: Optional[int] = Field(None, description="Fenstergröße für rollende Korrelation")
    dynamic: Optional[bool] = Field(False, description="Ob dynamische Korrelation berechnet werden soll")

class CorrelationResponse(BaseModel):
    """Modell für Antwort mit Korrelationsdaten"""
    assets: List[str]
    correlation_matrix: List[List[float]]
    method: CorrelationMethod
    rolling_correlations: Optional[Dict[str, List[float]]]
    rolling_dates: Optional[List[str]]
    dynamic_correlations: Optional[Dict[str, List[List[float]]]]
    dynamic_dates: Optional[List[str]]
    average_correlation: Optional[float] = Field(None, description="Durchschnittliche Korrelation")

class OptionPricingRequest(BaseModel):
    """Modell für Anfrage zur Optionspreisberechnung"""
    assets: List[str] = Field(..., description="Liste der Asset-Symbole")
    weights: List[float] = Field(..., description="Gewichte der Assets im Basket")
    strike_price: float = Field(..., description="Strike-Preis der Option")
    option_type: OptionType = Field(OptionType.CALL, description="Typ der Option")
    time_to_maturity: float = Field(..., description="Zeit bis zum Verfall in Jahren")
    risk_free_rate: float = Field(0.03, description="Risikofreier Zinssatz")
    num_simulations: int = Field(100000, description="Anzahl der Simulationen")
    stochastic_model: StochasticModel = Field(StochasticModel.GBM, description="Zu verwendendes stochastisches Modell")
    calculate_greeks: bool = Field(False, description="Ob Griechen berechnet werden sollen")
    include_analysis: bool = Field(True, description="Ob Analyseergebnisse enthalten sein sollen")
    jump_params: Optional[Dict[str, float]] = Field(None, description="Parameter für Jump-Diffusion-Modell")
    heston_params: Optional[Dict[str, float]] = Field(None, description="Parameter für Heston-Modell")

class OptionPricingResponse(BaseModel):
    """Modell für Antwort mit Optionspreis"""
    option_price: float
    assets: List[str]
    weights: List[float]
    strike_price: float
    option_type: OptionType
    time_to_maturity: float
    risk_free_rate: float
    num_simulations: int
    stochastic_model: StochasticModel
    initial_prices: List[float]
    drift: List[float]
    volatility: List[float]
    correlation_matrix: List[List[float]]
    greeks: Optional[Dict[str, Union[float, List[float]]]]
    analysis: Optional[Dict[str, Any]]
    convergence_data: Optional[Dict[str, List[float]]] = Field(None, description="Konvergenzdaten der Simulation")

class ImpliedVolatilityRequest(BaseModel):
    """Modell für Anfrage zur Berechnung der impliziten Volatilität"""
    assets: List[str] = Field(..., description="Liste der Asset-Symbole")
    weights: List[float] = Field(..., description="Gewichte der Assets im Basket")
    strike_price: float = Field(..., description="Strike-Preis der Option")
    option_price: float = Field(..., description="Marktpreis der Option")
    option_type: OptionType = Field(OptionType.CALL, description="Typ der Option")
    time_to_maturity: float = Field(..., description="Zeit bis zum Verfall in Jahren")
    risk_free_rate: float = Field(0.03, description="Risikofreier Zinssatz")
    max_iterations: int = Field(100, description="Maximale Anzahl der Iterationen")
    tolerance: float = Field(1e-6, description="Toleranz für die Konvergenz")

class ImpliedVolatilityResponse(BaseModel):
    """Modell für Antwort mit impliziter Volatilität"""
    implied_volatility: float
    assets: List[str]
    weights: List[float]
    strike_price: float
    option_price: float
    option_type: OptionType
    time_to_maturity: float
    risk_free_rate: float
    iterations: int
    converged: bool
    convergence_history: Optional[List[float]] = Field(None, description="Konvergenzverlauf")

class RiskMetricsRequest(BaseModel):
    """Modell für Anfrage von Risikokennzahlen"""
    assets: List[str] = Field(..., description="Liste der Asset-Symbole")
    weights: List[float] = Field(..., description="Gewichte der Assets im Portfolio")
    start_date: datetime = Field(..., description="Startdatum")
    end_date: datetime = Field(..., description="Enddatum")
    confidence_level: float = Field(0.95, description="Konfidenzniveau")
    holding_period: int = Field(1, description="Haltedauer in Tagen")
    risk_free_rate: float = Field(0.03, description="Risikofreier Zinssatz")
    benchmark: Optional[str] = Field(None, description="Benchmark-Asset für Beta-Berechnung")

class RiskMetricsResponse(BaseModel):
    """Modell für Antwort mit Risikokennzahlen"""
    assets: List[str]
    weights: List[float]
    var: float
    expected_shortfall: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    calmar_ratio: float
    beta: Optional[float]
    information_ratio: Optional[float]
    risk_contribution: List[float]
    stress_test_results: Optional[Dict[str, Dict[str, float]]] = Field(None, description="Ergebnisse von Stresstests")

class SimulationProgress(BaseModel):
    """Modell für Simulationsfortschritt"""
    simulation_id: str
    progress: float  # 0.0 bis 1.0
    status: str  # "running", "completed", "failed"
    message: Optional[str] = None
    estimated_time_remaining: Optional[int] = Field(None, description="Geschätzte verbleibende Zeit in Sekunden")

class SimulationStatusResponse(BaseModel):
    """Modell für Antwort mit Simulationsstatus"""
    simulations: List[SimulationProgress]
