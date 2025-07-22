from enum import Enum
from typing import List, Dict
from pydantic import BaseModel
from datetime import datetime

class ScenarioType(str, Enum):
    FLASHLOAN = "flashloan"
    CROSS_CHAIN = "cross_chain"
    DEFI_ACTION = "defi_action"
    NFT_TRANSFER = "nft_transfer"
    MULTI_SIG = "multi_sig"
    LARGE_TRANSFER = "large_transfer"

class ScenarioRule:
    type: ScenarioType
    confidence: float
    
    def matches(self, tx: TransactionDetail) -> bool:
        raise NotImplementedError
    
    def get_metadata(self, tx: TransactionDetail) -> Dict:
        raise NotImplementedError

class ScenarioDetection(BaseModel):
    type: ScenarioType
    tx_hash: str
    confidence: float
    metadata: Dict
    detected_at: datetime = datetime.utcnow()
