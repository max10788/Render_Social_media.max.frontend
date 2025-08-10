import numpy as np
from typing import Tuple

def generate_correlated_random_variables(
    num_simulations: int, 
    num_timesteps: int, 
    correlation_matrix: np.ndarray
) -> np.ndarray:
    """
    Generiert korrelierte Zufallsvariablen für die Monte-Carlo-Simulation.
    
    Args:
        num_simulations: Anzahl der Simulationen
        num_timesteps: Anzahl der Zeitschritte
        correlation_matrix: Korrelationsmatrix
        
    Returns:
        np.ndarray: Korrelierte Zufallsvariablen der Form (N, 2, M)
    """
    try:
        L = np.linalg.cholesky(correlation_matrix)
    except np.linalg.LinAlgError:
        # Fallback für nicht positiv definite Matrizen
        eigenvalues, eigenvectors = np.linalg.eigh(correlation_matrix)
        eigenvalues = np.maximum(eigenvalues, 1e-10)  # Sicherstellen, dass alle Eigenwerte positiv sind
        L = eigenvectors @ np.diag(np.sqrt(eigenvalues))
    
    # Generiere unkorrelierte Zufallsvariablen
    U = np.random.normal(size=(num_simulations, correlation_matrix.shape[0], num_timesteps))
    
    # Wende Cholesky-Zerlegung an, um korrelierte Zufallsvariablen zu erhalten
    return np.einsum('ij,njk->nik', L, U)
