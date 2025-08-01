# app/core/backend_crypto_tracker/workers/scanner_worker.py
import asyncio
from ..scanner import token_analyzer # For LowCapAnalyzer
# Consider using a proper config loader
# from ..config import scanner_config

async def main():
    # config = scanner_config.load_config() # Load from file/env
    config = {
        'ethereum_rpc': 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        'bsc_rpc': 'https://bsc-dataseed.binance.org/',
        'etherscan_api_key': 'YOUR_ETHERSCAN_KEY',
        'bscscan_api_key': 'YOUR_BSCSCAN_KEY',
        'coingecko_api_key': None  # Optional Pro Key
    }
    async with token_analyzer.LowCapAnalyzer(config) as analyzer:
        results = await analyzer.scan_low_cap_tokens(max_tokens=10)
        # Exportiere Ergebnisse (z.B. in DB, JSON, Log)
        print(f"Analyzed {len(results)} tokens.")
        for result in results:
            print(f"Token: {result['token_data'].name} ({result['token_data'].symbol})")
            print(f"  Score: {result['token_score']:.2f}")
            print(f"  Whales: {result['metrics']['whale_wallets']}")
            print(f"  Devs: {result['metrics']['dev_wallets']}")
            print(f"  Rugpull Suspects: {result['metrics']['rugpull_suspects']}")
            print(f"  Gini: {result['metrics']['gini_coefficient']:.3f}")
            print("-" * 30)

if __name__ == "__main__":
    asyncio.run(main())

