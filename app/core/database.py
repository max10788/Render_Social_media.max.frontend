from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.db_models import Base  # Importieren Sie das Base-Objekt

# Verbindung zur Datenbank herstellen
DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)

# SessionLocal für die Datenbankverbindung
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Funktion zum Erstellen der Tabellen
def init_db():
    Base.metadata.create_all(bind=engine)

# Initialisieren der Datenbank beim Start der Anwendung
init_db()
