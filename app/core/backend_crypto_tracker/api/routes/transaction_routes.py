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
from app.core.backend_crypto_tracker.database.models.transaction import Transaction
from app.core.backend_crypto_tracker.database import get_db

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
        raw_data = client.get_transaction(request.tx_hash)
        
        # 3. Daten parsen
        parser = BlockchainParser()
        parsed_data = parser.parse_transaction(request.blockchain, raw_data)
        
        # 4. In DB speichern
        db_transaction = Transaction(
            hash=parsed_data["hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            raw_data=raw_data,
            parsed_data=parsed_data
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        # 5. Rekursive Verarbeitung (falls depth > 1)
        if request.depth > 1:
            next_transactions = []
            for next_hash in parsed_data.get("next_hashes", [])[:5]:  # Max. 5 nächste Transaktionen
                next_request = TrackTransactionRequest(
                    blockchain=request.blockchain,
                    tx_hash=next_hash,
                    depth=request.depth - 1
                )
                next_result = track_transaction(next_request, db)
                next_transactions.append(next_result)
            parsed_data["next_transactions"] = next_transactions
        
        return parsed_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
