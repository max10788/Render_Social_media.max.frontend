from decimal import Decimal
from typing import Dict
from app.core.solana_tracker.models.transaction import TransactionDetail
from app.core.solana_tracker.rules.base import ScenarioRule

class FlashloanRule(ScenarioRule):
    type = "flashloan"
    confidence = 0.85

    def matches(self, tx: TransactionDetail) -> bool:
        # A flashloan is suspected if a large value is borrowed and returned in the same transaction
        return (tx.value > Decimal("1000") and
                any(op.type == "contract_call" and op.value > tx.value * Decimal("0.9")
                    for op in tx.operations))

    def get_metadata(self, tx: TransactionDetail) -> Dict:
        return {
            "total_value": str(tx.value),
            "contract_interactions": len([op for op in tx.operations if op.type == "contract_call"]),
            "risk_level": "high"
        }
