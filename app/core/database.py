from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Datenbank-URL aus den Umgebungsvariablen laden
from app.core.config import settings

# Datenbank-Engine erstellen
engine = create_engine(settings.DATABASE_URL)

# SessionLocal für die Datenbankverbindung
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Basis für die Datenbankmodelle
Base = declarative_base()

# Dependency für FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Datenbank initialisieren
def init_db():
    Base.metadata.create_all(bind=engine)
