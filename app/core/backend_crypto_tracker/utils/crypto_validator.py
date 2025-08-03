import re

def validate_address(address: str, chain: str) -> bool:
    chain = chain.lower()
    if chain in {"ethereum", "bsc"}:
        return bool(re.match(r"^0x[a-fA-F0-9]{40}$", address))
    if chain == "solana":
        return bool(re.match(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$", address))
    if chain == "sui":
        return bool(re.match(r"^0x[a-fA-F0-9]{64}$", address))
    return False
