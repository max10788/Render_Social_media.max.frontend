# app/core/backend_crypto_tracker/processor/blockchain_parser.py
import logging
from datetime import datetime
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient

logger = get_logger(__name__)

class BlockchainParser:
    def __init__(self):
        logger.info("BlockchainParser: Initialisiert")

    def parse_transaction(self, blockchain, raw_data, client=None):
        """
        Zentraler Parser für Transaktionsdaten
        """
        logger.info(f"START: Parsing von Transaktionsdaten für Blockchain '{blockchain}'")
        logger.debug(f"Parser: Empfangene Rohdaten (Typ: {type(raw_data)})")
        
        try:
            if blockchain == "btc":
                return self._parse_btc_transaction(raw_data)
            elif blockchain == "eth":
                return self._parse_eth_transaction(raw_data)
            elif blockchain == "sol":
                # Übergebe den Client für mögliche zusätzliche Abfragen
                return self._parse_sol_transaction(raw_data, client)
            else:
                logger.error(f"Parser: Nicht unterstützte Blockchain '{blockchain}'")
                raise ValueError(f"Unsupported blockchain: {blockchain}")
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Parsen der Transaktion für {blockchain}: {str(e)}", exc_info=True)
            raise

    def _parse_btc_transaction(self, raw_data):
        """Parsen von Bitcoin-Rohdaten"""
        logger.info("START: Bitcoin-Transaktionsparsing")
        try:
            # Sicherstellen, dass raw_data ein dict ist
            if not isinstance(raw_data, dict):
                logger.error("FEHLER: BTC-Rohdaten sind kein Dictionary")
                raise ValueError("Invalid BTC raw data format")
            
            # Extrahiere grundlegende Informationen
            tx_hash = raw_data.get("hash", "")
            time = raw_data.get("time", 0)
            timestamp = datetime.utcfromtimestamp(time) if time else datetime.utcnow()
            
            # Extrahiere Eingänge und Ausgänge
            inputs = raw_data.get("inputs", [])
            outputs = raw_data.get("out", [])
            
            # Finde die primäre Transaktion (erster Input -> erste Output)
            from_address = ""
            to_address = ""
            amount = 0.0
            
            if inputs and len(inputs) > 0:
                from_address = inputs[0].get("prev_out", {}).get("addr", "")
            
            if outputs and len(outputs) > 0:
                # Nimm den ersten Output als Ziel
                first_output = outputs[0]
                to_address = first_output.get("addr", "")
                amount = first_output.get("value", 0) / 100000000.0  # Satoshis zu BTC
            
            logger.info(f"ERFOLG: BTC-Transaktion geparst (Hash: {tx_hash[:10]}...)")
            return {
                "tx_hash": tx_hash,
                "chain": "btc",
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": "BTC"
            }
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Parsen der BTC-Transaktion: {str(e)}", exc_info=True)
            raise

    def _parse_eth_transaction(self, raw_data):
        """Parsen von Ethereum-Rohdaten"""
        logger.info("START: Ethereum-Transaktionsparsing")
        try:
            # Sicherstellen, dass raw_data ein dict ist
            if not isinstance(raw_data, dict):
                logger.error("FEHLER: ETH-Rohdaten sind kein Dictionary")
                raise ValueError("Invalid ETH raw data format")
            
            # Extrahiere Transaktionsdetails
            result = raw_data.get("result", {})
            if not result:
                logger.error("FEHLER: Keine Transaktionsergebnisse in ETH-Daten")
                raise ValueError("No transaction result found")
            
            tx_hash = result.get("hash", "")
            from_address = result.get("from", "")
            to_address = result.get("to", "")
            timestamp_hex = result.get("timeStamp", "0x0")
            
            # Konvertiere Zeitstempel
            try:
                timestamp_int = int(timestamp_hex, 16)
                timestamp = datetime.utcfromtimestamp(timestamp_int)
            except ValueError:
                logger.warning("WARNUNG: Ungültiger Zeitstempel, verwende aktuelle Zeit")
                timestamp = datetime.utcnow()
            
            # Konvertiere Wert (Wei zu Ether)
            value_hex = result.get("value", "0x0")
            try:
                value_wei = int(value_hex, 16)
                amount = value_wei / (10 ** 18)  # Wei zu Ether
            except ValueError:
                logger.warning("WARNUNG: Ungültiger Wert, setze auf 0")
                amount = 0.0
            
            logger.info(f"ERFOLG: ETH-Transaktion geparst (Hash: {tx_hash[:10]}...)")
            return {
                "tx_hash": tx_hash,
                "chain": "eth",
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": "ETH"
            }
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Parsen der ETH-Transaktion: {str(e)}", exc_info=True)
            raise

    def _is_valid_solana_address(address_str):
        """Prueft grob, ob ein String eine gueltige Solana-Adresse zu sein scheint."""
        if not isinstance(address_str, str):
            return False
        # Solana Adressen sind Base58-codiert und haben typischerweise 32-44 Zeichen
        # Dies ist eine sehr grobe Pruefung. Eine vollstaendige Validierung waere komplexer.
        return 32 <= len(address_str) <= 50 and address_str.isalnum() # Base58 ist alphanumerisch
    # --- ENDE HINZUGEFUEGT ---

    def _parse_sol_transaction(self, raw_data, client=None):
        """Parsen von Solana-Rohdaten mit verbesserter Empfänger-Erkennung"""
        logger.info("START: Solana-Transaktionsparsing")
        
        # Initialize default values
        tx_hash = "UNKNOWN_HASH"
        chain = "sol"
        timestamp = datetime(2025, 7, 29, 14, 20, 13)  # Aktueller UTC Zeitstempel
        from_address = "UNKNOWN_SENDER"
        to_address = "UNKNOWN_RECEIVER"
        amount = 0.0
        currency = "SOL"
        
        try:
            if not isinstance(raw_data, dict):
                logger.error("FEHLER: SOL-Rohdaten sind kein Dictionary")
                raise ValueError("Invalid SOL raw data format")
    
            # 1. Extrahiere Basis-Informationen
            tx_hash = raw_data.get("transaction", {}).get("signatures", [""])[0] or tx_hash
            logger.info(f"Verarbeite Transaktion: {tx_hash}")
    
            # 2. Extrahiere Meta-Daten und Message
            meta = raw_data.get("meta", {})
            message = raw_data.get("transaction", {}).get("message", {})
            
            # 3. Extrahiere Account Keys mit verbesserter Logik
            account_keys = []
            raw_keys = message.get("accountKeys", [])
            for key in raw_keys:
                if isinstance(key, dict):
                    account_keys.append(key.get("pubkey"))
                else:
                    account_keys.append(key)
            
            logger.debug(f"Gefundene Account Keys: {len(account_keys)}")
    
            # 4. Analysiere Saldenänderungen
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            fee = meta.get("fee", 0) / (10**9)
    
            # 5. Erste Methode: Finde größte Saldenänderung
            max_transfer = 0.0
            transfer_found = False
            
            for i, (pre, post, key) in enumerate(zip(pre_balances, post_balances, account_keys)):
                if not key:
                    continue
                    
                diff = (post - pre) / (10**9)
                
                # Ignoriere sehr kleine Änderungen (Gebühren etc.)
                if abs(diff) <= fee:
                    continue
    
                if diff < 0 and abs(diff) > fee:  # Sender (negative Änderung)
                    from_address = key
                    amount = abs(diff) - fee
                    transfer_found = True
                    logger.debug(f"Sender gefunden via Saldo: {key[:8]}...")
                    
                elif diff > 0:  # Empfänger (positive Änderung)
                    if abs(diff) > max_transfer:
                        to_address = key
                        max_transfer = abs(diff)
                        logger.debug(f"Potenzieller Empfänger via Saldo: {key[:8]}...")
    
            # 6. Zweite Methode: Analysiere Instructions
            if not transfer_found or to_address == "UNKNOWN_RECEIVER":
                logger.debug("Suche in Instructions nach Transfer-Details")
                instructions = message.get("instructions", [])
                
                for instr in instructions:
                    # Prüfe auf System-Programm Transfer
                    if instr.get("program") == "system" and instr.get("parsed", {}).get("type") == "transfer":
                        info = instr.get("parsed", {}).get("info", {})
                        
                        # Extrahiere Transfer-Details
                        source = info.get("source")
                        destination = info.get("destination")
                        lamports = info.get("lamports", 0)
                        
                        if source and destination and lamports:
                            from_address = source
                            to_address = destination
                            amount = lamports / (10**9)
                            transfer_found = True
                            logger.debug(f"Transfer-Details aus Instructions: {source[:8]}... -> {destination[:8]}...")
                            break
                    
                    # Prüfe auf Token-Programm Transfer
                    elif instr.get("programId") == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA":
                        # Extrahiere Token Transfer Details
                        accounts = instr.get("accounts", [])
                        if len(accounts) >= 3:  # Minimum: source, destination, token-mint
                            source_idx = accounts[0]
                            dest_idx = accounts[1]
                            
                            if source_idx < len(account_keys) and dest_idx < len(account_keys):
                                from_address = account_keys[source_idx]
                                to_address = account_keys[dest_idx]
                                transfer_found = True
                                logger.debug(f"Token-Transfer gefunden: {from_address[:8]}... -> {to_address[:8]}...")
    
            # 7. Validiere gefundene Adressen
            if not self._is_valid_solana_address(from_address):
                logger.warning(f"Ungültige Sender-Adresse gefunden: {from_address}")
                from_address = "UNKNOWN_SENDER"
                
            if not self._is_valid_solana_address(to_address):
                logger.warning(f"Ungültige Empfänger-Adresse gefunden: {to_address}")
                to_address = "UNKNOWN_RECEIVER"
    
            # 8. Setze Zeitstempel
            block_time = raw_data.get("blockTime")
            if block_time is not None and isinstance(block_time, (int, float)):
                try:
                    timestamp = datetime.utcfromtimestamp(block_time)
                except (ValueError, OSError):
                    logger.warning("Ungültiger Zeitstempel, verwende aktuelle Zeit")
                    timestamp = datetime(2025, 7, 29, 14, 20, 13)
    
            # 9. Erstelle finale Response
            parsed_data = {
                "tx_hash": tx_hash,
                "chain": chain,
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": abs(float(amount)),
                "currency": currency
            }
    
            if transfer_found:
                logger.info(f"ERFOLG: Transfer gefunden - Von: {from_address[:8]}... An: {to_address[:8]}... Betrag: {amount} {currency}")
            else:
                logger.warning("WARNUNG: Kein eindeutiger Transfer gefunden")
    
            return parsed_data
    
        except Exception as e:
            logger.error(f"FEHLER: Unerwarteter Fehler beim Parsen der Solana-Transaktion: {str(e)}", exc_info=True)
            return {
                "tx_hash": "PARSE_ERROR_HASH",
                "chain": "sol",
                "timestamp": datetime(2025, 7, 29, 14, 20, 13),
                "from_address": "PARSE_ERROR_SENDER",
                "to_address": "PARSE_ERROR_RECEIVER",
                "amount": 0.0,
                "currency": "SOL"
            }
        
    def _get_next_transactions(self, blockchain, address, current_hash, token_identifier=None, limit=5):
        """
        Findet die nächsten Transaktionen basierend auf der Zieladresse und Token
        """
        logger.info(f"START: Suche nach nächsten Transaktionen für Blockchain '{blockchain}'")
        logger.info(f"Adresse: {address}, Hash: {current_hash}, Token: {token_identifier}, Limit: {limit}")
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        logger.info(f"Zeitstempel: {timestamp}")
        
        try:
            if blockchain == "btc":
                return self._get_btc_next_transactions(address, current_hash, limit)
            elif blockchain == "eth":
                return self._get_eth_next_transactions(address, current_hash, limit)
            elif blockchain == "sol":
                return self._get_sol_next_transactions(
                    address=address,
                    current_hash=current_hash,
                    limit=limit,  # Limit kommt jetzt von der Website
                    token_identifier=token_identifier
                )
            else:
                logger.error(f"Parser: Blockchain '{blockchain}' nicht unterstützt für next_transactions")
                return []
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der nächsten Transaktionen: {str(e)}", exc_info=True)
            return []
            
    def _get_btc_next_transactions(self, address, current_hash, limit):
        """Holt nächste BTC-Transaktionen (Dummy-Implementierung)"""
        logger.info("BTC: Hole nächste Transaktionen (Dummy)")
        # In einer echten Implementierung würden wir eine API aufrufen
        return []

    def _get_eth_next_transactions(self, address, current_hash, limit):
        """Holt nächste ETH-Transaktionen (Dummy-Implementierung)"""
        logger.info("ETH: Hole nächste Transaktionen (Dummy)")
        # In einer echten Implementierung würden wir eine API aufrufen
        return []

    def _get_sol_next_transactions(self, address, current_hash, limit, token_identifier=None):
        """
        Holt die nächsten Transaktionen für eine Solana-Adresse.
        Berücksichtigt auch den Token-Identifier (Mint-Adresse) für SPL-Token Transfers.
        """
        # Validiere die Eingabeadresse
        if not isinstance(address, str) or not address.strip():
            logger.error(f"SOLANA: Ungültige oder leere Adresse für next_transactions: '{address}' (Typ: {type(address)})")
            return []
    
        address = address.strip()
        
        # Prüfe Adresslänge (Solana Adressen sind Base58, typisch 32-44 Zeichen)
        if not (32 <= len(address) <= 50):
            logger.error(f"SOLANA: Adresse hat ungültige Länge: '{address}' (Länge: {len(address)})")
            return []
        
        logger.info(f"SOLANA: Suche bis zu {limit} Transaktionen für Adresse {address}")
        if token_identifier:
            logger.info(f"SOLANA: Filtere nach Token-Identifier (Mint): {token_identifier}")
        
        try:
            client = SolanaAPIClient()
            safe_limit = max(1, min(int(limit), 10))
            
            # Hole mehr Transaktionen wenn wir nach Token filtern
            search_limit = safe_limit * 3 if token_identifier else safe_limit
            transactions = client.get_transactions_by_address(address, limit=search_limit)
            
            next_hashes = []
            if transactions and isinstance(transactions, list):
                logger.info(f"SOLANA: {len(transactions)} Transaktionen gefunden")
                
                for tx in transactions:
                    try:
                        # Extrahiere Transaktion-Hash
                        tx_signatures = tx.get("transaction", {}).get("signatures", [])
                        tx_hash = tx_signatures[0] if tx_signatures else tx.get("signature")
                        
                        if not isinstance(tx_hash, str) or tx_hash == current_hash:
                            continue
                        
                        # Token-Filter: Prüfe ob die Transaktion den gewünschten Token verwendet
                        if token_identifier:
                            tx_token = self._get_token_identifier_from_transaction("sol", tx)
                            if tx_token != token_identifier:
                                logger.debug(f"SOLANA: Überspringe Transaktion {tx_hash[:10]}... (Token nicht passend)")
                                continue
                            logger.debug(f"SOLANA: Token-Match gefunden für {tx_hash[:10]}...")
                        
                        next_hashes.append(tx_hash)
                        logger.debug(f"SOLANA: Nächster Transaktions-Hash gefunden: {tx_hash}")
                        
                        if len(next_hashes) >= safe_limit:
                            break
                            
                    except Exception as e:
                        logger.warning(f"SOLANA: Fehler beim Verarbeiten einer Transaktion: {e}")
                        continue
                        
                if token_identifier:
                    logger.info(f"SOLANA: {len(next_hashes)} von {len(transactions)} Transaktionen verwenden Token {token_identifier}")
                else:
                    logger.info(f"SOLANA: {len(next_hashes)} Transaktionen gefunden (ohne Token-Filter)")
                    
                return next_hashes[:safe_limit]
                
            else:
                if transactions is None:
                    logger.info("SOLANA: Keine Transaktionen gefunden (Ergebnis ist None)")
                elif not isinstance(transactions, list):
                    logger.warning(f"SOLANA: Unerwartetes Format für Transaktionen: {type(transactions)}")
                else:
                    logger.info("SOLANA: Keine Transaktionen gefunden")
                return []
                
        except ImportError as ie:
            logger.error(f"FEHLER: SolanaAPIClient konnte nicht importiert werden: {ie}")
            return []
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der Solana-Transaktionen: {str(e)}", exc_info=True)
            return []

    
    def _get_token_identifier_from_transaction(self, blockchain, tx):
        """Extrahiert den Token-Identifier aus einer Transaktion basierend auf der Blockchain."""
        logger.debug(f"Extrahiere Token-Identifier aus {blockchain}-Transaktion")
        
        try:
            if blockchain == "eth":
                # Für Ethereum: Token-Identifier ist die Contract-Adresse
                if "contractAddress" in tx and tx["contractAddress"] and tx["contractAddress"] != "0x":
                    token_id = tx["contractAddress"].lower()
                    logger.debug(f"Ethereum Token-Identifier extrahiert: {token_id}")
                    return token_id
                else:
                    logger.debug("Native ETH-Transaktion gefunden, verwende 'ETH' als Token-Identifier")
                    return "ETH"
            
            elif blockchain == "sol":
                # Für Solana: Token-Identifier ist die Mint-Adresse
                if "transaction" in tx and "message" in tx["transaction"] and "instructions" in tx["transaction"]["message"]:
                    for instruction in tx["transaction"]["message"]["instructions"]:
                        # Token-Programm-ID Index (normalerweise 4 in Solana)
                        if "programIdIndex" in instruction and instruction["programIdIndex"] == 4:
                            # Token-Übertragung
                            if "accounts" in instruction and len(instruction["accounts"]) >= 3:
                                account_keys = []
                                for key in tx["transaction"]["message"]["accountKeys"]:
                                    if isinstance(key, dict):
                                        account_keys.append(key["pubkey"])
                                    else:
                                        account_keys.append(key)
                                
                                mint_index = instruction["accounts"][1]
                                if mint_index < len(account_keys):
                                    mint_address = account_keys[mint_index]
                                    logger.debug(f"Solana Token-Identifier (Mint-Adresse) extrahiert: {mint_address}")
                                    return mint_address
                
                # Standard: SOL
                logger.debug("Keine Token-Transaktion gefunden, verwende SOL als Standard")
                return "So11111111111111111111111111111111111111112"
            
            elif blockchain == "btc":
                # Für Bitcoin gibt es keinen Token-Identifier (nur BTC)
                logger.debug("Bitcoin hat keinen Token-Identifier, verwende 'BTC' als Standard")
                return "BTC"
            
            else:
                logger.error(f"Ungültige Blockchain für Token-Identifier-Extraktion: {blockchain}")
                return None
        
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion des Token-Identifiers: {str(e)}", exc_info=True)
            # Bei Fehlern verwende Standard-Identifier
            if blockchain == "eth":
                return "ETH"
            elif blockchain == "sol":
                return "So11111111111111111111111111111111111111112"
            else:
                return "BTC"
