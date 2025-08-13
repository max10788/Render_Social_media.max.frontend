# api/controllers/analysis_controller.py
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.backend_crypto_tracker.utils.logger import get_logger
from app.core.backend_crypto_tracker.utils.exceptions import APIException, NotFoundException
from app.core.backend_crypto_tracker.config.database import get_db
from app.core.backend_crypto_tracker.scanner.token_analyzer import TokenAnalyzer
from app.core.backend_crypto_tracker.scanner.wallet_classifier import EnhancedWalletClassifier
from app.core.backend_crypto_tracker.scanner.risk_assessor import RiskAssessor, RiskLevel

logger = get_logger(__name__)

class AnalysisController:
    """Controller for token and wallet analysis operations"""
    
    def __init__(self):
        self.token_analyzer = TokenAnalyzer()
        self.wallet_classifier = EnhancedWalletClassifier()
        self.risk_assessor = RiskAssessor()
    
    async def analyze_token(self, token_address: str, chain: str, 
                           background_tasks: BackgroundTasks = None) -> Dict[str, Any]:
        """
        Analyze a token comprehensively
        
        Args:
            token_address: The token contract address
            chain: The blockchain (ethereum, bsc, solana, sui)
            background_tasks: FastAPI background tasks for async processing
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Validate chain
            if chain not in ['ethereum', 'bsc', 'solana', 'sui']:
                raise HTTPException(status_code=400, detail="Unsupported blockchain")
            
            # Perform token analysis
            async with self.token_analyzer as analyzer:
                analysis_result = await analyzer.analyze_custom_token(token_address, chain)
                
                if not analysis_result:
                    raise NotFoundException(f"Token analysis failed for {token_address} on {chain}")
                
                # Perform risk assessment
                risk_assessment = await self._perform_risk_assessment(analysis_result)
                
                # Prepare result
                result = {
                    'token_info': analysis_result['token_info'],
                    'score': analysis_result['score'],
                    'metrics': analysis_result['metrics'],
                    'risk_flags': analysis_result['risk_flags'],
                    'wallet_analysis': analysis_result['wallet_analysis'],
                    'risk_assessment': {
                        'overall_score': risk_assessment.overall_score,
                        'risk_level': risk_assessment.risk_level.value,
                        'risk_factors': risk_assessment.risk_factors,
                        'confidence': risk_assessment.confidence,
                        'details': risk_assessment.details
                    },
                    'analysis_timestamp': datetime.utcnow().isoformat()
                }
                
                # Save analysis to database in background
                if background_tasks:
                    background_tasks.add_task(
                        self._save_analysis_to_db,
                        token_address,
                        chain,
                        result
                    )
                
                return result
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error analyzing token {token_address} on {chain}: {e}")
            raise APIException(f"Token analysis failed: {str(e)}")
    
    async def analyze_wallet(self, wallet_address: str, chain: str, 
                          token_address: str = None) -> Dict[str, Any]:
        """
        Analyze a wallet comprehensively
        
        Args:
            wallet_address: The wallet address to analyze
            chain: The blockchain
            token_address: Optional token address for token-specific analysis
            
        Returns:
            Dictionary containing wallet analysis results
        """
        try:
            # Validate chain
            if chain not in ['ethereum', 'bsc', 'solana', 'sui']:
                raise HTTPException(status_code=400, detail="Unsupported blockchain")
            
            # Get wallet balance and other data
            wallet_data = await self._get_wallet_data(wallet_address, chain, token_address)
            
            if not wallet_data:
                raise NotFoundException(f"Wallet data not found for {wallet_address} on {chain}")
            
            # Classify wallet
            wallet_analysis = await self.wallet_classifier.classify_wallet(
                wallet_address=wallet_address,
                chain=chain,
                balance=wallet_data.get('balance', 0),
                total_supply=wallet_data.get('total_supply', 0)
            )
            
            # Perform risk assessment for the wallet
            wallet_risk = await self._assess_wallet_risk(wallet_analysis, wallet_data)
            
            # Prepare result
            result = {
                'wallet_address': wallet_address,
                'chain': chain,
                'wallet_type': wallet_analysis.wallet_type.value,
                'confidence_score': wallet_analysis.confidence_score,
                'balance': wallet_analysis.balance,
                'percentage_of_supply': wallet_analysis.percentage_of_supply,
                'risk_score': wallet_analysis.risk_score,
                'sources_used': wallet_analysis.sources_used,
                'risk_assessment': {
                    'overall_score': wallet_risk.overall_score,
                    'risk_level': wallet_risk.risk_level.value,
                    'risk_factors': wallet_risk.risk_factors,
                    'confidence': wallet_risk.confidence,
                    'details': wallet_risk.details
                },
                'analysis_timestamp': datetime.utcnow().isoformat()
            }
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error analyzing wallet {wallet_address} on {chain}: {e}")
            raise APIException(f"Wallet analysis failed: {str(e)}")
    
    async def get_analysis_history(self, user_id: str = None, 
                                 limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get analysis history for a user or globally
        
        Args:
            user_id: Optional user ID to filter results
            limit: Maximum number of results to return
            
        Returns:
            List of analysis history entries
        """
        try:
            # This would typically query the database for analysis history
            # For now, we'll return a placeholder
            
            # In a real implementation:
            # db = next(get_db())
            # history = await db.get_analysis_history(user_id=user_id, limit=limit)
            
            # Placeholder implementation
            return [
                {
                    'id': 'placeholder_id',
                    'token_address': '0x1234567890123456789012345678901234567890',
                    'chain': 'ethereum',
                    'analysis_date': datetime.utcnow().isoformat(),
                    'score': 75.5,
                    'risk_level': 'medium'
                }
            ]
            
        except Exception as e:
            logger.error(f"Error getting analysis history: {e}")
            raise APIException(f"Failed to get analysis history: {str(e)}")
    
    async def _perform_risk_assessment(self, analysis_result: Dict[str, Any]) -> Any:
        """Perform risk assessment on token analysis results"""
        try:
            # Extract wallet analyses
            wallet_analyses = []
            
            # Convert wallet analysis data to WalletAnalysis objects
            for wallet_data in analysis_result.get('wallet_analysis', {}).get('top_holders', []):
                # This is a simplified conversion - in a real implementation,
                # you would properly construct WalletAnalysis objects
                from scanner.wallet_classifier import WalletAnalysis, WalletTypeEnum
                
                wallet_type = WalletTypeEnum.UNKNOWN
                for wt in WalletTypeEnum:
                    if wt.value == wallet_data.get('type'):
                        wallet_type = wt
                        break
                
                wallet_analysis = WalletAnalysis(
                    wallet_address=wallet_data.get('address'),
                    wallet_type=wallet_type,
                    balance=wallet_data.get('balance', 0),
                    percentage_of_supply=wallet_data.get('percentage', 0),
                    risk_score=0,  # Will be calculated
                    confidence_score=0.7,  # Default confidence
                    analysis_date=datetime.utcnow(),
                    sources_used=[]
                )
                wallet_analyses.append(wallet_analysis)
            
            # Perform risk assessment
            risk_assessment = await self.risk_assessor.assess_token_risk(
                token_data=analysis_result['token_info'],
                wallet_analyses=wallet_analyses
            )
            
            return risk_assessment
            
        except Exception as e:
            logger.error(f"Error performing risk assessment: {e}")
            # Return a default risk assessment if analysis fails
            from scanner.risk_assessor import RiskAssessment, RiskLevel
            return RiskAssessment(
                overall_score=50.0,
                risk_level=RiskLevel.MEDIUM,
                risk_factors=["analysis_error"],
                confidence=0.3,
                assessment_date=datetime.utcnow(),
                details={"error": str(e)}
            )
    
    async def _get_wallet_data(self, wallet_address: str, chain: str, 
                             token_address: str = None) -> Optional[Dict[str, Any]]:
        """Get wallet data from blockchain"""
        try:
            # This would typically query blockchain APIs for wallet data
            # For now, we'll return placeholder data
            
            # In a real implementation, you would:
            # 1. Query the blockchain for wallet balance
            # 2. If token_address is provided, get token balance
            # 3. Get transaction history
            # 4. Calculate relevant metrics
            
            return {
                'balance': 1000000,  # Placeholder balance
                'total_supply': 100000000,  # Placeholder total supply
                'transaction_count': 150,  # Placeholder transaction count
                'first_transaction': datetime.utcnow() - timedelta(days=30),
                'last_transaction': datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Error getting wallet data for {wallet_address} on {chain}: {e}")
            return None
    
    async def _assess_wallet_risk(self, wallet_analysis, wallet_data: Dict[str, Any]) -> Any:
        """Assess risk for a specific wallet"""
        try:
            # For wallet-specific risk assessment, we focus on different factors
            # than token-wide risk assessment
            
            risk_score = wallet_analysis.risk_score
            
            # Adjust risk based on transaction patterns
            transaction_count = wallet_data.get('transaction_count', 0)
            if transaction_count < 10:
                risk_score += 20  # Low activity can indicate higher risk
            elif transaction_count > 10000:
                risk_score -= 10  # High activity can indicate lower risk (e.g., CEX)
            
            # Adjust risk based on wallet age
            first_tx = wallet_data.get('first_transaction')
            if first_tx:
                wallet_age_days = (datetime.utcnow() - first_tx).days
                if wallet_age_days < 30:
                    risk_score += 15  # New wallets can be higher risk
                elif wallet_age_days > 365:
                    risk_score -= 10  # Older wallets can be lower risk
            
            # Determine risk level
            if risk_score >= 80:
                risk_level = RiskLevel.CRITICAL
            elif risk_score >= 60:
                risk_level = RiskLevel.HIGH
            elif risk_score >= 40:
                risk_level = RiskLevel.MEDIUM
            else:
                risk_level = RiskLevel.LOW
            
            # Create risk assessment
            from scanner.risk_assessor import RiskAssessment
            return RiskAssessment(
                overall_score=min(100, max(0, risk_score)),
                risk_level=risk_level,
                risk_factors=[],  # Would be populated with specific factors
                confidence=wallet_analysis.confidence_score,
                assessment_date=datetime.utcnow(),
                details={
                    'wallet_type': wallet_analysis.wallet_type.value,
                    'transaction_count': transaction_count,
                    'wallet_age_days': (datetime.utcnow() - first_tx).days if first_tx else 0
                }
            )
            
        except Exception as e:
            logger.error(f"Error assessing wallet risk: {e}")
            from scanner.risk_assessor import RiskAssessment, RiskLevel
            return RiskAssessment(
                overall_score=50.0,
                risk_level=RiskLevel.MEDIUM,
                risk_factors=["analysis_error"],
                confidence=0.3,
                assessment_date=datetime.utcnow(),
                details={"error": str(e)}
            )
    
    async def _save_analysis_to_db(self, token_address: str, chain: str, 
                                  analysis_result: Dict[str, Any]):
        """Save analysis results to database"""
        try:
            # This would typically save the analysis to the database
            # For now, we'll just log it
            
            logger.info(f"Saving analysis for {token_address} on {chain} to database")
            
            # In a real implementation:
            # db = next(get_db())
            # await db.save_token_analysis(
            #     token_address=token_address,
            #     chain=chain,
            #     analysis_data=analysis_result
            # )
            
        except Exception as e:
            logger.error(f"Error saving analysis to database: {e}")
