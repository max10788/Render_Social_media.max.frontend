# app/core/backend_crypto_tracker/config/scanner_config.py
import os
from typing import Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum

class ConfidenceLevel(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class WalletClassifierConfig:
    cache_ttl: int = 3600  # 1 Stunde
    confidence_thresholds: Dict[ConfidenceLevel, float] = field(default_factory=lambda: {
        ConfidenceLevel.HIGH: 0.85,
        ConfidenceLevel.MEDIUM: 0.65,
        ConfidenceLevel.LOW: 0.45
    })

@dataclass
class OnChainAnalysisConfig:
    dex_signatures: Dict[str, str] = field(default_factory=lambda: {
        'swap': '0x128acb08',
        'addLiquidity': '0xe8e33700',
        'removeLiquidity': '0xbaa2abde',
        # ... restliche Signaturen
    })
    
    cex_patterns: Dict[str, Any] = field(default_factory=lambda: {
        'high_tx_count': 10000,
        'frequent_deposits': True,
        # ... restliche Muster
    })
    
    # ... weitere Muster

@dataclass
class SourceWeights:
    # Angepasste Werte, die sich zu 1.0 summieren
    ChainalysisIntegration: float = 0.35
    EllipticIntegration: float = 0.30
    CommunityLabelsAPI: float = 0.15
    OnChainAnalyzer: float = 0.10
    InternalLogic: float = 0.10
    
    def validate(self):
        total = sum(self.__dict__.values())
        if not (0.99 <= total <= 1.01):  # Kleine Toleranz für Rundungsfehler
            raise ValueError(f"Source weights must sum to 1.0, got {total}")

@dataclass
class RpcConfig:
    ethereum_rpc: str = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
    bsc_rpc: str = "https://bsc-dataseed.binance.org/"
    solana_rpc: str = "https://api.mainnet-beta.solana.com"
    sui_rpc: str = "https://fullnode.mainnet.sui.io:443"
    
    # API Keys
    etherscan_api_key: str = "YOUR_ETHERSCAN_KEY"
    bscscan_api_key: str = "YOUR_BSCSCAN_KEY"
    coingecko_api_key: str = None
    helius_api_key: str = None
    sui_explorer_api_key: str = None
    
    # Bekannte Contract-Adressen
    known_contracts: Dict[str, Any] = field(default_factory=lambda: {
        'uniswap_v2_router': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        # ... restliche Contracts
    })
    
    # CEX Wallets
    cex_wallets: Dict[str, List[str]] = field(default_factory=lambda: {
        'binance': ['0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE'],
        # ... restliche Wallets
    })
    
    # Chain-spezifische Mindestscores
    min_scores: Dict[str, int] = field(default_factory=lambda: {
        'ethereum': 60,
        'bsc': 55,
        'solana': 50,
        'sui': 45
    })

@dataclass
class ScannerConfig:
    wallet_classifier: WalletClassifierConfig = field(default_factory=WalletClassifierConfig)
    onchain_analysis: OnChainAnalysisConfig = field(default_factory=OnChainAnalysisConfig)
    source_weights: SourceWeights = field(default_factory=SourceWeights)
    rpc_config: RpcConfig = field(default_factory=RpcConfig)
    
    def __post_init__(self):
        # Umgebungsvariablen überschreiben die Defaults
        self._load_from_env()
        # Validierung
        self.source_weights.validate()
    
    def _load_from_env(self):
        # Wallet Classifier
        self.wallet_classifier.cache_ttl = int(os.getenv('WALLET_CLASSIFIER_CACHE_TTL', self.wallet_classifier.cache_ttl))
        
        # RPC Config
        self.rpc_config.ethereum_rpc = os.getenv('ETHEREUM_RPC_URL', self.rpc_config.ethereum_rpc)
        self.rpc_config.etherscan_api_key = os.getenv('ETHERSCAN_API_KEY', self.rpc_config.etherscan_api_key)
        # ... restliche Umgebungsvariablen
        
        # Mindestscores
        self.rpc_config.min_scores['ethereum'] = int(os.getenv('ETHEREUM_MIN_SCORE', self.rpc_config.min_scores['ethereum']))
        # ... restliche Scores

# Globale Instanz
scanner_config = ScannerConfig()

# Konstanten für den Import in anderen Modulen
WALLET_CLASSIFIER_CONFIG = scanner_config.wallet_classifier
ONCHAIN_ANALYSIS_CONFIG = scanner_config.onchain_analysis
SOURCE_WEIGHTS = scanner_config.source_weights

def load_config(chain: str) -> Dict[str, Any]:
    """Lädt chain-spezifische Konfigurationen"""
    return {
        'min_score': scanner_config.rpc_config.min_scores.get(chain, 50),
        'rpc_url': getattr(scanner_config.rpc_config, f"{chain}_rpc", None),
        'api_key': getattr(scanner_config.rpc_config, f"{chain}_api_key", None),
        'known_contracts': scanner_config.rpc_config.known_contracts,
        'cex_wallets': scanner_config.rpc_config.cex_wallets
    }
