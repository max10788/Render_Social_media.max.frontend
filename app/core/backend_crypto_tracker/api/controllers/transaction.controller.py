# app/controllers/transaction_controller.py
from fastapi import HTTPException
from app.utils.crypto_validator import validate_tx_hash
from ..workers.transaction_worker import process_transactionn

def track_transaction(hash: str, blockchain: str):
    if not validate_tx_hash(hash, blockchain):
        raise HTTPException(status_code=400, detail="Ungültiger Transaktionshash")
    if blockchain != "eth":
        raise HTTPException(status_code=501, detail="Nur Ethereum wird vorerst unterstützt")
    process_transaction(hash)
    return {"message": "Transaktion wird verarbeitet"}
