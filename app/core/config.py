from pydantic import BaseSettings, AnyUrl, validator
from typing import Optional, Dict, Any
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class MetricsConfig:
    """Metrics configuration."""
    METRICS_WINDOW_SIZE = 3600  # 1 hour
    ALERT_THRESHOLD = 0.1  # 10%

class SolanaConfig:
    def __init__(
        self,
        primary_rpc_url: Optional[str] = None,
        fallback_rpc_urls: Optional[List[str]] = None,
        rate_limit_rate: Optional[int] = None,
        rate_limit_capacity: Optional[Union[int, dict, str]] = None,
        health_check_interval: Optional[int] = None
    ):
        # Primäre RPC URL
        self.primary_rpc_url = primary_rpc_url or os.getenv("SOLANA_RPC_URL")
        
        # Fallback URLs
        if fallback_rpc_urls is not None:
            self.fallback_rpc_urls = fallback_rpc_urls
        else:
            self.fallback_rpc_urls = self._get_fallback_rpc_urls()

        # Rate Limiting
        self.rate_limit_rate = rate_limit_rate or int(os.getenv("SOLANA_RATE_LIMIT_RATE", "50"))
        
        capacity_env = os.getenv("SOLANA_RATE_LIMIT_CAPACITY", "100")
        if rate_limit_capacity is not None:
            self.rate_limit_capacity = rate_limit_capacity
        else:
            try:
                self.rate_limit_capacity = int(capacity_env)
            except ValueError:
                self.rate_limit_capacity = capacity_env  # könnte auch ein JSON/dict sein

        # Health Check
        self.health_check_interval = health_check_interval or int(
            os.getenv("SOLANA_HEALTH_CHECK_INTERVAL", "60")
        )

    def _get_fallback_rpc_urls(self) -> List[str]:
        fallback_urls_str = os.getenv("SOLANA_FALLBACK_RPC_URLS", "")
        return [url.strip() for url in fallback_urls_str.split(",")] if fallback_urls_str else []

class Settings(BaseSettings):
    # Existing Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crypto_tracker.db")
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    
    # Twitter API Settings
    TWITTER_BEARER_TOKEN: Optional[str] = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY: Optional[str] = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET: Optional[str] = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN: Optional[str] = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET: Optional[str] = os.getenv("TWITTER_ACCESS_SECRET")

    # Blockchain RPC URLs
    SOLANA_RPC_URL: str = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")
    ETHEREUM_RPC_URL: Optional[str] = os.getenv("ETHEREUM_RPC_URL")
    BINANCE_RPC_URL: Optional[str] = os.getenv("BINANCE_RPC_URL")
    POLYGON_RPC_URL: Optional[str] = os.getenv("POLYGON_RPC_URL")

    # API Keys
    MORALIS_API_KEY: Optional[str] = os.getenv("MORALIS_API_KEY")
    ETHERSCAN_API_KEY: Optional[str] = os.getenv("ETHERSCAN_API_KEY")
    COINGECKO_API_KEY: Optional[str] = os.getenv("COINGECKO_API_KEY")

    # Application Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Social Media & Blockchain Analysis"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Cache Settings
    CACHE_TTL: int = 3600
    
    # New Settings for Solana Tracking
    MAX_CHAIN_DEPTH: int = 20
    TRANSACTION_BATCH_SIZE: int = 100
    MIN_AMOUNT_SOL: float = 0.000001
    ENABLE_CACHING: bool = True
    ENABLE_RATE_LIMITING: bool = True

    @validator("SOLANA_RPC_URL")
    def validate_rpc_url(cls, v: str) -> str:
        if not v:
            raise ValueError("SOLANA_RPC_URL must be set")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

def validate_settings() -> None:
    """Validate all required settings."""
    required = {
        "DATABASE_URL": settings.DATABASE_URL,
        "SOLANA_RPC_URL": settings.SOLANA_RPC_URL,
        "TWITTER_BEARER_TOKEN": settings.TWITTER_BEARER_TOKEN,
        "SECRET_KEY": settings.SECRET_KEY
    }

    missing = [k for k, v in required.items() if not v]
    if missing:
        raise ValueError(f"Missing required settings: {', '.join(missing)}")

try:
    validate_settings()
except ValueError as e:
    import logging
    logging.warning(f"Settings validation warning: {str(e)}")
