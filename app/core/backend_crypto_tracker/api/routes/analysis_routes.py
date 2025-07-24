from fastapi import APIRouter, Depends
from app.core.backend_crypto_tracker.processor.transaction_graph import TransactionGraph
from database import get_db

router = APIRouter()

@router.get("/path")
def get_transaction_path(tx_hash: str, db: Session = Depends(get_db)):
    """GET /path: Token-Fluss-Visualisierung [[7]]"""
    graph = TransactionGraph()
    parsed_tx = db.query(Transaction).filter(Transaction.hash == tx_hash).first()
    if not parsed_tx:
        return {"error": "Transaktion nicht gefunden"}
    
    # Generiere Graph-Daten
    graph_data = graph.generate_graph(parsed_tx.parsed_data)
    return {"graph": graph_data}
