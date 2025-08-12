# app/core/backend_crypto_tracker/api/routes/scanner_routes.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from app.core.backend_crypto_tracker.api.controllers.scanner_controller import ScannerController
from app.core.backend_crypto_tracker.workers.scheduler import SchedulerManager
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.exceptions import APIException, ScannerException
logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/scanner", tags=["scanner"])

# Pydantic-Modelle für API-Antworten
class ScanStatusResponse(BaseModel):
    scan_id: str
    status: str
    progress: float
    start_time: str
    end_time: Optional[str] = None
    chain: Optional[str] = None
    scan_type: str
    tokens_found: int
    tokens_analyzed: int
    high_risk_tokens: int
    duration_seconds: Optional[int] = None

class ScannerStatusResponse(BaseModel):
    scheduler: Dict[str, Any]
    active_scans: Dict[str, ScanStatusResponse]
    recent_history: List[ScanStatusResponse]
    total_active_scans: int
    last_updated: str

class ScanStartRequest(BaseModel):
    chains: Optional[List[str]] = Field(None, description="Blockchains für den Scan")
    max_market_cap: float = Field(5_000_000, description="Maximale Marktkapitalisierung")
    max_tokens: int = Field(100, ge=1, le=1000, description="Maximale Anzahl Tokens")
    priority: str = Field("normal", description="Priorität des Scans")

class AnalysisStartRequest(BaseModel):
    token_addresses: List[str] = Field(..., description="Token-Adressen für die Analyse")
    chain: str = Field(..., description="Blockchain")
    include_advanced_metrics: bool = Field(True, description="Erweiterte Metriken einschließen")

class ScanStatisticsResponse(BaseModel):
    period_days: int
    total_scans: int
    completed_scans: int
    failed_scans: int
    success_rate: float
    average_duration_seconds: float
    total_tokens_found: int
    total_tokens_analyzed: int
    total_high_risk_tokens: int
    scan_types: Dict[str, Dict[str, Any]]
    last_updated: str

# Dependency Injection
def get_scanner_controller() -> ScannerController:
    """Gibt eine ScannerController-Instanz zurück"""
    scheduler_manager = SchedulerManager()
    return ScannerController(scheduler_manager)

@router.get("/status", response_model=ScannerStatusResponse)
async def get_scanner_status(controller: ScannerController = Depends(get_scanner_controller)):
    """Gibt den aktuellen Status des Scanners zurück"""
    try:
        return await controller.get_status()
    except ScannerException as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
