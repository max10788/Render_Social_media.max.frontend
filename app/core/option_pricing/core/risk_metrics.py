import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union
from scipy.stats import norm, chi2
import logging

logger = logging.getLogger(__name__)

class RiskMetrics:
    """Klasse zur Berechnung von Risikokennzahlen"""
    
    @staticmethod
    def calculate_var(returns: Union[pd.Series, np.ndarray], 
                     confidence_level: float = 0.95,
                     holding_period: int = 1) -> float:
        """
        Berechne Value at Risk (VaR)
        
        Args:
            returns: Renditedaten
            confidence_level: Konfidenzniveau (Standard: 95%)
            holding_period: Haltedauer in Tagen
            
        Returns:
            Value at Risk
        """
        if isinstance(returns, pd.Series):
            returns = returns.values
            
        # Berechne Quantil
        var = -np.percentile(returns, (1 - confidence_level) * 100)
        
        # Skaliere für Haltedauer (Wurzel-t-Regel)
        var *= np.sqrt(holding_period)
        
        return var
    
    @staticmethod
    def calculate_expected_shortfall(returns: Union[pd.Series, np.ndarray], 
                                   confidence_level: float = 0.95) -> float:
        """
        Berechne Expected Shortfall (ES) / Conditional VaR
        
        Args:
            returns: Renditedaten
            confidence_level: Konfidenzniveau (Standard: 95%)
            
        Returns:
            Expected Shortfall
        """
        if isinstance(returns, pd.Series):
            returns = returns.values
            
        # Berechne Schwellenwert für VaR
        var_threshold = np.percentile(returns, (1 - confidence_level) * 100)
        
        # Berechne durchschnittlichen Verlust jenseits des VaR
        tail_losses = returns[returns < var_threshold]
        es = -np.mean(tail_losses)
        
        return es
    
    @staticmethod
    def calculate_beta(asset_returns: Union[pd.Series, np.ndarray],
                      market_returns: Union[pd.Series, np.ndarray]) -> float:
        """
        Berechne Beta eines Assets relativ zum Markt
        
        Args:
            asset_returns: Renditen des Assets
            market_returns: Renditen des Marktes
            
        Returns:
            Beta-Koeffizient
        """
        if isinstance(asset_returns, pd.Series):
            asset_returns = asset_returns.values
        if isinstance(market_returns, pd.Series):
            market_returns = market_returns.values
            
        # Berechne Kovarianz und Varianz
        covariance = np.cov(asset_returns, market_returns)[0, 1]
        market_variance = np.var(market_returns)
        
        # Berechne Beta
        beta = covariance / market_variance
        
        return beta
    
    @staticmethod
    def calculate_sharpe_ratio(returns: Union[pd.Series, np.ndarray],
                             risk_free_rate: float,
                             periods_per_year: int = 252) -> float:
        """
        Berechne Sharpe Ratio
        
        Args:
            returns: Renditedaten
            risk_free_rate: Risikofreier Zinssatz (annualisiert)
            periods_per_year: Anzahl der Perioden pro Jahr
            
        Returns:
            Sharpe Ratio
        """
        if isinstance(returns, pd.Series):
            returns = returns.values
            
        # Berechne durchschnittliche Rendite und Volatilität
        mean_return = np.mean(returns) * periods_per_year
        volatility = np.std(returns) * np.sqrt(periods_per_year)
        
        # Berechne Sharpe Ratio
        sharpe_ratio = (mean_return - risk_free_rate) / volatility
        
        return sharpe_ratio
    
    @staticmethod
    def calculate_sortino_ratio(returns: Union[pd.Series, np.ndarray],
                               risk_free_rate: float,
                               target_return: float = 0,
                               periods_per_year: int = 252) -> float:
        """
        Berechne Sortino Ratio
        
        Args:
            returns: Renditedaten
            risk_free_rate: Risikofreier Zinssatz (annualisiert)
            target_return: Zielrendite (Standard: 0)
            periods_per_year: Anzahl der Perioden pro Jahr
            
        Returns:
            Sortino Ratio
        """
        if isinstance(returns, pd.Series):
            returns = returns.values
            
        # Berechne durchschnittliche Rendite
        mean_return = np.mean(returns) * periods_per_year
        
        # Berechne Downside-Risiko
        downside_returns = returns[returns < target_return]
        downside_deviation = np.std(downside_returns) * np.sqrt(periods_per_year)
        
        # Berechne Sortino Ratio
        sortino_ratio = (mean_return - risk_free_rate) / downside_deviation
        
        return sortino_ratio
    
    @staticmethod
    def calculate_max_drawdown(prices: Union[pd.Series, np.ndarray]) -> Tuple[float, int, int]:
        """
        Berechne maximalen Drawdown
        
        Args:
            prices: Preisdaten
            
        Returns:
            Tuple mit (max_drawdown, start_index, end_index)
        """
        if isinstance(prices, pd.Series):
            prices = prices.values
            
        # Berechne kumulative maximale Preise
        cumulative_max = np.maximum.accumulate(prices)
        
        # Berechne Drawdown
        drawdown = (prices - cumulative_max) / cumulative_max
        
        # Finde maximalen Drawdown
        max_drawdown = np.min(drawdown)
        end_index = np.argmin(drawdown)
        
        # Finde Startpunkt des maximalen Drawdown
        start_index = np.argmax(prices[:end_index] == cumulative_max[:end_index])
        
        return max_drawdown, start_index, end_index
    
    @staticmethod
    def calculate_calmar_ratio(returns: Union[pd.Series, np.ndarray],
                             periods_per_year: int = 252) -> float:
        """
        Berechne Calmar Ratio
        
        Args:
            returns: Renditedaten
            periods_per_year: Anzahl der Perioden pro Jahr
            
        Returns:
            Calmar Ratio
        """
        if isinstance(returns, pd.Series):
            returns = returns.values
            
        # Berechne kumulative Rendite
        cumulative_returns = np.cumprod(1 + returns)
        
        # Berechne annualisierte Rendite
        years = len(returns) / periods_per_year
        annualized_return = cumulative_returns[-1] ** (1 / years) - 1
        
        # Berechne maximalen Drawdown
        max_drawdown, _, _ = RiskMetrics.calculate_max_drawdown(cumulative_returns)
        
        # Berechne Calmar Ratio
        calmar_ratio = annualized_return / abs(max_drawdown)
        
        return calmar_ratio
    
    @staticmethod
    def calculate_information_ratio(asset_returns: Union[pd.Series, np.ndarray],
                                   benchmark_returns: Union[pd.Series, np.ndarray]) -> float:
        """
        Berechne Information Ratio
        
        Args:
            asset_returns: Renditen des Assets
            benchmark_returns: Renditen des Benchmarks
            
        Returns:
            Information Ratio
        """
        if isinstance(asset_returns, pd.Series):
            asset_returns = asset_returns.values
        if isinstance(benchmark_returns, pd.Series):
            benchmark_returns = benchmark_returns.values
            
        # Berechne aktive Renditen
        active_returns = asset_returns - benchmark_returns
        
        # Berechne Tracking Error
        tracking_error = np.std(active_returns)
        
        # Berechne Information Ratio
        if tracking_error > 0:
            information_ratio = np.mean(active_returns) / tracking_error
        else:
            information_ratio = 0
            
        return information_ratio
    
    @staticmethod
    def calculate_portfolio_var(returns: pd.DataFrame,
                              weights: np.ndarray,
                              confidence_level: float = 0.95) -> float:
        """
        Berechne Portfolio Value at Risk
        
        Args:
            returns: DataFrame mit Renditen der Assets
            weights: Portfolio-Gewichte
            confidence_level: Konfidenzniveau
            
        Returns:
            Portfolio VaR
        """
        # Berechne Portfolio-Renditen
        portfolio_returns = returns.dot(weights)
        
        # Berechne VaR
        portfolio_var = RiskMetrics.calculate_var(portfolio_returns, confidence_level)
        
        return portfolio_var
    
    @staticmethod
    def calculate_portfolio_es(returns: pd.DataFrame,
                            weights: np.ndarray,
                            confidence_level: float = 0.95) -> float:
        """
        Berechne Portfolio Expected Shortfall
        
        Args:
            returns: DataFrame mit Renditen der Assets
            weights: Portfolio-Gewichte
            confidence_level: Konfidenzniveau
            
        Returns:
            Portfolio ES
        """
        # Berechne Portfolio-Renditen
        portfolio_returns = returns.dot(weights)
        
        # Berechne ES
        portfolio_es = RiskMetrics.calculate_expected_shortfall(portfolio_returns, confidence_level)
        
        return portfolio_es
    
    @staticmethod
    def calculate_risk_contribution(returns: pd.DataFrame,
                                  weights: np.ndarray,
                                  confidence_level: float = 0.95) -> np.ndarray:
        """
        Berechne Risikobeitrag jedes Assets zum Portfolio
        
        Args:
            returns: DataFrame mit Renditen der Assets
            weights: Portfolio-Gewichte
            confidence_level: Konfidenzniveau
            
        Returns:
            Array mit Risikobeiträgen
        """
        # Berechne Kovarianzmatrix
        cov_matrix = returns.cov().values
        
        # Berechne Portfolio-Volatilität
        portfolio_vol = np.sqrt(weights.T @ cov_matrix @ weights)
        
        # Berechne Marginal VaR
        marginal_var = cov_matrix @ weights / portfolio_vol
        
        # Berechne Risikobeitrag
        risk_contribution = weights * marginal_var
        
        # Berechne prozentualen Risikobeitrag
        percent_contribution = risk_contribution / portfolio_vol
        
        return percent_contribution
    
    @staticmethod
    def calculate_stress_test_scenarios(base_prices: np.ndarray,
                                      shocks: Dict[str, float]) -> Dict[str, float]:
        """
        Führe Stresstests durch
        
        Args:
            base_prices: Basispreise der Assets
            shocks: Dictionary mit Schocks für jedes Szenario
            
        Returns:
            Dictionary mit Ergebnissen für jedes Szenario
        """
        results = {}
        
        for scenario, shock in shocks.items():
            # Wende Schock an
            shocked_prices = base_prices * (1 + shock)
            
            # Berechne prozentuale Veränderung
            percent_change = (shocked_prices - base_prices) / base_prices
            
            # Speichere Ergebnis
            results[scenario] = {
                'shock': shock,
                'percent_change': percent_change,
                'shocked_prices': shocked_prices
            }
            
        return results
    
    @staticmethod
    def calculate monte_carlo_var(returns: pd.DataFrame,
                                 weights: np.ndarray,
                                 num_simulations: int = 10000,
                                 confidence_level: float = 0.95,
                                 holding_period: int = 1) -> float:
        """
        Berechne Value at Risk mittels Monte-Carlo-Simulation
        
        Args:
            returns: DataFrame mit Renditen der Assets
            weights: Portfolio-Gewichte
            num_simulations: Anzahl der Simulationen
            confidence_level: Konfidenzniveau
            holding_period: Haltedauer in Tagen
            
        Returns:
            Monte-Carlo VaR
        """
        # Berechne Parameter für die Simulation
        mean_returns = returns.mean().values
        cov_matrix = returns.cov().values
        
        # Generiere korrelierte Zufallszahlen
        L = np.linalg.cholesky(cov_matrix)
        uncorrelated_random = np.random.standard_normal((num_simulations, len(weights)))
        correlated_random = uncorrelated_random @ L.T
        
        # Simuliere Renditen
        simulated_returns = mean_returns + correlated_random
        
        # Berechne Portfolio-Renditen
        portfolio_returns = simulated_returns @ weights
        
        # Berechne VaR
        mc_var = -np.percentile(portfolio_returns, (1 - confidence_level) * 100)
        
        # Skaliere für Haltedauer
        mc_var *= np.sqrt(holding_period)
        
        return mc_var
