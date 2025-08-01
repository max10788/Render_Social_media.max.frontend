# app/core/backend_crypto_tracker/api/routes/token_routes.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# Importiere Controller-Logik (TODO)
# from ..controllers import token_controller

router = APIRouter(prefix="/api/tokens", tags=["tokens"])

# Pydantic Models (Duplikate aus main.py - besser zentral definieren)
class TokenResponse(BaseModel):
    address: str
    name: str
    symbol: str
    chain: str
    market_cap: float
    volume_24h: float
    score: float
    holders: int
    last_analyzed: datetime

@router.get("/", response_model=List[TokenResponse])
async def get_tokens(
    limit: int = 50,
    min_score: float = 0,
    chain: Optional[str] = None,
    search: Optional[str] = None
):
    # return await token_controller.get_tokens(limit, min_score, chain, search)
    return [] # Platzhalter

@router.get("/{token_address}")
async def get_token_detail(token_address: str):
    # token_detail = await token_controller.get_token_detail(token_address)
    # if not token_detail:
    #     raise HTTPException(status_code=404, detail="Token nicht gefunden")
    # return token_detail
    return {} # Platzhalter

@router.get("/{token_address}/wallets")
async def get_token_wallets(token_address: str):
    # wallets = await token_controller.get_token_wallets(token_address)
    # return wallets
    return [] # Platzhalter
