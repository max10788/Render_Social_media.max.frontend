# app/core/backend_crypto_tracker/api/controllers/scanner_controller.py
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from scanner.token_discovery import TokenDiscoveryService
from scanner.token_analyzer import TokenAnalyzer
from scanner.scoring_engine import MultiChainScoringEngine
from workers.scheduler import SchedulerManager
from workers.scanner_worker import ScannerWorker
from workers.enrichment_worker import EnrichmentWorker
from utils.logger import get_logger
from utils.exceptions import APIException, ScannerException
from pydantic import BaseModel, Field

logger = get_logger(__name__)

# Pydantic-Modelle für API-Antworten
class ScannerStatusResponse(BaseModel):
    is_running: bool
    last_scan: Optional[datetime] = None
    next_scan: Optional[datetime] = None
    tokens_scanned: int = 0
    scan_duration_seconds: Optional[float] = None
    active_jobs: List[str] = []
    queue_size: int = 0

class ScanRequest(BaseModel):
    chain: str = Field(..., description="Blockchain (ethereum, bsc, solana, sui)")
    max_market_cap: float = Field(5_000_000, description="Maximale Marktkapitalisierung für Low-Cap Tokens")
    limit: int = Field(100, ge=1, le=1000, description="Maximale Anzahl der zu scannenden Tokens")
    force_refresh: bool = Field(False, description="Erzwingt Neuladen von API-Daten")

class ScanResponse(BaseModel):
    scan_id: str
    status: str
    tokens_found: int
    new_tokens: int
    updated_tokens: int
    scan_duration_seconds: float
    estimated_completion_seconds: Optional[float] = None

class EnrichmentRequest(BaseModel):
    scan_id: str = Field(..., description="ID des Scans")
    include_wallet_analysis: bool = Field(True, description="Wallet-Analyse einschließen")
    include_risk_assessment: bool = Field(True, description="Risikobewertung einschließen")

class EnrichmentResponse(BaseModel):
    scan_id: str
    status: str
    tokens_processed: int
    wallets_analyzed: int
    risk_assessments: int
    duration_seconds: float

class ScannerController:
    """Controller für Scanner-Operationen"""
    
    def __init__(self, scheduler_manager: SchedulerManager = None):
        self.scheduler_manager = scheduler_manager or SchedulerManager()
        self.token_discovery = TokenDiscoveryService()
        self.scoring_engine = MultiChainScoringEngine()
        self.scanner_worker = ScannerWorker()
        self.enrichment_worker = EnrichmentWorker()
    
    async def get_status(self) -> ScannerStatusResponse:
        """Gibt den Status des Schedulers/Scanners zurück"""
        try:
            scheduler_status = self.scheduler_manager.get_status()
            
            # Aktive Scans abrufen
            active_jobs = await self.scheduler_manager.get_active_jobs()
            
            # Queue-Größe abrufen
            queue_size = await self.scheduler_manager.get_queue_size()
            
            return ScannerStatusResponse(
                is_running=scheduler_status.get('is_running', False),
                last_scan=scheduler_status.get('last_scan'),
                next_scan=scheduler_status.get('next_scan'),
                tokens_scanned=scheduler_status.get('tokens_scanned', 0),
                scan_duration_seconds=scheduler_status.get('scan_duration_seconds'),
                active_jobs=active_jobs,
                queue_size=queue_size
            )
        except Exception as e:
            logger.error(f"Error getting scanner status: {e}")
            raise ScannerException(f"Failed to get scanner status: {str(e)}")
    
    async def start_scan(self, request: ScanRequest) -> ScanResponse:
        """Startet einen neuen Token-Scan"""
        try:
            # Scan-ID generieren
            scan_id = f"scan_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{request.chain}"
            
            # Scan im Scheduler registrieren
            await self.scheduler_manager.register_scan(
                scan_id=scan_id,
                chain=request.chain,
                max_market_cap=request.max_market_cap,
                limit=request.limit,
                force_refresh=request.force_refresh
            )
            
            # Scan im Hintergrund starten
            asyncio.create_task(
                self._execute_scan(scan_id, request)
            )
            
            return ScanResponse(
                scan_id=scan_id,
                status="started",
                tokens_found=0,
                new_tokens=0,
                updated_tokens=0,
                scan_duration_seconds=0,
                estimated_completion_seconds=300  # Schätzung: 5 Minuten
            )
        except Exception as e:
            logger.error(f"Error starting scan: {e}")
            raise ScannerException(f"Failed to start scan: {str(e)}")
    
    async def _execute_scan(self, scan_id: str, request: ScanRequest):
        """Führt den Scan im Hintergrund aus"""
        try:
            start_time = datetime.utcnow()
            
            # Scanner-Status aktualisieren
            await self.scheduler_manager.update_scan_status(
                scan_id, {"status": "running", "start_time": start_time}
            )
            
            # Token-Discovery durchführen
            async with self.token_discovery as discovery:
                tokens = await discovery.discover_tokens(
                    chain=request.chain,
                    max_market_cap=request.max_market_cap,
                    limit=request.limit,
                    force_refresh=request.force_refresh
                )
            
            # Scanner-Status aktualisieren
            await self.scheduler_manager.update_scan_status(
                scan_id, {
                    "status": "discovery_completed",
                    "tokens_found": len(tokens),
                    "discovery_duration_seconds": (datetime.utcnow() - start_time).total_seconds()
                }
            )
            
            # Tokens verarbeiten und speichern
            new_tokens = 0
            updated_tokens = 0
            
            for token in tokens:
                # Prüfen, ob das Token bereits existiert
                existing_token = await self._check_existing_token(token.address, token.chain)
                
                if existing_token:
                    # Bestehendes Token aktualisieren
                    await self._update_token(existing_token, token)
                    updated_tokens += 1
                else:
                    # Neues Token speichern
                    await self._save_token(token)
                    new_tokens += 1
            
            # Scanner-Status aktualisieren
            await self.scheduler_manager.update_scan_status(
                scan_id, {
                    "status": "completed",
                    "new_tokens": new_tokens,
                    "updated_tokens": updated_tokens,
                    "completion_time": datetime.utcnow(),
                    "scan_duration_seconds": (datetime.utcnow() - start_time).total_seconds()
                }
            )
            
            logger.info(f"Scan {scan_id} completed: {len(tokens)} tokens found, "
                       f"{new_tokens} new, {updated_tokens} updated")
            
        except Exception as e:
            logger.error(f"Error executing scan {scan_id}: {e}")
            await self.scheduler_manager.update_scan_status(
                scan_id, {
                    "status": "failed",
                    "error": str(e),
                    "completion_time": datetime.utcnow()
                }
            )
    
    async def start_enrichment(self, request: EnrichmentRequest) -> EnrichmentResponse:
        """Startet die Anreicherung von Token-Daten"""
        try:
            # Scan-Status prüfen
            scan_status = await self.scheduler_manager.get_scan_status(request.scan_id)
            
            if scan_status.get('status') != 'completed':
                raise ScannerException(f"Scan {request.scan_id} is not completed")
            
            # Enrichment im Hintergrund starten
            asyncio.create_task(
                self._execute_enrichment(request.scan_id, request)
            )
            
            return EnrichmentResponse(
                scan_id=request.scan_id,
                status="started",
                tokens_processed=0,
                wallets_analyzed=0,
                risk_assessments=0,
                duration_seconds=0
            )
        except Exception as e:
            logger.error(f"Error starting enrichment: {e}")
            raise ScannerException(f"Failed to start enrichment: {str(e)}")
    
    async def _execute_enrichment(self, scan_id: str, request: EnrichmentRequest):
        """Führt die Anreicherung im Hintergrund aus"""
        try:
            start_time = datetime.utcnow()
            
            # Enrichment-Status aktualisieren
            await self.scheduler_manager.update_enrichment_status(
                scan_id, {"status": "running", "start_time": start_time}
            )
            
            # Tokens für den Scan abrufen
            tokens = await self._get_tokens_for_scan(scan_id)
            
            tokens_processed = 0
            wallets_analyzed = 0
            risk_assessments = 0
            
            # Tokens anreichern
            for token in tokens:
                try:
                    # Wallet-Analyse durchführen, falls gewünscht
                    if request.include_wallet_analysis:
                        wallet_analyses = await self._analyze_wallets(token)
                        wallets_analyzed += len(wallet_analyses)
                    
                    # Risikobewertung durchführen, falls gewünscht
                    if request.include_risk_assessment:
                        risk_assessment = await self._assess_token_risk(token)
                        if risk_assessment:
                            risk_assessments += 1
                    
                    tokens_processed += 1
                    
                    # Fortschritt aktualisieren
                    if tokens_processed % 10 == 0:  # Alle 10 Tokens aktualisieren
                        await self.scheduler_manager.update_enrichment_status(
                            scan_id, {
                                "status": "running",
                                "tokens_processed": tokens_processed,
                                "wallets_analyzed": wallets_analyzed,
                                "risk_assessments": risk_assessments
                            }
                        )
                
                except Exception as e:
                    logger.error(f"Error enriching token {token.address}: {e}")
                    continue
            
            # Enrichment-Status aktualisieren
            await self.scheduler_manager.update_enrichment_status(
                scan_id, {
                    "status": "completed",
                    "tokens_processed": tokens_processed,
                    "wallets_analyzed": wallets_analyzed,
                    "risk_assessments": risk_assessments,
                    "completion_time": datetime.utcnow(),
                    "duration_seconds": (datetime.utcnow() - start_time).total_seconds()
                }
            )
            
            logger.info(f"Enrichment {scan_id} completed: {tokens_processed} tokens processed, "
                       f"{wallets_analyzed} wallets analyzed, {risk_assessments} risk assessments")
            
        except Exception as e:
            logger.error(f"Error executing enrichment {scan_id}: {e}")
            await self.scheduler_manager.update_enrichment_status(
                scan_id, {
                    "status": "failed",
                    "error": str(e),
                    "completion_time": datetime.utcnow()
                }
            )
    
    async def get_scan_results(self, scan_id: str) -> Dict[str, Any]:
        """Holt die Ergebnisse eines Scans"""
        try:
            # Scan-Status prüfen
            scan_status = await self.scheduler_manager.get_scan_status(scan_id)
            
            if scan_status.get('status') != 'completed':
                raise ScannerException(f"Scan {scan_id} is not completed")
            
            # Ergebnisse abrufen
            tokens = await self._get_tokens_for_scan(scan_id)
            
            return {
                "scan_id": scan_id,
                "status": scan_status.get('status'),
                "tokens_found": scan_status.get('tokens_found', 0),
                "new_tokens": scan_status.get('new_tokens', 0),
                "updated_tokens": scan_status.get('updated_tokens', 0),
                "scan_duration_seconds": scan_status.get('scan_duration_seconds', 0),
                "completion_time": scan_status.get('completion_time'),
                "tokens": [token.to_dict() for token in tokens]
            }
        except Exception as e:
            logger.error(f"Error getting scan results for {scan_id}: {e}")
            raise ScannerException(f"Failed to get scan results: {str(e)}")
    
    async def get_enrichment_results(self, scan_id: str) -> Dict[str, Any]:
        """Holt die Ergebnisse der Anreicherung"""
        try:
            # Enrichment-Status prüfen
            enrichment_status = await self.scheduler_manager.get_enrichment_status(scan_id)
            
            if enrichment_status.get('status') != 'completed':
                raise ScannerException(f"Enrichment {scan_id} is not completed")
            
            # Ergebnisse abrufen
            tokens = await self._get_tokens_for_scan(scan_id)
            
            return {
                "scan_id": scan_id,
                "status": enrichment_status.get('status'),
                "tokens_processed": enrichment_status.get('tokens_processed', 0),
                "wallets_analyzed": enrichment_status.get('wallets_analyzed', 0),
                "risk_assessments": enrichment_status.get('risk_assessments', 0),
                "duration_seconds": enrichment_status.get('duration_seconds', 0),
                "completion_time": enrichment_status.get('completion_time'),
                "tokens": [token.to_dict() for token in tokens]
            }
        except Exception as e:
            logger.error(f"Error getting enrichment results for {scan_id}: {e}")
            raise ScannerException(f"Failed to get enrichment results: {str(e)}")
    
    async def _check_existing_token(self, address: str, chain: str):
        """Prüft, ob ein Token bereits existiert"""
        # In einer echten Implementierung würde man hier die Datenbank abfragen
        # Für jetzt ein Platzhalter
        return None
    
    async def _save_token(self, token):
        """Speichert ein neues Token in der Datenbank"""
        # In einer echten Implementierung würde man hier die Datenbank speichern
        logger.info(f"Saving new token: {token.symbol} ({token.chain})")
    
    async def _update_token(self, existing_token, new_token):
        """Aktualisiert ein bestehendes Token"""
        # In einer echten Implementierung würde man hier die Datenbank aktualisieren
        logger.info(f"Updating token: {new_token.symbol} ({new_token.chain})")
    
    async def _get_tokens_for_scan(self, scan_id: str):
        """Holt alle Tokens für einen bestimmten Scan"""
        # In einer echten Implementierung würde man hier die Datenbank abfragen
        # Für jetzt ein Platzhalter
        return []
    
    async def _analyze_wallets(self, token):
        """Analysiert Wallets für ein Token"""
        # In einer echten Implementierung würde man hier die Wallet-Analyse durchführen
        logger.info(f"Analyzing wallets for token: {token.symbol}")
        return []
    
    async def _assess_token_risk(self, token):
        """Bewertet das Risiko eines Tokens"""
        # In einer echten Implementierung würde man hier die Risikobewertung durchführen
        logger.info(f"Assessing risk for token: {token.symbol}")
        return True
    
    async def get_scan_history(self, limit: int = 50, chain: Optional[str] = None):
        """Holt den Scan-Verlauf"""
        try:
            history = await self.scheduler_manager.get_scan_history(limit, chain)
            return history
        except Exception as e:
            logger.error(f"Error getting scan history: {e}")
            raise ScannerException(f"Failed to get scan history: {str(e)}")
    
    async def get_scheduler_config(self):
        """Holt die Konfiguration des Schedulers"""
        try:
            config = await self.scheduler_manager.get_config()
            return config
        except Exception as e:
            logger.error(f"Error getting scheduler config: {e}")
            raise ScannerException(f"Failed to get scheduler config: {str(e)}")
    
    async def update_scheduler_config(self, config: Dict[str, Any]):
        """Aktualisiert die Konfiguration des Schedulers"""
        try:
            await self.scheduler_manager.update_config(config)
            return {"status": "success", "message": "Configuration updated"}
        except Exception as e:
            logger.error(f"Error updating scheduler config: {e}")
            raise ScannerException(f"Failed to update scheduler config: {str(e)}")
