from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import date
from enum import Enum
from datetime import date, datetime
from typing_extensions import Literal

# --- ENUMS ---

class BlockchainEnum(str, Enum):
    ethereum = "ethereum"
    binance = "binance"
    polygon = "polygon"
    solana = "solana"

class ScenarioType(str, Enum):
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

class FinalStatusEnum(str, Enum):
    still_in_same_wallet = "still_in_same_wallet"
    returned_to_known_wallet = "returned_to_known_wallet"
    tracking_limit_reached = "tracking_limit_reached"


# --- MODELLE ---

class AnalyzeRequest(BaseModel):
    blockchain: BlockchainEnum = Field(..., description="Die zu analysierende Blockchain")
    contract_address: Optional[str] = Field(None)
    twitter_username: Optional[str] = Field(None)
    keywords: List[str] = Field(..., min_items=1)
    start_date: str = Field(...)
    end_date: str = Field(...)
    tweet_limit: Optional[int] = Field(1000, ge=10, le=5000)

class AnalyzeResponse(BaseModel):
    analysis_id: int
    blockchain: str
    contract_address: str
    keywords: List[str]
    start_date: str
    end_date: str
    sentiment_score: float
    correlation_results: CorrelationResult
    tweets_analyzed: int
    blockchain_data_points: int
    created_at: datetime


class FeedbackRequest(BaseModel):
    tweet_id: str
    transaction_id: str
    label: bool


class TransactionTrackRequest(BaseModel):
    start_tx_hash: str = Field(..., description="Initial transaction hash to track from", min_length=64, max_length=88)
    target_currency: str = Field(default="USD", pattern="^[A-Z]{3,4}$", description="Target currency (e.g., USD)")
    amount: float = Field(..., ge=0.000000001, description="Amount of SOL or token to track")
    num_transactions: int = Field(default=10, ge=1, le=100, description="Max number of transactions to follow")
    
    @validator('start_tx_hash')
    def validate_tx_hash(cls, v):
        if not v.strip():
            raise ValueError("Transaction hash cannot be empty")
        return v.strip()
    
    @validator('target_currency')
    def validate_currency(cls, v):
        supported_currencies = {"USD", "EUR", "GBP", "JPY", "SOL", "ETH"}
        if v not in supported_currencies:
            raise ValueError(f"Currency {v} not supported. Supported currencies: {', '.join(supported_currencies)}")
        return v

    class Config:
        schema_extra = {
            "example": {
                "start_tx_hash": "4mBdpm27ybQGPTZphbmhqRHnCTmGPdC8mk2fYwfE6RVQDtGbhqK1KNhLZ6NGty3aQZxDGrd9w",
                "target_currency": "USD",
                "amount": 1.5,
                "num_transactions": 10
            }
        }


class TrackedTransaction(BaseModel):
    tx_hash: str
    from_wallet: str
    to_wallet: str
    amount: float
    timestamp: str
    value_in_target_currency: Optional[float] = None


class TransactionTrackResponse(BaseModel):
    status: str
    total_transactions_tracked: int
    tracked_transactions: List[TrackedTransaction]
    final_status: FinalStatusEnum
    final_wallet_address: Optional[str] = None
    remaining_amount: Optional[float] = None
    target_currency: str
    detected_scenarios: List[ScenarioType] = []
    scenario_details: Dict[ScenarioType, Dict] = {}

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date muss nach start_date liegen')
        return v

    @validator('contract_address')
    def validate_contract_address(cls, v, values):
        if v is None:
            return v
        blockchain = values.get('blockchain')
        if blockchain in [BlockchainEnum.ethereum, BlockchainEnum.binance, BlockchainEnum.polygon]:
            if not (v.startswith('0x') and len(v) == 42):
                raise ValueError(f'{blockchain}-Adressen müssen mit 0x beginnen und 42 Zeichen lang sein')
        elif blockchain == BlockchainEnum.solana:
            if len(v) != 44:
                raise ValueError('Solana-Adressen müssen 44 Zeichen lang sein')
        return v

    class Config:
        schema_extra = {
            "example": {
                "blockchain": "ethereum",
                "contract_address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                "twitter_username": "uniswap",  # ohne @
                "keywords": ["Uniswap", "UNI", "DEX"],
                "start_date": "2023-01-01",
                "end_date": "2023-01-31",
                "tweet_limit": 200
            }
        }

class CorrelationResult(BaseModel):
    """Schema für die Korrelationsergebnisse."""
    correlation_score: float = Field(..., description="Gesamtkorrelationswert zwischen -1 und 1")
    price_sentiment_correlation: float = Field(..., description="Korrelation zwischen Preis und Sentiment")
    volume_mentions_correlation: float = Field(..., description="Korrelation zwischen Handelsvolumen und Erwähnungen")
    daily_correlations: dict[str, dict[str, float]] = Field(..., description="Tägliche Korrelationswerte")
    correlation_details: dict[str, Any] = Field(..., description="Detaillierte Korrelationsinformationen")

class AnalyzeResponse(BaseModel):
    """Schema für die Antwort der Analyse."""
    analysis_id: int = Field(..., description="ID der gespeicherten Analyse")
    blockchain: str = Field(..., description="Die analysierte Blockchain")
    contract_address: str = Field(..., description="Die Adresse des analysierten Smart Contracts")
    keywords: List[str] = Field(..., description="Die verwendeten Keywords")
    start_date: date = Field(..., description="Startdatum der Analyse")
    end_date: date = Field(..., description="Enddatum der Analyse")
    sentiment_score: float = Field(..., ge=-1.0, le=1.0, description="Berechneter Sentiment-Score zwischen -1 und 1")
    correlation_results: CorrelationResult = Field(..., description="Korrelationsergebnisse")
    tweets_analyzed: int = Field(..., description="Anzahl der analysierten Tweets")
    blockchain_data_points: int = Field(..., description="Anzahl der analysierten Blockchain-Datenpunkte")
    created_at: datetime = Field(..., description="Zeitpunkt der Erstellung der Analyse")
    
    class Config:
        schema_extra = {
            "example": {
                "analysis_id": 123,
                "blockchain": "ethereum",
                "contract_address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                "keywords": ["Uniswap", "UNI", "DEX"],
                "start_date": "2023-01-01",
                "end_date": "2023-01-31",
                "sentiment_score": 0.67,
                "correlation_results": {
                    "correlation_score": 0.82,
                    "price_sentiment_correlation": 0.75,
                    "volume_mentions_correlation": 0.89,
                    "daily_correlations": {
                        "2023-01-01": {"price_sentiment": 0.65, "volume_mentions": 0.72},
                        "2023-01-02": {"price_sentiment": 0.78, "volume_mentions": 0.85}
                    },
                    "correlation_details": {
                        "peak_correlation_date": "2023-01-15",
                        "significant_events": ["Ankündigung eines Protocol-Updates am 2023-01-10"]
                    }
                },
                "tweets_analyzed": 1850,
                "blockchain_data_points": 31,
                "created_at": "2023-02-01T14:23:45"
            }
        }


