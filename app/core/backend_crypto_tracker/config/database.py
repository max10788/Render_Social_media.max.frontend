# app/core/backend_crypto_tracker/config/database.py
import os
from urllib.parse import urlparse
from app.core.backend_crypto_tracker.utils.logger import get_logger

logger = get_logger(__name__)

class DatabaseConfig:
    def __init__(self):
        # Render.com stellt die Datenbank-URL über die Umgebungsvariable DATABASE_URL bereit
        self.database_url = os.getenv("DATABASE_URL")
        
        if not self.database_url:
            # Fallback für lokale Entwicklung
            logger.warning("DATABASE_URL not found, using fallback configuration")
            self.database_url = os.getenv(
                "POSTGRES_URL",
                "postgresql://postgres:password@localhost:5432/lowcap_analyzer"
            )
        
        # Für SQLAlchemy mit asyncpg
        self.async_database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
        
        # Parse die URL, um einzelne Komponenten zu extrahieren
        parsed_url = urlparse(self.database_url)
        
        self.db_user = parsed_url.username
        self.db_password = parsed_url.password
        self.db_host = parsed_url.hostname
        self.db_port = parsed_url.port or 5432
        self.db_name = parsed_url.path.lstrip('/')
        
        # Connection Pool Einstellungen
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
        
        # Schema-Name für dieses Tool
        self.schema_name = "token_analyzer"
        
        logger.info(f"Database configuration: host={self.db_host}, port={self.db_port}, database={self.db_name}, schema={self.schema_name}")

# Globale Instanz
database_config = DatabaseConfig()
