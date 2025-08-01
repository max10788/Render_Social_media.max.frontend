# app/core/backend_crypto_tracker/database/__init__.py
import os
import logging
from datetime import datetime
from typing import List, Dict, Optional
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.dialects.postgresql import JSON
# import asyncpg # Not used directly in provided code snippets for sync manager
from motor.motor_asyncio import AsyncIOMotorClient
# from enum import Enum # Imported in models
# import pandas as pd # Not used directly here

# --- Central Definition of Base ---
Base = declarative_base()
# --- End Central Definition ---

# Logging Setup
logger = logging.getLogger(__name__)

# Import models here *after* Base is defined to avoid issues
# from .models import Token, WalletAnalysis, WalletTypeEnum, ScanResult, ScanJob
# It's often better to import them inside functions or ensure models/__init__.py handles registration

# --- Database Configuration Class ---
class DatabaseConfig:
    def __init__(self, database_type: str = "postgresql"):
        self.database_type = database_type
        self.postgres_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': int(os.getenv('POSTGRES_PORT', 5432)),
            'database': os.getenv('POSTGRES_DB', 'lowcap_analyzer'),
            'username': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password')
        }
        self.mongodb_config = {
            'host': os.getenv('MONGODB_HOST', 'localhost'),
            'port': int(os.getenv('MONGODB_PORT', 27017)),
            'database': os.getenv('MONGODB_DB', 'lowcap_analyzer'),
            'username': os.getenv('MONGODB_USER'),
            'password': os.getenv('MONGODB_PASSWORD')
        }

    def get_postgres_url(self) -> str:
        return f"postgresql://{self.postgres_config['username']}:{self.postgres_config['password']}@{self.postgres_config['host']}:{self.postgres_config['port']}/{self.postgres_config['database']}"

    def get_mongodb_url(self) -> str:
        if self.mongodb_config['username'] and self.mongodb_config['password']:
            return f"mongodb://{self.mongodb_config['username']}:{self.mongodb_config['password']}@{self.mongodb_config['host']}:{self.mongodb_config['port']}/{self.mongodb_config['database']}"
        return f"mongodb://{self.mongodb_config['host']}:{self.mongodb_config['port']}/{self.mongodb_config['database']}"

# --- PostgreSQL Database Manager ---
class PostgreSQLManager:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def create_tables(self):
        """Erstellt alle Tabellen"""
        # Import models here to ensure they are registered with Base before creating tables
        from .models import Token, WalletAnalysis, ScanResult, ScanJob
        Base.metadata.create_all(bind=self.engine)
        logger.info("PostgreSQL Tabellen erstellt")

    def get_session(self) -> Session:
        """Gibt eine neue Datenbank-Session zurück"""
        return self.SessionLocal()

    def save_token_analysis(self, token_data: Dict, wallet_analyses: List[Dict], metrics: Dict) -> int:
        """Speichert eine komplette Token-Analyse"""
        # Import models inside function to avoid circular imports at module level
        from .models import Token, WalletAnalysis, WalletTypeEnum, ScanResult
        session = self.get_session()
        try:
            # Token speichern oder aktualisieren
            token = session.query(Token).filter(Token.address == token_data['address']).first()
            if not token:
                token = Token(
                    address=token_data['address'],
                    name=token_data['name'],
                    symbol=token_data['symbol'],
                    chain=token_data['chain'],
                    market_cap=token_data['market_cap'],
                    volume_24h=token_data['volume_24h'],
                    liquidity=token_data['liquidity'],
                    holders_count=token_data['holders_count'],
                    contract_verified=token_data['contract_verified'],
                    creation_date=token_data.get('creation_date'),
                    token_score=token_data.get('token_score', 0),
                    last_analyzed=datetime.utcnow() # Set here as default
                )
                session.add(token)
                session.flush() # Get the ID
            else:
                # Update existing token
                token.market_cap = token_data['market_cap']
                token.volume_24h = token_data['volume_24h']
                token.liquidity = token_data['liquidity']
                token.last_analyzed = datetime.utcnow()
                token.token_score = token_data.get('token_score', 0)

            # Wallet-Analysen speichern (assuming token.id is available)
            if token.id: # Check if token was successfully added/exists
              for wallet_data in wallet_analyses:
                  # Ensure wallet_type string is valid for the Enum
                  wallet_type_enum = WalletTypeEnum(wallet_data['wallet_type'])
                  wallet_analysis = WalletAnalysis(
                      token_id=token.id,
                      wallet_address=wallet_data['address'],
                      wallet_type=wallet_type_enum,
                      balance=wallet_data['balance'],
                      percentage_of_supply=wallet_data['percentage_of_supply'],
                      transaction_count=wallet_data.get('transaction_count', 0),
                      first_transaction=wallet_data.get('first_transaction'),
                      last_transaction=wallet_data.get('last_transaction'),
                      risk_score=wallet_data.get('risk_score', 0),
                      analysis_date=datetime.utcnow() # Set default here
                  )
                  session.add(wallet_analysis)

            # Scan-Ergebnis speichern
            if token.id: # Check if token was successfully added/exists
                scan_result = ScanResult(
                    token_id=token.id,
                    token_score=token_data.get('token_score', 0),
                    metrics=metrics,
                    risk_flags=token_data.get('risk_flags', {}),
                    scan_date=datetime.utcnow() # Set default here
                )
                session.add(scan_result)

            session.commit()
            logger.info(f"Token-Analyse für {token_data['symbol']} gespeichert (ID: {token.id})")
            return token.id if token else -1 # Return ID or error indicator
        except Exception as e:
            session.rollback()
            logger.error(f"Fehler beim Speichern der Token-Analyse für {token_data.get('symbol', 'Unknown')}: {e}", exc_info=True)
            # Re-raise exception if caller needs to handle it
            raise
        finally:
            session.close()

    def get_top_scored_tokens(self, limit: int = 50) -> List[Dict]:
        """Holt die am besten bewerteten Tokens"""
        from .models import Token # Import inside function
        session = self.get_session()
        try:
            tokens = session.query(Token).filter(Token.token_score.isnot(None)).order_by(Token.token_score.desc()).limit(limit).all()
            return [
                {
                    'address': token.address,
                    'name': token.name,
                    'symbol': token.symbol,
                    'token_score': token.token_score,
                    'market_cap': token.market_cap,
                    'last_analyzed': token.last_analyzed
                }
                for token in tokens
            ]
        finally:
            session.close()

    def get_token_analysis(self, token_address: str) -> Optional[Dict]:
        """Holt die vollständige Analyse für einen Token"""
        from .models import Token, WalletAnalysis, ScanResult # Import inside function
        session = self.get_session()
        try:
            token = session.query(Token).filter(Token.address == token_address).first()
            if not token:
                return None
            # Eager load relationships if needed, or load separately
            wallet_analyses = session.query(WalletAnalysis).filter(WalletAnalysis.token_id == token.id).all()
            # Get latest scan result
            scan_result = session.query(ScanResult).filter(ScanResult.token_id == token.id).order_by(ScanResult.scan_date.desc()).first()
            return {
                'token': {
                    'address': token.address,
                    'name': token.name,
                    'symbol': token.symbol,
                    'chain': token.chain,
                    'market_cap': token.market_cap,
                    'token_score': token.token_score,
                    'last_analyzed': token.last_analyzed
                },
                'wallet_analyses': [
                    {
                        'address': wa.wallet_address,
                        'type': wa.wallet_type.value,
                        'balance': wa.balance,
                        'percentage': wa.percentage_of_supply,
                        'risk_score': wa.risk_score
                    }
                    for wa in wallet_analyses
                ],
                'metrics': scan_result.metrics if scan_result else {},
                'scan_date': scan_result.scan_date if scan_result else None
            }
        finally:
            session.close()

# --- MongoDB Manager (Alternative) ---
class MongoDBManager:
    def __init__(self, database_url: str, database_name: str):
        self.client = AsyncIOMotorClient(database_url)
        self.db = self.client[database_name]
        self.tokens_collection = self.db.tokens
        self.wallet_analyses_collection = self.db.wallet_analyses
        self.scan_results_collection = self.db.scan_results
        self.scan_jobs_collection = self.db.scan_jobs

    async def create_indexes(self):
        """Erstellt notwendige Indizes"""
        await self.tokens_collection.create_index("address", unique=True)
        await self.tokens_collection.create_index("symbol")
        # Add more indexes as needed for other collections

    # Placeholder for MongoDB methods (implement as needed)
    # async def save_token_analysis_mongo(self, data: Dict):
    #     ...
    # async def get_top_scored_tokens_mongo(self, limit: int = 50) -> List[Dict]:
    #     ...

