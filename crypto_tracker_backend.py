"""
Krypto-Transaktionsverfolger - Backend-Modul
============================================
Dieses Modul verfolgt Kryptowährungs-Transaktionen (ETH, BTC, SOL) ab einer definierten 
Starttransaktion und bereitet die Daten für die visuelle Darstellung auf.

Eingaben:
- Starttransaktion (Hash oder Blocknummer)
- Zielwährung für Konversion
- Anzahl der zu verfolgenden Transaktionen

Ausgabe:
- JSON-Struktur mit allen relevanten Transaktionsdaten und konvertierten Werten

Beispiel für die Verwendung:
```python
# API-Schlüssel initialisieren
api_keys = {
    "infura": "YOUR_INFURA_KEY",
    "etherscan": "YOUR_ETHERSCAN_KEY"
}

# Tracker initialisieren
tracker = CryptoTracker(api_keys)

# Transaktionen verfolgen
result = tracker.track_transactions(
    start_tx_hash="0x123abc...",  # Hash der Starttransaktion
    target_currency="SOL",        # Zielwährung für Konversion
    num_transactions=10           # Anzahl der zu verfolgenden Transaktionen
)

# Ergebnis speichern
with open("transaction_data.json", "w") as f:
    json.dump(result, f, indent=2)
```
"""

import json
import requests
from datetime import datetime
from typing import Dict, List, Union, Optional, Any
import logging
from web3 import Web3

# Logging konfigurieren
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API-Konstanten
COINGECKO_API_BASE = "https://api.coingecko.com/api/v3"
BLOCKCHAIN_INFO_API_BASE = "https://blockchain.info"
ETHERSCAN_API_BASE = "https://api.etherscan.io/api"
SOLANA_RPC_API = "https://api.mainnet-beta.solana.com"

class CryptoTracker:
    """Hauptklasse für die Verfolgung von Kryptowährungs-Transaktionen"""
    
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        """
        Initialisiert den Tracker mit API-Schlüsseln.
        
        Args:
            api_keys: Dict mit API-Schlüsseln für verschiedene Dienste
                      (z.B. {"etherscan": "YOUR_KEY", "coingecko": "YOUR_KEY"})
        """
        self.api_keys = api_keys or {}
        self.web3 = Web3(Web3.HTTPProvider('https://mainnet.infura.io/v3/' + self.api_keys.get('infura', '')))
        
        # Cache für Währungsumrechnungskurse
        self.exchange_rate_cache = {}
    
    def get_historical_exchange_rate(self, from_currency: str, to_currency: str, timestamp: int) -> float:
        """
        Holt den historischen Umrechnungskurs zwischen zwei Währungen zu einem bestimmten Zeitpunkt.
        
        Args:
            from_currency: Quellwährung (BTC, ETH, SOL)
            to_currency: Zielwährung (BTC, ETH, SOL)
            timestamp: Unix-Timestamp für den historischen Kurs
            
        Returns:
            float: Umrechnungskurs (1 from_currency = X to_currency)
        """
        if from_currency == to_currency:
            return 1.0
            
        cache_key = f"{from_currency}_{to_currency}_{timestamp}"
        if cache_key in self.exchange_rate_cache:
            return self.exchange_rate_cache[cache_key]
            
        # Formatiere Datum für CoinGecko (DD-MM-YYYY)
        date_str = datetime.fromtimestamp(timestamp).strftime('%d-%m-%Y')
        
        try:
            # CoinGecko API für historische Preise
            # Zuerst beide Währungen in USD umrechnen
            from_url = f"{COINGECKO_API_BASE}/coins/{self._get_coingecko_id(from_currency)}/history"
            to_url = f"{COINGECKO_API_BASE}/coins/{self._get_coingecko_id(to_currency)}/history"
            
            from_params = {"date": date_str, "localization": "false"}
            to_params = {"date": date_str, "localization": "false"}
            
            from_response = requests.get(from_url, params=from_params)
            from_response.raise_for_status()
            from_data = from_response.json()
            
            to_response = requests.get(to_url, params=to_params)
            to_response.raise_for_status()
            to_data = to_response.json()
            
            from_usd_price = from_data["market_data"]["current_price"]["usd"]
            to_usd_price = to_data["market_data"]["current_price"]["usd"]
            
            # Berechne den Umrechnungskurs
            rate = from_usd_price / to_usd_price
            
            # Cache das Ergebnis
            self.exchange_rate_cache[cache_key] = rate
            return rate
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des Wechselkurses: {e}")
            # Fallback: Aktuelle Preise verwenden, wenn historische nicht verfügbar sind
            return self.get_current_exchange_rate(from_currency, to_currency)
    
    def get_current_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        """
        Holt den aktuellen Umrechnungskurs zwischen zwei Währungen.
        
        Args:
            from_currency: Quellwährung (BTC, ETH, SOL)
            to_currency: Zielwährung (BTC, ETH, SOL)
            
        Returns:
            float: Umrechnungskurs (1 from_currency = X to_currency)
        """
        if from_currency == to_currency:
            return 1.0
            
        try:
            from_id = self._get_coingecko_id(from_currency)
            to_id = self._get_coingecko_id(to_currency)
            
            url = f"{COINGECKO_API_BASE}/simple/price"
            params = {
                "ids": f"{from_id},{to_id}",
                "vs_currencies": "usd"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            from_usd = data[from_id]["usd"]
            to_usd = data[to_id]["usd"]
            
            return from_usd / to_usd
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des aktuellen Wechselkurses: {e}")
            # Fallback-Werte basierend auf ungefähren Kursen (sollte in Produktion vermieden werden)
            fallback_rates = {
                "BTC_ETH": 15.5,
                "BTC_SOL": 500.0,
                "ETH_BTC": 0.065,
                "ETH_SOL": 32.0,
                "SOL_BTC": 0.002,
                "SOL_ETH": 0.03
            }
            key = f"{from_currency}_{to_currency}"
            return fallback_rates.get(key, 1.0)
    
    def _get_coingecko_id(self, currency: str) -> str:
        """Konvertiert Währungssymbole in CoinGecko IDs"""
        mapping = {
            "BTC": "bitcoin",
            "ETH": "ethereum",
            "SOL": "solana"
        }
        return mapping.get(currency.upper(), currency.lower())
    
    def track_bitcoin_transactions(self, start_tx_hash: str, num_transactions: int) -> List[Dict]:
        """
        Verfolgt Bitcoin-Transaktionen ausgehend von einer Starttransaktion.
        
        Args:
            start_tx_hash: Hash der Ausgangstransaktion
            num_transactions: Maximale Anzahl der zu verfolgenden Transaktionen
            
        Returns:
            List[Dict]: Liste von Transaktionsdaten
        """
        transactions = []
        processed_txs = set()
        tx_queue = [start_tx_hash]
        
        while tx_queue and len(transactions) < num_transactions:
            current_tx_hash = tx_queue.pop(0)
            
            if current_tx_hash in processed_txs:
                continue
                
            processed_txs.add(current_tx_hash)
            
            try:
                # Blockchain.info API für BTC-Transaktionen
                url = f"{BLOCKCHAIN_INFO_API_BASE}/rawtx/{current_tx_hash}"
                response = requests.get(url)
                response.raise_for_status()
                tx_data = response.json()
                
                # Extrahiere relevante Transaktionsdaten
                tx_info = {
                    "hash": tx_data["hash"],
                    "currency": "BTC",
                    "timestamp": tx_data["time"],
                    "inputs": [],
                    "outputs": [],
                    "fee": tx_data.get("fee", 0) / 1e8  # Satoshi zu BTC
                }
                
                # Verarbeite Inputs
                total_input = 0
                for inp in tx_data["inputs"]:
                    if "prev_out" in inp:
                        input_value = inp["prev_out"].get("value", 0) / 1e8  # Satoshi zu BTC
                        total_input += input_value
                        tx_info["inputs"].append({
                            "address": inp["prev_out"].get("addr", "unknown"),
                            "value": input_value
                        })
                
                # Verarbeite Outputs und füge Kind-Transaktionen zur Queue hinzu
                total_output = 0
                for out in tx_data["out"]:
                    output_value = out.get("value", 0) / 1e8  # Satoshi zu BTC
                    total_output += output_value
                    tx_info["outputs"].append({
                        "address": out.get("addr", "unknown"),
                        "value": output_value
                    })
                    
                    # Prüfe auf nachfolgende Transaktionen (wenn vorhanden und zugänglich)
                    if "spent" in out and out["spent"] and "spending_outpoints" in out:
                        for spending in out.get("spending_outpoints", []):
                            if "tx_index" in spending and len(transactions) + len(tx_queue) < num_transactions:
                                # Hier müssten wir eigentlich den TX-Hash von spending_outpoints bekommen
                                # Da dies nicht immer direkt verfügbar ist, würden wir in der Praxis
                                # eine weitere API-Anfrage machen, um den Hash zu erhalten
                                pass
                
                tx_info["total_input"] = total_input
                tx_info["total_output"] = total_output
                
                transactions.append(tx_info)
                
            except Exception as e:
                logger.error(f"Fehler beim Verfolgen der BTC-Transaktion {current_tx_hash}: {e}")
        
        return transactions
    
    def track_ethereum_transactions(self, start_tx_hash: str, num_transactions: int) -> List[Dict]:
        """
        Verfolgt Ethereum-Transaktionen ausgehend von einer Starttransaktion.
        
        Args:
            start_tx_hash: Hash der Ausgangstransaktion
            num_transactions: Maximale Anzahl der zu verfolgenden Transaktionen
            
        Returns:
            List[Dict]: Liste von Transaktionsdaten
        """
        transactions = []
        processed_txs = set()
        tx_queue = [start_tx_hash]
        
        while tx_queue and len(transactions) < num_transactions:
            current_tx_hash = tx_queue.pop(0)
            
            if current_tx_hash in processed_txs:
                continue
                
            processed_txs.add(current_tx_hash)
            
            try:
                # Web3.py für ETH-Transaktionen
                tx_data = self.web3.eth.get_transaction(current_tx_hash)
                tx_receipt = self.web3.eth.get_transaction_receipt(current_tx_hash)
                
                # Extrahiere relevante Transaktionsdaten
                tx_info = {
                    "hash": current_tx_hash,
                    "currency": "ETH",
                    "timestamp": self._get_eth_block_timestamp(tx_data["blockNumber"]),
                    "from": tx_data["from"],
                    "to": tx_data["to"],
                    "value": self.web3.from_wei(tx_data["value"], "ether"),
                    "gas_used": tx_receipt["gasUsed"],
                    "gas_price": self.web3.from_wei(tx_data["gasPrice"], "gwei"),
                    "block_number": tx_data["blockNumber"]
                }
                
                # Berechne die Transaktionsgebühr
                tx_info["fee"] = tx_info["gas_used"] * tx_info["gas_price"] / 1e9  # Gwei zu ETH
                
                # Wenn Token-Transfer, versuche Token-Details zu extrahieren
                if tx_receipt.get("logs"):
                    for log in tx_receipt["logs"]:
                        # Prüfe auf ERC-20 Transfer-Event (topic0 = Transfer event signature)
                        if len(log["topics"]) >= 3 and log["topics"][0].hex() == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef":
                            tx_info["is_token_transfer"] = True
                            tx_info["token_contract"] = log["address"]
                            # Hier könnten weitere Token-Details abgerufen werden
                
                transactions.append(tx_info)
                
                # Füge nachfolgende Transaktionen von derselben Adresse zur Queue hinzu
                # Dies erfordert eine separate API-Anfrage an Etherscan
                if len(transactions) < num_transactions:
                    next_txs = self._get_next_eth_transactions(tx_info["to"], tx_info["block_number"])
                    for next_tx in next_txs[:min(5, num_transactions - len(transactions))]:
                        if next_tx not in processed_txs and next_tx not in tx_queue:
                            tx_queue.append(next_tx)
                
            except Exception as e:
                logger.error(f"Fehler beim Verfolgen der ETH-Transaktion {current_tx_hash}: {e}")
        
        return transactions
    
    def track_solana_transactions(self, start_tx_hash: str, num_transactions: int) -> List[Dict]:
        """
        Verfolgt Solana-Transaktionen ausgehend von einer Starttransaktion.
        
        Args:
            start_tx_hash: Hash der Ausgangstransaktion
            num_transactions: Maximale Anzahl der zu verfolgenden Transaktionen
            
        Returns:
            List[Dict]: Liste von Transaktionsdaten
        """
        transactions = []
        processed_txs = set()
        tx_queue = [start_tx_hash]
        
        while tx_queue and len(transactions) < num_transactions:
            current_tx_hash = tx_queue.pop(0)
            
            if current_tx_hash in processed_txs:
                continue
                
            processed_txs.add(current_tx_hash)
            
            try:
                # Solana RPC API für SOL-Transaktionen
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getTransaction",
                    "params": [
                        current_tx_hash,
                        {"encoding": "json", "maxSupportedTransactionVersion": 0}
                    ]
                }
                
                response = requests.post(SOLANA_RPC_API, json=payload)
                response.raise_for_status()
                result = response.json().get("result", {})
                
                if not result:
                    continue
                
                # Extrahiere relevante Transaktionsdaten
                tx_info = {
                    "hash": current_tx_hash,
                    "currency": "SOL",
                    "timestamp": result.get("blockTime", 0),
                    "fee": result.get("meta", {}).get("fee", 0) / 1e9,  # Lamports zu SOL
                    "slot": result.get("slot")
                }
                
                # Verarbeite Transaktionsdetails
                if "meta" in result and "postBalances" in result["meta"] and "preBalances" in result["meta"]:
                    account_keys = result.get("transaction", {}).get("message", {}).get("accountKeys", [])
                    pre_balances = result["meta"]["preBalances"]
                    post_balances = result["meta"]["postBalances"]
                    
                    tx_info["accounts"] = []
                    
                    for i, account in enumerate(account_keys):
                        if i < len(pre_balances) and i < len(post_balances):
                            balance_change = (post_balances[i] - pre_balances[i]) / 1e9  # Lamports zu SOL
                            tx_info["accounts"].append({
                                "address": account,
                                "pre_balance": pre_balances[i] / 1e9,
                                "post_balance": post_balances[i] / 1e9,
                                "change": balance_change
                            })
                
                # Extrahiere Informationen über Token-Transfers, falls vorhanden
                if "meta" in result and "postTokenBalances" in result["meta"] and "preTokenBalances" in result["meta"]:
                    pre_token = {item.get("accountIndex"): item for item in result["meta"]["preTokenBalances"]}
                    post_token = {item.get("accountIndex"): item for item in result["meta"]["postTokenBalances"]}
                    
                    tx_info["token_transfers"] = []
                    
                    # Identifiziere Token-Transfers durch Vergleich der Vor- und Nach-Balancen
                    all_indices = set(list(pre_token.keys()) + list(post_token.keys()))
                    for idx in all_indices:
                        pre = pre_token.get(idx, {"uiTokenAmount": {"amount": "0"}})
                        post = post_token.get(idx, {"uiTokenAmount": {"amount": "0"}})
                        
                        pre_amount = int(pre["uiTokenAmount"]["amount"])
                        post_amount = int(post["uiTokenAmount"]["amount"])
                        
                        if pre_amount != post_amount:
                            tx_info["token_transfers"].append({
                                "account_index": idx,
                                "mint": post.get("mint", pre.get("mint")),
                                "owner": post.get("owner", pre.get("owner")),
                                "pre_amount": pre_amount,
                                "post_amount": post_amount,
                                "change": post_amount - pre_amount,
                                "decimals": post.get("uiTokenAmount", {}).get("decimals", 
                                           pre.get("uiTokenAmount", {}).get("decimals", 0))
                            })
                
                transactions.append(tx_info)
                
                # Füge nachfolgende Transaktionen zur Queue hinzu
                if len(transactions) < num_transactions:
                    # In der Praxis würden wir hier nach Transaktionen suchen, die die Ausgabeadressen als Eingabe verwenden
                    # Das erfordert jedoch komplexere Abfragen und möglicherweise mehrere API-Aufrufe
                    pass
                
            except Exception as e:
                logger.error(f"Fehler beim Verfolgen der SOL-Transaktion {current_tx_hash}: {e}")
        
        return transactions
    
    def _get_eth_block_timestamp(self, block_number: int) -> int:
        """Holt den Timestamp eines Ethereum-Blocks"""
        try:
            block = self.web3.eth.get_block(block_number)
            return block.timestamp
        except Exception as e:
            logger.error(f"Fehler beim Abrufen des Block-Timestamps: {e}")
            return int(datetime.now().timestamp())
    
    def _get_next_eth_transactions(self, address: str, after_block: int) -> List[str]:
        """Holt die nächsten Transaktionen einer ETH-Adresse nach einem bestimmten Block"""
        try:
            url = ETHERSCAN_API_BASE
            params = {
                "module": "account",
                "action": "txlist",
                "address": address,
                "startblock": after_block + 1,
                "endblock": 99999999,
                "sort": "asc",
                "apikey": self.api_keys.get("etherscan", "")
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data["status"] == "1" and "result" in data:
                return [tx["hash"] for tx in data["result"][:5]]
            return []
            
        except Exception as e:
            logger.error(f"Fehler beim Abrufen der nächsten ETH-Transaktionen: {e}")
            return []
    
    def track_transactions(self, start_tx_hash: str, target_currency: str, num_transactions: int) -> Dict:
        """
        Hauptmethode zur Verfolgung von Kryptowährungs-Transaktionen und Konvertierung der Werte.
        
        Args:
            start_tx_hash: Hash der Ausgangstransaktion
            target_currency: Zielwährung für die Konversion (BTC, ETH, SOL)
            num_transactions: Anzahl der zu verfolgenden Transaktionen
            
        Returns:
            Dict: Strukturierte Daten mit Transaktionen und konvertierten Werten
        """
        # Bestimme die Währung der Ausgangstransaktion
        source_currency = self._detect_transaction_currency(start_tx_hash)
        
        if not source_currency:
            raise ValueError(f"Konnte Währung für Transaktion {start_tx_hash} nicht ermitteln")
        
        # Verfolge Transaktionen je nach Währung
        if source_currency == "BTC":
            raw_transactions = self.track_bitcoin_transactions(start_tx_hash, num_transactions)
        elif source_currency == "ETH":
            raw_transactions = self.track_ethereum_transactions(start_tx_hash, num_transactions)
        elif source_currency == "SOL":
            raw_transactions = self.track_solana_transactions(start_tx_hash, num_transactions)
        else:
            raise ValueError(f"Nicht unterstützte Währung: {source_currency}")
        
        # Konvertiere Werte in die Zielwährung
        converted_transactions = []
        
        for tx in raw_transactions:
            converted_tx = tx.copy()
            
            # Timestamp für die Umrechnung
            timestamp = tx.get("timestamp", int(datetime.now().timestamp()))
            
            # Konvertiere Gebühren
            if "fee" in tx:
                rate = self.get_historical_exchange_rate(tx["currency"], target_currency, timestamp)
                converted_tx["fee_converted"] = tx["fee"] * rate
            
            # Konvertiere Werte je nach Transaktionstyp
            if tx["currency"] == "BTC":
                for i, inp in enumerate(tx.get("inputs", [])):
                    rate = self.get_historical_exchange_rate("BTC", target_currency, timestamp)
                    converted_tx["inputs"][i]["value_converted"] = inp["value"] * rate
                
                for i, out in enumerate(tx.get("outputs", [])):
                    rate = self.get_historical_exchange_rate("BTC", target_currency, timestamp)
                    converted_tx["outputs"][i]["value_converted"] = out["value"] * rate
                    
                if "total_input" in tx:
                    converted_tx["total_input_converted"] = tx["total_input"] * rate
                if "total_output" in tx:
                    converted_tx["total_output_converted"] = tx["total_output"] * rate
                
            elif tx["currency"] == "ETH":
                if "value" in tx:
                    rate = self.get_historical_exchange_rate("ETH", target_currency, timestamp)
                    converted_tx["value_converted"] = tx["value"] * rate
                
            elif tx["currency"] == "SOL":
                for i, acc in enumerate(tx.get("accounts", [])):
                    if "change" in acc:
                        rate = self.get_historical_exchange_rate("SOL", target_currency, timestamp)
                        converted_tx["accounts"][i]["change_converted"] = acc["change"] * rate
                
                for i, token in enumerate(tx.get("token_transfers", [])):
                    # Hier müssten wir eigentlich den Token identifizieren und den richtigen Umrechnungskurs verwenden
                    # Für Einfachheit nehmen wir an, dass es sich um SOL-Token handelt
                    if "change" in token:
                        rate = self.get_historical_exchange_rate("SOL", target_currency, timestamp)
                        converted_tx["token_transfers"][i]["change_converted"] = token["change"] * rate / (10 ** token.get("decimals", 0))
            
            # Füge die Transaktionsrichtung hinzu (für die Visualisierung)
            converted_tx["direction"] = self._determine_transaction_direction(tx)
            
            converted_transactions.append(converted_tx)
        
        # Erstelle die Ausgabestruktur
        result = {
            "start_transaction": start_tx_hash,
            "source_currency": source_currency,
            "target_currency": target_currency,
            "transactions_count": len(converted_transactions),
            "transactions": converted_transactions,
            "tracking_timestamp": int(datetime.now().timestamp())
        }
        
        return result
    
    def _detect_transaction_currency(self, tx_hash: str) -> Optional[str]:
        """
        Versucht, die Währung einer Transaktion anhand des Hash-Formats zu erkennen.
        In der Praxis sollten hier robustere Methoden verwendet werden.
        
        Args:
            tx_hash: Hash der Transaktion
            
        Returns:
            Optional[str]: Erkannte Währung (BTC, ETH, SOL) oder None
        """
        # Einfache Heuristik basierend auf Hash-Länge und Präfix
        if len(tx_hash) == 64:  # 32 Bytes als Hex
            try:
                # Versuche als BTC-Tx zu identifizieren
                url = f"{BLOCKCHAIN_INFO_API_BASE}/rawtx/{tx_hash}"
                btc_response = requests.get(url)
                if btc_response.status_code == 200:
                    return "BTC"
            except:
                pass
                
            try:
                # Versuche als ETH-Tx zu identifizieren
                if self.web3.eth.get_transaction(tx_hash):
                    return "ETH"
            except:
                pass
                
        if len(tx_hash) >= 87 and len(tx_hash) <= 89:  # Typische Base58-Länge für Solana
            try:
                # Versuche als SOL-Tx zu identifizieren
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getTransaction",
                    "params": [tx_hash, {"encoding": "json"}]
                }
                sol_response = requests.post(SOLANA_RPC_API, json=payload)
                sol_data = sol_response.json()
                if "result" in sol_data and sol_data["result"]:
                    return "SOL"
            except:
                pass
        
        return None
    
    def _determine_transaction_direction(self, tx: Dict) -> str:
        """
        Bestimmt die Richtung einer Transaktion für die Visualisierung.
        
        Args:
            tx: Transaktionsdaten
            
        Returns:
            str: Richtung der Transaktion (in, out, self, unknown)
        """
        # BTC-Transaktion
        if tx["currency"] == "BTC":
            if len(tx.get("inputs", [])) == 1 and len(tx.get("outputs", [])) > 1:
                return "out"  # Aufteilung in mehrere Outputs
            elif len(tx.get("inputs", [])) > 1 and len(tx.get("outputs", [])) == 1:
                return "in"   # Zusammenführung mehrerer Inputs
            elif len(tx.get("inputs", [])) == 1 and len(tx.get("outputs", [])) == 1:
                input_addr = tx["inputs"][0].get("address", "")
                output_addr = tx["outputs"][0].get("address", "")
                if input_addr == output_addr:
                    return "self"  # Selbsttransaktion
                else:
                    return "direct"  # Direkte Überweisung
            else:
                return "complex"  # Komplexe Transaktion
        
        # ETH-Transaktion
        elif tx["currency"] == "ETH":
            if tx.get("from") == tx.get("to"):
                return "self"
            elif tx.get("is_token_transfer", False):
                return "token"
            else:
                return "direct"
        
        # SOL-Transaktion
        elif tx["currency"] == "SOL":
            if tx.get("token_transfers"):
                return "token"
            
            # Bestimme Richtung basierend auf Kontoänderungen
            positive_changes = 0
            negative_changes = 0
            for acc in tx.get("accounts", []):
                change = acc.get("change", 0)
                if change > 0:
                    positive_changes += 1
                elif change < 0:
                    negative_changes += 1
            
            if positive_changes == 1 and negative_changes == 1:
                return "direct"
            elif negative_changes > 1 and positive_changes == 1:
                return "in"
            elif negative_changes == 1 and positive_changes > 1:
                return "out"
            else:
                return "complex"
        
        return "unknown"