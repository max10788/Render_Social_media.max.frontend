from datetime import datetime
from app.core.backend_crypto_tracker.utils.logger import get_logger
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
            logger.info(f"Quelladresse extrahiert: {from_address[:10]}...")
            
            to_address = raw_data["to"].lower() if raw_data["to"] else None
            logger.info(f"Zieladresse extrahiert: {to_address[:10]}..." if to_address else "Keine Zieladresse (Vertragserstellung?)")
            
            # 3. Berechne den übertragenen Betrag (in ETH)
            logger.debug("Schritt 3: Berechne übertragenen Betrag")
            amount = float(raw_data["value"]) / 10**18
            logger.info(f"Berechneter Betrag: {amount} ETH")
            
            # 4. Extrahiere Transaktionsstatus
            logger.debug("Schritt 4: Extrahiere Transaktionsstatus")
            status = "success" if raw_data["isError"] == "0" and raw_data["txreceipt_status"] == "1" else "failed"
            logger.info(f"Transaktionsstatus: {status}")
            
            # 5. Berechne die Gebühr
            logger.debug("Schritt 5: Berechne Transaktionsgebühr")
            gas = int(raw_data["gas"])
            gas_price = int(raw_data["gasPrice"])
            fee = (gas * gas_price) / 10**18  # in ETH
            logger.info(f"Gebühr berechnet: {fee} ETH (Gas: {gas}, GasPrice: {gas_price})")
            
            # 6. Erstelle ein einheitliches Format für die Visualisierung
            logger.debug("Schritt 6: Erstelle einheitliches Antwortformat")
            result = {
                "tx_hash": tx_hash,
                "chain": "eth",
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": "ETH",
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
            account_keys = [key["pubkey"] if isinstance(key, dict) else key for key in raw_data["transaction"]["message"]["accountKeys"]]
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
            
            # 4. Extrahiere Transaktionsstatus
            logger.debug("Schritt 4: Extrahiere Transaktionsstatus")
            status = "failed" if raw_data["meta"]["err"] else "success"
            logger.info(f"Transaktionsstatus: {status}")
            
            # 5. Berechne die Transaktionsgebühr
            logger.debug("Schritt 5: Berechne Transaktionsgebühr")
            fee = raw_data["meta"]["fee"] / 1e9  # Lamports zu SOL
            logger.info(f"Gebühr berechnet: {fee} SOL")
            
            # 6. Erstelle ein einheitliches Format für die Visualisierung
            logger.debug("Schritt 6: Erstelle einheitliches Antwortformat")
            result = {
                "tx_hash": tx_hash,
                "chain": "sol",
                "timestamp": timestamp,
                "from_address": from_address,
                "to_address": to_address,
                "amount": amount,
                "currency": "SOL",
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
        
    def _get_next_transactions(self, blockchain, address, current_hash=None, limit=5):
        """
        Findet die nächsten Transaktionen in der Kette für eine gegebene Adresse.
        
        Args:
            blockchain: Die Blockchain ('eth', 'btc', 'sol')
            address: Die Adresse, für die die nächsten Transaktionen gefunden werden sollen
            current_hash: Optionaler aktueller Transaktions-Hash, um Duplikate zu vermeiden
            limit: Maximale Anzahl der zurückzugebenden Transaktionen
        
        Returns:
            Liste von Transaktions-Hashes
        """
        logger.info(f"START: Suche nach nächsten Transaktionen für {blockchain}-Adresse {address}")
        next_hashes = []
        
        try:
            if blockchain == "eth":
                logger.debug("Verwende Etherscan für Ethereum-Transaktionsabfrage")
                client = EtherscanETHClient()
                transactions = client.get_transactions_by_address(address, limit=limit)
                
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
                logger.debug("Verwende Solana-API für Transaktionsabfrage")
                client = SolanaAPIClient()
                transactions = client.get_transactions_by_address(address, limit=limit)
                
                logger.info(f"Gefundene Solana-Transaktionen: {len(transactions)}")
                for tx in transactions:
                    tx_hash = tx["transaction"]["signatures"][0]
                    if current_hash and tx_hash == current_hash:
                        logger.debug(f"Überspringe aktuelle Transaktion: {current_hash}")
                        continue
                    next_hashes.append(tx_hash)
                    logger.debug(f"Gefundene nächste Transaktion: {tx_hash}")
            
            logger.info(f"ERFOLG: Gefundene nächste Transaktionen: {len(next_hashes)}")
            return next_hashes[:limit]
        
        except Exception as e:
            logger.error(f"Fehler bei Suche nach nächsten Transaktionen: {str(e)}", exc_info=True)
            return []
