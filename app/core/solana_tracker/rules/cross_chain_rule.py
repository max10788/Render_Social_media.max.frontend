from typing import Dict
from app.core.solana_tracker.models.transaction import TransactionDetail
from app.core.solana_tracker.rules.base import ScenarioRule

class CrossChainRule(ScenarioRule):
    type = "cross_chain"
    confidence = 0.95

    def matches(self, tx: TransactionDetail) -> bool:
        return any(op.type == "cross_chain" for op in tx.operations)

    def get_metadata(self, tx: TransactionDetail) -> Dict:
        cross_ops = [op for op in tx.operations if op.type == "cross_chain"]
        return {
            "bridges_used": list(set(op.raw_data.get("bridge") for op in cross_ops)),
            "target_chains": list(set(op.raw_data.get("target_chain") for op in cross_ops))
        }
