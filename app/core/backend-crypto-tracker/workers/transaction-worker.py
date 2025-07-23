from celery import shared_task
from services.btc.transaction_service import BlockchairBTCClient
from services.eth.etherscan_api import EtherscanETHClient
from services.sol.solana_api import SolanaAPIClient
from database.models.transaction import Transaction
from database import SessionLocal

@shared_task
def process_transaction(chain: str, tx_hash: str):
    """Asynchrone Verarbeitung von Transaktionsketten [[9]]"""
    if chain == "btc":
        client = BlockchairBTCClient()
        raw_data = client.get_transaction(tx_hash)
    elif chain == "eth":
        client = EtherscanETHClient()
        raw_data = client.get_transaction(tx_hash)
    elif chain == "sol":
        client = SolanaAPIClient()
        raw_data = client.get_transaction(tx_hash)
    else:
        raise ValueError(f"Unbekannte Chain: {chain}")

    # Speichere in der Datenbank
    db = SessionLocal()
    db.add(Transaction(hash=tx_hash, chain=chain, raw_data=raw_data))
    db.commit()
    db.refresh(db.query(Transaction).filter(Transaction.hash == tx_hash).first())
