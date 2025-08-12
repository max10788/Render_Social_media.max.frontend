# processor/database/models/scan_result.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.backend_crypto_tracker.processor.database.models import Base

class ScanResult(Base):
    __tablename__ = "scan_results"
    
    # Primärschlüssel und Identifikation
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(255), index=True)
    scan_type = Column(String(50), nullable=False)  # token_scan, wallet_scan, etc.
    
    # Token-Informationen
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)
    token_address = Column(String(255))
    chain = Column(String(20), nullable=False, index=True)
    
    # Scan-Ergebnisse
    score = Column(Float)  # 0-100
    risk_level = Column(String(20))  # low, medium, high
    
    # Detaillierte Ergebnisse
    findings = Column(JSON)  # Detaillierte Scan-Ergebnisse
    risk_flags = Column(JSON)  # Liste der Risiko-Flags
    
    # Metadaten
    created_at = Column(DateTime, default=func.now())
    processing_time_ms = Column(Integer)  # Verarbeitungszeit in Millisekunden
    status = Column(String(20), default="completed")  # pending, completed, failed
    
    # Beziehungen
    # token = relationship("Token", back_populates="scan_results")
    
    # Indexe für Performance-Optimierung
    __table_args__ = (
        Index('idx_scan_result_token', 'token_address', 'chain'),
        Index('idx_scan_result_scan_id', 'scan_id'),
        Index('idx_scan_result_score', 'score'),
        Index('idx_scan_result_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<ScanResult(scan_id='{self.scan_id}', type='{self.scan_type}', score={self.score})>"
    
    def to_dict(self):
        """Konvertiert das ScanResult-Objekt in ein Dictionary"""
        return {
            'id': self.id,
            'scan_id': self.scan_id,
            'scan_type': self.scan_type,
            'token_id': self.token_id,
            'token_address': self.token_address,
            'chain': self.chain,
            'score': self.score,
            'risk_level': self.risk_level,
            'findings': self.findings,
            'risk_flags': self.risk_flags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processing_time_ms': self.processing_time_ms,
            'status': self.status,
        }
