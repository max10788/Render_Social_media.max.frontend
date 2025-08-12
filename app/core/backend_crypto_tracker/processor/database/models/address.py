# processor/database/models/address.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.backend_crypto_tracker.processor.database.models import Base

class Address(Base):
    __tablename__ = "addresses"
    
    # Primärschlüssel und Identifikation
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(255), unique=True, index=True, nullable=False)
    chain = Column(String(20), nullable=False, index=True)
    
    # Adressinformationen
    address_type = Column(String(50))  # EOA, Contract, etc.
    is_contract = Column(Boolean, default=False)
    label = Column(String(100))  # CEX, Whale, Dev, etc.
    risk_score = Column(Integer, default=0)  # 0-100
    
    # Metadaten
    first_seen = Column(DateTime, default=func.now())
    last_activity = Column(DateTime, default=func.now(), onupdate=func.now())
    transaction_count = Column(Integer, default=0)
    
    # Zusätzliche Daten als JSON - umbenannt von 'metadata' zu 'address_metadata'
    address_metadata = Column(JSON)
    
    # Beziehungen
    # transactions = relationship("Transaction", back_populates="from_address")
    # wallet_analysis = relationship("WalletAnalysis", back_populates="address")
    
    # Indexe für Performance-Optimierung
    __table_args__ = (
        Index('idx_address_chain_type', 'chain', 'address_type'),
        Index('idx_address_risk_score', 'risk_score'),
    )
    
    def __repr__(self):
        return f"<Address(address='{self.address[:8]}...', chain='{self.chain}', type='{self.address_type}')>"
    
    def to_dict(self):
        """Konvertiert das Address-Objekt in ein Dictionary"""
        return {
            'id': self.id,
            'address': self.address,
            'chain': self.chain,
            'address_type': self.address_type,
            'is_contract': self.is_contract,
            'label': self.label,
            'risk_score': self.risk_score,
            'first_seen': self.first_seen.isoformat() if self.first_seen else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'transaction_count': self.transaction_count,
            'metadata': self.address_metadata,  # Verwendung des umbenannten Attributs
        }
