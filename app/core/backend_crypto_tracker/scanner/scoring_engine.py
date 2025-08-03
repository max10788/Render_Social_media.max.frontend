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

class MultiChainScoringEngine:
    def __init__(self):
        self.chain_weights = {
            'ethereum': 1.0,
            'bsc': 0.9,      # Etwas niedrigere Gewichtung für BSC
            'solana': 0.85,   # Solana ist neuer, weniger etabliert
            'sui': 0.8        # Sui ist sehr neu
        }
    
    def calculate_token_score_custom(self, token_data, wallet_analyses: List, chain: str) -> Dict:
        """Berechnet Token Score für benutzerdefinierte Token"""
        
        metrics = {}
        risk_flags = []
        
        # 1. Holder Distribution Score (30%)
        holder_score = self._calculate_holder_distribution_score(wallet_analyses, chain)
        metrics['holder_distribution'] = holder_score
        
        # 2. Liquidity Score (25%)
        liquidity_score = self._calculate_liquidity_score(token_data, chain)
        metrics['liquidity'] = liquidity_score
        
        # 3. Market Metrics Score (20%)
        market_score = self._calculate_market_metrics_score(token_data, chain)
        metrics['market_metrics'] = market_score
        
        # 4. Risk Assessment Score (15%)
        risk_score, flags = self._calculate_risk_assessment_score(wallet_analyses, chain)
        metrics['risk_assessment'] = risk_score
        risk_flags.extend(flags)
        
        # 5. Chain-specific Score (10%)
        chain_score = self._calculate_chain_specific_score(token_data, chain)
        metrics['chain_specific'] = chain_score
        
        # Gewichtete Gesamtbewertung
        total_score = (
            holder_score * 0.30 +
            liquidity_score * 0.25 +
            market_score * 0.20 +
            risk_score * 0.15 +
            chain_score * 0.10
        )
        
        # Chain-spezifische Gewichtung anwenden
        chain_weight = self.chain_weights.get(chain, 0.8)
        total_score *= chain_weight
        
        return {
            'total_score': min(100.0, max(0.0, total_score)),
            'metrics': metrics,
            'risk_flags': risk_flags,
            'chain_weight_applied': chain_weight
        }
    
    def _calculate_holder_distribution_score(self, wallet_analyses: List, chain: str) -> float:
        """Bewertet die Holder-Verteilung"""
        if not wallet_analyses:
            return 0.0
        
        score = 100.0
        
        # Zähle verschiedene Wallet-Typen
        dev_wallets = len([w for w in wallet_analyses if w.wallet_type == WalletTypeEnum.DEV_WALLET])
        whale_wallets = len([w for w in wallet_analyses if w.wallet_type == WalletTypeEnum.WHALE_WALLET])
        rugpull_suspects = len([w for w in wallet_analyses if w.wallet_type == WalletTypeEnum.RUGPULL_SUSPECT])
        
        # Abzüge für problematische Wallets
        score -= dev_wallets * 15  # -15 pro Dev Wallet
        score -= whale_wallets * 10  # -10 pro Whale Wallet
        score -= rugpull_suspects * 25  # -25 pro Rugpull Verdacht
        
        # Top 10 Holder Konzentration
        top_10_percentage = sum([w.percentage_of_supply for w in wallet_analyses[:10]])
        if top_10_percentage > 80:
            score -= 30
        elif top_10_percentage > 60:
            score -= 20
        elif top_10_percentage > 40:
            score -= 10
        
        # Chain-spezifische Anpassungen
        if chain == 'solana':
            # Solana hat oft mehr fragmentierte Ownership
            score += 5
        elif chain == 'sui':
            # Sui Objekt-Model kann zu anderen Verteilungsmustern führen
            score += 3
        
        return max(0.0, min(100.0, score))
    
    def _calculate_liquidity_score(self, token_data, chain: str) -> float:
        """Bewertet die Liquidität"""
        liquidity = getattr(token_data, 'liquidity', 0)
        market_cap = getattr(token_data, 'market_cap', 0)
        
        if market_cap == 0:
            return 0.0
        
        liquidity_ratio = liquidity / market_cap if market_cap > 0 else 0
        
        # Basis Score basierend auf Liquiditäts-Ratio
        if liquidity_ratio > 0.3:
            score = 100.0
        elif liquidity_ratio > 0.2:
            score = 85.0
        elif liquidity_ratio > 0.1:
            score = 70.0
        elif liquidity_ratio > 0.05:
            score = 50.0
        else:
            score = 20.0
        
        # Chain-spezifische Anpassungen
        if chain == 'solana':
            # Solana hat oft niedrigere Liquiditäts-Ratios
            score *= 1.1
        elif chain == 'sui':
            # Sui ist neu, Liquidität kann volatiler sein
            score *= 0.9
        
        return min(100.0, score)
    
    def _calculate_market_metrics_score(self, token_data, chain: str) -> float:
        """Bewertet Market Metrics"""
        market_cap = getattr(token_data, 'market_cap', 0)
        volume_24h = getattr(token_data, 'volume_24h', 0)
        holders_count = getattr(token_data, 'holders_count', 0)
        
        score = 0.0
        
        # Market Cap Score (40% des Market Metrics Score)
        if 1000000 <= market_cap <= 10000000:  # Sweet spot für Low-Cap
            market_cap_score = 100.0
        elif 500000 <= market_cap < 1000000:
            market_cap_score = 80.0
        elif market_cap < 500000:
            market_cap_score = 60.0
        else:
            market_cap_score = 40.0
        
        score += market_cap_score * 0.4
        
        # Volume/Market Cap Ratio (30%)
        volume_ratio = volume_24h / market_cap if market_cap > 0 else 0
        if volume_ratio > 0.1:
            volume_score = 100.0
        elif volume_ratio > 0.05:
            volume_score = 80.0
        elif volume_ratio > 0.01:
            volume_score = 60.0
        else:
            volume_score = 30.0
        
        score += volume_score * 0.3
        
        # Holders Count (30%)
        if holders_count > 5000:
            holders_score = 100.0
        elif holders_count > 2000:
            holders_score = 80.0
        elif holders_count > 1000:
            holders_score = 60.0
        elif holders_count > 500:
            holders_score = 40.0
        else:
            holders_score = 20.0
        
        score += holders_score * 0.3
        
        # Chain-spezifische Anpassungen
        if chain == 'solana':
            # Solana hat oft höhere Holder-Zahlen durch geringere Transaktionskosten
            score *= 0.95
        elif chain == 'bsc':
            # BSC hat oft inflationäre Metrics
            score *= 0.9
        
        return min(100.0, score)
    
    def _calculate_risk_assessment_score(self, wallet_analyses: List, chain: str) -> Tuple[float, List[str]]:
        """Bewertet Risikofaktoren"""
        score = 100.0
        risk_flags = []
        
        if not wallet_analyses:
            return 50.0, ['no_holder_data']
        
        # Rugpull Verdächtige
        rugpull_suspects = [w for w in wallet_analyses if w.wallet_type == WalletTypeEnum.RUGPULL_SUSPECT]
        if rugpull_suspects:
            score -= 40
            risk_flags.append('rugpull_suspects_detected')
        
        # Hohe Dev Wallet Konzentration
        dev_wallets = [w for w in wallet_analyses if w.wallet_type == WalletTypeEnum.DEV_WALLET]
        dev_percentage = sum([w.percentage_of_supply for w in dev_wallets])
        if dev_percentage > 20:
            score -= 30
            risk_flags.append('high_dev_concentration')
        elif dev_percentage > 10:
            score -= 15
            risk_flags.append('moderate_dev_concentration')
        
        # Whale Dominanz
        whale_wallets = [w for w in wallet_analyses if w.wallet_type == WalletTypeEnum.WHALE_WALLET]
        whale_percentage = sum([w.percentage_of_supply for w in whale_wallets])
        if whale_percentage > 30:
            score -= 25
            risk_flags.append('whale_dominance')
        
        # Single Holder mit zu viel Supply
        max_holder_percentage = max([w.percentage_of_supply for w in wallet_analyses])
        if max_holder_percentage > 50:
            score -= 35
            risk_flags.append('single_holder_dominance')
        elif max_holder_percentage > 25:
            score -= 20
            risk_flags.append('high_single_holder_percentage')
        
        # Chain-spezifische Risikobewertung
        if chain == 'sui':
            # Sui ist sehr neu, höheres inhärentes Risiko
            score -= 5
            risk_flags.append('new_chain_risk')
        elif chain == 'bsc':
            # BSC hat historisch mehr Rugpulls
            score -= 3
        
        return max(0.0, score), risk_flags
    
    def _calculate_chain_specific_score(self, token_data, chain: str) -> float:
        """Chain-spezifische Bewertungskriterien"""
        score = 50.0  # Neutral start
        
        if chain == 'ethereum':
            # Ethereum: Höchste Sicherheit, aber hohe Gas Fees
            score = 90.0
            contract_verified = getattr(token_data, 'contract_verified', False)
            if contract_verified:
                score += 10
        
        elif chain == 'bsc':
            # BSC: Gute Performance, aber mehr Risiko
            score = 75.0
            # BSC-spezifische Checks können hier hinzugefügt werden
        
        elif chain == 'solana':
            # Solana: Innovative Tech, aber weniger etabliert
            score = 70.0
            # Solana-spezifische Metriken
            # z.B. Token Program Version, Mint Authority, etc.
        
        elif chain == 'sui':
            # Sui: Sehr neu, hohe Innovation aber ungetestet
            score = 60.0
            # Sui-spezifische Bewertungen
            # z.B. Move Contract Quality, Object Structure, etc.
        
        return score

    def score_token(
        self,
        market_cap: float,
        liquidity: float,
        holders: int,
        contract_verified: bool,
        risk_flags: List[str],
    ) -> Dict[str, float]:
        score = 50.0

        # Marktkapitalisierung
        if market_cap < 100_000:
            score -= 20
        elif market_cap > 10_000_000:
            score += 10

        # Liquidität
        if liquidity < 50_000:
            score -= 15
        elif liquidity > 1_000_000:
            score += 10

        # Holder-Anzahl
        if holders < 50:
            score -= 15
        elif holders > 5_000:
            score += 5

        # Contract geprüft
        score += 10 if contract_verified else 0

        # Risiko-Flags
        score -= len(risk_flags) * 5

        return {"total_score": max(0, min(100, score))}
