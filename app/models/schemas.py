from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import date
from enum import Enum
from datetime import date, datetime

# --- ENUMS FÜR ERWEITERTE TRACKING-FUNKTIONALITÄT ---

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


# --- MODELLE FÜR TRANSACTION TRACKING ---

class TransactionTrackRequest(BaseModel):
    start_tx_hash: str = Field(..., description="The initial transaction hash to start tracking from")
    target_currency: str = Field(..., description="Target currency for conversion (e.g., 'USD', 'EUR')")
    amount: float = Field(..., ge=0.000000001, description="Amount of cryptocurrency to track (e.g., 0.5 SOL)")
    num_transactions: int = Field(default=10, ge=1, le=100, description="Maximum number of transactions to track")


class TrackedTransaction(BaseModel):
    tx_hash: str
    from_wallet: str
    to_wallet: str
    amount: float
    timestamp: str
    value_in_target_currency: Optional[float] = None  # z.B. USD-Wert zum Zeitpunkt


class TransactionTrackResponse(BaseModel):
    status: str = Field(..., description="Overall tracking status (e.g., 'complete', 'partial', 'incomplete')")
    total_transactions_tracked: int
    tracked_transactions: List[TrackedTransaction]
    final_status: FinalStatusEnum = Field(..., description="Final state of the tracked amount")
    final_wallet_address: Optional[str] = Field(
        None,
        description="The final wallet address where the funds ended up"
    )
    remaining_amount: Optional[float] = Field(
        None,
        description="Remaining amount if tracking was incomplete or partially returned"
    )
    target_currency: str
    detected_scenarios: List[ScenarioType] = Field(
        default_factory=list,
        description="List of detected usage scenarios along the transaction path"
    )
    scenario_details: Dict[ScenarioType, Dict] = Field(
        default_factory=dict,
        description="Additional metadata per scenario (e.g., pool name, NFT ID)"
    )


# --- BESTEHENDE MODELLE BLEIBEN UNVERÄNDERT ---

# Pydantic-Model für Feedback
class FeedbackRequest(BaseModel):
    tweet_id: str
    transaction_id: str
    label: bool  # True = korreliert, False = nicht korreliert

# Deine anderen Klassen wie AnalyzeRequest, CorrelationResult, AnalyzeResponse usw.
# bleiben unverändert — du fügst sie hier ein wie vorher definiert

class BlockchainEnum(str, Enum):
    ethereum = "ethereum"
    binance = "binance"
    polygon = "polygon"
    solana = "solana"

class AnalyzeRequest(BaseModel):
    """
    Anfrage-Schema für Blockchain- und Social-Media-Analyse.
    """
    blockchain: BlockchainEnum = Field(..., description="Die zu analysierende Blockchain")
    contract_address: Optional[str] = Field(
        None, description="Adresse des Smart Contracts (optional, je nach Analyse-Typ)"
    )
    twitter_username: Optional[str] = Field(
        None, description="Twitter-Username (optional, für Social-Media-Analysen)"
    )
    keywords: List[str] = Field(
        ..., min_items=1, description="Liste von Such-Keywords für Tweets"
    )
    start_date: date = Field(..., description="Startdatum für die Analyse (YYYY-MM-DD)")
    end_date: date = Field(..., description="Enddatum für die Analyse (YYYY-MM-DD, >= start_date)")
    tweet_limit: Optional[int] = Field(
        1000, ge=10, le=5000, description="Maximale Anzahl der zu analysierenden Tweets (10-5000, Standard: 1000)"
    )

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


