from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)  # Der Suchbegriff oder Twitter-Benutzername
    sentiment_score = Column(Float, nullable=False)  # Durchschnittlicher Sentiment-Score
    post_count = Column(Integer, nullable=False)  # Anzahl der analysierten Posts
    created_at = Column(DateTime, default=datetime.utcnow)

class OnChainTransaction(Base):
    __tablename__ = "on_chain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)  # Der Suchbegriff oder Twitter-Benutzername
    transaction_id = Column(String, unique=True, index=True)  # Transaktions-ID
    amount = Column(Float, nullable=False)  # Betrag der Transaktion
    transaction_type = Column(String)  # Typ der Transaktion (z. B. "transfer")
    block_time = Column(DateTime)  # Zeitstempel der Transaktion
    blockchain = Column(String, nullable=False)  # Blockchain (z. B. "solana", "ethereum")
    created_at = Column(DateTime, default=datetime.utcnow)
