# app/core/backend_crypto_tracker/processor/blockchain_parser.py
import logging
from typing import List, Dict, Any, Optional
from app.core.backend_crypto_tracker.utils.logger import get_logger
# Importiere die spezifischen Parser
from .btc_parser import BTCParser
from .eth_parser import ETHParser
from .solana_parser import SolanaParser

logger = get_logger(__name__)

class BlockchainParser:
    def __init__(self):
        logger.info("BlockchainParser: Initialisiert")
        # Instanziiere die spezifischen Parser
        self._btc_parser = BTCParser()
        self._eth_parser = ETHParser()
        self._sol_parser = SolanaParser()

    def get_next_transactions(
        self,
        blockchain: str,
        address: str,
        current_hash: str,
        token_identifier: Optional[str] = None,
        limit: int = 5,
        include_meta: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Findet die nächsten Transaktionen basierend auf der Zieladresse und Token.
        Delegiert an die spezifischen Parser.
        """
        logger.info(f"START: Suche nach nächsten Transaktionen für Blockchain '{blockchain}'")
        logger.info(f"Adresse: {address}, Hash: {current_hash}, Token: {token_identifier}, "
                   f"Limit: {limit}, Include Meta: {include_meta}")
        try:
            if blockchain == "btc":
                # BTC hat keinen Token-Filter
                return self._btc_parser._get_next_transactions(address, current_hash, limit)
            elif blockchain == "eth":
                 # ETH hat keinen Token-Filter in der aktuellen Implementierung
                return self._eth_parser._get_next_transactions(address, current_hash, limit)
            elif blockchain == "sol":
                return self._sol_parser._get_next_transactions(
                    address=address,
                    current_hash=current_hash,
                    limit=limit,
                    token_identifier=token_identifier,
                    include_meta=include_meta
                )
            else:
                logger.error(f"Parser: Blockchain '{blockchain}' nicht unterstützt für next_transactions")
                return []
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der nächsten Transaktionen: {str(e)}", exc_info=True)
            return []

    def parse_transaction(self, blockchain: str, raw_data: dict):
        """
        Hauptmethode zum Parsen von Transaktionsdaten fuer eine bestimmte Blockchain.
        Delegiert an die spezifischen Parser.
        """
        logger.debug(f"BlockchainParser: parse_transaction aufgerufen fuer Blockchain '{blockchain}'")
        try:
            if blockchain == "sol":
                return self._sol_parser._parse_transaction(raw_data)
            elif blockchain == "btc":
                return self._btc_parser._parse_transaction(raw_data)
            elif blockchain == "eth":
               return self._eth_parser._parse_transaction(raw_data)
            else:
                logger.error(f"BlockchainParser: Nicht unterstuetzte Blockchain '{blockchain}'")
                return None
        except Exception as e:
            logger.error(f"BlockchainParser: Fehler in parse_transaction fuer Blockchain '{blockchain}': {e}", exc_info=True)
            return None

    # Methode zur Abfrage des Token-Saldos (neu, delegiert an SolanaParser)
    def get_sol_token_balance(self, address: str, mint_address: str):
        """
        Ruft den aktuellen Saldo eines spezifischen SPL Tokens für eine Adresse ab.
        Delegiert an den SolanaParser.
        """
        return self._sol_parser.get_token_balance(address, mint_address)
