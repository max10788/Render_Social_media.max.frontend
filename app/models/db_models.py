from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    sentiment_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OnChainTransaction(Base):
    __tablename__ = "on_chain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    transaction_id = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String)
    block_time = Column(DateTime)
    blockchain = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
