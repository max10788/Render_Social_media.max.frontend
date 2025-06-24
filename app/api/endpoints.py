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
from textblob import TextBlob
from decimal import Decimal  # Add this import

# Interne Module importieren
from app.core.feature_engineering import extract_features, generate_labels
from app.core.twitter_api import TwitterClient
from app.core.blockchain_api import fetch_on_chain_data
from app.models.db_models import SentimentAnalysis, OnChainTransaction, Feedback, CryptoTransaction
from app.core.database import get_db, init_db

from app.models.schemas import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    FeedbackRequest, 
    TransactionTrackRequest, 
    TransactionTrackResponse,
    BlockchainEnum,
    FinalStatusEnum,
)

from app.core.solana_tracker.repositories.enhanced_solana_repository import EnhancedSolanaRepository
from app.core.solana_tracker.services.chain_tracker import ChainTracker
from app.core.solana_tracker.services.transaction_service import TransactionService
from app.core.solana_tracker.models.scenario import ScenarioType
from app.core.solana_tracker.repositories.solana_repository import SolanaRepository
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager

from app.core.crypto_tracker import CryptoTrackingService
from app.core.exceptions import CryptoTrackerError, TransactionNotFoundError
from app.models.schemas import TransactionTrackRequest, TransactionTrackResponse
from app.core.exceptions import TransactionNotFoundError, CryptoTrackerError
from app.core.solana_client import SolanaClient
from app.core.ethereum_client import EthereumClient
from app.core.exchange_rate import CoinGeckoExchangeRate
from app.core.cache import InMemoryCache
from app.core.config import get_settings, Settings, MetricsConfig

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

# Dependency für die Settings
def get_app_settings() -> Settings:
    return get_settings()

# Dependency für SolanaRepository
def get_solana_repository(
    settings: Settings = Depends(get_app_settings)
) -> SolanaRepository:
    """Get Solana repository instance."""
    rpc_url = settings.SOLANA_RPC_URL or os.getenv(
        "SOLANA_RPC_URL",
        "https://api.devnet.solana.com"
    )
    return SolanaRepository(rpc_url)

# Dependency für TransactionService
def get_transaction_service(
    repo: SolanaRepository = Depends(get_solana_repository)
) -> TransactionService:
    """Get transaction service instance."""
    return TransactionService(solana_repository=repo)

@router.post("/track-transactions", response_model=TransactionTrackResponse)
async def track_transactions(
    request: TransactionTrackRequest,
    service: TransactionService = Depends(get_transaction_service)
):
    """
    Track a chain of transactions and detect scenarios.
    """
    try:
        logger.info(f"Processing transaction tracking request for {request.start_tx_hash}")

        amount = Decimal(str(request.amount)) if request.amount is not None else None

        tracking_result = await service.analyze_transaction_chain(
            start_tx_hash=request.start_tx_hash,
            max_depth=request.num_transactions,
            target_currency=request.target_currency,
            amount=amount
        )

        if (
            not tracking_result.get("transactions") and
            tracking_result.get("status") in {"no_chain_found", "no_data"}
        ):
            logger.warning(f"No transactions found or accessible in chain starting from {request.start_tx_hash}")
            return TransactionTrackResponse(
                status="no_data",
                total_transactions_tracked=0,
                tracked_transactions=[],
                final_status=FinalStatusEnum.no_transactions_found,
                final_wallet_address=None,
                remaining_amount=request.amount,
                target_currency=request.target_currency,
                detected_scenarios=[],
                scenario_details={
                    "user_message": (
                        "Für die angegebene Transaktion konnten keine Daten abgerufen werden. "
                        "Bitte prüfen Sie, ob die Transaktions-ID korrekt ist und ob die Transaktion auf der Blockchain existiert."
                    ),
                    "suggestion": "Überprüfen Sie die Transaktions-ID und versuchen Sie es ggf. erneut."
                }
            )

        scenarios = tracking_result.get("scenarios", [])
        transactions = tracking_result.get("transactions", [])
        statistics = tracking_result.get("statistics", {})

        final_status = FinalStatusEnum.still_in_same_wallet
        for scenario in scenarios:
            if scenario.type == ScenarioType.burned:
                final_status = FinalStatusEnum.permanently_lost
            elif scenario.type == ScenarioType.delegated_staking:
                final_status = FinalStatusEnum.staked
            elif scenario.type == ScenarioType.cross_chain_bridge:
                final_status = FinalStatusEnum.bridged_to_other_chain
            elif scenario.type == ScenarioType.converted_to_stablecoin:
                final_status = FinalStatusEnum.converted_to_stable

        final_tx = transactions[-1] if transactions else None
        final_wallet = final_tx.to_wallet if final_tx else None
        final_amount = final_tx.amount if final_tx else request.amount

        logger.info(
            f"Successfully tracked {len(transactions)} transactions with "
            f"{len(scenarios)} detected scenarios"
        )

        scenario_details = {}
        for scenario in scenarios:
            scenario_details[scenario.type] = {
                "description": getattr(scenario.details, "user_message", ""),
                "confidence": scenario.confidence,
                "is_terminal": getattr(scenario.details, "is_terminal", False),
                "can_be_recovered": getattr(scenario.details, "can_be_recovered", True),
                "user_action_required": getattr(scenario.details, "user_action_required", False),
                "suggested_actions": getattr(scenario, "next_steps", []) or []
            }

        # Gib die Models direkt an das Response-Model zurück!
        return TransactionTrackResponse(
            status="complete",
            total_transactions_tracked=len(transactions),
            tracked_transactions=transactions,           # <--- Liste von TrackedTransaction
            final_status=final_status,
            final_wallet_address=final_wallet,
            remaining_amount=final_amount,
            target_currency=request.target_currency,
            detected_scenarios=scenarios,                 # <--- Liste von DetectedScenario
            scenario_details=scenario_details,
            statistics=statistics
        )

    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid request parameters",
                "message": str(ve),
                "suggestion": "Please verify the transaction hash and parameters"
            }
        )
    except Exception as e:
        logger.error(f"Error tracking transactions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Transaction tracking failed",
                "message": str(e),
                "suggestion": "Please try again later oder kontaktieren Sie den Support"
            }
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
