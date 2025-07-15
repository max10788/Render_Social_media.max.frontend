from enum import Enum
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass
from pydantic import BaseModel, Field

__all__ = [
    'ScenarioType',
    'AddressPattern',
    'AmountThreshold',
    'LargeDepositRule',
    'DeFiProtocol',
    'BridgeInfo',
    'ScenarioDetails',
    'ScenarioRule',
    'StakingRule',
    'DeFiRule',
    'BridgeRule',
    'NFTRule',
    'ScenarioConfig',
    'DetectedScenario',
    'ScenarioAnalysis',
    'ScenarioPattern'
]

class ScenarioType(str, Enum):
    """Types of scenarios that can be detected."""
    # Basic Scenarios
    SIMPLE_TRANSFER = "simple_transfer"
    large_transfer = "large_transfer"
    token_swap = "token_swap"
    delegated_staking = "delegated_staking"
    defi_deposit = "defi_deposit"
    multi_sig_storage = "multi_sig_storage"

    # Investment Scenarios
    nft_investment = "nft_investment"
    cold_storage = "cold_storage"
    hardware_wallet = "hardware_wallet"

    # DeFi Scenarios
    liquidity_provision = "liquidity_provision"
    yield_farming = "yield_farming"
    flash_loan = "flash_loan"
    flash_loan_arbitrage = "flash_loan_arbitrage"
    program_owned_account = "program_owned_account"
    program_derived_address = "program_derived_address"
    swapped_to_other_token = "swapped_to_other_token"

    # Status Scenarios
    failed = "failed"
    pending = "pending"
    completed = "completed"
    failed_transaction = "failed_transaction"
    pending_validation = "pending_validation"
    frozen = "frozen"
    returned_to_origin = "returned_to_origin"
    lost_or_dust = "lost_or_dust"
    burned = "burned"

    # Special Scenarios
    cross_chain_bridge = "cross_chain_bridge"
    governance_participation = "governance_participation"
    donation_or_grant = "donation_or_grant"
    smart_contract_interaction = "smart_contract_interaction"
    wash_trading = "wash_trading"
    reward_claim = "reward_claim"
    flashloan_usage = "flashloan_usage"
    nft_minting = "nft_minting"
    token_launch = "token_launch"
    converted_to_stablecoin = "converted_to_stablecoin"

@dataclass
class AddressPattern:
    """Pattern for matching addresses."""
    pattern: str
    description: str
    confidence: float = 0.8

class LargeDepositRule(BaseModel):
    """Rule for large deposits in DeFi protocols."""
    protocol_name: str
    min_deposit_amount: float
    allowed_tokens: Optional[List[str]] = None
    excluded_addresses: Optional[List[str]] = None
    confidence_score: float = 0.8

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
class BridgeInfo:
    """Information about a cross-chain bridge."""
    name: str
    source_chain: str
    target_chain: str
    contract_addresses: Dict[str, str]
    supported_tokens: List[str]

@dataclass
class ScenarioDetails:
    """Details of a detected scenario."""
    type: ScenarioType
    confidence_score: float
    detection_time: str
    relevant_addresses: List[str]
    metadata: Dict[str, Any]
    user_message: Optional[str] = None
    is_terminal: bool = False
    can_be_recovered: bool = True
    user_action_required: bool = False
    next_steps: List[str] = None

    def __post_init__(self):
        if self.next_steps is None:
            self.next_steps = []

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
    description: Optional[str] = None
    is_terminal: bool = False

@dataclass
class ScenarioRule:
    """Base configuration for scenario detection rules."""
    type: ScenarioType
    confidence_threshold: float = 0.8
    min_amount: Optional[Decimal] = None
    program_ids: List[str] = None
    description: str = ""
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.program_ids is None:
            self.program_ids = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class StakingRule(ScenarioRule):
    """Specific rules for staking detection."""
    min_stake_duration: Optional[timedelta] = None
    validator_addresses: List[str] = None

@dataclass
class DeFiRule(ScenarioRule):
    """Specific rules for DeFi interaction detection."""
    protocols: List[DeFiProtocol] = None
    min_interaction_count: int = 1

@dataclass
class BridgeRule(ScenarioRule):
    """Specific rules for bridge detection."""
    bridge_info: List[BridgeInfo] = None
    required_confirmations: int = 1

@dataclass
class NFTRule(ScenarioRule):
    """Specific rules for NFT detection."""
    marketplaces: List[str] = None
    collection_addresses: List[str] = None

@dataclass
class ScenarioConfig:
    """Configuration for scenario detection."""
    rules: List[Union[ScenarioRule, StakingRule, DeFiRule, BridgeRule, NFTRule]]
    max_depth: int = 10
    min_confidence: float = 0.8
    analysis_timeout: int = 30  # seconds

@dataclass
class ScenarioAnalysis:
    """Complete analysis result."""
    detected_scenarios: List[DetectedScenario]
    analysis_timestamp: str
    total_transactions_analyzed: int
    execution_time: float  # seconds

def create_scenario_details(
    scenario_type: ScenarioType,
    confidence_score: float,
    relevant_addresses: List[str],
    metadata: Dict[str, Any],
    user_message: Optional[str] = None,
    is_terminal: bool = False,
    can_be_recovered: bool = True,
    user_action_required: bool = False,
    next_steps: Optional[List[str]] = None
) -> ScenarioDetails:
    """Helper function to create scenario details."""
    return ScenarioDetails(
        type=scenario_type,
        confidence_score=confidence_score,
        detection_time=datetime.utcnow().isoformat(),
        relevant_addresses=relevant_addresses,
        metadata=metadata,
        user_message=user_message,
        is_terminal=is_terminal,
        can_be_recovered=can_be_recovered,
        user_action_required=user_action_required,
        next_steps=next_steps or []
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
