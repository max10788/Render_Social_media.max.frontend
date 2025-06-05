from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field
from decimal import Decimal

class ScenarioType(str, Enum):
    """Types of scenarios that can be detected."""
    delegated_staking = "delegated_staking"
    defi_deposit = "defi_deposit"
    nft_investment = "nft_investment"
    converted_to_stablecoin = "converted_to_stablecoin"
    donation_or_grant = "donation_or_grant"
    cross_chain_bridge = "cross_chain_bridge"
    multi_sig_storage = "multi_sig_storage"
    flash_loan_arbitrage = "flash_loan_arbitrage"
    lost_or_dust = "lost_or_dust"
    returned_to_origin = "returned_to_origin"

class ScenarioRule(BaseModel):
    """Base class for scenario detection rules."""
    type: ScenarioType
    confidence: float = Field(1.0, ge=0.0, le=1.0)
    description: str
    enabled: bool = True

class AddressPattern(BaseModel):
    """Pattern matching for addresses."""
    prefix: Optional[str] = None
    suffix: Optional[str] = None
    exact: Optional[str] = None
    contains: Optional[List[str]] = None

class AmountThreshold(BaseModel):
    """Amount-based detection rules."""
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    dust_threshold: Optional[Decimal] = Field(default=Decimal('0.000001'))

class DeFiProtocol(BaseModel):
    """DeFi protocol identification."""
    name: str
    addresses: List[str]
    program_id: Optional[str] = None

class BridgeInfo(BaseModel):
    """Cross-chain bridge information."""
    name: str
    address_patterns: List[AddressPattern]
    target_chain: str
    protocol: str

class ScenarioDetails(BaseModel):
    """Detailed information about detected scenario."""
    type: ScenarioType
    confidence_score: float
    detection_time: str
    relevant_addresses: List[str]
    metadata: Dict[str, Union[str, int, float, bool]]

class StakingRule(ScenarioRule):
    """Rules for detecting staking operations."""
    type: ScenarioType = ScenarioType.delegated_staking
    validator_addresses: List[str]
    min_stake_amount: Decimal

class DeFiRule(ScenarioRule):
    """Rules for detecting DeFi operations."""
    type: ScenarioType = ScenarioType.defi_deposit
    protocols: List[DeFiProtocol]
    min_transaction_amount: Decimal

class BridgeRule(ScenarioRule):
    """Rules for detecting cross-chain bridges."""
    type: ScenarioType = ScenarioType.cross_chain_bridge
    bridges: List[BridgeInfo]

class NFTRule(ScenarioRule):
    """Rules for detecting NFT transactions."""
    type: ScenarioType = ScenarioType.nft_investment
    marketplace_addresses: List[str]
    marketplace_program_ids: List[str]

class ScenarioConfig(BaseModel):
    """Configuration for scenario detection."""
    rules: List[ScenarioRule]
    max_depth: int = Field(default=10, ge=1, le=100)
    min_confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    
    class Config:
        use_enum_values = True

class DetectedScenario(BaseModel):
    """Result of scenario detection."""
    type: ScenarioType
    confidence: float = Field(..., ge=0.0, le=1.0)
    details: ScenarioDetails
    related_transactions: List[str]
    detection_rules_matched: List[str]
    
    class Config:
        use_enum_values = True
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class ScenarioAnalysis(BaseModel):
    """Complete analysis of detected scenarios."""
    scenarios: List[DetectedScenario]
    analysis_duration: float
    total_transactions_analyzed: int
    detection_timestamp: str
    
    class Config:
        arbitrary_types_allowed = True
