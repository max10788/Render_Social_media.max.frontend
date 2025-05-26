# app/core/solana_client.py

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.core.blockchain_api import fetch_on_chain_data
from app.core.config import settings

logger = logging.getLogger(__name__)

class SolanaClient:
    def __init__(self):
        self.blockchain_endpoint = settings.SOLANA_RPC_URL

    def validate_address(self, address: str) -> bool:
        """
        Validates a Solana address format.
        
        Args:
            address: The Solana address to validate
            
        Returns:
            bool: True if the address is valid, False otherwise
        """
        if not address:
            return False
        return len(address) == 44  # Solana addresses are 44 characters long

    def get_account_transactions(self, address: str) -> list:
        """
        Gets all transactions for a Solana account.
        
        Args:
            address: The Solana account address
            
        Returns:
            list: List of transactions
        """
        if not self.validate_address(address):
            logger.error(f"Invalid Solana address format: {address}")
            return []

        return fetch_on_chain_data(
            blockchain_endpoint=self.blockchain_endpoint,
            contract_address=address
        )

    def format_transaction(self, raw_transaction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formats a raw Solana transaction into a standardized format.
        
        Args:
            raw_transaction: The raw transaction data from the blockchain
            
        Returns:
            dict: Formatted transaction data
        """
        try:
            return {
                'transaction_id': raw_transaction.get('transaction_id', ''),
                'timestamp': raw_transaction.get('block_time', 0),
                'from_address': raw_transaction.get('wallet_address', ''),
                'to_address': raw_transaction.get('to_address', ''),
                'amount': float(raw_transaction.get('amount', 0)),
                'status': 'confirmed',
                'description': raw_transaction.get('description', '')
            }
        except Exception as e:
            logger.error(f"Error formatting transaction: {e}")
            return {}

    def get_latest_transactions(self, address: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Gets the latest transactions for a Solana account.
        
        Args:
            address: The Solana account address
            limit: Maximum number of transactions to return
            
        Returns:
            list: List of formatted transactions
        """
        try:
            transactions = self.get_account_transactions(address)
            formatted_transactions = []
            
            for tx in transactions[:limit]:
                formatted_tx = self.format_transaction(tx)
                if formatted_tx:
                    formatted_transactions.append(formatted_tx)
                    
            return formatted_transactions
        except Exception as e:
            logger.error(f"Error getting latest transactions: {e}")
            return []
