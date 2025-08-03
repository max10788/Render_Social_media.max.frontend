# app/core/backend_crypto_tracker/scanner/token_analyzer.py
import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from web3 import Web3
from dataclasses import dataclass
from enum import Enum
import json
import time
import statistics

# Import from other modules
from app.core.backend_crypto_tracker.services.eth.etherscan_api import get_token_holders # For get_token_holders
from app.core.backend_crypto_tracker.services.multichain.price_service import get_low_cap_tokens, _get_solana_price_jupiter, _get_solana_token_price, _get_evm_token_price, get_custom_token_price # For get_low_cap_tokens
from app.core.backend_crypto_tracker.processor.database.models import token, wallet # For TokenData, WalletType, WalletAnalysis
from app.core.backend_crypto_tracker.utils import logger # Use project logger if configured

# Konfiguration und Logging (Consider moving to utils/logger.py setup)
# logging.basicConfig(level=logging.INFO) # Usually done at app startup
# logger = logging.getLogger(__name__)

# WalletType Enum moved to database.models.wallet
# TokenData Dataclass moved to database.models.token
# WalletAnalysis Dataclass moved to database.models.wallet

class LowCapAnalyzer:
    def __init__(self, config: Dict):
        self.config = config
        self.session = None
        self.w3_eth = Web3(Web3.HTTPProvider(config['ethereum_rpc']))
        self.w3_bsc = Web3(Web3.HTTPProvider(config['bsc_rpc']))
        # API Keys
        self.etherscan_key = config['etherscan_api_key']
        self.bscscan_key = config['bscscan_api_key']
        self.coingecko_key = config.get('coingecko_api_key')
        # Bekannte Contract-Adressen (Consider moving to config/scanner_config.py)
        self.known_contracts = {
            'uniswap_v2_router': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            'uniswap_v3_router': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            'pancakeswap_router': '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            'burn_addresses': ['0x0000000000000000000000000000000000000000',
                             '0x000000000000000000000000000000000000dead']
        }
        # CEX Wallets (bekannte Börsen-Wallets) (Consider moving to config/scanner_config.py)
        self.cex_wallets = {
            'binance': ['0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE'],
            'coinbase': ['0x503828976D22510aad0201ac7EC88293211D23Da'],
            'kraken': ['0x2910543af39aba0cd09dbb2d50200b3e800a63d2']
        }

    async def __aenter__(self):
        # Consider injecting the session or managing it externally
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    # Moved to services.multichain.price_service
    # async def get_low_cap_tokens(self, max_market_cap: float = 5000000) -> List[token.TokenData]:
    #     ...

    # Moved to services.eth.etherscan_api
    # async def get_token_holders(self, token_address: str, chain: str = 'ethereum', limit: int = 100) -> List[Dict]:
    #     ...

    async def analyze_custom_token(self, token_address: str, chain: str) -> dict:
        """
        Analysiert einen einzelnen, benutzerdefinierten Token
        """
        try:
            # 1. Token-Metadaten abrufen
            token_data = await self._fetch_custom_token_data(token_address, chain)
            
            if not token_data:
                raise ValueError(f"Token data could not be retrieved for {token_address} on {chain}")
            
            # 2. Holder-Analyse durchführen
            holders = await self._fetch_token_holders(token_address, chain)
            
            # 3. Wallet-Klassifizierung
            wallet_analyses = []
            for holder in holders:
                wallet_analysis = await self.wallet_classifier.classify_wallet(
                    holder['address'], chain, holder['balance']
                )
                wallet_analyses.append(wallet_analysis)
            
            # 4. Score-Berechnung
            score_data = self._calculate_token_score_custom(token_data, wallet_analyses)
            
            # 5. Ergebnis zusammenstellen
            analysis_result = {
                'token_info': {
                    'address': token_data.address,
                    'name': token_data.name,
                    'symbol': token_data.symbol,
                    'chain': chain,
                    'market_cap': token_data.market_cap,
                    'volume_24h': token_data.volume_24h,
                    'holders_count': len(holders),
                    'liquidity': token_data.liquidity
                },
                'score': score_data['total_score'],
                'metrics': score_data['metrics'],
                'risk_flags': score_data['risk_flags'],
                'wallet_analysis': {
                    'total_wallets': len(wallet_analyses),
                    'dev_wallets': len([w for w in wallet_analyses if w.wallet_type == 'dev_wallet']),
                    'whale_wallets': len([w for w in wallet_analyses if w.wallet_type == 'whale_wallet']),
                    'rugpull_suspects': len([w for w in wallet_analyses if w.wallet_type == 'rugpull_suspect']),
                    'top_holders': [
                        {
                            'address': w.wallet_address,
                            'balance': w.balance,
                            'percentage': w.percentage_of_supply,
                            'type': w.wallet_type.value
                        }
                        for w in sorted(wallet_analyses, key=lambda x: x.balance, reverse=True)[:10]
                    ]
                }
            }
            
            # 6. Optional: Ergebnisse in Datenbank speichern
            if self.save_custom_analysis:
                await self._save_custom_analysis(token_address, chain, analysis_result)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing custom token {token_address} on {chain}: {e}")
            raise
    
    async def _fetch_custom_token_data(self, token_address: str, chain: str):
        """Holt Token-Daten für verschiedene Chains"""
        if chain in ['ethereum', 'bsc']:
            return await self._fetch_evm_token_data(token_address, chain)
        elif chain == 'solana':
            return await self._fetch_solana_token_data(token_address)
        elif chain == 'sui':
            return await self._fetch_sui_token_data(token_address)
        else:
            raise ValueError(f"Unsupported chain: {chain}")
    
    async def _fetch_token_holders(self, token_address: str, chain: str) -> List[dict]:
        """Holt Token-Holder für verschiedene Chains"""
        if chain in ['ethereum', 'bsc']:
            from ..services.eth.etherscan_api import get_token_holders
            async with aiohttp.ClientSession() as session:
                return await get_token_holders(session, token_address, chain)
        elif chain == 'solana':
            from ..services.solana.solana_api import get_token_holders as get_solana_holders
            async with aiohttp.ClientSession() as session:
                return await get_solana_holders(session, token_address)
        elif chain == 'sui':
            from ..services.sui.sui_api import get_token_holders as get_sui_holders
            async with aiohttp.ClientSession() as session:
                return await get_sui_holders(session, token_address)
        else:
            return []
    
    def classify_wallet(self, wallet_address: str, balance: float, percentage: float,
                       transaction_data: Dict, token_data: token.TokenData) -> wallet.WalletType:
        """Klassifiziert Wallets basierend auf verschiedenen Kriterien"""
        # Burn Wallet Check
        if wallet_address.lower() in [addr.lower() for addr in self.known_contracts['burn_addresses']]:
            return wallet.WalletType.BURN_WALLET
        # DEX Contract Check
        if wallet_address.lower() in [addr.lower() for addr in self.known_contracts.values() if isinstance(addr, str)]:
            return wallet.WalletType.DEX_CONTRACT
        # CEX Wallet Check
        for exchange, wallets in self.cex_wallets.items():
            if wallet_address.lower() in [w.lower() for w in wallets]:
                return wallet.WalletType.CEX_WALLET
        # Whale Wallet (>5% der Supply)
        if percentage > 5.0:
            return wallet.WalletType.WHALE_WALLET
        # Dev Wallet Heuristik (frühe Transaktionen + hoher Anteil)
        tx_count = transaction_data.get('tx_count', 0)
        if percentage > 2.0 and tx_count < 10:
            return wallet.WalletType.DEV_WALLET
        # Sniper Wallet (sehr frühe Käufe)
        first_tx_time = transaction_data.get('first_tx_time')
        if first_tx_time and token_data.creation_date:
            time_diff = first_tx_time - token_data.creation_date
            if time_diff.total_seconds() < 300:  # Erste 5 Minuten
                return wallet.WalletType.SNIPER_WALLET
        # Rugpull Verdacht (plötzliche große Verkäufe)
        recent_sells = transaction_data.get('recent_large_sells', 0)
        if recent_sells > percentage * 0.5:  # Verkauft mehr als 50% des Holdings
            return wallet.WalletType.RUGPULL_SUSPECT
        return wallet.WalletType.UNKNOWN

    def calculate_gini_coefficient(self, balances: List[float]) -> float:
        """Berechnet den Gini-Koeffizienten für Token-Verteilung"""
        if not balances:
            return 0.0
        sorted_balances = sorted(balances)
        n = len(sorted_balances)
        cumsum = np.cumsum(sorted_balances)
        # Simple Gini calculation (might need refinement)
        return (2 * sum((i + 1) * balance for i, balance in enumerate(sorted_balances))) / (n * cumsum[-1]) - (n + 1) / n

    def calculate_token_score(self, token_data: token.TokenData, wallet_analyses: List[wallet.WalletAnalysis]) -> float:
        """Berechnet einen Risiko-Score für den Token"""
        score = 100.0  # Start mit perfektem Score
        # Marktkapitalisierung Score (niedrigere MC = höheres Risiko)
        if token_data.market_cap < 100000:  # < $100k
            score -= 30
        elif token_data.market_cap < 500000:  # < $500k
            score -= 20
        elif token_data.market_cap < 1000000:  # < $1M
            score -= 10
        # Liquiditäts-Score
        if token_data.liquidity < 50000:  # < $50k Liquidität
            score -= 25
        elif token_data.liquidity < 100000:  # < $100k
            score -= 15
        # Contract Verification
        if not token_data.contract_verified:
            score -= 15
        # Wallet-Verteilungsanalyse
        total_supply_analyzed = sum(w.percentage_of_supply for w in wallet_analyses)
        whale_percentage = sum(w.percentage_of_supply for w in wallet_analyses if w.wallet_type == wallet.WalletType.WHALE_WALLET)
        dev_percentage = sum(w.percentage_of_supply for w in wallet_analyses if w.wallet_type == wallet.WalletType.DEV_WALLET)
        rugpull_suspects = sum(1 for w in wallet_analyses if w.wallet_type == wallet.WalletType.RUGPULL_SUSPECT)
        # Whale-Konzentration
        if whale_percentage > 50:
            score -= 40
        elif whale_percentage > 30:
            score -= 25
        elif whale_percentage > 15:
            score -= 10
        # Dev Wallet Konzentration
        if dev_percentage > 20:
            score -= 30
        elif dev_percentage > 10:
            score -= 15
        # Rugpull Verdächtige
        if rugpull_suspects > 0:
            score -= rugpull_suspects * 20
        # Gini-Koeffizient
        balances = [w.balance for w in wallet_analyses]
        gini = self.calculate_gini_coefficient(balances)
        if gini > 0.8:  # Sehr ungleiche Verteilung
            score -= 20
        elif gini > 0.6:
            score -= 10
        return max(0, min(100, score))

    async def analyze_token(self, token_data: token.TokenData) -> Dict:
        """Vollständige Analyse eines Tokens"""
        logger.info(f"Analysiere Token: {token_data.symbol} ({token_data.address})")
        # Hole Token-Holder
        holders = await etherscan_api.get_token_holders(self.session, token_data.address, token_data.chain,
                                                        self.etherscan_key, self.bscscan_key) # Pass session/key
        if not holders:
            logger.warning(f"Keine Holder-Daten für {token_data.symbol}")
            return None

        # Analysiere Wallets
        wallet_analyses = []
        total_supply = sum(float(h['TokenHolderQuantity']) for h in holders)
        for holder in holders[:100]:  # Top 100
            balance = float(holder['TokenHolderQuantity'])
            percentage = (balance / total_supply) * 100 if total_supply > 0 else 0
            # Simuliere Transaktionsdaten (in echter Implementation würde man diese abrufen)
            transaction_data = {
                'tx_count': np.random.randint(1, 100),
                'first_tx_time': datetime.now() - timedelta(days=np.random.randint(1, 365)),
                'recent_large_sells': 0
            }
            wallet_type = self.classify_wallet(
                holder['TokenHolderAddress'],
                balance,
                percentage,
                transaction_data,
                token_data
            )
            wallet_analyses.append(wallet.WalletAnalysis(
                address=holder['TokenHolderAddress'],
                wallet_type=wallet_type,
                balance=balance,
                percentage_of_supply=percentage,
                transaction_count=transaction_data['tx_count'],
                first_transaction=transaction_data['first_tx_time'],
                last_transaction=datetime.now(),
                risk_score=0  # Wird bei Bedarf berechnet
            ))
        # Berechne Token-Score
        token_score = self.calculate_token_score(token_data, wallet_analyses)
        return {
            'token_data': token_data,
            'wallet_analyses': wallet_analyses,
            'token_score': token_score,
            'analysis_date': datetime.now(),
            'metrics': {
                'total_holders_analyzed': len(wallet_analyses),
                'whale_wallets': len([w for w in wallet_analyses if w.wallet_type == wallet.WalletType.WHALE_WALLET]),
                'dev_wallets': len([w for w in wallet_analyses if w.wallet_type == wallet.WalletType.DEV_WALLET]),
                'rugpull_suspects': len([w for w in wallet_analyses if w.wallet_type == wallet.WalletType.RUGPULL_SUSPECT]),
                'gini_coefficient': self.calculate_gini_coefficient([w.balance for w in wallet_analyses])
            }
        }

    async def scan_low_cap_tokens(self, max_tokens: int = 50) -> List[Dict]:
        """Hauptfunktion zum Scannen von Low-Cap Tokens"""
        logger.info("Starte Low-Cap Token Scan...")
        # Hole Low-Cap Tokens
        tokens = await price_service.get_low_cap_tokens(self.session, self.coingecko_key) # Pass session/key
        if not tokens:
            logger.error("Keine Tokens gefunden")
            return []

        # Begrenze die Anzahl für Demo
        tokens = tokens[:max_tokens]
        results = []
        for i, token in enumerate(tokens):
            try:
                logger.info(f"Verarbeite Token {i+1}/{len(tokens)}: {token.symbol}")
                analysis = await self.analyze_token(token)
                if analysis:
                    results.append(analysis)
                # Rate limiting
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Fehler bei der Analyse von {token.symbol}: {e}")
                continue
        logger.info(f"Analyse abgeschlossen. {len(results)} Tokens erfolgreich analysiert.")
        return results

# Beispiel-Verwendung - besser in workers/scanner_worker.py
# async def main():
#     config = {
#         'ethereum_rpc': 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
#         'bsc_rpc': 'https://bsc-dataseed.binance.org/',
#         'etherscan_api_key': 'YOUR_ETHERSCAN_KEY',
#         'bscscan_api_key': 'YOUR_BSCSCAN_KEY',
#         'coingecko_api_key': None  # Optional Pro Key
#     }
#     async with LowCapAnalyzer(config) as analyzer:
#         results = await analyzer.scan_low_cap_tokens(max_tokens=10)
#         # Exportiere Ergebnisse
#         for result in results:
#             print(f"Token: {result['token_data'].symbol}")
#             print(f"Score: {result['token_score']:.2f}")
#             print(f"Whale Wallets: {result['metrics']['whale_wallets']}")
#             print(f"Gini Coefficient: {result['metrics']['gini_coefficient']:.3f}")
#             print("-" * 50)
# if __name__ == "__main__":
#     asyncio.run(main())

