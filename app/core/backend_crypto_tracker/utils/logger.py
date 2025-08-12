# app/core/backend_crypto_tracker/utils/logger.py
import logging
import os

def setup_logger(name: str, log_file: str = None, level: int = logging.INFO) -> logging.Logger:
    """Setzt einen Logger mit Datei- und Konsolen-Handler ein."""
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Verhindere das Hinzufügen von Handlern mehrfach
    if not logger.handlers:
        # Console Handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # File Handler (if log_file is provided)
        if log_file:
            # Stelle sicher, dass das Verzeichnis existiert
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
    
    return logger

def get_logger(name: str, log_file: str = None, level: int = logging.INFO) -> logging.Logger:
    """Holt oder erstellt einen Logger mit dem gegebenen Namen."""
    return setup_logger(name, log_file, level)

# Zentrale Logger-Instanzen (optional)
# scheduler_logger = setup_logger('scheduler', 'logs/scheduler.log')
# scanner_logger = setup_logger('scanner') # Console only
# database_logger = setup_logger('database', 'logs/database.log')
