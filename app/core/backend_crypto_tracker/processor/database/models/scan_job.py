# app/core/backend_crypto_tracker/processor/database/models/scan_job.py
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.backend_crypto_tracker.processor.database.models import Base
import enum

class ScanStatus(enum.Enum):
    IDLE = "idle"
    SCANNING = "scanning"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class ScanJob(Base):
    __tablename__ = "scan_jobs"
    
    id = Column(String(100), primary_key=True)  # UUID oder ähnlich
    status = Column(Enum(ScanStatus), default=ScanStatus.IDLE)
    progress = Column(Float, default=0.0)  # 0.0 to 1.0
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    tokens_found = Column(Integer, default=0)
    tokens_analyzed = Column(Integer, default=0)
    high_risk_tokens = Column(Integer, default=0)
    chain = Column(String(50), nullable=True)
    scan_type = Column(String(50), default="discovery")  # discovery, analysis, custom
    
    # Beziehungen
    # scan_results = relationship("ScanResult", back_populates="scan_job")
    
    def to_dict(self):
        """Konvertiert das ScanJob-Objekt in ein Dictionary"""
        return {
            'id': self.id,
            'status': self.status.value if isinstance(self.status, ScanStatus) else self.status,
            'progress': self.progress,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'error_message': self.error_message,
            'tokens_found': self.tokens_found,
            'tokens_analyzed': self.tokens_analyzed,
            'high_risk_tokens': self.high_risk_tokens,
            'chain': self.chain,
            'scan_type': self.scan_type
        }
