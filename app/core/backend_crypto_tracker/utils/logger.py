import logging
import json
from datetime import datetime

def setup_logger():
    """Richtet das Logging mit strukturierten Ausgaben ein"""
    logger = logging.getLogger("backend_crypto_tracker")
    logger.setLevel(logging.INFO)
    
    # Verhindere doppelte Logging-Ausgaben
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "function": "%(funcName)s", "line": %(lineno)d, "message": %(message)s}'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def get_logger(name=None):
    """Holt einen Logger mit strukturiertem Format"""
    logger = logging.getLogger("backend_crypto_tracker" if not name else f"backend_crypto_tracker.{name}")
    return logger

# Globale Initialisierung
logger = setup_logger()
