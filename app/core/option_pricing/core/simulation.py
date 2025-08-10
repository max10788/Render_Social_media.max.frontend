import numpy as np
from typing import Dict, Any
from ..utils.math_utils import generate_correlated_random_variables

class MonteCarloSimulation:
    @staticmethod
    def run_simulation(params: Dict[str, Any]) -> Dict[str, Any]:
        # Parameter extrahieren
        assets = params['assets']
        S1 = assets[0]['spot_price']
        S2 = assets[1]['spot_price']
        sigma1 = assets[0]['volatility']
        sigma2 = assets[1]['volatility']
        w1 = assets[0]['weight']
        w2 = assets[1]['weight']
        correlation = params['correlation']
        r = params['risk_free_rate']
        T = params['time_to_maturity']
        K = params['strike_price']
        N = params['num_simulations']
        M = params['num_timesteps']
        
        # Zeitschritt berechnen
        dt = T / M
        
        # Korrelierte Zufallsvariablen generieren
        corr_matrix = np.array([[1.0, correlation], [correlation, 1.0]])
        Z = generate_correlated_random_variables(N, M, corr_matrix)
        
        # Asset-Pfade simulieren
        S1_path = np.zeros((N, M+1))
        S2_path = np.zeros((N, M+1))
        S1_path[:, 0] = S1
        S2_path[:, 0] = S2
        
        drift1 = (r - 0.5 * sigma1**2) * dt
        drift2 = (r - 0.5 * sigma2**2) * dt
        diffusion1 = sigma1 * np.sqrt(dt)
        diffusion2 = sigma2 * np.sqrt(dt)
        
        for t in range(1, M+1):
            S1_path[:, t] = S1_path[:, t-1] * np.exp(drift1 + diffusion1 * Z[:, 0, t-1])
            S2_path[:, t] = S2_path[:, t-1] * np.exp(drift2 + diffusion2 * Z[:, 1, t-1])
        
        # Basket-Wert bei Fälligkeit
        basket_T = w1 * S1_path[:, -1] + w2 * S2_path[:, -1]
        
        # Payoff berechnen
        payoff = np.maximum(basket_T - K, 0)
        
        # Diskontierung und Mittelung
        option_price = np.exp(-r * T) * np.mean(payoff)
        
        # Konfidenzintervall (95%)
        stderr = np.std(payoff) / np.sqrt(N)
        ci_lower = option_price - 1.96 * stderr
        ci_upper = option_price + 1.96 * stderr
        
        return {
            "option_price": round(option_price, 2),
            "confidence_interval": {
                "lower": round(ci_lower, 2),
                "upper": round(ci_upper, 2)
            }
        }
