# api/controllers/token_controller.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from config.database import get_db
from processor.database.models.token import Token
from services.multichain.price_service import PriceService, TokenPriceData
from utils.exceptions import APIException, InvalidAddressException
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/tokens", tags=["tokens"])

@router.get("/", response_model=List[dict])
async def get_tokens(
    skip: int = Query(0, ge=0, description="Anzahl der zu überspringenden Einträge"),
    limit: int = Query(100, ge=1, le=1000, description="Maximale Anzahl der zurückgegebenen Einträge"),
    chain: Optional[str] = Query(None, description="Blockchain-Filter"),
    min_market_cap: Optional[float] = Query(None, description="Minimale Marktkapitalisierung"),
    max_market_cap: Optional[float] = Query(None, description="Maximale Marktkapitalisierung"),
    db: Session = Depends(get_db)
):
    """Ruft eine Liste von Tokens ab"""
    try:
        query = db.query(Token)
        
        if chain:
            query = query.filter(Token.chain == chain)
        
        if min_market_cap is not None:
            query = query.filter(Token.market_cap >= min_market_cap)
        
        if max_market_cap is not None:
            query = query.filter(Token.market_cap <= max_market_cap)
        
        tokens = query.offset(skip).limit(limit).all()
        return [token.to_dict() for token in tokens]
    except Exception as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{token_id}", response_model=dict)
async def get_token(
    token_id: int = Path(..., description="ID des Tokens"),
    db: Session = Depends(get_db)
):
    """Ruft ein einzelnes Token anhand seiner ID ab"""
    try:
        token = db.query(Token).filter(Token.id == token_id).first()
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        return token.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/address/{address}", response_model=dict)
async def get_token_by_address(
    address: str = Path(..., description="Adresse des Tokens"),
    db: Session = Depends(get_db)
):
    """Ruft ein Token anhand seiner Adresse ab"""
    try:
        token = db.query(Token).filter(Token.address == address).first()
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        return token.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token by address: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{address}/price", response_model=dict)
async def get_token_price(
    address: str = Path(..., description="Adresse des Tokens"),
    chain: str = Query(..., description="Blockchain des Tokens"),
    db: Session = Depends(get_db)
):
    """Ruft den aktuellen Preis eines Tokens ab"""
    try:
        # Prüfen, ob das Token in der Datenbank existiert
        token = db.query(Token).filter(Token.address == address, Token.chain == chain).first()
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        
        # Preis abrufen
        async with PriceService() as price_service:
            price_data = await price_service.get_token_price(address, chain)
            
            # Token in der Datenbank aktualisieren
            token.market_cap = price_data.market_cap
            token.volume_24h = price_data.volume_24h
            token.last_analyzed = datetime.utcnow()
            db.commit()
            
            return {
                "address": address,
                "chain": chain,
                "symbol": token.symbol,
                "name": token.name,
                "price": price_data.price,
                "market_cap": price_data.market_cap,
                "volume_24h": price_data.volume_24h,
                "price_change_percentage_24h": price_data.price_change_percentage_24h,
                "last_updated": token.last_analyzed.isoformat() if token.last_analyzed else None
            }
    except HTTPException:
        raise
    except APIException as e:
        logger.error(f"API error fetching token price: {e}")
        raise HTTPException(status_code=503, detail="External API error")
    except Exception as e:
        logger.error(f"Error fetching token price: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/lowcap", response_model=List[dict])
async def get_low_cap_tokens(
    max_market_cap: float = Query(5_000_000, description="Maximale Marktkapitalisierung für Low-Cap Tokens"),
    limit: int = Query(100, ge=1, le=1000, description="Maximale Anzahl der zurückgegebenen Einträge"),
    refresh: bool = Query(False, description="Daten von der API neu laden"),
    db: Session = Depends(get_db)
):
    """Ruft eine Liste von Low-Cap Tokens ab"""
    try:
        if refresh:
            # Neue Daten von der API abrufen
            async with PriceService() as price_service:
                tokens = await price_service.get_low_cap_tokens(max_market_cap=max_market_cap, limit=limit)
                
                # Tokens in der Datenbank speichern oder aktualisieren
                for token_data in tokens:
                    existing_token = db.query(Token).filter(
                        Token.address == token_data.address,
                        Token.chain == token_data.chain
                    ).first()
                    
                    if existing_token:
                        # Bestehendes Token aktualisieren
                        existing_token.name = token_data.name
                        existing_token.symbol = token_data.symbol
                        existing_token.market_cap = token_data.market_cap
                        existing_token.volume_24h = token_data.volume_24h
                        existing_token.last_analyzed = datetime.utcnow()
                    else:
                        # Neues Token hinzufügen
                        db.add(token_data)
                
                db.commit()
        
        # Tokens aus der Datenbank abrufen
        tokens = db.query(Token).filter(Token.market_cap < max_market_cap).limit(limit).all()
        return [token.to_dict() for token in tokens]
    except APIException as e:
        logger.error(f"API error fetching low-cap tokens: {e}")
        raise HTTPException(status_code=503, detail="External API error")
    except Exception as e:
        logger.error(f"Error fetching low-cap tokens: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
