from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
# Services
from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient

# Database
from app.core.backend_crypto_tracker.database.models.transaction_model import Transaction
from app.core.backend_crypto_tracker.database.base import Base

from app.core.database import get_db

router = APIRouter()

class TrackTransactionRequest(BaseModel):
    blockchain: str  # "btc", "eth", "sol"
    tx_hash: str
    depth: int = 3  # Maximale Transaktionsketten-Tiefe
    include_metadata: bool = True

class TransactionResponse(BaseModel):
    tx_hash: str
    chain: str
    timestamp: datetime
    from_address: Optional[str]
    to_address: Optional[str]
    amount: float
    currency: str
    next_transactions: List["TransactionResponse"] = []

# Rekursive Modellreferenz
TransactionResponse.update_forward_refs()

@router.post("/track", response_model=TransactionResponse)
def track_transaction(
    request: TrackTransactionRequest,
    db: Session = Depends(get_db)
):
    try:
        # 1. Blockchain-Client auswählen
        if request.blockchain == "btc":
            client = BlockchairBTCClient()
        elif request.blockchain == "eth":
            client = EtherscanETHClient()
        elif request.blockchain == "sol":
            client = SolanaAPIClient()
        else:
            raise HTTPException(status_code=400, detail="Unsupported blockchain")
        
        # 2. Transaktionsdetails abrufen
        try:
            raw_data = client.get_transaction(request.tx_hash)
        except Exception as e:
            logger.error(f"Error fetching {request.blockchain} transaction {request.tx_hash}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid transaction hash: {str(e)}")
        
        # 3. Daten parsen
        try:
            parser = BlockchainParser()
            parsed_data = parser.parse_transaction(request.blockchain, raw_data)
        except Exception as e:
            logger.error(f"Error parsing {request.blockchain} transaction {request.tx_hash}: {str(e)}")
            logger.error(f"Raw data structure: {json.dumps(raw_data, indent=2)[:1000]}")  # Nur die ersten 1000 Zeichen
            raise HTTPException(status_code=400, detail=f"Could not parse transaction: {str(e)}")
        
        # 4. In DB speichern
        db_transaction = Transaction(
            hash=parsed_data["tx_hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            raw_data=raw_data,
            parsed_data=parsed_data
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        # 5. Rekursive Verarbeitung (falls depth > 1)
        next_transactions = []
        if request.depth > 1:
            # Hier müssten Sie die nächsten Transaktionen für die Zieladresse abfragen
            # Dies ist blockchain-spezifisch und sollte in einem Service-Modul implementiert werden
            pass
        
        # 6. Erstelle die Antwort im erwarteten Format
        response = {
            "tx_hash": parsed_data["tx_hash"],
            "chain": parsed_data["chain"],
            "timestamp": parsed_data["timestamp"],
            "from_address": parsed_data["from_address"],
            "to_address": parsed_data["to_address"],
            "amount": parsed_data["amount"],
            "currency": parsed_data["currency"],
            "next_transactions": next_transactions
        }
        
        return response
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception("Unexpected error in track_transaction")
        raise HTTPException(status_code=500, detail="Internal server error")
