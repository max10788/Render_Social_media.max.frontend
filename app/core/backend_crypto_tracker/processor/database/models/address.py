from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Address(Base):
    __tablename__ = "addresses"

    address = Column(String, primary_key=True)
    chain = Column(String, nullable=False, index=True)
    is_contract = Column(Boolean, default=False)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, onupdate=datetime.utcnow)
    labels = Column(Text)  # JSON list of strings
