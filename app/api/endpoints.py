from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.core.twitter_api import TwitterClient
from app.core.redis_cache import get_cached_result, cache_result
from app.core.database import SessionLocal
from app.models.db_models import SentimentAnalysis, OnChainTransaction

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

@router.post("/analyze")
def analyze_sentiment(request: QueryRequest, db=Depends(get_db)):
    # Überprüfen, ob das Ergebnis im Cache vorhanden ist
    cached_result = get_cached_result(request.query)
    if cached_result:
        return cached_result

    # Abrufen von Tweets und Durchführen der Sentiment-Analyse
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_tweets(request.query)

    if not tweets:
        return {"query": request.query, "sentiment_score": 0.0}

    sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
    avg_score = (
        sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores)
        if sentiment_scores else 0.0
    )

    # Speichern in der Datenbank
    db_analysis = SentimentAnalysis(query=request.query, sentiment_score=avg_score)
    db.add(db_analysis)
    db.commit()

    # Abrufen von On-Chain-Daten
    on_chain_data = fetch_on_chain_data(request.query)
    for tx in on_chain_data:
        db_tx = OnChainTransaction(
            query=request.query,
            transaction_id=tx["signature"],
            amount=tx["amount"],
            transaction_type=tx["type"],
            block_time=datetime.fromtimestamp(tx["blockTime"])
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

def fetch_on_chain_data(query: str):
    """
    Abrufen von On-Chain-Daten basierend auf dem Suchbegriff.
    """
    url = "https://api.mainnet-beta.solana.com"
    headers = {"Content-Type": "application/json"}

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSignaturesForAddress",
        "params": [query]  # Hier könnte die Wallet-Adresse oder der Token stehen
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        return data.get("result", [])
    except Exception as e:
        print(f"Fehler beim Abrufen von On-Chain-Daten: {e}")
        return []
