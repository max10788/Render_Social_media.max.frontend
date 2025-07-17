from datetime import datetime
from decimal import Decimal
from functools import wraps
from typing import Any, Dict, List, Optional

import json
import asyncio
import httpx
import logging
import time

from app.core.config import SolanaConfig
from app.core.solana_tracker.models.base_models import (
    TransactionDetail,
    TransactionMessageDetail,
    TransactionMetaDetail
)
from app.core.solana_tracker.utils.enhanced_retry_utils import (
    EnhancedRetryError,
    RateLimitBackoff,
    enhanced_retry_with_backoff,
)
from app.core.solana_tracker.utils.rate_limit_metrics import RateLimitMonitor
from app.core.solana_tracker.utils.rpc_endpoint_manager import RpcEndpointManager

logger = logging.getLogger(__name__)

# Erstelle eine globale Konfiguration aus den Umgebungsvariablen
solana_config = SolanaConfig()

class EnhancedSolanaRepository:
    def __init__(self, config: SolanaConfig):
        self.config = config
        self.current_rpc_url = self.config.primary_rpc_url
        self.fallback_rpc_urls = self.config.fallback_rpc_urls or []
        self.client = httpx.AsyncClient()
        self.semaphore = asyncio.Semaphore(self.config.rate_limit_rate)
        self.last_request_time = 0
        self.request_count = 0
        self.monitor = RateLimitMonitor()

        # ✅ Füge diesen Eintrag hinzu
        self.logger = logging.getLogger(__name__)  # oder ein übergebenes logger-Objekt
        
        # Rate Limit Config verarbeiten
        if isinstance(self.config.rate_limit_capacity, int):
            self.rate_limit_config = {
                "rate": self.config.rate_limit_capacity,
                "capacity": 100
            }
        else:
            try:
                parsed_capacity = int(self.config.rate_limit_capacity)
                self.rate_limit_config = {"rate": parsed_capacity, "capacity": 100}
            except (ValueError, TypeError):
                self.rate_limit_config = {
                    "rate": 50,
                    "capacity": 100
                }

        self.endpoint_manager = RpcEndpointManager(
            primary_url=self.config.primary_rpc_url,
            fallback_urls=self.config.fallback_rpc_urls
        )

    async def start(self):
        """Start background services like health checks."""
        await self.endpoint_manager.start()

    async def stop(self):
        """Stop background services."""
        await self.endpoint_manager.stop()

    @staticmethod
    def retry_with_exponential_backoff(max_retries=3, initial_delay=1):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                retries = 0
                while retries < max_retries:
                    try:
                        return await func(*args, **kwargs)
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code == 429:
                            delay = initial_delay * (2 ** retries)
                            logger.warning(f"Rate limited. Retrying in {delay} seconds...")
                            time.sleep(delay)
                            retries += 1
                        else:
                            raise
                logger.error(f"Max retries ({max_retries}) reached for {func.__name__}")
                raise
            return wrapper
        return decorator

    @retry_with_exponential_backoff(max_retries=5, initial_delay=2)
    async def _make_rpc_call(self, method: str, params: list) -> Optional[Dict[str, Any]]:
        """Sichere RPC-Anfrage mit Fallback-URLs und detailliertem Logging."""
        urls = [self.current_rpc_url] + self.fallback_rpc_urls
        
        for url in urls:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        url,
                        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
                    )
                    response.raise_for_status()
                    
                    result = response.json().get("result")
                    if not result:
                        self.logger.warning(f"Leere Antwort von {url} für {method}")
                        continue
                    
                    return result
                    
            except httpx.HTTPError as e:
                self.logger.error(f"HTTP-Fehler bei {url}: {str(e)}")
                continue
        
        self.logger.error("Alle RPC-Endpunkte sind nicht erreichbar")
        return None
        
    def _log_transaction_details(self, tx_result: Dict[str, Any]) -> None:
        """
        Loggt detaillierte Transaktionsinformationen.
        """
        try:
            # Extrahiere wichtige Informationen
            signatures = tx_result.get("transaction", {}).get("signatures", [])
            block_time = tx_result.get("blockTime")
            slot = tx_result.get("slot")
            
            # Balance Änderungen
            meta = tx_result.get("meta", {})
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            
            # Account Keys
            message = tx_result.get("transaction", {}).get("message", {})
            account_keys = message.get("accountKeys", [])
            
            # Instructions
            instructions = message.get("instructions", [])
            
            # Logge strukturierte Informationen
            log_data = {
                "transaction_details": {
                    "signatures": signatures,
                    "block_time": datetime.fromtimestamp(block_time).isoformat() if block_time else None,
                    "slot": slot,
                    "accounts_involved": len(account_keys),
                    "instruction_count": len(instructions),
                    "balance_changes": []
                }
            }
            
            # Füge Balance-Änderungen hinzu
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                if i < len(account_keys):
                    change = post - pre
                    if abs(change) > 5000:  # Nur signifikante Änderungen
                        log_data["transaction_details"]["balance_changes"].append({
                            "account": account_keys[i],
                            "pre_balance": pre / 1e9,  # Konvertiere zu SOL
                            "post_balance": post / 1e9,
                            "change": change / 1e9
                        })
            
            # Logge Programm-Interaktionen
            program_interactions = []
            for instr in instructions:
                if "programIdIndex" in instr and instr["programIdIndex"] < len(account_keys):
                    program_id = account_keys[instr["programIdIndex"]]
                    program_interactions.append(program_id)
            
            log_data["transaction_details"]["program_interactions"] = program_interactions
            
            # Logge das Ergebnis
            logger.info(f"Detailed transaction data: {json.dumps(log_data, indent=2)}")
            
            # Logge zusätzliche wichtige Ereignisse
            if meta.get("err"):
                logger.warning(f"Transaction error detected: {meta['err']}")
            
            if len(signatures) > 1:
                logger.info(f"Multi-signature transaction detected with {len(signatures)} signatures")
                
        except Exception as e:
            logger.error(f"Error logging transaction details: {e}")
            
    async def get_transaction(self, tx_hash: str) -> Optional[TransactionDetail]:
        try:
            raw_result = await self._make_rpc_call("getTransaction", [tx_hash, {
                "maxSupportedTransactionVersion": 0,
                "encoding": "json"
            }])
            if not raw_result:
                return None
    
            return self._build_transaction_graph_data(raw_result)
        except Exception as e:
            self.logger.error(f"Error fetching or processing transaction {tx_hash}: {str(e)}")
            return None

    async def get_signatures_for_address(
        self,
        address: str,
        limit: int = 10
    ) -> Optional[List[Dict[str, Any]]]:
        try:
            result = await self._make_rpc_call(
                "getSignaturesForAddress",
                [address, {"limit": limit}]
            )
            return result
        except Exception as e:
            logger.error(f"Error fetching signatures for {address}: {e}")
            return None

    async def get_balance(self, address: str) -> Optional[int]:
        try:
            result = await self._make_rpc_call("getBalance", [address])
            return result.get("value") if result else None
        except Exception as e:
            logger.error(f"Error fetching balance for {address}: {e}")
            return None

    async def get_transactions_for_address(
        self,
        address: str,
        before: Optional[str] = None,
        limit: int = 10
    ) -> List[TransactionDetail]:
        """
        Holt Transaktionen für eine bestimmte Adresse.
        """
        try:
            params = [
                address,
                {
                    "limit": limit,
                    "maxSupportedTransactionVersion": 0
                }
            ]
            if before:
                params[1]["before"] = before

            signatures = await self._make_rpc_call(
                "getSignaturesForAddress",
                params
            )

            if not signatures:
                return []

            transactions = []
            for sig_info in signatures:
                tx_hash = sig_info.get("signature")
                if tx_hash:
                    tx_detail = await self.get_transaction(tx_hash)
                    if tx_detail:
                        transactions.append(tx_detail)

            return transactions

        except Exception as e:
            logger.error(f"Error fetching transactions for address {address}: {e}")
            return []

    def _extract_transfers(self, tx_detail: Dict) -> List[Dict]:
        """Extrahiert Transfers mit Fallback-Werten für fehlende Daten."""
        transfers = []
        try:
            meta = tx_detail.get("meta", {})
            pre_balances = meta.get("pre_balances", [])
            post_balances = meta.get("post_balances", [])
            account_keys = tx_detail.get("transaction", {}).get("message", {}).get("accountKeys", [])
            
            # Fallback für fehlende accountKeys
            if not account_keys:
                logger.warning("Transaktion enthält keine accountKeys. Setze Platzhalter ein.")
                return [{"from": "Unbekannt", "to": "Ziel", "amount": Decimal("0")}]
            
            # Finde Sender (negativer Betrag)
            sender_index = None
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                if post - pre < 0:  # Sender
                    sender_index = i
                    break
            
            # Fallback für fehlenden Sender
            if sender_index is None:
                logger.warning("Kein Sender gefunden. Setze Platzhalter ein.")
                return [{"from": "Unbekannt", "to": "Ziel", "amount": Decimal("0")}]
    
            # Finde Empfänger (positiver Betrag)
            for i, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                if i != sender_index and post - pre > 0:  # Empfänger
                    transfers.append({
                        "from": account_keys[sender_index],
                        "to": account_keys[i],
                        "amount": Decimal(abs(post - pre)) / Decimal(1e9)
                    })
                    break
            
            # Fallback für fehlende Empfänger
            if not transfers:
                logger.warning("Keine Empfänger gefunden. Setze Platzhalter ein.")
                transfers.append({
                    "from": account_keys[sender_index],
                    "to": "Ziel",
                    "amount": Decimal("0")
                })
                    
        except Exception as e:
            logger.error("Fehler beim Extrahieren von Transfers: %s", str(e))
            transfers = [{"from": "Fehler", "to": "Fehler", "amount": Decimal("0")}]
        
        return transfers

    def _extract_balance_changes(self, tx_detail: Dict) -> List[Dict]:
        """Extrahiert Balance-Änderungen aus Transaktionsdetails mit Fallback-Werten."""
        try:
            meta = tx_detail.get("meta", {})
            pre_balances = meta.get("pre_balances", [])
            post_balances = meta.get("post_balances", [])
            account_keys = tx_detail.get("transaction", {}).get("message", {}).get("accountKeys", [])
            
            # Fallback für fehlende accountKeys
            if not account_keys:
                logger.warning("Transaktion enthält keine accountKeys. Setze Platzhalter ein.")
                return []
            
            changes = []
            for idx, (pre, post) in enumerate(zip(pre_balances, post_balances)):
                if idx >= len(account_keys):
                    continue
                change = post - pre
                if change != 0:
                    changes.append({
                        "account": account_keys[idx],
                        "change": Decimal(change) / Decimal(1e9),
                        "pre_balance": Decimal(pre) / Decimal(1e9),
                        "post_balance": Decimal(post) / Decimal(1e9)
                    })
            return changes
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren von Balance-Änderungen: {str(e)}")
            return []

    def _build_transaction_graph_data(self, transaction_detail: dict) -> Optional[dict]:
        """
        Baut strukturierte Graph-Daten für D3.js basierend auf Transaktionsdetails.
        """
        tx_hash = transaction_detail.get("transaction", {}).get("signatures", [""])[0]
        block_time = transaction_detail.get("blockTime")
        message = transaction_detail.get("transaction", {}).get("message", {})
        account_keys = message.get("accountKeys", [])
        from_wallet = account_keys[0] if account_keys else None

        balance_changes = self._extract_balance_changes(transaction_detail)

        if not balance_changes:
            self.logger.warning(f"Keine Balance-Änderungen für Transaktion {tx_hash}")
            return None

        return {
            "signature": tx_hash,
            "block_time": block_time,
            "from_wallet": from_wallet,
            "balance_changes": balance_changes
        }

    def _log_transaction_details(self, tx_result: Dict[str, Any]) -> None:
        try:
            meta = tx_result.get('result', {}).get('meta', {})
            pre_balances = meta.get('pre_balances', [])
            post_balances = meta.get('post_balances', [])
            account_keys = tx_result.get('result', {}).get('transaction', {}).get('message', {}).get('accountKeys', [])
            
            logger.info("Transaktionsdetails:")
            logger.info(f"accountKeys: {account_keys or 'Fehlend'}")
            logger.info(f"pre_balances: {pre_balances}")
            logger.info(f"post_balances: {post_balances}")
            
            for idx, pubkey in enumerate(account_keys):
                if idx >= len(pre_balances) or idx >= len(post_balances):
                    logger.warning(f"Index {idx} außerhalb der Balancelisten")
                    continue
                change = post_balances[idx] - pre_balances[idx]
                if change != 0:
                    logger.info(f"Konto: {pubkey} | Vorher: {pre_balances[idx]/1e9:.9f} SOL | Nachher: {post_balances[idx]/1e9:.9f} SOL | Änderung: {change/1e9:.9f} SOL")
        except Exception as e:
            logger.error(f"Fehler beim Loggen der Transaktionsdetails: {str(e)}")

# Instanz erstellen
repository = EnhancedSolanaRepository(config=solana_config)
