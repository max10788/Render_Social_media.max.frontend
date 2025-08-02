# app/core/backend_crypto_tracker/database/models/wallet.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Enum as SQLEnum
from enum import Enum
# from .. import Base # If Base is defined in database/__init__.py
Base = declarative_base() # Or import from a central place

# Define Enum here or import if shared
class WalletTypeEnum(Enum):
    DEV_WALLET = "dev_wallet"
    LIQUIDITY_WALLET = "liquidity_wallet"
    WHALE_WALLET = "whale_wallet"
    DEX_CONTRACT = "dex_contract"
    BURN_WALLET = "burn_wallet"
    CEX_WALLET = "cex_wallet"
    SNIPER_WALLET = "sniper_wallet"
    RUGPULL_SUSPECT = "rugpull_suspect"
    UNKNOWN = "unknown"

class WalletAnalysis(Base):
    __tablename__ = "wallet_analyses"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=False) # Assumes tokens table exists
    wallet_address = Column(String, nullable=False, index=True)
    wallet_type = Column(SQLEnum(WalletTypeEnum), nullable=False)
    balance = Column(Float, nullable=False)
    percentage_of_supply = Column(Float, nullable=False)
    transaction_count = Column(Integer)
    first_transaction = Column(DateTime)
    last_transaction = Column(DateTime)
    risk_score = Column(Float)
    analysis_date = Column(DateTime) # Default handled in code or DB

    # Relationship - String reference avoids circular import if Token is defined later/elsewhere
    # Ensure Token model is loaded before querying relationships
    token = relationship("Token", back_populates="wallet_analyses") # back_populates target must exist in Token

    def __repr__(self):
        return f"<WalletAnalysis(id={self.id}, address='{self.wallet_address}', type='{self.wallet_type.value}')>"

from scanner.wallet_classifier import WalletTypeEnum # Importiere die Enum aus dem Scanner

class WalletClassification(Base):
    __tablename__ = 'wallet_classifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_address = Column(String, index=True, nullable=False)
    chain = Column(String, index=True, nullable=False)
    wallet_type = Column(SQLEnum(WalletTypeEnum), nullable=False)
    balance = Column(Float, nullable=False)
    percentage_of_supply = Column(Float)
    risk_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    analysis_date = Column(DateTime, nullable=False)
    sources_used = Column(JSON) # Liste der verwendeten Quellen
    additional_info = Column(JSON) # Zusätzliche Daten aus der Analyse
    created_at = Column(DateTime, default=datetime.utcnow)
