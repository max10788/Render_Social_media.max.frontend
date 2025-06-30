from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, validator
from decimal import Decimal

class TransactionBase(BaseModel):
    """Base Transaction DTO with common fields."""
    tx_hash: str = Field(..., description="Transaction signature/hash")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    
    @validator('tx_hash')
    def validate_tx_hash(cls, v):
        if not v or len(v) < 32:
            raise ValueError("Transaction hash must be at least 32 characters")
        return v

class TransactionMessageDetail(BaseModel):
    accountKeys: List[str] = Field(default_factory=list)
    recentBlockhash: str = Field(default="")
    instructions: List[Dict[str, Any]] = Field(default_factory=list)
    header: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        allow_population_by_field_name = True

class TransactionMetaDetail(BaseModel):
    fee: int = Field(default=0)
    preBalances: List[int] = Field(default_factory=list)
    postBalances: List[int] = Field(default_factory=list)
    innerInstructions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    logMessages: Optional[List[str]] = Field(default_factory=list)
    err: Optional[Dict[str, Any]] = Field(default=None)

    class Config:
        allow_population_by_field_name = True

class TransactionDetail(BaseModel):
    signatures: List[str] = Field(default_factory=list)
    message: Optional[TransactionMessageDetail] = None
    slot: Optional[int] = None
    meta: Optional[TransactionMetaDetail] = None
    block_time: Optional[int] = None
    signature: str = Field(default="")  # Added this field
    transaction: Optional[TransactionBase] = None  # Added this field

    @property
    def human_readable_time(self) -> Optional[str]:
        if self.block_time is not None:
            return datetime.fromtimestamp(self.block_time, tz=timezone.utc).isoformat()
        return None

    class Config:
        allow_population_by_field_name = True

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
    """Transaction with tracking information."""
    tx_hash: str
    from_wallet: str
    to_wallet: Optional[str] = None
    amount: Decimal
    timestamp: datetime
    value_in_target_currency: Optional[Decimal] = None

    class Config:
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat()
        }

    @validator('tx_hash')
    def validate_tx_hash(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError("Transaction hash must be at least 32 characters")
        return v

class TransactionBatch(BaseModel):
    transactions: List[TransactionDetail]
    total_count: int
    start_index: int = 0

    @validator('transactions')
    def validate_batch_size(cls, v):
        if len(v) > 1000:
            raise ValueError("Batch size cannot exceed 1000 transactions")
        return v

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: str
        }
