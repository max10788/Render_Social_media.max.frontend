import numpy as np
import pandas as pd
from scipy.stats import norm
from scipy.linalg import cholesky
from typing import List, Dict, Tuple, Optional, Callable
import logging

logger = logging.getLogger(__name__)

class MathUtils:
    """Mathematical utilities for Monte Carlo simulation of basket options"""
    
    @staticmethod
    def calculate_log_returns(prices: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate log returns from price data
        
        Args:
            prices: DataFrame with historical prices for each asset
            
        Returns:
            DataFrame with log returns
        """
        return np.log(prices / prices.shift(1)).dropna()
    
    @staticmethod
    def calculate_correlation_matrix(returns: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate correlation matrix from asset returns
        
        Args:
            returns: DataFrame with log returns for each asset
            
        Returns:
            Correlation matrix
        """
        return returns.corr()
    
    @staticmethod
    def calculate_covariance_matrix(returns: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate covariance matrix from asset returns
        
        Args:
            returns: DataFrame with log returns for each asset
            
        Returns:
            Covariance matrix
        """
        return returns.cov()
    
    @staticmethod
    def calculate_annualized_volatility(returns: pd.DataFrame, periods_per_year: int = 252) -> pd.Series:
        """
        Calculate annualized volatility from returns
        
        Args:
            returns: DataFrame with log returns for each asset
            periods_per_year: Number of periods per year (default: 252 trading days)
            
        Returns:
            Series with annualized volatility for each asset
        """
        return returns.std() * np.sqrt(periods_per_year)
    
    @staticmethod
    def calculate_drift(returns: pd.DataFrame, risk_free_rate: float, periods_per_year: int = 252) -> pd.Series:
        """
        Calculate drift parameter for geometric Brownian motion
        
        Args:
            returns: DataFrame with log returns for each asset
            risk_free_rate: Annual risk-free rate
            periods_per_year: Number of periods per year (default: 252 trading days)
            
        Returns:
            Series with drift for each asset
        """
        mean_returns = returns.mean() * periods_per_year
        return mean_returns - 0.5 * (returns.std() * np.sqrt(periods_per_year))**2 + risk_free_rate
    
    @staticmethod
    def generate_correlated_random_numbers(
        num_simulations: int, 
        num_steps: int, 
        correlation_matrix: np.ndarray,
        num_assets: int
    ) -> np.ndarray:
        """
        Generate correlated random numbers for Monte Carlo simulation
        
        Args:
            num_simulations: Number of simulation paths
            num_steps: Number of time steps
            correlation_matrix: Correlation matrix of assets
            num_assets: Number of assets in the basket
            
        Returns:
            3D array of correlated random numbers (simulations x steps x assets)
        """
        # Perform Cholesky decomposition
        try:
            L = cholesky(correlation_matrix, lower=True)
        except np.linalg.LinAlgError:
            # If matrix is not positive definite, use nearest correlation matrix
            logger.warning("Correlation matrix not positive definite, using nearest approximation")
            correlation_matrix = MathUtils._nearest_correlation_matrix(correlation_matrix)
            L = cholesky(correlation_matrix, lower=True)
        
        # Generate uncorrelated random numbers
        uncorrelated_random = np.random.standard_normal((num_simulations, num_steps, num_assets))
        
        # Apply correlation structure
        correlated_random = np.zeros_like(uncorrelated_random)
        for i in range(num_simulations):
            for j in range(num_steps):
                correlated_random[i, j] = L @ uncorrelated_random[i, j]
                
        return correlated_random
    
    @staticmethod
    def _nearest_correlation_matrix(A: np.ndarray) -> np.ndarray:
        """
        Find the nearest correlation matrix to a given matrix
        
        Args:
            A: Input matrix
            
        Returns:
            Nearest correlation matrix
        """
        # Simple implementation using Higham's method
        # For production use, consider a more robust implementation
        n = A.shape[0]
        B = (A + A.T) / 2  # Ensure symmetry
        eigvals, eigvecs = np.linalg.eigh(B)
        
        # Set negative eigenvalues to zero
        eigvals = np.maximum(eigvals, 0)
        
        # Scale eigenvalues to unit diagonal
        eigvals = eigvals / np.sum(eigvals) * n
        
        # Reconstruct the matrix
        C = eigvecs @ np.diag(eigvals) @ eigvecs.T
        
        # Rescale to unit diagonal
        D = np.diag(1 / np.sqrt(np.diag(C)))
        return D @ C @ D
    
    @staticmethod
    def simulate_geometric_brownian_motion(
        initial_prices: np.ndarray,
        drift: np.ndarray,
        volatility: np.ndarray,
        correlated_random: np.ndarray,
        dt: float
    ) -> np.ndarray:
        """
        Simulate geometric Brownian motion for multiple assets
        
        Args:
            initial_prices: Initial prices for each asset
            drift: Drift parameters for each asset
            volatility: Volatility for each asset
            correlated_random: Correlated random numbers
            dt: Time step size
            
        Returns:
            3D array of simulated prices (simulations x steps x assets)
        """
        num_simulations, num_steps, num_assets = correlated_random.shape
        
        # Initialize price paths
        price_paths = np.zeros((num_simulations, num_steps + 1, num_assets))
        price_paths[:, 0, :] = initial_prices
        
        # Simulate price paths
        for i in range(num_simulations):
            for j in range(1, num_steps + 1):
                # Calculate the increment
                increment = drift * dt + volatility * np.sqrt(dt) * correlated_random[i, j-1]
                
                # Update prices
                price_paths[i, j, :] = price_paths[i, j-1, :] * np.exp(increment)
                
        return price_paths
    
    @staticmethod
    def simulate_geometric_brownian_motion_with_progress(
        initial_prices: np.ndarray,
        drift: np.ndarray,
        volatility: np.ndarray,
        correlated_random: np.ndarray,
        dt: float,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> np.ndarray:
        """
        Simulate geometric Brownian motion for multiple assets with progress callback
        
        Args:
            initial_prices: Initial prices for each asset
            drift: Drift parameters for each asset
            volatility: Volatility for each asset
            correlated_random: Correlated random numbers
            dt: Time step size
            progress_callback: Callback function for progress updates
            
        Returns:
            3D array of simulated prices (simulations x steps x assets)
        """
        num_simulations, num_steps, num_assets = correlated_random.shape
        
        # Initialize price paths
        price_paths = np.zeros((num_simulations, num_steps + 1, num_assets))
        price_paths[:, 0, :] = initial_prices
        
        # Simulate price paths
        total_steps = num_simulations * num_steps
        completed_steps = 0
        
        for i in range(num_simulations):
            for j in range(1, num_steps + 1):
                # Calculate the increment
                increment = drift * dt + volatility * np.sqrt(dt) * correlated_random[i, j-1]
                
                # Update prices
                price_paths[i, j, :] = price_paths[i, j-1, :] * np.exp(increment)
                
                # Update progress
                completed_steps += 1
                if progress_callback and completed_steps % 1000 == 0:
                    progress = completed_steps / total_steps
                    progress_callback(progress)
        
        # Ensure progress is reported as 100% at the end
        if progress_callback:
            progress_callback(1.0)
                
        return price_paths
    
    @staticmethod
    def calculate_basket_value(price_paths: np.ndarray, weights: np.ndarray) -> np.ndarray:
        """
        Calculate the basket value from simulated asset prices
        
        Args:
            price_paths: 3D array of simulated prices (simulations x steps x assets)
            weights: Weights for each asset in the basket
            
        Returns:
            2D array of basket values (simulations x steps)
        """
        # Ensure weights sum to 1
        weights = weights / np.sum(weights)
        
        # Calculate weighted basket value
        basket_values = np.sum(price_paths * weights, axis=2)
        return basket_values
    
    @staticmethod
    def calculate_option_payoff(
        basket_values: np.ndarray,
        strike_price: float,
        option_type: str = 'call'
    ) -> np.ndarray:
        """
        Calculate option payoff at maturity
        
        Args:
            basket_values: Basket values at maturity
            strike_price: Strike price of the option
            option_type: 'call' or 'put'
            
        Returns:
            Array of option payoffs
        """
        if option_type.lower() == 'call':
            return np.maximum(basket_values - strike_price, 0)
        elif option_type.lower() == 'put':
            return np.maximum(strike_price - basket_values, 0)
        else:
            raise ValueError("Option type must be 'call' or 'put'")
    
    @staticmethod
    def calculate_option_price(
        payoffs: np.ndarray,
        risk_free_rate: float,
        time_to_maturity: float
    ) -> float:
        """
        Calculate option price as discounted expected payoff
        
        Args:
            payoffs: Array of option payoffs
            risk_free_rate: Annual risk-free rate
            time_to_maturity: Time to maturity in years
            
        Returns:
            Option price
        """
        discount_factor = np.exp(-risk_free_rate * time_to_maturity)
        return discount_factor * np.mean(payoffs)
    
    @staticmethod
    def calculate_greeks(
        price_paths: np.ndarray,
        basket_values: np.ndarray,
        payoffs: np.ndarray,
        strike_price: float,
        risk_free_rate: float,
        time_to_maturity: float,
        initial_prices: np.ndarray,
        weights: np.ndarray,
        option_type: str = 'call',
        bump_size: float = 0.01
    ) -> Dict[str, float]:
        """
        Calculate option Greeks (Delta, Gamma, Vega, Theta, Rho)
        
        Args:
            price_paths: 3D array of simulated prices (simulations x steps x assets)
            basket_values: 2D array of basket values (simulations x steps)
            payoffs: Array of option payoffs
            strike_price: Strike price of the option
            risk_free_rate: Annual risk-free rate
            time_to_maturity: Time to maturity in years
            initial_prices: Initial prices for each asset
            weights: Weights for each asset in the basket
            option_type: 'call' or 'put'
            bump_size: Size of the bump for finite difference method
            
        Returns:
            Dictionary with calculated Greeks
        """
        num_assets = len(initial_prices)
        dt = time_to_maturity / (price_paths.shape[1] - 1)
        
        # Base option price
        option_price = MathUtils.calculate_option_price(payoffs, risk_free_rate, time_to_maturity)
        
        # Calculate Delta (sensitivity to underlying asset prices)
        deltas = np.zeros(num_assets)
        for i in range(num_assets):
            # Bump the initial price of asset i
            bumped_prices = initial_prices.copy()
            bumped_prices[i] *= (1 + bump_size)
            
            # Recalculate basket values with bumped prices
            bumped_basket_values = np.sum(
                price_paths * weights * bumped_prices / initial_prices, 
                axis=2
            )
            
            # Recalculate payoffs
            bumped_payoffs = MathUtils.calculate_option_payoff(
                bumped_basket_values[:, -1], strike_price, option_type
            )
            
            # Calculate bumped option price
            bumped_option_price = MathUtils.calculate_option_price(
                bumped_payoffs, risk_free_rate, time_to_maturity
            )
            
            # Calculate delta for asset i
            deltas[i] = (bumped_option_price - option_price) / (initial_prices[i] * bump_size)
        
        # Calculate Gamma (second derivative of price with respect to underlying)
        gammas = np.zeros(num_assets)
        for i in range(num_assets):
            # Bump up
            bumped_up_prices = initial_prices.copy()
            bumped_up_prices[i] *= (1 + bump_size)
            
            bumped_up_basket_values = np.sum(
                price_paths * weights * bumped_up_prices / initial_prices, 
                axis=2
            )
            
            bumped_up_payoffs = MathUtils.calculate_option_payoff(
                bumped_up_basket_values[:, -1], strike_price, option_type
            )
            
            bumped_up_option_price = MathUtils.calculate_option_price(
                bumped_up_payoffs, risk_free_rate, time_to_maturity
            )
            
            # Bump down
            bumped_down_prices = initial_prices.copy()
            bumped_down_prices[i] *= (1 - bump_size)
            
            bumped_down_basket_values = np.sum(
                price_paths * weights * bumped_down_prices / initial_prices, 
                axis=2
            )
            
            bumped_down_payoffs = MathUtils.calculate_option_payoff(
                bumped_down_basket_values[:, -1], strike_price, option_type
            )
            
            bumped_down_option_price = MathUtils.calculate_option_price(
                bumped_down_payoffs, risk_free_rate, time_to_maturity
            )
            
            # Calculate gamma for asset i
            gammas[i] = (bumped_up_option_price - 2 * option_price + bumped_down_option_price) / \
                       ((initial_prices[i] * bump_size) ** 2)
        
        # Calculate Vega (sensitivity to volatility)
        # This requires re-running the simulation with bumped volatility
        # For simplicity, we'll use an approximation
        vega = 0.0  # Placeholder
        
        # Calculate Theta (sensitivity to time)
        # We can approximate by calculating the option price with slightly less time to maturity
        theta_time = time_to_maturity - dt
        if theta_time > 0:
            theta_option_price = MathUtils.calculate_option_price(
                payoffs, risk_free_rate, theta_time
            )
            theta = (theta_option_price - option_price) / dt
        else:
            theta = 0.0
        
        # Calculate Rho (sensitivity to interest rate)
        # Bump the risk-free rate
        bumped_rate = risk_free_rate + bump_size
        rho_option_price = MathUtils.calculate_option_price(
            payoffs, bumped_rate, time_to_maturity
        )
        rho = (rho_option_price - option_price) / bump_size
        
        return {
            'delta': deltas,
            'gamma': gammas,
            'vega': vega,
            'theta': theta,
            'rho': rho
        }
