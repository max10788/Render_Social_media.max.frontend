# app/core/crypto_tracker.py
import asyncio
import logging
from typing import Dict, List, Optional, Union
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.exceptions import APIError, TransactionNotFoundError
import abc
import re

logger = logging.getLogger(__name__)

# =============================
# 🔹 Enums & Models
# =============================

class Currency(Enum):
    ETH = "ETH"
    SOL = "SOL"
    BTC = "BTC"
    USD = "USD"

@dataclass
class Transaction:
    hash: str
    from_address: str
    to_address: str
    amount: float
    fee: float
    timestamp: int
    currency: Currency
    direction: str
    block_number: Optional[int] = None
    gas_price: Optional[float] = None

    def to_dict(self) -> Dict:
        result = asdict(self)
        result['currency'] = self.currency.value
        return result

@dataclass
class TrackingResult:
    transactions: List[Transaction]
    source_currency: Currency
    target_currency: Currency
    start_transaction: str
    transactions_count: int
    tracking_timestamp: int
    exchange_rate: Optional[float] = None

    def to_dict(self) -> Dict:
        return {
            "transactions": [tx.to_dict() for tx in self.transactions],
            "source_currency": self.source_currency.value,
            "target_currency": self.target_currency.value,
            "start_transaction": self.start_transaction,
            "transactions_count": self.transactions_count,
            "tracking_timestamp": self.tracking_timestamp,
            "exchange_rate": self.exchange_rate
        }

# =============================
# 🔍 Validator
# =============================

class TransactionHashValidator:
    @staticmethod
    def detect_currency(tx_hash: str) -> Optional[Currency]:
        if re.fullmatch(r"^0x[a-fA-F0-9]{64}$", tx_hash):
            return Currency.ETH
        elif re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{43,88}", tx_hash):
            # Fallback validation via base58 check
            try:
                import base58
                decoded = base58.b58decode(tx_hash)
                if len(decoded) == 64 or len(decoded) == 87:
                    return Currency.SOL
            except Exception:
                pass
        return None

    @staticmethod
    def is_valid_solana_signature(signature: str) -> bool:
        try:
            import base58
            decoded = base58.b58decode(signature)
            return len(decoded) == 64
        except Exception:
            return False

# =============================
# 🧩 Protokolle / Schnittstellen
# =============================

class BlockchainClient(abc.ABC):
    @abc.abstractmethod
    async def get_transaction(self, tx_hash: str) -> Optional[Transaction]:
        ...

    @abc.abstractmethod
    async def find_next_transaction(self, address: str) -> Optional[Transaction]:
        ...

    @abc.abstractmethod
    def detect_currency(self, tx_hash: str) -> bool:
        ...

class ExchangeRateProvider(abc.ABC):
    @abc.abstractmethod
    async def get_rate(self, source: Currency, target: Currency) -> float:
        ...

class CacheProvider(abc.ABC):
    @abc.abstractmethod
    async def get(self, key: str) -> Optional[Dict]:
        ...

    @abc.abstractmethod
    async def set(self, key: str, value: Dict, ttl: int = 3600) -> None:
        ...

# =============================
# 🧠 Implementierungen
# =============================

class InMemoryCache(CacheProvider):
    def __init__(self):
        self._cache = {}
        self._timestamps = {}

    async def get(self, key: str) -> Optional[Dict]:
        if key in self._cache:
            if datetime.now().timestamp() - self._timestamps[key] < 3600:
                return self._cache[key]
            else:
                del self._cache[key]
                del self._timestamps[key]
        return None

    async def set(self, key: str, value: Dict, ttl: int = 3600) -> None:
        self._cache[key] = value
        self._timestamps[key] = datetime.now().timestamp()

class CoinGeckoExchangeRate(ExchangeRateProvider):
    def __init__(
        self, api_key: Optional[str] = None, session: Optional[aiohttp.ClientSession] = None
    ):
        self.api_key = api_key
        self.session = session
        self.currency_map = {
            Currency.ETH: "ethereum",
            Currency.SOL: "solana",
            Currency.BTC: "bitcoin",
            Currency.USD: "usd"
        }

    async def get_rate(self, source: Currency, target: Currency) -> float:
        if source == target:
            return 1.0
        if not self.session:
            raise APIError("HTTP session not available")
        source_id = self.currency_map.get(source)
        target_id = self.currency_map.get(target)
        if not source_id or not target_id:
            raise ValueError(f"Unsupported currency pair: {source}-{target}")
        url = "https://api.coingecko.com/api/v3/simple/price "
        params = {
            "ids": source_id,
            "vs_currencies": target_id.lower()
        }
        if self.api_key:
            params["x_cg_demo_api_key"] = self.api_key
        try:
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"CoinGecko API error: {response.status} - {error_text}")
                    raise APIError(f"CoinGecko API error: {response.status}")
                data = await response.json()
                if not data or source_id not in data:
                    raise APIError("Invalid response from CoinGecko")
                rate = data[source_id].get(target_id.lower())
                if not rate:
                    raise APIError(f"Exchange rate not found for {source}-{target}")
                return float(rate)
        except Exception as e:
            logger.error(f"Error fetching exchange rate: {e}")
            raise APIError(f"Failed to fetch exchange rate: {str(e)}")

# =============================
# 🚀 Hauptklasse: CryptoTrackingService
# =============================

class CryptoTrackingService:
    def __init__(
        self,
        ethereum_client: Optional[BlockchainClient] = None,
        solana_client: Optional[BlockchainClient] = None,
        exchange_rate_provider: Optional[ExchangeRateProvider] = None,
        cache_provider: Optional[CacheProvider] = None,
        api_keys: Optional[Dict[str, str]] = None
    ):
        self.ethereum_client = ethereum_client
        self.solana_client = solana_client
        self.exchange_rate_provider = exchange_rate_provider
        self.cache = cache_provider or InMemoryCache()
        self.api_keys = api_keys or {}
        self.session: Optional[aiohttp.ClientSession] = None
        self.validator = TransactionHashValidator()

    @asynccontextmanager
    async def get_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()
        try:
            yield self.session
        finally:
            # Wir schließen den Session nicht automatisch, damit er wiederverwendet werden kann
            pass

    async def track_transaction_chain(
        self,
        start_tx_hash: str,
        target_currency: Union[str, Currency],
        num_transactions: int = 10,
        max_retries: int = 3
    ) -> TrackingResult:
        if isinstance(target_currency, str):
            try:
                target_currency = Currency[target_currency.upper()]
            except KeyError:
                raise ValueError(f"Unsupported target currency: {target_currency}")

        source_currency = self.validator.detect_currency(start_tx_hash)
        if not source_currency:
            raise ValueError(f"Cannot detect currency for transaction hash: {start_tx_hash}")

        async with self.get_session() as session:
            if not self.ethereum_client and source_currency == Currency.ETH:
                from .ethereum_client import EthereumClient
                self.ethereum_client = EthereumClient(session)

            if not self.solana_client and source_currency == Currency.SOL:
                from .solana_client import SolanaClient
                self.solana_client = SolanaClient(session)

            if not self.exchange_rate_provider and source_currency != target_currency:
                self.exchange_rate_provider = CoinGeckoExchangeRate(
                    api_key=self.api_keys.get("coingecko"),
                    session=session
                )

            transactions = await self._get_transaction_chain(
                start_tx_hash=start_tx_hash,
                currency=source_currency,
                num_transactions=num_transactions,
                max_retries=max_retries
            )

            if not transactions:
                raise TransactionNotFoundError(f"No transactions found for {start_tx_hash}")

            exchange_rate = None
            if source_currency != target_currency and self.exchange_rate_provider:
                exchange_rate = await self.exchange_rate_provider.get_rate(source_currency, target_currency)
                transactions = self._convert_transaction_values(transactions, exchange_rate)

            return TrackingResult(
                transactions=transactions,
                source_currency=source_currency,
                target_currency=target_currency,
                start_transaction=start_tx_hash,
                transactions_count=len(transactions),
                tracking_timestamp=int(datetime.now().timestamp()),
                exchange_rate=exchange_rate
            )

    async def _get_transaction_chain(
        self,
        start_tx_hash: str,
        currency: Currency,
        num_transactions: int,
        max_retries: int
    ) -> List[Transaction]:
        client = self._get_client_for_currency(currency)
        if not client:
            raise ValueError(f"No client available for {currency}")

        transactions = []
        current_tx_hash = start_tx_hash
        processed_hashes = set()

        for i in range(num_transactions):
            if current_tx_hash in processed_hashes:
                logger.warning(f"Loop detected at transaction {i}, breaking chain")
                break
            processed_hashes.add(current_tx_hash)

            tx = await self._fetch_with_retries(client.get_transaction, current_tx_hash, max_retries)
            if not tx:
                logger.warning(f"Could not fetch transaction for {current_tx_hash}")
                break

            transactions.append(tx)
            next_tx = await self._fetch_with_retries(client.find_next_transaction, tx.to_address, max_retries)
            if not next_tx:
                logger.info(f"No more transactions after {current_tx_hash}")
                break

            current_tx_hash = next_tx.hash

        return transactions

    def _get_client_for_currency(self, currency: Currency) -> Optional[BlockchainClient]:
        if currency == Currency.ETH and self.ethereum_client:
            return self.ethereum_client
        elif currency == Currency.SOL and self.solana_client:
            return self.solana_client
        return None

    async def _fetch_with_retries(self, func, *args, max_retries: int = 3) -> Optional[Dict]:
        last_exception = None
        for attempt in range(max_retries + 1):
            try:
                result = await func(*args)
                if result:
                    return result
            except Exception as e:
                last_exception = e
                if attempt < max_retries:
                    wait_time = 2 ** attempt
                    logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"All {max_retries + 1} attempts failed: {e}")
        if last_exception:
            raise last_exception
        return None

    def _convert_transaction_values(
        self,
        transactions: List[Transaction],
        exchange_rate: float
    ) -> List[Transaction]:
        for tx in transactions:
            tx.amount = round(float(tx.amount) * exchange_rate, 6)
            tx.fee = round(float(tx.fee) * exchange_rate, 6)
        return transactions
