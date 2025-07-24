from sqlalchemy import Column, String, Integer, Float, JSON, DateTime
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    hash = Column(String, unique=True, index=True)
    chain = Column(String)  # "btc", "eth", "sol"
    timestamp = Column(DateTime)
    raw_data = Column(JSON)  # Rohdaten aus der API
    parsed_data = Column(JSON)  # Aus `blockchain-parser.py`
    created_at = Column(DateTime, default=datetime.utcnow)
