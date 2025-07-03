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

class MultiSigAccessError(Exception):
    """
    Exception für Multi-Sig Zugriffsprobleme.
    """
    def __init__(self, message: str, required_signers: int = None, available_signers: int = None):
        self.message = message
        self.required_signers = required_signers
        self.available_signers = available_signers
        super().__init__(self.message)
