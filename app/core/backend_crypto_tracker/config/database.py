# config/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator
import logging

# Zentrale Konfiguration
class DatabaseConfig:
    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/lowcap_analyzer"
        )
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))

    def get_engine(self):
        try:
            engine = create_engine(
                self.database_url,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_timeout=self.pool_timeout,
                pool_recycle=self.pool_recycle,
                echo=os.getenv("DB_ECHO", "false").lower() == "true"
            )
            return engine
        except SQLAlchemyError as e:
            logging.error(f"Failed to create database engine: {str(e)}")
            raise

# Singleton-Instanz
db_config = DatabaseConfig()
engine = db_config.get_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Dependency für FastAPI
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
