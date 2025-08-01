# app/core/backend_crypto_tracker/workers/scanner_worker.py
import asyncio
import logging
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import aiofiles
# Import from other modules
# from ..scanner import token_analyzer # For LowCapAnalyzer (ensure it's imported correctly)
# from ..database import database # For DatabaseManager (PostgreSQLManager, MongoDBManager)
# from ..utils import logger # Use project logger if configured
# from ..config import scanner_config # Load config

# --- Logging Setup (Move to utils/logger.py) ---
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#     handlers=[
#         logging.FileHandler('logs/scheduler.log'), # Ensure logs directory exists
#         logging.StreamHandler()
#     ]
# )
# logger = logging.getLogger(__name__)
# --- End Logging Setup ---

# --- Dataclasses (Consider moving to scanner/scoring_engine.py or utils) ---
# from dataclasses import dataclass
# @dataclass
# class ScanConfig:
#     max_market_cap: float = 5000000  # $5M
#     max_tokens_per_scan: int = 100
#     scan_interval_hours: int = 6
#     min_score_for_alert: float = 75.0
#     email_alerts: bool = False
#     telegram_alerts: bool = False
#     export_results: bool = True
#     cleanup_old_data_days: int = 30

# @dataclass
# class AlertConfig:
#     email_host: str = "smtp.gmail.com"
#     email_port: int = 587
#     email_user: str = ""
#     email_password: str = ""
#     email_recipients: List[str] = None
#     telegram_bot_token: str = ""
#     telegram_chat_id: str = ""
# --- End Dataclasses ---

class TokenAlertManager:
    def __init__(self, alert_config): # Use AlertConfig dataclass type hint if moved
        self.config = alert_config
        # self.high_score_tokens: List[Dict] = [] # Not used in provided code

    async def send_email_alert(self, subject: str, body: str):
        """Sendet E-Mail-Benachrichtigungen"""
        # Import smtplib and email.mime modules here or at the top
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        if not self.config.email_user or not self.config.email_recipients:
            return
        try:
            msg = MIMEMultipart()
            msg['From'] = self.config.email_user
            msg['To'] = ", ".join(self.config.email_recipients)
            msg['Subject'] = subject
            # Use MIMEText for HTML content
            msg.attach(MIMEText(body, 'html'))
            # Consider using a context manager or ensuring connection is closed
            server = smtplib.SMTP(self.config.email_host, self.config.email_port)
            server.starttls()
            server.login(self.config.email_user, self.config.email_password)
            server.send_message(msg)
            server.quit() # Ensure connection is closed
            # logger.info(f"E-Mail-Alert gesendet: {subject}")
            print(f"E-Mail-Alert gesendet: {subject}") # Placeholder for logger
        except Exception as e:
            # logger.error(f"Fehler beim Senden der E-Mail: {e}")
            print(f"Fehler beim Senden der E-Mail: {e}") # Placeholder for logger

    async def send_telegram_alert(self, message: str):
        """Sendet Telegram-Benachrichtigungen"""
        if not self.config.telegram_bot_token or not self.config.telegram_chat_id:
            return
        try:
            import aiohttp
            url = f"https://api.telegram.org/bot{self.config.telegram_bot_token}/sendMessage"
            payload = {
                'chat_id': self.config.telegram_chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            # Use the session passed from ScanJobManager or create a new one temporarily
            # async with aiohttp.ClientSession() as session:
            # Better to pass the session from the caller (ScanJobManager)
            # For now, creating a temporary one
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        # logger.info("Telegram-Alert gesendet")
                        print("Telegram-Alert gesendet") # Placeholder for logger
                    else:
                        # logger.error(f"Telegram API Fehler: {response.status}")
                        print(f"Telegram API Fehler: {response.status}") # Placeholder for logger
        except Exception as e:
            # logger.error(f"Fehler beim Senden der Telegram-Nachricht: {e}")
            print(f"Fehler beim Senden der Telegram-Nachricht: {e}") # Placeholder for logger

    def format_token_alert(self, tokens: List[Dict]) -> str:
        """Formatiert Token-Informationen für Alerts"""
        html_body = """
        <html>
        <body>
        <h2>🚨 High-Score Low-Cap Tokens Detected!</h2>
        <p>Die folgenden Tokens haben einen hohen Score erreicht:</p>
        <table border="1" style="border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
            <th>Symbol</th>
            <th>Name</th>
            <th>Score</th>
            <th>Market Cap</th>
            <th>Whale Wallets</th>
            <th>Gini Coefficient</th>
        </tr>
        """
        # Accessing token_data and metrics correctly based on structure
        # Assuming token is a dict with 'token_data' and 'metrics' keys
        # And token_data is a TokenData object or dict
        for token_result in tokens:
            token_data = token_result.get('token_data', {})
            metrics = token_result.get('metrics', {})
            # Handle if token_data is an object or dict
            symbol = getattr(token_data, 'symbol', token_data.get('symbol', 'N/A'))
            name = getattr(token_data, 'name', token_data.get('name', 'N/A'))
            score = token_result.get('token_score', 0)
            market_cap = getattr(token_data, 'market_cap', token_data.get('market_cap', 0))
            whale_wallets = metrics.get('whale_wallets', 0)
            gini_coefficient = metrics.get('gini_coefficient', 0)

            html_body += f"""
            <tr>
                <td>{symbol}</td>
                <td>{name}</td>
                <td style="color: green; font-weight: bold;">{score:.1f}</td>
                <td>${market_cap:,.0f}</td>
                <td>{whale_wallets}</td>
                <td>{gini_coefficient:.3f}</td>
            </tr>
            """
        html_body += """
        </table>
        <p><small>Generiert von Low-Cap Token Analyzer</small></p>
        </body>
        </html>
        """
        return html_body

    async def check_and_send_alerts(self, scan_results: List[Dict], min_score: float):
        """Prüft Scan-Ergebnisse und sendet Alerts"""
        high_score_tokens = [
            result for result in scan_results
            if result.get('token_score', 0) >= min_score
        ]
        if not high_score_tokens:
            return

        # E-Mail Alert
        if self.config.email_recipients and self.config.email_user:
            subject = f"🚨 {len(high_score_tokens)} High-Score Tokens gefunden!"
            body = self.format_token_alert(high_score_tokens)
            await self.send_email_alert(subject, body)

        # Telegram Alert
        if self.config.telegram_bot_token and self.config.telegram_chat_id:
            message = f"🚨 <b>{len(high_score_tokens)} High-Score Tokens gefunden!</b>\n"
            for token_result in high_score_tokens[:5]:  # Max 5 für Telegram
                symbol = getattr(token_result.get('token_data', {}), 'symbol', token_result.get('token_data', {}).get('symbol', 'N/A'))
                score = token_result.get('token_score', 0)
                message += f"• <b>{symbol}</b> - Score: {score:.1f}\n"
            if len(high_score_tokens) > 5:
                message += f"\n... und {len(high_score_tokens) - 5} weitere"
            await self.send_telegram_alert(message)

# Placeholder for ScanJobManager - needs integration with other components
class ScanJobManager:
    def __init__(self, config, alert_config): # Use ScanConfig and AlertConfig type hints
        self.config = config
        self.alert_manager = TokenAlertManager(alert_config)
        # self.db_manager = None # Inject or initialize
        # self.analyzer = None # Inject or initialize
        self.is_running = False
        self.last_scan_time = None
        self.scan_stats = {
            'total_scans': 0,
            'successful_scans': 0,
            'failed_scans': 0,
            'tokens_processed': 0,
            'high_score_tokens_found': 0
        }

    # async def initialize(self):
    #     """Initialisiert Database Manager und Analyzer"""
    #     try:
    #         # self.db_manager = DatabaseFactory.create_manager(...) # Use database managers
    #         # analyzer_config = {...} # Load from config
    #         # self.analyzer = LowCapAnalyzer(analyzer_config) # Use scanner analyzer
    #         # logger.info("Scan Job Manager initialisiert")
    #         print("Scan Job Manager initialisiert") # Placeholder
    #     except Exception as e:
    #         # logger.error(f"Fehler bei der Initialisierung: {e}")
    #         print(f"Fehler bei der Initialisierung: {e}") # Placeholder
    #         raise

    async def run_scan_job(self) -> Dict:
        """Führt einen kompletten Scan-Job aus"""
        if self.is_running:
            # logger.warning("Scan läuft bereits, überspringe...")
            print("Scan läuft bereits, überspringe...") # Placeholder
            return {'status': 'skipped', 'reason': 'already_running'}

        self.is_running = True
        start_time = datetime.now()
        job_result = {'status': 'unknown'}

        try:
            # logger.info("Starte automatisierten Scan-Job...")
            print("Starte automatisierten Scan-Job...") # Placeholder
            self.scan_stats['total_scans'] += 1

            # --- Integration Point: Analyzer ---
            # Führe Scan durch
            # async with self.analyzer: # Ensure analyzer is initialized
            #     scan_results = await self.analyzer.scan_low_cap_tokens(
            #         max_tokens=self.config.max_tokens_per_scan
            #     )
            # Placeholder for scan results
            scan_results = [] # This needs to be filled by the actual analyzer
            # --- End Integration Point ---

            if not scan_results:
                # logger.warning("Keine Scan-Ergebnisse erhalten")
                print("Keine Scan-Ergebnisse erhalten") # Placeholder
                self.scan_stats['failed_scans'] += 1
                job_result = {'status': 'failed', 'reason': 'no_results'}
                return job_result

            # --- Integration Point: Database ---
            # Speichere Ergebnisse in Datenbank
            saved_count = 0
            # for result in scan_results:
            #     try:
            #         # Ensure result structure matches what db_manager expects
            #         # If db_manager is PostgreSQLManager
            #         if hasattr(self.db_manager, 'save_token_analysis'):
            #             self.db_manager.save_token_analysis(
            #                 token_data=result['token_data'].__dict__, # Or pass the object directly if supported
            #                 wallet_analyses=[wa.__dict__ for wa in result['wallet_analyses']], # Or pass objects
            #                 metrics=result['metrics']
            #             )
            #         # If db_manager is MongoDBManager
            #         elif hasattr(self.db_manager, 'save_token_analysis'): # Assuming it's an async method
            #             await self.db_manager.save_token_analysis(
            #                 token_data=result['token_data'].__dict__,
            #                 wallet_analyses=[wa.__dict__ for wa in result['wallet_analyses']],
            #                 metrics=result['metrics']
            #             )
            #         saved_count += 1
            #     except Exception as e:
            #         # logger.error(f"Fehler beim Speichern von {result['token_data'].symbol}: {e}")
            #         symbol = getattr(result.get('token_data', {}), 'symbol', 'Unknown')
            #         print(f"Fehler beim Speichern von {symbol}: {e}") # Placeholder
            # --- End Integration Point ---

            # Statistiken aktualisieren
            self.scan_stats['successful_scans'] += 1
            self.scan_stats['tokens_processed'] += len(scan_results)

            # High-Score Tokens identifizieren
            high_score_tokens = [
                result for result in scan_results
                if result.get('token_score', 0) >= self.config.min_score_for_alert
            ]
            self.scan_stats['high_score_tokens_found'] += len(high_score_tokens)

            # Alerts senden
            if high_score_tokens and (self.config.email_alerts or self.config.telegram_alerts):
                await self.alert_manager.check_and_send_alerts(
                    high_score_tokens,
                    self.config.min_score_for_alert
                )

            # Exportiere Ergebnisse
            if self.config.export_results:
                await self.export_scan_results(scan_results)

            # Bereinige alte Daten
            if self.config.cleanup_old_data_days > 0:
                await self.cleanup_old_data()

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            self.last_scan_time = end_time

            job_result = {
                'status': 'success',
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': duration,
                'tokens_scanned': len(scan_results),
                'tokens_saved': saved_count,
                'high_score_tokens': len(high_score_tokens),
                'scan_stats': self.scan_stats.copy()
            }
            # logger.info(f"Scan-Job abgeschlossen: {len(scan_results)} Tokens verarbeitet, "
            #            f"{len(high_score_tokens)} High-Score Tokens gefunden")
            print(f"Scan-Job abgeschlossen: {len(scan_results)} Tokens verarbeitet, "
                       f"{len(high_score_tokens)} High-Score Tokens gefunden") # Placeholder

        except Exception as e:
            # logger.error(f"Fehler beim Scan-Job: {e}")
            print(f"Fehler beim Scan-Job: {e}") # Placeholder
            self.scan_stats['failed_scans'] += 1
            job_result = {
                'status': 'error',
                'error': str(e),
                'start_time': start_time.isoformat() if start_time else None,
                'end_time': datetime.now().isoformat()
            }
        finally:
            self.is_running = False

        return job_result

    async def export_scan_results(self, scan_results: List[Dict]):
        """Exportiert Scan-Ergebnisse"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # JSON Export
            json_filename = f"exports/scan_results_{timestamp}.json"
            # Ensure exports directory exists
            os.makedirs(os.path.dirname(json_filename), exist_ok=True)
            export_data = []
            for result in scan_results:
                token_data_obj = result.get('token_data', {})
                # Handle if token_data is an object or dict
                token_data_dict = {}
                if hasattr(token_data_obj, '__dict__'):
                     token_data_dict = token_data_obj.__dict__
                else:
                     token_data_dict = token_data_obj

                wallet_analyses_list = result.get('wallet_analyses', [])
                wallet_analyses_export = []
                for wa_obj in wallet_analyses_list:
                    wa_dict = {}
                    if hasattr(wa_obj, '__dict__'):
                         wa_dict = wa_obj.__dict__
                    else:
                         wa_dict = wa_obj
                    # Extract specific fields for export
                    wallet_analyses_export.append({
                        'address': wa_dict.get('address', wa_dict.get('wallet_address', '')),
                        'type': str(wa_dict.get('wallet_type', '')), # Convert Enum to string
                        'percentage': wa_dict.get('percentage_of_supply', 0),
                        'balance': wa_dict.get('balance', 0)
                    })

                export_data.append({
                    'token': {
                        'address': token_data_dict.get('address', ''),
                        'name': token_data_dict.get('name', ''),
                        'symbol': token_data_dict.get('symbol', '').upper(),
                        'chain': token_data_dict.get('chain', ''),
                        'market_cap': token_data_dict.get('market_cap', 0),
                        'volume_24h': token_data_dict.get('volume_24h', 0)
                        # Add other fields as needed
                    },
                    'score': result.get('token_score', 0),
                    'metrics': result.get('metrics', {}),
                    'analysis_date': result.get('analysis_date', datetime.min).isoformat(),
                    'wallet_analyses': wallet_analyses_export
                })
            # Use aiofiles for async file writing
            async with aiofiles.open(json_filename, 'w') as f:
                await f.write(json.dumps(export_data, indent=2, default=str)) # default=str for datetime
            # logger.info(f"Scan-Ergebnisse exportiert nach: {json_filename}")
            print(f"Scan-Ergebnisse exportiert nach: {json_filename}") # Placeholder
        except Exception as e:
            # logger.error(f"Fehler beim Exportieren: {e}")
            print(f"Fehler beim Exportieren: {e}") # Placeholder

    async def cleanup_old_data(self):
        """Bereinigt alte Daten aus der Datenbank"""
        try:
            cutoff_date = datetime.now() - timedelta(days=self.config.cleanup_old_data_days)
            # Implementierung je nach Datenbank-Typ
            # logger.info(f"Bereinige Daten älter als {cutoff_date}")
            print(f"Bereinige Daten älter als {cutoff_date}") # Placeholder
            # This would involve calling a method on self.db_manager
        except Exception as e:
            # logger.error(f"Fehler bei der Datenbereinigung: {e}")
            print(f"Fehler bei der Datenbereinigung: {e}") # Placeholder

    def get_status(self) -> Dict:
        """Gibt den aktuellen Status zurück"""
        return {
            'is_running': self.is_running,
            'last_scan_time': self.last_scan_time.isoformat() if self.last_scan_time else None,
            'scan_stats': self.scan_stats.copy(),
            'config': {
                'scan_interval_hours': self.config.scan_interval_hours,
                'max_tokens_per_scan': self.config.max_tokens_per_scan,
                'min_score_for_alert': self.config.min_score_for_alert
            }
        }


# Beispiel-Verwendung - könnte in ein separates Skript oder die main App
# async def main():
#     # Load config (from env, file, etc.)
#     scan_config = ScanConfig(...) # Populate from environment/config
#     alert_config = AlertConfig(...) # Populate from environment/config
#
#     job_manager = ScanJobManager(scan_config, alert_config)
#     # await job_manager.initialize() # If needed
#
#     result = await job_manager.run_scan_job()
#     print(json.dumps(result, indent=2))
#
# if __name__ == "__main__":
#     asyncio.run(main())
