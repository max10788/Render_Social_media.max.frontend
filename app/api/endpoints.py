from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, constr, conint
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import uuid
from flask import Flask
from flask_cors import CORS

# Interne Module importieren
from app.core.twitter_api import TwitterClient
from app.core.blockchain_api import fetch_on_chain_data
from app.models.db_models import SentimentAnalysis, OnChainTransaction, Feedback
from app.core.database import get_db, init_db
from app.core.feature_engineering import extract_features, generate_labels
from textblob import TextBlob
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, FeedbackRequest, TransactionTrackRequest, TransactionTrackResponse
from app.core.crypto_tracker import CryptoTrackingService
from app.core.exceptions import CryptoTrackerError, TransactionNotFoundError

# FastAPI App erstellen
app = FastAPI()

# CORS Middleware hinzufügen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globale Variable für Status-Tracking
ANALYSIS_STATUS = {}

# Logger konfigurieren
logger = logging.getLogger(__name__)

# Router initialisieren
router = APIRouter()

# Hilfsfunktionen für Korrelationen
def validate_temporal_correlation(tweet_time, tx_time, tolerance_minutes=60):
    return abs((datetime.fromisoformat(tx_time) - datetime.fromtimestamp(tx_time)).total_seconds()) < tolerance_minutes * 60

def validate_amount_correlation(tweet_amount, tx_amount, tolerance=0.01):
    return abs(tweet_amount - tx_amount) <= tolerance

def validate_keyword_correlation(tweet_keywords, tx_description):
    keyword_set = set(tweet_keywords)
    description_set = set(tx_description.split())
    return not keyword_set.isdisjoint(description_set)
    
def validate_address_correlation(tweet_addresses, tx_wallet_address):
    address_set = set(tweet_addresses)
    wallet_set = set(tx_wallet_address.split())
    logger.debug(f"Validating address correlation: {tweet_addresses} vs {tx_wallet_address}")
    return not address_set.isdisjoint(wallet_set)

def validate_hashtag_correlation(tweet_hashtags, tx_description):
    hashtag_set = set(tweet_hashtags)
    description_set = set(tx_description.split())
    logger.debug(f"Validating hashtag correlation: {tweet_hashtags} vs {tx_description}")
    return not hashtag_set.isdisjoint(description_set)

def validate_link_correlation(tweet_links, tx_description):
    link_set = set(tweet_links)
    description_set = set(tx_description.split())
    logger.debug(f"Validating link correlation: {tweet_links} vs {tx_description}")
    return not link_set.isdisjoint(description_set)

# Sentiment-Analyse mit TextBlob
def calculate_sentiment_score(texts):
    scores = [TextBlob(text).sentiment.polarity for text in texts]
    return sum(scores) / len(scores) if scores else 0

# Laden oder Initialisieren des ML-Modells
try:
    model = joblib.load("model.pkl")
except FileNotFoundError:
    model = RandomForestClassifier()
    joblib.dump(model, "model.pkl")

# Modelltraining basierend auf Feedback-Daten
def train_model(db: Session):
    feedback_data = db.query(Feedback).all()
    X = [extract_features([f.tweet_id], [f.transaction_id]) for f in feedback_data]
    y = [f.label for f in feedback_data]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    logger.info(f"Model training completed with accuracy: {accuracy}")
    joblib.dump(model, "model.pkl")

# Regelbasierte Analyse
@router.post("/analyze/rule-based", response_model=dict)
async def start_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """Startet die Analyse und gibt eine Job-ID zurück."""
    job_id = str(uuid.uuid4())  # Generiere eine eindeutige Job-ID
    ANALYSIS_STATUS[job_id] = "In Progress"

    # Starte die Analyse im Hintergrund
    background_tasks.add_task(run_analysis, request, job_id)

    return {"job_id": job_id, "status": "Analysis started"}


async def run_analysis(request: AnalyzeRequest, job_id: str):
    """Führt die Analyse im Hintergrund durch."""
    try:
        # Blockchain-Parameter validieren
        if request.blockchain.value.lower() not in ["ethereum", "solana", "binance", "polygon"]:
            ANALYSIS_STATUS[job_id] = "Failed: Unsupported blockchain"
            return

        # Tweets abrufen (hier: Suche nach Keywords, nicht nach User)
        twitter_client = TwitterClient()
        tweets = await twitter_client.fetch_tweets_by_keywords(
            keywords=request.keywords,
            start_date=request.start_date,
            end_date=request.end_date,
            tweet_limit=request.tweet_limit
        )
        if not tweets:
            ANALYSIS_STATUS[job_id] = "Failed: No tweets found"
            return

        # Blockchain-Endpunkt abrufen
        blockchain_endpoint = {
            "solana": os.getenv("SOLANA_RPC_URL"),
            "ethereum": os.getenv("ETHEREUM_RPC_URL"),
            "binance": os.getenv("BINANCE_RPC_URL"),
            "polygon": os.getenv("POLYGON_RPC_URL"),
        }.get(request.blockchain.value.lower())

        if not blockchain_endpoint:
            ANALYSIS_STATUS[job_id] = "Failed: Unsupported blockchain endpoint"
            return

        # On-Chain-Daten abrufen (mit Contract-Adresse als Query)
        on_chain_data = fetch_on_chain_data(blockchain_endpoint, request.contract_address)
        if not on_chain_data:
            ANALYSIS_STATUS[job_id] = "Failed: No on-chain data found"
            return

        # Korrelation zwischen Tweets und On-Chain-Daten (Logik ggf. anpassen)
        potential_wallet = None
        for tweet in tweets:
            for tx in on_chain_data:
                if validate_temporal_correlation(tweet.get("created_at"), tx.get("block_time")):
                    if tweet.get("amount") and validate_amount_correlation(tweet["amount"], tx["amount"]):
                        potential_wallet = tx["wallet_address"]
                        logger.info(f"Found potential wallet: {potential_wallet} through amount correlation")
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

        # In DB speichern (achte auf db-Session im Scope!)
        db_analysis = SentimentAnalysis(
            query=request.contract_address,
            sentiment_score=sentiment_score,
            post_count=request.tweet_limit
        )
        db.add(db_analysis)

        db_transactions = [
            OnChainTransaction(
                query=request.contract_address,
                transaction_id=tx.get("signature", tx.get("hash")),
                amount=tx.get("amount", 0),
                transaction_type=tx.get("type", "unknown"),
                block_time=datetime.fromtimestamp(tx.get("blockTime", tx.get("timestamp"))),
                blockchain=request.blockchain.value
            )
            for tx in on_chain_data
        ]
        db.add_all(db_transactions)
        db.commit()

        # Status aktualisieren
        # In der run_analysis Funktion (um Zeile 190):
        # Am Ende der Analyse, vor dem try-Block schließen:
        ANALYSIS_STATUS[job_id] = {
            "status": "Completed",
            "potential_wallets": potential_wallet if potential_wallet else [],
            "analyzed_tweets": len(tweets),
            "analyzed_transactions": len(on_chain_data)
        }
        
    except Exception as e:
        ANALYSIS_STATUS[job_id] = f"Failed: {str(e)}"
        logger.error(f"Analysis failed for job {job_id}: {e}")

@router.get("/analysis/status/{job_id}")
async def get_analysis_status(job_id: str):
    """Gibt den Status der Analyse zurück."""
    status = ANALYSIS_STATUS.get(job_id, "Job ID not found")
    # Fügen Sie hier die Wallet-Informationen hinzu
    return {
        "job_id": job_id, 
        "status": status,
        "potential_wallets": potential_wallet if status == "Completed" else None
    }

@router.post("/track-transactions", response_model=TransactionTrackResponse)
async def track_transactions(
    request: TransactionTrackRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Verfolgt eine Kette von Kryptowährungs-Transaktionen.
    """
    try:
        tracking_service = CryptoTrackingService()
       
        result = await tracking_service.track_transaction_chain(
            start_tx_hash=request.start_tx_hash,
            target_currency=request.target_currency,
            num_transactions=request.num_transactions
        )
       
        # Speichere Transaktionen in der DB im Hintergrund
        background_tasks.add_task(
            save_transactions_to_db,
            db=db,
            transactions=result["transactions"]
        )
       
        return TransactionTrackResponse(**result)
       
    except TransactionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except CryptoTrackerError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Fehler beim Tracking der Transaktionen: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_transactions_to_db(db: Session, transactions: list[dict]):
    """Speichert Transaktionen in der Datenbank"""
    try:
        for tx_data in transactions:
            db_tx = CryptoTransaction(
                transaction_hash=tx_data["hash"],
                currency=tx_data["currency"],
                timestamp=datetime.fromtimestamp(tx_data["timestamp"]),
                amount=tx_data.get("value", 0),
                fee=tx_data.get("fee", 0),
                direction=tx_data["direction"]
            )
            db.add(db_tx)
        db.commit()
    except Exception as e:
        logger.error(f"Fehler beim Speichern der Transaktionen: {e}")
        db.rollback()

        
# ML-basierte Analyse
@router.post("/analyze/ml", response_model=AnalyzeResponse)
async def analyze_ml(request:  AnalyzeRequest, db: Session = Depends(get_db)):
    try:
        # Tweets abrufen (mit Caching)
        twitter_client = TwitterClient()
        tweets = await twitter_client.fetch_and_cache_tweets(request.username, request.post_count)
        if not tweets:
            logger.warning(f"No tweets found for username: {request.username}")
            return {"username": request.username, "potential_wallet": None, "message": "Keine Tweets gefunden."}

        # Transaktionen abrufen (Beispiel-Daten)
        transactions = [
            {"amount": 1.5, "block_time": datetime.now().timestamp()},
            {"amount": 0.3, "block_time": datetime.now().timestamp()}
        ]

        # Features extrahieren
        features = extract_features(tweets, transactions)

        # Labels generieren
        labels = generate_labels(tweets, transactions)

        # TODO: Modell laden und Vorhersagen treffen
        # Beispiel: model.predict(features)

        # Dummy-Ergebnis für die Rückgabe
        potential_wallet = None
        for i, label in enumerate(labels):
            if label == 1:
                potential_wallet = transactions[i]["wallet_address"]
                break

        # Daten in der Datenbank speichern
        sentiment_score = sum(TextBlob(tweet["text"]).sentiment.polarity for tweet in tweets) / len(tweets)
        db_analysis = SentimentAnalysis(
            query=request.username,
            sentiment_score=sentiment_score,
            post_count=len(tweets)
        )
        db.add(db_analysis)

        db_transactions = [
            OnChainTransaction(
                query=request.username,
                transaction_id=tx.get("signature", tx.get("hash")),
                amount=tx["amount"],
                transaction_type="unknown",
                block_time=datetime.fromtimestamp(tx["block_time"]),
                blockchain=request.blockchain
            )
            for tx in transactions
        ]
        db.add_all(db_transactions)
        db.commit()

        # Rückgabe der Ergebnisse
        return AnalyzeResponse(
            username=request.username,
            potential_wallet=potential_wallet,
            tweets=[{"text": tweet["text"], "created_at": tweet["created_at"]} for tweet in tweets],
            on_chain_data=[{"amount": tx["amount"], "block_time": tx["block_time"]} for tx in transactions]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Feedback-Endpunkt
@router.post("/feedback")
def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    try:
        feedback_entry = Feedback(
            tweet_id=feedback.tweet_id,
            transaction_id=feedback.transaction_id,
            label=feedback.label
        )
        db.add(feedback_entry)
        db.commit()

        # Automatisches Retraining, wenn genügend Feedback vorhanden ist
        total_feedback = db.query(Feedback).count()
        if total_feedback % 10 == 0:  # Retrain alle 10 Feedback-Einträge
            train_model(db)

        return {"message": "Feedback received and saved!"}
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Trainingsfortschritt anzeigen
@router.get("/training-progress")
def get_training_progress(db: Session = Depends(get_db)):
    try:
        feedback_data = db.query(Feedback).all()
        feedback_by_date = {}
        for entry in feedback_data:
            date = entry.created_at.date()
            feedback_by_date[date] = feedback_by_date.get(date, 0) + 1

        total_feedback = db.query(Feedback).count()
        positive_feedback = db.query(Feedback).filter(Feedback.label == True).count()
        negative_feedback = db.query(Feedback).filter(Feedback.label == False).count()

        return {
            "total_feedback": total_feedback,
            "positive_feedback": positive_feedback,
            "negative_feedback": negative_feedback,
            "feedback_by_date": feedback_by_date
        }
    except Exception as e:
        logger.error(f"Error fetching training progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Router zur App hinzufügen
app.include_router(router)

# Server starten wenn direkt ausgeführt
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
