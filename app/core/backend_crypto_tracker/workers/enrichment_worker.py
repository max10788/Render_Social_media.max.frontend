# workers/enrichment_worker.py
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.exceptions import APIException, DatabaseException
from app.core.backend_crypto_tracker.utils.cache import AnalysisCache
from app.core.backend_crypto_tracker.processor.database.manager import DatabaseManager
from app.core.backend_crypto_tracker.processor.database.models.token import Token
from app.core.backend_crypto_tracker.processor.database.models.wallet import WalletAnalysis
from app.core.backend_crypto_tracker.services.multichain.community_labels_service import CommunityLabelsAPI
from app.core.backend_crypto_tracker.services.multichain.chainalysis_service import ChainalysisService
from app.core.backend_crypto_tracker.services.multichain.elliptic_service import EllipticService

logger = get_logger(__name__)

@dataclass
class EnrichmentTask:
    id: str
    task_type: str
    chain: str
    address: str
    data: Optional[Dict] = None
    created_at: datetime = None
    priority: int = 0
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

class EnrichmentWorker:
    def __init__(self, db_manager: DatabaseManager, config: Dict[str, Any]):
        self.db_manager = db_manager
        self.config = config
        self.community_labels = CommunityLabelsAPI(config.get('community_labels'))
        self.chainalysis = ChainalysisService(config.get('chainalysis_api_key'))
        self.elliptic = EllipticService(config.get('elliptic_api_key'))
        self.cache = AnalysisCache()
        self.is_running = False
        self.tasks: List[EnrichmentTask] = []
        self.stats = {
            'total_tasks_processed': 0,
            'successful_tasks': 0,
            'failed_tasks': 0,
            'tasks_by_type': {},
            'last_run_time': None
        }
    
    async def start(self):
        """Startet den Enrichment Worker"""
        if self.is_running:
            logger.warning("Enrichment worker is already running")
            return
        
        self.is_running = True
        logger.info("Starting enrichment worker")
        
        while self.is_running:
            try:
                await self._process_tasks()
                self.stats['last_run_time'] = datetime.now()
                
                # Wartezeit zwischen den Durchläufen
                await asyncio.sleep(30)  # 30 Sekunden
            except Exception as e:
                logger.error(f"Error in enrichment worker: {e}")
                await asyncio.sleep(15)  # Kürzere Wartezeit bei Fehlern
    
    async def stop(self):
        """Stoppt den Enrichment Worker"""
        self.is_running = False
        logger.info("Stopping enrichment worker")
    
    async def add_task(self, task_type: str, chain: str, address: str, data: Optional[Dict] = None, priority: int = 0) -> str:
        """Fügt eine Anreicherungsaufgabe hinzu"""
        task_id = f"{task_type}_{chain}_{address}_{datetime.now().timestamp()}"
        task = EnrichmentTask(
            id=task_id,
            task_type=task_type,
            chain=chain,
            address=address,
            data=data,
            priority=priority
        )
        
        # Füge die Aufgabe sortiert nach Priorität hinzu
        self.tasks.append(task)
        self.tasks.sort(key=lambda t: t.priority, reverse=True)
        
        logger.debug(f"Added enrichment task: {task_id}")
        return task_id
    
    async def _process_tasks(self):
        """Verarbeitet alle anstehenden Aufgaben"""
        if not self.tasks:
            return
        
        # Kopiere die Aufgabenliste, um Probleme mit gleichzeitigen Änderungen zu vermeiden
        tasks_to_process = self.tasks.copy()
        self.tasks.clear()
        
        for task in tasks_to_process:
            try:
                await self._process_task(task)
                self.stats['successful_tasks'] += 1
            except Exception as e:
                logger.error(f"Error processing task {task.id}: {e}")
                self.stats['failed_tasks'] += 1
            
            self.stats['total_tasks_processed'] += 1
            
            # Aktualisiere die Statistiken nach Aufgabentyp
            task_type = task.task_type
            if task_type not in self.stats['tasks_by_type']:
                self.stats['tasks_by_type'][task_type] = 0
            self.stats['tasks_by_type'][task_type] += 1
    
    async def _process_task(self, task: EnrichmentTask):
        """Verarbeitet eine einzelne Anreicherungsaufgabe"""
        logger.debug(f"Processing enrichment task: {task.id}")
        
        if task.task_type == 'address_labels':
            await self._enrich_address_labels(task.chain, task.address)
        elif task.task_type == 'token_metadata':
            await self._enrich_token_metadata(task.chain, task.address)
        elif task.task_type == 'risk_score':
            await self._enrich_risk_score(task.chain, task.address, task.data)
        elif task.task_type == 'transaction_analysis':
            await self._enrich_transaction_analysis(task.chain, task.address, task.data)
        else:
            logger.warning(f"Unknown task type: {task.task_type}")
    
    async def _enrich_address_labels(self, chain: str, address: str):
        """Reichert eine Adresse mit Labels an"""
        try:
            # Prüfe den Cache
            cache_key = f"address_labels_{chain}_{address}"
            cached_data = await self.cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Using cached labels for {address}")
                return
            
            # Hole Labels von verschiedenen Quellen
            labels = {}
            
            # Community Labels
            try:
                community_labels = await self.community_labels.get_address_labels(address, chain)
                labels['community'] = community_labels
            except Exception as e:
                logger.error(f"Error getting community labels for {address}: {e}")
            
            # Chainalysis Labels (wenn verfügbar)
            if self.config.get('chainalysis_api_key'):
                try:
                    chainalysis_labels = await self.chainalysis.get_address_labels(address, chain)
                    labels['chainalysis'] = chainalysis_labels
                except Exception as e:
                    logger.error(f"Error getting Chainalysis labels for {address}: {e}")
            
            # Elliptic Labels (wenn verfügbar)
            if self.config.get('elliptic_api_key'):
                try:
                    elliptic_labels = await self.elliptic.get_address_labels(address, chain)
                    labels['elliptic'] = elliptic_labels
                except Exception as e:
                    logger.error(f"Error getting Elliptic labels for {address}: {e}")
            
            # Speichere die Labels in der Datenbank
            await self.db_manager.save_address_labels(chain, address, labels)
            
            # Speichere die Labels im Cache
            await self.cache.set(labels, ttl=3600, cache_key)  # 1 Stunde Cache
            
            logger.info(f"Enriched address labels for {address} on {chain}")
        except Exception as e:
            logger.error(f"Error enriching address labels for {address}: {e}")
            raise
    
    async def _enrich_token_metadata(self, chain: str, token_address: str):
        """Reichert Token-Metadaten an"""
        try:
            # Prüfe den Cache
            cache_key = f"token_metadata_{chain}_{token_address}"
            cached_data = await self.cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Using cached metadata for {token_address}")
                return
            
            # Hole das Token aus der Datenbank
            token = await self.db_manager.get_token_by_address(token_address, chain)
            
            if not token:
                logger.warning(f"Token not found: {token_address} on {chain}")
                return
            
            # Bereits vorhandene Metadaten
            metadata = {
                'name': token.name,
                'symbol': token.symbol,
                'decimals': token.decimals if hasattr(token, 'decimals') else None
            }
            
            # Zusätzliche Metadaten von verschiedenen Quellen
            # Community Labels
            try:
                community_metadata = await self.community_labels.get_token_metadata(token_address, chain)
                metadata['community'] = community_metadata
            except Exception as e:
                logger.error(f"Error getting community metadata for {token_address}: {e}")
            
            # Speichere die Metadaten in der Datenbank
            await self.db_manager.save_token_metadata(chain, token_address, metadata)
            
            # Speichere die Metadaten im Cache
            await self.cache.set(metadata, ttl=3600, cache_key)  # 1 Stunde Cache
            
            logger.info(f"Enriched token metadata for {token_address} on {chain}")
        except Exception as e:
            logger.error(f"Error enriching token metadata for {token_address}: {e}")
            raise
    
    async def _enrich_risk_score(self, chain: str, address: str, data: Optional[Dict] = None):
        """Reichert eine Adresse mit Risiko-Scores an"""
        try:
            # Prüfe den Cache
            cache_key = f"risk_score_{chain}_{address}"
            cached_data = await self.cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Using cached risk score for {address}")
                return
            
            risk_scores = {}
            
            # Chainalysis Risiko-Score (wenn verfügbar)
            if self.config.get('chainalysis_api_key'):
                try:
                    chainalysis_score = await self.chainalysis.get_address_risk_score(address, chain)
                    risk_scores['chainalysis'] = chainalysis_score
                except Exception as e:
                    logger.error(f"Error getting Chainalysis risk score for {address}: {e}")
            
            # Elliptic Risiko-Score (wenn verfügbar)
            if self.config.get('elliptic_api_key'):
                try:
                    elliptic_score = await self.elliptic.get_address_risk_score(address, chain)
                    risk_scores['elliptic'] = elliptic_score
                except Exception as e:
                    logger.error(f"Error getting Elliptic risk score for {address}: {e}")
            
            # Community Risiko-Score
            try:
                community_score = await self.community_labels.get_address_risk_score(address, chain)
                risk_scores['community'] = community_score
            except Exception as e:
                logger.error(f"Error getting community risk score for {address}: {e}")
            
            # Berechne einen aggregierten Risiko-Score
            aggregated_score = self._calculate_aggregated_risk_score(risk_scores)
            risk_scores['aggregated'] = aggregated_score
            
            # Speichere die Risiko-Scores in der Datenbank
            await self.db_manager.save_address_risk_scores(chain, address, risk_scores)
            
            # Speichere die Risiko-Scores im Cache
            await self.cache.set(risk_scores, ttl=3600, cache_key)  # 1 Stunde Cache
            
            logger.info(f"Enriched risk score for {address} on {chain}")
        except Exception as e:
            logger.error(f"Error enriching risk score for {address}: {e}")
            raise
    
    async def _enrich_transaction_analysis(self, chain: str, tx_hash: str, data: Optional[Dict] = None):
        """Reichert eine Transaktionsanalyse an"""
        try:
            # Prüfe den Cache
            cache_key = f"tx_analysis_{chain}_{tx_hash}"
            cached_data = await self.cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Using cached transaction analysis for {tx_hash}")
                return
            
            # Hole die Transaktion aus der Datenbank
            transaction = await self.db_manager.get_transaction_by_hash(tx_hash, chain)
            
            if not transaction:
                logger.warning(f"Transaction not found: {tx_hash} on {chain}")
                return
            
            # Analysiere die Transaktion
            analysis = {}
            
            # Community Analyse
            try:
                community_analysis = await self.community_labels.analyze_transaction(tx_hash, chain)
                analysis['community'] = community_analysis
            except Exception as e:
                logger.error(f"Error getting community analysis for {tx_hash}: {e}")
            
            # Chainalysis Analyse (wenn verfügbar)
            if self.config.get('chainalysis_api_key'):
                try:
                    chainalysis_analysis = await self.chainalysis.analyze_transaction(tx_hash, chain)
                    analysis['chainalysis'] = chainalysis_analysis
                except Exception as e:
                    logger.error(f"Error getting Chainalysis analysis for {tx_hash}: {e}")
            
            # Elliptic Analyse (wenn verfügbar)
            if self.config.get('elliptic_api_key'):
                try:
                    elliptic_analysis = await self.elliptic.analyze_transaction(tx_hash, chain)
                    analysis['elliptic'] = elliptic_analysis
                except Exception as e:
                    logger.error(f"Error getting Elliptic analysis for {tx_hash}: {e}")
            
            # Speichere die Analyse in der Datenbank
            await self.db_manager.save_transaction_analysis(chain, tx_hash, analysis)
            
            # Speichere die Analyse im Cache
            await self.cache.set(analysis, ttl=3600, cache_key)  # 1 Stunde Cache
            
            logger.info(f"Enriched transaction analysis for {tx_hash} on {chain}")
        except Exception as e:
            logger.error(f"Error enriching transaction analysis for {tx_hash}: {e}")
            raise
    
    def _calculate_aggregated_risk_score(self, risk_scores: Dict[str, Any]) -> float:
        """Berechnet einen aggregierten Risiko-Score aus verschiedenen Quellen"""
        if not risk_scores:
            return 0.0
        
        # Gewichte für die verschiedenen Quellen
        weights = {
            'chainalysis': 0.4,
            'elliptic': 0.4,
            'community': 0.2
        }
        
        total_score = 0.0
        total_weight = 0.0
        
        for source, score in risk_scores.items():
            if source in weights and isinstance(score, (int, float)):
                total_score += score * weights[source]
                total_weight += weights[source]
        
        if total_weight == 0:
            return 0.0
        
        return total_score / total_weight
    
    def get_stats(self) -> Dict[str, Any]:
        """Gibt Statistiken des Enrichment Workers zurück"""
        return {
            'is_running': self.is_running,
            'pending_tasks': len(self.tasks),
            'stats': self.stats.copy(),
            'last_run_time': self.stats['last_run_time'].isoformat() if self.stats['last_run_time'] else None
        }
