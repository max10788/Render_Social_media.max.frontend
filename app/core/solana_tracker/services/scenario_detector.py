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
    BridgeInfo,
    LargeDepositRule
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
        self.patterns = [
            # 1. Token Swap
            ScenarioPattern(
                type=ScenarioType.token_swap,
                confidence_threshold=0.85,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(
                            name="Raydium",
                            program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR",
                            addresses=["4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"]
                        ),
                        DeFiProtocol(
                            name="Orca",
                            program_id="whirLbGkszUak4H2e3FNi9PT1LMxth8mjcLp9wG8s8q",
                            addresses=["orcaEyt5fJZdo11ix8i8re9DpoX6Jvc9coEdidczDhdw2EM"]
                        )
                    ],
                    "min_token_change": 2
                }
            ),
            # 2. NFT Investment
            ScenarioPattern(
                type=ScenarioType.nft_investment,
                confidence_threshold=0.8,
                pattern_rules={
                    "program_ids": ["metaqbxxUerdq28cj1R5qbkaUP8vQV7cD1EmE6Z7eDnQR"],
                    "token_creators": ["MagicEdenNFTCreator", "DigitalEyesNFTCreator"],
                    "min_purchase_amount": Decimal("0.5"),
                    "description": "Erkennt Investitionen in NFTs über bekannte NFT-Marktplätze."
                }
            ),
            # 3. Multi-Sig Storage
            ScenarioPattern(
                type=ScenarioType.multi_sig_storage,
                confidence_threshold=0.9,
                pattern_rules={
                    "program_ids": ["msig111111111111111111111111111111111111111"],
                    "required_signers": 2,
                    "description": "Erkennt Multi-Signature-Wallets basierend auf dem Multisig-Programm."
                }
            ),
            # 4. Cold Storage
            ScenarioPattern(
                type=ScenarioType.cold_storage,
                confidence_threshold=0.85,
                pattern_rules={
                    "max_transaction_frequency": timedelta(days=30),
                    "min_balance_age": timedelta(days=90),
                    "no_interactions_with_programs": True,
                    "description": "Erkennt Wallets, die lange Zeit keine Transaktionen durchgeführt haben."
                }
            ),
            # 5. Hardware Wallet
            ScenarioPattern(
                type=ScenarioType.hardware_wallet,
                confidence_threshold=0.8,
                pattern_rules={
                    "signer_patterns": ["ledger", "trezor", "bitbox"],
                    "description": "Erkennt typische Signaturmuster von Hardware-Wallets."
                }
            ),
            # 6. Swapped to Other Token
            ScenarioPattern(
                type=ScenarioType.swapped_to_other_token,
                confidence_threshold=0.75,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Raydium", program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR"),
                        DeFiProtocol(name="Orca", program_id="whirLbGkszUak4H2e3FNi9PT1LMxth8mjcLp9wG8s8q")
                    ],
                    "min_token_changes": 1,
                    "description": "Erkennt Tokenwechsel ohne klare Absicht wie Arbitrage oder Stablecoin-Konversion."
                }
            ),
            # 7. Yield Farming
            ScenarioPattern(
                type=ScenarioType.yield_farming,
                confidence_threshold=0.8,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Raydium", program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR"),
                        DeFiProtocol(name="Saber", program_id="SabERD2wReHk1VkX8jiwG1Lg5D7i6g8TgPnr6f5qncu")
                    ],
                    "reward_tokens": ["RAY", "SLND", "UXD"],
                    "description": "Erkennt Yield-Farming-Aktivitäten in AMMs mit Token-Rewards."
                }
            ),
            # 8. Flash Loan Arbitrage
            ScenarioPattern(
                type=ScenarioType.flash_loan_arbitrage,
                confidence_threshold=0.85,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Solend", program_id="SLND111111111111111111111111111111111111111"),
                        DeFiProtocol(name="MarginFi", program_id="MrginF5iygv9sp813z7FGpsCL24eq1Z8Gp9az89ueSWf")
                    ],
                    "repaid_within_same_block": True,
                    "swap_count_threshold": 2,
                    "description": "Erkennt Flash Loans, genutzt für Arbitrage zwischen verschiedenen AMMs."
                }
            ),
            # 9. Smart Contract Interaction
            ScenarioPattern(
                type=ScenarioType.smart_contract_interaction,
                confidence_threshold=0.7,
                pattern_rules={
                    "interaction_types": ["instruction_call", "data_write"],
                    "unknown_program_ids": True,
                    "description": "Erkennt generische Interaktionen mit unbekannten oder neuen Smart Contracts."
                }
            ),
            # 10. Program Owned Account
            ScenarioPattern(
                type=ScenarioType.program_owned_account,
                confidence_threshold=0.8,
                pattern_rules={
                    "associated_program_ids": [
                        "RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR",
                        "whirLbGkszUak4H2e3FNi9PT1LMxth8mjcLp9wG8s8q"
                    ],
                    "description": "Erkennt Accounts, die einem DeFi-Protokoll gehören (z. B. Pool-Tokens)."
                }
            ),
            # 11. Program Derived Address (PDA)
            ScenarioPattern(
                type=ScenarioType.program_derived_address,
                confidence_threshold=0.75,
                pattern_rules={
                    "derivation_paths": ["RaydiumPoolState", "StakePoolAuthority"],
                    "description": "Erkennt abgeleitete Adressen von DeFi-Protokollen (PDAs)."
                }
            ),
            # 12. Donation or Grant
            ScenarioPattern(
                type=ScenarioType.donation_or_grant,
                confidence_threshold=0.7,
                pattern_rules={
                    "known_recipients": ["CharityWalletAddress1", "FoundationWalletAddress2"],
                    "no_return_transaction": True,
                    "description": "Erkennt Transfers an gemeinnützige Organisationen oder Förderprojekte."
                }
            ),
            # 13. Lost or Dust
            ScenarioPattern(
                type=ScenarioType.lost_or_dust,
                confidence_threshold=0.7,
                pattern_rules={
                    "min_balance_age": timedelta(days=365),
                    "no_outgoing_transactions": True,
                    "low_balance_threshold": Decimal("0.01"),
                    "description": "Erkennt langfristig inaktive Wallets mit kleiner Balance."
                }
            ),
            # 14. Burned
            ScenarioPattern(
                type=ScenarioType.burned,
                confidence_threshold=0.85,
                pattern_rules={
                    "burn_addresses": [
                        "11111111111111111111111111111111",
                        "burnt11111111111111111111111111111111"
                    ],
                    "description": "Erkennt Token-Burns anhand bekannter Burn-Adressen."
                }
            ),
            # 15. Frozen
            ScenarioPattern(
                type=ScenarioType.frozen,
                confidence_threshold=0.9,
                pattern_rules={
                    "blocked_by_authorities": True,
                    "last_transaction_date": timedelta(days=-30),
                    "description": "Erkennt Accounts, die möglicherweise gesperrt oder eingefroren wurden."
                }
            ),
            # 16. Failed Transaction
            ScenarioPattern(
                type=ScenarioType.failed_transaction,
                confidence_threshold=0.8,
                pattern_rules={
                    "error_codes": [3, 4, 5],
                    "description": "Erkennt gescheiterte Transaktionen aufgrund von Logiken oder Limits."
                }
            ),
            # 17. Pending Validation
            ScenarioPattern(
                type=ScenarioType.pending_validation,
                confidence_threshold=0.7,
                pattern_rules={
                    "time_since_submission": timedelta(seconds=30),
                    "not_yet_confirmed": True,
                    "description": "Erkennt Transaktionen, die noch nicht bestätigt wurden."
                }
            ),
            # 18. Returned to Origin
            ScenarioPattern(
                type=ScenarioType.returned_to_origin,
                confidence_threshold=0.8,
                pattern_rules={
                    "same_sender_receiver": True,
                    "value_change_threshold": Decimal("0.001"),
                    "description": "Erkennt Transfers, die zum Sender zurückgeschickt wurden."
                }
            ),
            # 19. Large Transfer
            ScenarioPattern(
                type=ScenarioType.large_transfer,
                confidence_threshold=0.9,
                pattern_rules={
                    "deposit_patterns": [
                        {
                            "protocol": DeFiProtocol(
                                name="Raydium",
                                program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR",
                                addresses=[
                                    "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                                    "orcaEyt5fJZdo11ix8i8re9DpoX6Jvc9coEdidczDhdw2EM"
                                ]
                            ),
                            "rule": LargeDepositRule(
                                protocol_name="Raydium",
                                min_deposit_amount=10000,
                                allowed_tokens=["SOL", "USDC", "RAY"],
                                excluded_addresses=["exchange_wallet_1", "staking_pool_xyz"],
                                confidence_score=0.92
                            )
                        }
                    ],
                    "description": "Erkennt große Liquiditätseinlagen in Raydium-Pools mit hohem USD-Volumen."
                }
            ),
            # 20. DeFi Deposit
            ScenarioPattern(
                type=ScenarioType.defi_deposit,
                confidence_threshold=0.85,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(
                            name="Raydium",
                            program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR",
                            addresses=[
                                "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
                            ]
                        ),
                        DeFiProtocol(
                            name="Orca",
                            program_id="whirLbGkszUak4H2e3FNi9PT1LMxth8mjcLp9wG8s8q",
                            addresses=["orcaEyt5fJZdo11ix8i8re9DpoX6Jvc9coEdidczDhdw2EM"]
                        ),
                        DeFiProtocol(
                            name="Serum",
                            program_id="srmqPvYK1E2qUg5g8cK1dGg7upobewFJx7Wf7166HMA",
                            addresses=["SRMuAp9dh8v5gj8sHjrnCK7Uoek43Wcgyh4V1t8Jq7pD7L2"]
                        )
                    ]
                }
            ),
            # 21. Staking
            ScenarioPattern(
                type=ScenarioType.delegated_staking,
                confidence_threshold=0.9,
                pattern_rules={
                    "program_ids": ["Stake111111111111111111111111111111111111111"],
                    "min_amount": Decimal("0.1"),
                    "lock_period": timedelta(days=1)
                }
            ),
            # 22. Converted to Stablecoin
            ScenarioPattern(
                type=ScenarioType.converted_to_stablecoin,
                confidence_threshold=0.8,
                pattern_rules={
                    "token_mints": ["EPjFWdd5AufqSSqeMwqBxCdGYA2j6CjXsKj9scpJ416D", "Es9vM5wca9K16jG1ZX79jb8p7HXbJ9K3jZ7MPj8L31pM"]
                }
            ),
            # 23. Token Swap (erneut)
            ScenarioPattern(
                type=ScenarioType.token_swap,
                confidence_threshold=0.85,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Raydium", program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR"),
                        DeFiProtocol(name="Orca", program_id="whirLbGkszUak4H2e3FNi9PT1LMxth8mjcLp9wG8s8q")
                    ],
                    "min_token_change": 2
                }
            ),
            # 24. Large Transfer (erneut)
            ScenarioPattern(
                type=ScenarioType.large_transfer,
                confidence_threshold=0.9,
                pattern_rules={
                    "min_amount": Decimal("1000"),
                    "token_mints": ["So11111111111111111111111111111111111111111"]
                }
            ),
            # 25. NFT Minting
            ScenarioPattern(
                type=ScenarioType.nft_minting,
                confidence_threshold=0.85,
                pattern_rules={
                    "program_ids": [
                        "metaqbxxUerdq28cj1R5qbkaUP8vQV7cD1EmE6Z7eDnQR",
                        "hausg4Fw6G8sQ8j1JpD7D6wye7XosVhWf9nJ1J3kKcb"
                    ],
                    "token_creators": ["MagicEdenNFTCreator", "DigitalEyesNFTCreator"]
                }
            ),
            # 26. Cross-Chain Bridge
            ScenarioPattern(
                type=ScenarioType.cross_chain_bridge,
                confidence_threshold=0.9,
                pattern_rules={
                    "program_ids": [
                        "worm2Zo1PCxwEw3dZ1B3Le9jr8F77od55LBF38rQkbPS",
                        "AL1QR1Fg8Dq8kqZ36vjrnj3VcwfQx1QGLayBkkejJ2Dv"
                    ],
                    "bridge_addresses": [
                        "wormholeBridgeAddressHere",
                        "alligatorBridgeAddressHere"
                    ]
                }
            ),
            # 27. Liquidity Provision
            ScenarioPattern(
                type=ScenarioType.liquidity_provision,
                confidence_threshold=0.8,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Raydium", program_id="RaYdIuMpRoGrAmIdXCUg6sP4wxpD3x1W7D1t2Z7K9eR"),
                        DeFiProtocol(name="Saber", program_id="SabERD2wReHk1VkX8jiwG1Lg5D7i6g8TgPnr6f5qncu")
                    ],
                    "token_mints": ["new_token_mint_address"]
                }
            ),
            # 28. Governance Participation
            ScenarioPattern(
                type=ScenarioType.governance_participation,
                confidence_threshold=0.8,
                pattern_rules={
                    "program_ids": ["govER5LthmsenD3FwKn6Pd71AWkK1iNkdj1VfdpX7u2uvew"],
                    "actions": ["vote_cast", "proposal_created"]
                }
            ),
            # 29. Wash Trading
            ScenarioPattern(
                type=ScenarioType.wash_trading,
                confidence_threshold=0.75,
                pattern_rules={
                    "protocols": [DeFiProtocol(name="Raydium"), DeFiProtocol(name="Orca")],
                    "same_user_involved": True,
                    "time_window": timedelta(minutes=5),
                    "token_pair": ["SOL", "FakeTokenMint"]
                }
            ),
            # 30. Mining / Reward Claim
            ScenarioPattern(
                type=ScenarioType.reward_claim,
                confidence_threshold=0.8,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Marinade", program_id="MarBms51wcof8x6fEyJwgG1aoC56WZ8aD2w8wELThb9"),
                        DeFiProtocol(name="Lido", program_id="Lido111111111111111111111111111111111111111")
                    ],
                    "reward_type": ["stake_rewards", "liquidity_rewards"]
                }
            ),
            # 31. Token Launch
            ScenarioPattern(
                type=ScenarioType.token_launch,
                confidence_threshold=0.75,
                pattern_rules={
                    "program_ids": [
                        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                    ],
                    "new_token_creation": True,
                    "liquidity_added": True
                }
            ),
            # 32. Flashloan
            ScenarioPattern(
                type=ScenarioType.flashloan_usage,
                confidence_threshold=0.8,
                pattern_rules={
                    "protocols": [
                        DeFiProtocol(name="Solend", program_id="SLND111111111111111111111111111111111111111"),
                        DeFiProtocol(name="MarginFi", program_id="MrginF5iygv9sp813z7FGpsCL24eq1Z8Gp9az89ueSWf")
                    ],
                    "flashloan_amount_threshold": Decimal("1000000"),
                    "repaid_within_same_block": True
                }
            )
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
                f"Detected {len(detected_scenarios)} scenarios in {len(transactions)} transactions"
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
    ) -> tuple[float, set[str]]:
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
    ) -> tuple[float, Set[str]]:
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
                confidence_score=0.9, # Could be calculated based on patterns
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
