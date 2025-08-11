import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union, Callable
from datetime import datetime, timedelta
import logging
import time

from .simulation import MonteCarloSimulation
from ..data.aggregators import DataAggregator
from ..utils.exceptions import PricingError, DataError

logger = logging.getLogger(__name__)

class BasketOptionPricer:
    """Pricing engine for basket options on cryptocurrencies"""
    
    def __init__(
        self,
        data_aggregator: DataAggregator,
        num_simulations: int = 100000,
        num_steps: int = 252,
        risk_free_rate: float = 0.03,
        random_seed: Optional[int] = None
    ):
        """
        Initialize basket option pricer
        
        Args:
            data_aggregator: Data aggregator for fetching price data
            num_simulations: Number of simulation paths
            num_steps: Number of time steps
            risk_free_rate: Annual risk-free rate
            random_seed: Random seed for reproducibility
        """
        self.data_aggregator = data_aggregator
        self.simulation = MonteCarloSimulation(
            data_aggregator=data_aggregator,
            num_simulations=num_simulations,
            num_steps=num_steps,
            risk_free_rate=risk_free_rate,
            random_seed=random_seed
        )
        
        logger.info("Initialized basket option pricer")
    
    def price_option(
        self,
        assets: List[str],
        weights: List[float],
        strike_price: float,
        option_type: str = 'call',
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_to_maturity: float = 1.0,
        calculate_greeks: bool = False,
        analyze_results: bool = True
    ) -> Dict[str, Union[float, np.ndarray, Dict[str, float]]]:
        """
        Price a basket option using Monte Carlo simulation
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            strike_price: Strike price of the option
            option_type: 'call' or 'put'
            start_date: Start date for historical data (default: 1 year ago)
            end_date: End date for historical data (default: today)
            time_to_maturity: Time to maturity in years
            calculate_greeks: Whether to calculate option Greeks
            analyze_results: Whether to analyze simulation results
            
        Returns:
            Dictionary with pricing results
        """
        try:
            # Run simulation
            results = self.simulation.run_simulation(
                assets=assets,
                weights=weights,
                strike_price=strike_price,
                option_type=option_type,
                start_date=start_date,
                end_date=end_date,
                time_to_maturity=time_to_maturity,
                calculate_greeks=calculate_greeks
            )
            
            # Analyze results if requested
            if analyze_results:
                analysis = self.simulation.analyze_simulation_results(results)
                results['analysis'] = analysis
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to price option: {str(e)}")
            raise PricingError(f"Failed to price option: {str(e)}")
    
    def price_option_with_progress(
        self,
        assets: List[str],
        weights: List[float],
        strike_price: float,
        option_type: str = 'call',
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_to_maturity: float = 1.0,
        calculate_greeks: bool = False,
        analyze_results: bool = True,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Dict[str, Union[float, np.ndarray, Dict[str, float]]]:
        """
        Price a basket option using Monte Carlo simulation with progress callback
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            strike_price: Strike price of the option
            option_type: 'call' or 'put'
            start_date: Start date for historical data (default: 1 year ago)
            end_date: End date for historical data (default: today)
            time_to_maturity: Time to maturity in years
            calculate_greeks: Whether to calculate option Greeks
            analyze_results: Whether to analyze simulation results
            progress_callback: Callback function for progress updates
            
        Returns:
            Dictionary with pricing results
        """
        try:
            # Run simulation with progress callback
            results = self.simulation.run_simulation_with_progress(
                assets=assets,
                weights=weights,
                strike_price=strike_price,
                option_type=option_type,
                start_date=start_date,
                end_date=end_date,
                time_to_maturity=time_to_maturity,
                calculate_greeks=calculate_greeks,
                progress_callback=progress_callback
            )
            
            # Analyze results if requested
            if analyze_results:
                analysis = self.simulation.analyze_simulation_results(results)
                results['analysis'] = analysis
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to price option: {str(e)}")
            raise PricingError(f"Failed to price option: {str(e)}")
    
    def calculate_implied_volatility(
        self,
        assets: List[str],
        weights: List[float],
        strike_price: float,
        option_price: float,
        option_type: str = 'call',
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_to_maturity: float = 1.0,
        max_iterations: int = 100,
        tolerance: float = 1e-6
    ) -> float:
        """
        Calculate implied volatility using Newton-Raphson method
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            strike_price: Strike price of the option
            option_price: Market price of the option
            option_type: 'call' or 'put'
            start_date: Start date for historical data (default: 1 year ago)
            end_date: End date for historical data (default: today)
            time_to_maturity: Time to maturity in years
            max_iterations: Maximum number of iterations
            tolerance: Tolerance for convergence
            
        Returns:
            Implied volatility
        """
        # Set default dates if not provided
        if end_date is None:
            end_date = datetime.now()
        if start_date is None:
            start_date = end_date - timedelta(days=365)
        
        # Prepare simulation data
        initial_prices, drift, volatility, correlation_matrix = self.simulation.prepare_simulation_data(
            assets, weights, start_date, end_date, time_to_maturity
        )
        
        # Initial guess for implied volatility (average of individual volatilities)
        implied_vol = np.mean(volatility)
        
        # Newton-Raphson iteration
        for i in range(max_iterations):
            # Create a temporary simulation with the current implied volatility
            temp_volatility = np.ones_like(volatility) * implied_vol
            
            # Run simulation with current volatility
            try:
                results = self.simulation.run_simulation(
                    assets=assets,
                    weights=weights,
                    strike_price=strike_price,
                    option_type=option_type,
                    start_date=start_date,
                    end_date=end_date,
                    time_to_maturity=time_to_maturity,
                    calculate_greeks=True
                )
                
                # Calculate difference between model price and market price
                price_diff = results['option_price'] - option_price
                
                # Check for convergence
                if abs(price_diff) < tolerance:
                    logger.info(f"Implied volatility converged after {i+1} iterations: {implied_vol:.6f}")
                    return implied_vol
                
                # Calculate vega (sensitivity to volatility)
                vega = results['greeks']['vega']
                
                # Avoid division by zero
                if abs(vega) < 1e-10:
                    logger.warning("Vega is close to zero, using bisection method instead")
                    break
                
                # Update implied volatility
                implied_vol = implied_vol - price_diff / vega
                
                # Ensure implied volatility is positive
                implied_vol = max(implied_vol, 0.001)
                
            except Exception as e:
                logger.error(f"Error in implied volatility calculation: {str(e)}")
                break
        
        # If Newton-Raphson didn't converge, use bisection method
        logger.info("Newton-Raphson did not converge, using bisection method")
        
        # Set bounds for bisection
        vol_lower = 0.001
        vol_upper = 5.0  # 500% volatility should be high enough
        
        for i in range(max_iterations):
            vol_mid = (vol_lower + vol_upper) / 2
            
            # Run simulation with mid volatility
            try:
                temp_volatility = np.ones_like(volatility) * vol_mid
                results = self.simulation.run_simulation(
                    assets=assets,
                    weights=weights,
                    strike_price=strike_price,
                    option_type=option_type,
                    start_date=start_date,
                    end_date=end_date,
                    time_to_maturity=time_to_maturity
                )
                
                price_diff = results['option_price'] - option_price
                
                # Check for convergence
                if abs(price_diff) < tolerance:
                    logger.info(f"Implied volatility converged after {i+1} bisection iterations: {vol_mid:.6f}")
                    return vol_mid
                
                # Update bounds
                if price_diff > 0:
                    vol_upper = vol_mid
                else:
                    vol_lower = vol_mid
                    
            except Exception as e:
                logger.error(f"Error in bisection method: {str(e)}")
                break
        
        # If neither method converged, return the best estimate
        logger.warning(f"Implied volatility did not converge after {max_iterations} iterations")
        return implied_vol
    
    def calculate_implied_volatility_with_history(
        self,
        assets: List[str],
        weights: List[float],
        strike_price: float,
        option_price: float,
        option_type: str = 'call',
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        time_to_maturity: float = 1.0,
        max_iterations: int = 100,
        tolerance: float = 1e-6
    ) -> Dict[str, Union[float, List[float], bool]]:
        """
        Calculate implied volatility with convergence history
        
        Args:
            assets: List of asset symbols
            weights: List of weights for each asset
            strike_price: Strike price of the option
            option_price: Market price of the option
            option_type: 'call' or 'put'
            start_date: Start date for historical data (default: 1 year ago)
            end_date: End date for historical data (default: today)
            time_to_maturity: Time to maturity in years
            max_iterations: Maximum number of iterations
            tolerance: Tolerance for convergence
            
        Returns:
            Dictionary with implied volatility and convergence history
        """
        # Set default dates if not provided
        if end_date is None:
            end_date = datetime.now()
        if start_date is None:
            start_date = end_date - timedelta(days=365)
        
        # Prepare simulation data
        initial_prices, drift, volatility, correlation_matrix = self.simulation.prepare_simulation_data(
            assets, weights, start_date, end_date, time_to_maturity
        )
        
        # Initial guess for implied volatility (average of individual volatilities)
        implied_vol = np.mean(volatility)
        
        # Store convergence history
        convergence_history = [implied_vol]
        
        # Newton-Raphson iteration
        for i in range(max_iterations):
            # Create a temporary simulation with the current implied volatility
            temp_volatility = np.ones_like(volatility) * implied_vol
            
            # Run simulation with current volatility
            try:
                results = self.simulation.run_simulation(
                    assets=assets,
                    weights=weights,
                    strike_price=strike_price,
                    option_type=option_type,
                    start_date=start_date,
                    end_date=end_date,
                    time_to_maturity=time_to_maturity,
                    calculate_greeks=True
                )
                
                # Calculate difference between model price and market price
                price_diff = results['option_price'] - option_price
                
                # Check for convergence
                if abs(price_diff) < tolerance:
                    logger.info(f"Implied volatility converged after {i+1} iterations: {implied_vol:.6f}")
                    return {
                        'implied_volatility': implied_vol,
                        'iterations': i + 1,
                        'converged': True,
                        'convergence_history': convergence_history
                    }
                
                # Calculate vega (sensitivity to volatility)
                vega = results['greeks']['vega']
                
                # Avoid division by zero
                if abs(vega) < 1e-10:
                    logger.warning("Vega is close to zero, using bisection method instead")
                    break
                
                # Update implied volatility
                implied_vol = implied_vol - price_diff / vega
                
                # Ensure implied volatility is positive
                implied_vol = max(implied_vol, 0.001)
                
                # Add to convergence history
                convergence_history.append(implied_vol)
                
            except Exception as e:
                logger.error(f"Error in implied volatility calculation: {str(e)}")
                break
        
        # If Newton-Raphson didn't converge, use bisection method
        logger.info("Newton-Raphson did not converge, using bisection method")
        
        # Set bounds for bisection
        vol_lower = 0.001
        vol_upper = 5.0  # 500% volatility should be high enough
        
        # Reset convergence history for bisection
        convergence_history = [implied_vol]
        
        for i in range(max_iterations):
            vol_mid = (vol_lower + vol_upper) / 2
            
            # Run simulation with mid volatility
            try:
                temp_volatility = np.ones_like(volatility) * vol_mid
                results = self.simulation.run_simulation(
                    assets=assets,
                    weights=weights,
                    strike_price=strike_price,
                    option_type=option_type,
                    start_date=start_date,
                    end_date=end_date,
                    time_to_maturity=time_to_maturity
                )
                
                price_diff = results['option_price'] - option_price
                
                # Check for convergence
                if abs(price_diff) < tolerance:
                    logger.info(f"Implied volatility converged after {i+1} bisection iterations: {vol_mid:.6f}")
                    return {
                        'implied_volatility': vol_mid,
                        'iterations': len(convergence_history),
                        'converged': True,
                        'convergence_history': convergence_history
                    }
                
                # Update bounds
                if price_diff > 0:
                    vol_upper = vol_mid
                else:
                    vol_lower = vol_mid
                
                # Add to convergence history
                convergence_history.append(vol_mid)
                    
            except Exception as e:
                logger.error(f"Error in bisection method: {str(e)}")
                break
        
        # If neither method converged, return the best estimate
        logger.warning(f"Implied volatility did not converge after {max_iterations} iterations")
        return {
            'implied_volatility': implied_vol,
            'iterations': len(convergence_history),
            'converged': False,
            'convergence_history': convergence_history
        }
