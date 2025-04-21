from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, constr, conint
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import os
from textblob import TextBlob

# Interne Module importieren
from app.core.twitter_api import TwitterClient
from app.core.blockchain_api import fetch_on_chain_data
from app.models.db_models import SentimentAnalysis, OnChainTransaction
from app.core.database import get_db  # Korrekter Importpfad

# Logger konfigurieren
logger = logging.getLogger(__name__)

# Router initialisieren
router = APIRouter()

# Pydantic-Model für die Anfrage
class QueryRequest(BaseModel):
    username: constr(min_length=1)  # Der Twitter-Benutzername
    post_count: conint(gt=0, le=50)  # Anzahl der Posts (zwischen 1 und 50)
    blockchain: constr(regex="^(ethereum|solana|bitcoin)$")  # Unterstützte Blockchains

# Pydantic-Model für die Antwort
class TweetResponse(BaseModel):
    text: str
    amount: float = None
    keywords: List[str] = []
    addresses: List[str] = []
    hashtags: List[str] = []
    links: List[str] = []

class OnChainResponse(BaseModel):
    transaction_id: str
    amount: float
    transaction_type: str
    block_time: int
    wallet_address: str
    description: str = None

class AnalyzeResponse(BaseModel):
    username: str
    potential_wallet: str = None
    tweets: List[TweetResponse]
    on_chain_data: List[OnChainResponse]

# Hilfsfunktionen für Korrelationen
def validate_temporal_correlation(tweet_time, tx_time, tolerance_minutes=60):
    return abs((datetime.fromisoformat(tx_time) - datetime.fromisoformat(tweet_time)).total_seconds()) < tolerance_minutes * 60

def validate_amount_correlation(tweet_amount, tx_amount, tolerance=0.01):
    return abs(tweet_amount - tx_amount) <= tolerance

def validate_keyword_correlation(tweet_keywords, tx_description):
    return any(keyword in tx_description for keyword in tweet_keywords)

def validate_address_correlation(tweet_addresses, tx_wallet_address):
    return any(address in tx_wallet_address for address in tweet_addresses)

def validate_hashtag_correlation(tweet_hashtags, tx_description):
    return any(hashtag in tx_description for hashtag in tweet_hashtags)

def validate_link_correlation(tweet_links, tx_description):
    return any(link in tx_description for link in tweet_links)

# Sentiment-Analyse mit TextBlob
def calculate_sentiment_score(texts):
    scores = [TextBlob(text).sentiment.polarity for text in texts]
    return sum(scores) / len(scores) if scores else 0

# Hauptendpunkt
@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_sentiment(request: QueryRequest, db: Session = Depends(get_db)):
    try:
        # Tweets abrufen
        twitter_client = TwitterClient()
        tweets = twitter_client.fetch_tweets_by_user(request.username, request.post_count)
        if not tweets:
            logger.warning(f"No tweets found for username: {request.username}")
            return {"username": request.username, "potential_wallet": None, "message": "Keine Tweets gefunden."}

        # On-Chain-Daten abrufen
        blockchain_endpoint = {
            "solana": os.getenv("SOLANA_RPC_URL"),
            "ethereum": os.getenv("ETHEREUM_RPC_URL"),
            "bitcoin": os.getenv("BITCOIN_RPC_URL"),  # Fügen Sie dies zu Ihrer .env hinzu, falls benötigt
        }.get(request.blockchain)

        if not blockchain_endpoint:
            raise HTTPException(status_code=400, detail=f"Unsupported blockchain: {request.blockchain}")

        on_chain_data = fetch_on_chain_data(blockchain_endpoint, request.username)
        if not on_chain_data:
            logger.warning(f"No on-chain data found for username: {request.username} and blockchain: {request.blockchain}")
            return {"username": request.username, "potential_wallet": None, "message": "Keine On-Chain-Daten gefunden."}

        # Korrelation zwischen Tweets und On-Chain-Daten
        potential_wallet = None
        for tweet in tweets:
            for tx in on_chain_data:
                if validate_temporal_correlation(tweet.get("created_at"), tx.get("block_time")):
                    if tweet.get("amount") and validate_amount_correlation(tweet["amount"], tx["amount"]):
                        potential_wallet = tx["wallet_address"]
                        break
                if validate_keyword_correlation(tweet.get("keywords", []), tx.get("description", "")):
                    potential_wallet = tx["wallet_address"]
                    break
                if validate_address_correlation(tweet.get("addresses", []), tx.get("wallet_address", "")):
                    potential_wallet = tx["wallet_address"]
                    break
                if validate_hashtag_correlation(tweet.get("hashtags", []), tx.get("description", "")):
                    potential_wallet = tx["wallet_address"]
                    break
                if validate_link_correlation(tweet.get("links", []), tx.get("description", "")):
                    potential_wallet = tx["wallet_address"]
                    break

        # Sentiment-Score berechnen
        sentiment_score = calculate_sentiment_score([tweet["text"] for tweet in tweets])

        # Daten in der Datenbank speichern
        db_analysis = SentimentAnalysis(
            query=request.username,
            sentiment_score=sentiment_score,
            post_count=request.post_count
        )
        db.add(db_analysis)

        db_transactions = [
            OnChainTransaction(
                query=request.username,
                transaction_id=tx.get("signature", tx.get("hash")),
                amount=tx.get("amount", 0),
                transaction_type=tx.get("type", "unknown"),
                block_time=datetime.fromtimestamp(tx.get("blockTime", tx.get("timestamp"))),
                blockchain=request.blockchain
            )
            for tx in on_chain_data
        ]
        db.add_all(db_transactions)
        db.commit()

        # Rückgabe der Ergebnisse
        return AnalyzeResponse(
            username=request.username,
            potential_wallet=potential_wallet,
            tweets=[TweetResponse(**tweet) for tweet in tweets],
            on_chain_data=[OnChainResponse(**tx) for tx in on_chain_data]
        )

    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
