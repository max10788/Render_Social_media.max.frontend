import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.core.twitter_api import TwitterClient
from app.core.redis_cache import get_cached_result, cache_result
from app.core.database import SessionLocal
from app.models.db_models import SentimentAnalysis, OnChainTransaction
from app.core.blockchain_api import fetch_on_chain_data
from datetime import datetime

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
    
    Die Analyse basiert auf öffentlich verfügbaren Daten von X (früher Twitter) 
    und verwendet On-Chain-Metriken, um die Stimmung in Echtzeit zu bewerten.
    """
    logger.debug(f"Analyse gestartet für Query: {request.query}, Blockchain: {request.blockchain}")

    # Überprüfen, ob das Ergebnis im Cache vorhanden ist
    cached_result = get_cached_result(request.query)
    if cached_result:
        logger.info(f"Gecachte Daten gefunden für Query: {request.query}")
        return cached_result

    # Abrufen von Tweets und Durchführen der Sentiment-Analyse
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_tweets(request.query)

    if not tweets:
        logger.warning(f"Keine Tweets gefunden für Query: {request.query}")
        return {"query": request.query, "sentiment_score": 0.0, "on_chain_data": []}

    logger.info(f"{len(tweets)} Tweets gefunden für Query: {request.query}")
    sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
    avg_score = (
        sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores)
        if sentiment_scores else 0.0
    )
    logger.debug(f"Durchschnittlicher Sentiment-Score berechnet: {avg_score}")

    # Abrufen von On-Chain-Daten basierend auf der ausgewählten Blockchain
    on_chain_data = fetch_on_chain_data(request.query, request.blockchain)
    logger.debug(f"On-Chain-Daten abgerufen: {on_chain_data}")

    # Speichern in der Datenbank
    db_analysis = SentimentAnalysis(query=request.query, sentiment_score=avg_score)
    db.add(db_analysis)
    db.commit()
    logger.info(f"Sentiment-Analyse gespeichert in der Datenbank für Query: {request.query}")

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
    logger.info(f"On-Chain-Daten gespeichert in der Datenbank für Query: {request.query}")

    # Caching des Ergebnisses
    result = {
        "query": request.query,
        "sentiment_score": avg_score,
        "on_chain_data": on_chain_data
    }
    cache_result(request.query, result)
    logger.info(f"Ergebnisse gecached für Query: {request.query}")

    return result
