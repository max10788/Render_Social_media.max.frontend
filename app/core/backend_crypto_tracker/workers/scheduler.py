# app/core/backend_crypto_tracker/workers/scheduler.py
import schedule
import time
import logging
import threading
import asyncio
import os
from datetime import datetime
from typing import Dict, Optional
# from .scanner_worker import ScanJobManager # Oder korrekter Importpfad
# from ..database.manager import DatabaseManager # Falls benötigt

logger = logging.getLogger(__name__)

class SchedulerManager:
    def __init__(self):
        self.job_manager = None
        self.scheduler_thread = None
        self.is_running = False
        # Lade Konfiguration aus Umgebungsvariablen (wie im Setup-Skript)
        self.scan_interval_hours = int(os.getenv('SCAN_INTERVAL_HOURS', 6))

    async def start(self):
        """Startet den Scheduler"""
        if self.is_running:
            logger.warning("Scheduler läuft bereits")
            return
        try:
            # TODO: Initialisiere Job Manager
            # self.job_manager = ScanJobManager(...)
            # await self.job_manager.initialize()

            # Setup Schedule (wie im Setup-Skript)
            schedule.every(self.scan_interval_hours).hours.do(
                self._run_scheduled_job
            )

            # Führe ersten Scan sofort aus (optional, wie im Setup-Skript)
            logger.info("Führe initialen Scan aus...")
            # await self.job_manager.run_scan_job() # Uncomment if desired

            # Starte Scheduler Thread
            self.is_running = True
            self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.scheduler_thread.start()
            logger.info(f"Scheduler gestartet - Scans alle {self.scan_interval_hours} Stunden")
        except Exception as e:
            logger.error(f"Fehler beim Starten des Schedulers: {e}")
            raise

    def _run_scheduled_job(self):
        """Wrapper für async Job-Ausführung"""
        # Wie im Setup-Skript
        try:
            asyncio.run(self.job_manager.run_scan_job())
        except Exception as e:
            logger.error(f"Error in scheduled job: {e}")

    def _run_scheduler(self):
        """Läuft im separaten Thread"""
        # Wie im Setup-Skript
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    def stop(self):
        """Stoppt den Scheduler"""
        # Wie im Setup-Skript
        self.is_running = False
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.scheduler_thread.join(timeout=5)
        logger.info("Scheduler gestoppt")

    def get_status(self) -> Dict:
        """Gibt den Scheduler-Status zurück"""
        # Vereinfachte Version
        jobs = schedule.get_jobs()
        next_run = None
        if jobs and hasattr(jobs[0], 'next_run'):
            next_run = jobs[0].next_run.isoformat() if jobs[0].next_run else None

        return {
            'is_running': self.is_running,
            'next_run': next_run,
            'scheduled_jobs': len(jobs),
            # 'job_manager_status': self.job_manager.get_status() if self.job_manager else {}
        }

    async def close(self):
        """Schließt Ressourcen"""
        self.stop()
        # if self.job_manager:
        #     await self.job_manager.close()
        logger.info("SchedulerManager Ressourcen geschlossen")
