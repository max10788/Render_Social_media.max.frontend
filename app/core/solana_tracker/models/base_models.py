from typing import Optional, List, Any
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

class TransactionMessageDetail(BaseModel):
    accountKeys: list[str] = []
    recentBlockhash: str = ""
    instructions: list[dict[str, Any]] = []
    header: dict[str, Any] = {}

class TransactionMetaDetail(BaseModel):
    fee: int = 0
    preBalances: list[int] = []
    postBalances: list[int] = []
    innerInstructions: Optional[list[Any]] = []
    logMessages: Optional[list[str]] = []
    err: Optional[dict[str, Any]] = {}

class TransactionDetail(BaseModel):
    signatures: list[str] = []
    message: Optional[TransactionMessageDetail] = None
    slot: Optional[int] = None
    meta: Optional[TransactionMetaDetail] = None
    block_time: Optional[int] = None
