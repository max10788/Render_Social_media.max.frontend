# app/core/backend_crypto_tracker/api/controllers/scanner_controller.py
# Placeholder for API controller to get scanner status
# from ...workers import SchedulerManager # or get status from ScanJobManager

class ScannerController:
    def __init__(self, scheduler_manager): # Inject SchedulerManager instance
        self.scheduler_manager = scheduler_manager

    def get_status(self):
        """Gibt den Status des Schedulers/Scanners zurück."""
        if self.scheduler_manager:
            return self.scheduler_manager.get_status()
        else:
            return {"error": "Scheduler Manager not initialized"}

    # Weitere Methoden zum Steuern des Scanners könnten hier hinzugefügt werden
    # z.B. start_scan(), stop_scheduler(), update_config() etc.

