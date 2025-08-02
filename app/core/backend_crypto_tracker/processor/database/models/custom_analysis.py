# app/core/backend_crypto_tracker/database/models/custom_analysis.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class CustomAnalysis(Base):
    """Speichert Ergebnisse von benutzerdefinierten Token-Analysen"""
    __tablename__ = "custom_analyses"

    id = Column(Integer, primary_key=True, index=True)
    token_address = Column(String, nullable=False, index=True)
    chain = Column(String, nullable=False, index=True)
    analysis_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Token Informationen
    token_name = Column(String)
    token_symbol = Column(String)
    market_cap = Column(Float)
    volume_24h = Column(Float)
    liquidity = Column(Float)
    holders_count = Column(Integer)
    
    # Analyse Ergebnisse
    total_score = Column(Float, nullable=False)
    metrics = Column(JSON)  # Detaillierte Metriken
    risk_flags = Column(JSON)  # Liste der Risiko-Flags
    
    # Status
    analysis_status = Column(String, default='completed')  # pending, completed, failed
    error_message = Column(Text)
    
    # User Context (optional)
    user_id = Column(String, index=True)  # Falls User-System vorhanden
    session_id = Column(String, index=True)  # Session-basierte Verfolgung

    def __repr__(self):
        return f"<CustomAnalysis(id={self.id}, token='{self.token_symbol}', chain='{self.chain}', score={self.total_score})>"
