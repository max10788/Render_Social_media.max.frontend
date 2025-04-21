from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    sentiment_score = Column(Float, nullable=False)
    post_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OnChainTransaction(Base):
    __tablename__ = "on_chain_transactions"
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    transaction_id = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String)
    block_time = Column(DateTime, nullable=False)
    blockchain = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    tweet_id = Column(String, index=True)  # ID des Tweets
    transaction_id = Column(String, index=True)  # ID der Transaktion
    label = Column(Boolean, nullable=False)  # Label: True = korreliert, False = nicht korreliert
    created_at = Column(DateTime, default=datetime.utcnow)
