class EllipticIntegration:
    """Enhanced integration with Elliptic API for advanced wallet analysis"""
    
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://api.elliptic.co/v2"
        self.session_timeout = 30.0
    
    def _generate_auth_headers(self) -> Dict[str, str]:
        """Generate authentication headers for Elliptic API"""
        # In production, implement proper HMAC authentication
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def get_wallet_analysis(self, address: str) -> Optional[Dict]:
        """Get comprehensive wallet analysis from Elliptic"""
        try:
            headers = self._generate_auth_headers()
            
            async with httpx.AsyncClient(timeout=self.session_timeout) as client:
                response = await client.get(
                    f"{self.base_url}/wallet/{address}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    analysis = {
                        'address': address,
                        'risk_score': data.get('riskScore', 0),
                        'entity_type': data.get('entityType', ''),
                        'labels': data.get('labels', []),
                        'confidence': data.get('confidence', 0.5),
                        'transaction_count': data.get('transactionCount', 0),
                        'total_value': data.get('totalValue', 0),
                        'first_activity': data.get('firstActivity'),
                        'last_activity': data.get('lastActivity'),
                        'associated_entities': data.get('associatedEntities', []),
                        'compliance_flags': data.get('complianceFlags', [])
                    }
                    
                    return analysis
                return None
                
        except Exception as e:
            logger.error(f"Elliptic wallet analysis failed: {e}")
            return None
    
    async def get_entity_labels(self, address: str) -> List[str]:
        """Get detailed entity labels with context"""
        try:
            analysis = await self.get_wallet_analysis(address)
            if analysis and 'labels' in analysis:
                return analysis['labels']
            return []
        except Exception as e:
            logger.error(f"Entity label retrieval failed: {e}")
            return []
    
    async def get_transaction_risk(self, tx_hash: str) -> Optional[Dict]:
        """Analyze transaction risk"""
        try:
            headers = self._generate_auth_headers()
            
            async with httpx.AsyncClient(timeout=self.session_timeout) as client:
                response = await client.get(
                    f"{self.base_url}/transaction/{tx_hash}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
                
        except Exception as e:
            logger.error(f"Transaction risk analysis failed: {e}")
            return None(f"Elliptic API call failed: {e}")
            return None
    
    async def get_entity_labels(self, address: str) -> List[str]:
        """Get entity labels for address"""
        try:
            analysis = await self.get_wallet_analysis(address)
            if analysis and 'labels' in analysis:
                return analysis['labels']
            return []
        except Exception as e:
            logger.error(f"Entity label retrieval failed: {e}")
            return []
