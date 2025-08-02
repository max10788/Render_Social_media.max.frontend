# app/core/backend_crypto_tracker/utils/logging_config.py
import logging
import sys
from datetime import datetime

def setup_custom_analysis_logging():
    """Konfiguriert spezifisches Logging für Custom Analysis"""
    
    # Custom Analysis Logger
    logger = logging.getLogger('custom_analysis')
    logger.setLevel(logging.INFO)
    
    # File Handler für Custom Analysis Logs
    handler = logging.FileHandler(f'logs/custom_analysis_{datetime.now().strftime("%Y%m%d")}.log')
    handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger
