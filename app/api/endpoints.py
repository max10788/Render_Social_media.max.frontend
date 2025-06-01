from fastapi import FastAPI, APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
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
from fastapi.staticfiles import StaticFiles
from typing import List, Dict
import aiohttp

# Interne Module importieren
from app.core.twitter_api import TwitterClient
from app.core.blockchain_api import fetch_on_chain_data
from app.models.db_models import SentimentAnalysis, OnChainTransaction, Feedback, CryptoTransaction
from app.core.database import get_db, init_db
from app.core.feature_engineering import extract_features, generate_labels
from textblob import TextBlob
from app.models.schemas import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    FeedbackRequest, 
    TransactionTrackRequest, 
    TransactionTrackResponse,
    BlockchainEnum  # Add this import
)
from app.core.crypto_tracker import CryptoTrackingService
from app.core.exceptions import CryptoTrackerError, TransactionNotFoundError
from app.models.schemas import TransactionTrackRequest, TransactionTrackResponse
from app.core.exceptions import TransactionNotFoundError, CryptoTrackerError
from app.core.solana_client import SolanaClient
from app.core.ethereum_client import EthereumClient
from app.core.exchange_rate import CoinGeckoExchangeRate
from app.core.cache import InMemoryCache

# Logger konfigurieren
logger = logging.getLogger(__name__)

# Globale Variable für Status-Tracking
ANALYSIS_STATUS = {}

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
@router.post("/analyze/rule-based")
async def start_analysis(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks
):
    """Startet die Analyse und gibt eine Job-ID zurück."""
    try:
        job_id = str(uuid.uuid4())
        ANALYSIS_STATUS[job_id] = "In Progress"
        
        # Start the analysis in the background
        background_tasks.add_task(run_analysis, request, job_id)
        
        return {"job_id": job_id, "status": "Analysis started"}
    except Exception as e:
        logger.error(f"Error starting analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_analysis(request: AnalyzeRequest, job_id: str):
    """Führt die Analyse im Hintergrund durch."""
    try:
        logger.debug(f"Starting analysis for job {job_id}")
        logger.debug(f"Received request with blockchain: {request.blockchain}")

        # Initialize variables
        tweets = []
        on_chain_data = []
        db = next(get_db())  # Get database session

        try:
            # 1. Blockchain-Parameter validieren
            if not request.blockchain:
                error_msg = "Failed: No blockchain specified"
                ANALYSIS_STATUS[job_id] = error_msg
                logger.error(error_msg)
                return

            blockchain_value = request.blockchain.value.lower() if hasattr(request.blockchain, 'value') else str(request.blockchain).lower()

            if blockchain_value not in ["ethereum", "solana", "binance", "polygon"]:
                error_msg = f"Failed: Unsupported blockchain: {blockchain_value}"
                ANALYSIS_STATUS[job_id] = error_msg
                logger.error(error_msg)
                return

            # 2. Tweets basierend auf Keywords abrufen
            twitter_client = TwitterClient()
            tweets = await twitter_client.fetch_tweets_by_keywords(
                keywords=request.keywords,
                start_date=request.start_date,
                end_date=request.end_date,
                tweet_limit=request.tweet_limit
            )
            if not tweets:
                ANALYSIS_STATUS[job_id] = "Failed: No tweets found"
                logger.warning("No tweets found for the given criteria")
                return

            # 3. Blockchain-RPC-Endpunkt ermitteln
            blockchain_endpoint = {
                "solana": os.getenv("SOLANA_RPC_URL"),
                "ethereum": os.getenv("ETHEREUM_RPC_URL"),
                "binance": os.getenv("BINANCE_RPC_URL"),
                "polygon": os.getenv("POLYGON_RPC_URL"),
            }.get(blockchain_value)

            if not blockchain_endpoint:
                error_msg = "Failed: Unsupported blockchain endpoint"
                ANALYSIS_STATUS[job_id] = error_msg
                logger.error(error_msg)
                return

            # 4. On-Chain-Daten abrufen
            on_chain_data = fetch_on_chain_data(blockchain_endpoint, request.contract_address)
            if not on_chain_data:
                ANALYSIS_STATUS[job_id] = "Failed: No on-chain data found"
                logger.warning("No on-chain data found for the contract address")
                return

            # 5. Korrelation zwischen Tweets und Transaktionen herstellen
            potential_wallets = set()
            for tweet in tweets:
                for tx in on_chain_data:
                    if validate_temporal_correlation(tweet.get("created_at"), tx.get("block_time")):
                        if tweet.get("amount") and validate_amount_correlation(tweet["amount"], tx.get("amount", 0)):
                            potential_wallets.add(tx["wallet_address"])
                            logger.info(f"Found wallet via amount correlation: {tx['wallet_address']}")
                    if validate_keyword_correlation(tweet.get("keywords", []), tx.get("description", "")):
                        potential_wallets.add(tx["wallet_address"])
                    if validate_address_correlation(tweet.get("addresses", []), tx.get("wallet_address", "")):
                        potential_wallets.add(tx["wallet_address"])
                    if validate_hashtag_correlation(tweet.get("hashtags", []), tx.get("description", "")):
                        potential_wallets.add(tx["wallet_address"])
                    if validate_link_correlation(tweet.get("links", []), tx.get("description", "")):
                        potential_wallets.add(tx["wallet_address"])

            # 6. Sentiment-Score berechnen
            sentiment_texts = [tweet["text"] for tweet in tweets if "text" in tweet]
            sentiment_score = calculate_sentiment_score(sentiment_texts)

            # 7. In Datenbank speichern
            db_analysis = SentimentAnalysis(
                query=request.contract_address,
                sentiment_score=sentiment_score,
                post_count=len(tweets),
            )
            db.add(db_analysis)

            db_transactions = [
                OnChainTransaction(
                    query=request.contract_address,
                    transaction_id=tx.get("signature", tx.get("hash")),
                    amount=tx.get("amount", 0),
                    transaction_type=tx.get("type", "unknown"),
                    block_time=datetime.fromtimestamp(tx.get("blockTime", tx.get("timestamp"))),
                    blockchain=blockchain_value.capitalize()
                )
                for tx in on_chain_data
            ]
            db.add_all(db_transactions)
            db.commit()

            # 8. Status aktualisieren
            ANALYSIS_STATUS[job_id] = {
                "status": "Completed",
                "potential_wallets": list(potential_wallets),
                "analyzed_tweets": len(tweets),
                "analyzed_transactions": len(on_chain_data)
            }

            logger.info(f"Analysis completed successfully for job {job_id}")

        except Exception as e:
            db.rollback()  # Rollback database changes on error
            raise e
        finally:
            db.close()  # Always close the database session

    except Exception as e:
        error_msg = f"Failed: {str(e)}"
        ANALYSIS_STATUS[job_id] = error_msg
        logger.exception(f"Error during analysis for job {job_id}: {e}")


@router.get("/analysis/status/{job_id}")
async def get_analysis_status(job_id: str):
    """Gibt den Status der Analyse zurück."""
    status = ANALYSIS_STATUS.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found")
        
    return {
        "job_id": job_id, 
        "status": status,
        "potential_wallets": status.get("potential_wallets", []) if isinstance(status, dict) else None,
        "analyzed_tweets": status.get("analyzed_tweets", 0) if isinstance(status, dict) else 0,
        "analyzed_transactions": status.get("analyzed_transactions", 0) if isinstance(status, dict) else 0
    }

def get_crypto_service() -> CryptoTrackingService:
    """Dependency to get CryptoTrackingService instance."""
    try:
        return CryptoTrackingService()
    except Exception as e:
        logger.error(f"Error creating CryptoTrackingService: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize crypto tracking service"
        )

#--------------------------i
# track-transaction
#--------------------------i

@router.post("/track-transactions", response_model=TransactionTrackResponse)
async def track_transactions(request: TransactionTrackRequest):
    """Track a chain of transactions starting from a given transaction hash."""
    try:
        # Initialize Solana client with configured RPC URL
        solana_client = SolanaClient(os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com"))
        
        # Validate transaction exists
        try:
            tx_info = await solana_client.get_transaction(request.start_tx_hash)
            if not tx_info:
                raise HTTPException(
                    status_code=404, 
                    detail="Start transaction not found"
                )
        except ValueError as ve:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transaction signature: {str(ve)}"
            )

        # Track transaction chain
        tracked_transactions = await solana_client.track_transaction_chain(
            start_tx_hash=request.start_tx_hash,
            amount=request.amount,
            max_depth=request.num_transactions
        )

        if not tracked_transactions:
            return TransactionTrackResponse(
                status="complete",
                total_transactions_tracked=0,
                tracked_transactions=[],
                final_status=FinalStatusEnum.still_in_same_wallet,
                final_wallet_address=None,
                remaining_amount=request.amount,
                target_currency=request.target_currency,
                detected_scenarios=[],
                scenario_details={}
            )

        # Rest of your endpoint implementation...

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error tracking transactions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to track transactions: {str(e)}"
        )
        
#--------------------------i
# ML-basierte Analyse
#--------------------------i

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
