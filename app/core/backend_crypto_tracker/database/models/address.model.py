from sqlalchemy import Column, String, Integer, JSON, DateTime
from database import Base
from datetime import datetime

class Address(Base):
    __tablename__ = "addresses"
    id = Column(Integer, primary_key=True)
    address = Column(String, unique=True, index=True)
    chain = Column(String)  # "btc", "eth", "sol"
    balance = Column(Float)
    transaction_hashes = Column(JSON)  # Liste von Transaktionshashes
    cluster_id = Column(String)  # Für Geldwäsche-Cluster-Analyse
    created_at = Column(DateTime, default=datetime.utcnow)
