# processor/database/models/cluster.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.backend_crypto_tracker.processor.database.models import Base

class Cluster(Base):
    __tablename__ = "clusters"
    
    # Primärschlüssel und Identifikation
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    cluster_type = Column(String(50), nullable=False)  # CEX, Whale, Dev, etc.
    chain = Column(String(20), nullable=False, index=True)
    
    # Cluster-Metriken
    address_count = Column(Integer, default=0)
    total_balance_usd = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)  # 0-100
    
    # Metadaten
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Zusätzliche Daten als JSON - umbenannt von 'metadata' zu 'cluster_metadata'
    cluster_metadata = Column(JSON)
    
    # Beziehungen
    # addresses = relationship("Address", back_populates="cluster")
    
    # Indexe für Performance-Optimierung
    __table_args__ = (
        Index('idx_cluster_chain_type', 'chain', 'cluster_type'),
        Index('idx_cluster_risk_score', 'risk_score'),
    )
    
    def __repr__(self):
        return f"<Cluster(name='{self.name}', type='{self.cluster_type}', chain='{self.chain}')>"
    
    def to_dict(self):
        """Konvertiert das Cluster-Objekt in ein Dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'cluster_type': self.cluster_type,
            'chain': self.chain,
            'address_count': self.address_count,
            'total_balance_usd': self.total_balance_usd,
            'risk_score': self.risk_score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'metadata': self.cluster_metadata,  # Verwendung des umbenannten Attributs
        }
