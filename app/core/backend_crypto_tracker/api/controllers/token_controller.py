# api/controllers/token_controller.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from config.database import get_db
from processor.database.models.token import Token
from processor.database.models.wallet import WalletAnalysis
from services.multichain.price_service import PriceService, TokenPriceData
from scanner.token_analyzer import TokenAnalyzer
from scanner.wallet_classifier import EnhancedWalletClassifier
from scanner.scoring_engine import MultiChainScoringEngine
from utils.exceptions import APIException, InvalidAddressException
from utils.logger import get_logger
from pydantic import BaseModel, Field

logger = get_logger(__name__)

router = APIRouter(prefix="/tokens", tags=["tokens"])

# Pydantic-Modelle für API-Antworten
class TokenResponse(BaseModel):
    id: int
    address: str
    name: str
    symbol: str
    chain: str
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    liquidity: Optional[float] = None
    holders_count: Optional[int] = None
    contract_verified: bool
    creation_date: Optional[datetime] = None
    last_analyzed: Optional[datetime] = None
    token_score: Optional[float] = None
    
    class Config:
        orm_mode = True

class TokenDetailResponse(TokenResponse):
    wallet_analyses: List[Dict[str, Any]] = []
    advanced_metrics: Dict[str, Any] = {}

class TokenAnalysisRequest(BaseModel):
    token_address: str = Field(..., description="Token contract address")
    chain: str = Field(..., description="Blockchain (ethereum, bsc, solana, sui)")
    include_advanced_metrics: bool = Field(True, description="Include institutional risk metrics")

class TokenAnalysisResponse(BaseModel):
    token_info: Dict[str, Any]
    score: float
    institutional_score: Optional[float] = None
    metrics: Dict[str, Any]
    risk_flags: List[str]
    wallet_analysis: Dict[str, Any]
    institutional_metrics: Optional[Dict[str, Any]] = None
    risk_level: Optional[str] = None

@router.get("/", response_model=List[TokenResponse])
async def get_tokens(
    skip: int = Query(0, ge=0, description="Anzahl der zu überspringenden Einträge"),
    limit: int = Query(100, ge=1, le=1000, description="Maximale Anzahl der zurückgegebenen Einträge"),
    chain: Optional[str] = Query(None, description="Blockchain-Filter"),
    min_market_cap: Optional[float] = Query(None, description="Minimale Marktkapitalisierung"),
    max_market_cap: Optional[float] = Query(None, description="Maximale Marktkapitalisierung"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimaler Token-Score"),
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
            
        if min_score is not None:
            query = query.filter(Token.token_score >= min_score)
        
        tokens = query.offset(skip).limit(limit).all()
        return [TokenResponse.from_orm(token) for token in tokens]
    except Exception as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{token_id}", response_model=TokenDetailResponse)
async def get_token(
    token_id: int = Path(..., description="ID des Tokens"),
    include_wallets: bool = Query(False, description="Wallet-Analysen einschließen"),
    db: Session = Depends(get_db)
):
    """Ruft ein einzelnes Token anhand seiner ID ab"""
    try:
        token = db.query(Token).filter(Token.id == token_id).first()
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        
        response_data = TokenDetailResponse.from_orm(token)
        
        # Wallet-Analysen einschließen, falls gewünscht
        if include_wallets:
            wallet_analyses = db.query(WalletAnalysis).filter(
                WalletAnalysis.token_id == token_id
            ).all()
            response_data.wallet_analyses = [wa.to_dict() for wa in wallet_analyses]
            
            # Erweiterte Metriken sammeln
            advanced_metrics = {}
            for wa in wallet_analyses:
                if hasattr(wa, 'advanced_metrics') and wa.advanced_metrics:
                    advanced_metrics.update(wa.advanced_metrics)
            
            response_data.advanced_metrics = advanced_metrics
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/address/{address}", response_model=TokenDetailResponse)
async def get_token_by_address(
    address: str = Path(..., description="Adresse des Tokens"),
    chain: str = Query(..., description="Blockchain des Tokens"),
    include_wallets: bool = Query(False, description="Wallet-Analysen einschließen"),
    db: Session = Depends(get_db)
):
    """Ruft ein Token anhand seiner Adresse ab"""
    try:
        token = db.query(Token).filter(Token.address == address, Token.chain == chain).first()
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        
        response_data = TokenDetailResponse.from_orm(token)
        
        # Wallet-Analysen einschließen, falls gewünscht
        if include_wallets:
            wallet_analyses = db.query(WalletAnalysis).filter(
                WalletAnalysis.token_id == token.id
            ).all()
            response_data.wallet_analyses = [wa.to_dict() for wa in wallet_analyses]
            
            # Erweiterte Metriken sammeln
            advanced_metrics = {}
            for wa in wallet_analyses:
                if hasattr(wa, 'advanced_metrics') and wa.advanced_metrics:
                    advanced_metrics.update(wa.advanced_metrics)
            
            response_data.advanced_metrics = advanced_metrics
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token by address: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{address}/price", response_model=dict)
async def get_token_price(
    address: str = Path(..., description="Adresse des Tokens"),
    chain: str = Query(..., description="Blockchain des Tokens"),
    update_db: bool = Query(True, description="Token in Datenbank aktualisieren"),
    db: Session = Depends(get_db)
):
    """Ruft den aktuellen Preis eines Tokens ab"""
    try:
        # Prüfen, ob das Token in der Datenbank existiert
        token = db.query(Token).filter(Token.address == address, Token.chain == chain).first()
        
        # Preis abrufen
        async with PriceService() as price_service:
            price_data = await price_service.get_token_price(address, chain)
            
            response_data = {
                "address": address,
                "chain": chain,
                "symbol": token.symbol if token else "Unknown",
                "name": token.name if token else "Unknown",
                "price": price_data.price,
                "market_cap": price_data.market_cap,
                "volume_24h": price_data.volume_24h,
                "price_change_percentage_24h": price_data.price_change_percentage_24h,
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # Token in der Datenbank aktualisieren, wenn vorhanden und gewünscht
            if token and update_db:
                token.market_cap = price_data.market_cap
                token.volume_24h = price_data.volume_24h
                token.last_analyzed = datetime.utcnow()
                db.commit()
            
            return response_data
    except HTTPException:
        raise
    except APIException as e:
        logger.error(f"API error fetching token price: {e}")
        raise HTTPException(status_code=503, detail="External API error")
    except Exception as e:
        logger.error(f"Error fetching token price: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/lowcap", response_model=List[TokenResponse])
async def get_low_cap_tokens(
    max_market_cap: float = Query(5_000_000, description="Maximale Marktkapitalisierung für Low-Cap Tokens"),
    limit: int = Query(100, ge=1, le=1000, description="Maximale Anzahl der zurückgegebenen Einträge"),
    refresh: bool = Query(False, description="Daten von der API neu laden"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimaler Token-Score"),
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
        query = db.query(Token).filter(Token.market_cap < max_market_cap)
        
        if min_score is not None:
            query = query.filter(Token.token_score >= min_score)
            
        tokens = query.limit(limit).all()
        return [TokenResponse.from_orm(token) for token in tokens]
    except APIException as e:
        logger.error(f"API error fetching low-cap tokens: {e}")
        raise HTTPException(status_code=503, detail="External API error")
    except Exception as e:
        logger.error(f"Error fetching low-cap tokens: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/analyze", response_model=TokenAnalysisResponse)
async def analyze_token(
    request: TokenAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Führt eine umfassende Token-Analyse durch"""
    try:
        # Token in der Datenbank suchen oder erstellen
        token = db.query(Token).filter(
            Token.address == request.token_address,
            Token.chain == request.chain
        ).first()
        
        if not token:
            # Token-Daten von der API abrufen
            async with PriceService() as price_service:
                try:
                    price_data = await price_service.get_token_price(request.token_address, request.chain)
                    
                    # Neues Token erstellen
                    token = Token(
                        address=request.token_address,
                        name=price_data.name or "Unknown",
                        symbol=price_data.symbol or "UNKNOWN",
                        chain=request.chain,
                        market_cap=price_data.market_cap,
                        volume_24h=price_data.volume_24h,
                        last_analyzed=datetime.utcnow()
                    )
                    db.add(token)
                    db.commit()
                    db.refresh(token)
                except APIException:
                    # Wenn Preis nicht abgerufen werden kann, minimales Token erstellen
                    token = Token(
                        address=request.token_address,
                        name="Unknown",
                        symbol="UNKNOWN",
                        chain=request.chain,
                        last_analyzed=datetime.utcnow()
                    )
                    db.add(token)
                    db.commit()
                    db.refresh(token)
        
        # Token-Analyse durchführen
        async with TokenAnalyzer() as analyzer:
            analysis_result = await analyzer.analyze_custom_token(request.token_address, request.chain)
            
            # Erweiterte Metriken einschließen, falls gewünscht
            if request.include_advanced_metrics:
                try:
                    # Erweiterte Scoring-Engine initialisieren
                    scoring_engine = MultiChainScoringEngine()
                    
                    # Wallet-Analysen für erweiterte Bewertung extrahieren
                    wallet_analyses = []
                    for wallet_data in analysis_result.get('wallet_analysis', {}).get('top_holders', []):
                        from scanner.wallet_classifier import WalletAnalysis, WalletTypeEnum
                        
                        wallet_type = WalletTypeEnum.UNKNOWN
                        for wt in WalletTypeEnum:
                            if wt.value == wallet_data.get('type'):
                                wallet_type = wt
                                break
                        
                        wallet_analysis = WalletAnalysis(
                            wallet_address=wallet_data.get('address'),
                            wallet_type=wallet_type,
                            balance=wallet_data.get('balance', 0),
                            percentage_of_supply=wallet_data.get('percentage', 0),
                            risk_score=0,  # Wird später berechnet
                            confidence_score=0.7,  # Default confidence
                            analysis_date=datetime.utcnow(),
                            sources_used=[]
                        )
                        wallet_analyses.append(wallet_analysis)
                    
                    # Erweiterte Scoring durchführen
                    advanced_score = await scoring_engine.calculate_token_score_advanced(
                        token_data=analysis_result['token_info'],
                        wallet_analyses=wallet_analyses,
                        chain=request.chain
                    )
                    
                    # Erweiterte Metriken zur Antwort hinzufügen
                    analysis_result['institutional_score'] = advanced_score.get('institutional_score')
                    analysis_result['institutional_metrics'] = advanced_score.get('institutional_metrics')
                    analysis_result['risk_level'] = advanced_score.get('risk_level')
                    
                except Exception as e:
                    logger.error(f"Error calculating advanced metrics: {e}")
            
            # Analyse-Ergebnis in der Datenbank speichern (im Hintergrund)
            background_tasks.add_task(
                _save_analysis_to_db,
                token.id,
                analysis_result
            )
            
            # Token-Score in der Datenbank aktualisieren
            token.token_score = analysis_result.get('score')
            db.commit()
            
            return TokenAnalysisResponse(
                token_info=analysis_result['token_info'],
                score=analysis_result.get('score'),
                institutional_score=analysis_result.get('institutional_score'),
                metrics=analysis_result.get('metrics', {}),
                risk_flags=analysis_result.get('risk_flags', []),
                wallet_analysis=analysis_result.get('wallet_analysis', {}),
                institutional_metrics=analysis_result.get('institutional_metrics'),
                risk_level=analysis_result.get('risk_level')
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing token: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze token: {str(e)}")

@router.get("/statistics", response_model=dict)
async def get_token_statistics(
    chain: Optional[str] = Query(None, description="Blockchain für Statistiken"),
    db: Session = Depends(get_db)
):
    """Ruft Statistiken über Tokens in der Datenbank"""
    try:
        query = db.query(Token)
        
        if chain:
            query = query.filter(Token.chain == chain)
        
        # Gesamtzahl der Tokens
        total_tokens = query.count()
        
        # Durchschnittliche Marktkapitalisierung
        avg_market_cap = query.with_entities(
            db.func.avg(Token.market_cap)
        ).scalar() or 0
        
        # Tokens nach Blockchain
        tokens_by_chain = {}
        if not chain:
            chains = db.query(Token.chain, db.func.count(Token.id)).group_by(Token.chain).all()
            tokens_by_chain = {chain: count for chain, count in chains}
        
        # Verteilung der Token-Scores
        score_distribution = {
            "high_risk": 0,    # 0-20
            "medium_risk": 0,  # 21-50
            "low_risk": 0,     # 51-80
            "safe": 0          # 81-100
        }
        
        all_tokens = query.all()
        for token in all_tokens:
            if token.token_score is not None:
                if token.token_score <= 20:
                    score_distribution["high_risk"] += 1
                elif token.token_score <= 50:
                    score_distribution["medium_risk"] += 1
                elif token.token_score <= 80:
                    score_distribution["low_risk"] += 1
                else:
                    score_distribution["safe"] += 1
        
        # Low-Cap Tokens (unter $5M)
        low_cap_count = query.filter(Token.market_cap < 5_000_000).count()
        
        # Verifizierte vs. unverifizierte Verträge
        verified_count = query.filter(Token.contract_verified == True).count()
        unverified_count = total_tokens - verified_count
        
        return {
            "total_tokens": total_tokens,
            "average_market_cap": float(avg_market_cap),
            "tokens_by_chain": tokens_by_chain,
            "score_distribution": score_distribution,
            "low_cap_tokens": low_cap_count,
            "verified_contracts": verified_count,
            "unverified_contracts": unverified_count,
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching token statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/trending", response_model=List[dict])
async def get_trending_tokens(
    limit: int = Query(10, ge=1, le=100, description="Anzahl der zurückgegebenen Tokens"),
    min_volume: float = Query(10000, description="Minimales Handelsvolumen (24h)"),
    db: Session = Depends(get_db)
):
    """Ruft Trending Tokens basierend auf Handelsvolumen und Preisänderung"""
    try:
        # Tokens mit ausreichend Volumen abrufen
        tokens = db.query(Token).filter(
            Token.volume_24h >= min_volume
        ).order_by(
            Token.volume_24h.desc()
        ).limit(limit).all()
        
        # Trending-Score berechnen (einfache Heuristik)
        trending_tokens = []
        for token in tokens:
            # In einer echten Implementierung würde man hier Preisänderungen über einen Zeitraum betrachten
            # Für jetzt verwenden wir eine vereinfachte Metrik: Volumen / Marktkapital
            volume_to_market_cap = 0
            if token.market_cap and token.market_cap > 0:
                volume_to_market_cap = token.volume_24h / token.market_cap
            
            # Trending-Score (höher ist besser)
            trending_score = volume_to_market_cap * 100
            
            trending_tokens.append({
                "token": token.to_dict(),
                "trending_score": trending_score,
                "volume_to_market_cap_ratio": volume_to_market_cap
            })
        
        # Nach Trending-Score sortieren
        trending_tokens.sort(key=lambda x: x["trending_score"], reverse=True)
        
        return trending_tokens
    except Exception as e:
        logger.error(f"Error fetching trending tokens: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def _save_analysis_to_db(token_id: int, analysis_result: Dict[str, Any]):
    """Speichert Analyseergebnisse in der Datenbank (Hintergrundtask)"""
    try:
        from config.database import SessionLocal
        
        with SessionLocal() as db:
            # Hier würde man die Analyseergebnisse in einer separaten Tabelle speichern
            # Für jetzt nur das Token aktualisieren
            token = db.query(Token).filter(Token.id == token_id).first()
            if token:
                token.last_analyzed = datetime.utcnow()
                db.commit()
                
    except Exception as e:
        logger.error(f"Error saving analysis to database: {e}")
