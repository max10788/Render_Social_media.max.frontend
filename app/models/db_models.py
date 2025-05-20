from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    sentiment_score = Column(Float, nullable=False)  # Verwenden Sie Float von SQLAlchemy
    post_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OnChainTransaction(Base):
    __tablename__ = "on_chain_transactions"
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    transaction_id = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=False)  # Verwenden Sie Float von SQLAlchemy
    transaction_type = Column(String)
    block_time = Column(DateTime, nullable=False)
    blockchain = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class CryptoTransaction(Base):
    __tablename__ = "crypto_transactions"

    id = Column(Integer, primary_key=True, index=True)
    hash = Column(String, unique=True, index=True)
    from_address = Column(String)
    to_address = Column(String)
    amount = Column(Float)
    amount_converted = Column(Float, nullable=True)
    fee = Column(Float)
    fee_converted = Column(Float, nullable=True)
    currency = Column(String)
    timestamp = Column(DateTime)
    direction = Column(String)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    tweet_id = Column(String, index=True)
    transaction_id = Column(String, index=True)
    label = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
