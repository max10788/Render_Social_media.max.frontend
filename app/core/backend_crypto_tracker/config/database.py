# app/core/backend_crypto_tracker/config/database.py
import os
import logging
from typing import Optional, List, Dict, Any, Union, AsyncGenerator
from datetime import datetime, timedelta
from contextlib import contextmanager, asynccontextmanager

# Import Models
from app.core.backend_crypto_tracker.processor.database.models.token import Token
from app.core.backend_crypto_tracker.processor.database.models.wallet import WalletAnalysis, WalletTypeEnum
from app.core.backend_crypto_tracker.processor.database.models.scan_result import ScanResult
from app.core.backend_crypto_tracker.processor.database.models.scan_job import ScanJob, ScanStatus
from app.core.backend_crypto_tracker.processor.database.models.custom_analysis import CustomAnalysis

# Import SQLAlchemy
from sqlalchemy import create_engine, text, func, and_, or_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Import the database configuration instead of defining our own
from app.core.backend_crypto_tracker.config.database import database_config

# Import Exceptions
from app.core.backend_crypto_tracker.utils.exceptions import DatabaseException, InvalidAddressException
from app.core.backend_crypto_tracker.utils.logger import get_logger

logger = get_logger(__name__)


class DatabaseManager:
    def __init__(self, database_url: str = None, async_mode: bool = True):
        # Use the configuration from the database module
        if database_url is None:
            if async_mode:
                database_url = database_config.async_database_url
            else:
                database_url = database_config.database_url
        
        self.database_url = database_url
        self.async_mode = async_mode
        self.engine = None
        self.SessionLocal = None
        self.AsyncSessionLocal = None
        
    async def initialize(self):
        """Initialisiert die Datenbankverbindung"""
        try:
            if self.async_mode:
                self.engine = create_async_engine(
                    self.database_url,
                    pool_size=database_config.pool_size,
                    max_overflow=database_config.max_overflow,
                    pool_timeout=database_config.pool_timeout,
                    pool_recycle=database_config.pool_recycle,
                    echo=os.getenv("DB_ECHO", "false").lower() == "true",
                    # Für Render: Füge Schema zum Suchpfad hinzu
                    connect_args={"options": f"-csearch_path={database_config.schema_name},public"}
                )
                self.AsyncSessionLocal = async_sessionmaker(
                    bind=self.engine, 
                    class_=AsyncSession, 
                    expire_on_commit=False
                )
            else:
                self.engine = create_engine(
                    self.database_url,
                    pool_size=database_config.pool_size,
                    max_overflow=database_config.max_overflow,
                    pool_timeout=database_config.pool_timeout,
                    pool_recycle=database_config.pool_recycle,
                    echo=os.getenv("DB_ECHO", "false").lower() == "true",
                    # Für Render: Füge Schema zum Suchpfad hinzu
                    connect_args={"options": f"-csearch_path={database_config.schema_name},public"}
                )
                self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            
            # Erstelle Schema und Tabellen
            await self._create_schema_and_tables()
                
            logger.info("Database Manager initialized and tables created.")
        except Exception as e:
            logger.error(f"Error initializing DatabaseManager: {e}")
            raise DatabaseException(f"Failed to initialize database: {str(e)}")
    
    async def _create_schema_and_tables(self):
        """Erstellt das Schema und die Tabellen"""
        async with self.engine.begin() as conn:
            # Erstelle Schema wenn es nicht existiert
            await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {database_config.schema_name}"))
            
            # Setze den Suchpfad
            await conn.execute(text(f"SET search_path TO {database_config.schema_name}, public"))
            
            # Erstelle Tabellen
            from app.core.backend_crypto_tracker.processor.database.models import Base
            await conn.run_sync(Base.metadata.create_all)
    
    @contextmanager
    def get_session(self):
        """Context Manager für synchrone Datenbank-Sessions"""
        if not self.SessionLocal:
            raise RuntimeError("DatabaseManager not initialized for synchronous mode.")
        
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise DatabaseException(f"Database operation failed: {str(e)}")
        finally:
            session.close()
    
    @asynccontextmanager
    async def get_async_session(self):
        """Async Context Manager für asynchrone Datenbank-Sessions"""
        if not self.AsyncSessionLocal:
            raise RuntimeError("DatabaseManager not initialized for asynchronous mode.")
        
        async with self.AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {e}")
                raise DatabaseException(f"Database operation failed: {str(e)}")
    
    async def close(self):
        """Schließt die Datenbankverbindung"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connection closed.")

class DatabaseConfig:
    def __init__(self):
        # Render.com stellt die Datenbank-URL über die Umgebungsvariable DATABASE_URL bereit
        self.database_url = os.getenv("DATABASE_URL")
        
        if not self.database_url:
            # Fallback für lokale Entwicklung
            logger.warning("DATABASE_URL not found, using fallback configuration")
            self.database_url = os.getenv(
                "POSTGRES_URL",
                "postgresql://postgres:password@localhost:5432/lowcap_analyzer"
            )
        
        # Für SQLAlchemy mit asyncpg
        self.async_database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        
        # Parse die URL, um einzelne Komponenten zu extrahieren
        parsed_url = urlparse(self.database_url)
        
        self.db_user = parsed_url.username
        self.db_password = parsed_url.password
        self.db_host = parsed_url.hostname
        self.db_port = parsed_url.port or 5432
        self.db_name = parsed_url.path.lstrip('/')
        
        # Connection Pool Einstellungen
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
        
        # Schema-Name für dieses Tool
        self.schema_name = "token_analyzer"
        
        logger.info(f"Database configuration: host={self.db_host}, port={self.db_port}, database={self.db_name}, schema={self.schema_name}")

# Globale Instanz
database_config = DatabaseConfig()

# Synchrone Engine und Session für FastAPI-Routen
engine = create_engine(
    database_config.database_url,
    pool_size=database_config.pool_size,
    max_overflow=database_config.max_overflow,
    pool_timeout=database_config.pool_timeout,
    pool_recycle=database_config.pool_recycle,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    connect_args={"options": f"-csearch_path={database_config.schema_name},public"}
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Dependency für FastAPI
def get_db() -> Generator[Session, None, None]:
    """Stellt eine Datenbank-Session für FastAPI-Routen bereit"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
