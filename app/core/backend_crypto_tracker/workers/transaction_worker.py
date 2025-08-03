"""
Worker, der neue Transaktionen abfragt & persistiert.
"""
import asyncio
from processor.blockchain_parser import BlockchainParser
from processor.database.models.transaction import Transaction
from processor.database.manager import DatabaseManager

class TransactionWorker:
    def __init__(self, db: DatabaseManager):
        self.db = db
        self.parser = BlockchainParser()

    async def fetch_latest_block(self, chain: str):
        # Beispiel: EVM-Block via etherscan
        pass
