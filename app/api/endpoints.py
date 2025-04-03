from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict
from app.core.twitter_api import TwitterClient
from app.core.redis_cache import get_cached_result, cache_result
from app.core.database import SessionLocal
from app.models.db_models import SentimentAnalysis

router = APIRouter()

# Dependency für die Datenbankverbindung
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AnalyzeRequest(BaseModel):
    username: str  # Twitter-Benutzername (@)
    post_count: int  # Anzahl der Posts/Retweets
    crypto: str  # Kryptowährung (z. B. "Solana")

@router.post("/analyze")
def analyze_sentiment(request: AnalyzeRequest, db=Depends(get_db)):
    """
    Führt eine On-Chain-Sentiment-Analyse für den angegebenen Twitter-Benutzer durch.
    
    - **username**: Der Twitter-Benutzername (@), dessen Posts analysiert werden sollen.
    - **post_count**: Die Anzahl der neuesten Posts/Retweets, die analysiert werden sollen.
    - **crypto**: Die Kryptowährung, die in den Tweets erwähnt wird.
    """
    # Überprüfen, ob das Ergebnis im Cache vorhanden ist
    cached_result = get_cached_result(f"{request.username}_{request.crypto}")
    if cached_result:
        return cached_result

    # Abrufen von Tweets
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_user_tweets(request.username, request.post_count)

    if not tweets:
        return {"username": request.username, "post_count": request.post_count, "crypto": request.crypto, "sentiment_score": 0.0, "on_chain_data": []}

    # Sentiment-Analyse durchführen
    sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
    avg_score = (
        sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores)
        if sentiment_scores else 0.0
    )

    # On-Chain-Daten abrufen
    on_chain_data = fetch_on_chain_data(request.crypto)

    # Speichern in der Datenbank
    db_analysis = SentimentAnalysis(
        username=request.username,
        post_count=request.post_count,
        crypto=request.crypto,
        sentiment_score=avg_score
    )
    db.add(db_analysis)
    db.commit()

    # Caching des Ergebnisses
    result = {
        "username": request.username,
        "post_count": request.post_count,
        "crypto": request.crypto,
        "sentiment_score": avg_score,
        "on_chain_data": on_chain_data
    }
    cache_result(f"{request.username}_{request.crypto}", result)

    return result

def fetch_on_chain_data(crypto: str):
    """
    Abrufen von On-Chain-Daten basierend auf der Kryptowährung.
    """
    url = "https://api.mainnet-beta.solana.com"
    headers = {"Content-Type": "application/json"}

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSignaturesForAddress",
        "params": [crypto]  # Hier könnte die Wallet-Adresse oder der Token stehen
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        return data.get("result", [])
    except Exception as e:
        print(f"Fehler beim Abrufen von On-Chain-Daten: {e}")
        return []
