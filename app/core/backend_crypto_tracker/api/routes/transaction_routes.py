# app/core/backend_crypto_tracker/api/routes/transaction_routes.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.backend_crypto_tracker.utils.logger import get_logger
logger = get_logger(__name__)

# Services
from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser

# Endpoint Manager
from app.core.backend_crypto_tracker.utils.endpoint_manager import EndpointManager
from pydantic import validator
from app.core.database import get_db

router = APIRouter()

# Initialisiere den Endpoint-Manager (global, um Zustand zwischen Anfragen zu behalten)
endpoint_manager = EndpointManager()

class TrackTransactionRequest(BaseModel):
    blockchain: str
    tx_hash: str
    depth: int = 5  # Default Rekursionstiefe
    width: int = 3  # Default Breite (Anzahl Geschwister-Transaktionen)
    include_meta: bool = False
    token_identifier: Optional[str] = None  # Optional für Token-basierte Verfolgung
    filter_token: Optional[str] = None  # Neuer Parameter für Token-Filter
    max_total_transactions: int = 50  # Sicherheitslimit für Gesamtanzahl

    # Validierung der Eingaben
    @validator('depth')
    def validate_depth(cls, v):
        if v < 1:
            raise ValueError("Tiefe muss mindestens 1 sein")
        if v > 10:  # Maximum Tiefe begrenzen
            raise ValueError("Maximale Tiefe ist 10")
        return v

    @validator('width')
    def validate_width(cls, v):
        if v < 1:
            raise ValueError("Breite muss mindestens 1 sein")
        if v > 10:  # Maximum Breite begrenzen
            raise ValueError("Maximale Breite ist 10")
        return v

    @validator('max_total_transactions')
    def validate_max_total(cls, v):
        if v < 1:
            raise ValueError("Maximale Gesamtanzahl muss positiv sein")
        if v > 50:  # Absolutes Maximum
            raise ValueError("Maximale Gesamtanzahl ist 1000")
        return v
class TransactionResponse(BaseModel):
    tx_hash: str
    chain: str
    timestamp: datetime
    from_address: str
    to_address: str
    amount: float
    currency: str
    is_chain_end: bool = False  # Neues Feld für Chain-End-Flag
    next_transactions: List["TransactionResponse"] = []

# Rekursive Modellreferenz
TransactionResponse.update_forward_refs()

# --- NEW: Recursive Helper Function ---
# In transaction_routes.py:

async def _track_transaction_recursive(request: TrackTransactionRequest, client, parser, db, endpoint_manager):
    """
    Erweiterte rekursive Hilfsfunktion mit Token-Filter und Chain-End-Behandlung.
    """
    logger.info(f"--- REKURSIONSTIEFE: {request.depth} ---")
    logger.info(f"RECURSIVE START: Tracking transaction for Blockchain '{request.blockchain}' with Hash '{request.tx_hash}'")

    try:
        # 1. Abrufen der Transaktionsdaten
        raw_data = client.get_transaction(request.tx_hash)
        if not raw_data:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 2. Parsen der Transaktionsdaten
        parsed_data = parser.parse_transaction(request.blockchain, raw_data, client)
        if not parsed_data:
            raise HTTPException(status_code=500, detail="Failed to parse transaction")

        # Log-Informationen
        current_source = parsed_data.get("from_address", "Unbekannt")
        current_target = parsed_data.get("to_address", "Unbekannt")
        short_source = current_source[:8] + "..." + current_source[-4:] if len(current_source) > 12 else current_source
        short_target = current_target[:8] + "..." + current_target[-4:] if len(current_target) > 12 else current_target
        
        # 3. Basis-Response erstellen
        current_transaction = TransactionResponse(
            tx_hash=parsed_data["tx_hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            from_address=parsed_data["from_address"],
            to_address=parsed_data["to_address"],
            amount=float(parsed_data["amount"]),
            currency=parsed_data["currency"],
            is_chain_end=False,  # Wird später ggf. aktualisiert
            next_transactions=[]
        )

        # 4. Rekursive Verarbeitung
        if request.depth > 1:
            # Token-Identifier bestimmen
            token_identifier = request.token_identifier or parsed_data.get("currency", "SOL")
            
            # Nächste Transaktionen abrufen
            next_transactions = parser._get_next_transactions(
                request.blockchain,
                parsed_data["to_address"],
                current_hash=parsed_data["tx_hash"],
                filter_token=token_identifier,
                limit=min(5, request.depth)
            )

            if next_transactions:
                logger.info(f"[Tiefe: {request.depth}] Verarbeite {len(next_transactions)} Kinder für {short_target}")
                
                for next_tx in next_transactions:
                    try:
                        # Prüfe auf Chain-End
                        if next_tx.get("is_chain_end", False):
                            current_transaction.is_chain_end = True
                            continue

                        # Neue Anfrage mit reduzierter Tiefe
                        child_request = TrackTransactionRequest(
                            blockchain=request.blockchain,
                            tx_hash=next_tx["hash"],
                            depth=request.depth - 1,
                            include_meta=request.include_meta,
                            token_identifier=token_identifier
                        )
                        
                        # Rekursiver Aufruf
                        child_transaction = await _track_transaction_recursive(
                            child_request, client, parser, db, endpoint_manager
                        )
                        
                        if child_transaction:
                            current_transaction.next_transactions.append(child_transaction)
                            
                    except Exception as e:
                        logger.error(f"Fehler bei Kind-Transaktion {next_tx.get('hash', 'unknown')}: {str(e)}")
                        continue

        return current_transaction

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fehler in _track_transaction_recursive: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track", response_model=TransactionResponse)
async def track_transaction(request: TrackTransactionRequest, db: Session = Depends(get_db)):
    """
    Hauptendpoint für Transaktionsverfolgung mit erweiterter Funktionalität.
    """
    try:
        logger.info(f"START: Verfolgung für {request.blockchain} / {request.tx_hash}")

        # 1. Client-Initialisierung
        try:
            endpoint = endpoint_manager.get_endpoint(request.blockchain)
            client = None
            
            if request.blockchain == "btc":
                client = BlockchairBTCClient(url=endpoint.strip())
            elif request.blockchain == "eth":
                client = EtherscanETHClient(url=endpoint.strip())
            elif request.blockchain == "sol":
                client = SolanaAPIClient()
            else:
                raise HTTPException(status_code=400, detail="Unsupported blockchain")
                
        except Exception as e:
            logger.error(f"Client-Initialisierung fehlgeschlagen: {str(e)}")
            raise HTTPException(status_code=503, detail="API endpoint unavailable")

        # 2. Parser-Initialisierung
        parser = BlockchainParser()

        # 3. Rekursive Verfolgung starten
        result = await _track_transaction_recursive(request, client, parser, db, endpoint_manager)
        
        logger.info(f"ERFOLG: Verfolgung abgeschlossen für {request.tx_hash}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.critical(f"Unerwarteter Fehler: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
