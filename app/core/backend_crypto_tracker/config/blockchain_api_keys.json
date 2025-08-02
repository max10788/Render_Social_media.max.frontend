# app/core/backend_crypto_tracker/config.py (Ergänzung)

class CustomAnalysisConfig:
    def __init__(self):
        self.enabled = os.getenv('ENABLE_CUSTOM_ANALYSIS', 'true').lower() == 'true'
        self.save_results = os.getenv('SAVE_CUSTOM_ANALYSIS', 'true').lower() == 'true'
        self.max_analyses_per_hour = int(os.getenv('MAX_CUSTOM_ANALYSES_PER_HOUR', 50))
        self.cache_ttl = int(os.getenv('CUSTOM_ANALYSIS_CACHE_TTL', 3600))
        
        # Chain configurations
        self.solana_config = {
            'rpc_url': os.getenv('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
            'helius_api_key': os.getenv('HELIUS_API_KEY'),
            'min_score': int(os.getenv('SOLANA_MIN_SCORE', 50))
        }
        
        self.sui_config = {
            'rpc_url': os.getenv('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443'),
            'explorer_api_key': os.getenv('SUI_EXPLORER_API_KEY'),
            'min_score': int(os.getenv('SUI_MIN_SCORE', 45))
        }
        
        self.ethereum_config = {
            'min_score': int(os.getenv('ETHEREUM_MIN_SCORE', 60))
        }
        
        self.bsc_config = {
            'min_score': int(os.getenv('BSC_MIN_SCORE', 55))
        }

class ChainConfig:
    SUPPORTED_CHAINS = ['ethereum', 'bsc', 'solana', 'sui']
    
    @classmethod
    def is_supported(cls, chain: str) -> bool:
        return chain.lower() in cls.SUPPORTED_CHAINS
    
    @classmethod
    def get_chain_info(cls, chain: str) -> dict:
        chain_info = {
            'ethereum': {
                'name': 'Ethereum',
                'symbol': 'ETH',
                'explorer': 'https://etherscan.io',
                'rpc_type': 'evm'
            },
            'bsc': {
                'name': 'Binance Smart Chain',
                'symbol': 'BNB',
                'explorer': 'https://bscscan.com',
                'rpc_type': 'evm'
            },
            'solana': {
                'name': 'Solana',
                'symbol': 'SOL',
                'explorer': 'https://solscan.io',
                'rpc_type': 'solana'
            },
            'sui': {
                'name': 'Sui',
                'symbol': 'SUI',
                'explorer': 'https://suiexplorer.com',
                'rpc_type': 'sui'
            }
        }
        return chain_info.get(chain.lower(), {})
