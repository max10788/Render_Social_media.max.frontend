import os
import importlib
from typing import List, Dict
from app.core.solana_tracker.models.transaction import TransactionDetail
from app.core.solana_tracker.rules.base import ScenarioRule

class ScenarioDetector:
    def __init__(self, rules_dir: str = "app/core/solana_tracker/rules"):
        self.rules = self._load_rules(rules_dir)
    
    def _load_rules(self, rules_dir: str) -> List[ScenarioRule]:
        rules = []
        for filename in os.listdir(rules_dir):
            if filename.endswith(".py") and filename != "base.py" and not filename.startswith("__"):
                module_name = f"{rules_dir.replace('/', '.')}.{filename[:-3]}"
                module = importlib.import_module(module_name)
                for item in dir(module):
                    obj = getattr(module, item)
                    if isinstance(obj, type) and issubclass(obj, ScenarioRule) and obj is not ScenarioRule:
                        rules.append(obj())
        return rules

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
