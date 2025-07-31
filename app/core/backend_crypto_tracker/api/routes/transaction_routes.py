# app/core/backend_crypto_tracker/api/routes/transaction_routes.py
# (Inhalt bleibt größtenteils gleich, nur die serverseitige Limit-Validierung wird hinzugefügt)
from fastapi import APIRouter, HTTPException, Depends
# Wichtige Imports zuerst
from pydantic import BaseModel, Field, validator # Field von pydantic importieren
from typing import List, Optional, Dict, Any # Alle typing-Module explizit importieren
from dataclasses import dataclass # dataclass von dataclasses importieren
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse  # Oder from starlette.responses import JSONResponse
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
# from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser # <-- Geändert
# from app.core.backend_crypto_tracker.processor.btc_parser import BTCParser # <-- Neu
# from app.core.backend_crypto_tracker.processor.eth_parser import ETHParser # <-- Neu
# from app.core.backend_crypto_tracker.processor.solana_parser import SolanaParser # <-- Neu
logger = get_logger(__name__)
router = APIRouter()
# Initialisiere den Endpoint-Manager (global, um Zustand zwischen Anfragen zu behalten)
endpoint_manager = EndpointManager()

# *** NEU: Definiere das maximale Limit, das von der Website/Anwendung erlaubt ist ***
# Dies sollte dem maximalen Wert entsprechen, den ein Benutzer auswählen kann.
# Passen Sie diesen Wert an Ihre Anforderungen an (z.B. 100, 500).
MAX_TOTAL_TRANSACTIONS_WEBSITE = 100 # Beispielwert - ANPASSEN!
# *** ENDE NEU ***

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

TransactionResponse.update_forward_refs()

async def _track_transaction_recursive(
    request: TrackTransactionRequest,
    client,
    parser, # <-- Erwartet jetzt den Haupt-BlockchainParser
    db,
    endpoint_manager,
    context: TransactionContext,
    # *** NEU: Parameter fuer den urspruenglichen Token-Identifier ***
    original_token_identifier: Optional[str] = None
) -> Optional[TransactionResponse]: # typing.Optional verwenden
    """Enhanced recursive helper function with transaction limiting, metadata support, and consistent token tracking."""
    try:
        # Lokale Imports zur Vermeidung von Zirkelbezügen
        # ACHTUNG: Die Parser-Imports wurden aktualisiert
        from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
        from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
        from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
        # Die Hauptparser-Klasse importieren
        # from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser # Beispiel

        # 1. Limit-Prüfung
        if context.processed_count >= context.max_transactions:
            logger.info("Globales Transaktionslimit erreicht, stoppe Rekursion.")
            return None

        # 2. Transaktion abrufen
        logger.info(f"[Tiefe: {request.depth}] --> Verarbeite Transaktion {request.tx_hash}")
        tx_data = await client.get_transaction(request.tx_hash, include_meta=context.include_meta)
        if not tx_data:
            logger.warning(f"Transaktion {request.tx_hash} nicht gefunden.")
            return None

        # 3. Transaktion parsen
        parsed_data = parser.parse_transaction(
            tx_hash=request.tx_hash,
            tx_data=tx_data,
            blockchain=request.blockchain,
            include_meta=context.include_meta
        )
        if not parsed_data:
            logger.error(f"Fehler beim Parsen der Transaktion {request.tx_hash}")
            return None

        # *** KORREKTUR 1: original_token_identifier beim ersten Aufruf setzen ***
        # Bestimme den original_token_identifier, wenn er noch nicht gesetzt ist (erster Aufruf)
        # Verwende eine lokale Variable, um ihn nicht fuer spaetere Aufrufe zu ueberschreiben
        final_original_token_identifier = original_token_identifier
        if final_original_token_identifier is None:
            # 1. Versuche ihn aus dem Request zu nehmen
            if request.token_identifier:
                final_original_token_identifier = request.token_identifier
                logger.info(f"[Tiefe: {request.depth}] Original-Token-Identifier aus Request uebernommen: {final_original_token_identifier}")
            else:
                # 2. Fallback: Extrahiere ihn aus der aktuellen (ersten) geparsten Transaktion
                # Verwende eine Methode des Parsers, um die Mint-Adresse zu erhalten.
                # Diese Methode muss im Parser existieren (z.B. _get_token_identifier_from_transaction).
                try:
                    # *** ANPASSUNG: Extrahiere aus den Rohdaten (tx_data), nicht aus parsed_data ***
                    # Die Extraktionsmethode braucht die Rohdaten der Transaktion.
                    final_original_token_identifier = parser._get_token_identifier_from_transaction(tx_data)
                    logger.info(f"[Tiefe: {request.depth}] Original-Token-Identifier aus erster Transaktion ({request.tx_hash}) extrahiert: {final_original_token_identifier}")
                except Exception as e:
                    logger.warning(f"[Tiefe: {request.depth}] Fehler beim Extrahieren des Token-Identifier aus erster Transaktion ({request.tx_hash}): {e}. Verwende Standard-SOL.")
                    # Standard Solana Mint Adresse fuer SOL
                    final_original_token_identifier = "So11111111111111111111111111111111111111112"

        # Logge den verwendeten original_token_identifier fuer Debugging
        logger.debug(f"[Tiefe: {request.depth}] Verwendeter final_original_token_identifier fuer Suche: {final_original_token_identifier}")


        # 4. TransactionResponse erstellen
        current_transaction = TransactionResponse(
            tx_hash=parsed_data["tx_hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            from_address=parsed_data["from_address"],
            to_address=parsed_data["to_address"],
            amount=float(parsed_data["amount"]),
            currency=parsed_data["currency"], # Währung der aktuellen Transaktion
            meta=parsed_data.get("meta") if context.include_meta else None,
            next_transactions=[],
            limit_reached=False
        )

        # 5. Nächste Ebene verarbeiten, wenn Tiefe erlaubt und Limit nicht erreicht
        if request.depth > 1:
            # *** KORREKTUR 2: Verwende IMMER den final_original_token_identifier ***
            # Hole den Token-Identifier für die Suche nach Folgetransaktionen
            token_identifier_to_use = final_original_token_identifier

            # - ANPASSUNG: Verwende die Methode des Hauptparsers -
            # Die alte Methode `_get_next_transactions` ist jetzt `get_next_transactions` im Hauptparser
            # Und der Parameter heißt `token_identifier`, nicht `filter_token`
            next_transactions = parser.get_next_transactions( # <-- Methode des Hauptparsers
                blockchain=request.blockchain, # <-- Blockchain als Parameter
                address=parsed_data["to_address"],
                current_hash=parsed_data["tx_hash"],
                # *** WICHTIG: Verwende den originalen Token-Identifier ***
                token_identifier=token_identifier_to_use, # <-- Korrekter Parameter
                limit=context.width,
                include_meta=context.include_meta # include_meta übergeben
            )
            # - ENDE ANPASSUNG -
            
            if next_transactions:
                logger.info(f"[Tiefe: {request.depth}] Verarbeite {len(next_transactions)} potenzielle Folgetransaktionen")
                processed_count_in_this_level = 0
                for next_tx in next_transactions:
                    # Limit-Prüfung innerhalb der Schleife
                    if context.processed_count >= context.max_transactions:
                        logger.info("Transaktionslimit innerhalb der Schleife erreicht")
                        current_transaction.limit_reached = True
                        break

                    # Chain-End-Erkennung
                    # Das Flag `is_chain_end` kommt jetzt direkt aus dem Ergebnis von `get_next_transactions`
                    is_chain_end_for_next = next_tx.get("is_chain_end", False)
                    if is_chain_end_for_next:
                        logger.info(f"Chain-End für nächste Transaktion {next_tx.get('hash', 'UNKNOWN')} erkannt. Stoppe Verfolgung.")
                        # Optional: Füge die Chain-End-Transaktion mit einem Flag hinzu oder überspringe sie
                        # Hier überspringen wir sie, um die Kette nicht weiter zu verfolgen.
                        continue

                    # Create child request
                    child_request = TrackTransactionRequest(
                        blockchain=request.blockchain,
                        tx_hash=next_tx["hash"],
                        depth=request.depth - 1,
                        include_meta=request.include_meta,
                        width=request.width,
                        # *** KORREKTUR 3: Weitergabe des final_original_token_identifier ***
                        # *** WICHTIG: Verwende den urspruenglichen, nicht den der aktuellen TX ***
                        token_identifier=final_original_token_identifier # <-- Weitergabe des Originals
                    )

                    # Rekursiver Aufruf mit Weitergabe des final_original_token_identifier
                    child_transaction = await _track_transaction_recursive(
                        request=child_request,
                        client=client,
                        parser=parser,
                        db=db,
                        endpoint_manager=endpoint_manager,
                        context=context,
                        # *** WICHTIG: Weitergabe des final_original_token_identifier ***
                        original_token_identifier=final_original_token_identifier # <-- Weitergabe des Originals
                    )

                    if child_transaction:
                        current_transaction.next_transactions.append(child_transaction)
                        processed_count_in_this_level += 1
                        # context.increment() wird bereits in _track_transaction_recursive aufgerufen
                        # oder implizit durch context.processed_count += 1

                logger.info(f"[Tiefe: {request.depth}] {processed_count_in_this_level} Folgetransaktionen erfolgreich hinzugefuegt")
            else:
                logger.info(f"[Tiefe: {request.depth}] Keine Folgetransaktionen (mit Token {token_identifier_to_use}) fuer Adresse {parsed_data['to_address']} gefunden.")

        logger.info(f"[Tiefe: {request.depth}] <-- Fertig mit Transaktion {request.tx_hash} (Kinder: {len(current_transaction.next_transactions)})")
        context.increment() # Zähler für die aktuelle Transaktion erhöhen
        return current_transaction

    except Exception as e:
        logger.error(f"Fehler in _track_transaction_recursive fuer Hash '{request.tx_hash}': {str(e)}", exc_info=True)
        # Bei einem internen Fehler in der Rekursion werfen wir einen HTTP 500
        # raise HTTPException(status_code=500, detail=f"Internal error during recursive tracking: {str(e)}")
        # Besser: Fehler loggen und ggf. None zurueckgeben, um die Kette nicht komplett abzubrechen
        # oder den Fehler an den Aufrufer weitergeben, der ihn behandelt.
        # Hier werfen wir ihn weiter, damit der Haupt-Endpunkt ihn faengt.
        raise e # Oder: return None

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
    # Importiere den Haupt-BlockchainParser
    from app.core.backend_crypto_tracker.processor.blockchain_parser import BlockchainParser # <-- Hauptparser
    try:
        logger.info(f"START: Track transaction for {request.blockchain} / {request.tx_hash}")
        logger.info(f"Parameters: max_transactions={request.max_total_transactions}, "
                   f"width={request.width}, include_meta={request.include_meta}, depth={request.depth}")
        # *** NEU: Validierung des Limits basierend auf der Website-Eingabe ***
        # Stellt sicher, dass das angeforderte Limit das serverseitige Maximum nicht überschreitet.
        if request.max_total_transactions is None or request.max_total_transactions <= 0:
            raise HTTPException(status_code=400, detail="max_total_transactions muss eine positive Ganzzahl sein.")

        # *** Kritisch: Begrenze das Limit auf das maximal erlaubte von der Website ***
        # Dies verhindert, dass Benutzer oder Clients versuchen, extrem hohe Werte zu senden.
        effective_max_transactions = min(request.max_total_transactions, MAX_TOTAL_TRANSACTIONS_WEBSITE)

        # Optional: Logging, wenn das angeforderte Limit reduziert wurde
        if effective_max_transactions != request.max_total_transactions:
             logger.warning(f"Angefordertes max_total_transactions {request.max_total_transactions} wurde auf erlaubtes Website-Maximum {effective_max_transactions} reduziert.")
        # *** ENDE NEU ***

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
        # Verwende den neuen Haupt-BlockchainParser
        try:
             parser = BlockchainParser() # <-- Initialisiere den Hauptparser
        except Exception as e:
             logger.error(f"Parser-Initialisierung fehlgeschlagen: {str(e)}")
             raise HTTPException(status_code=500, detail="Internal server error - Parser initialization failed")
        # 3. Context erstellen
        # *** ÄNDERUNG: Verwende das validierte effektive Limit ***
        context = TransactionContext(
            processed_count=0,
            max_transactions=effective_max_transactions, # <-- Geändert
            width=request.width,
            include_meta=request.include_meta
        )
        # 4. Rekursive Verfolgung starten
        logger.info("Starte rekursive Transaktionsverfolgung...")
        result = await _track_transaction_recursive( # await hinzugefuegt
            request,
            client,
            parser, # Parser wird weitergereicht
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
