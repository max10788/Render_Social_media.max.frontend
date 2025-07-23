
from sqlalchemy import Column, String, Integer, JSON, DateTime
from database import Base

class Cluster(Base):
    __tablename__ = "clusters"
    id = Column(Integer, primary_key=True)
    cluster_id = Column(String, unique=True)
    addresses = Column(JSON)  # Liste von Adressen im Cluster
    risk_score = Column(Float)  # Betrugserkennung
    created_at = Column(DateTime)
