from typing import List, Dict
from app.core.models.transaction import TransactionDetail
from app.core.models.scenario import ScenarioType, ScenarioRule

class ScenarioDetector:
    def __init__(self, rules: List[ScenarioRule]):
        self.rules = rules
    
    def detect_scenarios(self, transactions: List[TransactionDetail]) -> List[Dict]:
        scenarios = []
        
        for tx in transactions:
            for rule in self.rules:
                if rule.matches(tx):
                    scenarios.append({
                        "type": rule.type,
                        "tx_hash": tx.tx_hash,
                        "confidence": rule.confidence,
                        "metadata": rule.get_metadata(tx)
                    })
        
        return scenarios

# Beispiel für eine Flashloan-Regel
class FlashloanRule:
    type = "flashloan"
    confidence = 0.85
    
    def matches(self, tx: TransactionDetail) -> bool:
        return (tx.value > Decimal("1000") and 
                any(op.type == "contract_call" and op.value > tx.value * Decimal("0.9") 
                    for op in tx.operations))
    
    def get_metadata(self, tx: TransactionDetail) -> Dict:
        return {
            "total_value": str(tx.value),
            "contract_interactions": len([op for op in tx.operations if op.type == "contract_call"]),
            "risk_level": "high"
        }

# Beispiel für eine Cross-Chain-Regel
class CrossChainRule:
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
