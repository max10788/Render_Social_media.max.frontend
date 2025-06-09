from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field
from decimal import Decimal

class ScenarioType(str, Enum):
    """Types of scenarios that can be detected."""
    # Investment/Storage Scenarios
    delegated_staking = "delegated_staking"
    liquid_staking = "liquid_staking"
    defi_deposit = "defi_deposit"
    nft_investment = "nft_investment"
    multi_sig_storage = "multi_sig_storage"
    cold_storage = "cold_storage"
    hardware_wallet = "hardware_wallet"
    
    # Conversion/Exchange Scenarios
    converted_to_stablecoin = "converted_to_stablecoin"
    swapped_to_other_token = "swapped_to_other_token"
    cross_chain_bridge = "cross_chain_bridge"
    otc_trade = "otc_trade"
    
    # DeFi Activity Scenarios
    lending_deposit = "lending_deposit"
    liquidity_provision = "liquidity_provision"
    yield_farming = "yield_farming"
    flash_loan_arbitrage = "flash_loan_arbitrage"
    
    # Program Interaction Scenarios
    smart_contract_interaction = "smart_contract_interaction"
    program_owned_account = "program_owned_account"
    program_derived_address = "program_derived_address"
    
    # Special Cases
    donation_or_grant = "donation_or_grant"
    lost_or_dust = "lost_or_dust"
    burned = "burned"
    frozen = "frozen"
    
    # Transaction Status
    failed_transaction = "failed_transaction"
    pending_validation = "pending_validation"
    returned_to_origin = "returned_to_origin"
    
    # Governance/DAO
    dao_vote_escrow = "dao_vote_escrow"
    governance_deposit = "governance_deposit"
    
    # Time-based Scenarios
    time_locked = "time_locked"
    vesting_schedule = "vesting_schedule"
    
    # Security/Risk Scenarios
    suspicious_activity = "suspicious_activity"
    blacklisted_address = "blacklisted_address"
    sanctioned_address = "sanctioned_address"

class ScenarioDetails(BaseModel):
    """Detailed information about detected scenario."""
    type: ScenarioType
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    detection_time: str
    relevant_addresses: List[str]
    metadata: Dict[str, Union[str, int, float, bool]]
    is_terminal: bool = Field(
        default=False, 
        description="Indicates if this scenario represents an end state"
    )
    expected_duration: Optional[str] = Field(
        default=None,
        description="Expected duration if temporary (e.g. '14 days' for staking)"
    )
    can_be_recovered: bool = Field(
        default=True,
        description="Indicates if funds can be recovered/accessed later"
    )
    user_action_required: bool = Field(
        default=False,
        description="Indicates if user action is needed to proceed"
    )
    risk_level: str = Field(
        default="low",
        regex="^(low|medium|high|critical)$"
    )

class ScenarioRule(BaseModel):
    """Base class for scenario detection rules."""
    type: ScenarioType
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    description: str
    enabled: bool = True
    program_ids: Optional[List[str]] = None
    address_patterns: Optional[List[str]] = None
    amount_thresholds: Optional[AmountThreshold] = None
    is_terminal: bool = False
    metadata_requirements: Optional[Dict[str, Any]] = None

class DetectedScenario(BaseModel):
    """Result of scenario detection."""
    type: ScenarioType
    confidence: float = Field(..., ge=0.0, le=1.0)
    details: ScenarioDetails
    related_transactions: List[str]
    detection_rules_matched: List[str]
    user_message: str = Field(
        description="Human-readable explanation for the user"
    )
    next_steps: Optional[List[str]] = Field(
        default=None,
        description="Suggested actions for the user"
    )
    
    class Config:
        use_enum_values = True
        json_encoders = {
            Decimal: lambda v: str(v)
        }

    @property
    def is_terminal(self) -> bool:
        """Check if this scenario represents an end state."""
        TERMINAL_SCENARIOS = {
            ScenarioType.burned,
            ScenarioType.lost_or_dust,
            ScenarioType.failed_transaction,
            ScenarioType.blacklisted_address,
            ScenarioType.sanctioned_address
        }
        return self.type in TERMINAL_SCENARIOS

    def get_user_guidance(self) -> str:
        """Get user-friendly guidance based on scenario type."""
        guidance_map = {
            ScenarioType.delegated_staking: "Funds are staked and earning rewards. Check validator performance.",
            ScenarioType.lost_or_dust: "Amount too small to recover due to transaction fees.",
            ScenarioType.burned: "Tokens have been permanently removed from circulation.",
            ScenarioType.time_locked: "Funds are locked until the specified time period.",
            # Add more guidance messages...
        }
        return guidance_map.get(self.type, "No specific guidance available for this scenario.")
