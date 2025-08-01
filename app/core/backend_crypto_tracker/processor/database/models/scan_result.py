# app/core/backend_crypto_tracker/database/models/scan_result.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSON # Specific to PostgreSQL
# from .. import Base # If Base is defined in database/__init__.py
Base = declarative_base() # Or import from a central place

class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=False)
    scan_date = Column(DateTime) # Default handled in code or DB
    token_score = Column(Float, nullable=False)
    metrics = Column(JSON)  # JSON-Feld für flexible Metriken
    risk_flags = Column(JSON)  # Risiko-Indikatoren

    # Relationship
    token = relationship("Token", back_populates="scan_results")

    def __repr__(self):
        return f"<ScanResult(id={self.id}, token_id={self.token_id}, score={self.token_score})>"

class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    tokens_processed = Column(Integer, default=0)
    errors = Column(Text)
    config = Column(JSON) # Store job configuration

    def __repr__(self):
        return f"<ScanJob(id={self.id}, name='{self.job_name}', status='{self.status}')>"

