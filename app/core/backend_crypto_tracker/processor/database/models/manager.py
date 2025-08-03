# app/core/backend_crypto_tracker/database/manager.py
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
# Import Models
from app.core.backend_crypto_tracker.processor.database.models.token import Token
from app.core.backend_crypto_tracker.processor.database.models.wallet import WalletAnalysis, WalletTypeEnum
from app.core.backend_crypto_tracker.processor.database.models.scan_result import ScanResult, ScanJob
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

async def save_custom_analysis(self, analysis_data: Dict) -> int:
    """Speichert eine benutzerdefinierte Token-Analyse"""
    from .models.custom_analysis import CustomAnalysis
    
    session = self.get_session()
    try:
        custom_analysis = CustomAnalysis(
            token_address=analysis_data['token_address'],
            chain=analysis_data['chain'],
            token_name=analysis_data.get('token_name'),
            token_symbol=analysis_data.get('token_symbol'),
            market_cap=analysis_data.get('market_cap', 0),
            volume_24h=analysis_data.get('volume_24h', 0),
            liquidity=analysis_data.get('liquidity', 0),
            holders_count=analysis_data.get('holders_count', 0),
            total_score=analysis_data['total_score'],
            metrics=analysis_data.get('metrics', {}),
            risk_flags=analysis_data.get('risk_flags', []),
            user_id=analysis_data.get('user_id'),
            session_id=analysis_data.get('session_id')
        )
        
        session.add(custom_analysis)
        session.commit()
        session.refresh(custom_analysis)
        
        logger.info(f"Custom analysis saved with ID: {custom_analysis.id}")
        return custom_analysis.id
        
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Error saving custom analysis: {e}")
        raise
    finally:
        session.close()

async def get_custom_analysis_history(self, user_id: str = None, 
                                    session_id: str = None, 
                                    limit: int = 50) -> List[Dict]:
    """Holt Historie der benutzerdefinierten Analysen"""
    from .models.custom_analysis import CustomAnalysis
    
    session = self.get_session()
    try:
        query = session.query(CustomAnalysis)
        
        if user_id:
            query = query.filter(CustomAnalysis.user_id == user_id)
        elif session_id:
            query = query.filter(CustomAnalysis.session_id == session_id)
        
        analyses = query.order_by(CustomAnalysis.analysis_date.desc()).limit(limit).all()
        
        return [
            {
                'id': analysis.id,
                'token_address': analysis.token_address,
                'chain': analysis.chain,
                'token_name': analysis.token_name,
                'token_symbol': analysis.token_symbol,
                'total_score': analysis.total_score,
                'analysis_date': analysis.analysis_date,
                'risk_flags': analysis.risk_flags
            }
            for analysis in analyses
        ]
        
    except SQLAlchemyError as e:
        logger.error(f"Error fetching custom analysis history: {e}")
        return []
    finally:
        session.close()

async def get_chain_statistics(self) -> Dict[str, Dict]:
    """Holt Statistiken für verschiedene Chains"""
    from .models.custom_analysis import CustomAnalysis
    from sqlalchemy import func
    
    session = self.get_session()
    try:
        # Statistiken pro Chain
        stats = session.query(
            CustomAnalysis.chain,
            func.count(CustomAnalysis.id).label('total_analyses'),
            func.avg(CustomAnalysis.total_score).label('avg_score'),
            func.max(CustomAnalysis.total_score).label('max_score'),
            func.min(CustomAnalysis.total_score).label('min_score')
        ).group_by(CustomAnalysis.chain).all()
        
        result = {}
        for stat in stats:
            result[stat.chain] = {
                'total_analyses': stat.total_analyses,
                'average_score': round(stat.avg_score, 2) if stat.avg_score else 0,
                'max_score': stat.max_score,
                'min_score': stat.min_score
            }
        
        return result
        
    except SQLAlchemyError as e:
        logger.error(f"Error fetching chain statistics: {e}")
        return {}
    finally:
        session.close().
