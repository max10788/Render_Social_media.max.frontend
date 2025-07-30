# app/core/backend_crypto_tracker/processor/solana_parser.py
# (Inhalt bleibt größtenteils gleich, nur die Limit-Berechnung in _get_next_transactions ändert sich)
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient # Stellt sicher, dass der Client importiert ist
logger = get_logger(__name__)
# Bekannte DEX- und Bridge-Programme auf Solana
# Diese könnten auch in eine separate Konfigurationsdatei ausgelagert werden
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
class SolanaParser:
    def __init__(self):
        logger.debug("SolanaParser: Initialisiert")
    def _parse_transaction(self, raw_data: dict):
        """
        Parst Solana-Transaktionsdaten und extrahiert relevante Informationen.
        Strategie zur Adresserkennung:
        1. Primär: Analyse der System-Program Transfer Instruktionen
        2. Sekundär: Analyse der Token-Program Transfer Instruktionen
        3. Fallback: Analyse der Saldo-Änderungen
        Args:
            raw_data (dict): Rohdaten der Transaktion im jsonParsed Format
        Returns:
            dict: Geparste Transaktionsdaten mit allen relevanten Informationen
        """
        logger.info("START: Solana-Transaktionsparsing")
        # Initialisiere Standardwerte
        parsed_data = {
            "tx_hash": "UNKNOWN_HASH",
            "chain": "sol",
            "timestamp": datetime(2025, 7, 29, 15, 11, 19), # Dummy-Zeitstempel
            "from_address": None,
            "to_address": None,
            "amount": 0.0,
            "currency": "SOL" # Standard ist SOL
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
                        parsed_data["currency"] = "So11111111111111111111111111111111111111112" # SOL Mint
                        transfer_found = True
                        logger.info(f"System Transfer gefunden: {source[:8]}... -> {destination[:8]}...")
                        break
                # Token Program Transfer (Korrektur der Bedingung)
                elif instr.get("programId") == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA":
                    accounts = instr.get("accounts", [])
                    if len(accounts) >= 3:  # source, destination, mint
                        source_idx = accounts[0]
                        dest_idx = accounts[1]
                        mint_idx = accounts[2] # <-- Korrektur: Mint ist Index 2
                        if max(source_idx, dest_idx, mint_idx) < len(account_keys):
                            parsed_data["from_address"] = account_keys[source_idx]
                            parsed_data["to_address"] = account_keys[dest_idx]
                            parsed_data["currency"] = account_keys[mint_idx] # <-- Setze Mint-Adresse als Währung
                            # Betrag muss separat aus Token-Amounts extrahiert werden
                            # Fallback: Setze amount auf 0, da die Logik hier komplexer ist.
                            # In einer realen Implementierung würden Sie die Logik aus dem Client nutzen,
                            # um den genauen Betrag zu finden, z.B. aus meta.preTokenBalances/postTokenBalances
                            # oder durch Parsen von parsed.tokenAmount, falls vorhanden.
                            parsed_data["amount"] = 0.0 # Placeholder
                            transfer_found = True
                            logger.info(f"Token Transfer gefunden: {parsed_data['from_address'][:8]}... -> {parsed_data['to_address'][:8]}... (Mint: {parsed_data['currency'][:8]}...)")
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
                # Überprüfe auf Token-Swap Instruktionen (parsed)
                if instruction.get("parsed", {}).get("type") in ["swap", "exchange", "bridge"]:
                    logger.info("Chain-End erkannt: Swap/Exchange/Bridge Instruktion gefunden")
                    return True
            return False
        except Exception as e:
            logger.error(f"Fehler bei der Chain-End-Erkennung: {str(e)}", exc_info=True)
            return False

    def _get_next_transactions(
        self,
        address: str,
        current_hash: str,
        limit: int, # <-- Dieses Limit kommt vom Aufrufer (z.B. der Route)
        token_identifier: Optional[str] = None,
        include_meta: bool = False
    ) -> List[Dict[str, Any]]:
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
        logger.info(f"SOLANA: Suche Transaktionen für {address} (Filter: {token_identifier or 'None'})")
        try:
            client = SolanaAPIClient()
            
            # *** ÄNDERUNG 1: Verwende das übergebene Limit direkt ***
            # Setze es auf mindestens 1, aber entferne die harte Obergrenze von 10
            # Die Validierung des Maximalwerts sollte in der aufrufenden Route erfolgen.
            safe_limit = max(1, int(limit)) # <-- Geändert: Keine Obergrenze mehr
            
            # *** ÄNDERUNG 2: Übergebe das sichere Limit an die API ***
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
                        
                        # --- Korrektur: Verwende token_identifier anstelle von filter_token ---
                        # Token-Filter-Logik
                        if token_identifier: # <-- Korrektur: Verwende den korrekten Parameter
                            tx_token = self._get_token_identifier_from_transaction(tx)
                            if tx_token != token_identifier:
                                logger.debug(f"Überspringe Transaktion {tx_hash}: Token-Mismatch ({tx_token} != {token_identifier})")
                                continue
                        # --- Ende Korrektur ---
                        
                        # Chain-End-Erkennung
                        is_chain_end = self._is_chain_end_transaction(tx)
                        
                        # Füge Transaktion mit Metadaten hinzu
                        next_tx = {
                            "hash": tx_hash,
                            "is_chain_end": is_chain_end,
                            "raw_data": tx if (is_chain_end or include_meta) else None
                        }
                        next_transactions.append(next_tx)
                        
                        # *** ÄNDERUNG 3: Prüfe gegen das sichere Limit ***
                        if len(next_transactions) >= safe_limit: # <-- Geändert
                            break
                    except Exception as e:
                        logger.warning(f"SOLANA: Fehler bei Transaktion: {e}")
                        continue
                logger.info(f"ERFOLG: {len(next_transactions)} nächste Transaktionen gefunden")
                
                # *** ÄNDERUNG 4: Abschließende Begrenzung ***
                return next_transactions[:safe_limit] # <-- Geändert
        except Exception as e:
            logger.error(f"FEHLER: Fehler beim Abrufen der Solana-Transaktionen: {str(e)}", exc_info=True)
            return []
            
    # --- Neue Methode zur Saldoabfrage (ausschließlich für die Verarbeitung) ---
    def get_token_balance(self, address: str, mint_address: str):
        """
        (Ausschließlich für die Verarbeitung) Verarbeitet den Saldoabruf.
        Hinweis: Diese Methode setzt voraus, dass der SolanaAPIClient die notwendigen Methoden implementiert.
        """
        logger.info(f"SOLANA: Verarbeite Token-Saldo-Abfrage für {address} und Mint {mint_address}")
        try:
             # 1. Hole die Token-Accounts für die gegebene Adresse und Mint-Adresse
             # Angenommen, der Client hat eine Methode get_token_accounts_by_owner
             client = SolanaAPIClient()
             token_accounts_data = client.get_token_accounts_by_owner(address, mint_address)
             if not token_accounts_data or not isinstance(token_accounts_data, list):
                  logger.info(f"Keine Token-Accounts für Mint {mint_address} bei Adresse {address[:10]}... gefunden.")
                  return (0.0, "UNKNOWN") # Oder None, je nach Vorliebe
             total_balance = 0.0
             decimals = 9 # Standard für viele Tokens, aber wir sollten es dynamisch abrufen
             # 2. Hole die Token-Decimals (könnte auch im Client gemacht werden)
             # Angenommen, der Client hat eine Methode get_token_mint_info
             try:
                  mint_info = client.get_token_mint_info(mint_address)
                  decimals = mint_info.get("decimals", 9)
                  symbol = mint_info.get("symbol", "TOKEN")
             except Exception as mint_info_error:
                  logger.warning(f"Fehler beim Abrufen der Mint-Info für {mint_address}: {mint_info_error}. Verwende Standard-Decimals (9).")
                  symbol = "TOKEN"
             # 3. Summiere die Salden aller zugehörigen Token-Accounts
             for account_info in token_accounts_data:
                 # Die Struktur von account_info hängt von der API ab.
                 # Typischerweise ist es so: {"pubkey": "...", "account": {"data": {"parsed": {"info": {"tokenAmount": {...}}}}}}
                 try:
                     # Beispielstruktur (angepasst an die tatsächliche Antwort der Solana API)
                     # Dieser Teil muss stark an die tatsächliche Antwort des SolanaAPIClient angepasst werden.
                     parsed_info = account_info.get("account", {}).get("data", {}).get("parsed", {}).get("info", {})
                     token_amount_info = parsed_info.get("tokenAmount", {})
                     ui_amount = token_amount_info.get("uiAmount", 0)
                     if ui_amount is not None:
                         total_balance += ui_amount
                     else:
                         # Fallback, falls uiAmount nicht verfügbar ist
                         amount_str = token_amount_info.get("amount", "0")
                         amount_int = int(amount_str)
                         total_balance += amount_int / (10 ** decimals)
                 except (ValueError, TypeError, KeyError) as parse_error:
                      logger.warning(f"Fehler beim Parsen des Token-Accounts {account_info.get('pubkey', 'UNKNOWN')}: {parse_error}")
                      continue # Überspringe fehlerhafte Accounts
             logger.info(f"ERFOLG: Token-Saldo für {address[:10]}... und {mint_address} ist {total_balance} {symbol}")
             return (total_balance, symbol)
        except Exception as e:
             logger.error(f"FEHLER: Fehler bei der Verarbeitung des Token-Saldos für {address} und Mint {mint_address}: {str(e)}", exc_info=True)
             return None # Oder (0.0, "ERROR") je nach Vorliebe
    # --- Ende neue Methode ---
    # --- Methode zur Token-Identifier-Extraktion (ausschließlich für die Verarbeitung) ---
    def _get_token_identifier_from_transaction(self, tx: dict):
        """
        (Ausschließlich für die Verarbeitung) Extrahiert den Token-Identifier (Mint-Adresse) aus einer Solana-Transaktion.
        """
        logger.debug(f"Extrahiere Token-Identifier aus Solana-Transaktion")
        try:
            # Für Solana: Token-Identifier ist die Mint-Adresse
            if "transaction" in tx and "message" in tx["transaction"] and "instructions" in tx["transaction"]["message"]:
                account_keys = []
                for key in tx["transaction"]["message"].get("accountKeys", []):
                    if isinstance(key, dict):
                        account_keys.append(key.get("pubkey", ""))
                    else:
                        account_keys.append(key)
                for instruction in tx["transaction"]["message"]["instructions"]:
                    # Suchen Sie nach der tatsächlichen Programm-ID des Token-Programms
                    program_id_index = instruction.get("programIdIndex")
                    if program_id_index is not None and program_id_index < len(account_keys):
                         program_id = account_keys[program_id_index]
                         # Überprüfen, ob es sich um das SPL Token Programm handelt
                         if program_id == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA":
                             # Token-Übertragung
                             # Accounts: [source, dest, owner/mint], wir brauchen den Mint (Index 2)
                             accounts_indices = instruction.get("accounts", [])
                             if len(accounts_indices) >= 3:
                                 mint_index = accounts_indices[2] # Index 2 ist normalerweise der Mint-Account
                                 if mint_index < len(account_keys):
                                     mint_address = account_keys[mint_index]
                                     logger.debug(f"Solana Token-Identifier (Mint-Adresse) extrahiert: {mint_address}")
                                     return mint_address
                             # Fallback für andere Token-Instruktionen wie 'initializeAccount' etc.
                             # Die Logik könnte hier erweitert werden, je nach Bedarf.
            # Standard: SOL (Native SOL Transfers haben keinen Mint)
            logger.debug("Keine Token-Transaktion gefunden, verwende SOL als Standard")
            return "So11111111111111111111111111111111111111112"
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion des Token-Identifiers: {str(e)}", exc_info=True)
            # Bei Fehlern verwende Standard-Identifier
            return "So11111111111111111111111111111111111111112"
    # --- Ende Methode zur Token-Identifier-Extraktion ---
