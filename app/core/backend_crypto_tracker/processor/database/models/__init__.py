# app/core/backend_crypto_tracker/database/models/__init__.py
# Import all models here to ensure they are registered with the SQLAlchemy metadata
# This file is crucial for Alembic migrations and ensuring all models are known to the Base.

# Import Base from the parent package if it's defined there
# from .. import Base

# Import models
from .token import Token
from .wallet import WalletAnalysis, WalletTypeEnum
from .scan_result import ScanResult, ScanJob

# Re-export for convenience if needed
# __all__ = ['Token', 'WalletAnalysis', 'WalletTypeEnum', 'ScanResult', 'ScanJob', 'Base']
