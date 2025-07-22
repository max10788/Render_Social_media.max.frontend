from typing import Optional, Dict
from fastapi import HTTPException

class CryptoTrackerError(Exception):
    """Base exception for the crypto tracker application."""
    pass

class APIError(CryptoTrackerError):
    """Raised when an API call fails."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class MultiSigAccessError(Exception):
    """Fehler bei Zugriff auf Multi-Signatur-Transaktion"""
    def __init__(self, message: str, restricted_wallet: str):
        self.message = message
        self.restricted_wallet = restricted_wallet
        super().__init__(message)

class TransactionNotFoundError(Exception):
    """Transaktion wurde auf der Blockchain nicht gefunden"""
    def __init__(self, tx_hash: str):
        self.tx_hash = tx_hash
        super().__init__(f"Transaktion nicht gefunden: {tx_hash}")

class TransactionValidationError(Exception):
    """Transaktionsdaten sind ungültig"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

class RateLimitExceededError(Exception):
    """RPC-Rate-Limit wurde überschritten"""
    def __init__(self, chain: str):
        self.chain = chain
        super().__init__(f"Rate-Limit überschritten für {chain}")

class BlockchainConnectionError(Exception):
    """Verbindungsfehler zur Blockchain"""
    def __init__(self, chain: str, endpoint: str):
        self.chain = chain
        self.endpoint = endpoint
        super().__init__(f"Verbindungsfehler zu {chain} auf {endpoint}")

class ScenarioDetectionError(Exception):
    """Fehler bei Szenarienerkennung"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

class InternalServerError(Exception):
    """Interner Serverfehler"""
    def __init__(self, message: str = "Interner Serverfehler"):
        self.message = message
        super().__init__(message)

def handle_blockchain_errors(func):
    """Dekorator für zentrale Fehlerbehandlung"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except MultiSigAccessError as e:
            raise HTTPException(status_code=403, detail={
                "error": "multi_sig_access_denied",
                "message": str(e),
                "restricted_wallet": e.restricted_wallet
            })
        except TransactionNotFoundError as e:
            raise HTTPException(status_code=404, detail={
                "error": "transaction_not_found",
                "message": str(e),
                "tx_hash": e.tx_hash
            })
        except RateLimitExceededError as e:
            raise HTTPException(status_code=429, detail={
                "error": "rate_limit_exceeded",
                "message": str(e),
                "chain": e.chain
            })
        except BlockchainConnectionError as e:
            raise HTTPException(status_code=503, detail={
                "error": "blockchain_connection_failed",
                "message": str(e),
                "chain": e.chain,
                "endpoint": e.endpoint
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail={
                "error": "internal_server_error",
                "message": str(e)
            })
    return wrapper
