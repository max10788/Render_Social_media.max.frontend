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
    depth: int = 5
    include_meta: bool = False
    token_identifier: Optional[str] = None
    max_total_transactions: int = Field(default=50, ge=1, le=100)
    width: int = Field(default=3, ge=1, le=10)

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
    next_transactions: List["TransactionResponse"] = []
    limit_reached: bool = False

TransactionResponse.update_forward_refs()

def _track_transaction_recursive(
    request: TrackTransactionRequest,
    client,
    parser,
    db,
    endpoint_manager,
    context: TransactionContext
) -> Optional[TransactionResponse]:
    """
    Enhanced recursive helper function with transaction limiting and metadata support.
    """
    logger.info(f"--- REKURSIONSTIEFE: {request.depth} | Verarbeitet: {context.processed_count}/{context.max_transactions} ---")

    # Check if we've reached the transaction limit
    if not context.increment():
        logger.warning("Transaktionslimit erreicht - Beende Rekursion frühzeitig")
        return None

    try:
        # 1. Fetch transaction data
        raw_data = client.get_transaction(request.tx_hash)
        if not raw_data:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 2. Parse transaction data with metadata support
        parsed_data = parser.parse_transaction(
            request.blockchain,
            raw_data,
            client,
            include_meta=context.include_meta
        )
        if not parsed_data:
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
                token_identifier=token_identifier,
                limit=context.width,
                include_meta=context.include_meta
            )

            if next_transactions:
                for next_tx in next_transactions:
                    # Check if it's a chain-end transaction
                    if isinstance(next_tx, dict) and next_tx.get("is_chain_end", False):
                        current_transaction.is_chain_end = True
                        continue

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
                    child_transaction = _track_transaction_recursive(
                        child_request,
                        client,
                        parser,
                        db,
                        endpoint_manager,
                        context
                    )

                    if child_transaction:
                        current_transaction.next_transactions.append(child_transaction)
                    elif context.processed_count >= context.max_transactions:
                        current_transaction.limit_reached = True
                        break

        return current_transaction

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in recursive tracking: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track", response_model=TransactionResponse)
def track_transaction(
    request: TrackTransactionRequest,
    db: Session = Depends(get_db)
):
    """
    Enhanced main endpoint with support for transaction limits and metadata.
    """
    try:
        logger.info(f"START: Track transaction for {request.blockchain} / {request.tx_hash}")
        logger.info(f"Parameters: max_transactions={request.max_total_transactions}, "
                   f"width={request.width}, include_meta={request.include_meta}")

        # Create context object
        context = TransactionContext(
            processed_count=0,
            max_transactions=request.max_total_transactions,
            width=request.width,
            include_meta=request.include_meta
        )

        # Initialize client
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
            logger.error(f"Client initialization failed: {str(e)}")
            raise HTTPException(status_code=503, detail="API endpoint unavailable")

        # Initialize parser
        parser = BlockchainParser()

        # Start recursive tracking
        result = _track_transaction_recursive(
            request,
            client,
            parser,
            db,
            endpoint_manager,
            context
        )

        if result:
            logger.info(f"SUCCESS: Processed {context.processed_count} transactions")
            return result
        else:
            raise HTTPException(status_code=500, detail="No result from transaction tracking")

    except HTTPException:
        raise
    except Exception as e:
        logger.critical(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
