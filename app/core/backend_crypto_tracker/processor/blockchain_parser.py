"""
Chain-agnostischer Parser – delegiert an spezifische Sub-Parser.
"""
import logging
from typing import Dict, Any
from services.eth.contract_parser import EVMParser
from services.sol.solana_api import SolanaParser
from services.sui.sui_api import SuiParser

logger = logging.getLogger(__name__)

class BlockchainParser:
    def __init__(self):
        self.parsers = {
            "ethereum": EVMParser(),
            "bsc": EVMParser(),
            "solana": SolanaParser(),
            "sui": SuiParser(),
        }

    async def parse_token(self, chain: str, address: str) -> Dict[str, Any]:
        parser = self.parsers.get(chain.lower())
        if not parser:
            raise ValueError(f"Unsupported chain {chain}")
        return await parser.parse_token(address)

    async def parse_wallet(self, chain: str, address: str) -> Dict[str, Any]:
        parser = self.parsers.get(chain.lower())
        if not parser:
            raise ValueError(f"Unsupported chain {chain}")
        return await parser.parse_wallet(address)
