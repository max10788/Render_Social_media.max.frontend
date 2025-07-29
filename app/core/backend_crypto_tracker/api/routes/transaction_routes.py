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
    next_transactions: List["TransactionResponse"] = []

# Rekursive Modellreferenz
TransactionResponse.update_forward_refs()

# --- NEW: Recursive Helper Function ---
def _track_transaction_recursive(request: TrackTransactionRequest, client, parser, db, endpoint_manager):
    """
    Rekursive Hilfsfunktion zur Verfolgung von Transaktionen.
    """
    logger.info(f"--- REKURSIONSTIEFE: {request.depth} ---")
    logger.info(f"RECURSIVE START: Tracking transaction for Blockchain '{request.blockchain}' with Hash '{request.tx_hash}' at depth {request.depth}")

    try:
        # Hole Transaktionsdaten
        raw_data = client.get_transaction(request.tx_hash)
        if not raw_data:
            logger.error(f"Keine Daten für Transaktion {request.tx_hash}")
            raise HTTPException(
                status_code=404,
                detail="Transaktion nicht gefunden"
            )

        # Parse die Transaktionsdaten
        parsed_data = parser.parse_transaction(request.blockchain, raw_data, client)
        if not parsed_data:
            logger.error(f"Parsing fehlgeschlagen für {request.tx_hash}")
            raise HTTPException(
                status_code=500,
                detail="Parsing der Transaktion fehlgeschlagen"
            )

        logger.info(f"Recursive Erfolg: Data parsed (Amount: {parsed_data.get('amount', 'N/A')})")

        # Fortschrittsmeldung mit Wallet-Adressen
        current_source = parsed_data.get("from_address", "Unbekannt")
        current_target = parsed_data.get("to_address", "Unbekannt")
        short_source = current_source[:8] + "..." + current_source[-4:] if len(current_source) > 12 else current_source
        short_target = current_target[:8] + "..." + current_target[-4:] if len(current_target) > 12 else current_target
        logger.info(f"[Tiefe: {request.depth}] Verarbeite: {request.tx_hash[:10]}... | Von: {short_source} -> Zu: {short_target}")

        # 3. Erstelle das Basis-TransactionResponse-Objekt
        current_transaction = TransactionResponse(
            tx_hash=parsed_data["tx_hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            from_address=parsed_data["from_address"],
            to_address=parsed_data["to_address"],
            amount=float(parsed_data["amount"]),
            currency=parsed_data["currency"],
            next_transactions=[]
        )

        # 4. Rekursive Verarbeitung wenn noch nicht maximale Tiefe erreicht
        if request.depth > 1:
            logger.info(f"Recursive: Processing next transactions (Current Depth Level: {request.depth})")
            
            # Bestimme Token-Identifier
            token_identifier = (request.token_identifier or 
                              parsed_data.get("token_identifier") or 
                              parsed_data.get("currency", "SOL"))
            logger.info(f"Recursive: Tracking token with identifier: {token_identifier}")

            # Setze maximale Breite
            max_width = min(5, request.depth)
            logger.info(f"Recursive: Max width for next transactions set to: {max_width}")

            # Hole nächste Transaktionen
            next_hashes = parser._get_next_transactions(
                request.blockchain,
                parsed_data["to_address"],
                current_hash=parsed_data["tx_hash"],
                token_identifier=token_identifier,
                limit=max_width
            )
            logger.info(f"Recursive: Found {len(next_hashes)} potential next transactions")

            # Verarbeite gefundene Transaktionen
            if next_hashes:
                logger.info(f"[Tiefe: {request.depth}] Starte Verarbeitung von max. {len(next_hashes)} Kindern für Wallet {short_target}")
                
                processed_count = 0
                for next_hash in next_hashes:
                    try:
                        logger.info(f"[Tiefe: {request.depth}] Verarbeite Kind {processed_count + 1}/{len(next_hashes)} (Hash: {next_hash[:10]}...)")
                        
                        # Erstelle neue Anfrage mit reduzierter Tiefe
                        child_request = TrackTransactionRequest(
                            blockchain=request.blockchain,
                            tx_hash=next_hash,
                            depth=request.depth - 1,
                            include_meta=request.include_meta,
                            token_identifier=token_identifier
                        )
                        
                        # Rekursiver Aufruf
                        child_transaction = _track_transaction_recursive(
                            child_request, client, parser, db, endpoint_manager
                        )
                        
                        # Füge Kind-Transaktion hinzu
                        if child_transaction:
                            current_transaction.next_transactions.append(child_transaction)
                            processed_count += 1
                            
                    except Exception as e:
                        logger.error(f"Fehler bei der Verarbeitung von Kind-Transaktion {next_hash}: {str(e)}")
                        continue

                logger.info(f"[Tiefe: {request.depth}] Abgeschlossen: {processed_count} Kind-Transaktionen für Wallet {short_target} verarbeitet.")

        # 5. Abschlussmeldungen
        logger.info(f"RECURSIVE SUCCESS: Completed tracking for Hash '{request.tx_hash}'")
        logger.info(f"[Tiefe: {request.depth}] <-- Fertig mit Transaktion {request.tx_hash[:10]}... (Kinder: {len(current_transaction.next_transactions)})")

        return current_transaction

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"FEHLER in _track_transaction_recursive für Hash '{request.tx_hash}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error during recursive tracking: {str(e)}")

    except Exception as e:
        error_msg = str(e)
        if "nicht gefunden" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        elif "ungültig" in error_msg.lower():
            raise HTTPException(status_code=400, detail=error_msg)
        elif "api" in error_msg.lower():
            raise HTTPException(status_code=502, detail=error_msg)
        else:
            logger.error(f"Unerwarteter Fehler: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"Interner Fehler: {error_msg}"
            )

# --- MODIFIED: Main Route Handler ---
@router.post("/track", response_model=TransactionResponse)
def track_transaction(
    request: TrackTransactionRequest,
    db: Session = Depends(get_db)
):
    """
    Main endpoint to initiate transaction tracking.
    """
    try:
        logger.info(f"START: Transaktionsverfolgung gestartet für Blockchain '{request.blockchain}' mit Hash '{request.tx_hash}'")

        # 1. Blockchain-Client auswählen
        logger.debug(f"Schritt 1: Blockchain-Client wird ausgewählt für '{request.blockchain}'")

        try:
            endpoint = endpoint_manager.get_endpoint(request.blockchain)
            logger.info(f"Endpoint-Manager: Verwende Endpoint '{endpoint}' für {request.blockchain}")
        except Exception as e:
            logger.error(f"Endpoint-Manager: Kein verfügbarer Endpoint für {request.blockchain}: {str(e)}")
            raise HTTPException(status_code=503, detail="Keine verfügbaren API-Endpoints")

        # Erstelle den Client mit dem ausgewählten Endpoint
        client = None
        if request.blockchain == "btc":
            logger.info(f"Blockchain-Client: BlockchairBTCClient wird verwendet (Endpoint: {endpoint})")
            client = BlockchairBTCClient(url=endpoint.strip())
        elif request.blockchain == "eth":
            logger.info(f"Blockchain-Client: EtherscanETHClient wird verwendet (Endpoint: {endpoint})")
            client = EtherscanETHClient(url=endpoint.strip())
        elif request.blockchain == "sol":
            logger.info(f"Blockchain-Client: SolanaAPIClient wird verwendet.")
            # SolanaAPIClient.__init__ erwartet keine Argumente.
            # Er verwendet seinen eigenen, globalen EndpointManager.
            client = SolanaAPIClient() # Keine Argumente!
        else:
            logger.error(f"Ungültige Blockchain angegeben: '{request.blockchain}'")
            raise HTTPException(status_code=400, detail="Unsupported blockchain")

        # Initialize parser
        parser = BlockchainParser()

        # --- Call the recursive helper ---
        # Pass the necessary objects (client, parser, db, endpoint_manager)
        # The helper function handles the recursion logic
        try:
            result = _track_transaction_recursive(request, client, parser, db, endpoint_manager)
            logger.info(f"ERFOLG: Haupt-Transaktionsverfolgung abgeschlossen für Hash '{request.tx_hash}'")
            return result # Return the final Pydantic model from the recursive calls
        except Exception as e:
            # Handle potential errors from the recursive calls
            logger.error(f"Fehler während der rekursiven Verarbeitung: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error during tracking: {str(e)}")


    except HTTPException as he:
        # Specific HTTPExceptions are re-raised
        logger.warning(f"HTTP-Fehler ({he.status_code}): {he.detail}")
        raise he
    except Exception as e:
        # Catch-all for unexpected errors in the main handler logic
        logger.critical(f"UNERWARTETER FEHLER in track_transaction (Main Handler): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
