from pydantic import BaseSettings
from dotenv import load_dotenv
from functools import lru_cache
import os
from typing import Optional

# Load the .env file
load_dotenv()

class Settings(BaseSettings):
    # Database and Cache Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crypto_tracker.db")
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")

    # Twitter API Settings
    TWITTER_BEARER_TOKEN: Optional[str] = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY: Optional[str] = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET: Optional[str] = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN: Optional[str] = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET: Optional[str] = os.getenv("TWITTER_ACCESS_SECRET")

    # Blockchain RPC URLs
    SOLANA_RPC_URL: Optional[str] = os.getenv("SOLANA_RPC_URL")
    ETHEREUM_RPC_URL: Optional[str] = os.getenv("ETHEREUM_RPC_URL")
    BINANCE_RPC_URL: Optional[str] = os.getenv("BINANCE_RPC_URL")
    POLYGON_RPC_URL: Optional[str] = os.getenv("POLYGON_RPC_URL")

    # API Keys
    MORALIS_API_KEY: Optional[str] = os.getenv("MORALIS_API_KEY")
    ETHERSCAN_API_KEY: Optional[str] = os.getenv("ETHERSCAN_API_KEY")
    COINGECKO_API_KEY: Optional[str] = os.getenv("COINGECKO_API_KEY")

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Crypto-Flow"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Cache Settings
    CACHE_TTL: int = 3600  # 1 hour in seconds

    class Config:
        env_file = ".env"
        case_sensitive = True
        
        # Example configuration values for documentation
        schema_extra = {
            "example": {
                "DATABASE_URL": "postgresql://user:password@localhost:5432/db",
                "REDIS_URL": "redis://localhost:6379/0",
                "TWITTER_BEARER_TOKEN": "your-twitter-bearer-token",
                "ETHEREUM_RPC_URL": "https://mainnet.infura.io/v3/your-project-id",
                "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com",
            }
        }

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Returns cached settings to avoid loading .env file on every request
    """
    return Settings()

# Create settings instance
settings = get_settings()

# Validation function for settings
def validate_settings():
    """
    Validate that all required settings are present and valid.
    Raises ValueError if any required setting is missing or invalid.
    """
    required_settings = {
        "DATABASE_URL": settings.DATABASE_URL,
        "TWITTER_BEARER_TOKEN": settings.TWITTER_BEARER_TOKEN,
        "SECRET_KEY": settings.SECRET_KEY
    }

    missing_settings = [key for key, value in required_settings.items() if not value]
    
    if missing_settings:
        raise ValueError(
            f"Missing required settings: {', '.join(missing_settings)}. "
            "Please check your .env file or environment variables."
        )

# Optional: Validate settings on import
try:
    validate_settings()
except ValueError as e:
    import logging
    logging.warning(f"Settings validation warning: {str(e)}")
