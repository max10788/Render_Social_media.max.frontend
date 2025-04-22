from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QueryRequest(BaseModel):
    """
    Schema für die Anfrage zur Analyse von Tweets und Blockchain-Transaktionen.
    
    Attributes:
        username (str): Der Benutzername des Twitter-Nutzers.
        blockchain (str): Die Blockchain, die analysiert werden soll (z. B. "solana", "ethereum").
        post_count (int): Die Anzahl der zu analysierenden Tweets.
    """
    username: str
    blockchain: str
    post_count: int


class Tweet(BaseModel):
    """
    Schema für einen Tweet.
    
    Attributes:
        text (str): Der Text des Tweets.
        created_at (datetime): Der Zeitpunkt, zu dem der Tweet erstellt wurde.
    """
    text: str
    created_at: datetime


class OnChainData(BaseModel):
    """
    Schema für Blockchain-Transaktionsdaten.
    
    Attributes:
        amount (float): Der Betrag der Transaktion.
        block_time (float): Der Zeitpunkt der Transaktion als Unix-Timestamp.
    """
    amount: float
    block_time: float  # Unix-Timestamp


class AnalyzeResponse(BaseModel):
    """
    Schema für die Antwort auf eine Analyseanfrage.
    
    Attributes:
        username (str): Der Benutzername des Twitter-Nutzers.
        potential_wallet (Optional[str]): Eine potenzielle Wallet-Adresse, falls gefunden.
        tweets (List[Tweet]): Eine Liste von Tweets.
        on_chain_data (List[OnChainData]): Eine Liste von Blockchain-Transaktionen.
    """
    username: str
    potential_wallet: Optional[str] = None
    tweets: List[Tweet]
    on_chain_data: List[OnChainData]