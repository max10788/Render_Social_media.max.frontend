from datetime import datetime
from app.core.backend_crypto_tracker.utils.logger import get_logger
# Fügen Sie diese Imports am Anfang der Datei hinzu
from app.core.backend_crypto_tracker.services.eth.etherscan_api import EtherscanETHClient
from app.core.backend_crypto_tracker.services.btc.transaction_service import BlockchairBTCClient
from app.core.backend_crypto_tracker.services.sol.solana_api import SolanaAPIClient
logger = get_logger(__name__)

class BlockchainParser:
    def parse_transaction(self, blockchain, raw_data):
        logger.info(f"START: Parsing von Transaktionsdaten für Blockchain '{blockchain}'")
        
        if blockchain == "eth":
            logger.debug("Wähle Ethereum-Parsing-Logik aus")
            return self._parse_eth_transaction(raw_data)
        elif blockchain == "btc":
            logger.debug("Wähle Bitcoin-Parsing-Logik aus")
            return self._parse_btc_transaction(raw_data)
        elif blockchain == "sol":
            logger.debug("Wähle Solana-Parsing-Logik aus")
            return self._parse_sol_transaction(raw_data)
        else:
            logger.error(f"Ungültige Blockchain für Parsing: '{blockchain}'")
            raise ValueError(f"Unsupported blockchain: {blockchain}")

    def _parse_eth_transaction(self, raw_data):
        """Parse Ethereum transaction data from Etherscan API response."""
        logger.info("START: Ethereum-Transaktionsparsing")
        logger.debug(f"Eingang: Rohdaten erhalten (Größe: {len(str(raw_data))} Zeichen)")
        
        try:
            # 1. Extrahiere grundlegende Transaktionsinformationen
            logger.debug("Schritt 1: Extrahiere grundlegende Transaktionsinformationen")
            tx_hash = raw_data["hash"]
            logger.info(f"Transaktions-Hash extrahiert: {tx_hash}")
            
            timestamp = datetime.fromtimestamp(int(raw_data["timeStamp"]))
            logger.debug(f"Zeitstempel extrahiert: {timestamp}")
            
            # 2. Bestimme Quell- und Zieladressen
            logger.debug("Schritt 2: Bestimme Quell- und Zieladressen")
            from_address = raw_data["from"].lower()
            logger.info(f"Quelladresse extrahiert: {from_address}")
            
            # 3. Bestimme Token-Contract-Adresse
            logger.debug("Schritt 3: Bestimme Token-Contract-Adresse")
            contract_address = raw_data["contractAddress"].lower() if raw_data["contractAddress"] else None
            token_type = "ETH"
            
            # Überprüfe, ob es sich um eine ERC-20 Token-Transaktion handelt
            if contract_address and contract_address != "0x":
                token_type = contract_address
                logger.info(f"Token-Transaktion identifiziert: ERC-20 Token mit Contract-Adresse {contract_address[:10]}...")
            else:
                logger.info("Native ETH-Transaktion identifiziert")
            
            # 4. Berechne den übertragenen Betrag (in ETH)
            logger.debug("Schritt 4: Berechne übertragenen Betrag")
            # Für native ETH-Transaktionen
            if token_type == "ETH":
                amount = float(raw_data["value"]) / 10**18
                logger.info(f"Berechneter ETH-Betrag: {amount} ETH")
            # Für ERC-20 Token-Transaktionen (wird normalerweise separat abgerufen)
            else:
                # In einer echten Implementierung würden wir hier den Token-spezifischen Wert extrahieren
                amount = 0  # Wird normalerweise aus separaten Token-Transaktionsdaten kommen
                logger.info(f"Token-Betrag wird aus separaten Token-Transaktionsdaten extrahiert")
            
            # 5. Extrahiere Transaktionsstatus
            logger.debug("Schritt 5: Extrahiere Transaktionsstatus")
            status = "success" if raw_data["isError"] == "0" and raw_data["txreceipt_status"] == "1" else "failed"
            logger.info(f"Transaktionsstatus: {status}")
            
            # 6. Berechne die Gebühr
            logger.debug("Schritt 6: Berechne Transaktionsgebühr")
            gas = int(raw_data["gas"])
            gas_price = int(raw_data["gasPrice"])
            fee = (gas * gas_price) / 10**18  # in ETH
            logger.info(f"Gebühr berechnet: {fee} ETH (Gas: {gas}, GasPrice: {gas_price})")
            
            # 7. Erstelle ein einheitliches Format für die Visualisierung
            logger.debug("Schritt 7: Erstelle einheitliches Antwortformat")
            result = {
                "tx_hash": tx_hash,
                "chain": "eth",
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": raw_data["to"].lower() if raw_data["to"] else None,
                "amount": amount,
                "currency": token_type,
                "token_contract": token_type if token_type != "ETH" else None,
                "fee": fee,
                "status": status,
                "raw_data": raw_data
            }
            logger.info(f"ERFOLG: Ethereum-Transaktion erfolgreich geparsed")
            return result
            
        except KeyError as e:
            logger.error(f"Fehler beim Parsen der Ethereum-Transaktion: Fehlendes Feld {str(e)}", exc_info=True)
            logger.debug(f"Rohdatenstruktur (erste 500 Zeichen): {str(raw_data)[:500]}")
            raise
        except Exception as e:
            logger.critical(f"UNERWARTETER FEHLER beim Ethereum-Parsing: {str(e)}", exc_info=True)
            raise
        
    def _parse_btc_transaction(self, raw_data):
        """Parse Bitcoin transaction data from Blockchair API response."""
        logger.info("START: Bitcoin-Transaktionsparsing")
        logger.debug(f"Eingang: Rohdaten erhalten (Größe: {len(str(raw_data))} Zeichen)")
        
        try:
            # 1. Extrahiere grundlegende Transaktionsinformationen
            logger.debug("Schritt 1: Extrahiere grundlegende Transaktionsinformationen")
            tx_hash = raw_data["data"]["hash"]
            logger.info(f"Transaktions-Hash extrahiert: {tx_hash}")
            
            timestamp = datetime.fromtimestamp(raw_data["data"]["time"])
            logger.debug(f"Zeitstempel extrahiert: {timestamp}")
            
            # 2. Verarbeite alle Inputs (Quelladressen)
            logger.debug("Schritt 2: Verarbeite alle Inputs (Quelladressen)")
            inputs = raw_data["data"]["inputs"]
            from_addresses = []
            total_input_value = 0
            
            for input in inputs:
                if "recipient" in input:
                    from_addresses.append(input["recipient"])
                total_input_value += input["value"]
            
            logger.info(f"Anzahl Quelladressen: {len(from_addresses)}")
            if from_addresses:
                logger.info(f"Beispielhafte Quelladresse: {from_addresses[0][:10]}...")
            
            # 3. Verarbeite alle Outputs (Zieladressen)
            logger.debug("Schritt 3: Verarbeite alle Outputs (Zieladressen)")
            outputs = raw_data["data"]["outputs"]
            to_addresses = []
            amounts = []
            total_output_value = 0
            
            for output in outputs:
                if "recipient" in output:
                    to_addresses.append(output["recipient"])
                    amounts.append(output["value"])
                    total_output_value += output["value"]
            
            logger.info(f"Anzahl Zieladressen: {len(to_addresses)}")
            if to_addresses:
                logger.info(f"Beispielhafte Zieladresse: {to_addresses[0][:10]}...")
            
            # 4. Berechne den übertragenen Betrag und die Gebühr
            logger.debug("Schritt 4: Berechne den übertragenen Betrag und die Gebühr")
            # Die Gebühr ist die Differenz zwischen Input- und Output-Werten
            fee = (total_input_value - total_output_value) / 10**8  # in BTC
            amount = total_output_value / 10**8  # in BTC
            
            logger.info(f"Berechneter Betrag: {amount} BTC")
            logger.info(f"Berechnete Gebühr: {fee} BTC")
            
            # 5. Bestimme die primäre Zieladresse (meist die erste mit Wert)
            logger.debug("Schritt 5: Bestimme die primäre Zieladresse")
            to_address = None
            if outputs:
                for output in outputs:
                    if "recipient" in output and output["value"] > 0:
                        to_address = output["recipient"]
                        break
            
            logger.info(f"Primäre Zieladresse: {to_address[:10]}..." if to_address else "Keine primäre Zieladresse gefunden")
            
            # 6. Erstelle ein einheitliches Format für die Visualisierung
            logger.debug("Schritt 6: Erstelle einheitliches Antwortformat")
            result = {
                "tx_hash": tx_hash,
                "chain": "btc",
                "timestamp": timestamp,
                "from_address": from_addresses[0] if from_addresses else None,
                "to_address": to_address,
                "amount": amount,
                "currency": "BTC",
                "fee": fee,
                "status": "success",  # Bitcoin hat keinen expliziten Status
                "raw_data": raw_data
            }
            logger.info(f"ERFOLG: Bitcoin-Transaktion erfolgreich geparsed")
            return result
            
        except KeyError as e:
            logger.error(f"Fehler beim Parsen der Bitcoin-Transaktion: Fehlendes Feld {str(e)}", exc_info=True)
            logger.debug(f"Rohdatenstruktur (erste 500 Zeichen): {str(raw_data)[:500]}")
            raise
        except Exception as e:
            logger.critical(f"UNERWARTETER FEHLER beim Bitcoin-Parsing: {str(e)}", exc_info=True)
            raise
    
    def _parse_sol_transaction(self, raw_data):
        """Parse Solana transaction data from Solana Web3 API response with detailed logging."""
        logger.info("START: Solana-Transaktionsparsing")
        logger.debug(f"Eingang: Rohdaten erhalten (Größe: {len(str(raw_data))} Zeichen)")
        
        try:
            # 1. Extrahiere grundlegende Transaktionsinformationen
            logger.debug("Schritt 1: Extrahiere grundlegende Transaktionsinformationen")
            tx_hash = raw_data["transaction"]["signatures"][0]
            logger.info(f"Transaktions-Hash extrahiert: {tx_hash}")
            
            block_time = raw_data["blockTime"]
            timestamp = datetime.fromtimestamp(block_time) if block_time else datetime.now()
            logger.debug(f"Zeitstempel extrahiert: {timestamp}")
            
            # 2. Extrahiere Account-Keys und Balances
            logger.debug("Schritt 2: Extrahiere Account-Keys und Balances")
            
            # Behandle verschiedene Formate für accountKeys
            account_keys = []
            if "accountKeys" in raw_data["transaction"]["message"]:
                for key in raw_data["transaction"]["message"]["accountKeys"]:
                    if isinstance(key, dict):
                        account_keys.append(key["pubkey"])
                    else:
                        account_keys.append(key)
            
            pre_balances = raw_data["meta"]["preBalances"]
            post_balances = raw_data["meta"]["postBalances"]
            
            logger.info(f"Anzahl Accounts in der Transaktion: {len(account_keys)}")
            logger.debug(f"Beispielhafte Accounts: {account_keys[:3]}")
            
            # 3. Bestimme Quell- und Zieladressen durch Balance-Vergleich
            logger.debug("Schritt 3: Bestimme Quell- und Zieladressen durch Balance-Vergleich")
            from_address = None
            to_address = None
            amount = 0
            
            # Finde die Adresse mit Balance-Abnahme (Quelle)
            for i in range(len(account_keys)):
                if pre_balances[i] > post_balances[i]:
                    from_address = account_keys[i]
                    amount = (pre_balances[i] - post_balances[i]) / 1e9  # Lamports zu SOL
                    break
            
            # Finde die Adresse mit Balance-Zunahme (Ziel)
            for i in range(len(account_keys)):
                if post_balances[i] > pre_balances[i]:
                    to_address = account_keys[i]
                    break
            
            logger.info(f"Quelladresse identifiziert: {from_address[:10]}..." if from_address else "Keine Quelladresse gefunden")
            logger.info(f"Zieladresse identifiziert: {to_address[:10]}..." if to_address else "Keine Zieladresse gefunden")
            logger.info(f"Übertragener Betrag: {amount} SOL")
            
            # 4. Extrahiere Token-Mint-Adresse
            logger.debug("Schritt 4: Extrahiere Token-Mint-Adresse")
            mint_address = "So11111111111111111111111111111111111111112"  # SOL Standard Mint-Adresse
            
            # Prüfe auf Token-Programm-Transaktionen
            if "instructions" in raw_data["transaction"]["message"]:
                for instruction in raw_data["transaction"]["message"]["instructions"]:
                    # Token-Programm-ID Index (normalerweise 4 in Solana)
                    if "programIdIndex" in instruction and instruction["programIdIndex"] == 4:
                        # Token-Übertragung
                        if "accounts" in instruction and len(instruction["accounts"]) >= 3:
                            mint_index = instruction["accounts"][1]
                            if mint_index < len(account_keys):
                                mint_address = account_keys[mint_index]
                                logger.info(f"Token-Mint-Adresse identifiziert: {mint_address[:10]}...")
            
            # 5. Extrahiere Transaktionsstatus
            logger.debug("Schritt 5: Extrahiere Transaktionsstatus")
            status = "failed" if raw_data["meta"]["err"] else "success"
            logger.info(f"Transaktionsstatus: {status}")
            
            # 6. Berechne die Transaktionsgebühr
            logger.debug("Schritt 6: Berechne Transaktionsgebühr")
            fee = raw_data["meta"]["fee"] / 1e9  # Lamports zu SOL
            logger.info(f"Gebühr berechnet: {fee} SOL")
            
            # 7. Erstelle ein einheitliches Format für die Visualisierung
            logger.debug("Schritt 7: Erstelle einheitliches Antwortformat")
            result = {
                "tx_hash": tx_hash,
                "chain": "sol",
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": "SOL" if mint_address == "So11111111111111111111111111111111111111112" else mint_address,
                "mint_address": mint_address,
                "fee": fee,
                "status": status,
                "raw_data": raw_data
            }
            logger.info(f"ERFOLG: Solana-Transaktion erfolgreich geparsed")
            return result
            
        except KeyError as e:
            logger.error(f"Fehler beim Parsen der Solana-Transaktion: Fehlendes Feld {str(e)}", exc_info=True)
            logger.debug(f"Rohdatenstruktur (erste 500 Zeichen): {str(raw_data)[:500]}")
            raise
        except Exception as e:
            logger.critical(f"UNERWARTETER FEHLER beim Solana-Parsing: {str(e)}", exc_info=True)
            raise

    def _get_mint_address_from_transaction(self, tx):
        """Extrahiert die Mint-Adresse aus einer Solana-Transaktion."""
        logger.debug("Extrahiere Mint-Adresse aus Solana-Transaktion")
        try:
            if "transaction" in tx and "message" in tx["transaction"] and "instructions" in tx["transaction"]["message"]:
                for instruction in tx["transaction"]["message"]["instructions"]:
                    # Überprüfe, ob es sich um eine Token-Übertragung handelt (Token-Programm-ID)
                    if "programIdIndex" in instruction and instruction["programIdIndex"] == 4:
                        # Extrahiere die Mint-Adresse aus den Konten
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
                                logger.debug(f"Mint-Adresse extrahiert: {mint_address}")
                                return mint_address
            
            # Standard: SOL
            logger.debug("Keine Token-Transaktion gefunden, verwende SOL als Standard")
            return "So11111111111111111111111111111111111111112"
        
        except Exception as e:
            logger.error(f"Fehler bei der Extraktion der Mint-Adresse: {str(e)}", exc_info=True)
            # Bei Fehlern verwende Standard-SOL Mint-Adresse
            return "So11111111111111111111111111111111111111112"
    
    def _get_next_transactions(self, blockchain, address, current_hash=None, token_identifier=None, limit=5):
        """
        Findet die nächsten Transaktionen in der Kette für eine gegebene Adresse und Token-Typ.
        
        Args:
            blockchain: Die Blockchain ('eth', 'btc', 'sol')
            address: Die Adresse, für die die nächsten Transaktionen gefunden werden sollen
            current_hash: Optionaler aktueller Transaktions-Hash, um Duplikate zu vermeiden
            token_identifier: Der Token-Identifikator (Mint-Adresse für Solana, Contract-Adresse für Ethereum)
            limit: Maximale Anzahl der zurückzugebenden Transaktionen
        
        Returns:
            Liste von Transaktions-Hashes
        """
        logger.info(f"START: Suche nach nächsten Transaktionen für {blockchain}-Adresse {address} (Limit: {limit})")
        logger.debug(f"Parameter: current_hash={current_hash}, token_identifier={token_identifier}")
        next_hashes = []
        
        try:
            if blockchain == "eth":
                logger.debug(f"Verwende Etherscan für Ethereum-Transaktionsabfrage (Token-Identifier: {token_identifier})")
                client = EtherscanETHClient()
                
                # Für native ETH-Transaktionen
                if not token_identifier or token_identifier == "ETH":
                    transactions = client.get_transactions_by_address(address, limit=limit)
                # Für ERC-20 Token-Transaktionen
                else:
                    transactions = client.get_token_transactions_by_contract(token_identifier, address, limit=limit)
                
                logger.info(f"Gefundene Ethereum-Transaktionen: {len(transactions)}")
                for tx in transactions:
                    if current_hash and tx["hash"] == current_hash:
                        logger.debug(f"Überspringe aktuelle Transaktion: {current_hash}")
                        continue
                    next_hashes.append(tx["hash"])
                    logger.debug(f"Gefundene nächste Transaktion: {tx['hash']}")
            
            elif blockchain == "btc":
                logger.debug("Verwende Blockchair für Bitcoin-Transaktionsabfrage")
                client = BlockchairBTCClient()
                transactions = client.get_transactions_by_address(address, limit=limit)
                
                logger.info(f"Gefundene Bitcoin-Transaktionen: {len(transactions)}")
                for tx in transactions:
                    if current_hash and tx["hash"] == current_hash:
                        logger.debug(f"Überspringe aktuelle Transaktion: {current_hash}")
                        continue
                    next_hashes.append(tx["hash"])
                    logger.debug(f"Gefundene nächste Transaktion: {tx['hash']}")
            
            elif blockchain == "sol":
                logger.debug(f"Verwende Solana-API für Transaktionsabfrage (Mint-Adresse: {token_identifier})")
                client = SolanaAPIClient()
                transactions = client.get_transactions_by_address(address, limit=limit)
                
                logger.info(f"Gefundene Solana-Transaktionen: {len(transactions)}")
                for tx in transactions:
                    tx_hash = tx["transaction"]["signatures"][0]
                    if current_hash and tx_hash == current_hash:
                        logger.debug(f"Überspringe aktuelle Transaktion: {current_hash}")
                        continue
                    
                    # Filtere nur Transaktionen mit dem gleichen Token-Identifier
                    if token_identifier:
                        tx_token_id = self._get_token_identifier_from_transaction(blockchain, tx)
                        if tx_token_id != token_identifier:
                            logger.debug(f"Überspringe Transaktion {tx_hash} - Falscher Token-Identifier ({tx_token_id} != {token_identifier})")
                            continue
                    
                    next_hashes.append(tx_hash)
                    logger.debug(f"Gefundene nächste Transaktion: {tx_hash}")
            
            else:
                logger.error(f"Ungültige Blockchain für nächste Transaktionen: {blockchain}")
                return []
            
            logger.info(f"ERFOLG: Gefundene nächste Transaktionen: {len(next_hashes)}")
            return next_hashes[:limit]
        
        except Exception as e:
            logger.error(f"Fehler bei Suche nach nächsten Transaktionen: {str(e)}", exc_info=True)
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
