from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, validator
from decimal import Decimal

class BaseTransaction(BaseModel):
    """Base Transaction DTO with common fields."""
    tx_hash: str = Field(..., description="Transaction signature/hash")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    
    @validator('tx_hash')
    def validate_tx_hash(cls, v):
        if not v or len(v) < 32:
            raise ValueError("Transaction hash must be at least 32 characters")
        return v

    class Config:
        allow_population_by_field_name = True

class TransactionMessageDetail(BaseModel):
    accountKeys: List[str] = Field(default_factory=list)
    recentBlockhash: str = Field(default="", description="Letzter Blockhash für die Transaktion")  # [[2]]
    instructions: List[InstructionDetail] = Field(default_factory=list)
    header: Dict[str, Any] = Field(default_factory=dict)
    addressTableLookups: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Address Lookup Table Einträge")  # [[4]]

    class Config:
        arbitrary_types_allowed = True
        allow_population_by_field_name = True

class TransactionMetaDetail(BaseModel):
    fee: int = Field(default=0, description="Transaktionsgebühr in Lamports")  # [[5]]
    pre_balances: List[int] = Field(default_factory=list, alias="preBalances")
    post_balances: List[int] = Field(default_factory=list, alias="postBalances")
    preTokenBalances: List[TokenBalanceDetail] = Field(default_factory=list, description="Token-Salden vor der Transaktion")  # [[4]]
    postTokenBalances: List[TokenBalanceDetail] = Field(default_factory=list, description="Token-Salden nach der Transaktion")  # [[4]]
    inner_instructions: Optional[List[Dict[str, Any]]] = Field(default_factory=list, alias="innerInstructions")
    log_messages: Optional[List[str]] = Field(default_factory=list, alias="logMessages", description="Programm-Log-Nachrichten (z.B. 'Instruction: TransferChecked')")  # [[4]]
    err: Optional[Dict[str, Any]] = Field(default=None, description="Fehlerdetails der Transaktion")
    available_signatures: Optional[int] = Field(default=None)
    computeUnitsConsumed: Optional[int] = Field(default=None, description="Verbrauchte Compute Units")  # [[4]]
    loadedAddresses: Dict[str, List[str]] = Field(default_factory=lambda: {"readonly": [], "writable": []}, description="Externe Adressen für Lese-/Schreibzugriff")  # [[4]]
    status: Dict[str, Any] = Field(default={"Ok": None}, description="Transaktionsstatus (z.B. {'Ok': None})")  # [[4]]
    rewards: Optional[List[Dict[str, Any]]] = Field(default_factory=list)  # [[4]]

    class Config:
        allow_population_by_field_name = True


class TransactionDetail(BaseModel):
    signatures: List[str] = Field(default_factory=list)
    message: Optional[TransactionMessageDetail] = None
    slot: Optional[int] = None
    meta: Optional[TransactionMetaDetail] = None
    block_time: Optional[int] = Field(default=None, description="Unix-Zeitstempel der Transaktion")  # [[8]]
    signature: str = Field(default="")
    transaction: Optional[Dict[str, Any]] = None

    @property
    def human_readable_time(self) -> Optional[str]:
        if self.block_time is not None:
            return datetime.fromtimestamp(self.block_time, tz=timezone.utc).isoformat()
        return None

    @property
    def account_keys(self) -> list:
        if self.message and hasattr(self.message, "accountKeys"):
            return self.message.accountKeys
        return []
        
    @property
    def tx_hash(self) -> str:
        """Get the transaction hash from signatures or signature."""
        if self.signatures and len(self.signatures) > 0:
            return self.signatures[0]
        return self.signature

    @property
    def timestamp(self) -> datetime:
        """Get transaction timestamp from block_time."""
        if self.block_time is not None:
            return datetime.fromtimestamp(self.block_time, tz=timezone.utc)
        return datetime.utcnow()

    @property
    def required_signatures(self) -> int:
        """Get the number of required signatures for this transaction."""
        if self.message and hasattr(self.message, "header"):
            return self.message.header.get("numRequiredSignatures", 0)
        return 0
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: str
        }

    def parse_raw_transaction(self) -> None:
        """Parse raw transaction data into structured format."""
        if self.transaction and isinstance(self.transaction, dict):
            message_data = self.transaction.get('message', {})
            if message_data:
                self.message = TransactionMessageDetail(**message_data)
            meta_data = self.transaction.get('meta', {})
            if meta_data:
                self.meta = TransactionMetaDetail(**meta_data)
            self.block_time = self.transaction.get('blockTime')  # [[8]]

    def get_multi_sig_info(self) -> Dict[str, Any]:
        """Get multi-signature configuration details."""
        if not self.is_multi_sig:
            return {}
        return self.multi_sig_config or {}

    def has_error(self) -> bool:
        """Check if transaction has any errors."""
        return bool(self.error_details) or (
            self.meta and self.meta.err is not None
        )

    def get_fee(self) -> int:
        """Get transaction fee in lamports."""
        return self.meta.fee if self.meta else 0

    def get_status(self) -> str:
        """Get transaction status."""
        if self.has_error():
            return "failed"
        if not self.slot:
            return "pending"
        return "confirmed"

class TransferAmount(BaseModel):
    """Transfer amount details."""
    amount: Decimal = Field(..., ge=0)
    currency: str = Field(..., regex="^(SOL|SPL)$")
    decimal_places: int = Field(default=9)

    @validator('decimal_places')
    def validate_decimals(cls, v: int) -> int:
        if v < 0 or v > 18:
            raise ValueError("Decimal places must be between 0 and 18")
        return v

    class Config:
        json_encoders = {
            Decimal: str
        }

class TrackedTransaction(BaseModel):
    tx_hash: str
    from_wallet: str
    to_wallet: Optional[str] = None
    amount: Decimal
    timestamp: datetime
    value_in_target_currency: Optional[Decimal] = None
    status: str = Field(
        default="pending",
        description="Transaction status"
    )
    remaining_amount: Optional[Decimal] = None
    scenario_type: Optional[str] = None
    
    # Multi-Sig spezifische Felder
    is_multi_sig: bool = Field(default=False)
    required_signatures: Optional[int] = None
    available_signatures: Optional[int] = None
    multi_sig_status: Optional[str] = None
    error_details: Optional[str] = None

    @validator('status')
    def validate_status(cls, v: str) -> str:
        valid_statuses = {
            "pending", "confirmed", "failed", "multi_sig_pending",
            "multi_sig_partial", "multi_sig_complete", "multi_sig_failed"
        }
        if v not in valid_statuses:
            raise ValueError(f"Invalid status. Allowed values: {valid_statuses}")
        return v

    @validator('multi_sig_status')
    def validate_multi_sig_status(cls, v: Optional[str], values: Dict[str, Any]) -> Optional[str]:
        if v is not None and not values.get('is_multi_sig', False):
            raise ValueError("Multi-sig status can only be set for multi-sig transactions")
        valid_statuses = {
            "awaiting_signatures", "partially_signed", "fully_signed",
            "execution_failed", "executed", None
        }
        if v not in valid_statuses:
            raise ValueError(f"Invalid multi-sig status. Allowed values: {valid_statuses}")
        return v

    @property
    def signature_progress(self) -> Optional[float]:
        """Calculate signature collection progress."""
        if not self.is_multi_sig or not self.required_signatures:
            return None
        return (self.available_signatures or 0) / self.required_signatures

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat()
        }

class TransactionBatch(BaseModel):
    transactions: List[TransactionDetail]
    total_count: int
    start_index: int = Field(default=0)
    multi_sig_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    batch_status: str = Field(default="complete")

    @validator('transactions')
    def validate_batch_size(cls, v):
        if len(v) > 1000:
            raise ValueError("Batch size cannot exceed 1000 transactions")
        return v

    @validator('multi_sig_count')
    def validate_multi_sig_count(cls, v: int, values: Dict[str, Any]) -> int:
        if 'total_count' in values and v > values['total_count']:
            raise ValueError("Multi-sig count cannot exceed total count")
        return v

    @validator('failed_count')
    def validate_failed_count(cls, v: int, values: Dict[str, Any]) -> int:
        if 'total_count' in values and v > values['total_count']:
            raise ValueError("Failed count cannot exceed total count")
        return v

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: str
        }

class TokenAmountDetail(BaseModel):
    """Token-Betrag mit Dezimalstellen."""
    amount: str = Field(..., description="Token-Betrag als String (z.B. '38890113466767')")  # [[7]]
    decimals: int = Field(..., description="Anzahl der Dezimalstellen (z.B. 9)")
    uiAmount: float = Field(..., description="Menschlesbarer Token-Betrag (z.B. 38890.113466767)")
    uiAmountString: str = Field(..., description="Formatierte Betragsdarstellung als String")  # [[7]]

class TokenBalanceDetail(BaseModel):
    """Token-Saldo vor/nach der Transaktion."""
    accountIndex: int = Field(..., description="Index des Kontos in accountKeys")
    mint: str = Field(..., description="Mint-Adresse des Tokens (z.B. 'So11111111111111111111111111111111111111112')")  # [[4]]
    owner: str = Field(..., description="Besitzer des Kontos (z.B. 'MfDuWeqSHEqTFVYZ7LoexgAK9dxk7cy4DFJWjWMGVWa')")  # [[4]]
    programId: str = Field(..., description="Programm-ID (z.B. 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')")  # [[4]]
    uiTokenAmount: TokenAmountDetail = Field(...)  # [[7]]

    class Config:
        allow_population_by_field_name = True
