from fastapi import APIRouter, Depends
from pydantic import BaseModel
from core.twitter_api import TwitterClient
from core.redis_cache import get_cached_result, cache_result
from core.database import SessionLocal
from models.schemas import SentimentResponse

router = APIRouter()

# Dependency für die Datenbankverbindung
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class QueryRequest(BaseModel):
    query: str

@router.post("/analyze", response_model=SentimentResponse)
def analyze_sentiment(request: QueryRequest, db=Depends(get_db)):
    # Überprüfen, ob das Ergebnis im Cache vorhanden ist
    cached_result = get_cached_result(request.query)
    if cached_result:
        return cached_result

    # Abrufen von Tweets und Durchführen der Sentiment-Analyse
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_tweets(request.query)
    sentiment_scores = [twitter_client.analyze_sentiment(tweet) for tweet in tweets]
    avg_score = sum(score['compound'] for score in sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0

    # Speichern in der Datenbank
    from models.db_models import SentimentAnalysis
    db_analysis = SentimentAnalysis(query=request.query, sentiment_score=avg_score)
    db.add(db_analysis)
    db.commit()

    # Caching des Ergebnisses
    result = {"query": request.query, "sentiment_score": avg_score}
    cache_result(request.query, result)

    return result
