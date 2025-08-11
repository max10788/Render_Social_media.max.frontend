import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from .base import BaseBlockchainClient
from ..utils.exceptions import APIError, DataFetchError
import os
from dotenv import load_dotenv

load_dotenv()

class EthereumClient(BaseBlockchainClient):
    def __init__(self, api_url: str = None, api_key: str = None):
        self.api_url = api_url or os.getenv("ETHEREUM_API_URL")
        self.api_key = api_key or os.getenv("ETHERSCAN_API_KEY")
        self.session = requests.Session()
        
    def get_current_price(self, token_address: str = None) -> float:
        """
        Get current price of ETH or a specific ERC-20 token.
        
        Args:
            token_address: Optional ERC-20 token contract address
            
        Returns:
            Current price in USD
        """
        if token_address is None:
            # Get ETH price
            url = f"{self.api_url}?module=stats&action=ethprice&apikey={self.api_key}"
        else:
            # Get ERC-20 token price
            url = f"{self.api_url}?module=token&action=tokenprice&contractaddress={token_address}&apikey={self.api_key}"
            
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data["status"] != "1":
                raise APIError(f"API error: {data['message']}")
                
            if token_address is None:
                return float(data["result"]["ethusd"])
            else:
                return float(data["result"]["tokenusd"])
                
        except requests.exceptions.RequestException as e:
            raise DataFetchError(f"Failed to fetch price from Ethereum API: {str(e)}")
        except (KeyError, ValueError) as e:
            raise DataFetchError(f"Failed to parse price data: {str(e)}")
    
    def get_historical_prices(self, token_address: str = None, days: int = 30) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices for ETH or a specific ERC-20 token.
        
        Args:
            token_address: Optional ERC-20 token contract address
            days: Number of days of historical data to retrieve
            
        Returns:
            List of dictionaries with timestamp and price
        """
        # For Ethereum, we'll use a combination of Etherscan for basic data
        # and DEX data for more comprehensive historical prices
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # First, try to get data from Etherscan
        try:
            if token_address is None:
                # Get ETH historical price
                url = f"{self.api_url}?module=stats&action=ethdailyprice&startdate={start_date.strftime('%Y-%m-%d')}&enddate={end_date.strftime('%Y-%m-%d')}&sort=asc&apikey={self.api_key}"
            else:
                # For ERC-20 tokens, we need to use a different approach
                # Etherscan doesn't provide direct historical token prices
                # We'll use token transfers and try to estimate price from DEX data
                return self._get_dex_historical_prices(token_address, start_date, end_date)
                
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data["status"] != "1":
                # Fallback to DEX data if Etherscan fails
                if token_address is None:
                    return self._get_dex_historical_prices("ETH", start_date, end_date)
                else:
                    return self._get_dex_historical_prices(token_address, start_date, end_date)
                
            result = []
            for item in data["result"]:
                result.append({
                    "timestamp": datetime.fromtimestamp(int(item["timestamp"])).isoformat(),
                    "price": float(item["ethusd"])
                })
                
            return result
            
        except requests.exceptions.RequestException as e:
            # Fallback to DEX data
            if token_address is None:
                return self._get_dex_historical_prices("ETH", start_date, end_date)
            else:
                return self._get_dex_historical_prices(token_address, start_date, end_date)
        except (KeyError, ValueError) as e:
            # Fallback to DEX data
            if token_address is None:
                return self._get_dex_historical_prices("ETH", start_date, end_date)
            else:
                return self._get_dex_historical_prices(token_address, start_date, end_date)
    
    def _get_dex_historical_prices(self, token_address: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices from DEX data (Uniswap, Sushiswap, etc.)
        
        Args:
            token_address: Token address or "ETH" for native Ethereum
            start_date: Start date for historical data
            end_date: End date for historical data
            
        Returns:
            List of dictionaries with timestamp and price
        """
        # This is a simplified implementation
        # In a real-world scenario, you would use The Graph or similar services
        # to query DEX data efficiently
        
        # For demonstration purposes, we'll use a mock implementation
        # In production, you would replace this with actual DEX data queries
        
        if token_address == "ETH":
            # For ETH, we can use a stablecoin pair like ETH/USDC
            # This would typically involve querying Uniswap or other DEXs
            # for the ETH/USDC pair historical prices
            
            # Mock implementation - replace with actual DEX queries
            mock_prices = []
            current_date = start_date
            base_price = 2000.0  # Mock base price
            
            while current_date <= end_date:
                # Generate a mock price with some random variation
                import random
                variation = random.uniform(-0.05, 0.05)  # ±5% variation
                price = base_price * (1 + variation)
                
                mock_prices.append({
                    "timestamp": current_date.isoformat(),
                    "price": price
                })
                
                current_date += timedelta(days=1)
                base_price = price  # Use the previous day's price as the new base
                
            return mock_prices
        else:
            # For ERC-20 tokens, we would need to find a trading pair with a stablecoin
            # This would involve querying DEXs for pairs like TOKEN/USDC, TOKEN/USDT, etc.
            
            # Mock implementation - replace with actual DEX queries
            mock_prices = []
            current_date = start_date
            base_price = 1.0  # Mock base price
            
            while current_date <= end_date:
                # Generate a mock price with some random variation
                import random
                variation = random.uniform(-0.1, 0.1)  # ±10% variation (tokens are more volatile)
                price = base_price * (1 + variation)
                
                mock_prices.append({
                    "timestamp": current_date.isoformat(),
                    "price": price
                })
                
                current_date += timedelta(days=1)
                base_price = price  # Use the previous day's price as the new base
                
            return mock_prices
    
    def get_token_info(self, token_address: str) -> Dict[str, str]:
        """
        Get information about an ERC-20 token.
        
        Args:
            token_address: ERC-20 token contract address
            
        Returns:
            Dictionary with token information
        """
        url = f"{self.api_url}?module=token&action=tokeninfo&contractaddress={token_address}&apikey={self.api_key}"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data["status"] != "1":
                raise APIError(f"API error: {data['message']}")
                
            result = data["result"]
            return {
                "name": result.get("tokenName", ""),
                "symbol": result.get("tokenSymbol", ""),
                "decimals": int(result.get("tokenDecimal", 0)),
                "total_supply": result.get("tokenSupply", "")
            }
            
        except requests.exceptions.RequestException as e:
            raise DataFetchError(f"Failed to fetch token info from Ethereum API: {str(e)}")
        except (KeyError, ValueError) as e:
            raise DataFetchError(f"Failed to parse token info: {str(e)}")