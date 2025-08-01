# app/core/backend_crypto_tracker/services/eth/etherscan_api.py
import aiohttp
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

async def get_token_holders(session: aiohttp.ClientSession, token_address: str, chain: str = 'ethereum',
                            etherscan_key: Optional[str] = None, bscscan_key: Optional[str] = None,
                            limit: int = 100) -> List[Dict]:
    """Holt die Top Token-Holder von Etherscan oder BscScan"""
    if chain == 'ethereum':
        api_key = etherscan_key
        base_url = "https://api.etherscan.io/api"
    elif chain == 'bsc':
        api_key = bscscan_key
        base_url = "https://api.bscscan.com/api"
    else:
        logger.error(f"Unsupported chain: {chain}")
        return []

    if not api_key:
        logger.error(f"API key missing for {chain}")
        return []

    params = {
        'module': 'token',
        'action': 'tokenholderlist',
        'contractaddress': token_address,
        'page': 1,
        'offset': limit,
        'apikey': api_key
    }
    try:
        async with session.get(base_url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                if data['status'] == '1':
                    return data['result']
                else:
                    logger.warning(f"Keine Holder-Daten für {token_address} auf {chain}: {data.get('message', '')}")
                    return []
            else:
                logger.error(f"{chain} API Fehler beim Abrufen der Holder ({response.status}): {base_url}?{params}")
                return []
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Token-Holder für {token_address} auf {chain}: {e}")
        return []

