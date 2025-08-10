import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta
from ..utils.exceptions import ValidationError, ProcessingError
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    """
    Processes raw price data to prepare it for Monte Carlo simulation.
    """
    
    def __init__(self):
        pass
    
    def process_historical_prices(self, 
                                 price_data: List[Dict[str, Union[str, float]]],
                                 fill_missing: bool = True,
                                 smoothing_method: Optional[str] = None) -> pd.DataFrame:
        """
        Process raw historical price data into a clean pandas DataFrame.
        
        Args:
            price_data: List of dictionaries with timestamp and price
            fill_missing: Whether to fill missing data points
            smoothing_method: Optional smoothing method ('moving_average', 'exponential')
            
        Returns:
            Processed data as a pandas DataFrame
        """
        if not price_data:
            raise ValidationError("No price data provided")
        
        # Convert to DataFrame
        df = pd.DataFrame(price_data)
        
        # Ensure required columns exist
        if "timestamp" not in df.columns or "price" not in df.columns:
            raise ValidationError("Price data must contain 'timestamp' and 'price' columns")
        
        # Convert timestamp to datetime
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        
        # Sort by timestamp
        df = df.sort_values("timestamp")
        
        # Set timestamp as index
        df = df.set_index("timestamp")
        
        # Fill missing data points if requested
        if fill_missing:
            df = self._fill_missing_data(df)
        
        # Apply smoothing if requested
        if smoothing_method:
            df = self._apply_smoothing(df, smoothing_method)
        
        return df
    
    def calculate_returns(self, 
                         price_data: pd.DataFrame,
                         return_type: str = "log") -> pd.Series:
        """
        Calculate returns from price data.
        
        Args:
            price_data: DataFrame with price data (price in 'price' column)
            return_type: Type of returns to calculate ('log' or 'simple')
            
        Returns:
            Series with calculated returns
        """
        if "price" not in price_data.columns:
            raise ValidationError("Price data must contain 'price' column")
        
        if return_type == "log":
            returns = np.log(price_data["price"] / price_data["price"].shift(1))
        elif return_type == "simple":
            returns = price_data["price"].pct_change()
        else:
            raise ValidationError(f"Unsupported return type: {return_type}")
        
        # Drop NaN values
        returns = returns.dropna()
        
        return returns
    
    def calculate_volatility(self, 
                            returns: pd.Series,
                            window: Optional[int] = None,
                            annualize: bool = True) -> Union[float, pd.Series]:
        """
        Calculate volatility from returns.
        
        Args:
            returns: Series with returns
            window: Window size for rolling volatility (None for overall volatility)
            annualize: Whether to annualize the volatility
            
        Returns:
            Volatility as a float (overall) or Series (rolling)
        """
        if window is None:
            # Overall volatility
            volatility = returns.std()
        else:
            # Rolling volatility
            volatility = returns.rolling(window=window).std()
        
        # Annualize if requested (assuming daily data)
        if annualize:
            volatility = volatility * np.sqrt(252)
        
        return volatility
    
    def calculate_drift(self, 
                       returns: pd.Series,
                       risk_free_rate: float = 0.0,
                       annualize: bool = True) -> float:
        """
        Calculate drift from returns.
        
        Args:
            returns: Series with returns
            risk_free_rate: Risk-free rate (annualized)
            annualize: Whether to annualize the drift
            
        Returns:
            Drift as a float
        """
        # Calculate mean return
        mean_return = returns.mean()
        
        # Adjust for risk-free rate
        drift = mean_return - (risk_free_rate / 252)  # Convert annual rate to daily
        
        # Annualize if requested (assuming daily data)
        if annualize:
            drift = drift * 252
        
        return drift
    
    def prepare_simulation_parameters(self, 
                                     price_data: Dict[str, pd.DataFrame],
                                     risk_free_rate: float = 0.03) -> Dict[str, Dict[str, float]]:
        """
        Prepare parameters for Monte Carlo simulation.
        
        Args:
            price_data: Dictionary mapping asset names to their price DataFrames
            risk_free_rate: Risk-free rate (annualized)
            
        Returns:
            Dictionary mapping asset names to their simulation parameters
        """
        if not price_data:
            raise ValidationError("No price data provided")
        
        parameters = {}
        
        for asset_name, df in price_data.items():
            if "price" not in df.columns:
                logger.warning(f"No 'price' column in data for {asset_name}, skipping")
                continue
            
            # Calculate returns
            returns = self.calculate_returns(df)
            
            # Calculate volatility
            volatility = self.calculate_volatility(returns)
            
            # Calculate drift
            drift = self.calculate_drift(returns, risk_free_rate)
            
            # Get current price
            current_price = df["price"].iloc[-1]
            
            parameters[asset_name] = {
                "current_price": current_price,
                "drift": drift,
                "volatility": volatility,
                "risk_free_rate": risk_free_rate
            }
        
        return parameters
    
    def calculate_correlation(self, 
                             price_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Calculate correlation matrix between multiple assets.
        
        Args:
            price_data: Dictionary mapping asset names to their price DataFrames
            
        Returns:
            Correlation matrix as a DataFrame
        """
        if len(price_data) < 2:
            raise ValidationError("At least two assets are required to calculate correlation")
        
        # Extract returns for each asset
        returns_data = {}
        for asset_name, df in price_data.items():
            if "price" not in df.columns:
                logger.warning(f"No 'price' column in data for {asset_name}, skipping")
                continue
            
            returns = self.calculate_returns(df)
            returns_data[asset_name] = returns
        
        # Create a DataFrame with all returns
        returns_df = pd.DataFrame(returns_data)
        
        # Calculate correlation matrix
        correlation_matrix = returns_df.corr()
        
        return correlation_matrix
    
    def _fill_missing_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Fill missing data points in a DataFrame.
        
        Args:
            df: DataFrame with price data
            
        Returns:
            DataFrame with missing data filled
        """
        # Forward fill first
        df = df.fillna(method="ffill")
        
        # If there are still missing values at the beginning, backward fill
        df = df.fillna(method="bfill")
        
        return df
    
    def _apply_smoothing(self, df: pd.DataFrame, method: str) -> pd.DataFrame:
        """
        Apply smoothing to price data.
        
        Args:
            df: DataFrame with price data
            method: Smoothing method ('moving_average', 'exponential')
            
        Returns:
            DataFrame with smoothed price data
        """
        if method == "moving_average":
            # Apply a 7-day moving average
            df["price"] = df["price"].rolling(window=7, min_periods=1).mean()
        elif method == "exponential":
            # Apply exponential smoothing
            df["price"] = df["price"].ewm(span=7, adjust=False).mean()
        else:
            raise ValidationError(f"Unsupported smoothing method: {method}")
        
        return df
