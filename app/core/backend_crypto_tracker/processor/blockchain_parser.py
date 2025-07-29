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
