# app/core/backend_crypto_tracker/processor/blockchain_parser.py
import logging
from datetime import datetime
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient

from typing import List, Dict, Any, Optional
from fastapi.responses import JSONResponse  # Oder from starlette.responses import JSONResponse


logger = get_logger(__name__)

# Bekannte DEX- und Bridge-Programme auf Solana
KNOWN_SWAP_PROGRAMS = {
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",  # Raydium
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",  # Orca
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",   # Jupiter
}

KNOWN_BRIDGE_PROGRAMS = {
    "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",  # Wormhole
    "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5", # Allbridge
}

class BlockchainParser:
    def __init__(self):
        logger.info("BlockchainParser: Initialisiert")

    def _get_next_transactions(
        self,
        blockchain: str,
        address: str,
        current_hash: str,
        token_identifier: Optional[str] = None,
        limit: int = 5,
        include_meta: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Findet die nächsten Transaktionen basierend auf der Zieladresse und Token
        
        Args:
            blockchain (str): Die zu verwendende Blockchain ("btc", "eth" oder "sol")
            address (str): Die Zieladresse für die Suche
            current_hash (str): Der Hash der aktuellen Transaktion
            token_identifier (Optional[str]): Filter für spezifische Token-Transaktionen
            limit (int): Maximale Anzahl der zurückzugebenden Transaktionen
            include_meta (bool): Ob Metadaten in den Ergebnissen enthalten sein sollen
            
        Returns:
            List[Dict[str, Any]]: Liste der gefundenen Transaktionen
        """
        logger.info(f"START: Suche nach nächsten Transaktionen für Blockchain '{blockchain}'")
        logger.info(f"Adresse: {address}, Hash: {current_hash}, Token: {token_identifier}, "
                   f"Limit: {limit}, Include Meta: {include_meta}")
        
        try:
            if blockchain == "btc":
                return self._get_btc_next_transactions(address, current_hash, limit)
            elif blockchain == "eth":
                return self._get_eth_next_transactions(address, current_hash, limit)
            elif blockchain == "sol":
                return self._get_sol_next_transactions(
                    address=address,
                    current_hash=current_hash,
                    limit=limit,
                    token_identifier=token_identifier,
                    include_meta=include_meta  # Pass through include_meta parameter
                )
            else:
                logger.error(f"Parser: Blockchain '{blockchain}' nicht unterstützt für next_transactions")
                return []
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der nächsten Transaktionen: {str(e)}", exc_info=True)
            return []

    def _is_chain_end_transaction(self, transaction: Dict[str, Any]) -> bool:
        """
        Überprüft, ob eine Transaktion das Ende einer Verfolgungskette darstellt.
        """
        try:
            # Extrahiere Programm-IDs aus den Instruktionen
            instructions = transaction.get("transaction", {}).get("message", {}).get("instructions", [])
            account_keys = transaction.get("transaction", {}).get("message", {}).get("accountKeys", [])
            
            for instruction in instructions:
                program_idx = instruction.get("programIdIndex")
                if program_idx is not None and program_idx < len(account_keys):
                    program_id = account_keys[program_idx]
                    program_id = program_id.get("pubkey") if isinstance(program_id, dict) else program_id
                    
                    # Überprüfe auf bekannte DEX- und Bridge-Programme
                    if program_id in KNOWN_SWAP_PROGRAMS:
                        logger.info(f"Chain-End erkannt: DEX-Programm gefunden ({program_id})")
                        return True
                    if program_id in KNOWN_BRIDGE_PROGRAMS:
                        logger.info(f"Chain-End erkannt: Bridge-Programm gefunden ({program_id})")
                        return True
            
            return False
        except Exception as e:
            logger.error(f"Fehler bei der Chain-End-Erkennung: {str(e)}", exc_info=True)
            return False

    def parse_transaction(self, blockchain: str, raw_data: dict, client=None, include_meta: bool = False):
        """
        Hauptmethode zum Parsen von Transaktionsdaten fuer eine bestimmte Blockchain.
        """
        logger.debug(f"BlockchainParser: parse_transaction aufgerufen fuer Blockchain '{blockchain}'")
        try:
            if blockchain == "sol":
                # Stellen Sie sicher, dass _parse_sol_transaction die richtige Signatur hat
                return self._parse_sol_transaction(raw_data, client, include_meta)
            elif blockchain == "btc":
                # Passen Sie Parameter ggf. an
                return self._parse_btc_transaction(raw_data) 
            elif blockchain == "eth":
                # Passen Sie Parameter ggf. an
                return self._parse_eth_transaction(raw_data)
            else:
                logger.error(f"BlockchainParser: Nicht unterstuetzte Blockchain '{blockchain}'")
                return None
        except Exception as e:
            logger.error(f"BlockchainParser: Fehler in parse_transaction fuer Blockchain '{blockchain}': {e}", exc_info=True)
            return None
    
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

    def parse_transaction(self, blockchain: str, raw_data: dict, client=None, include_meta: bool = False):
        """
        Parst Solana-Transaktionsdaten und extrahiert relevante Informationen.
        
        Strategie zur Adresserkennung:
        1. Primär: Analyse der System-Program Transfer Instruktionen
        2. Sekundär: Analyse der Token-Program Transfer Instruktionen
        3. Fallback: Analyse der Saldo-Änderungen
        
        Args:
            raw_data (dict): Rohdaten der Transaktion im jsonParsed Format
            client (Optional[SolanaAPIClient]): Client für eventuelle zusätzliche Abfragen
        
        Returns:
            dict: Geparste Transaktionsdaten mit allen relevanten Informationen
        """
        logger.info("START: Solana-Transaktionsparsing")
        
        # Initialisiere Standardwerte
        parsed_data = {
            "tx_hash": "UNKNOWN_HASH",
            "chain": "sol",
            "timestamp": datetime(2025, 7, 29, 15, 11, 19),
            "from_address": None,
            "to_address": None,
            "amount": 0.0,
            "currency": "SOL"
        }
        
        try:
            # 1. Basis-Validierung
            if not isinstance(raw_data, dict):
                raise ValueError("raw_data muss ein Dictionary sein")
                
            # 2. Extrahiere Basis-Informationen
            tx = raw_data.get("transaction", {})
            meta = raw_data.get("meta", {})
            message = tx.get("message", {})
            
            # Setze Transaction Hash
            signatures = tx.get("signatures", [])
            if signatures:
                parsed_data["tx_hash"] = signatures[0]
            
            # 3. Account Keys Extraktion mit verbesserter Fehlerbehandlung
            account_keys = []
            raw_keys = message.get("accountKeys", [])
            
            for key in raw_keys:
                if isinstance(key, dict):
                    pubkey = key.get("pubkey")
                    if pubkey:
                        account_keys.append(pubkey)
                elif isinstance(key, str):
                    account_keys.append(key)
                    
            if not account_keys:
                logger.error("Keine gültigen Account Keys gefunden")
                return parsed_data
                
            logger.debug(f"Extrahierte Account Keys: {len(account_keys)}")
            
            # 4. Instruktionen Analysis (Primäre Methode)
            instructions = message.get("instructions", [])
            transfer_found = False
            
            for idx, instr in enumerate(instructions):
                # System Program Transfer
                if instr.get("program") == "system" and instr.get("parsed", {}).get("type") == "transfer":
                    transfer_info = instr.get("parsed", {}).get("info", {})
                    
                    source = transfer_info.get("source")
                    destination = transfer_info.get("destination")
                    lamports = transfer_info.get("lamports", 0)
                    
                    if source and destination and lamports:
                        parsed_data["from_address"] = source
                        parsed_data["to_address"] = destination
                        parsed_data["amount"] = lamports / 10**9
                        transfer_found = True
                        logger.info(f"System Transfer gefunden: {source[:8]}... -> {destination[:8]}...")
                        break
                        
                # Token Program Transfer
                elif instr.get("programId") == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA":
                    accounts = instr.get("accounts", [])
                    if len(accounts) >= 3:  # source, destination, mint
                        source_idx = accounts[0]
                        dest_idx = accounts[1]
                        
                        if max(source_idx, dest_idx) < len(account_keys):
                            parsed_data["from_address"] = account_keys[source_idx]
                            parsed_data["to_address"] = account_keys[dest_idx]
                            # Betrag muss separat aus Token-Amounts extrahiert werden
                            transfer_found = True
                            logger.info(f"Token Transfer gefunden: {parsed_data['from_address'][:8]}... -> {parsed_data['to_address'][:8]}...")
                            break
            
            # 5. Saldo-Analyse (Fallback Methode)
            if not transfer_found:
                logger.info("Keine Transfer-Instruktion gefunden, analysiere Salden")
                
                pre_balances = meta.get("preBalances", [])
                post_balances = meta.get("postBalances", [])
                fee = meta.get("fee", 0) / 10**9
                
                if len(pre_balances) == len(post_balances) == len(account_keys):
                    max_outflow = 0.0
                    max_inflow = 0.0
                    
                    for i, (pre, post, key) in enumerate(zip(pre_balances, post_balances, account_keys)):
                        diff = (post - pre) / 10**9
                        
                        # Ignoriere sehr kleine Änderungen (kleiner als Gebühr)
                        if abs(diff) <= fee:
                            continue
                            
                        if diff < 0 and abs(diff) > max_outflow:
                            max_outflow = abs(diff)
                            parsed_data["from_address"] = key
                            parsed_data["amount"] = max_outflow - fee
                            
                        elif diff > 0 and diff > max_inflow:
                            max_inflow = diff
                            parsed_data["to_address"] = key
                    
                    if parsed_data["from_address"] and parsed_data["to_address"]:
                        logger.info(f"Transfer via Saldo-Analyse gefunden: {parsed_data['from_address'][:8]}... -> {parsed_data['to_address'][:8]}...")
                        transfer_found = True
            
            # 6. Setze Zeitstempel
            block_time = raw_data.get("blockTime")
            if isinstance(block_time, (int, float)):
                try:
                    parsed_data["timestamp"] = datetime.utcfromtimestamp(block_time)
                except (ValueError, OSError):
                    logger.warning("Ungültiger Zeitstempel")
            
            # 7. Finale Validierung
            if not parsed_data["from_address"] or not parsed_data["to_address"]:
                logger.warning("Konnte nicht beide Adressen ermitteln")
                parsed_data["from_address"] = parsed_data["from_address"] or "UNKNOWN_SENDER"
                parsed_data["to_address"] = parsed_data["to_address"] or "UNKNOWN_RECEIVER"
            
            if not transfer_found:
                logger.warning("Kein Transfer gefunden")
                
            return parsed_data
            
        except Exception as e:
            logger.error(f"Fehler beim Parsen der Solana-Transaktion: {str(e)}", exc_info=True)
            return parsed_data
        
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

    def _get_sol_next_transactions(self, address, current_hash, limit, filter_token: Optional[str] = None):
        """
        Erweiterte Version der Solana-Transaktionsverfolgung mit Token-Filter und Chain-End-Erkennung.
        """
        # Validierung der Eingabeadresse
        if not isinstance(address, str) or not address.strip():
            logger.error(f"SOLANA: Ungültige oder leere Adresse: '{address}'")
            return []
    
        address = address.strip()
        if not (32 <= len(address) <= 50):
            logger.error(f"SOLANA: Adresse hat ungültige Länge: {len(address)}")
            return []
    
        logger.info(f"SOLANA: Suche Transaktionen für {address} (Filter: {filter_token or 'None'})")
        
        try:
            client = SolanaAPIClient()
            safe_limit = max(1, min(int(limit), 10))
            transactions = client.get_transactions_by_address(address, limit=safe_limit)
            
            next_transactions = []
            if transactions and isinstance(transactions, list):
                logger.info(f"SOLANA: Erfolgreich {len(transactions)} Transaktionen abgerufen")
                
                for tx in transactions:
                    try:
                        # Extrahiere Transaktions-Hash
                        signatures = tx.get("transaction", {}).get("signatures", [])
                        tx_hash = signatures[0] if signatures else None
                        
                        if not tx_hash or tx_hash == current_hash:
                            continue
    
                        # Token-Filter-Logik
                        if filter_token:
                            tx_token = self._get_token_identifier_from_transaction("sol", tx)
                            if tx_token != filter_token:
                                logger.debug(f"Überspringe Transaktion {tx_hash}: Token-Mismatch")
                                continue
    
                        # Chain-End-Erkennung
                        is_chain_end = self._is_chain_end_transaction(tx)
                        
                        # Füge Transaktion mit Metadaten hinzu
                        next_tx = {
                            "hash": tx_hash,
                            "is_chain_end": is_chain_end,
                            "raw_data": tx if is_chain_end else None  # Speichere Rohdaten nur für Chain-Ends
                        }
                        next_transactions.append(next_tx)
                        
                        if len(next_transactions) >= safe_limit:
                            break
                            
                    except Exception as e:
                        logger.warning(f"SOLANA: Fehler bei Transaktion: {e}")
                        continue
    
                logger.info(f"ERFOLG: {len(next_transactions)} nächste Transaktionen gefunden")
                return next_transactions[:safe_limit]
                
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der Solana-Transaktionen: {str(e)}", exc_info=True)
            return []
    
    def _is_chain_end_transaction(self, transaction: dict) -> bool:
        """
        Erweiterte Erkennung von Chain-End-Transaktionen für Solana.
        """
        try:
            # Bekannte DEX- und Bridge-Programme
            KNOWN_SWAP_PROGRAMS = {
                "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",  # Raydium
                "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",  # Orca
                "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",   # Jupiter
                "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",   # Orca Whirlpools
                "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1",  # Raydium CLMM
            }
    
            KNOWN_BRIDGE_PROGRAMS = {
                "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",  # Wormhole
                "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5", # Allbridge
                "Brdguy7BmNB4qwEbcqqMbyV5CyJd2sxQNUn6NEpMSsUb", # Portal Bridge
                "ABR78XwLW5Bj4hctE9wFf2yCpcF5tqUtV5A7SSh3mdy7", # Allbridge V2
            }
    
            # Extrahiere alle beteiligten Programme
            instructions = transaction.get("transaction", {}).get("message", {}).get("instructions", [])
            account_keys = transaction.get("transaction", {}).get("message", {}).get("accountKeys", [])
            
            for instruction in instructions:
                program_idx = instruction.get("programIdIndex")
                if program_idx is not None and program_idx < len(account_keys):
                    program_id = account_keys[program_idx]
                    program_id = program_id.get("pubkey") if isinstance(program_id, dict) else program_id
    
                    # Überprüfe auf bekannte DEX- und Bridge-Programme
                    if program_id in KNOWN_SWAP_PROGRAMS:
                        logger.info(f"Chain-End erkannt: DEX-Programm gefunden ({program_id})")
                        return True
                    if program_id in KNOWN_BRIDGE_PROGRAMS:
                        logger.info(f"Chain-End erkannt: Bridge-Programm gefunden ({program_id})")
                        return True
    
                # Überprüfe auf Token-Swap Instruktionen
                if instruction.get("parsed", {}).get("type") in ["swap", "exchange", "bridge"]:
                    logger.info("Chain-End erkannt: Swap/Exchange/Bridge Instruktion gefunden")
                    return True
    
            return False
            
        except Exception as e:
            logger.error(f"Fehler bei der Chain-End-Erkennung: {str(e)}", exc_info=True)
            return False
    
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
