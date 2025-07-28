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

from app.core.database import get_db

router = APIRouter()

# Initialisiere den Endpoint-Manager (global, um Zustand zwischen Anfragen zu behalten)
endpoint_manager = EndpointManager()

class TrackTransactionRequest(BaseModel):
    blockchain: str
    tx_hash: str
    depth: int = 5
    include_meta: bool = False
    token_identifier: str = None  # Neu: Für Token-basierte Verfolgung

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

# --- NEW: Recursive Helper Function ---
def _track_transaction_recursive(
    request: TrackTransactionRequest,
    client, # Pass the already instantiated client
    parser, # Pass the already instantiated parser
    db: Session, # Pass DB session if needed by services/parser (though not used for storage)
    endpoint_manager: EndpointManager # Pass the manager for endpoint handling
):
    """
    Recursive helper to track transactions without calling the FastAPI route handler.
    """
    try:
        logger.info(f"RECURSIVE START: Tracking transaction for Blockchain '{request.blockchain}' with Hash '{request.tx_hash}' at depth {request.depth}")
        # Note: Client and Parser are already instantiated in the main handler.

        # 2. Transaktionsdetails abrufen (using the passed client)
        logger.debug(f"Recursive Schritt 2: Fetching transaction details for Hash '{request.tx_hash}'")
        try:
            logger.info(f"Recursive Aufruf: client.get_transaction('{request.tx_hash}')")
            raw_data = client.get_transaction(request.tx_hash)
            logger.info(f"Recursive Erfolg: Transaction details fetched.")
        except Exception as e:
            logger.error(f"Recursive Fehler bei Abruf der Transaktionsdetails: {str(e)}", exc_info=True)
            # Markiere den aktuellen Endpoint als fehlgeschlagen
            # (This logic needs access to the specific endpoint used)
            # A better way might be to pass the endpoint used back from client.get_transaction
            # or handle endpoint marking within the client itself if it knows the endpoint.
            # For now, we'll assume the main handler handles endpoint marking on top-level errors.
            # If recursive calls also need to mark endpoints, logic needs adjustment.
            raise # Re-raise to be handled by the caller

        # 3. Daten parsen (using the passed parser)
        logger.debug("Recursive Schritt 3: Parsing transaction data")
        try:
            logger.info("Recursive Aufruf: parser.parse_transaction()")
            # Pass the client if needed by the parser (e.g., for additional lookups)
            parsed_data = parser.parse_transaction(request.blockchain, raw_data, client=client)
            logger.info(f"Recursive Erfolg: Data parsed (Amount: {parsed_data.get('amount')})")
        except Exception as e:
            logger.error(f"Recursive Fehler beim Parsen: {str(e)}", exc_info=True)
            logger.debug(f"Recursive Rohdaten (erste 500 Zeichen): {str(raw_data)[:500]}")
            raise # Re-raise

        # 4. KEINE DB-SPEICHERUNG - (Handled by main handler if needed)

        # 5. Rekursive Verarbeitung (falls depth > 1)
        logger.debug(f"Recursive Schritt 5: Starting recursion (Depth: {request.depth})")
        next_transactions = []
        if request.depth > 1:
            logger.info(f"Recursive: Processing next transactions (Depth: {request.depth-1})")

            token_identifier = parsed_data.get("token_identifier") or parsed_data.get("mint_address") or parsed_data.get("currency")
            logger.info(f"Recursive: Tracking token with identifier: {token_identifier}")

            max_transactions = request.depth - 1
            max_width = 5
            next_hashes = parser._get_next_transactions(
                request.blockchain,
                parsed_data["to_address"],
                current_hash=parsed_data["tx_hash"],
                token_identifier=token_identifier,
                limit=max_width
            )

            transactions_to_process = next_hashes[:max_transactions]

            logger.info(f"Recursive: Processing {len(transactions_to_process)} of {len(next_hashes)} found transactions")
            for next_hash in transactions_to_process:
                logger.debug(f"Recursive: Processing next transaction: {next_hash}")
                next_request = TrackTransactionRequest(
                    blockchain=request.blockchain,
                    tx_hash=next_hash,
                    depth=request.depth - 1, # Decrement depth
                    token_identifier=token_identifier
                )
                try:
                    # REKURSIVER AUFRUF - Call the helper, not the route handler
                    next_result = _track_transaction_recursive(next_request, client, parser, db, endpoint_manager)
                    next_transactions.append(next_result)
                    logger.debug(f"Recursive: Transaction processed successfully: {next_hash}")
                except Exception as e:
                    logger.error(f"Recursive Fehler bei Verarbeitung von {next_hash}: {str(e)}", exc_info=True)
                    # Consider if recursive errors should stop the whole process or just be logged/skipped
                    # For now, we log and continue processing other siblings.

            logger.info(f"Recursive: {len(next_transactions)} next transactions processed")

        # 6. Antwort vorbereiten
        logger.debug("Recursive Schritt 6: Preparing response data")
        response_data = {
            "tx_hash": parsed_data["tx_hash"],
            "chain": parsed_data["chain"],
            "timestamp": parsed_data["timestamp"],
            "from_address": parsed_data["from_address"],
            "to_address": parsed_data["to_address"],
            "amount": parsed_data["amount"],
            "currency": parsed_data["currency"],
            "token_identifier": token_identifier,
            "next_transactions": next_transactions
        }
        logger.info(f"RECURSIVE SUCCESS: Completed tracking for Hash '{request.tx_hash}'")
        return TransactionResponse(**response_data) # Return Pydantic model instance

    except Exception as e:
        logger.critical(f"UNERWARTETER FEHLER in _track_transaction_recursive: {str(e)}", exc_info=True)
        # Re-raise to be handled by the main route handler
        raise e

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
            logger.info(f"Blockchain-Client: SolanaAPIClient wird verwendet (Endpoint: {endpoint})")
            client = SolanaAPIClient()
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
            # If the error originated from client.get_transaction, we might want to mark the endpoint
            # This is a simplified check, better error context from recursive calls would be ideal
            logger.error(f"Fehler während der rekursiven Verarbeitung: {str(e)}")
            # Mark endpoint as failed if it's a known client error type
            # This part might need refinement based on how errors are raised from the recursive helper
            # and the client methods.
            # Example check (needs robustification):
            # if "Invalid transaction hash" in str(e) or "Could not parse transaction" in str(e):
            #     # These might indicate endpoint issues, but could also be bad input.
            #     # More specific error types from client/services would be better.
            #     # For now, let's rely on the error marking in the main handler's get_transaction try block.
            raise HTTPException(status_code=500, detail=f"Error during tracking: {str(e)}")


    except HTTPException as he:
        # Specific HTTPExceptions are re-raised
        logger.warning(f"HTTP-Fehler ({he.status_code}): {he.detail}")
        raise he
    except Exception as e:
        # Catch-all for unexpected errors in the main handler logic
        logger.critical(f"UNERWARTETER FEHLER in track_transaction (Main Handler): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
