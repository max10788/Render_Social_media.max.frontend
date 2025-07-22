from enum import Enum
from typing import List, Dict, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

class OperationType(str, Enum):
    TRANSFER = "transfer"
    CONTRACT_CALL = "contract_call"
    TOKEN_TRANSFER = "token_transfer"
    CROSS_CHAIN = "cross_chain"
    DEFI_ACTION = "defi_action"

class OperationDetail(BaseModel):
    type: OperationType
    from_address: str
    to_address: str
    value: Decimal
    contract_address: Optional[str]
    method: Optional[str]  # Smart Contract Methode
    raw_data: Dict

class TransactionDetail(BaseModel):
    tx_hash: str
    from_wallet: str
    to_wallet: Optional[str]
    amount: Decimal
    fee: Decimal
    timestamp: datetime
    status: str
    operations: List['OperationDetail']
    raw_data: Dict
