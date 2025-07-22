import pytest
from unittest.mock import MagicMock, AsyncMock
from decimal import Decimal
from app.core.solana_tracker.blockchain.interfaces import BlockchainConfig
from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository
from app.core.solana_tracker.repositories.cache import RedisCache

@pytest.fixture
def solana_config():
    return BlockchainConfig(
        chain_id="solana",
        name="Solana",
        primary_rpc="https://api.mainnet-beta.solana.com",
        fallback_rpcs=[],
        currency="SOL",
        decimals=9
    )

@pytest.fixture
def redis_cache():
    return MagicMock(spec=RedisCache)

@pytest.mark.asyncio
async def test_get_transaction(solana_config, redis_cache):
    # Arrange
    tx_hash = "some_tx_hash"
    mock_response = {
        "result": {
            "transaction": {
                "signatures": [tx_hash],
                "message": {
                    "accountKeys": [{"pubkey": "from_address"}, {"pubkey": "to_address"}],
                    "instructions": []
                }
            },
            "meta": {
                "preBalances": [1000000000],
                "postBalances": [900000000],
                "fee": 5000,
                "err": None
            },
            "blockTime": 1633027200
        }
    }

    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=MagicMock(status_code=200, json=lambda: mock_response))

    repo = EnhancedSolanaRepository(solana_config, redis_cache)
    repo.client = mock_client
    redis_cache.get = AsyncMock(return_value=None)

    # Act
    tx = await repo.get_transaction(tx_hash)

    # Assert
    assert tx is not None
    assert tx.tx_hash == tx_hash
    assert tx.from_address == "from_address"
    assert tx.to_address == "to_address"
    assert tx.value == Decimal("-0.1")
    assert tx.fee == Decimal("0.000005")
    redis_cache.set.assert_called_once()
