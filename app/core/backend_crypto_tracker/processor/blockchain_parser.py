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

    # Methode zur Extraktion des Token-Identifiers aus einer Transaktion (delegiert)
    def get_token_identifier_from_transaction(self, blockchain: str, tx: dict):
        """
        Extrahiert den Token-Identifier aus einer Transaktion.
        Delegiert an den SolanaParser (für SOL).
        Für andere Blockchains könnte man ähnliche Methoden in deren Parsern implementieren.
        """
        if blockchain == "sol":
             return self._sol_parser._get_token_identifier_from_transaction(tx)
        # Für BTC/ETH könnte man hier auch delegieren oder None zurückgeben
        # Da die aktuelle Logik in _get_token_identifier_from_transaction ist,
        # und diese Methode dort war, fügen wir sie hier hinzu.
        # Bessere Lösung wäre, sie in die jeweiligen Parser zu verschieben.
        # Aber gemäß Anweisung: "funktionen die ausdrücklich nur für die verarbeitung da sind"
        # gehören in die spezifischen Parser. Diese Methode *ruft* Verarbeitung auf.
        # Also bleibt sie hier und delegiert.
        logger.warning(f"get_token_identifier_from_transaction für Blockchain '{blockchain}' nicht implementiert oder delegiert.")
        return None # Oder eine Standard-Implementierung hier, wenn nötig.
        # Um die Funktionalität zu erhalten, könnten wir den Code aus der alten Methode hierher kopieren
        # und anpassen, um ihn für alle Blockchains zu nutzen, oder ihn in die jeweiligen Parser verschieben.
        # Gemäß der Anweisung, dass diese Methode "nur für die Verarbeitung" ist, sollte sie besser
        # in den SolanaParser wandern. Hier bleibt sie als Delegator.
        # Um die Funktionalität zu bewahren, ohne sie zu duplizieren, verschieben wir sie.

# Hinweis: Die Methode `_get_token_identifier_from_transaction` aus der ursprünglichen Datei
# sollte in `solana_parser.py` verschoben werden. Da sie stark Solana-spezifisch ist,
# gehört sie dorthin. Die Methode `get_token_identifier_from_transaction` in *dieser* Datei
# dient nur als Delegator.
# Um dies konsistent zu halten, entfernen wir sie hier und implementieren sie in `solana_parser.py`.
# Die Methode `get_token_identifier_from_transaction` in *dieser* Datei
# dient nur als Delegator.
# Um dies konsistent zu halten, entfernen wir sie hier und implementieren sie in `solana_parser.py`.
# Da dies eine Verarbeitungsfunktion ist, gehört sie in den spezifischen Parser.
