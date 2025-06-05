from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta
import logging
from decimal import Decimal
import asyncio
from dataclasses import dataclass

from app.core.solana_tracker.models.transaction import TrackedTransaction
from app.core.solana_tracker.models.scenario import (
    ScenarioType,
    ScenarioConfig,
    DetectedScenario,
    ScenarioDetails,
    DeFiProtocol,
    BridgeInfo
)

logger = logging.getLogger(__name__)

@dataclass
class ScenarioPattern:
    """Pattern definition for scenario detection."""
    type: ScenarioType
    confidence_threshold: float
    pattern_rules: Dict[str, Any]

class ScenarioDetector:
    """Service for detecting transaction patterns and scenarios."""
    
    def __init__(self, config: Optional[ScenarioConfig] = None):
        self.config = config or self._get_default_config()
        self._load_patterns()
        
    def _get_default_config(self) -> ScenarioConfig:
        """Get default scenario detection configuration."""
        return ScenarioConfig(
            rules=[],  # Would be loaded from configuration
            max_depth=10,
            min_confidence=0.8
        )
        
    def _load_patterns(self):
        """Load scenario detection patterns."""
        self.patterns = [
            ScenarioPattern(
                type=ScenarioType.delegated_staking,
                confidence_threshold=0.9,
                pattern_rules={
                    "program_ids": [
                        "Stake11111111111111111111111111111111111111",
                    ],
                    "min_amount": Decimal("0.1"),
                    "lock_period": timedelta(days=1)
                }
            ),
            ScenarioPattern(
                type=ScenarioType.defi_deposit,
                confidence_threshold=0.85,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(
                            name="Raydium",
                            addresses=[
                                "RaydiumProtocolv2.........",
                            ],
                            program_id="RaYdIuMpRoGrAmId..."
                        )
                    ]
                }
            ),
            # Add more patterns...
        ]

    async def detect_scenarios(
        self,
        transactions: List[TrackedTransaction]
    ) -> List[DetectedScenario]:
        """
        Detect scenarios in a chain of transactions.
        
        Args:
            transactions: List of tracked transactions
            
        Returns:
            List[DetectedScenario]: Detected scenarios with details
        """
        if not transactions:
            return []
            
        detected_scenarios: List[DetectedScenario] = []
        
        try:
            # Process each pattern
            for pattern in self.patterns:
                scenario = await self._detect_pattern(pattern, transactions)
                if scenario:
                    detected_scenarios.append(scenario)
                    
            # Post-process scenarios
            detected_scenarios = self._resolve_conflicts(detected_scenarios)
            
            logger.info(
                f"Detected {len(detected_scenarios)} scenarios in "
                f"{len(transactions)} transactions"
            )
            
            return detected_scenarios
            
        except Exception as e:
            logger.error(f"Error detecting scenarios: {e}")
            return []

    async def _detect_pattern(
        self,
        pattern: ScenarioPattern,
        transactions: List[TrackedTransaction]
    ) -> Optional[DetectedScenario]:
        """Detect a specific pattern in transactions."""
        try:
            confidence = 0.0
            matched_txs: Set[str] = set()
            
            if pattern.type == ScenarioType.delegated_staking:
                confidence, matched_txs = self._detect_staking(
                    transactions,
                    pattern.pattern_rules
                )
            elif pattern.type == ScenarioType.defi_deposit:
                confidence, matched_txs = self._detect_defi(
                    transactions,
                    pattern.pattern_rules
                )
            # Add more pattern detections...
            
            if confidence >= pattern.confidence_threshold:
                return DetectedScenario(
                    type=pattern.type,
                    confidence=confidence,
                    details=self._create_scenario_details(
                        pattern.type,
                        transactions,
                        matched_txs
                    ),
                    related_transactions=list(matched_txs),
                    detection_rules_matched=[
                        f"{pattern.type.value}_pattern"
                    ]
                )
                
            return None
            
        except Exception as e:
            logger.error(f"Error detecting pattern {pattern.type}: {e}")
            return None

    def _detect_staking(
        self,
        transactions: List[TrackedTransaction],
        rules: Dict[str, Any]
    ) -> Tuple[float, Set[str]]:
        """Detect staking pattern."""
        confidence = 0.0
        matched_txs = set()
        
        try:
            for tx in transactions:
                # Check for staking program
                if any(
                    program_id in tx.to_wallet
                    for program_id in rules["program_ids"]
                ):
                    # Verify amount
                    if tx.amount >= rules["min_amount"]:
                        confidence = 0.9
                        matched_txs.add(tx.tx_hash)
                        
            return confidence, matched_txs
            
        except Exception as e:
            logger.error(f"Error in staking detection: {e}")
            return 0.0, set()

    def _detect_defi(
        self,
        transactions: List[TrackedTransaction],
        rules: Dict[str, Any]
    ) -> Tuple[float, Set[str]]:
        """Detect DeFi interaction pattern."""
        confidence = 0.0
        matched_txs = set()
        
        try:
            for tx in transactions:
                for protocol in rules["protocols"]:
                    if any(
                        addr in tx.to_wallet
                        for addr in protocol.addresses
                    ):
                        confidence = 0.85
                        matched_txs.add(tx.tx_hash)
                        
            return confidence, matched_txs
            
        except Exception as e:
            logger.error(f"Error in DeFi detection: {e}")
            return 0.0, set()

    def _create_scenario_details(
        self,
        scenario_type: ScenarioType,
        transactions: List[TrackedTransaction],
        matched_txs: Set[str]
    ) -> ScenarioDetails:
        """Create detailed scenario information."""
        try:
            relevant_txs = [
                tx for tx in transactions
                if tx.tx_hash in matched_txs
            ]
            
            return ScenarioDetails(
                type=scenario_type,
                confidence_score=0.9,  # Could be calculated based on patterns
                detection_time=datetime.utcnow().isoformat(),
                relevant_addresses=[
                    tx.to_wallet for tx in relevant_txs
                ],
                metadata=self._create_scenario_metadata(
                    scenario_type,
                    relevant_txs
                )
            )
            
        except Exception as e:
            logger.error(f"Error creating scenario details: {e}")
            return ScenarioDetails(
                type=scenario_type,
                confidence_score=0.0,
                detection_time=datetime.utcnow().isoformat(),
                relevant_addresses=[],
                metadata={}
            )

    def _create_scenario_metadata(
        self,
        scenario_type: ScenarioType,
        transactions: List[TrackedTransaction]
    ) -> Dict[str, Any]:
        """Create scenario-specific metadata."""
        try:
            if scenario_type == ScenarioType.delegated_staking:
                return {
                    "total_staked": sum(tx.amount for tx in transactions),
                    "stake_count": len(transactions),
                    "first_stake": min(tx.timestamp for tx in transactions),
                    "last_stake": max(tx.timestamp for tx in transactions)
                }
            # Add more scenario metadata...
            
            return {}
            
        except Exception as e:
            logger.error(f"Error creating scenario metadata: {e}")
            return {}

    def _resolve_conflicts(
        self,
        scenarios: List[DetectedScenario]
    ) -> List[DetectedScenario]:
        """Resolve conflicts between detected scenarios."""
        if not scenarios:
            return []
            
        # Sort by confidence
        scenarios.sort(key=lambda s: s.confidence, reverse=True)
        
        # Remove overlapping scenarios with lower confidence
        resolved = []
        used_txs = set()
        
        for scenario in scenarios:
            # Check if scenario shares too many transactions with higher confidence scenarios
            overlap = len(set(scenario.related_transactions) & used_txs)
            if overlap / len(scenario.related_transactions) < 0.5:
                resolved.append(scenario)
                used_txs.update(scenario.related_transactions)
                
        return resolved
