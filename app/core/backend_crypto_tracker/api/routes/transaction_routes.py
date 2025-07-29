# app/core/backend_crypto_tracker/api/routes/transaction_routes.py
from fastapi import APIRouter, HTTPException, Depends
# Wichtige Imports zuerst
from pydantic import BaseModel, Field, validator # Field von pydantic importieren
from typing import List, Optional, Dict, Any # Alle typing-Module explizit importieren
from dataclasses import dataclass # dataclass von dataclasses importieren
from datetime import datetime
from sqlalchemy.orm import Session

# Importiere get_logger und EndpointManager
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.endpoint_manager import EndpointManager

# Importiere Datenbank-Dependency
from app.core.database import get_db

# Importiere Services und Parser *nach* den Standardimports, um zirkuläre Importe zu vermeiden
# Verschiebe diese Imports hierher, falls Probleme mit zirkulären Imports auftreten:
# from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
# from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
# from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
# from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser

logger = get_logger(__name__)

router = APIRouter()

# Initialisiere den Endpoint-Manager (global, um Zustand zwischen Anfragen zu behalten)
endpoint_manager = EndpointManager()

@dataclass
class TransactionContext:
    """Context object to track transaction processing state across recursive calls."""
    processed_count: int = 0
    max_transactions: int = 50
    width: int = 3
    include_meta: bool = False

    def increment(self) -> bool:
        """Increment counter and return True if limit not reached."""
        self.processed_count += 1
        return self.processed_count <= self.max_transactions

class TrackTransactionRequest(BaseModel):
    blockchain: str
    tx_hash: str
    depth: int = Field(default=5, ge=1, le=10) # Validatoren direkt im Field
    include_meta: bool = False
    token_identifier: Optional[str] = None
    max_total_transactions: int = Field(default=50, ge=1, le=100) # Field verwenden
    width: int = Field(default=3, ge=1, le=10) # Field verwenden

    # Validatoren koennen auch so bleiben, sind aber durch Field abgedeckt
    # @validator('depth')
    # def validate_depth(cls, v):
    #     if v < 1:
    #         raise ValueError("Tiefe muss mindestens 1 sein")
    #     if v > 10:
    #         raise ValueError("Maximale Tiefe ist 10")
    #     return v
    # ... (andere Validatoren analog)

class TransactionResponse(BaseModel):
    tx_hash: str
    chain: str
    timestamp: datetime
    from_address: str
    to_address: str
    amount: float
    currency: str
    meta: Optional[Dict[str, Any]] = None
    is_chain_end: bool = False
    next_transactions: List["TransactionResponse"] = [] # Typing.List verwenden
    limit_reached: bool = False

# Rekursive Modellreferenz aktualisieren
TransactionResponse.update_forward_refs()

# --- Rekursive Hilfsfunktion ---
# WICHTIG: Diese Funktion sollte *nach* der Definition der Modelle stehen,
# oder die Abhaengigkeiten muessen innerhalb der Funktion aufgeloest werden.
# Um zirkulaere Importe zu vermeiden, importiere die Klassen hier lokal.
async def _track_transaction_recursive(
    request: TrackTransactionRequest,
    client,
    parser,
    db,
    endpoint_manager,
    context: TransactionContext
) -> Optional[TransactionResponse]: # typing.Optional verwenden
    """
    Enhanced recursive helper function with transaction limiting and metadata support.
    """
    # Lokale Imports zur Vermeidung von Zirkelbezügen
    from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
    from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
    from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
    from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser

    logger.info(f"--- REKURSIONSTIEFE: {request.depth} | Verarbeitet: {context.processed_count}/{context.max_transactions} ---")

    # Check if we've reached the transaction limit
    if not context.increment():
        logger.warning("Transaktionslimit erreicht - Beende Rekursion frühzeitig")
        return None

    try:
        # 1. Fetch transaction data
        raw_data = client.get_transaction(request.tx_hash)
        if not raw_data:
            logger.error(f"Keine Rohdaten für Transaktion '{request.tx_hash}' erhalten")
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 2. Parse transaction data with metadata support
        parsed_data = parser.parse_transaction(
            request.blockchain,
            raw_data,
            client,
            include_meta=context.include_meta
        )
        if not parsed_data:
             logger.error(f"Parsing fehlgeschlagen für Transaktion '{request.tx_hash}'")
             raise HTTPException(status_code=500, detail="Failed to parse transaction")

        # 3. Create base response
        current_transaction = TransactionResponse(
            tx_hash=parsed_data["tx_hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            from_address=parsed_data["from_address"],
            to_address=parsed_data["to_address"],
            amount=float(parsed_data["amount"]),
            currency=parsed_data["currency"],
            meta=parsed_data.get("meta") if context.include_meta else None,
            next_transactions=[],
            limit_reached=False
        )

        # 4. Process next level if depth allows and limit not reached
        if request.depth > 1:
            # Get token identifier
            token_identifier = (
                request.token_identifier or
                parsed_data.get("token_identifier") or
                parsed_data.get("currency", "SOL")
            )

            # Get next transactions with width parameter
            next_transactions = parser._get_next_transactions(
                request.blockchain,
                parsed_data["to_address"],
                current_hash=parsed_data["tx_hash"],
                token_identifier=token_identifier, # Achte auf korrekten Parameternamen fuer Parser
                limit=context.width,
                include_meta=context.include_meta
            )

            if next_transactions:
                 logger.info(f"[Tiefe: {request.depth}] Verarbeite {len(next_transactions)} potenzielle Folgetransaktionen")
                 processed_count_in_this_level = 0
                 for next_tx in next_transactions:
                    # Limit-Prüfung innerhalb der Schleife
                    if context.processed_count >= context.max_transactions:
                         logger.info("Transaktionslimit innerhalb der Schleife erreicht")
                         current_transaction.limit_reached = True
                         break

                    # Check if it's a chain-end transaction (Annahme: Flag kommt aus dem Parser)
                    # Oder prüfe, ob die aktuelle Transaktion das Ende darstellt?
                    # if parsed_data.get("is_chain_end", False): # Beispiel fuer aktuelle Transaktion
                    #     current_transaction.is_chain_end = True
                    #     continue # Oder break, je nach Logik?

                    # Create child request
                    child_request = TrackTransactionRequest(
                        blockchain=request.blockchain,
                        tx_hash=next_tx["hash"] if isinstance(next_tx, dict) else next_tx,
                        depth=request.depth - 1,
                        include_meta=context.include_meta,
                        token_identifier=token_identifier,
                        max_total_transactions=context.max_transactions,
                        width=context.width
                    )

                    # Recursive call
                    child_transaction = await _track_transaction_recursive( # async hinzugefuegt
                        child_request,
                        client,
                        parser,
                        db,
                        endpoint_manager,
                        context
                    )

                    if child_transaction:
                        current_transaction.next_transactions.append(child_transaction)
                        processed_count_in_this_level += 1
                    # else: Limit wurde erreicht oder Fehler, Kind wurde nicht hinzugefuegt

                 logger.info(f"[Tiefe: {request.depth}] {processed_count_in_this_level} Folgetransaktionen erfolgreich hinzugefuegt")

        logger.info(f"[Tiefe: {request.depth}] <-- Fertig mit Transaktion {request.tx_hash[:10]}... (Kinder: {len(current_transaction.next_transactions)})")
        return current_transaction

    except HTTPException:
        # Re-raise HTTPExceptions to be handled by FastAPI
        raise
    except Exception as e:
        logger.error(f"Fehler in _track_transaction_recursive für Hash '{request.tx_hash}': {str(e)}", exc_info=True)
        # Bei einem internen Fehler in der Rekursion werfen wir einen HTTP 500
        raise HTTPException(status_code=500, detail=f"Internal error during recursive tracking: {str(e)}")

# --- Haupt-Endpunkt ---
@router.post("/track", response_model=TransactionResponse)
async def track_transaction( # async hinzugefuegt
    request: TrackTransactionRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced main endpoint with support for transaction limits and metadata.
    """
    # Lokale Imports zur Vermeidung von Zirkelbezügen
    from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
    from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
    from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
    from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser

    try:
        logger.info(f"START: Track transaction for {request.blockchain} / {request.tx_hash}")
        logger.info(f"Parameters: max_transactions={request.max_total_transactions}, "
                   f"width={request.width}, include_meta={request.include_meta}, depth={request.depth}")

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
                logger.warning(f"Unsupported blockchain requested: {request.blockchain}")
                raise HTTPException(status_code=400, detail="Unsupported blockchain")

        except Exception as e:
            logger.error(f"Client-Initialisierung fehlgeschlagen fuer Blockchain {request.blockchain}: {str(e)}")
            raise HTTPException(status_code=503, detail="API endpoint unavailable")

        # 2. Parser-Initialisierung
        try:
             parser = BlockchainParser()
        except Exception as e:
             logger.error(f"Parser-Initialisierung fehlgeschlagen: {str(e)}")
             raise HTTPException(status_code=500, detail="Internal server error - Parser initialization failed")

        # 3. Context erstellen
        context = TransactionContext(
            processed_count=0,
            max_transactions=request.max_total_transactions,
            width=request.width,
            include_meta=request.include_meta
        )

        # 4. Rekursive Verfolgung starten
        logger.info("Starte rekursive Transaktionsverfolgung...")
        result = await _track_transaction_recursive( # await hinzugefuegt
            request,
            client,
            parser,
            db,
            endpoint_manager,
            context
        )

        if result:
            logger.info(f"ERFOLG: Verfolgung abgeschlossen. Insgesamt {context.processed_count} Transaktionen verarbeitet.")
            return result
        else:
            # Dieser Fall sollte eigentlich nicht mehr eintreten, da _track_transaction_recursive None zurueckgibt
            # und die Rekursion beendet. Aber zur Sicherheit:
            logger.warning("Rekursive Verfolgung lieferte kein Ergebnis.")
            raise HTTPException(status_code=500, detail="No result from transaction tracking (limit reached or error)")

    except HTTPException:
        # Diese werden direkt von FastAPI behandelt
        raise
    except Exception as e:
        logger.critical(f"Unerwarteter kritischer Fehler im Endpunkt /track: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

