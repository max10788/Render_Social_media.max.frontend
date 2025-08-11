from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import logging
import uuid
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

from ..core.pricing import BasketOptionPricer
from ..data.aggregators import DataAggregator
from ..data.correlation import CorrelationAnalyzer
from ..data.volatility import (
    HistoricalVolatility, 
    EWMAVolatility, 
    GARCHVolatility,
    VolatilityForecaster,
    VolatilityAnalyzer
)
from ..core.risk_metrics import RiskMetrics
from ..utils.cache import CacheManager, DataCache
from ..utils.exceptions import PricingError, DataError
from ..utils.parallel_utils import MonteCarloParallelSimulator
from .models import (
    AssetPriceRequest,
    AssetPriceResponse,
    VolatilityRequest,
    VolatilityResponse,
    CorrelationRequest,
    CorrelationResponse,
    OptionPricingRequest,
    OptionPricingResponse,
    ImpliedVolatilityRequest,
    ImpliedVolatilityResponse,
    RiskMetricsRequest,
    RiskMetricsResponse,
    AssetInfo,
    ExchangeInfo,
    BlockchainInfo,
    SystemConfig,
    SimulationProgress,
    SimulationStatusResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialisiere Cache
cache_manager = CacheManager(cache_type='memory')
data_cache = DataCache(cache_manager)

# Initialisiere Datenaggregator
data_aggregator = DataAggregator()

# Initialisiere Analysatoren
correlation_analyzer = CorrelationAnalyzer()

# Verwalte laufende Simulationen
running_simulations = {}

# Hilfsfunktion für asynchrone Simulationen
async def run_simulation_async(simulation_id: str, pricer: BasketOptionPricer, request: OptionPricingRequest):
    """Führe Simulation asynchron durch und aktualisiere den Fortschritt"""
    try:
        # Setze Daten für die Simulation
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        # Aktualisiere Status auf "laufend"
        running_simulations[simulation_id] = {
            "progress": 0.0,
            "status": "running",
            "message": "Simulation wird gestartet",
            "estimated_time_remaining": None
        }
        
        # Berechne Optionspreis mit Fortschritts-Callback
        def progress_callback(progress):
            running_simulations[simulation_id]["progress"] = progress
            running_simulations[simulation_id]["message"] = f"Simulation läuft: {progress:.1%} abgeschlossen"
        
        # Führe Simulation durch
        results = await asyncio.get_event_loop().run_in_executor(
            ThreadPoolExecutor(),
            lambda: pricer.price_option_with_progress(
                assets=request.assets,
                weights=request.weights,
                strike_price=request.strike_price,
                option_type=request.option_type.value,
                start_date=start_date,
                end_date=end_date,
                time_to_maturity=request.time_to_maturity,
                calculate_greeks=request.calculate_greeks,
                analyze_results=request.include_analysis,
                progress_callback=progress_callback
            )
        )
        
        # Aktualisiere Status auf "abgeschlossen"
        running_simulations[simulation_id] = {
            "progress": 1.0,
            "status": "completed",
            "message": "Simulation abgeschlossen",
            "estimated_time_remaining": 0,
            "results": results
        }
        
    except Exception as e:
        # Aktualisiere Status auf "fehlgeschlagen"
        running_simulations[simulation_id] = {
            "progress": 0.0,
            "status": "failed",
            "message": f"Fehler bei der Simulation: {str(e)}",
            "estimated_time_remaining": None
        }
        logger.error(f"Fehler bei der Simulation {simulation_id}: {str(e)}")

@router.get("/assets", response_model=List[AssetInfo])
async def get_available_assets():
    """
    Rufe verfügbare Assets ab
    """
    try:
        # Prüfe Cache
        cached_assets = cache_manager.get("available_assets")
        if cached_assets is not None:
            return cached_assets
        
        # Rufe verfügbare Assets von Börsen und Blockchains ab
        exchange_assets = data_aggregator.get_available_assets_from_exchanges()
        blockchain_assets = data_aggregator.get_available_assets_from_blockchains()
        
        # Kombiniere und dedupliziere
        all_assets = {}
        
        # Füge Börsen-Assets hinzu
        for exchange, assets in exchange_assets.items():
            for asset in assets:
                if asset not in all_assets:
                    all_assets[asset] = {
                        "symbol": asset,
                        "name": asset,  # In einer echten Implementierung würden wir hier den vollen Namen abrufen
                        "type": "Kryptowährung",
                        "exchanges": [exchange],
                        "blockchains": []
                    }
                else:
                    if exchange not in all_assets[asset]["exchanges"]:
                        all_assets[asset]["exchanges"].append(exchange)
        
        # Füge Blockchain-Assets hinzu
        for blockchain, assets in blockchain_assets.items():
            for asset in assets:
                if asset not in all_assets:
                    all_assets[asset] = {
                        "symbol": asset,
                        "name": asset,  # In einer echten Implementierung würden wir hier den vollen Namen abrufen
                        "type": "Kryptowährung",
                        "exchanges": [],
                        "blockchains": [blockchain]
                    }
                else:
                    if blockchain not in all_assets[asset]["blockchains"]:
                        all_assets[asset]["blockchains"].append(blockchain)
        
        # Konvertiere zu Liste
        assets_list = [AssetInfo(**asset_data) for asset_data in all_assets.values()]
        
        # Speichere im Cache
        cache_manager.set("available_assets", assets_list, ttl=3600)  # 1 Stunde
        
        return assets_list
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der verfügbaren Assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exchanges", response_model=List[ExchangeInfo])
async def get_available_exchanges():
    """
    Rufe verfügbare Börsen ab
    """
    try:
        # Prüfe Cache
        cached_exchanges = cache_manager.get("available_exchanges")
        if cached_exchanges is not None:
            return cached_exchanges
        
        # Rufe verfügbare Börsen ab
        exchanges = data_aggregator.get_available_exchanges()
        
        # Konvertiere zu ExchangeInfo-Objekten
        exchange_list = []
        for exchange in exchanges:
            exchange_info = ExchangeInfo(
                name=exchange["name"],
                api_url=exchange["api_url"],
                features=exchange["features"],
                rate_limits=exchange.get("rate_limits", {})
            )
            exchange_list.append(exchange_info)
        
        # Speichere im Cache
        cache_manager.set("available_exchanges", exchange_list, ttl=3600)  # 1 Stunde
        
        return exchange_list
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der verfügbaren Börsen: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blockchains", response_model=List[BlockchainInfo])
async def get_available_blockchains():
    """
    Rufe verfügbare Blockchains ab
    """
    try:
        # Prüfe Cache
        cached_blockchains = cache_manager.get("available_blockchains")
        if cached_blockchains is not None:
            return cached_blockchains
        
        # Rufe verfügbare Blockchains ab
        blockchains = data_aggregator.get_available_blockchains()
        
        # Konvertiere zu BlockchainInfo-Objekten
        blockchain_list = []
        for blockchain in blockchains:
            blockchain_info = BlockchainInfo(
                name=blockchain["name"],
                api_url=blockchain["api_url"],
                features=blockchain["features"],
                tokens=blockchain.get("tokens", [])
            )
            blockchain_list.append(blockchain_info)
        
        # Speichere im Cache
        cache_manager.set("available_blockchains", blockchain_list, ttl=3600)  # 1 Stunde
        
        return blockchain_list
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der verfügbaren Blockchains: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config", response_model=SystemConfig)
async def get_system_config():
    """
    Rufe Systemkonfiguration ab
    """
    try:
        # Prüfe Cache
        cached_config = cache_manager.get("system_config")
        if cached_config is not None:
            return cached_config
        
        # Erstelle Konfigurationsobjekt
        config = SystemConfig(
            default_num_simulations=100000,
            default_num_timesteps=252,
            default_risk_free_rate=0.03,
            exchange_priority=["binance", "coinbase", "kraken", "bitget"],
            supported_volatility_models=list(VolatilityModel),
            supported_stochastic_models=list(StochasticModel),
            max_assets_per_basket=10
        )
        
        # Speichere im Cache
        cache_manager.set("system_config", config, ttl=3600)  # 1 Stunde
        
        return config
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Systemkonfiguration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/asset_prices", response_model=AssetPriceResponse)
async def get_asset_prices(request: AssetPriceRequest):
    """
    Rufe historische Asset-Preise ab
    """
    try:
        # Prüfe Cache
        cache_key = f"asset_prices:{','.join(request.assets)}:{request.start_date.date()}:{request.end_date.date()}"
        cached_data = cache_manager.get(cache_key)
        
        if cached_data is not None:
            logger.info("Verwende gecachte Preisdaten")
            prices = cached_data
            sources = {asset: "cache" for asset in request.assets}
        else:
            # Rufe Daten ab
            prices, sources = data_aggregator.get_historical_prices_with_sources(
                assets=request.assets,
                start_date=request.start_date,
                end_date=request.end_date,
                exchanges=request.exchanges,
                blockchains=request.blockchains
            )
            
            # Speichere im Cache
            cache_manager.set(cache_key, prices, ttl=3600)  # 1 Stunde
        
        # Berechne Statistiken für jedes Asset
        statistics = {}
        for asset in request.assets:
            asset_prices = prices[asset]
            statistics[asset] = {
                "min": float(asset_prices.min()),
                "max": float(asset_prices.max()),
                "mean": float(asset_prices.mean()),
                "std": float(asset_prices.std()),
                "last": float(asset_prices.iloc[-1]),
                "change": float((asset_prices.iloc[-1] / asset_prices.iloc[0] - 1) * 100)
            }
        
        # Konvertiere zu Antwortformat
        prices_dict = {asset: prices[asset].tolist() for asset in request.assets}
        dates = [date.strftime('%Y-%m-%d') for date in prices.index]
        
        return AssetPriceResponse(
            assets=request.assets,
            prices=prices_dict,
            dates=dates,
            sources=sources,
            statistics=statistics
        )
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Asset-Preise: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/volatility", response_model=VolatilityResponse)
async def get_volatility(request: VolatilityRequest):
    """
    Berechne Volatilität für ein Asset
    """
    try:
        # Prüfe Cache
        cache_key = f"volatility:{request.asset}:{request.start_date.date()}:{request.end_date.date()}:{request.model.value}"
        cached_volatility = cache_manager.get(cache_key)
        
        if cached_volatility is not None:
            logger.info("Verwende gecachte Volatilität")
            volatility = cached_volatility
            parameters = None
            forecast = None
            forecast_dates = None
            confidence_intervals = None
        else:
            # Rufe Preisdaten ab
            prices, _ = data_aggregator.get_historical_prices_with_sources(
                assets=[request.asset],
                start_date=request.start_date,
                end_date=request.end_date
            )
            
            price_series = prices[request.asset]
            
            # Initialisiere Modell basierend auf Anfrage
            if request.model == VolatilityModel.HISTORICAL:
                model = HistoricalVolatility(window=request.window or 30)
                parameters = {"window": request.window or 30}
            elif request.model == VolatilityModel.EWMA:
                model = EWMAVolatility(halflife=request.halflife or 30)
                parameters = {"halflife": request.halflife or 30}
            elif request.model == VolatilityModel.GARCH:
                if request.garch_params:
                    model = GARCHVolatility(**request.garch_params)
                    parameters = request.garch_params
                else:
                    model = GARCHVolatility()
                    # Passe Modell an Daten an
                    returns = np.log(price_series / price_series.shift(1)).dropna()
                    parameters = model.fit(returns)
            
            # Berechne Volatilität
            volatility = model.estimate(price_series)
            
            # Erstelle Prognose
            forecaster = VolatilityForecaster(model)
            forecast_result = forecaster.forecast(price_series, horizon=30)
            forecast = forecast_result.tolist()
            forecast_dates = [
                (price_series.index[-1] + timedelta(days=i+1)).strftime('%Y-%m-%d')
                for i in range(30)
            ]
            
            # Berechne Konfidenzintervalle
            lower_bound, upper_bound = forecaster.forecast_interval(
                price_series, horizon=30, confidence=0.95
            )
            confidence_intervals = {
                "lower": lower_bound.tolist(),
                "upper": upper_bound.tolist()
            }
            
            # Speichere im Cache
            cache_manager.set(cache_key, volatility, ttl=3600)  # 1 Stunde
        
        return VolatilityResponse(
            asset=request.asset,
            volatility=volatility,
            model=request.model,
            parameters=parameters,
            forecast=forecast,
            forecast_dates=forecast_dates,
            confidence_intervals=confidence_intervals
        )
        
    except Exception as e:
        logger.error(f"Fehler bei der Berechnung der Volatilität: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/correlation", response_model=CorrelationResponse)
async def get_correlation(request: CorrelationRequest):
    """
    Berechne Korrelation zwischen Assets
    """
    try:
        # Prüfe Cache
        cache_key = f"correlation:{','.join(request.assets)}:{request.start_date.date()}:{request.end_date.date()}:{request.method.value}"
        cached_correlation = cache_manager.get(cache_key)
        
        if cached_correlation is not None and not request.dynamic and not request.window:
            logger.info("Verwende gecachte Korrelationsmatrix")
            correlation_matrix = cached_correlation
            rolling_correlations = None
            rolling_dates = None
            dynamic_correlations = None
            dynamic_dates = None
            average_correlation = None
        else:
            # Rufe Preisdaten ab
            prices, _ = data_aggregator.get_historical_prices_with_sources(
                assets=request.assets,
                start_date=request.start_date,
                end_date=request.end_date
            )
            
            # Berechne Korrelationsmatrix
            correlation_matrix = correlation_analyzer.calculate_correlation_matrix(
                prices, method=request.method.value
            )
            
            # Berechne durchschnittliche Korrelation
            average_correlation = correlation_analyzer.calculate_average_correlation(correlation_matrix)
            
            # Berechne rollende Korrelationen, wenn angefordert
            rolling_correlations = None
            rolling_dates = None
            if request.window:
                rolling_corr = correlation_analyzer.calculate_rolling_correlation(
                    prices, window=request.window
                )
                
                # Konvertiere zu Antwortformat
                rolling_correlations = {
                    f"{pair[0]}-{pair[1]}": corr_series.tolist()
                    for pair, corr_series in rolling_corr.items()
                }
                rolling_dates = [
                    date.strftime('%Y-%m-%d')
                    for date in list(rolling_corr.values())[0].index
                ]
            
            # Berechne dynamische Korrelationen, wenn angefordert
            dynamic_correlations = None
            dynamic_dates = None
            if request.dynamic:
                dynamic_corr = correlation_analyzer.calculate_dynamic_correlation(
                    prices, method='ewma', halflife=30
                )
                
                # Konvertiere zu Antwortformat
                dynamic_correlations = {
                    date.strftime('%Y-%m-%d'): corr_matrix.values.tolist()
                    for date, corr_matrix in dynamic_corr.items()
                }
                dynamic_dates = [
                    date.strftime('%Y-%m-%d')
                    for date in dynamic_corr.keys()
                ]
            
            # Speichere im Cache (nur statische Korrelation)
            if not request.dynamic and not request.window:
                cache_manager.set(cache_key, correlation_matrix, ttl=3600)  # 1 Stunde
        
        # Konvertiere zu Antwortformat
        correlation_matrix_list = correlation_matrix.values.tolist()
        
        return CorrelationResponse(
            assets=request.assets,
            correlation_matrix=correlation_matrix_list,
            method=request.method,
            rolling_correlations=rolling_correlations,
            rolling_dates=rolling_dates,
            dynamic_correlations=dynamic_correlations,
            dynamic_dates=dynamic_dates,
            average_correlation=average_correlation
        )
        
    except Exception as e:
        logger.error(f"Fehler bei der Berechnung der Korrelation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/price_option/start", response_model=Dict[str, str])
async def start_option_pricing(background_tasks: BackgroundTasks, request: OptionPricingRequest):
    """
    Starte asynchrone Optionspreisberechnung
    """
    try:
        # Erzeuge eindeutige ID für die Simulation
        simulation_id = str(uuid.uuid4())
        
        # Initialisiere Optionspreiser
        pricer = BasketOptionPricer(data_aggregator=data_aggregator)
        
        # Starte Simulation im Hintergrund
        background_tasks.add_task(run_simulation_async, simulation_id, pricer, request)
        
        # Gib Simulation-ID zurück
        return {"simulation_id": simulation_id}
        
    except Exception as e:
        logger.error(f"Fehler beim Starten der Optionspreisberechnung: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/price_option/status/{simulation_id}", response_model=SimulationProgress)
async def get_option_pricing_status(simulation_id: str):
    """
    Rufe Status der Optionspreisberechnung ab
    """
    try:
        # Prüfe, ob Simulation existiert
        if simulation_id not in running_simulations:
            raise HTTPException(status_code=404, detail="Simulation nicht gefunden")
        
        # Gib Status zurück
        simulation_data = running_simulations[simulation_id]
        return SimulationProgress(
            simulation_id=simulation_id,
            progress=simulation_data["progress"],
            status=simulation_data["status"],
            message=simulation_data["message"],
            estimated_time_remaining=simulation_data.get("estimated_time_remaining")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fehler beim Abrufen des Simulationsstatus: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/price_option/result/{simulation_id}", response_model=OptionPricingResponse)
async def get_option_pricing_result(simulation_id: str):
    """
    Rufe Ergebnis der Optionspreisberechnung ab
    """
    try:
        # Prüfe, ob Simulation existiert
        if simulation_id not in running_simulations:
            raise HTTPException(status_code=404, detail="Simulation nicht gefunden")
        
        # Prüfe, ob Simulation abgeschlossen ist
        simulation_data = running_simulations[simulation_id]
        if simulation_data["status"] != "completed":
            raise HTTPException(status_code=400, detail="Simulation noch nicht abgeschlossen")
        
        # Gib Ergebnis zurück
        results = simulation_data["results"]
        
        # Konvertiere zu Antwortformat
        response = OptionPricingResponse(
            option_price=results['option_price'],
            assets=results['assets'],
            weights=results['weights'],
            strike_price=results['strike_price'],
            option_type=results['option_type'],
            time_to_maturity=results['time_to_maturity'],
            risk_free_rate=results['risk_free_rate'],
            num_simulations=results['num_simulations'],
            stochastic_model=results['stochastic_model'],
            initial_prices=results['initial_prices'].tolist(),
            drift=results['drift'].tolist(),
            volatility=results['volatility'].tolist(),
            correlation_matrix=results['correlation_matrix'].values.tolist(),
            greeks=results.get('greeks'),
            analysis=results.get('analysis'),
            convergence_data=results.get('convergence_data')
        )
        
        # Entferne Simulation aus der Liste
        del running_simulations[simulation_id]
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fehler beim Abrufen des Simulationsergebnisses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/price_option", response_model=OptionPricingResponse)
async def price_option(request: OptionPricingRequest):
    """
    Berechne Preis einer Basket-Option (synchron)
    """
    try:
        # Initialisiere Optionspreiser
        pricer = BasketOptionPricer(data_aggregator=data_aggregator)
        
        # Setze Daten für die Simulation
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        # Berechne Optionspreis
        results = pricer.price_option(
            assets=request.assets,
            weights=request.weights,
            strike_price=request.strike_price,
            option_type=request.option_type.value,
            start_date=start_date,
            end_date=end_date,
            time_to_maturity=request.time_to_maturity,
            calculate_greeks=request.calculate_greeks,
            analyze_results=request.include_analysis
        )
        
        # Konvertiere zu Antwortformat
        response = OptionPricingResponse(
            option_price=results['option_price'],
            assets=request.assets,
            weights=request.weights,
            strike_price=request.strike_price,
            option_type=request.option_type,
            time_to_maturity=request.time_to_maturity,
            risk_free_rate=request.risk_free_rate,
            num_simulations=request.num_simulations,
            stochastic_model=request.stochastic_model,
            initial_prices=results['initial_prices'].tolist(),
            drift=results['drift'].tolist(),
            volatility=results['volatility'].tolist(),
            correlation_matrix=results['correlation_matrix'].values.tolist(),
            greeks=results.get('greeks'),
            analysis=results.get('analysis'),
            convergence_data=results.get('convergence_data')
        )
        
        return response
        
    except (PricingError, DataError) as e:
        logger.error(f"Fehler bei der Optionspreisberechnung: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unerwarteter Fehler bei der Optionspreisberechnung: {str(e)}")
        raise HTTPException(status_code=500, detail="Interner Serverfehler")

@router.post("/implied_volatility", response_model=ImpliedVolatilityResponse)
async def calculate_implied_volatility(request: ImpliedVolatilityRequest):
    """
    Berechne implizite Volatilität einer Option
    """
    try:
        # Initialisiere Optionspreiser
        pricer = BasketOptionPricer(data_aggregator=data_aggregator)
        
        # Setze Daten für die Berechnung
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        # Berechne implizite Volatilität
        result = pricer.calculate_implied_volatility_with_history(
            assets=request.assets,
            weights=request.weights,
            strike_price=request.strike_price,
            option_price=request.option_price,
            option_type=request.option_type.value,
            start_date=start_date,
            end_date=end_date,
            time_to_maturity=request.time_to_maturity,
            max_iterations=request.max_iterations,
            tolerance=request.tolerance
        )
        
        return ImpliedVolatilityResponse(
            implied_volatility=result['implied_volatility'],
            assets=request.assets,
            weights=request.weights,
            strike_price=request.strike_price,
            option_price=request.option_price,
            option_type=request.option_type,
            time_to_maturity=request.time_to_maturity,
            risk_free_rate=request.risk_free_rate,
            iterations=result['iterations'],
            converged=result['converged'],
            convergence_history=result.get('convergence_history')
        )
        
    except (PricingError, DataError) as e:
        logger.error(f"Fehler bei der Berechnung der impliziten Volatilität: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unerwarteter Fehler bei der Berechnung der impliziten Volatilität: {str(e)}")
        raise HTTPException(status_code=500, detail="Interner Serverfehler")

@router.post("/risk_metrics", response_model=RiskMetricsResponse)
async def calculate_risk_metrics(request: RiskMetricsRequest):
    """
    Berechne Risikokennzahlen für ein Portfolio
    """
    try:
        # Rufe Preisdaten ab
        prices, _ = data_aggregator.get_historical_prices_with_sources(
            assets=request.assets,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        # Berechne Renditen
        returns = np.log(prices / prices.shift(1)).dropna()
        
        # Berechne Risikokennzahlen
        var = RiskMetrics.calculate_var(
            returns.dot(request.weights),
            confidence_level=request.confidence_level,
            holding_period=request.holding_period
        )
        
        expected_shortfall = RiskMetrics.calculate_expected_shortfall(
            returns.dot(request.weights),
            confidence_level=request.confidence_level
        )
        
        # Berechne annualisierte Rendite und Volatilität
        annualized_returns = returns.mean() * 252
        annualized_volatility = returns.std() * np.sqrt(252)
        
        # Berechne Sharpe Ratio
        sharpe_ratio = RiskMetrics.calculate_sharpe_ratio(
            returns.dot(request.weights),
            request.risk_free_rate
        )
        
        # Berechne Sortino Ratio
        sortino_ratio = RiskMetrics.calculate_sortino_ratio(
            returns.dot(request.weights),
            request.risk_free_rate
        )
        
        # Berechne maximalen Drawdown
        cumulative_returns = np.cumprod(1 + returns.dot(request.weights))
        max_drawdown, _, _ = RiskMetrics.calculate_max_drawdown(cumulative_returns)
        
        # Berechne Calmar Ratio
        calmar_ratio = RiskMetrics.calculate_calmar_ratio(returns.dot(request.weights))
        
        # Berechne Beta (wenn möglich)
        beta = None
        if request.benchmark and request.benchmark in request.assets:
            benchmark_returns = returns[request.benchmark]
            portfolio_returns = returns.dot(request.weights)
            beta = RiskMetrics.calculate_beta(portfolio_returns, benchmark_returns)
        
        # Berechne Information Ratio (wenn möglich)
        information_ratio = None
        if len(request.assets) > 1:
            # Verwende gleichgewichteten Portfolio als Benchmark
            benchmark_weights = np.ones(len(request.assets)) / len(request.assets)
            benchmark_returns = returns.dot(benchmark_weights)
            portfolio_returns = returns.dot(request.weights)
            information_ratio = RiskMetrics.calculate_information_ratio(portfolio_returns, benchmark_returns)
        
        # Berechne Risikobeitrag
        risk_contribution = RiskMetrics.calculate_risk_contribution(
            returns,
            np.array(request.weights),
            confidence_level=request.confidence_level
        )
        
        # Führe Stresstests durch
        stress_test_results = None
        if request.stress_test_scenarios:
            # Berechne aktuellen Portfolio-Wert
            current_prices = prices.iloc[-1].values
            portfolio_value = np.sum(current_prices * request.weights)
            
            # Führe Stresstests für jedes Szenario durch
            stress_test_results = {}
            for scenario, shock in request.stress_test_scenarios.items():
                # Wende Schock an
                shocked_prices = current_prices * (1 + shock)
                shocked_portfolio_value = np.sum(shocked_prices * request.weights)
                
                # Berechne prozentuale Veränderung
                percent_change = (shocked_portfolio_value - portfolio_value) / portfolio_value
                
                stress_test_results[scenario] = {
                    "shock": shock,
                    "percent_change": percent_change,
                    "shocked_value": shocked_portfolio_value
                }
        
        return RiskMetricsResponse(
            assets=request.assets,
            weights=request.weights,
            var=var,
            expected_shortfall=expected_shortfall,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            max_drawdown=max_drawdown,
            calmar_ratio=calmar_ratio,
            beta=beta,
            information_ratio=information_ratio,
            risk_contribution=risk_contribution.tolist(),
            stress_test_results=stress_test_results
        )
        
    except Exception as e:
        logger.error(f"Fehler bei der Berechnung der Risikokennzahlen: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/simulations", response_model=SimulationStatusResponse)
async def get_all_simulations():
    """
    Rufe Status aller laufenden Simulationen ab
    """
    try:
        # Konvertiere zu SimulationProgress-Objekten
        simulations = []
        for simulation_id, simulation_data in running_simulations.items():
            simulation = SimulationProgress(
                simulation_id=simulation_id,
                progress=simulation_data["progress"],
                status=simulation_data["status"],
                message=simulation_data["message"],
                estimated_time_remaining=simulation_data.get("estimated_time_remaining")
            )
            simulations.append(simulation)
        
        return SimulationStatusResponse(simulations=simulations)
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Simulationsstatus: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
