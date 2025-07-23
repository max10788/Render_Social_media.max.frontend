from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from workers.transaction_worker import process_transaction
from database import get_db

router = APIRouter()

@router.post("/track")
def track_transaction(chain: str, tx_hash: str, db: Session = Depends(get_db)):
    """POST /track: Transaktionshash eingeben [[1]]"""
    if chain not in ["btc", "eth", "sol"]:
        raise HTTPException(status_code=400, detail="Ungültige Chain")
    
    # Starte asynchrone Verarbeitung
    process_transaction.delay(chain, tx_hash)
    return {"status": "queued", "tx_hash": tx_hash}
