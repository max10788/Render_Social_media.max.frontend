from pydantic import BaseModel, Field, validator, constr, conint
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from enum import Enum

class BlockchainEnum(str, Enum):
    ethereum = "ethereum"
    binance = "binance"
    polygon = "polygon"
    solana = "solana"

class AnalyzeRequest(BaseModel):
    """Schema für die Anfrage zur Analyse von Blockchain- und Twitter-Daten."""
    blockchain: BlockchainEnum = Field(..., description="Die zu analysierende Blockchain")
    contract_address: str = Field(..., description="Die Adresse des Smart Contracts")
    keywords: List[str] = Field(..., min_items=1, description="Keywords für die Twitter-Suche")
    start_date: date = Field(..., description="Startdatum für die Analyse")
    end_date: date = Field(..., description="Enddatum für die Analyse")
    tweet_limit: Optional[int] = Field(1000, ge=100, le=5000, description="Maximale Anzahl der zu analysierenden Tweets")
    
    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date muss nach start_date liegen')
        return v
    
    @validator('contract_address')
    def validate_contract_address(cls, v, values):
        # Einfache Validierung der Länge der Contract-Adresse
        if 'blockchain' in values:
            if values['blockchain'] == BlockchainEnum.ethereum and not (v.startswith('0x') and len(v) == 42):
                raise ValueError('Ethereum-Adressen müssen mit 0x beginnen und 42 Zeichen lang sein')
            elif values['blockchain'] == BlockchainEnum.binance and not (v.startswith('0x') and len(v) == 42):
                raise ValueError('Binance-Adressen müssen mit 0x beginnen und 42 Zeichen lang sein')
            elif values['blockchain'] == BlockchainEnum.polygon and not (v.startswith('0x') and len(v) == 42):
                raise ValueError('Polygon-Adressen müssen mit 0x beginnen und 42 Zeichen lang sein')
            elif values['blockchain'] == BlockchainEnum.solana and len(v) != 44:
                raise ValueError('Solana-Adressen müssen 44 Zeichen lang sein')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "blockchain": "ethereum",
                "contract_address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                "keywords": ["Uniswap", "UNI", "DEX"],
                "start_date": "2023-01-01",
                "end_date": "2023-01-31",
                "tweet_limit": 2000
            }
        }

class CorrelationResult(BaseModel):
    """Schema für die Korrelationsergebnisse."""
    correlation_score: float = Field(..., description="Gesamtkorrelationswert zwischen -1 und 1")
    price_sentiment_correlation: float = Field(..., description="Korrelation zwischen Preis und Sentiment")
    volume_mentions_correlation: float = Field(..., description="Korrelation zwischen Handelsvolumen und Erwähnungen")
    daily_correlations: Dict[str, Dict[str, float]] = Field(..., description="Tägliche Korrelationswerte")
    correlation_details: Dict[str, Any] = Field(..., description="Detaillierte Korrelationsinformationen")

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




# Pydantic-Model für Feedback
class FeedbackRequest(BaseModel):
    tweet_id: str
    transaction_id: str
    label: bool  # True = korreliert, False = nicht korreliert

