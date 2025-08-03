from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True)
    cluster_id = Column(String, unique=True, index=True)
    chain = Column(String, nullable=False)
    label = Column(String)  # e.g. "cex", "dex", "scam"
    confidence = Column(String)  # float 0-1 as string
    updated_at = Column(DateTime, default=datetime.utcnow)

class AddressCluster(Base):
    __tablename__ = "address_cluster"

    address = Column(String, ForeignKey("addresses.address"), primary_key=True)
    cluster_id = Column(String, ForeignKey("clusters.cluster_id"), primary_key=True)
