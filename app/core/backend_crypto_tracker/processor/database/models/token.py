# app/core/backend_crypto_tracker/database/models/token.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
# Assuming a shared Base is defined in database/__init__.py or models/__init__.py
# For now, we define it here or import it appropriately.
# from .. import Base # If Base is defined in database/__init__.py
Base = declarative_base() # Or import from a central place

# Import WalletAnalysis for relationship (avoids circular imports if handled correctly)
# from .wallet import WalletAnalysis # Can cause issues, often defined in __init__.py or managed by ORM

class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    chain = Column(String, nullable=False)
    market_cap = Column(Float)
    volume_24h = Column(Float)
    liquidity = Column(Float)
    holders_count = Column(Integer)
    contract_verified = Column(Boolean, default=False)
    creation_date = Column(DateTime)
    last_analyzed = Column(DateTime) # Default handled in code or DB
    token_score = Column(Float)

    # Relationships - Ensure models are loaded in correct order or use strings
    # wallet_analyses = relationship("WalletAnalysis", back_populates="token", lazy='select') # Or 'joined'
    # scan_results = relationship("ScanResult", back_populates="token", lazy='select')

    def __repr__(self):
        return f"<Token(id={self.id}, symbol='{self.symbol}', address='{self.address}')>"

# If Base is defined here, it needs to be accessible to other models. Better to define it centrally.
# Consider moving Base definition to database/__init__.py
