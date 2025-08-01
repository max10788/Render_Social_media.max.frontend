# app/core/backend_crypto_tracker/config/scanner_config.py
# Could load from environment variables or a JSON/YAML file
import os

def load_config():
    return {
        'ethereum_rpc': os.getenv('ETHEREUM_RPC_URL', 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
        'bsc_rpc': os.getenv('BSC_RPC_URL', 'https://bsc-dataseed.binance.org/'),
        'etherscan_api_key': os.getenv('ETHERSCAN_API_KEY', 'YOUR_ETHERSCAN_KEY'),
        'bscscan_api_key': os.getenv('BSCSCAN_API_KEY', 'YOUR_BSCSCAN_KEY'),
        'coingecko_api_key': os.getenv('COINGECKO_API_KEY', None), # Optional Pro Key
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
            'binance': ['0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE'],
            'coinbase': ['0x503828976D22510aad0201ac7EC88293211D23Da'],
            'kraken': ['0x2910543af39aba0cd09dbb2d50200b3e800a63d2']
        }
    }

