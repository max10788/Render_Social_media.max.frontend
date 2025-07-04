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

class TransactionValidationError(CryptoTrackerError):
    """Fehler bei der Transaktionsvalidierung"""
    def __init__(self, message: str, validation_errors: dict = None):
        self.message = message
        self.validation_errors = validation_errors or {}
        super().__init__(self.message)

class MultiSigAccessError(CryptoTrackerError):
    """
    Exception für Multi-Sig Zugriffsprobleme.
    Wird geworfen, wenn eine Multi-Sig-Transaktion nicht die erforderlichen Unterschriften hat.
    """
    def __init__(
        self, 
        message: str, 
        required_signers: int = None,
        available_signers: int = None,
        wallet_address: str = None
    ):
        self.message = message
        self.required_signers = required_signers
        self.available_signers = available_signers
        self.wallet_address = wallet_address
        super().__init__(self.message)

class RateLimitExceededError(CryptoTrackerError):
    """Rate Limit überschritten"""
    def __init__(self, message: str, retry_after: int = None):
        self.message = message
        self.retry_after = retry_after
        super().__init__(self.message)

class BlockchainConnectionError(CryptoTrackerError):
    """Fehler bei der Blockchain-Verbindung"""
    pass

class InvalidConfigurationError(CryptoTrackerError):
    """Ungültige Konfiguration"""
    pass

class ScenarioDetectionError(CryptoTrackerError):
    """Fehler bei der Szenario-Erkennung"""
    def __init__(self, message: str, scenario_type: str = None):
        self.message = message
        self.scenario_type = scenario_type
        super().__init__(self.message)
