import pytest
from unittest.mock import AsyncMock, MagicMock
from decimal import Decimal
from datetime import datetime
from app.core.solana_tracker.blockchain.interfaces import BlockchainConfig
from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository
from app.core.solana_tracker.models.transaction import OperationType

@pytest.fixture
def mock_config():
    return BlockchainConfig(
        chain_id="solana-mainnet",
        name="Solana",
        primary_rpc="https://api.mainnet-beta.solana.com",
        fallback_rpcs=[],
        currency="SOL",
        decimals=9
    )

@pytest.fixture
def repository(mock_config):
    return EnhancedSolanaRepository(mock_config)

@pytest.mark.asyncio
async def test_get_transaction_native_transfer(repository, monkeypatch):
    mock_response = {
        "jsonrpc": "2.0",
        "id": 1,
        "result": {
            "blockTime": 1633024800,
            "meta": {
                "err": None,
                "fee": 5000,
                "preBalances": [1000000000, 2000000000, 5000],
                "postBalances": [999995000, 2000000000, 5000],
                "logMessages": [],
            },
            "transaction": {
                "message": {
                    "accountKeys": ["sender_address", "receiver_address", "system_program_address"],
                    "instructions": [{"programIdIndex": 2}],
                },
                "signatures": ["test_signature"],
            },
        },
    }

    mock_async_client = AsyncMock()
    mock_async_client.post.return_value = MagicMock(status_code=200, json=lambda: mock_response)
    monkeypatch.setattr("httpx.AsyncClient", lambda: mock_async_client)

    tx = await repository.get_transaction("test_signature")

    assert tx.tx_hash == "test_signature"
    assert tx.from_address == "sender_address"
    assert tx.to_address == "receiver_address"
    assert tx.fee == Decimal("0.000005")
    assert len(tx.operations) == 1
    assert tx.operations[0].type == OperationType.TRANSFER
    assert tx.operations[0].from_address == "sender_address"
    assert tx.operations[0].to_address == "receiver_address"
    assert tx.operations[0].value == Decimal("0.000005")

@pytest.mark.asyncio
async def test_get_transaction_spl_token_transfer(repository, monkeypatch):
    mock_response = {
        "jsonrpc": "2.0",
        "id": 1,
        "result": {
            "blockTime": 1633024800,
            "meta": {
                "err": None,
                "fee": 5000,
                "preBalances": [1000000000, 0, 0],
                "postBalances": [999995000, 0, 0],
                "logMessages": ["Program log: Instruction: Transfer"],
                "innerInstructions": [],
                "preTokenBalances": [
                    {"accountIndex": 1, "mint": "token_mint_address", "uiTokenAmount": {"uiAmount": 100}},
                    {"accountIndex": 2, "mint": "token_mint_address", "uiTokenAmount": {"uiAmount": 0}},
                ],
                "postTokenBalances": [
                    {"accountIndex": 1, "mint": "token_mint_address", "uiTokenAmount": {"uiAmount": 90}},
                    {"accountIndex": 2, "mint": "token_mint_address", "uiTokenAmount": {"uiAmount": 10}},
                ],
            },
            "transaction": {
                "message": {
                    "accountKeys": ["sender_address", "sender_token_account", "receiver_token_account", "TokenkegQfeZyiNwAJbNbGKL61KC715e85e6d735"],
                    "instructions": [{"programIdIndex": 3}],
                },
                "signatures": ["test_signature"],
            },
        },
    }

    mock_async_client = AsyncMock()
    mock_async_client.post.return_value = MagicMock(status_code=200, json=lambda: mock_response)
    monkeypatch.setattr("httpx.AsyncClient", lambda: mock_async_client)

    tx = await repository.get_transaction("test_signature")

    assert tx.tx_hash == "test_signature"
    assert tx.fee == Decimal("0.000005")
    assert len(tx.operations) > 0

    token_transfer_op = next((op for op in tx.operations if op.type == OperationType.TOKEN_TRANSFER), None)
    assert token_transfer_op is not None
    assert token_transfer_op.contract_address == "TokenkegQfeZyiNwAJbNbGKL61KC715e85e6d735"
    # Note: from_address, to_address, and value parsing for token transfers is not yet implemented.
    # This test just verifies that the operation is identified.

@pytest.mark.asyncio
async def test_get_transaction_contract_call(repository, monkeypatch):
    mock_response = {
        "jsonrpc": "2.0",
        "id": 1,
        "result": {
            "blockTime": 1633024800,
            "meta": {
                "err": None,
                "fee": 5000,
                "preBalances": [1000000000, 0],
                "postBalances": [999995000, 0],
                "logMessages": [],
            },
            "transaction": {
                "message": {
                    "accountKeys": ["user_address", "some_program_address"],
                    "instructions": [{"programIdIndex": 1, "data": "instruction_data"}],
                },
                "signatures": ["test_signature"],
            },
        },
    }

    mock_async_client = AsyncMock()
    mock_async_client.post.return_value = MagicMock(status_code=200, json=lambda: mock_response)
    monkeypatch.setattr("httpx.AsyncClient", lambda: mock_async_client)

    tx = await repository.get_transaction("test_signature")

    assert tx.tx_hash == "test_signature"
    assert len(tx.operations) > 0

    contract_call_op = next((op for op in tx.operations if op.type == OperationType.CONTRACT_CALL), None)
    assert contract_call_op is not None
    assert contract_call_op.contract_address == "some_program_address"
    assert contract_call_op.from_address == "user_address"
