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
def _track_transaction_recursive(request: TrackTransactionRequest, client, parser, db, endpoint_manager):
    """
    Rekursive Hilfsfunktion zur Verfolgung von Transaktionen.
    Diese Funktion ist NICHT eingereiht (queued).
    Sie wird synchron ausgeführt und blockiert, bis die gesamte Rekursion abgeschlossen ist.
    """
    # --- HINZUGEFÜGT: Fortschrittsmeldung mit Wallet-Adressen ---
    logger.info(f"--- REKURSIONSTIEFE: {request.depth} ---")
    # --- ENDE HINZUGEFÜGT ---
    
    logger.info(f"RECURSIVE START: Tracking transaction for Blockchain '{request.blockchain}' with Hash '{request.tx_hash}' at depth {request.depth}")

    try:
        # 1. Abrufen der Transaktionsdaten vom Blockchain-Client
        logger.info(f"Recursive Aufruf: client.get_transaction('{request.tx_hash}')")
        raw_data = client.get_transaction(request.tx_hash)
        if not raw_data:
            logger.error(f"FEHLER: Keine Rohdaten für Transaktion '{request.tx_hash}' erhalten")
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 2. Parsen der Transaktionsdaten
        logger.info("Recursive Aufruf: parser.parse_transaction()")
        parsed_data = parser.parse_transaction(request.blockchain, raw_data, client)
        if not parsed_data:
            logger.error(f"FEHLER: Parsen der Transaktion '{request.tx_hash}' fehlgeschlagen")
            raise HTTPException(status_code=500, detail="Failed to parse transaction")

        logger.info(f"Recursive Erfolg: Data parsed (Amount: {parsed_data.get('amount', 'N/A')})")

        # --- HINZUGEFÜGT: Detaillierte Fortschrittsmeldung mit Wallets ---
        current_source = parsed_data.get("from_address", "Unbekannt")
        current_target = parsed_data.get("to_address", "Unbekannt")
        short_source = current_source[:8] + "..." + current_source[-4:] if len(current_source) > 12 else current_source
        short_target = current_target[:8] + "..." + current_target[-4:] if len(current_target) > 12 else current_target
        progress_msg = f"[Tiefe: {request.depth}] Verarbeite: {request.tx_hash[:10]}... | Von: {short_source} -> Zu: {short_target}"
        logger.info(progress_msg)
        # --- ENDE HINZUGEFÜGT ---

        # 3. Erstelle das Antwortobjekt für die aktuelle Transaktion
        # --- KORREKTUR: Sichere Handhabung von target_currency ---
        # Der Fehler 'AttributeError: 'TrackTransactionRequest' object has no attribute 'target_currency''
        # deutet darauf hin, dass target_currency nicht direkt im request-Objekt ist.
        # Wir versuchen, es zu erhalten, und verwenden einen Fallback.
        target_currency_from_request = getattr(request, 'target_currency', None)
        if target_currency_from_request is None:
             # Fallback: Verwende die Währung aus den geparsten Daten oder eine Standardwährung
             target_currency_from_request = parsed_data.get("currency", "UNKNOWN")
             logger.warning(f"target_currency nicht im Request gefunden. Verwende Fallback: {target_currency_from_request}")
        
        response_data = {
            "source": parsed_data.get("from_address", ""),
            "target": parsed_data.get("to_address", ""),
            "tx_hash": parsed_data.get("tx_hash", ""),
            "transaction_count": 1, # Initial 1 für die aktuelle Transaktion
            "total_value": parsed_data.get("amount", 0.0),
            "status": "completed",
            "target_currency": target_currency_from_request,
            "exchange_rate": 1.0,
            "children": [],
            # --- HINZUGEFUEGT: Fehlende Felder fuer TransactionResponse ---
            "chain": parsed_data.get("chain", "unknown"),       # <-- Hinzugefuegt
            "timestamp": parsed_data.get("timestamp"),          # <-- Hinzugefuegt (Pydantic erwartet evtl. ein datetime-Objekt)
            "currency": parsed_data.get("currency", "UNKNOWN"), # <-- Hinzugefuegt
            # --- ENDE HINZUGEFUEGT ---
        }

        # --- KORREKTUR: Rekursive Verfolgung basierend auf Tiefe ---
        # 4. Prüfe, ob die maximale Tiefe erreicht ist (depth > 1)
        if request.depth > 1:
            logger.info(f"Recursive: Processing next transactions (Current Depth Level: {request.depth})")
            
            # 5. Bestimme den Token-Identifier für die nächste Suche
            token_identifier = request.token_identifier or parsed_data.get("token_identifier") or parsed_data.get("mint_address") or parsed_data.get("currency")
            logger.info(f"Recursive: Tracking token with identifier: {token_identifier}")

            # --- KORREKTUR: Verwende request.depth für die Breite ---
            # 6. Die Breite (Anzahl Geschwister-Transaktionen pro Ebene) wird aus dem ursprünglichen request.depth abgeleitet.
            # Beispiel: Maximal 5 Geschwister oder so viele wie depth erlaubt.
            max_width = min(5, request.depth) 
            logger.info(f"Recursive: Max width for next transactions set to: {max_width}")

            # 7. Hole die nächsten Transaktionen basierend auf der Zieladresse der aktuellen Transaktion
            next_hashes = parser._get_next_transactions(
                request.blockchain,
                parsed_data["to_address"],
                current_hash=parsed_data["tx_hash"],
                token_identifier=token_identifier,
                limit=max_width # <-- Übergibt den korrekten Breitenlimit
            )
            logger.info(f"Recursive: Found {len(next_hashes)} potential next transactions")

            # --- HINZUGEFÜGT: Fortschrittsmeldung für gefundene Transaktionen ---
            if next_hashes:
                logger.info(f"[Tiefe: {request.depth}] Starte Verarbeitung von max. {min(len(next_hashes), request.depth - 1)} Kindern für Wallet {short_target}.")
            # --- ENDE HINZUGEFÜGT ---

            # 8. Verarbeite nur so viele Transaktionen, wie die verbleibende Tiefe erlaubt
            # Es werden max. (request.depth - 1) Transaktionen aus der Liste verarbeitet.
            transactions_to_process = next_hashes[:request.depth - 1] 
            logger.info(f"Recursive: Processing {len(transactions_to_process)} of {len(next_hashes)} found transactions")

            # 9. Rekursive Verarbeitung der nächsten Transaktionen
            processed_count = 0
            total_to_process = len(transactions_to_process)
            for i, next_hash in enumerate(transactions_to_process):
                # --- HINZUGEFÜGT: Fortschrittsmeldung für jedes Kind ---
                logger.info(f"[Tiefe: {request.depth}] Verarbeite Kind {i+1}/{total_to_process} (Hash: {next_hash[:10]}...)")
                # --- ENDE HINZUGEFÜGT ---

                # Diese Schleifenbegrenzung ist redundant wegen dem Slice [:request.depth - 1], 
                # dient aber der Klarheit und zusätzlichen Sicherheit.
                if processed_count >= request.depth - 1: 
                     logger.info(f"Recursive: Stopped processing due to depth limit ({request.depth}). Processed {processed_count} children.")
                     break # Stoppe, wenn die Anzahl der zu verarbeitenden Kinder die verbleibende Tiefe erreicht

                try:
                    # logger.info(f"Recursive: Processing child transaction {processed_count + 1} of {len(transactions_to_process)}: {next_hash}")
                    
                    # 10. Erstelle eine neue Anfrage für die rekursive Verfolgung
                    # WICHTIG: Reduziere die Tiefe um 1 für den nächsten Aufruf
                    child_request = TrackTransactionRequest(
                        blockchain=request.blockchain,
                        tx_hash=next_hash,
                        # --- KORREKTUR: target_currency korrekt übergeben ---
                        # target_currency=request.target_currency, # <-- Ursprünglicher Fehler
                        target_currency=target_currency_from_request, # <-- Korrigiert
                        # --- ENDE KORREKTUR ---
                        token_identifier=token_identifier,
                        depth=request.depth - 1 # <-- Korrekte Tiefenreduzierung
                    )
                    
                    # 11. Rekursiver Aufruf (synchron)
                    child_response = _track_transaction_recursive(child_request, client, parser, db, endpoint_manager)
                    
                    # 12. Füge das Ergebnis zur Kinderliste hinzu
                    response_data["children"].append(child_response)
                    
                    # 13. Aktualisiere die aggregierten Werte
                    response_data["transaction_count"] += child_response.transaction_count
                    response_data["total_value"] += child_response.total_value
                    
                    processed_count += 1
                    logger.info(f"Recursive: Successfully processed child transaction {next_hash}")
                    
                except Exception as e:
                    logger.error(f"Fehler bei der rekursiven Verarbeitung von Transaktion {next_hash}: {str(e)}", exc_info=True)
                    # Optional: Füge ein Fehlerobjekt hinzu oder überspringe einfach
                    # child_error_response = TransactionResponse(...) # Mit Fehlerstatus
                    # response_data["children"].append(child_error_response)
                    continue # Fahre mit der nächsten Transaktion fort, auch wenn eine fehlschlägt
            
            # --- HINZUGEFÜGT: Abschlussmeldung für die Kinder dieser Ebene ---
            logger.info(f"[Tiefe: {request.depth}] Abgeschlossen: {processed_count} Kind-Transaktionen für Wallet {short_target} verarbeitet.")
            # --- ENDE HINZUGEFÜGT ---

        logger.info(f"RECURSIVE SUCCESS: Completed tracking for Hash '{request.tx_hash}'")
        # --- HINZUGEFÜGT: Abschlussmeldung für diese Transaktionsebene ---
        logger.info(f"[Tiefe: {request.depth}] <-- Fertig mit Transaktion {request.tx_hash[:10]}... (Kinder: {len(response_data.get('children', []))})")
        # --- ENDE HINZUGEFÜGT ---
        
        # 14. Erstelle das finale Antwortobjekt und gib es zurück
        # Stellen Sie sicher, dass TransactionResponse korrekt importiert ist
        return TransactionResponse(**response_data) 

    except HTTPException:
        # HTTPExceptions weiterwerfen
        raise
    except Exception as e:
        logger.error(f"FEHLER in _track_transaction_recursive für Hash '{request.tx_hash}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error during recursive tracking: {str(e)}")


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
