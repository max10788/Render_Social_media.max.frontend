import pytest
from app.core.solana_tracker.services.scenario_detector import ScenarioDetector
from app.core.solana_tracker.models.transaction import TransactionDetail, OperationDetail, OperationType
from decimal import Decimal

@pytest.fixture
def flashloan_tx():
    return TransactionDetail(
        tx_hash="flashloan_tx",
        value=Decimal("2000"),
        operations=[
            OperationDetail(
                type=OperationType.CONTRACT_CALL,
                value=Decimal("1900")
            )
        ]
    )

def test_scenario_detector(flashloan_tx):
    # Arrange
    detector = ScenarioDetector(rules_dir="app/core/solana_tracker/rules")

    # Act
    scenarios = detector.detect_scenarios([flashloan_tx])

    # Assert
    assert len(scenarios) == 1
    assert scenarios[0]["type"] == "flashloan"
    assert scenarios[0]["tx_hash"] == "flashloan_tx"
