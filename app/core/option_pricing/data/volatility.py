import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class VolatilityModel:
    """Abstrakte Basisklasse für Volatilitätsmodelle"""
    
    def __init__(self):
        pass
    
    def estimate(self, data: pd.Series) -> float:
        """Schätze Volatilität aus Daten"""
        raise NotImplementedError

class HistoricalVolatility(VolatilityModel):
    """Historische Volatilität"""
    
    def __init__(self, window: int = 30, trading_days: int = 365):
        """
        Initialisiere historisches Volatilitätsmodell
        
        Args:
            window: Fenstergröße für die Berechnung
            trading_days: Anzahl der Handelstage pro Jahr
        """
        self.window = window
        self.trading_days = trading_days
        
    def estimate(self, data: pd.Series) -> float:
        """
        Schätze historische Volatilität
        
        Args:
            data: Zeitreihe der Preise oder Renditen
            
        Returns:
            Annualisierte Volatilität
        """
        # Berechne logarithmische Renditen, wenn Preisdaten gegeben sind
        if not np.all(np.diff(data) > 0):
            returns = np.log(data / data.shift(1)).dropna()
        else:
            returns = data
            
        # Berechne rolling Standardabweichung
        rolling_std = returns.rolling(window=self.window).std()
        
        # Annualisiere die Volatilität
        volatility = rolling_std.iloc[-1] * np.sqrt(self.trading_days)
        
        return volatility

class EWMAVolatility(VolatilityModel):
    """Exponentiell gewichtete gleitende Durchschnitts-Volatilität"""
    
    def __init__(self, halflife: int = 30, trading_days: int = 365):
        """
        Initialisiere EWMA-Volatilitätsmodell
        
        Args:
            halflife: Halbwertszeit für exponentielle Gewichtung
            trading_days: Anzahl der Handelstage pro Jahr
        """
        self.halflife = halflife
        self.trading_days = trading_days
        
    def estimate(self, data: pd.Series) -> float:
        """
        Schätze EWMA-Volatilität
        
        Args:
            data: Zeitreihe der Preise oder Renditen
            
        Returns:
            Annualisierte Volatilität
        """
        # Berechne logarithmische Renditen, wenn Preisdaten gegeben sind
        if not np.all(np.diff(data) > 0):
            returns = np.log(data / data.shift(1)).dropna()
        else:
            returns = data
            
        # Berechne EWMA-Varianz
        ewm_var = returns.ewm(halflife=self.halflife).var()
        
        # Berechne Volatilität und annualisiere
        volatility = np.sqrt(ewm_var.iloc[-1] * self.trading_days)
        
        return volatility

class GARCHVolatility(VolatilityModel):
    """GARCH(1,1)-Volatilitätsmodell"""
    
    def __init__(self, 
                 omega: float = 0.1, 
                 alpha: float = 0.1, 
                 beta: float = 0.85,
                 trading_days: int = 365):
        """
        Initialisiere GARCH-Volatilitätsmodell
        
        Args:
            omega: Konstante Term
            alpha: Koeffizient für quadrierte Renditen
            beta: Koeffizient für verzögerte Volatilität
            trading_days: Anzahl der Handelstage pro Jahr
        """
        self.omega = omega
        self.alpha = alpha
        self.beta = beta
        self.trading_days = trading_days
        
        # Stelle sicher, dass die Parameter Stationarität gewährleisten
        if alpha + beta >= 1:
            logger.warning("GARCH-Parameter nicht stationär, setze beta = 0.9 - alpha")
            self.beta = 0.9 - alpha
    
    def estimate(self, data: pd.Series) -> float:
        """
        Schätze GARCH-Volatilität
        
        Args:
            data: Zeitreihe der Preise oder Renditen
            
        Returns:
            Annualisierte Volatilität
        """
        # Berechne logarithmische Renditen, wenn Preisdaten gegeben sind
        if not np.all(np.diff(data) > 0):
            returns = np.log(data / data.shift(1)).dropna()
        else:
            returns = data
            
        # Initialisiere Volatilität mit historischer Volatilität
        long_run_var = self.omega / (1 - self.alpha - self.beta)
        variances = np.zeros(len(returns))
        variances[0] = long_run_var
        
        # Iteriere durch die Renditen und aktualisiere die Volatilität
        for i in range(1, len(returns)):
            variances[i] = self.omega + self.alpha * returns[i-1]**2 + self.beta * variances[i-1]
        
        # Berechne Volatilität und annualisiere
        volatility = np.sqrt(variances[-1] * self.trading_days)
        
        return volatility
    
    def fit(self, returns: pd.Series) -> Dict[str, float]:
        """
        Passe GARCH-Parameter an die Daten an
        
        Args:
            returns: Zeitreihe der Renditen
            
        Returns:
            Dictionary mit angepassten Parametern
        """
        from scipy.optimize import minimize
        
        # Definiere Log-Likelihood-Funktion
        def log_likelihood(params):
            omega, alpha, beta = params
            
            # Stelle sicher, dass die Parameter gültig sind
            if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
                return 1e10
                
            # Initialisiere Varianzen
            n = len(returns)
            variances = np.zeros(n)
            long_run_var = omega / (1 - alpha - beta)
            variances[0] = long_run_var
            
            # Berechne Varianzen
            for i in range(1, n):
                variances[i] = omega + alpha * returns[i-1]**2 + beta * variances[i-1]
            
            # Berechne Log-Likelihood
            log_likelihood = -0.5 * np.sum(np.log(variances) + returns**2 / variances)
            
            return -log_likelihood  # Minimiere negative Log-Likelihood
        
        # Initialisiere Parameter
        initial_params = [0.1, 0.1, 0.85]
        
        # Definiere Grenzen
        bounds = [(1e-6, None), (1e-6, 0.9), (1e-6, 0.9)]
        
        # Optimiere
        result = minimize(log_likelihood, initial_params, bounds=bounds)
        
        if result.success:
            omega, alpha, beta = result.x
            self.omega = omega
            self.alpha = alpha
            self.beta = beta
            
            return {
                'omega': omega,
                'alpha': alpha,
                'beta': beta,
                'persistence': alpha + beta,
                'long_run_variance': omega / (1 - alpha - beta)
            }
        else:
            logger.warning(f"Anpassung fehlgeschlagen: {result.message}")
            return {
                'omega': self.omega,
                'alpha': self.alpha,
                'beta': self.beta,
                'persistence': self.alpha + self.beta,
                'long_run_variance': self.omega / (1 - self.alpha - self.beta)
            }

class VolatilityForecaster:
    """Klasse zur Vorhersage von Volatilität"""
    
    def __init__(self, model: VolatilityModel):
        """
        Initialisiere Volatilitätsprognose
        
        Args:
            model: Volatilitätsmodell
        """
        self.model = model
        
    def forecast(self, 
                data: pd.Series, 
                horizon: int = 30) -> pd.Series:
        """
        Prognostiziere Volatilität für einen gegebenen Horizont
        
        Args:
            data: Historische Daten
            horizon: Prognosehorizont in Tagen
            
        Returns:
            Prognose der Volatilität
        """
        # Berechne aktuelle Volatilität
        current_vol = self.model.estimate(data)
        
        # Erzeuge Prognosezeitreihe
        forecast_index = pd.date_range(
            start=data.index[-1] + pd.Timedelta(days=1),
            periods=horizon,
            freq='D'
        )
        
        # Für einfache Modelle (Historisch, EWMA) nehmen wir eine konstante Prognose an
        if isinstance(self.model, (HistoricalVolatility, EWMAVolatility)):
            forecast = pd.Series(current_vol, index=forecast_index)
        
        # Für GARCH können wir eine spezifischere Prognose erstellen
        elif isinstance(self.model, GARCHVolatility):
            # Berechne langfristige Varianz
            long_run_var = self.model.omega / (1 - self.model.alpha - self.model.beta)
            
            # Berechne aktuelle Varianz
            current_var = current_vol**2 / self.model.trading_days
            
            # Prognostiziere Varianz für den Horizont
            forecast_var = np.zeros(horizon)
            forecast_var[0] = self.model.omega + self.model.alpha * 0 + self.model.beta * current_var
            
            for i in range(1, horizon):
                forecast_var[i] = self.model.omega + self.model.alpha * 0 + self.model.beta * forecast_var[i-1]
            
            # Konvertiere zu Volatilität und annualisiere
            forecast_vol = np.sqrt(forecast_var * self.model.trading_days)
            forecast = pd.Series(forecast_vol, index=forecast_index)
        
        return forecast
    
    def forecast_interval(self, 
                         data: pd.Series, 
                         horizon: int = 30,
                         confidence: float = 0.95) -> Tuple[pd.Series, pd.Series]:
        """
        Prognostiziere Konfidenzintervall für Volatilität
        
        Args:
            data: Historische Daten
            horizon: Prognosehorizont in Tagen
            confidence: Konfidenzniveau
            
        Returns:
            Tuple mit (untere Grenze, obere Grenze)
        """
        # Prognostiziere zentrale Volatilität
        central_forecast = self.forecast(data, horizon)
        
        # Berechne Standardfehler basierend auf Modelltyp
        if isinstance(self.model, (HistoricalVolatility, EWMAVolatility)):
            # Für einfache Modelle nehmen wir einen konstanten Fehler an
            std_error = central_forecast * 0.2  # 20% Fehler
            
        elif isinstance(self.model, GARCHVolatility):
            # Für GARCH können wir eine spezifischere Fehlerberechnung durchführen
            # Hier vereinfacht als wachsend mit dem Horizont
            std_error = central_forecast * np.sqrt(np.arange(1, horizon + 1) * 0.01)
        
        # Berechne Quantile basierend auf Konfidenzniveau
        from scipy.stats import norm
        z_score = norm.ppf((1 + confidence) / 2)
        
        lower_bound = central_forecast - z_score * std_error
        upper_bound = central_forecast + z_score * std_error
        
        # Stelle sicher, dass die Grenzen positiv sind
        lower_bound = np.maximum(lower_bound, 0.01)
        
        return lower_bound, upper_bound

class VolatilityAnalyzer:
    """Klasse zur Analyse von Volatilitätsmustern"""
    
    def __init__(self, 
                 volatility_model: VolatilityModel,
                 window: int = 30):
        """
        Initialisiere Volatilitätsanalysator
        
        Args:
            volatility_model: Volatilitätsmodell
            window: Fenstergröße für die Analyse
        """
        self.volatility_model = volatility_model
        self.window = window
        
    def detect_volatility_clustering(self, 
                                    data: pd.Series,
                                    threshold: float = 1.5) -> pd.Series:
        """
        Erkenne Volatilitätsclustering
        
        Args:
            data: Zeitreihe der Preise oder Renditen
            threshold: Schwellenwert für die Identifikation von Clustern
            
        Returns:
            Binäre Serie, die Volatilitätscluster markiert
        """
        # Berechne rolling Volatilität
        if not np.all(np.diff(data) > 0):
            returns = np.log(data / data.shift(1)).dropna()
        else:
            returns = data
            
        rolling_vol = returns.rolling(window=self.window).std()
        
        # Berechne median Volatilität
        median_vol = rolling_vol.median()
        
        # Identifiziere Perioden mit hoher Volatilität
        high_vol = rolling_vol > threshold * median_vol
        
        return high_vol
    
    def calculate_volatility_regime(self, 
                                   data: pd.Series,
                                   low_threshold: float = 0.8,
                                   high_threshold: float = 1.2) -> pd.Series:
        """
        Klassifiziere Volatilitätsregime (niedrig, normal, hoch)
        
        Args:
            data: Zeitreihe der Preise oder Renditen
            low_threshold: Schwellenwert für niedrige Volatilität
            high_threshold: Schwellenwert für hohe Volatilität
            
        Returns:
            Serie mit Volatilitätsregime
        """
        # Berechne rolling Volatilität
        if not np.all(np.diff(data) > 0):
            returns = np.log(data / data.shift(1)).dropna()
        else:
            returns = data
            
        rolling_vol = returns.rolling(window=self.window).std()
        
        # Berechne median Volatilität
        median_vol = rolling_vol.median()
        
        # Klassifiziere Regime
        regime = pd.Series('normal', index=rolling_vol.index)
        regime.loc[rolling_vol < low_threshold * median_vol] = 'low'
        regime.loc[rolling_vol > high_threshold * median_vol] = 'high'
        
        return regime
    
    def calculate_leverage_effect(self, 
                                 price_data: pd.Series,
                                 window: int = 30) -> pd.Series:
        """
        Berechne Hebelwirkungseffekt (negative Korrelation zwischen Renditen und Volatilität)
        
        Args:
            price_data: Zeitreihe der Preise
            window: Fenstergröße für die Berechnung
            
        Returns:
            Rolling Korrelation zwischen Renditen und Volatilität
        """
        # Berechne Renditen und Volatilität
        returns = np.log(price_data / price_data.shift(1)).dropna()
        volatility = returns.rolling(window=window).std()
        
        # Berechne rolling Korrelation
        leverage_effect = returns.rolling(window=window).corr(volatility)
        
        return leverage_effect
