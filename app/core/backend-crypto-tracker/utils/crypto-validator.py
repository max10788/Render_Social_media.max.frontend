# app/utils/crypto_validator.py
import re

def validate_tx_hash(hash: str, chain: str) -> bool:
    patterns = {
        "btc": re.compile(r"^[a-fA-F0-9]{64}$"),
        "eth": re.compile(r"^0x[a-fA-F0-9]{64}$"),
        "sol": re.compile(r"^[a-zA-Z0-9]{32,44}$")  # Base58-like
    }
    return bool(patterns.get(chain.lower(), re.compile(r"^$")).match(hash))
