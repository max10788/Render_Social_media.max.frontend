class CryptoTrackerError(Exception):
    """Basis-Exception für Crypto-Tracker Fehler"""
    pass

class APIError(CryptoTrackerError):
    """Fehler bei API-Aufrufen"""
    pass

class CurrencyNotSupportedError(CryptoTrackerError):
    """Nicht unterstützte Währung"""
    pass

class TransactionNotFoundError(CryptoTrackerError):
    """Transaktion nicht gefunden"""
    pass
