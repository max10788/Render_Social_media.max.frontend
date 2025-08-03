from sqlalchemy import Column, String, Integer, DateTime, Numeric, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    hash = Column(String, primary_key=True)
    block_number = Column(Integer)
    chain = Column(String, nullable=False, index=True)
    from_address = Column(String, index=True)
    to_address = Column(String, index=True)
    value = Column(Numeric)  # wei / lamports / etc.
    gas_price = Column(Numeric)
    gas_used = Column(Numeric)
    timestamp = Column(DateTime, index=True)
    raw = Column(Text)  # full JSON
