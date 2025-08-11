import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union, Callable, Any
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
from functools import partial
import multiprocessing
import logging
import time

logger = logging.getLogger(__name__)

class ParallelProcessor:
    """Klasse zur parallelen Verarbeitung von Aufgaben"""
    
    def __init__(self, 
                 max_workers: Optional[int] = None,
                 use_processes: bool = False,
                 chunk_size: int = 1):
        """
        Initialisiere parallelen Prozessor
        
        Args:
            max_workers: Maximale Anzahl an Arbeitern (Standard: Anzahl der CPUs)
            use_processes: Ob Prozesse statt Threads verwendet werden sollen
            chunk_size: Größe der Datenchunks für jeden Arbeiter
        """
        if max_workers is None:
            max_workers = multiprocessing.cpu_count()
            
        self.max_workers = max_workers
        self.use_processes = use_processes
        self.chunk_size = chunk_size
        
    def process_tasks(self, 
                     tasks: List[Any], 
                     process_func: Callable,
                     **kwargs) -> List[Any]:
        """
        Verarbeite Aufgaben parallel
        
        Args:
            tasks: Liste der zu verarbeitenden Aufgaben
            process_func: Funktion zur Verarbeitung jeder Aufgabe
            **kwargs: Zusätzliche Argumente für process_func
            
        Returns:
            Liste der Ergebnisse
        """
        results = []
        
        # Wähle Executor basierend auf use_processes
        executor_class = ProcessPoolExecutor if self.use_processes else ThreadPoolExecutor
        
        with executor_class(max_workers=self.max_workers) as executor:
            # Erstelle Futures
            futures = []
            for task in tasks:
                future = executor.submit(process_func, task, **kwargs)
                futures.append(future)
            
            # Sammle Ergebnisse
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Fehler bei der Verarbeitung: {str(e)}")
                    results.append(None)
                    
        return results
    
    def process_chunks(self, 
                      data: Union[List, np.ndarray, pd.DataFrame], 
                      process_func: Callable,
                      **kwargs) -> List[Any]:
        """
        Verarbeite Daten in Chunks parallel
        
        Args:
            data: Zu verarbeitende Daten
            process_func: Funktion zur Verarbeitung jedes Chunks
            **kwargs: Zusätzliche Argumente für process_func
            
        Returns:
            Liste der Ergebnisse
        """
        # Teile Daten in Chunks auf
        if isinstance(data, (list, np.ndarray)):
            chunks = [data[i:i + self.chunk_size] for i in range(0, len(data), self.chunk_size)]
        elif isinstance(data, pd.DataFrame):
            chunks = [data.iloc[i:i + self.chunk_size] for i in range(0, len(data), self.chunk_size)]
        else:
            raise ValueError("Nicht unterstützter Datentyp")
            
        # Verarbeite Chunks parallel
        return self.process_tasks(chunks, process_func, **kwargs)

class MonteCarloParallelSimulator:
    """Klasse zur parallelen Monte-Carlo-Simulation"""
    
    def __init__(self, 
                 num_simulations: int,
                 max_workers: Optional[int] = None,
                 chunk_size: int = 1000):
        """
        Initialisiere parallelen Monte-Carlo-Simulator
        
        Args:
            num_simulations: Gesamtzahl der Simulationen
            max_workers: Maximale Anzahl an Arbeitern
            chunk_size: Größe der Simulationschunks
        """
        self.num_simulations = num_simulations
        self.max_workers = max_workers or multiprocessing.cpu_count()
        self.chunk_size = chunk_size
        
    def run_simulation(self, 
                      simulate_func: Callable,
                      *args, **kwargs) -> np.ndarray:
        """
        Führe Monte-Carlo-Simulation parallel durch
        
        Args:
            simulate_func: Funktion zur Durchführung einer Simulation
            *args: Positionale Argumente für simulate_func
            **kwargs: Schlüsselwortargumente für simulate_func
            
        Returns:
            Array mit allen Simulationsergebnissen
        """
        # Berechne Anzahl der Chunks und Simulationen pro Chunk
        num_chunks = (self.num_simulations + self.chunk_size - 1) // self.chunk_size
        simulations_per_chunk = [self.chunk_size] * num_chunks
        
        # Passe den letzten Chunk an, falls notwendig
        remaining = self.num_simulations - (num_chunks - 1) * self.chunk_size
        if remaining > 0:
            simulations_per_chunk[-1] = remaining
            
        # Erstelle Aufgaben für jeden Chunk
        tasks = [(num_sims, *args) for num_sims in simulations_per_chunk]
        
        # Definiere Wrapper-Funktion für die Simulation
        def simulate_chunk(task):
            num_sims = task[0]
            chunk_args = task[1:]
            
            # Führe Simulationen für diesen Chunk durch
            chunk_results = []
            for _ in range(num_sims):
                result = simulate_func(*chunk_args, **kwargs)
                chunk_results.append(result)
                
            return chunk_results
        
        # Verarbeite Chunks parallel
        processor = ParallelProcessor(max_workers=self.max_workers)
        chunk_results = processor.process_tasks(tasks, simulate_chunk)
        
        # Kombiniere Ergebnisse
        all_results = []
        for chunk in chunk_results:
            all_results.extend(chunk)
            
        return np.array(all_results)
    
    def analyze_convergence(self, 
                          simulate_func: Callable,
                          *args, 
                          convergence_interval: int = 1000,
                          **kwargs) -> Tuple[np.ndarray, pd.DataFrame]:
        """
        Analysiere Konvergenz der Monte-Carlo-Simulation
        
        Args:
            simulate_func: Funktion zur Durchführung einer Simulation
            *args: Positionale Argumente für simulate_func
            convergence_interval: Intervall für Konvergenzanalyse
            **kwargs: Schlüsselwortargumente für simulate_func
            
        Returns:
            Tuple mit (alle Ergebnisse, Konvergenzdaten)
        """
        # Initialisiere Ergebnisse und Konvergenzdaten
        all_results = []
        convergence_data = []
        
        # Führe Simulation in Blöcken durch
        num_blocks = (self.num_simulations + convergence_interval - 1) // convergence_interval
        
        for i in range(num_blocks):
            # Berechne Anzahl der Simulationen in diesem Block
            num_sims = min(convergence_interval, self.num_simulations - i * convergence_interval)
            
            # Führe Simulationen für diesen Block durch
            block_results = []
            for _ in range(num_sims):
                result = simulate_func(*args, **kwargs)
                block_results.append(result)
                
            # Füge Ergebnisse hinzu
            all_results.extend(block_results)
            
            # Berechne Konvergenzmetriken
            cumulative_results = np.array(all_results)
            mean = np.mean(cumulative_results)
            std_error = np.std(cumulative_results) / np.sqrt(len(cumulative_results))
            
            # Speichere Konvergenzdaten
            convergence_data.append({
                'simulations': len(cumulative_results),
                'mean': mean,
                'std_error': std_error,
                'lower_ci': mean - 1.96 * std_error,
                'upper_ci': mean + 1.96 * std_error
            })
            
        # Konvertiere zu DataFrame
        convergence_df = pd.DataFrame(convergence_data)
        
        return np.array(all_results), convergence_df
