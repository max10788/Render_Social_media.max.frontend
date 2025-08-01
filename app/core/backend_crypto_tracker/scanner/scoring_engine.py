# app/core/backend_crypto_tracker/scanner/scoring_engine.py
# Move ScanConfig and AlertConfig here or to utils if they are more general
from dataclasses import dataclass
from typing import List

@dataclass
class ScanConfig:
    max_market_cap: float = 5000000  # $5M
    max_tokens_per_scan: int = 100
    scan_interval_hours: int = 6
    min_score_for_alert: float = 75.0
    email_alerts: bool = False
    telegram_alerts: bool = False
    export_results: bool = True
    cleanup_old_data_days: int = 30

@dataclass
class AlertConfig:
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_user: str = ""
    email_password: str = ""
    email_recipients: List[str] = None # type: ignore
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

# Potentially scoring related functions could go here if separated from LowCapAnalyzer
# def calculate_token_score_generic(...): ...

