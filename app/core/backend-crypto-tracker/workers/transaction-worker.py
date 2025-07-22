# app/workers/transaction_worker.py
from app.services.eth.etherscan_api import fetch_transaction
from app.database.models.transaction_model import Transaction
from app.config.database import SessionLocal
from app.utils.logger import logger
import json

def process_transaction(hash: str):
    logger.info(f"Verarbeite Transaktion: {hash}")
    raw_tx = fetch_transaction(hash)
    if not raw_tx:
        logger.error("Transaktion nicht gefunden")
        return

    db = SessionLocal()
    tx = Transaction(
        hash=raw_tx["hash"],
        from_address=raw_tx["from"],
        to_address=raw_tx["to"],
        value=int(raw_tx["value"], 16) / 1e18,
        timestamp=...,
        blockchain="eth",
        raw_data=json.dumps(raw_tx)
    )
    db.add(tx)
    db.commit()
    logger.info(f"Gespeichert: {hash}")
