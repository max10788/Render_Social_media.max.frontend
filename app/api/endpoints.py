from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.twitter_api import TwitterClient
from app.core.blockchain_api import fetch_on_chain_data
from app.models.db_models import SentimentAnalysis, OnChainTransaction
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List

router = APIRouter()

class QueryRequest(BaseModel):
    username: str  # Der Twitter-Benutzername
    post_count: int  # Anzahl der Posts (zwischen 1 und 50)
    blockchain: str  # Die ausgewählte Blockchain

def get_db():
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/analyze", response_model=dict)
def analyze_sentiment(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Führt eine Korrelation zwischen Tweets und On-Chain-Daten durch,
    um ein potenzielles Wallet zu identifizieren.
    """
    # Abrufen von Tweets basierend auf dem Benutzernamen
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_tweets_by_user(request.username, request.post_count)

    if not tweets:
        return {"username": request.username, "potential_wallet": None, "message": "Keine Tweets gefunden."}

    # Sentiment-Analyse der Tweets
    sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
    avg_score = (
        sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores)
        if sentiment_scores else 0.0
    )

    # Abrufen von On-Chain-Daten basierend auf dem Suchbegriff
    on_chain_data = fetch_on_chain_data(request.username, request.blockchain)

    # Korrelation zwischen Tweets und On-Chain-Daten
    potential_wallet = None
    for tx in on_chain_data:
        # Beispiel: Prüfen, ob der Tweet-Inhalt mit der Transaktion übereinstimmt
        if any(tx.get("description", "").lower() in tweet.lower() for tweet in tweets):
            potential_wallet = tx.get("wallet_address")
            break

    # Speichern in der Datenbank
    db_analysis = SentimentAnalysis(
        query=request.username,
        sentiment_score=avg_score,
        post_count=request.post_count
    )
    db.add(db_analysis)
    db.commit()

    for tx in on_chain_data:
        db_tx = OnChainTransaction(
            query=request.username,
            transaction_id=tx.get("signature", tx.get("hash")),
            amount=tx.get("amount", 0),
            transaction_type=tx.get("type", "unknown"),
            block_time=datetime.fromtimestamp(tx.get("blockTime", tx.get("timestamp"))),
            blockchain=request.blockchain
        )
        db.add(db_tx)
    db.commit()

    # Rückgabe der Ergebnisse
    return {
        "username": request.username,
        "potential_wallet": potential_wallet,
        "sentiment_score": avg_score,
        "on_chain_data": on_chain_data
    }
