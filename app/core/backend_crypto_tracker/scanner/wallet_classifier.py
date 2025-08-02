# app/core/backend_crypto_tracker/scanner/wallet_classifier.py (Ergänzung)

class MultiChainWalletClassifier:
    def __init__(self):
        self.known_addresses = {
            'ethereum': self._load_known_ethereum_addresses(),
            'bsc': self._load_known_bsc_addresses(),
            'solana': self._load_known_solana_addresses(),
            'sui': self._load_known_sui_addresses()
        }
    
    async def classify_wallet(self, wallet_address: str, chain: str, 
                            balance: float, total_supply: float = None) -> WalletAnalysis:
        """Klassifiziert Wallets für verschiedene Chains"""
        
        wallet_type = await self._determine_wallet_type(wallet_address, chain, balance, total_supply)
        percentage_of_supply = (balance / total_supply * 100) if total_supply else 0
        risk_score = self._calculate_risk_score(wallet_type, percentage_of_supply, chain)
        
        return WalletAnalysis(
            wallet_address=wallet_address,
            wallet_type=wallet_type,
            balance=balance,
            percentage_of_supply=percentage_of_supply,
            risk_score=risk_score,
            analysis_date=datetime.utcnow()
        )
    
    async def _determine_wallet_type(self, address: str, chain: str, 
                                   balance: float, total_supply: float) -> WalletTypeEnum:
        """Bestimmt den Wallet-Typ basierend auf Chain und Adresse"""
        
        # 1. Bekannte Adressen prüfen
        known_addr = self.known_addresses.get(chain, {})
        if address in known_addr:
            return known_addr[address]
        
        # 2. Chain-spezifische Klassifizierung
        if chain in ['ethereum', 'bsc']:
            return await self._classify_evm_wallet(address, chain, balance, total_supply)
        elif chain == 'solana':
            return await self._classify_solana_wallet(address, balance, total_supply)
        elif chain == 'sui':
            return await self._classify_sui_wallet(address, balance, total_supply)
        
        # 3. Generische Klassifizierung basierend auf Balance
        if total_supply and balance / total_supply > 0.05:  # >5% des Supplies
            return WalletTypeEnum.WHALE_WALLET
        elif balance > 1000000:  # Hoher absoluter Wert
            return WalletTypeEnum.WHALE_WALLET
        else:
            return WalletTypeEnum.UNKNOWN
    
    def _load_known_solana_addresses(self) -> Dict[str, WalletTypeEnum]:
        """Lädt bekannte Solana Adressen"""
        return {
            # Bekannte DEX Adressen
            'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': WalletTypeEnum.DEX_CONTRACT,
            'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': WalletTypeEnum.DEX_CONTRACT,
            # Bekannte CEX Adressen
            'EVMxfGDjANiCcvFgDJ7E8pfHgKqKpzqJJYxJt8o9V5i': WalletTypeEnum.CEX_WALLET,
            # Burn Addresses
            '11111111111111111111111111111111': WalletTypeEnum.BURN_WALLET,
        }
    
    def _load_known_sui_addresses(self) -> Dict[str, WalletTypeEnum]:
        """Lädt bekannte Sui Adressen"""
        return {
            # Bekannte System Adressen
            '0x0000000000000000000000000000000000000000000000000000000000000000': WalletTypeEnum.BURN_WALLET,
            # Weitere Sui-spezifische Adressen...
        }
    
    async def _classify_solana_wallet(self, address: str, balance: float, 
                                    total_supply: float) -> WalletTypeEnum:
        """Solana-spezifische Wallet-Klassifizierung"""
        
        # Prüfe auf Solana-spezifische Muster
        if address.startswith('11111111111111111111111111111111'):
            return WalletTypeEnum.BURN_WALLET
        
        # Prüfe auf Token Account vs. Wallet Account
        # In Solana sind Token Accounts anders strukturiert
        if len(address) == 44:  # Standard Solana Adresse
            # Weitere Logik für Solana Wallet-Klassifizierung
            if total_supply and balance / total_supply > 0.1:
                return WalletTypeEnum.WHALE_WALLET
            elif balance > 1000000:
                return WalletTypeEnum.WHALE_WALLET
            else:
                return WalletTypeEnum.UNKNOWN
        
        return WalletTypeEnum.UNKNOWN
    
    async def _classify_sui_wallet(self, address: str, balance: float,
                                 total_supply: float) -> WalletTypeEnum:
        """Sui-spezifische Wallet-Klassifizierung"""
        
        # Sui hat eine objekt-basierte Architektur
        if address.startswith('0x00000000'):
            return WalletTypeEnum.BURN_WALLET
        
        # Sui-spezifische Klassifizierungslogik
        if total_supply and balance / total_supply > 0.1:
            return WalletTypeEnum.WHALE_WALLET
        elif balance > 1000000:
            return WalletTypeEnum.WHALE_WALLET
        else:
            return WalletTypeEnum.UNKNOWN
    
    def _calculate_risk_score(self, wallet_type: WalletTypeEnum, 
                            percentage: float, chain: str) -> float:
        """Berechnet Risk Score mit Chain-spezifischen Anpassungen"""
        base_scores = {
            WalletTypeEnum.DEV_WALLET: 80.0,
            WalletTypeEnum.RUGPULL_SUSPECT: 95.0,
            WalletTypeEnum.WHALE_WALLET: 60.0,
            WalletTypeEnum.DEX_CONTRACT: 10.0,
            WalletTypeEnum.CEX_WALLET: 20.0,
            WalletTypeEnum.BURN_WALLET: 0.0,
            WalletTypeEnum.UNKNOWN: 30.0
        }
        
        base_score = base_scores.get(wallet_type, 30.0)
        
        # Anpassungen basierend auf Percentage
        if percentage > 20:
            base_score += 20
        elif percentage > 10:
            base_score += 10
        elif percentage > 5:
            base_score += 5
        
        # Chain-spezifische Anpassungen
        if chain == 'solana':
            # Solana hat oft mehr fragmentierte Ownership
            base_score *= 0.9
        elif chain == 'sui':
            # Sui ist neu, weniger etablierte Muster
            base_score *= 1.1
        
        return min(100.0, max(0.0, base_score))
