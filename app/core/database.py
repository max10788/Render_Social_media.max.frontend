from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Datenbank-Engine erstellen
engine = create_engine(settings.DATABASE_URL)

# SessionLocal für die Datenbankverbindung
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Basis für die Datenbankmodelle
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
