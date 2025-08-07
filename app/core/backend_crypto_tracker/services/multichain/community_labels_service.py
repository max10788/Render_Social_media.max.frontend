# services/multichain/community_labels_service.py
import httpx
import asyncio
import logging
from typing import List, Dict, Any, Tuple
from enum import Enum
from utils.logger import get_logger
from utils.exceptions import APIException

logger = get_logger(__name__)

class WalletTypeEnum(Enum):
    UNKNOWN = "unknown"
    EOA = "eoa"
    CONTRACT = "contract"
    CEX_WALLET = "cex_wallet"
    DEFI_WALLET = "defi_wallet"
    DEV_WALLET = "dev_wallet"
    WHALE_WALLET = "whale_wallet"
    SNIPER_WALLET = "sniper_wallet"
    RUGPULL_SUSPECT = "rugpull_suspect"
    BURN_WALLET = "burn_wallet"
    DEX_CONTRACT = "dex_contract"
    LIQUIDITY_PROVIDER = "liquidity_provider"
    TEAM_WALLET = "team_wallet"

class CommunityLabelsAPI:
    """Integration with community-based labeling sources"""
    def __init__(self):
        # In Produktionsumgebung: API-Schlüssel laden
        self.sources = {
            'etherscan': 'https://api.etherscan.io/api',
            'bscscan': 'https://api.bscscan.com/api',
            'oklink': 'https://www.oklink.com/api',
            'flipside': 'https://api.flipsidecrypto.com/api/v1'
        }
        
        # DEX signature patterns for identifying DEX contracts
        self.dex_signatures = {
            'swap': '0x128acb08',           # swapExactTokensForTokens
            'addLiquidity': '0xe8e33700',   # addLiquidity
            'removeLiquidity': '0xbaa2abde', # removeLiquidity
            'getReserves': '0x0902f1ac',    # getReserves
            'factory': '0xc45a0155',        # factory()
            'token0': '0x0dfe1681',         # token0()
            'token1': '0xd21220a7',         # token1()
            'mint': '0x6a627842',           # mint(address)
            'burn': '0x89afcb44',           # burn(address)
            'sync': '0xfff6cae9',           # sync()
            'skim': '0xbc25cf77'            # skim(address)
        }
        
        # CEX patterns for identifying centralized exchange wallets
        self.cex_patterns = {
            'high_tx_count': 10000,          # Minimum transaction count
            'frequent_deposits': True,        # Regular small deposits
            'batch_withdrawals': True,        # Batch withdrawal patterns
            'round_amounts': True,            # Round number transactions
            'multiple_tokens': True,          # Interaction with many tokens
            'gas_optimization': True,         # Optimized gas usage patterns
            'withdrawal_sequences': True,     # Sequential withdrawal patterns
            'deposit_clustering': True        # Clustered deposit timing
        }
        
        # Dev wallet patterns for identifying developer/team wallets
        self.dev_patterns = {
            'owner_function': '0x8da5cb5b',      # owner()
            'minter_role': 'MINTER_ROLE',        # OpenZeppelin Role
            'admin_role': 'DEFAULT_ADMIN_ROLE',  # Admin role
            'early_transactions': True,           # Early transactions after deployment
            'large_initial_balance': True,        # Large initial token balance
            'team_vesting': True,                 # Vesting contract interactions
            'contract_deployment': True,          # Deployed contracts
            'governance_participation': True,     # Governance token interactions
            'multi_sig_operations': True          # Multi-signature operations
        }
        
        # Liquidity provider patterns
        self.lp_patterns = {
            'add_liquidity_calls': True,      # AddLiquidity function calls
            'remove_liquidity_calls': True,   # RemoveLiquidity function calls
            'lp_token_holdings': True,        # LP token holdings
            'yield_farming': True,            # Yield farming activities
            'impermanent_loss_behavior': True # IL mitigation patterns
        }
        
        # Rugpull suspect patterns
        self.rugpull_patterns = {
            'sudden_large_withdrawals': True,  # Large withdrawals after accumulation
            'liquidity_removal': True,         # Liquidity pool drainage
            'token_dumping': True,             # Large token sales
            'contract_abandonment': True,      # Contract ownership renouncement
            'honeypot_behavior': True          # Honeypot-like patterns
        }
    
    async def analyze_transaction_patterns(self, address: str, chain: str) -> Dict[str, Any]:
        """Comprehensive on-chain transaction pattern analysis"""
        patterns = {
            # Basic metrics
            'is_contract': await self._is_contract_address(address, chain),
            'transaction_count': 0,
            'unique_counterparties': 0,
            'avg_transaction_value': 0,
            'first_transaction_date': None,
            'last_transaction_date': None,
            
            # DEX interaction patterns
            'has_dex_interactions': False,
            'dex_signature_matches': [],
            'liquidity_operations': 0,
            'swap_operations': 0,
            
            # CEX interaction patterns
            'has_cex_interactions': False,
            'round_number_transactions': 0,
            'batch_transaction_patterns': 0,
            'withdrawal_sequences': 0,
            
            # Developer patterns
            'contract_creation': False,
            'admin_function_calls': 0,
            'early_activity_score': 0,
            'large_initial_balance': False,
            
            # Risk indicators
            'suspicious_patterns': [],
            'sudden_balance_changes': 0,
            'liquidity_removal_events': 0,
            
            # Advanced metrics
            'gas_usage_patterns': {},
            'transaction_timing_patterns': {},
            'counterparty_analysis': {},
            'token_interaction_count': 0
        }
        
        # In a real implementation, this would query blockchain APIs
        # For demonstration, we'll simulate some patterns
        patterns.update(await self._simulate_pattern_analysis(address, chain))
        
        return patterns
    
    async def _simulate_pattern_analysis(self, address: str, chain: str) -> Dict[str, Any]:
        """Simulate pattern analysis (replace with real blockchain queries)"""
        import random
        
        # Simulate different patterns based on address characteristics
        address_hash = hash(address) % 1000
        
        return {
            'transaction_count': random.randint(10, 50000),
            'unique_counterparties': random.randint(5, 1000),
            'has_dex_interactions': address_hash % 3 == 0,
            'has_cex_interactions': address_hash % 5 == 0,
            'contract_creation': address_hash % 10 == 0,
            'round_number_transactions': random.randint(0, 100),
            'dex_signature_matches': ['swap', 'addLiquidity'] if address_hash % 3 == 0 else [],
            'admin_function_calls': random.randint(0, 50) if address_hash % 10 == 0 else 0
        }
    
    async def _is_contract_address(self, address: str, chain: str) -> bool:
        """Check if address is a smart contract"""
        # In real implementation, would check if address has bytecode
        # For now, simulate based on address pattern
        return len(address) == 42 and address.startswith('0x') and hash(address) % 4 == 0
    
    def classify_by_patterns(self, patterns: Dict[str, Any], balance: float, total_supply: float) -> Tuple[WalletTypeEnum, float]:
        """Enhanced classification based on comprehensive pattern analysis"""
        confidence_scores = []
        classification_votes = []
        
        # DEX Contract Detection
        dex_score = self._analyze_dex_patterns(patterns)
        if dex_score > 0.7:
            classification_votes.append(WalletTypeEnum.DEX_CONTRACT)
            confidence_scores.append(dex_score)
        
        # CEX Wallet Detection
        cex_score = self._analyze_cex_patterns(patterns)
        if cex_score > 0.6:
            classification_votes.append(WalletTypeEnum.CEX_WALLET)
            confidence_scores.append(cex_score)
        
        # Developer Wallet Detection
        dev_score = self._analyze_dev_patterns(patterns, balance, total_supply)
        if dev_score > 0.6:
            classification_votes.append(WalletTypeEnum.DEV_WALLET)
            confidence_scores.append(dev_score)
        
        # Liquidity Provider Detection
        lp_score = self._analyze_lp_patterns(patterns)
        if lp_score > 0.5:
            classification_votes.append(WalletTypeEnum.LIQUIDITY_PROVIDER)
            confidence_scores.append(lp_score)
        
        # Whale Detection
        whale_score = self._analyze_whale_patterns(patterns, balance, total_supply)
        if whale_score > 0.6:
            classification_votes.append(WalletTypeEnum.WHALE_WALLET)
            confidence_scores.append(whale_score)
        
        # Rugpull Suspect Detection
        rugpull_score = self._analyze_rugpull_patterns(patterns, balance, total_supply)
        if rugpull_score > 0.7:
            classification_votes.append(WalletTypeEnum.RUGPULL_SUSPECT)
            confidence_scores.append(rugpull_score)
        
        # Team Wallet Detection
        team_score = self._analyze_team_patterns(patterns, balance, total_supply)
        if team_score > 0.6:
            classification_votes.append(WalletTypeEnum.TEAM_WALLET)
            confidence_scores.append(team_score)
        
        # Select best classification
        if classification_votes and confidence_scores:
            best_idx = confidence_scores.index(max(confidence_scores))
            return classification_votes[best_idx], confidence_scores[best_idx]
        
        # Default classification
        return WalletTypeEnum.UNKNOWN, 0.3
    
    def _analyze_dex_patterns(self, patterns: Dict[str, Any]) -> float:
        """Analyze DEX-specific patterns"""
        score = 0.0
        
        # Contract check
        if patterns.get('is_contract', False):
            score += 0.3
        
        # DEX signature matches
        dex_matches = patterns.get('dex_signature_matches', [])
        if dex_matches:
            score += min(0.4, len(dex_matches) * 0.1)
        
        # Liquidity operations
        if patterns.get('liquidity_operations', 0) > 10:
            score += 0.2
        
        # Swap operations
        if patterns.get('swap_operations', 0) > 100:
            score += 0.1
        
        return min(1.0, score)
    
    def _analyze_cex_patterns(self, patterns: Dict[str, Any]) -> float:
        """Analyze CEX-specific patterns"""
        score = 0.0
        
        # High transaction count
        tx_count = patterns.get('transaction_count', 0)
        if tx_count > self.cex_patterns['high_tx_count']:
            score += 0.3
        
        # Round number transactions
        round_tx = patterns.get('round_number_transactions', 0)
        if round_tx > 50:
            score += 0.2
        
        # Batch patterns
        if patterns.get('batch_transaction_patterns', 0) > 20:
            score += 0.2
        
        # Multiple counterparties
        if patterns.get('unique_counterparties', 0) > 500:
            score += 0.3
        
        return min(1.0, score)
    
    def _analyze_dev_patterns(self, patterns: Dict[str, Any], balance: float, total_supply: float) -> float:
        """Analyze developer wallet patterns"""
        score = 0.0
        
        # Contract creation
        if patterns.get('contract_creation', False):
            score += 0.4
        
        # Admin function calls
        if patterns.get('admin_function_calls', 0) > 10:
            score += 0.3
        
        # Large initial balance
        if total_supply and balance > 0:
            percentage = (balance / total_supply) * 100
            if percentage > 20:
                score += 0.3
            elif percentage > 10:
                score += 0.2
        
        # Early activity
        if patterns.get('early_activity_score', 0) > 0.7:
            score += 0.2
        
        return min(1.0, score)
    
    def _analyze_lp_patterns(self, patterns: Dict[str, Any]) -> float:
        """Analyze liquidity provider patterns"""
        score = 0.0
        
        # Liquidity operations
        liq_ops = patterns.get('liquidity_operations', 0)
        if liq_ops > 5:
            score += 0.4
        
        # DEX interactions
        if patterns.get('has_dex_interactions', False):
            score += 0.3
        
        # Token interaction diversity
        if patterns.get('token_interaction_count', 0) > 10:
            score += 0.3
        
        return min(1.0, score)
    
    def _analyze_whale_patterns(self, patterns: Dict[str, Any], balance: float, total_supply: float) -> float:
        """Analyze whale wallet patterns"""
        score = 0.0
        
        # Large absolute balance
        if balance > 10000000:  # 10M tokens
            score += 0.4
        elif balance > 1000000:  # 1M tokens
            score += 0.3
        
        # Large percentage of supply
        if total_supply and balance > 0:
            percentage = (balance / total_supply) * 100
            if percentage > 10:
                score += 0.4
            elif percentage > 5:
                score += 0.3
            elif percentage > 1:
                score += 0.2
        
        # Transaction patterns consistent with whales
        if patterns.get('transaction_count', 0) < 1000:  # Whales typically have fewer, larger transactions
            score += 0.2
        
        return min(1.0, score)
    
    def _analyze_rugpull_patterns(self, patterns: Dict[str, Any], balance: float, total_supply: float) -> float:
        """Analyze rugpull suspect patterns"""
        score = 0.0
        
        # Suspicious patterns
        suspicious_count = len(patterns.get('suspicious_patterns', []))
        if suspicious_count > 3:
            score += 0.5
        elif suspicious_count > 1:
            score += 0.3
        
        # Sudden balance changes
        if patterns.get('sudden_balance_changes', 0) > 5:
            score += 0.3
        
        # Liquidity removal events
        if patterns.get('liquidity_removal_events', 0) > 3:
            score += 0.4
        
        return min(1.0, score)
    
    def _analyze_team_patterns(self, patterns: Dict[str, Any], balance: float, total_supply: float) -> float:
        """Analyze team wallet patterns"""
        score = 0.0
        
        # Medium to large holdings (but not whale level)
        if total_supply and balance > 0:
            percentage = (balance / total_supply) * 100
            if 2 <= percentage <= 15:  # Team wallets typically hold 2-15%
                score += 0.4
        
        # Early activity but not contract creation
        if patterns.get('early_activity_score', 0) > 0.5 and not patterns.get('contract_creation', False):
            score += 0.3
        
        # Moderate transaction activity
        tx_count = patterns.get('transaction_count', 0)
        if 100 <= tx_count <= 5000:
            score += 0.3
        
        return min(1.0, score)
