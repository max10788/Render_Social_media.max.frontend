from fastapi import APIRouter, Depends
from pydantic import BaseModel, constr, conint
from app.core.twitter_api import TwitterClient
from app.core.blockchain_api import fetch_on_chain_data
from app.models.db_models import SentimentAnalysis, OnChainTransaction
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

router = APIRouter()

class QueryRequest(BaseModel):
    username: constr(min_length=1)  # Der Twitter-Benutzername
    post_count: conint(gt=0, le=50)  # Anzahl der Posts (zwischen 1 und 50)
    blockchain: str  # Die ausgewählte Blockchain

def get_db():
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_temporal_correlation(tweet_time, tx_time, tolerance_minutes=60):
    return abs((tx_time - tweet_time).total_seconds()) < tolerance_minutes * 60

def validate_amount_correlation(tweet_amount, tx_amount, tolerance=0.01):
    return abs(tweet_amount - tx_amount) <= tolerance

@router.post("/analyze", response_model=dict)
def analyze_sentiment(request: QueryRequest, db: Session = Depends(get_db)):
    # Abrufen von Tweets basierend auf dem Benutzernamen
    twitter_client = TwitterClient()
    tweets = twitter_client.fetch_tweets_by_user(request.username, request.post_count)

    if not tweets:
        return {"username": request.username, "potential_wallet": None, "message": "Keine Tweets gefunden."}

    # Abrufen von On-Chain-Daten basierend auf dem Suchbegriff
    on_chain_data = fetch_on_chain_data(request.username, request.blockchain)

    # Korrelation zwischen Tweets und On-Chain-Daten
    potential_wallet = None
    for tweet in tweets:
        for tx in on_chain_data:
            # Zeitliche Korrelation
            if abs(tx["block_time"] - tweet["created_at"]) < 3600:  # Innerhalb einer Stunde
                # Betragskorrelation
                if tweet["amount"] and tweet["amount"] == tx["amount"]:
                    potential_wallet = tx["wallet_address"]
                    break
            # Schlüsselwortkorrelation
            if any(keyword in tx["description"] for keyword in tweet["keywords"]):
                potential_wallet = tx["wallet_address"]
                break
            # Adressenkorrelation
            if any(address in tx["wallet_address"] for address in tweet["addresses"]):
                potential_wallet = tx["wallet_address"]
                break
            # Hashtagkorrelation
            if any(hashtag in tx["description"] for hashtag in tweet["hashtags"]):
                potential_wallet = tx["wallet_address"]
                break
            # Linkkorrelation
            if any(link in tx["description"] for link in tweet["links"]):
                potential_wallet = tx["wallet_address"]
                break

    # Speichern in der Datenbank und Rückgabe der Ergebnisse
    return {
        "username": request.username,
        "potential_wallet": potential_wallet,
        "tweets": tweets,
        "on_chain_data": on_chain_data
    }
