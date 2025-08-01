# app/core/backend_crypto_tracker/database/manager.py
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
# Import Models
from .models import Token, WalletAnalysis, ScanResult, ScanJob, WalletTypeEnum
# Import SQLAlchemy
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

# Import MongoDB (falls benötigt)
# from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

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
        # MongoDB config if needed
        # ...

    def get_postgres_url(self) -> str:
        return f"postgresql://{self.postgres_config['username']}:{self.postgres_config['password']}@{self.postgres_config['host']}:{self.postgres_config['port']}/{self.postgres_config['database']}"

    # def get_mongodb_url(self) -> str:
    #     ...

class DatabaseManager:
    def __init__(self, database_url: str, database_type: str = "postgresql"):
        self.database_url = database_url
        self.database_type = database_type
        self.engine = None
        self.SessionLocal = None

    async def initialize(self):
        """Initialisiert die Datenbankverbindung"""
        try:
            if self.database_type == "postgresql":
                self.engine = create_engine(self.database_url)
                self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
                # Erstelle Tabellen falls sie nicht existieren
                from .models import Base
                Base.metadata.create_all(bind=self.engine)
                logger.info("PostgreSQL Manager initialisiert und Tabellen erstellt.")
            # elif self.database_type == "mongodb":
            #     # MongoDB Initialisierung
            #     ...
        except Exception as e:
            logger.error(f"Fehler bei der Initialisierung des DatabaseManagers: {e}")
            raise

    def get_session(self) -> Session:
        """Gibt eine neue Datenbank-Session zurück"""
        if self.SessionLocal:
            return self.SessionLocal()
        else:
            raise RuntimeError("DatabaseManager nicht initialisiert.")

    async def close(self):
        """Schließt die Datenbankverbindung"""
        if self.engine:
            self.engine.dispose()
            logger.info("Datenbankverbindung geschlossen.")

    # --- Beispiel für eine Methode, die in api/main.py verwendet wird ---
    # Diese Methode(n) sollten idealerweise in einem Controller aufgerufen werden.
    async def get_tokens(self, limit: int = 50, min_score: float = 0, chain: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Holt eine Liste der analysierten Tokens (vereinfacht)"""
        session = self.get_session()
        try:
            query = session.query(Token)
            if min_score > 0:
                query = query.filter(Token.token_score >= min_score)
            if chain:
                query = query.filter(Token.chain == chain)
            if search:
                query = query.filter(Token.name.contains(search) | Token.symbol.contains(search))
            
            tokens = query.order_by(Token.token_score.desc()).limit(limit).all()
            
            return [
                {
                    'address': token.address,
                    'name': token.name,
                    'symbol': token.symbol,
                    'chain': token.chain,
                    'market_cap': token.market_cap or 0,
                    'volume_24h': token.volume_24h or 0,
                    'score': token.token_score or 0,
                    'holders': token.holders_count or 0,
                    'last_analyzed': token.last_analyzed or datetime.min
                }
                for token in tokens
            ]
        except SQLAlchemyError as e:
            logger.error(f"Datenbankfehler beim Abrufen der Tokens: {e}")
            raise
        finally:
            session.close()

    # TODO: Implementiere weitere Methoden wie save_token_analysis, get_token_analysis,
    # get_wallet_analyses, get_analytics_summary, get_score_distribution, export_to_csv, export_to_json
    # basierend auf den Anforderungen aus api/main.py und dem Setup-Skript.
