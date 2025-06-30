from typing import Optional, List, Dict, Any
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
    accountKeys: List[str] = Field(default_factory=list)
    recentBlockhash: str = ""
    instructions: List[Dict[str, Any]] = Field(default_factory=list)
    header: Dict[str, Any] = Field(default_factory=dict)

class TransactionMetaDetail(BaseModel):
    fee: int = 0
    preBalances: List[int] = Field(default_factory=list)
    postBalances: List[int] = Field(default_factory=list)
    innerInstructions: Optional[List[Dict[str, Any]]] = None
    logMessages: Optional[List[str]] = None
    err: Optional[Dict[str, Any]] = None

class TransactionDetail(BaseModel):
    signatures: List[str] = Field(default_factory=list)
    message: Optional[TransactionMessageDetail] = None
    slot: Optional[int] = None
    meta: Optional[TransactionMetaDetail] = None
    block_time: Optional[int] = None
