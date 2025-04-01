from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from core.database import Base

class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analysis"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    sentiment_score = Column(Float)
    timestamp = Column(DateTime, server_default=func.now())
