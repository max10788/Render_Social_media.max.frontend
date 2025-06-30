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
    account_keys: List[str] = Field(default_factory=list)  # Geändert zu Snake Case
    recent_blockhash: str = Field(default="")  # Geändert zu Snake Case
    instructions: List[Dict[str, Any]] = Field(default_factory=list)
    header: Dict[str, Any] = Field(default_factory=dict)

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda x: "".join(word.capitalize() for word in x.split("_"))[0].lower() + "".join(word.capitalize() for word in x.split("_"))[1:]
    }
class TransactionMetaDetail(BaseModel):
    fee: int = Field(default=0)
    pre_balances: List[int] = Field(default_factory=list)  # Geändert zu Snake Case
    post_balances: List[int] = Field(default_factory=list)  # Geändert zu Snake Case
    inner_instructions: Optional[List[Any]] = Field(default=None)  # Geändert zu Snake Case
    log_messages: Optional[List[str]] = Field(default=None)  # Geändert zu Snake Case
    err: Optional[Dict[str, Any]] = Field(default=None)

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda x: "".join(word.capitalize() for word in x.split("_"))[0].lower() + "".join(word.capitalize() for word in x.split("_"))[1:]
    }

class TransactionDetail(BaseModel):
    signatures: List[str] = Field(default_factory=list)
    message: Optional[TransactionMessageDetail] = None
    slot: Optional[int] = None
    meta: Optional[TransactionMetaDetail] = None
    block_time: Optional[int] = None

    @property
    def human_readable_time(self) -> Optional[str]:
        if self.block_time is not None:
            return datetime.fromtimestamp(self.block_time, tz=timezone.utc).isoformat()
        return None
