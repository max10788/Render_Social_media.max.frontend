# app/core/backend_crypto_tracker/processor/btc_parser.py
import logging
from datetime import datetime
from typing import List, Dict, Any
from app.core.backend_crypto_tracker.utils.logger import get_logger

logger = get_logger(__name__)

class BTCParser:
    def _parse_transaction(self, raw_data):
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

    def _get_next_transactions(self, address, current_hash, limit):
        """Holt nächste BTC-Transaktionen (Dummy-Implementierung)"""
        logger.info("BTC: Hole nächste Transaktionen (Dummy)")
        # In einer echten Implementierung würden wir eine API aufrufen
        # z.B. client = BlockchairBTCClient(); return client.get_transactions(address, after_hash=current_hash, limit=limit)
        return []
