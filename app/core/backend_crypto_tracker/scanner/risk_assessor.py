# scanner/risk_assessor.py
import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import numpy as np
from utils.logger import get_logger
from utils.exceptions import APIException
from scanner.wallet_classifier import WalletTypeEnum, WalletAnalysis

logger = get_logger(__name__)

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class RiskAssessment:
    """Data class for risk assessment results"""
    overall_score: float  # 0-100
    risk_level: RiskLevel
    risk_factors: List[str]
    confidence: float  # 0-1
    assessment_date: datetime
    details: Dict[str, Any] = None

class RiskAssessor:
    """Advanced risk assessment for tokens and wallets"""
    
    def __init__(self):
        # Risk factor weights
        self.risk_weights = {
            'wallet_concentration': 0.25,      # Risk from wallet concentration
            'liquidity_risk': 0.20,           # Risk from low liquidity
            'market_volatility': 0.15,       # Risk from price volatility
            'contract_risk': 0.15,           # Risk from smart contract issues
            'chain_risk': 0.10,              # Risk from blockchain-specific factors
            'compliance_risk': 0.15          # Risk from compliance issues
        }
        
        # Risk thresholds
        self.risk_thresholds = {
            RiskLevel.LOW: 20,
            RiskLevel.MEDIUM: 50,
            RiskLevel.HIGH: 75,
            RiskLevel.CRITICAL: 90
        }
        
        # Chain-specific risk multipliers
        self.chain_risk_multipliers = {
            'ethereum': 1.0,   # Baseline
            'bsc': 1.2,        # Higher risk due to more scams
            'solana': 1.1,      # Moderate risk
            'sui': 1.3         # Higher risk due to new chain
        }
    
    async def assess_token_risk(self, token_data: Dict[str, Any], 
                               wallet_analyses: List[WalletAnalysis]) -> RiskAssessment:
        """
        Assess the overall risk of a token based on token data and wallet analyses
        
        Args:
            token_data: Dictionary containing token information
            wallet_analyses: List of wallet analysis objects
            
        Returns:
            RiskAssessment object with detailed risk information
        """
        try:
            # Extract token information
            market_cap = token_data.get('market_cap', 0)
            liquidity = token_data.get('liquidity', 0)
            volume_24h = token_data.get('volume_24h', 0)
            contract_verified = token_data.get('contract_verified', False)
            chain = token_data.get('chain', 'ethereum')
            
            # Calculate individual risk factors
            wallet_concentration_risk = self._assess_wallet_concentration_risk(wallet_analyses)
            liquidity_risk = self._assess_liquidity_risk(liquidity, market_cap)
            market_volatility_risk = self._assess_market_volatility_risk(volume_24h, market_cap)
            contract_risk = self._assess_contract_risk(contract_verified, chain)
            chain_risk = self._assess_chain_risk(chain)
            compliance_risk = self._assess_compliance_risk(wallet_analyses)
            
            # Calculate weighted risk score
            risk_score = (
                wallet_concentration_risk * self.risk_weights['wallet_concentration'] +
                liquidity_risk * self.risk_weights['liquidity_risk'] +
                market_volatility_risk * self.risk_weights['market_volatility'] +
                contract_risk * self.risk_weights['contract_risk'] +
                chain_risk * self.risk_weights['chain_risk'] +
                compliance_risk * self.risk_weights['compliance_risk']
            )
            
            # Apply chain-specific risk multiplier
            chain_multiplier = self.chain_risk_multipliers.get(chain, 1.0)
            adjusted_risk_score = min(100, risk_score * chain_multiplier)
            
            # Determine risk level
            risk_level = self._determine_risk_level(adjusted_risk_score)
            
            # Collect risk factors
            risk_factors = []
            if wallet_concentration_risk > 60:
                risk_factors.append("high_wallet_concentration")
            if liquidity_risk > 60:
                risk_factors.append("low_liquidity")
            if market_volatility_risk > 60:
                risk_factors.append("high_volatility")
            if contract_risk > 60:
                risk_factors.append("unverified_contract")
            if chain_risk > 60:
                risk_factors.append("chain_specific_risks")
            if compliance_risk > 60:
                risk_factors.append("compliance_issues")
            
            # Calculate confidence based on data quality
            confidence = self._calculate_confidence(token_data, wallet_analyses)
            
            # Prepare detailed assessment
            details = {
                'wallet_concentration': {
                    'score': wallet_concentration_risk,
                    'top_holder_percentage': self._get_top_holder_percentage(wallet_analyses),
                    'dev_wallet_percentage': self._get_dev_wallet_percentage(wallet_analyses)
                },
                'liquidity': {
                    'score': liquidity_risk,
                    'liquidity_to_market_cap_ratio': liquidity / market_cap if market_cap > 0 else 0
                },
                'market': {
                    'score': market_volatility_risk,
                    'volume_to_market_cap_ratio': volume_24h / market_cap if market_cap > 0 else 0
                },
                'contract': {
                    'score': contract_risk,
                    'verified': contract_verified
                },
                'chain': {
                    'score': chain_risk,
                    'multiplier': chain_multiplier
                },
                'compliance': {
                    'score': compliance_risk,
                    'sanctioned_addresses': self._count_sanctioned_addresses(wallet_analyses)
                }
            }
            
            return RiskAssessment(
                overall_score=adjusted_risk_score,
                risk_level=risk_level,
                risk_factors=risk_factors,
                confidence=confidence,
                assessment_date=datetime.utcnow(),
                details=details
            )
            
        except Exception as e:
            logger.error(f"Error assessing token risk: {e}")
            raise APIException(f"Risk assessment failed: {str(e)}")
    
    def _assess_wallet_concentration_risk(self, wallet_analyses: List[WalletAnalysis]) -> float:
        """Assess risk from wallet concentration"""
        if not wallet_analyses:
            return 50.0  # Moderate risk if no data
        
        # Calculate Gini coefficient for token distribution
        balances = [w.balance for w in wallet_analyses if w.balance > 0]
        if not balances:
            return 50.0
        
        gini = self._calculate_gini_coefficient(balances)
        
        # Calculate percentage held by top wallets
        sorted_wallets = sorted(wallet_analyses, key=lambda w: w.balance, reverse=True)
        top_10_percentage = sum(w.percentage_of_supply for w in sorted_wallets[:10])
        
        # Calculate risk based on concentration
        risk_score = 0.0
        
        # Gini-based risk (0-1 scale mapped to 0-100)
        risk_score += gini * 50
        
        # Top 10 holder concentration risk
        if top_10_percentage > 80:
            risk_score += 40
        elif top_10_percentage > 60:
            risk_score += 30
        elif top_10_percentage > 40:
            risk_score += 20
        elif top_10_percentage > 20:
            risk_score += 10
        
        # Dev wallet concentration risk
        dev_percentage = sum(w.percentage_of_supply for w in wallet_analyses 
                           if w.wallet_type == WalletTypeEnum.DEV_WALLET)
        if dev_percentage > 50:
            risk_score += 30
        elif dev_percentage > 30:
            risk_score += 20
        elif dev_percentage > 15:
            risk_score += 10
        
        # Rugpull suspect risk
        rugpull_percentage = sum(w.percentage_of_supply for w in wallet_analyses 
                                if w.wallet_type == WalletTypeEnum.RUGPULL_SUSPECT)
        if rugpull_percentage > 0:
            risk_score += min(40, rugpull_percentage * 2)
        
        return min(100, risk_score)
    
    def _assess_liquidity_risk(self, liquidity: float, market_cap: float) -> float:
        """Assess risk from liquidity"""
        if market_cap == 0:
            return 80.0  # High risk if no market cap data
        
        # Calculate liquidity to market cap ratio
        liquidity_ratio = liquidity / market_cap
        
        # Risk increases as liquidity ratio decreases
        if liquidity_ratio > 0.3:
            return 10.0  # Low risk
        elif liquidity_ratio > 0.2:
            return 25.0  # Low-moderate risk
        elif liquidity_ratio > 0.1:
            return 50.0  # Moderate risk
        elif liquidity_ratio > 0.05:
            return 70.0  # High risk
        else:
            return 90.0  # Very high risk
    
    def _assess_market_volatility_risk(self, volume_24h: float, market_cap: float) -> float:
        """Assess risk from market volatility"""
        if market_cap == 0:
            return 60.0  # Moderate-high risk if no market cap data
        
        # Calculate volume to market cap ratio
        volume_ratio = volume_24h / market_cap
        
        # Risk assessment based on trading activity
        if volume_ratio > 0.5:
            return 20.0  # Low risk (high trading activity)
        elif volume_ratio > 0.2:
            return 30.0  # Low-moderate risk
        elif volume_ratio > 0.1:
            return 50.0  # Moderate risk
        elif volume_ratio > 0.05:
            return 70.0  # High risk
        elif volume_ratio > 0.01:
            return 80.0  # High risk
        else:
            return 90.0  # Very high risk (very low trading activity)
    
    def _assess_contract_risk(self, contract_verified: bool, chain: str) -> float:
        """Assess risk from smart contract"""
        base_risk = 70.0 if not contract_verified else 30.0
        
        # Chain-specific adjustments
        if chain == 'ethereum':
            return base_risk * 0.8  # Lower risk on Ethereum
        elif chain == 'bsc':
            return base_risk * 1.2  # Higher risk on BSC
        elif chain == 'solana':
            return base_risk * 1.1  # Slightly higher risk on Solana
        elif chain == 'sui':
            return base_risk * 1.3  # Higher risk on newer chains
        
        return base_risk
    
    def _assess_chain_risk(self, chain: str) -> float:
        """Assess chain-specific risks"""
        chain_risks = {
            'ethereum': 20.0,  # Most established chain
            'bsc': 40.0,       # More scams but good performance
            'solana': 35.0,     # Moderate risk
            'sui': 50.0         # Newer chain with less history
        }
        
        return chain_risks.get(chain, 40.0)
    
    def _assess_compliance_risk(self, wallet_analyses: List[WalletAnalysis]) -> float:
        """Assess compliance risk based on wallet types"""
        if not wallet_analyses:
            return 30.0  # Low-moderate risk if no data
        
        risk_score = 0.0
        
        # Check for sanctioned addresses
        sanctioned_count = sum(1 for w in wallet_analyses 
                              if w.wallet_type == WalletTypeEnum.RUGPULL_SUSPECT)
        if sanctioned_count > 0:
            risk_score += min(80, sanctioned_count * 40)
        
        # Check for high-risk wallet types
        high_risk_types = [
            WalletTypeEnum.RUGPULL_SUSPECT,
            WalletTypeEnum.CEX_WALLET  # CEX wallets can indicate regulatory risk
        ]
        
        high_risk_percentage = sum(w.percentage_of_supply for w in wallet_analyses 
                                  if w.wallet_type in high_risk_types)
        
        if high_risk_percentage > 50:
            risk_score += 40
        elif high_risk_percentage > 20:
            risk_score += 25
        elif high_risk_percentage > 5:
            risk_score += 10
        
        return min(100, risk_score)
    
    def _calculate_gini_coefficient(self, values: List[float]) -> float:
        """Calculate Gini coefficient for inequality measurement"""
        if not values or len(values) < 2:
            return 0.0
        
        # Sort values
        sorted_values = sorted(values)
        n = len(sorted_values)
        
        # Calculate cumulative sum
        cumulative_sum = [0.0]
        for i, value in enumerate(sorted_values):
            cumulative_sum.append(cumulative_sum[i] + value)
        
        total = cumulative_sum[-1]
        if total == 0:
            return 0.0
        
        # Calculate Gini coefficient
        gini = 0.0
        for i in range(1, n + 1):
            gini += (2 * i - n - 1) * sorted_values[i-1]
        
        gini = gini / (n * total)
        
        return max(0.0, min(1.0, gini))
    
    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level based on risk score"""
        if risk_score >= self.risk_thresholds[RiskLevel.CRITICAL]:
            return RiskLevel.CRITICAL
        elif risk_score >= self.risk_thresholds[RiskLevel.HIGH]:
            return RiskLevel.HIGH
        elif risk_score >= self.risk_thresholds[RiskLevel.MEDIUM]:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _calculate_confidence(self, token_data: Dict[str, Any], 
                            wallet_analyses: List[WalletAnalysis]) -> float:
        """Calculate confidence in the risk assessment"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence with more complete token data
        data_fields = ['market_cap', 'liquidity', 'volume_24h', 'contract_verified']
        available_fields = sum(1 for field in data_fields if token_data.get(field) is not None)
        confidence += (available_fields / len(data_fields)) * 0.2
        
        # Increase confidence with more wallet analyses
        if wallet_analyses:
            wallet_coverage = min(1.0, len(wallet_analyses) / 50)  # Assuming 50 is a good sample
            confidence += wallet_coverage * 0.3
        
        return min(1.0, max(0.1, confidence))
    
    def _get_top_holder_percentage(self, wallet_analyses: List[WalletAnalysis]) -> float:
        """Get percentage held by top 10 holders"""
        if not wallet_analyses:
            return 0.0
        
        sorted_wallets = sorted(wallet_analyses, key=lambda w: w.balance, reverse=True)
        return sum(w.percentage_of_supply for w in sorted_wallets[:10])
    
    def _get_dev_wallet_percentage(self, wallet_analyses: List[WalletAnalysis]) -> float:
        """Get percentage held by developer wallets"""
        if not wallet_analyses:
            return 0.0
        
        return sum(w.percentage_of_supply for w in wallet_analyses 
                  if w.wallet_type == WalletTypeEnum.DEV_WALLET)
    
    def _count_sanctioned_addresses(self, wallet_analyses: List[WalletAnalysis]) -> int:
        """Count number of sanctioned addresses"""
        if not wallet_analyses:
            return 0
        
        return sum(1 for w in wallet_analyses 
                  if w.wallet_type == WalletTypeEnum.RUGPULL_SUSPECT)
