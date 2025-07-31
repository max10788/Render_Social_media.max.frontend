# app/core/backend_crypto_tracker/processor/blockchain_parser.py
import logging
from typing import List, Dict, Any, Optional
from app.core.backend_crypto_tracker.utils.logger import get_logger
# Importiere die spezifischen Parser
from .btc_parser import BTCParser
from .eth_parser import ETHParser
from .solana_parser import SolanaParser
# *** NEU: Importiere den CardanoParser ***
from .cardano_parser import CardanoParser # <-- Import hinzugefügt

logger = get_logger(__name__)

class BlockchainParser:
    def __init__(self):
        logger.info("BlockchainParser: Initialisiert")
        # Instanziiere die spezifischen Parser
        self._btc_parser = BTCParser()
        self._eth_parser = ETHParser()
        self._sol_parser = SolanaParser()
        # *** NEU: Instanziiere den CardanoParser ***
        self._ada_parser = CardanoParser() # <-- Parser instanziiert

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
            # *** NEU: Delegation an den CardanoParser ***
            elif blockchain == "ada":
                 return self._ada_parser._get_next_transactions(
                    address=address,
                    current_hash=current_hash,
                    limit=limit,
                    token_identifier=token_identifier, # <-- Token-Identifier (PolicyID.AssetName oder "lovelace") übergeben
                    include_meta=include_meta
                )
            # *** ENDE NEU ***
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
            # *** NEU: Delegation an den CardanoParser ***
            elif blockchain == "ada":
               return self._ada_parser._parse_transaction(raw_data) # <-- Delegation
            # *** ENDE NEU ***
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

    # *** NEU: Methode zur Extraktion des Token-Identifier aus einer Transaktion ***
    # *** Diese Methode ist entscheidend fuer die Logik in transaction_routes.py ***
    def _get_token_identifier_from_transaction(self, blockchain: str, tx_data: dict) -> Optional[str]:
        """
        Extrahiert den Token-Identifier aus den Rohdaten einer Transaktion.
        Delegiert an die spezifischen Parser.
        Für Cardano: Gibt die 'unit' (PolicyID + AssetName Hex) oder 'lovelace' zurück.
        """
        logger.debug(f"BlockchainParser: _get_token_identifier_from_transaction aufgerufen fuer Blockchain '{blockchain}'")
        try:
            if blockchain == "sol":
                return self._sol_parser._get_token_identifier_from_transaction(tx_data)
            elif blockchain == "btc":
                # BTC hat keinen Token-Identifier im selben Sinne, ggf. None oder spezieller Wert
                # Fuer BTC ist diese Methode weniger relevant, da es keine Token gibt.
                # Wir koennten None zurueckgeben oder einen Standardwert.
                logger.debug("BTC: Kein Token-Identifier, gebe None zurueck.")
                return None # Oder "BTC" oder aehnlich, je nach Logik in transaction_routes
            elif blockchain == "eth":
                # ETH (ohne ERC20) hat auch keinen Token-Identifier im selben Sinne.
                # Fuer native ETH, koennten wir "ETH" zurueckgeben.
                # Diese Methode ist hauptsaechlich fuer Token relevant.
                logger.debug("ETH (native): Kein Token-Identifier, gebe None zurueck.")
                return None # Oder "ETH", je nach Bedarf
            # *** NEU: Delegation an den CardanoParser ***
            elif blockchain == "ada":
                # Der CardanoParser extrahiert die 'unit' (PolicyID+AssetName) oder 'lovelace'
                return self._ada_parser._get_token_identifier_from_transaction(tx_data) # <-- Delegation
            # *** ENDE NEU ***
            else:
                logger.error(f"BlockchainParser: Nicht unterstuetzte Blockchain '{blockchain}' fuer _get_token_identifier_from_transaction")
                return None
        except Exception as e:
            logger.error(f"BlockchainParser: Fehler in _get_token_identifier_from_transaction fuer Blockchain '{blockchain}': {e}", exc_info=True)
            # Fallback je nach Blockchain oder allgemein None
            # Fuer Cardano waere ein Fallback auf 'lovelace' sinnvoll, falls Extraktion fehlschlaegt.
            if blockchain == "ada":
                 logger.warning("Cardano Token-Identifier-Extraktion fehlgeschlagen, Fallback auf 'lovelace'.")
                 return "lovelace"
            return None

    # *** NEU: Methode zur Extraktion des Token-Identifier aus einer Anfrage (z.B. vom Frontend) ***
    # *** Diese Methode kann helfen, den Identifier aus benutzerdefinierten Eingaben zu verarbeiten ***
    # def _get_token_identifier_from_request(self, blockchain: str, request_data: dict) -> Optional[str]:
    #     """
    #     Extrahiert oder verarbeitet den Token-Identifier aus den Request-Daten.
    #     Kann z.B. benutzt werden, um einen vom User eingegebenen Asset-Namen in eine 'unit' umzuwandeln.
    #     """
    #     # Implementierung abhaengig von der Struktur der Request-Daten und der Blockchain
    #     # Fuer Cardano koennte dies das Parsen einer PolicyID und eines Asset-Namens aus dem Request beinhalten
    #     # und diese dann zu einer 'unit' zusammenfuegen.
    #     pass # Platzhalter
