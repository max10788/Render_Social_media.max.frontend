# app/core/backend_crypto_tracker/utils/exceptions.py
class CustomAnalysisException(Exception):
    """Base exception für Custom Analysis Fehler"""
    pass

class UnsupportedChainException(CustomAnalysisException):
    """Exception für nicht unterstützte Chains"""
    pass

class InvalidAddressException(CustomAnalysisException):
    """Exception für ungültige Adressen"""
    pass

class RateLimitExceededException(CustomAnalysisException):
    """Exception wenn Rate Limit überschritten"""
    pass

class AnalysisTimeoutException(CustomAnalysisException):
    """Exception bei Analyse Timeout"""
    pass

class InsufficientDataException(CustomAnalysisException):
    """Exception wenn nicht genügend Daten für Analyse vorhanden"""
