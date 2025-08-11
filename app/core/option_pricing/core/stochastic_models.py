import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union
from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)

class StochasticModel(ABC):
    """Abstrakte Basisklasse für stochastische Modelle"""
    
    @abstractmethod
    def simulate(self, *args, **kwargs):
        """Simuliere Preisbewegungen"""
        pass

class GeometricBrownianMotion(StochasticModel):
    """Geometrische Brownsche Bewegung für einzelne Assets"""
    
    def __init__(self, drift: float, volatility: float):
        """
        Initialisiere GBM-Modell
        
        Args:
            drift: Drift-Rate
            volatility: Volatilität
        """
        self.drift = drift
        self.volatility = volatility
        
    def simulate(self, 
                 initial_price: float, 
                 num_steps: int, 
                 dt: float, 
                 num_simulations: int = 1,
                 random_seed: Optional[int] = None) -> np.ndarray:
        """
        Simuliere Preisbewegungen mit GBM
        
        Args:
            initial_price: Anfangspreis
            num_steps: Anzahl der Zeitschritte
            dt: Größe eines Zeitschritts
            num_simulations: Anzahl der Simulationen
            random_seed: Zufallsseed für Reproduzierbarkeit
            
        Returns:
            Array mit simulierten Preispfaden
        """
        if random_seed is not None:
            np.random.seed(random_seed)
            
        # Generiere Zufallszahlen
        random_shocks = np.random.standard_normal((num_simulations, num_steps))
        
        # Initialisiere Preispfade
        price_paths = np.zeros((num_simulations, num_steps + 1))
        price_paths[:, 0] = initial_price
        
        # Simuliere Preisbewegungen
        for t in range(1, num_steps + 1):
            price_paths[:, t] = price_paths[:, t-1] * np.exp(
                (self.drift - 0.5 * self.volatility**2) * dt + 
                self.volatility * np.sqrt(dt) * random_shocks[:, t-1]
            )
            
        return price_paths

class JumpDiffusionModel(StochasticModel):
    """Merton-Modell für Sprungdiffusionsprozesse"""
    
    def __init__(self, 
                 drift: float, 
                 volatility: float, 
                 jump_intensity: float, 
                 jump_mean: float, 
                 jump_volatility: float):
        """
        Initialisiere Jump-Diffusion-Modell
        
        Args:
            drift: Drift-Rate
            volatility: Volatilität
            jump_intensity: Intensität der Sprünge (Poisson-Prozess)
            jump_mean: Mittlere Sprunggröße
            jump_volatility: Volatilität der Sprünge
        """
        self.drift = drift
        self.volatility = volatility
        self.jump_intensity = jump_intensity
        self.jump_mean = jump_mean
        self.jump_volatility = jump_volatility
        
    def simulate(self, 
                 initial_price: float, 
                 num_steps: int, 
                 dt: float, 
                 num_simulations: int = 1,
                 random_seed: Optional[int] = None) -> np.ndarray:
        """
        Simuliere Preisbewegungen mit Jump-Diffusion
        
        Args:
            initial_price: Anfangspreis
            num_steps: Anzahl der Zeitschritte
            dt: Größe eines Zeitschritts
            num_simulations: Anzahl der Simulationen
            random_seed: Zufallsseed für Reproduzierbarkeit
            
        Returns:
            Array mit simulierten Preispfaden
        """
        if random_seed is not None:
            np.random.seed(random_seed)
            
        # Generiere Zufallszahlen
        brownian_shocks = np.random.standard_normal((num_simulations, num_steps))
        
        # Generiere Sprünge (Poisson-Prozess)
        jumps = np.random.poisson(self.jump_intensity * dt, (num_simulations, num_steps))
        jump_sizes = np.random.normal(self.jump_mean, self.jump_volatility, (num_simulations, num_steps))
        
        # Initialisiere Preispfade
        price_paths = np.zeros((num_simulations, num_steps + 1))
        price_paths[:, 0] = initial_price
        
        # Simuliere Preisbewegungen
        for t in range(1, num_steps + 1):
            # Brownscher Anteil
            brownian_component = (self.drift - 0.5 * self.volatility**2) * dt + \
                                self.volatility * np.sqrt(dt) * brownian_shocks[:, t-1]
            
            # Sprunganteil
            jump_component = jumps[:, t-1] * jump_sizes[:, t-1]
            
            # Gesamtbewegung
            price_paths[:, t] = price_paths[:, t-1] * np.exp(brownian_component + jump_component)
            
        return price_paths

class HestonModel(StochasticModel):
    """Heston-Modell für stochastische Volatilität"""
    
    def __init__(self, 
                 drift: float, 
                 kappa: float, 
                 theta: float, 
                 xi: float, 
                 rho: float,
                 initial_variance: float):
        """
        Initialisiere Heston-Modell
        
        Args:
            drift: Drift-Rate
            kappa: Mean-Reversion-Geschwindigkeit
            theta: Langfristige Volatilität
            xi: Vol-of-Vol
            rho: Korrelation zwischen Preis und Volatilität
            initial_variance: Anfangsvarianz
        """
        self.drift = drift
        self.kappa = kappa
        self.theta = theta
        self.xi = xi
        self.rho = rho
        self.initial_variance = initial_variance
        
    def simulate(self, 
                 initial_price: float, 
                 num_steps: int, 
                 dt: float, 
                 num_simulations: int = 1,
                 random_seed: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Simuliere Preisbewegungen mit Heston-Modell
        
        Args:
            initial_price: Anfangspreis
            num_steps: Anzahl der Zeitschritte
            dt: Größe eines Zeitschritts
            num_simulations: Anzahl der Simulationen
            random_seed: Zufallsseed für Reproduzierbarkeit
            
        Returns:
            Tuple mit (Preispfade, Volatilitätspfade)
        """
        if random_seed is not None:
            np.random.seed(random_seed)
            
        # Generiere korrelierte Zufallszahlen
        cov_matrix = np.array([[1, self.rho], [self.rho, 1]])
        correlated_normals = np.random.multivariate_normal(
            mean=[0, 0], 
            cov=cov_matrix, 
            size=(num_simulations, num_steps)
        )
        
        # Initialisiere Pfade
        price_paths = np.zeros((num_simulations, num_steps + 1))
        variance_paths = np.zeros((num_simulations, num_steps + 1))
        price_paths[:, 0] = initial_price
        variance_paths[:, 0] = self.initial_variance
        
        # Simuliere Preis- und Volatilitätsbewegungen
        for t in range(1, num_steps + 1):
            # Extrahiere korrelierte Zufallszahlen
            z1 = correlated_normals[:, t-1, 0]
            z2 = correlated_normals[:, t-1, 1]
            
            # Volatilitätsdynamik (CIR-Prozess)
            variance_paths[:, t] = variance_paths[:, t-1] + \
                self.kappa * (self.theta - variance_paths[:, t-1]) * dt + \
                self.xi * np.sqrt(variance_paths[:, t-1] * dt) * z2
                
            # Stelle sicher, dass Varianz nicht negativ wird
            variance_paths[:, t] = np.maximum(variance_paths[:, t], 0)
            
            # Preisdynamik
            price_paths[:, t] = price_paths[:, t-1] * np.exp(
                (self.drift - 0.5 * variance_paths[:, t-1]) * dt + \
                np.sqrt(variance_paths[:, t-1] * dt) * z1
            )
            
        return price_paths, variance_paths

class CorrelatedBasketModel:
    """Modell für korrelierte Basket-Optionen"""
    
    def __init__(self, 
                 models: List[StochasticModel], 
                 correlation_matrix: np.ndarray):
        """
        Initialisiere korreliertes Basket-Modell
        
        Args:
            models: Liste von stochastischen Modellen für jedes Asset
            correlation_matrix: Korrelationsmatrix zwischen Assets
        """
        self.models = models
        self.correlation_matrix = correlation_matrix
        
        # Validiere Korrelationsmatrix
        if not np.allclose(correlation_matrix, correlation_matrix.T):
            raise ValueError("Korrelationsmatrix muss symmetrisch sein")
            
        eigenvalues = np.linalg.eigvalsh(correlation_matrix)
        if np.any(eigenvalues < 0):
            raise ValueError("Korrelationsmatrix muss positiv semidefinit sein")
            
    def simulate(self, 
                 initial_prices: List[float], 
                 num_steps: int, 
                 dt: float, 
                 num_simulations: int = 1,
                 random_seed: Optional[int] = None) -> np.ndarray:
        """
        Simuliere korrelierte Preisbewegungen für das Basket
        
        Args:
            initial_prices: Liste der Anfangspreise
            num_steps: Anzahl der Zeitschritte
            dt: Größe eines Zeitschritts
            num_simulations: Anzahl der Simulationen
            random_seed: Zufallsseed für Reproduzierbarkeit
            
        Returns:
            3D-Array mit simulierten Preispfaden (Simulationen x Zeitschritte x Assets)
        """
        if random_seed is not None:
            np.random.seed(random_seed)
            
        num_assets = len(initial_prices)
        if num_assets != len(self.models):
            raise ValueError("Anzahl der Modelle muss mit Anzahl der Assets übereinstimmen")
            
        # Cholesky-Zerlegung der Korrelationsmatrix
        try:
            L = np.linalg.cholesky(self.correlation_matrix)
        except np.linalg.LinAlgError:
            # Fallback: Nutze die nächste positiv definite Matrix
            logger.warning("Korrelationsmatrix nicht positiv definit, nutze Approximation")
            eigvals, eigvecs = np.linalg.eigh(self.correlation_matrix)
            eigvals = np.maximum(eigvals, 1e-10)
            self.correlation_matrix = eigvecs @ np.diag(eigvals) @ eigvecs.T
            L = np.linalg.cholesky(self.correlation_matrix)
        
        # Generiere unkorrelierte Zufallszahlen
        uncorrelated_random = np.random.standard_normal((num_simulations, num_steps, num_assets))
        
        # Wende Cholesky-Zerlegung an, um korrelierte Zufallszahlen zu erhalten
        correlated_random = np.zeros_like(uncorrelated_random)
        for i in range(num_simulations):
            for j in range(num_steps):
                correlated_random[i, j] = L @ uncorrelated_random[i, j]
        
        # Initialisiere Preispfade
        price_paths = np.zeros((num_simulations, num_steps + 1, num_assets))
        price_paths[:, 0, :] = initial_prices
        
        # Simuliere jedes Asset mit seinem Modell
        for asset_idx in range(num_assets):
            model = self.models[asset_idx]
            
            if isinstance(model, GeometricBrownianMotion):
                # Für GBM können wir die korrelierten Zufallszahlen direkt nutzen
                for i in range(num_simulations):
                    for t in range(1, num_steps + 1):
                        price_paths[i, t, asset_idx] = price_paths[i, t-1, asset_idx] * np.exp(
                            (model.drift - 0.5 * model.volatility**2) * dt + 
                            model.volatility * np.sqrt(dt) * correlated_random[i, t-1, asset_idx]
                        )
            
            elif isinstance(model, JumpDiffusionModel):
                # Für Jump-Diffusion müssen wir zusätzliche Sprünge generieren
                jumps = np.random.poisson(model.jump_intensity * dt, (num_simulations, num_steps))
                jump_sizes = np.random.normal(model.jump_mean, model.jump_volatility, (num_simulations, num_steps))
                
                for i in range(num_simulations):
                    for t in range(1, num_steps + 1):
                        # Brownscher Anteil
                        brownian_component = (model.drift - 0.5 * model.volatility**2) * dt + \
                                            model.volatility * np.sqrt(dt) * correlated_random[i, t-1, asset_idx]
                        
                        # Sprunganteil
                        jump_component = jumps[i, t-1] * jump_sizes[i, t-1]
                        
                        # Gesamtbewegung
                        price_paths[i, t, asset_idx] = price_paths[i, t-1, asset_idx] * np.exp(brownian_component + jump_component)
            
            elif isinstance(model, HestonModel):
                # Für Heston müssen wir Volatilität und Preis gemeinsam simulieren
                variance_paths = np.zeros((num_simulations, num_steps + 1))
                variance_paths[:, 0] = model.initial_variance
                
                # Generiere zusätzliche Zufallszahlen für Volatilität
                vol_random = np.random.standard_normal((num_simulations, num_steps))
                
                for i in range(num_simulations):
                    for t in range(1, num_steps + 1):
                        # Volatilitätsdynamik (CIR-Prozess)
                        variance_paths[i, t] = variance_paths[i, t-1] + \
                            model.kappa * (model.theta - variance_paths[i, t-1]) * dt + \
                            model.xi * np.sqrt(variance_paths[i, t-1] * dt) * vol_random[i, t-1]
                            
                        # Stelle sicher, dass Varianz nicht negativ wird
                        variance_paths[i, t] = max(variance_paths[i, t], 0)
                        
                        # Preisdynamik
                        price_paths[i, t, asset_idx] = price_paths[i, t-1, asset_idx] * np.exp(
                            (model.drift - 0.5 * variance_paths[i, t-1]) * dt + \
                            np.sqrt(variance_paths[i, t-1] * dt) * correlated_random[i, t-1, asset_idx]
                        )
        
        return price_paths
