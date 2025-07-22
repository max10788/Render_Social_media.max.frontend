import asyncio
import sys
from app.core.solana_tracker.blockchain.interfaces import BlockchainConfig
from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository
from app.core.solana_tracker.repositories.cache import RedisCache
from app.core.solana_tracker.services.chain_tracker import ChainTracker, CrossChainOpFinder, ValueMatchFinder
from app.core.solana_tracker.services.scenario_detector import ScenarioDetector

async def main(tx_hash: str):
    # 1. Configuration
    solana_config = BlockchainConfig(
        chain_id="solana",
        name="Solana",
        primary_rpc="https://api.mainnet-beta.solana.com",
        fallback_rpcs=["https://solana-api.projectserum.com"],
        currency="SOL",
        decimals=9
    )

    # 2. Initialize Components
    redis_cache = RedisCache(redis_url="redis://localhost")
    await redis_cache.connect()

    solana_repo = EnhancedSolanaRepository(config=solana_config, cache=redis_cache)

    chain_tracker = ChainTracker(
        repositories={"solana": solana_repo},
        finders=[CrossChainOpFinder(), ValueMatchFinder()]
    )

    scenario_detector = ScenarioDetector()

    # 3. Track Chain
    print(f"Tracking chain for transaction: {tx_hash}")
    chain_result = await chain_tracker.track_chain(tx_hash)

    print("\n--- Chain Tracking Result ---")
    for item in chain_result["chain"]:
        print(f"  Chain: {item['chain']}, TX: {item['transaction'].tx_hash}")

    # 4. Detect Scenarios
    transactions = [item["transaction"] for item in chain_result["chain"]]
    scenarios = scenario_detector.detect_scenarios(transactions)

    print("\n--- Scenario Detection Result ---")
    if scenarios:
        for scenario in scenarios:
            print(f"  - Type: {scenario['type']}, TX: {scenario['tx_hash']}, Confidence: {scenario['confidence']:.2f}")
            print(f"    Metadata: {scenario['metadata']}")
    else:
        print("  No specific scenarios detected.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python app/main.py <transaction_hash>")
        sys.exit(1)

    tx_hash = sys.argv[1]
    asyncio.run(main(tx_hash))
