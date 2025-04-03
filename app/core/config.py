from pydantic import BaseSettings

class Settings(BaseSettings):
    # Datenbank- und Redis-Konfiguration
    DATABASE_URL: str
    REDIS_URL: str

    # Twitter-API-Konfiguration
    TWITTER_BEARER_TOKEN: str
    TWITTER_API_KEY: str
    TWITTER_API_SECRET: str
    TWITTER_ACCESS_TOKEN: str
    TWITTER_ACCESS_SECRET: str

    # Blockchain-spezifische Konfigurationen
    SOLANA_RPC_URL: str  # URL für die Solana JSON RPC API
    ETHEREUM_RPC_URL: str  # URL für die Ethereum JSON RPC API (z. B. Infura oder Alchemy)
    MORALIS_API_KEY: str  # API-Schlüssel für Moralis
    MORALIS_BASE_URL: str = "https://deep-index.moralis.io/api/v2"  # Basis-URL für Moralis

    class Config:
        env_file = ".env"  # Lädt die Umgebungsvariablen aus der .env-Datei

settings = Settings()
