from fastapi import APIRouter, Depends, HTTPException
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

class QueryRequest(BaseModel):
    query: str  # Der Suchbegriff, der analysiert werden soll (z. B. "Bitcoin", "Solana")

@router.post("/analyze", response_model=Dict[str, float])
def analyze_sentiment(request: QueryRequest, db=Depends(get_db)):
    """
    Führt eine Sentiment-Analyse für den angegebenen Suchbegriff durch.
    
    - **query**: Der Suchbegriff, der analysiert werden soll (z. B. "Bitcoin", "Ethereum").
    
    Die Analyse basiert auf öffentlich verfügbaren Tweets und wertet deren Stimmung in Echtzeit aus.
    """
    # Überprüfen, ob das Ergebnis im Cache vorhanden ist
    cached_result = get_cached_result(request.query)
    if cached_result:
        return cached_result

    try:
        # Abrufen von Tweets und Durchführen der Sentiment-Analyse
        twitter_client = TwitterClient()
        tweets = twitter_client.fetch_tweets(request.query)

        if not tweets:
            raise HTTPException(status_code=404, detail="Keine Tweets gefunden.")

        sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
        avg_score = (
            sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores)
            if sentiment_scores else 0.0
        )

        # Speichern in der Datenbank
        db_analysis = SentimentAnalysis(query=request.query, sentiment_score=avg_score)
        db.add(db_analysis)
        db.commit()

        # Caching des Ergebnisses
        result = {
            "query": request.query,
            "sentiment_score": avg_score
        }
        cache_result(request.query, result)

        return result

    except Exception as e:
        # Fehlerbehandlung für unerwartete Ausnahmen
        raise HTTPException(status_code=500, detail=f"Fehler bei der Analyse: {str(e)}")
