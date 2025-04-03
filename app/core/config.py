from pydantic import BaseSettings

class Settings(BaseSettings):
    # Twitter-API-Konfiguration
    TWITTER_BEARER_TOKEN: str
    TWITTER_API_KEY: str
    TWITTER_API_SECRET: str
    TWITTER_ACCESS_TOKEN: str
    TWITTER_ACCESS_SECRET: str

    # Blockchain-API-Konfiguration
    BLOCKCHAIN_API_URL: str
    BLOCKCHAIN_API_KEY: str = None  # Optional, falls kein Schlüssel benötigt wird

    class Config:
        env_file = ".env"  # Lädt die .env-Datei

settings = Settings()
