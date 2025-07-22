import pytest
from unittest.mock import MagicMock, AsyncMock
from app.core.solana_tracker.services.chain_tracker import ChainTracker, NextTransactionFinder
from app.core.solana_tracker.models.transaction import TransactionDetail

class MockRepo:
    async def get_transaction(self, tx_hash):
        if tx_hash == "tx1":
            return TransactionDetail(tx_hash="tx1", to_address="addr2", value=1.0, operations=[])
        if tx_hash == "tx2":
            return TransactionDetail(tx_hash="tx2", to_address="addr3", value=1.0, operations=[])
        return None

class MockFinder(NextTransactionFinder):
    async def find_next(self, tx, repo):
        if tx.tx_hash == "tx1":
            return "tx2"
        return None

@pytest.mark.asyncio
async def test_track_chain():
    # Arrange
    repo = MockRepo()
    repo.find_transaction = AsyncMock(return_value=(repo, "solana"))

    repositories = {"solana": repo}
    finders = [MockFinder()]

    tracker = ChainTracker(repositories, finders)
    tracker.resolver.find_transaction = AsyncMock(return_value=(repo, "solana"))

    # Act
    result = await tracker.track_chain("tx1")

    # Assert
    assert len(result["chain"]) == 2
    assert result["chain"][0]["transaction"].tx_hash == "tx1"
    assert result["chain"][1]["transaction"].tx_hash == "tx2"
