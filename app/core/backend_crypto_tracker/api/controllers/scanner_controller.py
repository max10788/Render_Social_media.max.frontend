import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from app.core.backend_crypto_tracker.scanner.token_discovery import TokenDiscoveryService
from app.core.backend_crypto_tracker.scanner.token_analyzer import TokenAnalyzer
from app.core.backend_crypto_tracker.scanner.scoring_engine import MultiChainScoringEngine
from app.core.backend_crypto_tracker.workers.scanner_worker import ScannerWorker
from app.core.backend_crypto_tracker.workers.scheduler import SchedulerManager
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.exceptions import APIException, ScannerException
from app.core.backend_crypto_tracker.processor.database.models.scan_job import ScanJob, ScanStatus

logger = get_logger(__name__)


class ScannerController:
    """Controller für Scanner-Operationen und -Management"""

    def __init__(self, scheduler_manager: SchedulerManager = None):
        self.scheduler_manager = scheduler_manager or SchedulerManager()
        self.token_discovery = TokenDiscoveryService()
        self.token_analyzer = TokenAnalyzer()
        self.scoring_engine = MultiChainScoringEngine()
        self.active_scans = {}  # Dict[scan_id, ScanJob]
        self.scan_history = []  # List of completed scans

    async def get_status(self) -> Dict[str, Any]:
        """Gibt den Status des Scanners zurück"""
        try:
            # Status vom Scheduler Manager holen
            scheduler_status = self.scheduler_manager.get_status()

            # Aktive Scans hinzufügen
            active_scans = {
                scan_id: {
                    "status": scan.status.value,
                    "progress": scan.progress,
                    "start_time": scan.start_time.isoformat(),
                    "chain": scan.chain,
                    "scan_type": scan.scan_type,
                    "tokens_found": scan.tokens_found,
                    "tokens_analyzed": scan.tokens_analyzed,
                    "high_risk_tokens": scan.high_risk_tokens
                }
                for scan_id, scan in self.active_scans.items()
            }

            # Kürzliche Scan-Historie
            recent_history = [
                {
                    "scan_id": scan.id,
                    "status": scan.status.value,
                    "progress": scan.progress,
                    "start_time": scan.start_time.isoformat(),
                    "end_time": scan.end_time.isoformat() if scan.end_time else None,
                    "chain": scan.chain,
                    "scan_type": scan.scan_type,
                    "tokens_found": scan.tokens_found,
                    "tokens_analyzed": scan.tokens_analyzed,
                    "high_risk_tokens": scan.high_risk_tokens,
                    "duration_seconds": (scan.end_time - scan.start_time).total_seconds() if scan.end_time else None
                }
                for scan in self.scan_history[-10:]  # Letzte 10 Scans
            ]

            return {
                "scheduler": scheduler_status,
                "active_scans": active_scans,
                "recent_history": recent_history,
                "total_active_scans": len(self.active_scans),
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting scanner status: {e}")
            return {"error": str(e)}

    async def start_discovery_scan(
        self,
        chains: List[str] = None,
        max_market_cap: float = 5_000_000,
        max_tokens: int = 100,
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """Startet einen neuen Discovery-Scan"""
        try:
            if not chains:
                chains = ["ethereum", "bsc", "solana", "sui"]

            scan_id = f"discovery_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

            # Neuen Scan-Job erstellen
            scan_job = ScanJob(
                id=scan_id,
                status=ScanStatus.SCANNING,
                progress=0.0,
                start_time=datetime.utcnow(),
                chain=",".join(chains),
                scan_type="discovery"
            )

            self.active_scans[scan_id] = scan_job

            # Scan im Hintergrund starten
            asyncio.create_task(self._run_discovery_scan(
                scan_id, chains, max_market_cap, max_tokens
            ))

            logger.info(f"Started discovery scan {scan_id} for chains: {chains}")

            return {
                "scan_id": scan_id,
                "status": "started",
                "chains": chains,
                "max_market_cap": max_market_cap,
                "max_tokens": max_tokens,
                "priority": priority
            }
        except Exception as e:
            logger.error(f"Error starting discovery scan: {e}")
            raise ScannerException(f"Failed to start discovery scan: {str(e)}")

    async def start_analysis_scan(
        self,
        token_addresses: List[str],
        chain: str,
        include_advanced_metrics: bool = True
    ) -> Dict[str, Any]:
        """Startet einen benutzerdefinierten Analyse-Scan"""
        try:
            scan_id = f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

            # Neuen Scan-Job erstellen
            scan_job = ScanJob(
                id=scan_id,
                status=ScanStatus.ANALYZING,
                progress=0.0,
                start_time=datetime.utcnow(),
                chain=chain,
                scan_type="analysis"
            )

            self.active_scans[scan_id] = scan_job

            # Analyse im Hintergrund starten
            asyncio.create_task(self._run_analysis_scan(
                scan_id, token_addresses, chain, include_advanced_metrics
            ))

            logger.info(f"Started analysis scan {scan_id} for {len(token_addresses)} tokens on {chain}")

            return {
                "scan_id": scan_id,
                "status": "started",
                "token_count": len(token_addresses),
                "chain": chain,
                "include_advanced_metrics": include_advanced_metrics
            }
        except Exception as e:
            logger.error(f"Error starting analysis scan: {e}")
            raise ScannerException(f"Failed to start analysis scan: {str(e)}")

    async def stop_scan(self, scan_id: str) -> Dict[str, Any]:
        """Stoppt einen aktiven Scan"""
        try:
            if scan_id not in self.active_scans:
                raise ScannerException(f"Scan {scan_id} not found or not active")

            scan_job = self.active_scans[scan_id]
            scan_job.status = ScanStatus.STOPPED
            scan_job.end_time = datetime.utcnow()

            # Zum Verlauf hinzufügen
            self.scan_history.append(scan_job)
            del self.active_scans[scan_id]

            logger.info(f"Stopped scan {scan_id}")

            return {
                "scan_id": scan_id,
                "status": "stopped",
                "progress": scan_job.progress,
                "duration_seconds": (scan_job.end_time - scan_job.start_time).total_seconds()
            }
        except Exception as e:
            logger.error(f"Error stopping scan {scan_id}: {e}")
            raise ScannerException(f"Failed to stop scan: {str(e)}")

    async def get_scan_status(self, scan_id: str) -> Dict[str, Any]:
        """Holt den Status eines spezifischen Scans"""
        try:
            if scan_id in self.active_scans:
                scan_job = self.active_scans[scan_id]

                return {
                    "scan_id": scan_id,
                    "status": scan_job.status.value,
                    "progress": scan_job.progress,
                    "start_time": scan_job.start_time.isoformat(),
                    "chain": scan_job.chain,
                    "scan_type": scan_job.scan_type,
                    "tokens_found": scan_job.tokens_found,
                    "tokens_analyzed": scan_job.tokens_analyzed,
                    "high_risk_tokens": scan_job.high_risk_tokens
                }
            else:
                # In der Historie suchen
                for scan in self.scan_history:
                    if scan.id == scan_id:
                        return {
                            "scan_id": scan.id,
                            "status": scan.status.value,
                            "progress": scan.progress,
                            "start_time": scan.start_time.isoformat(),
                            "end_time": scan.end_time.isoformat() if scan.end_time else None,
                            "chain": scan.chain,
                            "scan_type": scan.scan_type,
                            "tokens_found": scan.tokens_found,
                            "tokens_analyzed": scan.tokens_analyzed,
                            "high_risk_tokens": scan.high_risk_tokens,
                            "duration_seconds": (scan.end_time - scan.start_time).total_seconds() if scan.end_time else None
                        }

                raise ScannerException(f"Scan {scan_id} not found")
        except Exception as e:
            logger.error(f"Error getting scan status for {scan_id}: {e}")
            raise ScannerException(f"Failed to get scan status: {str(e)}")

    async def get_scan_results(self, scan_id: str, limit: int = 100) -> Dict[str, Any]:
        """Holt die Ergebnisse eines abgeschlossenen Scans"""
        try:
            # In der Historie suchen
            scan_job = None
            for scan in self.scan_history:
                if scan.id == scan_id:
                    scan_job = scan
                    break

            if not scan_job:
                raise ScannerException(f"Scan results for {scan_id} not found")

            if scan_job.status != ScanStatus.COMPLETED:
                raise ScannerException(f"Scan {scan_id} is not completed")

            # Ergebnisse aus der Datenbank holen
            from app.core.backend_crypto_tracker.processor.database.manager import DatabaseManager

            async with DatabaseManager() as db:
                if scan_job.scan_type == "discovery":
                    # Discovery-Scan-Ergebnisse
                    results = await db.get_scan_results(scan_id, limit)
                elif scan_job.scan_type == "analysis":
                    # Analyse-Scan-Ergebnisse
                    results = await db.get_analysis_results(scan_id, limit)
                else:
                    results = []

            return {
                "scan_id": scan_id,
                "scan_type": scan_job.scan_type,
                "status": scan_job.status.value,
                "start_time": scan_job.start_time.isoformat(),
                "end_time": scan_job.end_time.isoformat() if scan_job.end_time else None,
                "tokens_found": scan_job.tokens_found,
                "tokens_analyzed": scan_job.tokens_analyzed,
                "high_risk_tokens": scan_job.high_risk_tokens,
                "duration_seconds": (scan_job.end_time - scan_job.start_time).total_seconds() if scan_job.end_time else None,
                "results": results[:limit]
            }
        except Exception as e:
            logger.error(f"Error getting scan results for {scan_id}: {e}")
            raise ScannerException(f"Failed to get scan results: {str(e)}")

    async def _run_discovery_scan(
        self,
        scan_id: str,
        chains: List[str],
        max_market_cap: float,
        max_tokens: int
    ):
        """Führt einen Discovery-Scan im Hintergrund durch"""
        try:
            scan_job = self.active_scans.get(scan_id)
            if not scan_job:
                logger.error(f"Scan job {scan_id} not found")
                return

            tokens_found = 0
            high_risk_tokens = 0

            try:
                # Token Discovery durchführen
                async with self.token_discovery:
                    for chain in chains:
                        tokens = await self.token_discovery.discover_tokens(
                            chain, max_market_cap, max_tokens // len(chains)
                        )

                        tokens_found += len(tokens)

                        # Scan-Fortschritt aktualisieren
                        if scan_id in self.active_scans:
                            scan_job.tokens_found = tokens_found
                            scan_job.progress = min(0.9, tokens_found / max_tokens)

                        # Tokens analysieren
                        for token in tokens:
                            try:
                                async with self.token_analyzer as analyzer:
                                    analysis = await analyzer.analyze_token(token)

                                    if analysis.get('token_score', 0) < 30:  # Niedriger Score = hohes Risiko
                                        high_risk_tokens += 1
                            except Exception as e:
                                logger.warning(f"Error analyzing token {token.symbol}: {e}")

                # Scan abschließen
                if scan_id in self.active_scans:
                    scan_job.status = ScanStatus.COMPLETED
                    scan_job.end_time = datetime.utcnow()
                    scan_job.tokens_analyzed = tokens_found
                    scan_job.high_risk_tokens = high_risk_tokens
                    scan_job.progress = 1.0

                    # Zum Verlauf hinzufügen
                    self.scan_history.append(scan_job)
                    del self.active_scans[scan_id]

                logger.info(f"Discovery scan {scan_id} completed: {tokens_found} tokens found, {high_risk_tokens} high risk")

            except Exception as e:
                logger.error(f"Error in discovery scan {scan_id}: {e}")

                if scan_id in self.active_scans:
                    scan_job.status = ScanStatus.FAILED
                    scan_job.end_time = datetime.utcnow()
                    scan_job.error_message = str(e)

                    # Zum Verlauf hinzufügen
                    self.scan_history.append(scan_job)
                    del self.active_scans[scan_id]

        except Exception as e:
            logger.error(f"Critical error in discovery scan {scan_id}: {e}")

            if scan_id in self.active_scans:
                scan_job = self.active_scans[scan_id]
                scan_job.status = ScanStatus.FAILED
                scan_job.end_time = datetime.utcnow()
                scan_job.error_message = str(e)

                # Zum Verlauf hinzufügen
                self.scan_history.append(scan_job)
                del self.active_scans[scan_id]

    async def _run_analysis_scan(
        self,
        scan_id: str,
        token_addresses: List[str],
        chain: str,
        include_advanced_metrics: bool
    ):
        """Führt einen Analyse-Scan im Hintergrund durch"""
        try:
            scan_job = self.active_scans.get(scan_id)
            if not scan_job:
                logger.error(f"Scan job {scan_id} not found")
                return

            tokens_analyzed = 0
            high_risk_tokens = 0

            try:
                # Token-Analysen durchführen
                for i, token_address in enumerate(token_addresses):
                    try:
                        async with self.token_analyzer as analyzer:
                            analysis = await analyzer.analyze_custom_token(token_address, chain)

                            tokens_analyzed += 1

                            # Fortschritt aktualisieren
                            if scan_id in self.active_scans:
                                scan_job.tokens_analyzed = tokens_analyzed
                                scan_job.progress = min(0.9, tokens_analyzed / len(token_addresses))

                            # Risiko bewerten
                            score = analysis.get('score', 50)
                            if include_advanced_metrics:
                                try:
                                    # Erweiterte Analyse durchführen
                                    wallet_analyses = analysis.get('wallet_analyses', {}).get('top_holders', [])

                                    # Erweiterte Scoring-Engine nutzen
                                    advanced_score = await self.scoring_engine.calculate_token_score_advanced(
                                        analysis.get('token_info', {}),
                                        wallet_analyses,
                                        chain
                                    )

                                    if advanced_score.get('institutional_score', 50) < 30:
                                        high_risk_tokens += 1
                                except Exception as e:
                                    logger.warning(f"Error in advanced scoring for {token_address}: {e}")
                            else:
                                if score < 30:
                                    high_risk_tokens += 1
                    except Exception as e:
                        logger.warning(f"Error analyzing token {token_address}: {e}")

                # Scan abschließen
                if scan_id in self.active_scans:
                    scan_job.status = ScanStatus.COMPLETED
                    scan_job.end_time = datetime.utcnow()
                    scan_job.tokens_found = tokens_analyzed
                    scan_job.high_risk_tokens = high_risk_tokens
                    scan_job.progress = 1.0

                    # Zum Verlauf hinzufügen
                    self.scan_history.append(scan_job)
                    del self.active_scans[scan_id]

                logger.info(f"Analysis scan {scan_id} completed: {tokens_analyzed} tokens analyzed, {high_risk_tokens} high risk")

            except Exception as e:
                logger.error(f"Error in analysis scan {scan_id}: {e}")

                if scan_id in self.active_scans:
                    scan_job.status = ScanStatus.FAILED
                    scan_job.end_time = datetime.utcnow()
                    scan_job.error_message = str(e)

                    # Zum Verlauf hinzufügen
                    self.scan_history.append(scan_job)
                    del self.active_scans[scan_id]

        except Exception as e:
            logger.error(f"Critical error in analysis scan {scan_id}: {e}")

            if scan_id in self.active_scans:
                scan_job = self.active_scans[scan_id]
                scan_job.status = ScanStatus.FAILED
                scan_job.end_time = datetime.utcnow()
                scan_job.error_message = str(e)

                # Zum Verlauf hinzufügen
                self.scan_history.append(scan_job)
                del self.active_scans[scan_id]

    async def get_scan_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Holt Statistiken über vergangene Scans"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(days=days)

            # Scans aus der Historie filtern
            recent_scans = [
                scan for scan in self.scan_history
                if scan.start_time >= cutoff_time
            ]

            if not recent_scans:
                return {
                    "period_days": days,
                    "total_scans": 0,
                    "message": "No scans in the specified period"
                }

            # Statistiken berechnen
            total_scans = len(recent_scans)
            completed_scans = len([s for s in recent_scans if s.status == ScanStatus.COMPLETED])
            failed_scans = len([s for s in recent_scans if s.status == ScanStatus.FAILED])

            avg_duration = 0
            completed_with_duration = [s for s in recent_scans
                                       if s.status == ScanStatus.COMPLETED and s.end_time]

            if completed_with_duration:
                total_duration = sum(
                    (s.end_time - s.start_time).total_seconds()
                    for s in completed_with_duration
                )
                avg_duration = total_duration / len(completed_with_duration)

            total_tokens_found = sum(s.tokens_found for s in recent_scans)
            total_tokens_analyzed = sum(s.tokens_analyzed for s in recent_scans)
            total_high_risk_tokens = sum(s.high_risk_tokens for s in recent_scans)

            # Nach Scan-Typ gruppieren
            scan_types = {}
            for scan in recent_scans:
                scan_type = scan.scan_type
                if scan_type not in scan_types:
                    scan_types[scan_type] = {
                        "count": 0,
                        "completed": 0,
                        "tokens_found": 0,
                        "tokens_analyzed": 0
                    }

                scan_types[scan_type]["count"] += 1
                if scan.status == ScanStatus.COMPLETED:
                    scan_types[scan_type]["completed"] += 1

                scan_types[scan_type]["tokens_found"] += scan.tokens_found
                scan_types[scan_type]["tokens_analyzed"] += scan.tokens_analyzed

            return {
                "period_days": days,
                "total_scans": total_scans,
                "completed_scans": completed_scans,
                "failed_scans": failed_scans,
                "success_rate": (completed_scans / total_scans * 100) if total_scans > 0 else 0,
                "average_duration_seconds": avg_duration,
                "total_tokens_found": total_tokens_found,
                "total_tokens_analyzed": total_tokens_analyzed,
                "total_high_risk_tokens": total_high_risk_tokens,
                "scan_types": scan_types,
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting scan statistics: {e}")
            raise ScannerException(f"Failed to get scan statistics: {str(e)}")
