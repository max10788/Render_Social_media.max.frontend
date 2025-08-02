# app/core/backend_crypto_tracker/database/models/__init__.py

from .token import Token
from .wallet import WalletAnalysis, WalletTypeEnum
from .scan_result import ScanResult, ScanJob

# app/core/backend_crypto_tracker/database/models/__init__.py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine import Engine
from sqlalchemy import event
import sqlite3

Base = declarative_base()

# Import all models to ensure they're registered
from .token import Token
from .wallet import WalletAnalysis, WalletTypeEnum
from .scan_result import ScanResult, ScanJob

# Chain validation function
SUPPORTED_CHAINS = ['ethereum', 'bsc', 'solana', 'sui']

def validate_chain(chain: str) -> bool:
    return chain.lower() in SUPPORTED_CHAINS
