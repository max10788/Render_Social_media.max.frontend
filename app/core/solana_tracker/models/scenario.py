from enum import Enum
from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field
from decimal import Decimal

__all__ = [
    'ScenarioType',
    'AddressPattern',
    'AmountThreshold',
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
    'ScenarioAnalysis'
]

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
    token_swap = "token_swap"
    cross_chain_bridge = "cross_chain_bridge"
    otc_trade = "otc_trade"
    arbitrage_trade = "arbitrage_trade"
    
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

    # 🔥 Neu hinzugefügt:
    large_transfer = "large_transfer"  # ✅ Für große Transfers [[3]]
    amm_pool_liquidity_addition = "amm_pool_liquidity_addition"  # ✅ Für AMM-Liquiditätseinlage (z.B. Raydium)
    raydium_swap = "raydium_swap"  # ✅ Spezielles Swap-Szenario für Raydium [[2]]

    # ✅ Füge hier deinen neuen Wert hinzu:
    nft_minting = "nft_minting"
    nft_sale = "nft_sale"
    nft_transfer = "nft_transfer"
    nft_listing = "nft_listing"
    nft_bid = "nft_bid"
    nft_collection_launch = "nft_collection_launch"

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

class LargeDepositRule(BaseModel):
    protocol_name: str
    min_deposit_amount: float
    allowed_tokens: Optional[List[str]] = None
    excluded_addresses: Optional[List[str]] = None
    confidence_score: float = 0.8

class DeFiProtocol(BaseModel):
    name: str
    program_id: str
    addresses: Optional[List[str]] = None  # oder default-Wert
    
class BridgeInfo(BaseModel):
    """Cross-chain bridge information."""
    name: str
    address_patterns: List[AddressPattern]
    target_chain: str
    protocol: str

class ScenarioDetails(BaseModel):
    """Detailed information about detected scenario."""
    type: ScenarioType
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    detection_time: str
    relevant_addresses: List[str]
    metadata: Dict[str, Union[str, int, float, bool]]
    is_terminal: bool = Field(default=False)
    expected_duration: Optional[str] = None
    can_be_recovered: bool = Field(default=True)
    user_action_required: bool = Field(default=False)
    risk_level: str = Field(default="low")

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
    user_message: str = Field(default="")
    next_steps: Optional[List[str]] = None
    
    class Config:
        use_enum_values = True
        json_encoders = {
            Decimal: lambda v: str(v)
        }

    @property
    def is_terminal(self) -> bool:
        """Check if this scenario represents an end state."""
        return self.details.is_terminal

class ScenarioAnalysis(BaseModel):
    """Complete analysis of detected scenarios."""
    scenarios: List[DetectedScenario]
    analysis_duration: float
    total_transactions_analyzed: int
    detection_timestamp: str
    
    class Config:
        arbitrary_types_allowed = True
