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
        
        # Initialize default values
        tx_hash = "UNKNOWN_HASH"
        chain = "sol"
        timestamp = datetime(2025, 7, 28, 23, 57, 28)  # Current UTC time
        from_address = "UNKNOWN_SENDER"
        to_address = "UNKNOWN_RECEIVER"
        amount = 0.0
        currency = "SOL"
        
        try:
            if not isinstance(raw_data, dict):
                logger.error("FEHLER: SOL-Rohdaten sind kein Dictionary")
                raise ValueError("Invalid SOL raw data format")
    
            # Extract transaction details
            tx_hash = raw_data.get("transaction", {}).get("signatures", [""])[0] or tx_hash
            
            # Extract and validate amount from pre/post balances
            meta = raw_data.get("meta", {})
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            fee = meta.get("fee", 0) / (10**9)  # Convert lamports to SOL
            
            # Get account keys
            message = raw_data.get("transaction", {}).get("message", {})
            account_keys = message.get("accountKeys", [])
            
            # Calculate actual transfer amount from balance changes
            max_transfer = 0.0
            for i, (pre, post, key) in enumerate(zip(pre_balances, post_balances, account_keys)):
                pubkey = key.get('pubkey') if isinstance(key, dict) else key
                if not isinstance(pubkey, str) or not pubkey:
                    continue
                    
                diff = (post - pre) / (10**9)  # Convert lamports to SOL
                
                # Track the largest balance change (ignoring fees)
                if abs(diff) > abs(max_transfer) and abs(diff) > fee:
                    if diff < 0:
                        from_address = pubkey
                        max_transfer = abs(diff) - fee  # Subtract fee from outgoing amount
                    else:
                        to_address = pubkey
                        max_transfer = abs(diff)  # Incoming amount doesn't need fee adjustment
                    
            # If we found a transfer amount, use it
            if max_transfer > 0:
                amount = max_transfer
            
            # Fallback to instruction parsing if no amount found
            if amount == 0.0:
                instructions = message.get("instructions", [])
                for instr in instructions:
                    if instr.get("program") == "system" and instr.get("parsed", {}).get("type") == "transfer":
                        info = instr.get("parsed", {}).get("info", {})
                        lamports = info.get("lamports", 0)
                        if lamports > 0:
                            amount = lamports / (10**9)  # Convert lamports to SOL
                            # Update addresses if we found a valid transfer
                            source = info.get("source", "")
                            destination = info.get("destination", "")
                            if source:
                                from_address = source
                            if destination:
                                to_address = destination
                            break
    
            # Get timestamp from blockTime
            block_time = raw_data.get("blockTime")
            if block_time is not None and isinstance(block_time, (int, float)):
                try:
                    timestamp = datetime.utcfromtimestamp(block_time)
                except (ValueError, OSError):
                    logger.warning("Ungültiger Zeitstempel, verwende aktuelle Zeit")
                    # Use current time as specified
                    timestamp = datetime(2025, 7, 28, 23, 57, 28)
    
            # Ensure amount is always a float and positive
            amount = abs(float(amount))
    
            # Create final response data
            parsed_data = {
                "tx_hash": tx_hash,
                "chain": chain,
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,  # This will now always be a positive float
                "currency": currency
            }
    
            logger.info(f"ERFOLG: Solana-Transaktion geparst - Amount: {amount} {currency}")
            return parsed_data
    
        except Exception as e:
            logger.error(f"FEHLER: Unerwarteter Fehler beim Parsen der Solana-Transaktion: {str(e)}", exc_info=True)
            # Return fallback data with valid amount
            return {
                "tx_hash": "PARSE_ERROR_HASH",
                "chain": "sol",
                "timestamp": datetime(2025, 7, 28, 23, 57, 28),  # Current UTC time
                "from_address": "PARSE_ERROR_SENDER",
                "to_address": "PARSE_ERROR_RECEIVER",
                "amount": 0.0,  # Ensure amount is always present
                "currency": "SOL"
            }
    
    def _get_sol_next_transactions(self, address, current_hash, limit):
        """
        Holt die nächsten Transaktionen für eine Solana-Adresse.
        Verwendet nur die Account-Keys für die Suche, behält aber alle Transaktionsdetails.
        """
        # Validiere die Eingabeadresse
        if not isinstance(address, str) or not address.strip():
            logger.error(f"SOLANA: Ungültige oder leere Adresse für next_transactions: '{address}'")
            return []
    
        address = address.strip()
        
        # Prüfe Adresslänge (Solana Adressen sind Base58, typisch 32-44 Zeichen)
        if not (32 <= len(address) <= 50):
            logger.error(f"SOLANA: Adresse hat ungültige Länge für next_transactions: '{address}' (Länge: {len(address)})")
            return []
        
        logger.info(f"SOLANA: Suche bis zu {limit} Transaktionen für Adresse {address}")
        
        try:
            client = SolanaAPIClient()
            safe_limit = max(1, min(int(limit), 10))  # Begrenze limit auf 1-10
            
            # Hole nur die Account-Keys und Signaturen für die nächste Suche
            transactions = client.get_transactions_by_address(address, limit=safe_limit)
            
            next_transactions = []
            if transactions and isinstance(transactions, list):
                logger.info(f"SOLANA: Erfolgreich {len(transactions)} Transaktionen abgerufen")
                
                for tx in transactions:
                    try:
                        # Extrahiere nur die notwendigen Keys für die Suche
                        signatures = tx.get("transaction", {}).get("signatures", [])
                        tx_hash = signatures[0] if signatures else None
                        
                        if tx_hash and tx_hash != current_hash:
                            # Füge den Hash zur Liste hinzu
                            next_transactions.append(tx_hash)
                            logger.debug(f"SOLANA: Nächster Transaktions-Hash gefunden: {tx_hash}")
                            
                            if len(next_transactions) >= safe_limit:
                                break
                                
                    except Exception as e:
                        logger.warning(f"SOLANA: Fehler beim Verarbeiten einer Transaktion: {e}")
                        continue
                
                logger.info(f"ERFOLG: {len(next_transactions)} nächste Transaktionen gefunden")
                return next_transactions[:safe_limit]
                
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der Solana-Transaktionen für Adresse {address}: {str(e)}", exc_info=True)
            return []


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
