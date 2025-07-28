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
        """Parsen von Solana-Rohdaten"""
        logger.info("START: Solana-Transaktionsparsing")
        
        # --- KORREKTUR: Initialisiere Standardwerte fuer alle benoetigten Felder ---
        # Diese Standardwerte verhindern ValidationError, falls Felder nicht gefunden werden
        tx_hash = "UNKNOWN_HASH"
        chain = "sol" # Standard fuer Solana
        # Standard-Zeitstempel, falls keiner aus den Daten extrahiert werden kann
        timestamp = datetime.utcnow() 
        from_address = "UNKNOWN_SENDER"
        to_address = "UNKNOWN_RECEIVER"
        amount = 0.0
        currency = "SOL" # Standardwaehrung fuer Solana
        status = "unknown"
        slot = 0
        # --- ENDE KORREKTUR ---
    
        try:
            # Sicherstellen, dass raw_data ein dict ist
            if not isinstance(raw_data, dict):
                logger.error("FEHLER: SOL-Rohdaten sind kein Dictionary")
                # --- KORREKTUR: Gebe Standardwerte zurueck, um ValidationError zu vermeiden ---
                # Ein leeres raw_data fuehrt nicht mehr zu einem Absturz
                # --- ENDE KORREKTUR ---
                # Die Standardwerte von oben werden verwendet
            else:
                # Extrahiere grundlegende Informationen, falls raw_data gueltig ist
                tx_hash_candidate = raw_data.get("transaction", {}).get("signatures", [""])[0]
                if tx_hash_candidate: # Nur ueberschreiben, wenn ein gueltiger Hash gefunden wurde
                    tx_hash = tx_hash_candidate
                logger.info(f"Transaktions-Hash extrahiert: {tx_hash}")
    
                # Extrahiere Slot (aehnlich wie Blocknummer)
                slot_candidate = raw_data.get("slot", 0)
                if isinstance(slot_candidate, int):
                    slot = slot_candidate
                logger.info(f"Slot extrahiert: {slot}")
    
                # Extrahiere Meta-Daten fuer Status und Fees
                meta = raw_data.get("meta", {})
                err = meta.get("err")
                status = "failed" if err else "success"
                logger.info(f"Transaktionsstatus: {status}")
    
                # Extrahiere Zeitstempel aus Block (wenn verfuegbar)
                block_time = raw_data.get("blockTime")
                if block_time is not None and isinstance(block_time, (int, float)):
                    try:
                        # Verwende utcfromtimestamp mit Fehlerbehandlung fuer extreme Werte
                        timestamp_candidate = datetime.utcfromtimestamp(block_time) 
                        # Grobe Pruefung, ob der Zeitstempel sinnvoll ist (zwischen 2020 und 2030)
                        if datetime(2020, 1, 1) <= timestamp_candidate <= datetime(2030, 12, 31):
                            timestamp = timestamp_candidate
                            logger.info(f"Zeitstempel extrahiert: {timestamp}")
                        else:
                            logger.warning(f"Warnung: Zeitstempel aus Blocktime {block_time} ({timestamp_candidate}) scheint ungueltig, verwende aktuelle Zeit.")
                    except (ValueError, OSError) as e:
                        logger.warning(f"Warnung: Konnte Zeitstempel aus blockTime {block_time} nicht konvertieren: {e}. Verwende aktuelle Zeit.")
                else:
                     logger.info("Kein gueltiger blockTime gefunden, verwende aktuelle Zeit als Fallback.")
    
                # Extrahiere Transaktionsinformationen
                transaction = raw_data.get("transaction", {})
                message = transaction.get("message", {})
                instructions = message.get("instructions", [])
                
                # --- KORREKTUR: Initialisiere Adressen mit Standardwerten ---
                # from_address und to_address sind bereits mit Standardwerten initialisiert
                # amount ist bereits mit 0.0 initialisiert
                # --- ENDE KORREKTUR ---
    
                # Durchsuche die postTokenBalances fuer Token-Transfers
                # oder verwende die normale Logik fuer SOL-Transfers
                pre_balances = meta.get("preBalances", [])
                post_balances = meta.get("postBalances", [])
                account_keys = message.get("accountKeys", [])
                
                # Einfache Logik: Finde den Account, dessen Balance sich verringert hat (minus Fee)
                # und den Account, dessen Balance sich erhoeht hat.
                fee = meta.get("fee", 0) / (10**9) # Lamports zu SOL
                for i, (pre, post, key) in enumerate(zip(pre_balances, post_balances, account_keys)):
                    # --- KORREKTUR: Extrahiere den 'pubkey' String aus dem key-Objekt ---
                    # Stelle sicher, dass key ein dict ist, bevor .get('pubkey') aufgerufen wird
                    pubkey = key.get('pubkey') if isinstance(key, dict) else key
                    # Pruefe, ob pubkey ein nicht-leerer String ist
                    if not isinstance(pubkey, str) or not pubkey:
                         logger.debug(f"Ueberspringe ungueltigen Account-Key an Index {i}: {key}")
                         continue
                    # --- ENDE KORREKTUR ---
                    
                    diff = (post - pre) / (10**9) # Lamports zu SOL
                    
                    # --- KORREKTUR: Robustere Bedingungen fuer Sender/Empfaenger ---
                    # Verwende die Standardwerte nur, wenn noch keine gueltige Adresse gefunden wurde
                    if diff < 0 and abs(diff) > fee * 0.01 and from_address == "UNKNOWN_SENDER": # Sender (Lockerere Bedingung)
                        from_address = pubkey
                        logger.debug(f"Sender-Adresse identifiziert: {from_address}")
                    elif diff > 0 and to_address == "UNKNOWN_RECEIVER": # Empfaenger
                        to_address = pubkey
                        amount = diff
                        logger.debug(f"Empfaenger-Adresse identifiziert: {to_address}, Betrag: {amount}")
                    # --- ENDE KORREKTUR ---
    
                # Fallback, falls die obige Logik nicht funktioniert hat
                # Versuche, Transfer-Instruktionen zu finden, nur wenn Adressen noch Standard sind
                if from_address == "UNKNOWN_SENDER" or to_address == "UNKNOWN_RECEIVER":
                    logger.warning("WARNUNG: Konnte Sender/Empfaenger nicht ueber Balances finden oder unvollstaendig, verwende alternative Methode")
                    for instr in instructions:
                        if instr.get("program") == "system" and instr.get("parsed", {}).get("type") == "transfer":
                            info = instr.get("parsed", {}).get("info", {})
                            # --- KORREKTUR: Extrahiere 'pubkey' Strings falls sie Objekte sind ---
                            # Stelle sicher, dass source/destination dicts sind, bevor .get('pubkey') aufgerufen wird
                            source_raw = info.get("source", "")
                            destination_raw = info.get("destination", "")
                            source_pubkey = source_raw.get('pubkey') if isinstance(source_raw, dict) else source_raw
                            dest_pubkey = destination_raw.get('pubkey') if isinstance(destination_raw, dict) else destination_raw
                            
                            # Pruefe und setze Sender, falls noch nicht gefunden
                            if from_address == "UNKNOWN_SENDER" and isinstance(source_pubkey, str) and source_pubkey:
                                from_address = source_pubkey
                                logger.info(f"Sender-Adresse aus Transfer-Instruktion: {from_address}")
                            
                            # Pruefe und setze Empfaenger und Betrag, falls noch nicht gefunden
                            if to_address == "UNKNOWN_RECEIVER" and isinstance(dest_pubkey, str) and dest_pubkey:
                                to_address = dest_pubkey
                                lamports = info.get("lamports", 0)
                                amount = lamports / (10**9)
                                logger.info(f"Empfaenger-Adresse aus Transfer-Instruktion: {to_address}, Betrag: {amount}")
                            # --- ENDE KORREKTUR ---
                            
                            # Beende die Schleife, sobald beide Adressen gefunden wurden (oder zumindest eine)
                            # Je nach Logik koennte man hier auch nur brechen, wenn beide gefunden wurden.
                            if from_address != "UNKNOWN_SENDER" and to_address != "UNKNOWN_RECEIVER":
                                logger.info("Alternative Methode erfolgreich fuer Sender und Empfaenger.")
                                break
                            elif from_address != "UNKNOWN_SENDER" or to_address != "UNKNOWN_RECEIVER":
                                 logger.info("Alternative Methode teilweise erfolgreich.")
    
            # --- KORREKTUR: Stelle sicher, dass alle Felder gueltige Werte haben ---
            # Die Standardwerte dienen als Fallback. Logge die endgueltigen Werte.
            logger.info(f"Sender-Adresse (final): {from_address}")
            logger.info(f"Empfaenger-Adresse (final): {to_address}")
            logger.info(f"Uebertragener Betrag (final): {amount} {currency}")
            logger.info(f"Transaktions-Hash (final): {tx_hash}")
            logger.info(f"Zeitstempel (final): {timestamp}")
            logger.info(f"Chain (final): {chain}")
            logger.info(f"Waehrung (final): {currency}")
            # --- ENDE KORREKTUR ---
            
            parsed_data = {
                "tx_hash": tx_hash,
                "chain": chain,
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": currency,
                # Optional: Fuege andere Felder hinzu, wenn sie vom TransactionResponse-Schema benoetigt werden
                # "status": status,
                # "slot": slot
            }
            
            logger.info(f"ERFOLG: Solana-Transaktion geparst")
            logger.debug(f"Geparste Daten: {parsed_data}") # Fuer detailliertere Fehlersuche
            return parsed_data
            
        except Exception as e:
            logger.error(f"FEHLER: Unerwarteter Fehler beim Parsen der Solana-Transaktion: {str(e)}", exc_info=True)
            # --- KORREKTUR: Auch bei einem unerwarteten Fehler, gebe sichere Standardwerte zurueck ---
            # Dies ist entscheidend, um die gesamte Rekursion nicht durch einen Parser-Fehler zu brechen.
            fallback_data = {
                "tx_hash": "PARSE_ERROR_HASH",
                "chain": "sol",
                "timestamp": datetime.utcnow(),
                "from_address": "PARSE_ERROR_SENDER",
                "to_address": "PARSE_ERROR_RECEIVER",
                "amount": 0.0,
                "currency": "SOL",
                # "status": "parse_error",
                # "slot": 0
            }
            logger.info(f"Gebe Fallback-Daten nach unerwartetem Fehler zurueck.")
            return fallback_data
            # --- ENDE KORREKTUR ---


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

    def _get_sol_next_transactions(self, address, current_hash, limit):
        """
        Holt die naechsten Transaktionen fuer eine Solana-Adresse.
        Verwendet den SolanaAPIClient, um Transaktionen abzurufen.
        """
        # --- KORREKTUR: Validiere die Eingabeadresse grundsaetzlich ---
        # Pruefe, ob die Adresse ein nicht-leerer String ist.
        if not isinstance(address, str) or not address.strip():
            logger.error(f"SOLANA: Ungueltige oder leere Adresse fuer next_transactions: '{address}' (Typ: {type(address)})")
            return [] # Gib eine leere Liste zurueck, um Fehler zu vermeiden
        # Entferne fuehrende/abschliessende Leerzeichen
        address = address.strip() 
        
        # Grobe Pruefung der Adresslaenge (Solana Adressen sind Base58, typisch 32-44 Zeichen)
        # Dies verhindert den 'WrongSize'-Fehler bei offensichtlich falschen Adressen.
        if not (32 <= len(address) <= 50):
             logger.error(f"SOLANA: Adresse hat ungültige Länge fuer next_transactions: '{address}' (Laenge: {len(address)})")
             return []
        # --- ENDE KORREKTUR ---
        
        logger.info(f"SOLANA: Suche bis zu {limit} Transaktionen fuer Adresse {address}")
        try:
            client = SolanaAPIClient()
            # --- KORREKTUR: Uebergabe des limit-Parameters ---
            # Stelle sicher, dass limit eine positive Ganzzahl ist
            safe_limit = max(1, min(int(limit), 10)) # Beispiel: Begrenze limit auf 1-10
            transactions = client.get_transactions_by_address(address, limit=safe_limit)
            # --- ENDE KORREKTUR ---
            
            next_hashes = []
            if transactions and isinstance(transactions, list):
                logger.info(f"SOLANA: Erfolgreich {len(transactions)} Transaktionen abgerufen")
                for tx in transactions:
                    try:
                        # --- KORREKTUR: Robustere Extraktion des Hash ---
                        # Gehe sicherer mit der Struktur der Transaktionsdaten um.
                        tx_signatures = tx.get("transaction", {}).get("signatures", [])
                        if tx_signatures and isinstance(tx_signatures, list):
                            tx_hash = tx_signatures[0] # Nimm den ersten Signature
                        else:
                             # Fallback, falls 'signatures' nicht da ist oder leer
                             tx_hash = tx.get("signature") # Manche APIs geben es auch so
                             
                        # Pruefe, ob tx_hash ein gueltiger String ist und nicht der aktuelle Hash
                        if isinstance(tx_hash, str) and tx_hash and tx_hash != current_hash:
                            next_hashes.append(tx_hash)
                            logger.debug(f"SOLANA: Naechster Transaktions-Hash gefunden: {tx_hash}")
                            # --- KORREKTUR: Begrenze auf das uebergebene Limit ---
                            if len(next_hashes) >= safe_limit:
                                break
                            # --- ENDE KORREKTUR ---
                        else:
                           if tx_hash:
                               logger.debug(f"SOLANA: Ueberspringe Transaktion mit Hash {tx_hash} (gleich aktueller Hash oder ungueltig)")
                           else:
                               logger.debug(f"SOLANA: Ueberspringe Transaktion, da kein gueltiger Hash gefunden wurde.")
                    except (KeyError, IndexError, TypeError, AttributeError) as e:
                        # AttributeError hinzugefuegt fuer den Fall, dass tx.get() None zurueckgibt
                        logger.warning(f"SOLANA: Fehler beim Extrahieren des Hash aus einer Transaktion (Struktur moeglicherweise unerwartet): {e}")
            else:
                # Behandle den Fall, dass transactions None, leer oder kein Liste ist.
                if transactions is None:
                    logger.info("SOLANA: Keine Transaktionen gefunden (Ergebnis ist None).")
                elif not isinstance(transactions, list):
                     logger.warning(f"SOLANA: Unerwartetes Format fuer Transaktionen: {type(transactions)}")
                else: # transactions ist eine leere Liste
                    logger.info("SOLANA: Keine Transaktionen gefunden.")
                    
            logger.info(f"ERFOLG: Gefundene naechste Transaktionen: {len(next_hashes)}")
            # --- KORREKTUR: Sicherstellen, dass nicht mehr als limit zurueckgegeben wird ---
            # Redundante Sicherheit, da die Schleife bereits begrenzt.
            return next_hashes[:safe_limit] 
            # --- ENDE KORREKTUR ---
            
        except ImportError as ie:
            logger.error(f"FEHLER: SolanaAPIClient konnte nicht importiert werden: {ie}")
            return []
        except Exception as e:
            # Fangen Sie allgemeine Fehler ab, die von der API oder anderen Teilen kommen koennten
            logger.error(f"FEHLER: Fehler beim Abrufen der Solana-Transaktionen fuer Adresse {address}: {str(e)}", exc_info=True)
            return [] # Gib eine leere Liste zurueck bei jedem Fehler

    
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
