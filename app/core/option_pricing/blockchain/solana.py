import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from .base import BaseBlockchainClient
from ..utils.exceptions import APIError, DataFetchError
import os
from dotenv import load_dotenv

load_dotenv()

class SolanaClient(BaseBlockchainClient):
    def __init__(self, api_url: str = None, api_key: str = None):
        self.api_url = api_url or os.getenv("SOLANA_API_URL")
        self.api_key = api_key or os.getenv("SOLANA_API_KEY")
        self.session = requests.Session()
        
    def get_current_price(self, token_address: str = None) -> float:
        """
        Get current price of SOL or a specific SPL token.
        
        Args:
            token_address: Optional SPL token mint address
            
        Returns:
            Current price in USD
        """
        if token_address is None:
            # Get SOL price
            # For Solana, we'll use Pyth Network or similar oracle services
            url = "https://pyth.network/price_feeds"
            try:
                response = self.session.get(url)
                response.raise_for_status()
                data = response.json()
                
                # Find SOL/USD price feed
                for feed in data:
                    if feed["symbol"] == "Crypto.SOL/USD":
                        return float(feed["price"]["price"])
                
                # Fallback to CoinGecko if Pyth doesn't have SOL data
                return self._get_price_from_coingecko("solana")
                
            except requests.exceptions.RequestException as e:
                # Fallback to CoinGecko
                return self._get_price_from_coingecko("solana")
            except (KeyError, ValueError) as e:
                # Fallback to CoinGecko
                return self._get_price_from_coingecko("solana")
        else:
            # Get SPL token price
            # For SPL tokens, we'll use Jupiter API or similar
            return self._get_spl_token_price(token_address)
    
    def _get_price_from_coingecko(self, coin_id: str) -> float:
        """
        Get price from CoinGecko API.
        
        Args:
            coin_id: CoinGecko coin ID
            
        Returns:
            Current price in USD
        """
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if coin_id in data and "usd" in data[coin_id]:
                return float(data[coin_id]["usd"])
            else:
                raise DataFetchError(f"Price data not found for {coin_id}")
                
        except requests.exceptions.RequestException as e:
            raise DataFetchError(f"Failed to fetch price from CoinGecko: {str(e)}")
        except (KeyError, ValueError) as e:
            raise DataFetchError(f"Failed to parse price data: {str(e)}")
    
    def _get_spl_token_price(self, token_address: str) -> float:
        """
        Get SPL token price using Jupiter API.
        
        Args:
            token_address: SPL token mint address
            
        Returns:
            Current price in USD
        """
        # First, get token info from Jupiter
        url = f"https://quote-api.jup.ag/v6/tokens"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Find the token by address
            token_info = None
            for token in data["data"]:
                if token["address"] == token_address:
                    token_info = token
                    break
            
            if token_info is None:
                raise DataFetchError(f"Token not found: {token_address}")
            
            # Get price using Jupiter quote API
            quote_url = f"https://quote-api.jup.ag/v6/quote?inputMint={token_address}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC mint address
            quote_response = self.session.get(quote_url)
            quote_response.raise_for_status()
            quote_data = quote_response.json()
            
            if "data" not in quote_data or len(quote_data["data"]) == 0:
                # Fallback to CoinGecko using the token symbol
                return self._get_price_from_coingecko(token_info["symbol"].lower())
            
            # Calculate price from the quote
            input_amount = float(quote_data["data"][0]["inAmount"]) / (10 ** token_info["decimals"])
            output_amount = float(quote_data["data"][0]["outAmount"]) / (10 ** 6)  # USDC has 6 decimals
            
            return output_amount / input_amount
            
        except requests.exceptions.RequestException as e:
            # Fallback to CoinGecko using the token symbol if we have it
            if token_info and "symbol" in token_info:
                return self._get_price_from_coingecko(token_info["symbol"].lower())
            raise DataFetchError(f"Failed to fetch SPL token price: {str(e)}")
        except (KeyError, ValueError, ZeroDivisionError) as e:
            # Fallback to CoinGecko using the token symbol if we have it
            if token_info and "symbol" in token_info:
                return self._get_price_from_coingecko(token_info["symbol"].lower())
            raise DataFetchError(f"Failed to parse SPL token price data: {str(e)}")
    
    def get_historical_prices(self, token_address: str = None, days: int = 30) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices for SOL or a specific SPL token.
        
        Args:
            token_address: Optional SPL token mint address
            days: Number of days of historical data to retrieve
            
        Returns:
            List of dictionaries with timestamp and price
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        if token_address is None:
            # Get SOL historical price
            return self._get_sol_historical_prices(start_date, end_date)
        else:
            # Get SPL token historical price
            return self._get_spl_token_historical_prices(token_address, start_date, end_date)
    
    def _get_sol_historical_prices(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices for SOL using Pyth Network or CoinGecko.
        
        Args:
            start_date: Start date for historical data
            end_date: End date for historical data
            
        Returns:
            List of dictionaries with timestamp and price
        """
        # Try to get data from Pyth Network first
        try:
            # Pyth Network historical data API
            url = f"https://pyth.network/price_feeds/Crypto.SOL/USD/history?from={int(start_date.timestamp())}&to={int(end_date.timestamp())}&resolution=1D"
            
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if "data" not in data or len(data["data"]) == 0:
                # Fallback to CoinGecko
                return self._get_historical_prices_from_coingecko("solana", start_date, end_date)
            
            result = []
            for item in data["data"]:
                result.append({
                    "timestamp": datetime.fromtimestamp(item["timestamp"]).isoformat(),
                    "price": float(item["price"])
                })
                
            return result
            
        except requests.exceptions.RequestException as e:
            # Fallback to CoinGecko
            return self._get_historical_prices_from_coingecko("solana", start_date, end_date)
        except (KeyError, ValueError) as e:
            # Fallback to CoinGecko
            return self._get_historical_prices_from_coingecko("solana", start_date, end_date)
    
    def _get_spl_token_historical_prices(self, token_address: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices for SPL token using CoinGecko or other sources.
        
        Args:
            token_address: SPL token mint address
            start_date: Start date for historical data
            end_date: End date for historical data
            
        Returns:
            List of dictionaries with timestamp and price
        """
        # First, try to get token info from Jupiter to get the symbol
        try:
            url = f"https://quote-api.jup.ag/v6/tokens"
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Find the token by address
            token_info = None
            for token in data["data"]:
                if token["address"] == token_address:
                    token_info = token
                    break
            
            if token_info is None:
                raise DataFetchError(f"Token not found: {token_address}")
            
            # Get historical prices from CoinGecko using the token symbol
            return self._get_historical_prices_from_coingecko(token_info["symbol"].lower(), start_date, end_date)
            
        except requests.exceptions.RequestException as e:
            raise DataFetchError(f"Failed to fetch SPL token historical prices: {str(e)}")
        except (KeyError, ValueError) as e:
            raise DataFetchError(f"Failed to parse SPL token historical price data: {str(e)}")
    
    def _get_historical_prices_from_coingecko(self, coin_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Union[str, float]]]:
        """
        Get historical prices from CoinGecko API.
        
        Args:
            coin_id: CoinGecko coin ID
            start_date: Start date for historical data
            end_date: End date for historical data
            
        Returns:
            List of dictionaries with timestamp and price
        """
        days = (end_date - start_date).days
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days={days}"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if "prices" not in data or len(data["prices"]) == 0:
                raise DataFetchError(f"Historical price data not found for {coin_id}")
            
            result = []
            for item in data["prices"]:
                timestamp = datetime.fromtimestamp(item[0] / 1000).isoformat()
                price = float(item[1])
                
                # Only include data within the requested date range
                item_date = datetime.fromisoformat(timestamp)
                if start_date <= item_date <= end_date:
                    result.append({
                        "timestamp": timestamp,
                        "price": price
                    })
                
            return result
            
        except requests.exceptions.RequestException as e:
            raise DataFetchError(f"Failed to fetch historical prices from CoinGecko: {str(e)}")
        except (KeyError, ValueError) as e:
            raise DataFetchError(f"Failed to parse historical price data: {str(e)}")
    
    def get_token_info(self, token_address: str) -> Dict[str, str]:
        """
        Get information about an SPL token.
        
        Args:
            token_address: SPL token mint address
            
        Returns:
            Dictionary with token information
        """
        # Get token info from Jupiter
        url = f"https://quote-api.jup.ag/v6/tokens"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Find the token by address
            for token in data["data"]:
                if token["address"] == token_address:
                    return {
                        "name": token.get("name", ""),
                        "symbol": token.get("symbol", ""),
                        "decimals": int(token.get("decimals", 0)),
                        "address": token.get("address", ""),
                        "logo_uri": token.get("logoURI", "")
                    }
            
            raise DataFetchError(f"Token not found: {token_address}")
            
        except requests.exceptions.RequestException as e:
            raise DataFetchError(f"Failed to fetch token info from Jupiter: {str(e)}")
        except (KeyError, ValueError) as e:
            raise DataFetchError(f"Failed to parse token info: {str(e)}")