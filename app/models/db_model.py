from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Basis für die Datenbankmodelle
Base = declarative_base()

class SentimentAnalysis(Base):
    """
    Datenbankmodell für die Speicherung von Sentiment-Analysen.
    """
    __tablename__ = "sentiment_analysis"

    id = Column(Integer, primary_key=True, index=True)  # Primärschlüssel
    query = Column(String, index=True)  # Der Suchbegriff (z. B. "Solana")
    sentiment_score = Column(Float, nullable=False)  # Der berechnete Sentiment-Wert
    created_at = Column(DateTime, default=datetime.utcnow)  # Zeitstempel der Erstellung

class OnChainTransaction(Base):
    """
    Datenbankmodell für die Speicherung von On-Chain-Transaktionen.
    """
    __tablename__ = "on_chain_transactions"

    id = Column(Integer, primary_key=True, index=True)  # Primärschlüssel
    query = Column(String, index=True)  # Der Suchbegriff, mit dem die Transaktion korreliert wurde
    transaction_id = Column(String, unique=True, index=True)  # Eindeutige Transaktions-ID
    amount = Column(Float, nullable=False)  # Betrag der Transaktion
    transaction_type = Column(String)  # Typ der Transaktion (z. B. "buy", "transfer")
    block_time = Column(DateTime)  # Zeitpunkt der Transaktion auf der Blockchain
    created_at = Column(DateTime, default=datetime.utcnow)  # Zeitstempel der Erstellung
