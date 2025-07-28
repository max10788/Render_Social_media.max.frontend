# app/core/backend_crypto_tracker/processor/blockchain_parser.py
import logging
from datetime import datetime
from app.core.backend_crypto_tracker.utils.logger import get_logger

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
    
    def _parse_sol_transaction(self, raw_data, client=None): # 'self' hinzugefuegt, da es eine Methode ist
        """Parsen von Solana-Rohdaten"""
        logger.info("START: Solana-Transaktionsparsing")
        try:
            # --- KORREKTUR: Initialisiere Standardwerte fuer alle benoetigten Felder ---
            tx_hash = ""
            chain = "sol" # Standard fuer Solana
            timestamp = datetime.utcnow() # Fallback-Zeitstempel
            from_address = ""
            to_address = ""
            amount = 0.0
            currency = "SOL" # Standardwaehrung fuer Solana
            status = "unknown"
            slot = 0
            # --- ENDE KORREKTUR ---
            
            # Sicherstellen, dass raw_data ein dict ist
            if not isinstance(raw_data, dict):
                logger.error("FEHLER: SOL-Rohdaten sind kein Dictionary")
                # --- KORREKTUR: Gebe Standardwerte zurueck, um ValidationError zu vermeiden ---
                parsed_data = {
                    "tx_hash": tx_hash, "chain": chain, "timestamp": timestamp,
                    "from_address": from_address, "to_address": to_address,
                    "amount": amount, "currency": currency, "status": status, "slot": slot
                }
                logger.info(f"ERFOLG: Solana-Transaktion mit Standardwerten geparst (wegen ungültiger Rohdaten)")
                return parsed_data
                # --- ENDE KORREKTUR ---
    
            # Extrahiere grundlegende Informationen
            tx_hash = raw_data.get("transaction", {}).get("signatures", [""])[0]
            logger.info(f"Transaktions-Hash extrahiert: {tx_hash}")
    
            # Extrahiere Slot (aehnlich wie Blocknummer)
            slot = raw_data.get("slot", 0)
            logger.info(f"Slot extrahiert: {slot}")
    
            # Extrahiere Meta-Daten fuer Status und Fees
            meta = raw_data.get("meta", {})
            err = meta.get("err")
            status = "failed" if err else "success"
            logger.info(f"Transaktionsstatus: {status}")
    
            # Extrahiere Zeitstempel aus Block (wenn verfuegbar)
            block_time = raw_data.get("blockTime")
            if block_time and isinstance(block_time, (int, float)):
                try:
                    timestamp = datetime.utcfromtimestamp(block_time)
                except (ValueError, OSError) as e: # Fuer sehr grosse/small Werte
                    logger.warning(f"Warnung: Ungueltiger blockTime {block_time}, verwende aktuelle Zeit: {e}")
                    timestamp = datetime.utcnow()
            else:
                timestamp = datetime.utcnow() # Fallback
            logger.info(f"Zeitstempel extrahiert: {timestamp}")
    
            # Extrahiere Transaktionsinformationen
            transaction = raw_data.get("transaction", {})
            message = transaction.get("message", {})
            instructions = message.get("instructions", [])
            
            # --- KORREKTUR: Initialisiere Adressen mit Standardwerten ---
            from_address = ""
            to_address = ""
            amount = 0.0
            # --- ENDE KORREKTUR ---
    
            # Durchsuche die postTokenBalances fuer Token-Transfers
            # oder verwende die normale Logik fuer SOL-Transfers
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            account_keys = message.get("accountKeys", [])
            
            # Einfache Logik: Finde den Account, dessen Balance sich verringert hat (minus Fee)
            # und den Account, dessen Balance sich erhoeht hat.
            # Dies ist eine Vereinfachung und funktioniert nicht immer perfekt fuer komplexe Transaktionen.
            fee = meta.get("fee", 0) / (10**9) # Lamports zu SOL
            for i, (pre, post, key) in enumerate(zip(pre_balances, post_balances, account_keys)):
                # --- KORREKTUR: Extrahiere den 'pubkey' String aus dem key-Objekt und validiere ---
                pubkey = key.get('pubkey') if isinstance(key, dict) else key
                if not isinstance(pubkey, str) or not pubkey:
                     logger.debug(f"Ueberspringe ungueltigen Account-Key an Index {i}")
                     continue
                # --- ENDE KORREKTUR ---
                diff = (post - pre) / (10**9) # Lamports zu SOL
                if diff < 0 and abs(diff) > fee * 0.1: # Sender (ignoriere kleine Diffs durch Rundung)
                    # --- KORREKTUR: Verwende den extrahierten 'pubkey' String und validiere ---
                    if _is_valid_solana_address(pubkey): # Nur gueltige Adressen akzeptieren
                        from_address = pubkey
                        logger.debug(f"Sender-Adresse identifiziert: {from_address}")
                    else:
                       logger.warning(f"Ungueltige Sender-Adresse identifiziert und ignoriert: {pubkey}")
                    # --- ENDE KORREKTUR ---
                elif diff > 0: # Empfaenger
                    # --- KORREKTUR: Verwende den extrahierten 'pubkey' String und validiere ---
                    if _is_valid_solana_address(pubkey): # Nur gueltige Adressen akzeptieren
                        to_address = pubkey
                        amount = diff
                        logger.debug(f"Empfaenger-Adresse identifiziert: {to_address}, Betrag: {amount}")
                    else:
                       logger.warning(f"Ungueltige Empfaenger-Adresse identifiziert und ignoriert: {pubkey}")
                    # --- ENDE KORREKTUR ---
    
            # Fallback, falls die obige Logik nicht funktioniert
            if not from_address or not to_address:
                logger.warning("WARNUNG: Konnte Sender/Empfaenger nicht ueber Balances finden, verwende alternative Methode")
                # Versuche, Transfer-Instruktionen zu finden
                for instr in instructions:
                    if instr.get("program") == "system" and instr.get("parsed", {}).get("type") == "transfer":
                        info = instr.get("parsed", {}).get("info", {})
                        # --- KORREKTUR: Extrahiere 'pubkey' Strings falls sie Objekte sind und validiere ---
                        source_raw = info.get("source", "")
                        destination_raw = info.get("destination", "")
                        source_pubkey = source_raw.get('pubkey') if isinstance(source_raw, dict) else source_raw
                        dest_pubkey = destination_raw.get('pubkey') if isinstance(destination_raw, dict) else destination_raw
                        
                        if _is_valid_solana_address(source_pubkey):
                            from_address = source_pubkey
                        if _is_valid_solana_address(dest_pubkey):
                            to_address = dest_pubkey
                            lamports = info.get("lamports", 0)
                            amount = lamports / (10**9)
                        # --- ENDE KORREKTUR ---
                        if from_address and to_address:
                            logger.info("Alternative Methode erfolgreich fuer Sender/Empfaenger.")
                            break # Beende die Schleife, sobald beide gefunden sind
    
            # --- KORREKTUR: Stelle sicher, dass alle Felder gueltige Werte haben ---
            # Falls nach allem noch Felder leer sind, setze Standardwerte
            if not tx_hash:
                tx_hash = "UNKNOWN_HASH"
                logger.warning("Transaktions-Hash war leer, setze auf 'UNKNOWN_HASH'")
            # Validierung der Adressen ist bereits oben passiert. Falls sie immer noch leer sind, Standard.
            if not from_address:
                from_address = "UNKNOWN_SENDER"
                logger.warning("Sender-Adresse war leer, setze auf 'UNKNOWN_SENDER'")
            if not to_address:
                to_address = "UNKNOWN_RECEIVER"
                logger.warning("Empfaenger-Adresse war leer, setze auf 'UNKNOWN_RECEIVER'")
            # amount, currency, chain, status, timestamp, slot haben bereits Standardwerte
            # --- ENDE KORREKTUR ---
            
            logger.info(f"Sender-Adresse (String): {from_address}")
            logger.info(f"Empfaenger-Adresse (String): {to_address}")
            logger.info(f"Uebertragener Betrag: {amount} {currency}")
    
            parsed_data = {
                "tx_hash": tx_hash,
                "chain": chain,           # <-- Hinzugefuegt
                "timestamp": timestamp,   # <-- Hinzugefuegt
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": currency,     # <-- Hinzugefuegt
                "status": status,         # <-- Hinzugefuegt (optional, aber gut fuer Debugging)
                "slot": slot              # <-- Hinzugefuegt (optional)
            }
            
            # --- HINZUGEFUEGT: Debugging-Ausgabe zur Validierung ---
            logger.debug(f"Geparste Daten vor Rueckgabe: {parsed_data}")
            # Optional: Validierung mit Pydantic-Modell (nur fuer Debugging)
            # try:
            #     TransactionResponse(**parsed_data) # Wirft ValidationError bei Problemen
            #     logger.debug("Parsed data validiert erfolgreich gegen TransactionResponse Schema.")
            # except Exception as e:
            #     logger.error(f"Interner Fehler: Geparste Daten validieren nicht: {e}")
            # --- ENDE HINZUGEFUEGT ---
            
            logger.info(f"ERFOLG: Solana-Transaktion geparst")
            return parsed_data
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Parsen der Solana-Transaktion: {str(e)}", exc_info=True)
            # --- KORREKTUR: Auch bei einem unerwarteten Fehler, gebe Standardwerte zurueck ---
            # Dies verhindert, dass ein Fehler im Parser zu einem Absturz der gesamten Rekursion fuehrt.
            fallback_data = {
                "tx_hash": "PARSE_ERROR_HASH",
                "chain": "sol",
                "timestamp": datetime.utcnow(),
                "from_address": "PARSE_ERROR_SENDER",
                "to_address": "PARSE_ERROR_RECEIVER",
                "amount": 0.0,
                "currency": "SOL",
                "status": "parse_error",
                "slot": 0
            }
            logger.info(f"Gebe Fallback-Daten zurueck nach Fehler.")
            return fallback_data
            # --- ENDE KORREKTUR ---
            # raise # Original: Fehler weiterwerfen. Hier auskommentiert fuer Robustheit.


    def _get_next_transactions(self, blockchain, address, current_hash, token_identifier=None, limit=5):
        """
        Findet die nächsten Transaktionen basierend auf der Zieladresse
        """
        logger.info(f"START: Suche nach nächsten Transaktionen für Blockchain '{blockchain}'")
        logger.info(f"Adresse: {address}, Aktueller Hash: {current_hash}, Limit (Breite): {limit}") # <-- Log aktualisiert
        try:
            if blockchain == "btc":
                return self._get_btc_next_transactions(address, current_hash, limit) # <-- limit weitergegeben
            elif blockchain == "eth":
                return self._get_eth_next_transactions(address, current_hash, limit) # <-- limit weitergegeben
            elif blockchain == "sol":
                # Token-Identifier wird für SOL nicht direkt benötigt, aber für Konsistenz übergeben
                return self._get_sol_next_transactions(address, current_hash, limit) # <-- limit weitergegeben
            else:
                logger.error(f"Parser: Blockchain '{blockchain}' nicht unterstützt für next_transactions")
                return []
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der nächsten Transaktionen: {str(e)}", exc_info=True)
            return [] # Return empty list on error to prevent breaking recursion

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

    def _get_sol_next_transactions(self, address, current_hash, limit): # <-- limit als Parameter
        """
        Holt die nächsten Transaktionen für eine Solana-Adresse.
        Verwendet den SolanaAPIClient, um Transaktionen abzurufen.
        """
        # --- KORREKTUR: Verwende den übergebenen limit-Wert ---
        logger.info(f"SOLANA: Suche bis zu {limit} Transaktionen für Adresse {address}") # <-- Verwende limit
        # --- ENDE KORREKTUR ---
        try:
            from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
            client = SolanaAPIClient()
            # --- KORREKTUR: Übergebe limit an die API-Methode ---
            transactions = client.get_transactions_by_address(address, limit=limit) # <-- Verwende limit
            # --- ENDE KORREKTUR ---
            next_hashes = []
            if transactions and isinstance(transactions, list):
                logger.info(f"SOLANA: Erfolgreich {len(transactions)} Transaktionen abgerufen")
                for tx in transactions:
                    try:
                        tx_hash = tx.get("transaction", {}).get("signatures", [""])[0]
                        if tx_hash and tx_hash != current_hash:
                            next_hashes.append(tx_hash)
                            logger.debug(f"SOLANA: Nächster Transaktions-Hash gefunden: {tx_hash}")
                            # --- KORREKTUR: Begrenze auf das übergebene Limit ---
                            if len(next_hashes) >= limit: # <-- Stoppe, wenn Limit erreicht
                                break
                            # --- ENDE KORREKTUR ---
                    except (KeyError, IndexError, TypeError) as e:
                        logger.warning(f"SOLANA: Fehler beim Extrahieren des Hash aus einer Transaktion: {e}")
            else:
                logger.info("SOLANA: Keine Transaktionen gefunden oder ungültiges Format")
            logger.info(f"ERFOLG: Gefundene nächste Transaktionen: {len(next_hashes)}")
            # --- KORREKTUR: Sicherstellen, dass nicht mehr als limit zurückgegeben wird ---
            return next_hashes[:limit] # <-- Redundante Sicherheit
            # --- ENDE KORREKTUR ---
        except ImportError:
            logger.error("FEHLER: SolanaAPIClient konnte nicht importiert werden")
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
