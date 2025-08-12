# workers/scheduler.py
import os
import logging
import asyncio
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.workers.scanner_worker import ScanJobManager, ScanConfig, AlertConfig

logger = get_logger(__name__)

@dataclass
class SchedulerConfig:
    scan_interval_hours: int = field(default_factory=lambda: int(os.getenv('SCAN_INTERVAL_HOURS', '6')))
    initial_scan_on_startup: bool = field(default_factory=lambda: os.getenv('INITIAL_SCAN_ON_STARTUP', 'true').lower() == 'true')
    enabled: bool = field(default_factory=lambda: os.getenv('SCHEDULER_ENABLED', 'true').lower() == 'true')
    max_concurrent_jobs: int = field(default_factory=lambda: int(os.getenv('MAX_CONCURRENT_JOBS', '1')))
    job_timeout_minutes: int = field(default_factory=lambda: int(os.getenv('JOB_TIMEOUT_MINUTES', '60')))

class SchedulerManager:
    def __init__(self, scheduler_config: SchedulerConfig = None, 
                 scan_config: ScanConfig = None, 
                 alert_config: AlertConfig = None):
        self.config = scheduler_config or SchedulerConfig()
        self.scan_config = scan_config or ScanConfig()
        self.alert_config = alert_config or AlertConfig()
        
        self.job_manager = None
        self.scheduler_thread = None
        self.is_running = False
        self.last_run_time = None
        self.next_run_time = None
        self.current_job = None
        self.job_history = []
        self.max_history_size = 100
        
        # Lock für Thread-Sicherheit
        self._lock = threading.Lock()
    
    async def initialize(self):
        """Initialisiert den Scheduler und den Job Manager"""
        try:
            # Initialisiere den Job Manager
            self.job_manager = ScanJobManager(self.scan_config, self.alert_config)
            await self.job_manager.initialize()
            
            logger.info("Scheduler initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing scheduler: {e}")
            raise
    
    async def start(self):
        """Startet den Scheduler"""
        if not self.config.enabled:
            logger.info("Scheduler is disabled")
            return
            
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        try:
            # Berechne die nächste Laufzeit
            self._calculate_next_run_time()
            
            # Führe initialen Scan aus, wenn konfiguriert
            if self.config.initial_scan_on_startup:
                logger.info("Running initial scan...")
                await self._run_job()
            
            # Starte den Scheduler-Thread
            self.is_running = True
            self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.scheduler_thread.start()
            
            logger.info(f"Scheduler started - next run at {self.next_run_time}")
        except Exception as e:
            logger.error(f"Error starting scheduler: {e}")
            raise
    
    def stop(self):
        """Stoppt den Scheduler"""
        if not self.is_running:
            logger.warning("Scheduler is not running")
            return
        
        with self._lock:
            self.is_running = False
        
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.scheduler_thread.join(timeout=5)
        
        logger.info("Scheduler stopped")
    
    async def close(self):
        """Schließt die Ressourcen des Schedulers"""
        self.stop()
        
        if self.job_manager:
            await self.job_manager.close()
        
        logger.info("Scheduler resources closed")
    
    def _run_scheduler(self):
        """Hauptfunktion des Scheduler-Threads"""
        while self.is_running:
            try:
                # Prüfe, ob es Zeit für den nächsten Job ist
                if self.next_run_time and datetime.now() >= self.next_run_time:
                    asyncio.run(self._run_job())
                    self._calculate_next_run_time()
                
                # Warte eine Minute vor der nächsten Prüfung
                time.sleep(60)
            except Exception as e:
                logger.error(f"Error in scheduler thread: {e}")
                time.sleep(60)  # Warte eine Minute bei Fehlern
    
    async def _run_job(self):
        """Führt einen geplanten Job aus"""
        if not self.job_manager:
            logger.error("Job manager not initialized")
            return
        
        with self._lock:
            if self.current_job:
                logger.warning("A job is already running, skipping scheduled run")
                return
            
            self.current_job = {
                'start_time': datetime.now(),
                'status': 'running'
            }
        
        try:
            logger.info("Starting scheduled scan job...")
            
            # Führe den Job mit Timeout aus
            job_result = await asyncio.wait_for(
                self.job_manager.run_scan_job(),
                timeout=self.config.job_timeout_minutes * 60
            )
            
            # Aktualisiere den Job-Status
            with self._lock:
                self.current_job['end_time'] = datetime.now()
                self.current_job['status'] = 'completed'
                self.current_job['result'] = job_result
            
            # Speichere den Job in der Historie
            self._add_to_job_history(self.current_job)
            
            # Aktualisiere die letzte Laufzeit
            self.last_run_time = self.current_job['end_time']
            
            logger.info(f"Scheduled job completed successfully")
        except asyncio.TimeoutError:
            with self._lock:
                self.current_job['end_time'] = datetime.now()
                self.current_job['status'] = 'timeout'
                self.current_job['error'] = 'Job timed out'
            
            self._add_to_job_history(self.current_job)
            logger.error(f"Scheduled job timed out after {self.config.job_timeout_minutes} minutes")
        except Exception as e:
            with self._lock:
                self.current_job['end_time'] = datetime.now()
                self.current_job['status'] = 'failed'
                self.current_job['error'] = str(e)
            
            self._add_to_job_history(self.current_job)
            logger.error(f"Error in scheduled job: {e}")
        finally:
            with self._lock:
                self.current_job = None
    
    def _calculate_next_run_time(self):
        """Berechnet die nächste Laufzeit basierend auf dem Intervall"""
        now = datetime.now()
        
        if self.last_run_time:
            # Berechne basierend auf der letzten Laufzeit
            self.next_run_time = self.last_run_time + timedelta(hours=self.config.scan_interval_hours)
        else:
            # Berechne basierend auf der aktuellen Zeit
            self.next_run_time = now + timedelta(hours=self.config.scan_interval_hours)
    
    def _add_to_job_history(self, job: Dict[str, Any]):
        """Fügt einen Job zur Historie hinzu"""
        with self._lock:
            self.job_history.append(job)
            
            # Begrenze die Größe der Historie
            if len(self.job_history) > self.max_history_size:
                self.job_history = self.job_history[-self.max_history_size:]
    
    async def run_job_now(self) -> Dict[str, Any]:
        """Führt einen Job sofort aus (manueller Trigger)"""
        if not self.job_manager:
            raise RuntimeError("Job manager not initialized")
        
        logger.info("Running manual scan job...")
        
        with self._lock:
            if self.current_job:
                raise RuntimeError("A job is already running")
            
            self.current_job = {
                'start_time': datetime.now(),
                'status': 'running',
                'manual': True
            }
        
        try:
            # Führe den Job aus
            job_result = await self.job_manager.run_scan_job()
            
            # Aktualisiere den Job-Status
            with self._lock:
                self.current_job['end_time'] = datetime.now()
                self.current_job['status'] = 'completed'
                self.current_job['result'] = job_result
            
            # Speichere den Job in der Historie
            self._add_to_job_history(self.current_job)
            
            # Aktualisiere die letzte Laufzeit
            self.last_run_time = self.current_job['end_time']
            
            # Berechne die nächste Laufzeit neu
            self._calculate_next_run_time()
            
            logger.info("Manual job completed successfully")
            return job_result
        except Exception as e:
            with self._lock:
                self.current_job['end_time'] = datetime.now()
                self.current_job['status'] = 'failed'
                self.current_job['error'] = str(e)
            
            self._add_to_job_history(self.current_job)
            logger.error(f"Error in manual job: {e}")
            raise
        finally:
            with self._lock:
                self.current_job = None
    
    def get_status(self) -> Dict[str, Any]:
        """Gibt den aktuellen Status des Schedulers zurück"""
        with self._lock:
            current_job = self.current_job.copy() if self.current_job else None
            
            if current_job and 'start_time' in current_job:
                # Konvertiere datetime-Objekte in Strings für die JSON-Serialisierung
                if isinstance(current_job['start_time'], datetime):
                    current_job['start_time'] = current_job['start_time'].isoformat()
                if 'end_time' in current_job and isinstance(current_job['end_time'], datetime):
                    current_job['end_time'] = current_job['end_time'].isoformat()
            
            job_history = []
            for job in self.job_history[-10:]:  # Zeige nur die letzten 10 Jobs
                job_copy = job.copy()
                if isinstance(job_copy['start_time'], datetime):
                    job_copy['start_time'] = job_copy['start_time'].isoformat()
                if 'end_time' in job_copy and isinstance(job_copy['end_time'], datetime):
                    job_copy['end_time'] = job_copy['end_time'].isoformat()
                job_history.append(job_copy)
        
        return {
            'is_running': self.is_running,
            'enabled': self.config.enabled,
            'last_run_time': self.last_run_time.isoformat() if self.last_run_time else None,
            'next_run_time': self.next_run_time.isoformat() if self.next_run_time else None,
            'current_job': current_job,
            'job_history': job_history,
            'config': {
                'scan_interval_hours': self.config.scan_interval_hours,
                'initial_scan_on_startup': self.config.initial_scan_on_startup,
                'max_concurrent_jobs': self.config.max_concurrent_jobs,
                'job_timeout_minutes': self.config.job_timeout_minutes
            },
            'job_manager_status': self.job_manager.get_status() if self.job_manager else {}
        }

# Beispiel für die Verwendung
async def main():
    # Konfiguration laden
    scheduler_config = SchedulerConfig(
        scan_interval_hours=6,
        initial_scan_on_startup=True,
        enabled=True
    )
    
    scan_config = ScanConfig(
        max_market_cap=5_000_000,
        max_tokens_per_scan=50,
        scan_interval_hours=6,
        min_score_for_alert=75.0,
        email_alerts=True,
        telegram_alerts=True,
        export_results=True,
        cleanup_old_data_days=30
    )
    
    alert_config = AlertConfig(
        email_user=os.getenv("EMAIL_USER"),
        email_password=os.getenv("EMAIL_PASSWORD"),
        email_recipients=[os.getenv("EMAIL_RECIPIENT")],
        telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN"),
        telegram_chat_id=os.getenv("TELEGRAM_CHAT_ID")
    )
    
    # Erstelle und starte den Scheduler
    scheduler = SchedulerManager(scheduler_config, scan_config, alert_config)
    await scheduler.initialize()
    await scheduler.start()
    
    # Warte eine Weile, um den Scheduler in Aktion zu sehen
    try:
        while True:
            await asyncio.sleep(60)
            status = scheduler.get_status()
            print(f"Scheduler status: {status['is_running']}, next run: {status['next_run_time']}")
    except KeyboardInterrupt:
        await scheduler.close()

if __name__ == "__main__":
    asyncio.run(main())
