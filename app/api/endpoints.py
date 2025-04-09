from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.blockchain_api import fetch_on_chain_data
from app.core.twitter_api import TwitterClient
from app.core.redis_cache import get_cached_result, cache_result
from app.core.database import SessionLocal
from app.models.db_models import SentimentAnalysis, OnChainTransaction
from datetime import datetime

router = APIRouter()

# Dependency für die Datenbankverbindung
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class QueryRequest(BaseModel):
    query: str  # Der Suchbegriff, der analysiert werden soll
    blockchain: str  # Die ausgewählte Blockchain (z. B. "solana", "ethereum", "moralis")

@router.post("/analyze", response_model=dict)
def analyze_sentiment(request: QueryRequest, db=Depends(get_db)):
    """
    Führt eine On-Chain-Sentiment-Analyse für den angegebenen Suchbegriff durch.
    
    - **query**: Der Suchbegriff, der analysiert werden soll (z. B. "Bitcoin", "Ethereum").
    - **blockchain**: Die ausgewählte Blockchain (z. B. "solana", "ethereum", "moralis").
    """
    # Überprüfen, ob das Ergebnis im Cache vorhanden ist
    cached_result = get_cached_result(request.query)
    if cached_result:
        return cached_result

    # Abrufen von Tweets und Durchführen der Sentiment-Analyse
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_tweets(request.query)

    if not tweets:
        return {"query": request.query, "sentiment_score": 0.0, "on_chain_data": []}

    sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
    avg_score = (
        sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores)
        if sentiment_scores else 0.0
    )

    # Abrufen von On-Chain-Daten basierend auf der ausgewählten Blockchain
    on_chain_data = fetch_on_chain_data(request.query, request.blockchain)

    # Speichern in der Datenbank
    db_analysis = SentimentAnalysis(query=request.query, sentiment_score=avg_score)
    db.add(db_analysis)
    db.commit()

    for tx in on_chain_data:
        db_tx = OnChainTransaction(
            query=request.query,
            transaction_id=tx.get("signature", tx.get("hash")),
            amount=tx.get("amount", 0),
            transaction_type=tx.get("type", "unknown"),
            block_time=datetime.fromtimestamp(tx.get("blockTime", tx.get("timestamp"))),
            blockchain=request.blockchain
        )
        db.add(db_tx)
    db.commit()

    # Caching des Ergebnisses
    result = {
        "query": request.query,
        "sentiment_score": avg_score,
        "on_chain_data": on_chain_data
    }
    cache_result(request.query, result)

    return result
