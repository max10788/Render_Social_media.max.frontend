# config/blockchain_api_keys.py
import os
from typing import Dict, Optional, Any
from dataclasses import dataclass, field

@dataclass
class ChainConfig:
    SUPPORTED_CHAINS = ['ethereum', 'bsc', 'solana', 'sui']
    
    # Chain-spezifische Konfigurationen
    chain_configs: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        'ethereum': {
            'name': 'Ethereum',
            'symbol': 'ETH',
            'explorer': 'https://etherscan.io',
            'rpc_type': 'evm',
            'min_score': 60
        },
        'bsc': {
            'name': 'Binance Smart Chain',
            'symbol': 'BNB',
            'explorer': 'https://bscscan.com',
            'rpc_type': 'evm',
            'min_score': 55
        },
        'solana': {
            'name': 'Solana',
            'symbol': 'SOL',
            'explorer': 'https://solscan.io',
            'rpc_type': 'solana',
            'min_score': 50,
            'rpc_url': 'https://api.mainnet-beta.solana.com',
            'helius_api_key': None
        },
        'sui': {
            'name': 'Sui',
            'symbol': 'SUI',
            'explorer': 'https://suiexplorer.com',
            'rpc_type': 'sui',
            'min_score': 45,
            'rpc_url': 'https://fullnode.mainnet.sui.io:443',
            'explorer_api_key': None
        }
    })
    
    def __post_init__(self):
        self._load_from_env()
    
    def _load_from_env(self):
        # Solana Konfiguration
        if 'solana' in self.chain_configs:
            self.chain_configs['solana']['rpc_url'] = os.getenv(
                'SOLANA_RPC_URL', 
                self.chain_configs['solana']['rpc_url']
            )
            self.chain_configs['solana']['helius_api_key'] = os.getenv(
                'HELIUS_API_KEY',
                self.chain_configs['solana']['helius_api_key']
            )
            self.chain_configs['solana']['min_score'] = int(os.getenv(
                'SOLANA_MIN_SCORE',
                self.chain_configs['solana']['min_score']
            ))
        
        # Sui Konfiguration
        if 'sui' in self.chain_configs:
            self.chain_configs['sui']['rpc_url'] = os.getenv(
                'SUI_RPC_URL',
                self.chain_configs['sui']['rpc_url']
            )
            self.chain_configs['sui']['explorer_api_key'] = os.getenv(
                'SUI_EXPLORER_API_KEY',
                self.chain_configs['sui']['explorer_api_key']
            )
            self.chain_configs['sui']['min_score'] = int(os.getenv(
                'SUI_MIN_SCORE',
                self.chain_configs['sui']['min_score']
            ))
        
        # Ethereum Konfiguration
        if 'ethereum' in self.chain_configs:
            self.chain_configs['ethereum']['min_score'] = int(os.getenv(
                'ETHEREUM_MIN_SCORE',
                self.chain_configs['ethereum']['min_score']
            ))
        
        # BSC Konfiguration
        if 'bsc' in self.chain_configs:
            self.chain_configs['bsc']['min_score'] = int(os.getenv(
                'BSC_MIN_SCORE',
                self.chain_configs['bsc']['min_score']
            ))
    
    @classmethod
    def is_supported(cls, chain: str) -> bool:
        return chain.lower() in cls.SUPPORTED_CHAINS
    
    def get_chain_info(self, chain: str) -> Dict[str, Any]:
        return self.chain_configs.get(chain.lower(), {})

@dataclass
class CustomAnalysisConfig:
    enabled: bool = True
    save_results: bool = True
    max_analyses_per_hour: int = 50
    cache_ttl: int = 3600
    
    def __post_init__(self):
        self._load_from_env()
    
    def _load_from_env(self):
        self.enabled = os.getenv('ENABLE_CUSTOM_ANALYSIS', 'true').lower() == 'true'
        self.save_results = os.getenv('SAVE_CUSTOM_ANALYSIS', 'true').lower() == 'true'
        self.max_analyses_per_hour = int(os.getenv('MAX_CUSTOM_ANALYSES_PER_HOUR', self.max_analyses_per_hour))
        self.cache_ttl = int(os.getenv('CUSTOM_ANALYSIS_CACHE_TTL', self.cache_ttl))

# Globale Instanzen
chain_config = ChainConfig()
custom_analysis_config = CustomAnalysisConfig()
