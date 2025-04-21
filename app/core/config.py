from pydantic import BaseSettings
from dotenv import load_dotenv
import os

# Lade die .env-Datei
load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    REDIS_URL: str = os.getenv("REDIS_URL")
    TWITTER_BEARER_TOKEN: str = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_API_KEY: str = os.getenv("TWITTER_API_KEY")
    TWITTER_API_SECRET: str = os.getenv("TWITTER_API_SECRET")
    TWITTER_ACCESS_TOKEN: str = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET: str = os.getenv("TWITTER_ACCESS_SECRET")
    SOLANA_RPC_URL: str = os.getenv("SOLANA_RPC_URL")
    ETHEREUM_RPC_URL: str = os.getenv("ETHEREUM_RPC_URL")
    MORALIS_API_KEY: str = os.getenv("MORALIS_API_KEY")

settings = Settings()
