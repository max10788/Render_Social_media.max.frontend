from pydantic import BaseModel, constr, conint
from typing import List, Optional

# Pydantic-Model für die Anfrage
class QueryRequest(BaseModel):
    username: constr(min_length=1)  # Der Twitter-Benutzername
    post_count: conint(gt=0, le=50)  # Anzahl der Posts (zwischen 1 und 50)
    blockchain: constr(regex="^(ethereum|solana|bitcoin)$")  # Unterstützte Blockchains

# Pydantic-Model für Feedback
class FeedbackRequest(BaseModel):
    tweet_id: str
    transaction_id: str
    label: bool  # True = korreliert, False = nicht korreliert

# Pydantic-Model für die Antwort (Tweets)
class TweetResponse(BaseModel):
    text: str
    amount: Optional[float] = None
    keywords: List[str] = []
    addresses: List[str] = []
    hashtags: List[str] = []
    links: List[str] = []

# Pydantic-Model für die Antwort (On-Chain-Daten)
class OnChainResponse(BaseModel):
    transaction_id: str
    amount: float
    transaction_type: str
    block_time: int
    wallet_address: str
    description: Optional[str] = None

# Pydantic-Model für die Gesamtantwort
class AnalyzeResponse(BaseModel):
    username: str
    potential_wallet: Optional[str] = None
    tweets: List[TweetResponse]
    on_chain_data: List[OnChainResponse]
