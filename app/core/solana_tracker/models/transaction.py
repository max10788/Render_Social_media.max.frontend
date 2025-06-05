from typing import Optional, List
from datetime import datetime
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

class TransferAmount(BaseModel):
    """Transfer amount with currency information."""
    amount: Decimal = Field(..., ge=0)
    currency: str = Field(..., regex="^(SOL|SPL)$")
    decimal_places: int = Field(default=9)
    
    @validator('decimal_places')
    def validate_decimals(cls, v):
        if v < 0 or v > 18:
            raise ValueError("Decimal places must be between 0 and 18")
        return v

class AccountMeta(BaseModel):
    """Account metadata for transaction participants."""
    address: str = Field(..., min_length=32)
    is_signer: bool = False
    is_writable: bool = False

class TokenInfo(BaseModel):
    """SPL Token specific information."""
    mint_address: str = Field(..., min_length=32)
    token_symbol: Optional[str] = None
    decimals: int = Field(default=9, ge=0, le=18)

class TransactionInstruction(BaseModel):
    """Individual instruction within a transaction."""
    program_id: str
    accounts: List[AccountMeta]
    data: Optional[str] = None

class SolanaTransaction(TransactionBase):
    """Complete Solana transaction model."""
    fee: Decimal = Field(..., ge=0)
    success: bool = True
    error_message: Optional[str] = None
    block_number: Optional[int] = None
    instructions: List[TransactionInstruction] = []
    signatures: List[str] = Field(..., min_items=1)
    recent_blockhash: Optional[str] = None

class Transfer(BaseModel):
    """Transfer details within a transaction."""
    from_address: str = Field(..., min_length=32)
    to_address: str = Field(..., min_length=32)
    amount: TransferAmount
    token_info: Optional[TokenInfo] = None

class TrackedTransaction(TransactionBase):
    """Transaction with tracking information."""
    from_wallet: str = Field(..., min_length=32)
    to_wallet: str = Field(..., min_length=32)
    amount: Decimal = Field(..., ge=0)
    value_in_target_currency: Optional[Decimal] = None
    
    class Config:
        json_encoders = {
            Decimal: lambda v: str(v)
        }

class TransactionDetail(BaseModel):
    """Detailed transaction information including transfers."""
    transaction: SolanaTransaction
    transfers: List[Transfer]
    logs: Optional[List[str]] = None
    
    class Config:
        arbitrary_types_allowed = True

class TransactionBatch(BaseModel):
    """Batch of transactions for processing."""
    transactions: List[TransactionDetail]
    total_count: int
    start_index: int = 0
    
    @validator('transactions')
    def validate_batch_size(cls, v):
        if len(v) > 1000:
            raise ValueError("Batch size cannot exceed 1000 transactions")
        return v
