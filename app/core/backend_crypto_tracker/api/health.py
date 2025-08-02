# app/core/backend_crypto_tracker/api/health.py
from fastapi import APIRouter
from typing import Dict
import asyncio
import aiohttp

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Basic health check"""
    return {"status": "healthy", "service": "lowcap-analyzer"}

@router.get("/health/detailed")
async def detailed_health_check() -> Dict:
    """Detailed health check including external services"""
    health_status = {
        "status": "healthy",
        "checks": {}
    }
    
    # Database check
    try:
        # Test database connection
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # External API checks
    external_apis = {
        "ethereum_rpc": "https://mainnet.infura.io/v3/your-key",
        "solana_rpc": "https://api.mainnet-beta.solana.com",
        "sui_rpc": "https://fullnode.mainnet.sui.io:443"
    }
    
    async with aiohttp.ClientSession() as session:
        for api_name, url in external_apis.items():
            try:
                async with session.get(url, timeout=5) as response:
                    if response.status == 200:
                        health_status["checks"][api_name] = "healthy"
                    else:
                        health_status["checks"][api_name] = f"unhealthy: status {response.status}"
                        health_status["status"] = "degraded"
            except Exception as e:
                health_status["checks"][api_name] = f"unhealthy: {str(e)}"
                health_status["status"] = "degraded"
    
    return health_status
