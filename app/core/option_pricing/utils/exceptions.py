class OptionPricingError(Exception):
    """Basis-Klasse für alle OptionPricing-Fehler"""
    pass

class PricingError(OptionPricingError):
    """Fehler bei der Optionspreisberechnung"""
    pass

class DataUnavailableError(OptionPricingError):
    """Fehler bei der Datenbeschaffung"""
    pass

class BlockchainError(OptionPricingError):
    """Fehler bei der Blockchain-Kommunikation"""
    pass

class ExchangeError(OptionPricingError):
    """Fehler bei der Börsenkommunikation"""
    pass
