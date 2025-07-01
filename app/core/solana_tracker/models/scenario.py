from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
from dataclasses import dataclass

class ScenarioType(str, Enum):
    """Types of scenarios that can be detected."""
    # Basic Scenarios
    large_transfer = "large_transfer"
    token_swap = "token_swap"
    delegated_staking = "delegated_staking"
    defi_deposit = "defi_deposit"

    # Investment Scenarios
    nft_investment = "nft_investment"
    cold_storage = "cold_storage"
    hardware_wallet = "hardware_wallet"

    # DeFi Scenarios
    liquidity_provision = "liquidity_provision"
    yield_farming = "yield_farming"
    flash_loan = "flash_loan"

    # Status Scenarios
    failed = "failed"
    pending = "pending"
    completed = "completed"

class AmountThreshold(BaseModel):
    """Model for defining amount thresholds in scenario detection."""
    min_amount: Decimal = Field(..., description="Minimum amount for threshold")
    max_amount: Optional[Decimal] = Field(None, description="Maximum amount for threshold")
    currency: str = Field(..., description="Currency for the threshold (e.g., 'SOL', 'USDC')")
    confidence_level: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="Confidence level for this threshold"
    )

@dataclass
class DeFiProtocol:
    """Information about a DeFi protocol."""
    name: str
    program_id: Optional[str] = None
    addresses: List[str] = None

    def __post_init__(self):
        if self.addresses is None:
            self.addresses = []

@dataclass
class ScenarioDetails:
    """Details of a detected scenario."""
    type: ScenarioType
    confidence_score: float
    detection_time: str
    relevant_addresses: List[str]
    metadata: Dict[str, Any]

@dataclass
class DetectedScenario:
    """Result of scenario detection."""
    type: ScenarioType
    confidence: float
    details: ScenarioDetails
    related_transactions: List[str]
    detection_rules_matched: List[str]

@dataclass
class ScenarioPattern:
    """Pattern definition for scenario detection."""
    type: ScenarioType
    confidence_threshold: float
    pattern_rules: Dict[str, Any]

@dataclass
class ScenarioRule:
    """Base configuration for scenario detection rules."""
    type: ScenarioType
    confidence_threshold: float = 0.8
    min_amount: Optional[Decimal] = None
    program_ids: List[str] = None
    description: str = ""

    def __post_init__(self):
        if self.program_ids is None:
            self.program_ids = []

@dataclass
class ScenarioConfig:
    """Configuration for scenario detection."""
    rules: List[ScenarioRule]
    max_depth: int = 10
    min_confidence: float = 0.8

def create_scenario_details(
    scenario_type: ScenarioType,
    confidence_score: float,
    relevant_addresses: List[str],
    metadata: Dict[str, Any]
) -> ScenarioDetails:
    """Helper function to create scenario details."""
    return ScenarioDetails(
        type=scenario_type,
        confidence_score=confidence_score,
        detection_time=datetime.utcnow().isoformat(),
        relevant_addresses=relevant_addresses,
        metadata=metadata
    )

def create_detected_scenario(
    scenario_type: ScenarioType,
    confidence: float,
    details: ScenarioDetails,
    related_transactions: List[str],
    rules_matched: List[str]
) -> DetectedScenario:
    """Helper function to create detected scenario."""
    return DetectedScenario(
        type=scenario_type,
        confidence=confidence,
        details=details,
        related_transactions=related_transactions,
        detection_rules_matched=rules_matched
    )
