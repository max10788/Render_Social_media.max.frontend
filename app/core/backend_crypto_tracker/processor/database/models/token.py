# processor/database/models/token.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.backend_crypto_tracker.processor.database.models import Base

class Token(Base):
    __tablename__ = "tokens"
    
    # Primärschlüssel und Identifikation
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(42), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    symbol = Column(String(20), nullable=False, index=True)
    chain = Column(String(20), nullable=False, index=True)
    
    # Token-Metriken
    market_cap = Column(Float)
    volume_24h = Column(Float)
    liquidity = Column(Float)
    holders_count = Column(Integer)
    
    # Token-Informationen
    contract_verified = Column(Boolean, default=False)
    creation_date = Column(DateTime)
    last_analyzed = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    token_score = Column(Float)
    
    # Zeitstempel
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Beziehungen zu anderen Tabellen
    # scan_results = relationship("ScanResult", back_populates="token", lazy="dynamic")
    # wallet_analyses = relationship("WalletAnalysis", back_populates="token", lazy="dynamic")
    
    # Indexe für Performance-Optimierung
    __table_args__ = (
        Index('idx_token_chain_symbol', 'chain', 'symbol'),
        Index('idx_token_score', 'token_score'),
    )
    
    def __repr__(self):
        return f"<Token(symbol='{self.symbol}', chain='{self.chain}', address='{self.address[:8]}...')>"
    
    def to_dict(self):
        """Konvertiert das Token-Objekt in ein Dictionary"""
        return {
            'id': self.id,
            'address': self.address,
            'name': self.name,
            'symbol': self.symbol,
            'chain': self.chain,
            'market_cap': self.market_cap,
            'volume_24h': self.volume_24h,
            'liquidity': self.liquidity,
            'holders_count': self.holders_count,
            'contract_verified': self.contract_verified,
            'creation_date': self.creation_date.isoformat() if self.creation_date else None,
            'last_analyzed': self.last_analyzed.isoformat() if self.last_analyzed else None,
            'token_score': self.token_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @property
    def is_low_cap(self):
        """Prüft, ob es sich um ein Low-Cap Token handelt (< $5M Market Cap)"""
        return self.market_cap is not None and self.market_cap < 5_000_000
