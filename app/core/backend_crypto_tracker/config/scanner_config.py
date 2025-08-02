# config/scanner_config.py

import os

# Konfiguration für den Wallet-Scanner
WALLET_CLASSIFIER_CONFIG = {
    'cache_ttl': int(os.getenv('WALLET_CLASSIFIER_CACHE_TTL', 3600)),  # 1 Stunde
    'confidence_thresholds': {
        'high': 0.85,
        'medium': 0.65,
        'low': 0.45
    }
}

# Konfiguration für On-Chain-Analysen
ONCHAIN_ANALYSIS_CONFIG = {
    'dex_signatures': {
        'swap': '0x128acb08',
        'addLiquidity': '0xe8e33700',
        'removeLiquidity': '0xbaa2abde',
        'getReserves': '0x0902f1ac',
        'factory': '0xc45a0155',
        'token0': '0x0dfe1681',
        'token1': '0xd21220a7',
        'mint': '0x6a627842',
        'burn': '0x89afcb44',
        'sync': '0xfff6cae9',
        'skim': '0xbc25cf77'
    },
    'cex_patterns': {
        'high_tx_count': 10000,
        'frequent_deposits': True,
        'batch_withdrawals': True,
        'round_amounts': True,
        'multiple_tokens': True,
        'gas_optimization': True,
        'withdrawal_sequences': True,
        'deposit_clustering': True
    },
    'dev_patterns': {
        'owner_function': '0x8da5cb5b',
        'minter_role': 'MINTER_ROLE',
        'admin_role': 'DEFAULT_ADMIN_ROLE',
        'early_transactions': True,
        'large_initial_balance': True,
        'team_vesting': True,
        'contract_deployment': True,
        'governance_participation': True,
        'multi_sig_operations': True
    },
    'lp_patterns': {
        'add_liquidity_calls': True,
        'remove_liquidity_calls': True,
        'lp_token_holdings': True,
        'yield_farming': True,
        'impermanent_loss_behavior': True
    },
    'rugpull_patterns': {
        'sudden_large_withdrawals': True,
        'liquidity_removal': True,
        'token_dumping': True,
        'contract_abandonment': True,
        'honeypot_behavior': True
    }
}

# Konfiguration für Quellen-Gewichtung
SOURCE_WEIGHTS = {
    'ChainanalysisIntegration': 0.4,
    'EllipticIntegration': 0.35,
    'CommunityLabelsAPI': 0.15,
    'OnChainAnalyzer': 0.25,
    'InternalLogic': 0.3
}

# RPC und API Konfigurationen
def load_config():
    return {
        'ethereum_rpc': os.getenv('ETHEREUM_RPC_URL', 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
        'bsc_rpc': os.getenv('BSC_RPC_URL', 'https://bsc-dataseed.binance.org/'),
        'solana_rpc': os.getenv('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
        'sui_rpc': os.getenv('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443'),
        'etherscan_api_key': os.getenv('ETHERSCAN_API_KEY', 'YOUR_ETHERSCAN_KEY'),
        'bscscan_api_key': os.getenv('BSCSCAN_API_KEY', 'YOUR_BSCSCAN_KEY'),
        'coingecko_api_key': os.getenv('COINGECKO_API_KEY', None), # Optional Pro Key
        'helius_api_key': os.getenv('HELIUS_API_KEY'),
        'sui_explorer_api_key': os.getenv('SUI_EXPLORER_API_KEY'),
        # Bekannte Contract-Adressen
        'known_contracts': {
            'uniswap_v2_router': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            'uniswap_v3_router': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            'pancakeswap_router': '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            'burn_addresses': ['0x0000000000000000000000000000000000000000',
                             '0x000000000000000000000000000000000000dead']
        },
        # CEX Wallets (bekannte Börsen-Wallets)
        'cex_wallets': {
            'binance': ['0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
                       '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', # BSC Binance
                       '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF'],
            'coinbase': ['0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
                        '0x503828976D22510aad0201ac7EC88293211D23Da'],
            'kraken': ['0x2910543af39aba0cd09dbb2d50200b3e800a63d2']
        },
        # Chain-spezifische Mindestscores
        'min_scores': {
            'ethereum': int(os.getenv('ETHEREUM_MIN_SCORE', 60)),
            'bsc': int(os.getenv('BSC_MIN_SCORE', 55)),
            'solana': int(os.getenv('SOLANA_MIN_SCORE', 50)),
            'sui': int(os.getenv('SUI_MIN_SCORE', 45))
        }
    }
