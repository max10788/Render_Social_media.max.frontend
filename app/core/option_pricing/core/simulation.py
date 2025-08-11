import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union, Callable
from datetime import datetime, timedelta
import logging
import time

from ..utils.math_utils import MathUtils
from ..data.aggregators import DataAggregator
from ..utils.exceptions import SimulationError, DataError

logger = logging.getLogger(__name__)

class MonteCarloSimulation:
    """Monte Carlo simulation for basket options on cryptocurrencies"""
    
    def __init__(
        self,
        data_aggregator: DataAggregator,
        num_simulations: int = 100000,
        num_steps: int = 252,
        risk_free_rate: float = 0.03,
        random_seed: Optional[int] = None
    ):
        """
        Initialize Monte Carlo simulation
        
        Args:
            data_aggregator: Data aggregator for fetching price data
            num_simulations: Number of simulation paths
            num_steps: Number of time steps
            risk_free_rate: Annual risk-free rate
            random_seed: Random seed for reproducibility
        """
        self.data_aggregator = data_aggregator
        self.num_simulations = num_simulations
        self.num_steps = num_steps
        self.risk_free_rate = risk_free_rate
        
        if random_seed is not None:
            np.random.seed(random_seed)
            
        logger.info(f"Initialized Monte Carlo simulation with {num_simulations} paths and {num_steps} steps")
    
    def prepare_simulation_data(
        self,
        assets: List[str],
        weights: List[float],
        start_date: datetime,
        end_date: datetime,
        time_to_maturity: float
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, pd.DataFrame]:
        """
        Prepare data for Monte Carlo simulation
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            start_date: Start date for historical data
            end_date: End date for historical data
            time_to_maturity: Time to maturity in years
            
        Returns:
            Tuple of (initial_prices, drift, volatility, correlation_matrix)
        """
        # Normalize weights
        weights = np.array(weights) / np.sum(weights)
        
        # Fetch historical price data
        try:
            historical_prices = self.data_aggregator.get_historical_prices(
                assets, start_date, end_date
            )
        except Exception as e:
            logger.error(f"Failed to fetch historical prices: {str(e)}")
            raise DataError(f"Failed to fetch historical prices: {str(e)}")
        
        # Calculate log returns
        returns = MathUtils.calculate_log_returns(historical_prices)
        
        # Calculate drift and volatility
        drift = MathUtils.calculate_drift(returns, self.risk_free_rate)
        volatility = MathUtils.calculate_annualized_volatility(returns)
        
        # Calculate correlation matrix
        correlation_matrix = MathUtils.calculate_correlation_matrix(returns)
        
        # Get initial prices (last available prices)
        initial_prices = historical_prices.iloc[-1].values
        
        logger.info(f"Prepared simulation data for {len(assets)} assets")
        
        return initial_prices, drift.values, volatility.values, correlation_matrix
    
    def run_simulation(
        self,
        assets: List[str],
        weights: List[float],
        strike_price: float,
        option_type: str = 'call',
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_to_maturity: float = 1.0,
        calculate_greeks: bool = False
    ) -> Dict[str, Union[float, np.ndarray, Dict[str, float]]]:
        """
        Run Monte Carlo simulation for basket option pricing
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            strike_price: Strike price of the option
            option_type: 'call' or 'put'
            start_date: Start date for historical data (default: 1 year ago)
            end_date: End date for historical data (default: today)
            time_to_maturity: Time to maturity in years
            calculate_greeks: Whether to calculate option Greeks
            
        Returns:
            Dictionary with simulation results
        """
        # Set default dates if not provided
        if end_date is None:
            end_date = datetime.now()
        if start_date is None:
            start_date = end_date - timedelta(days=365)
        
        # Prepare simulation data
        initial_prices, drift, volatility, correlation_matrix = self.prepare_simulation_data(
            assets, weights, start_date, end_date, time_to_maturity
        )
        
        # Time step size
        dt = time_to_maturity / self.num_steps
        
        # Generate correlated random numbers
        correlated_random = MathUtils.generate_correlated_random_numbers(
            self.num_simulations, self.num_steps, correlation_matrix.values, len(assets)
        )
        
        # Simulate price paths
        price_paths = MathUtils.simulate_geometric_brownian_motion(
            initial_prices, drift, volatility, correlated_random, dt
        )
        
        # Calculate basket values
        weights_array = np.array(weights) / np.sum(weights)
        basket_values = MathUtils.calculate_basket_value(price_paths, weights_array)
        
        # Calculate option payoffs
        payoffs = MathUtils.calculate_option_payoff(
            basket_values[:, -1], strike_price, option_type
        )
        
        # Calculate option price
        option_price = MathUtils.calculate_option_price(
            payoffs, self.risk_free_rate, time_to_maturity
        )
        
        # Prepare results
        results = {
            'option_price': option_price,
            'initial_prices': initial_prices,
            'price_paths': price_paths,
            'basket_values': basket_values,
            'payoffs': payoffs,
            'drift': drift,
            'volatility': volatility,
            'correlation_matrix': correlation_matrix
        }
        
        # Calculate Greeks if requested
        if calculate_greeks:
            greeks = MathUtils.calculate_greeks(
                price_paths, basket_values, payoffs, strike_price,
                self.risk_free_rate, time_to_maturity,
                initial_prices, weights_array, option_type
            )
            results['greeks'] = greeks
        
        logger.info(f"Simulation completed. Option price: {option_price:.4f}")
        
        return results
    
    def run_simulation_with_progress(
        self,
        assets: List[str],
        weights: List[float],
        strike_price: float,
        option_type: str = 'call',
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_to_maturity: float = 1.0,
        calculate_greeks: bool = False,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Dict[str, Union[float, np.ndarray, Dict[str, float]]]:
        """
        Run Monte Carlo simulation with progress callback
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            strike_price: Strike price of the option
            option_type: 'call' or 'put'
            start_date: Start date for historical data (default: 1 year ago)
            end_date: End date for historical data (default: today)
            time_to_maturity: Time to maturity in years
            calculate_greeks: Whether to calculate option Greeks
            progress_callback: Callback function for progress updates
            
        Returns:
            Dictionary with simulation results
        """
        # Set default dates if not provided
        if end_date is None:
            end_date = datetime.now()
        if start_date is None:
            start_date = end_date - timedelta(days=365)
        
        # Prepare simulation data
        initial_prices, drift, volatility, correlation_matrix = self.prepare_simulation_data(
            assets, weights, start_date, end_date, time_to_maturity
        )
        
        # Time step size
        dt = time_to_maturity / self.num_steps
        
        # Generate correlated random numbers
        correlated_random = MathUtils.generate_correlated_random_numbers(
            self.num_simulations, self.num_steps, correlation_matrix.values, len(assets)
        )
        
        # Simulate price paths with progress updates
        price_paths = MathUtils.simulate_geometric_brownian_motion_with_progress(
            initial_prices, drift, volatility, correlated_random, dt, progress_callback
        )
        
        # Calculate basket values
        weights_array = np.array(weights) / np.sum(weights)
        basket_values = MathUtils.calculate_basket_value(price_paths, weights_array)
        
        # Calculate option payoffs
        payoffs = MathUtils.calculate_option_payoff(
            basket_values[:, -1], strike_price, option_type
        )
        
        # Calculate option price
        option_price = MathUtils.calculate_option_price(
            payoffs, self.risk_free_rate, time_to_maturity
        )
        
        # Prepare results
        results = {
            'option_price': option_price,
            'initial_prices': initial_prices,
            'price_paths': price_paths,
            'basket_values': basket_values,
            'payoffs': payoffs,
            'drift': drift,
            'volatility': volatility,
            'correlation_matrix': correlation_matrix
        }
        
        # Calculate Greeks if requested
        if calculate_greeks:
            greeks = MathUtils.calculate_greeks(
                price_paths, basket_values, payoffs, strike_price,
                self.risk_free_rate, time_to_maturity,
                initial_prices, weights_array, option_type
            )
            results['greeks'] = greeks
        
        logger.info(f"Simulation completed. Option price: {option_price:.4f}")
        
        return results
    
    def analyze_simulation_results(self, results: Dict) -> Dict:
        """
        Analyze simulation results and calculate additional metrics
        
        Args:
            results: Simulation results dictionary
            
        Returns:
            Dictionary with analysis results
        """
        basket_values = results['basket_values']
        payoffs = results['payoffs']
        
        # Calculate statistics
        analysis = {
            'mean_basket_value': np.mean(basket_values[:, -1]),
            'std_basket_value': np.std(basket_values[:, -1]),
            'min_basket_value': np.min(basket_values[:, -1]),
            'max_basket_value': np.max(basket_values[:, -1]),
            'percentile_5': np.percentile(basket_values[:, -1], 5),
            'percentile_95': np.percentile(basket_values[:, -1], 95),
            'probability_of_exercise': np.mean(payoffs > 0),
            'expected_payoff_given_exercise': np.mean(payoffs[payoffs > 0]) if np.any(payoffs > 0) else 0
        }
        
        # Calculate confidence interval for option price
        std_error = np.std(payoffs) / np.sqrt(self.num_simulations)
        discount_factor = np.exp(-self.risk_free_rate * (self.num_steps / 252))
        analysis['price_confidence_interval'] = (
            results['option_price'] - 1.96 * std_error * discount_factor,
            results['option_price'] + 1.96 * std_error * discount_factor
        )
        
        # Calculate convergence data
        convergence_data = {
            'simulations': list(range(1000, self.num_simulations + 1, 1000)),
            'prices': [],
            'errors': []
        }
        
        # Calculate convergence metrics
        for n in range(1000, self.num_simulations + 1, 1000):
            sample_payoffs = payoffs[:n]
            sample_price = MathUtils.calculate_option_price(
                sample_payoffs, self.risk_free_rate, (self.num_steps / 252)
            )
            sample_error = np.std(sample_payoffs) / np.sqrt(n) * discount_factor
            
            convergence_data['prices'].append(sample_price)
            convergence_data['errors'].append(sample_error)
        
        analysis['convergence_data'] = convergence_data
        
        return analysis
