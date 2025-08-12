# processor/database/models/wallet.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index, Text, JSON, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.backend_crypto_tracker.processor.database.models import Base
import enum

class WalletTypeEnum(enum.Enum):
    UNKNOWN = "unknown"
    EOA = "eoa"
    CONTRACT = "contract"
    CEX_WALLET = "cex_wallet"
    DEFI_WALLET = "defi_wallet"
    DEV_WALLET = "dev_wallet"
    WHALE_WALLET = "whale_wallet"
    SNIPER_WALLET = "sniper_wallet"
    RUGPULL_SUSPECT = "rugpull_suspect"
    BURN_WALLET = "burn_wallet"
    DEX_CONTRACT = "dex_contract"

class WalletAnalysis(Base):
    __tablename__ = "wallet_analyses"
    
    # Primärschlüssel und Identifikation
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(255), nullable=False, index=True)
    chain = Column(String(20), nullable=False, index=True)
    
    # Wallet-Klassifizierung
    wallet_type = Column(Enum(WalletTypeEnum), nullable=False, index=True)
    confidence_score = Column(Float)  # 0-1, wie sicher die Klassifizierung ist
    
    # Token-bezogene Daten
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)
    token_address = Column(String(255))
    balance = Column(Float)
    percentage_of_supply = Column(Float)
    
    # Transaktionsdaten
    transaction_count = Column(Integer, default=0)
    first_transaction = Column(DateTime)
    last_transaction = Column(DateTime)
    
    # Risikoanalyse
    risk_score = Column(Float)  # 0-100
    risk_flags = Column(JSON)  # Liste der Risiko-Flags
    
    # Metadaten
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Beziehungen
    # token = relationship("Token", back_populates="wallet_analyses")
    # address = relationship("Address", back_populates="wallet_analysis")
    
    # Indexe für Performance-Optimierung
    __table_args__ = (
        Index('idx_wallet_analysis_token', 'token_address', 'chain'),
        Index('idx_wallet_analysis_type', 'wallet_type'),
        Index('idx_wallet_analysis_risk', 'risk_score'),
        Index('idx_wallet_analysis_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<WalletAnalysis(address='{self.wallet_address[:8]}...', type='{self.wallet_type.value}', risk={self.risk_score})>"
    
    def to_dict(self):
        """Konvertiert das WalletAnalysis-Objekt in ein Dictionary"""
        return {
            'id': self.id,
            'wallet_address': self.wallet_address,
            'chain': self.chain,
            'wallet_type': self.wallet_type.value if self.wallet_type else None,
            'confidence_score': self.confidence_score,
            'token_id': self.token_id,
            'token_address': self.token_address,
            'balance': self.balance,
            'percentage_of_supply': self.percentage_of_supply,
            'transaction_count': self.transaction_count,
            'first_transaction': self.first_transaction.isoformat() if self.first_transaction else None,
            'last_transaction': self.last_transaction.isoformat() if self.last_transaction else None,
            'risk_score': self.risk_score,
            'risk_flags': self.risk_flags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
