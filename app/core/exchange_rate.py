# app/core/exchange_rate.py

import aiohttp
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class CoinGeckoExchangeRate:
    def __init__(self, session: aiohttp.ClientSession):
        self.session = session
        self.base_url = "https://api.coingecko.com/api/v3 "

    async def get_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        params = {
            "ids": from_currency.lower(),
            "vs_currencies": to_currency.lower()
        }

        try:
            async with self.session.get(f"{self.base_url}/simple/price", params=params) as response:
                if response.status != 200:
                    raise ValueError(f"Failed to fetch exchange rate (status {response.status})")

                data = await response.json()

                rate = data.get(from_currency.lower(), {}).get(to_currency.lower())
                if not rate:
                    raise ValueError(f"No exchange rate found for {from_currency} → {to_currency}")

                return float(rate)

        except Exception as e:
            logger.warning(f"CoinGecko error: {e}. Using fallback exchange rate of 1.0")
            return 1.0
