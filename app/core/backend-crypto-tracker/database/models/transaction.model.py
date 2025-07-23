from sqlalchemy import Column, String, Integer, Float, JSON, DateTime
from database import Base
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

# Beispiel-Nutzung:
if __name__ == "__main__":
    from sqlalchemy import create_engine
    engine = create_engine("postgresql://user:password@localhost/crypto_tracker")
    Base.metadata.create_all(engine)
