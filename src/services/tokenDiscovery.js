import { WalletTransaction, TokenData, WalletAnalysis } from '../types/api';

// Mock Wallet-Kategorien
export const WALLET_CATEGORIES = {
  whale: { label: 'Whale', color: '#f59e0b' },
  smart_money: { label: 'Smart Money', color: '#10b981' },
  retail: { label: 'Retail', color: '#6366f1' },
  bot: { label: 'Bot', color: '#ef4444' }
};

// Wallet-Typen für die Klassifizierung
export const WALLET_TYPES = {
  EOA: { label: 'EOA', color: '#818cf8' },
  CONTRACT: { label: 'Contract', color: '#a78bfa' },
  CEX_WALLET: { label: 'CEX Wallet', color: '#f472b6' },
  whale_wallet: { label: 'Whale Wallet', color: '#f59e0b' },
  smart_money: { label: 'Smart Money', color: '#10b981' },
  retail: { label: 'Retail', color: '#6366f1' },
  bot: { label: 'Bot', color: '#ef4444' }
};

// Mock-Token-Daten
const mockTokens = [
  {
    symbol: 'PEPE',
    name: 'Pepe',
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    priceUsd: 0.00001234,
    priceChange24h: 12.5,
    volume24h: 15000000,
    marketCap: 5200000000
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    priceUsd: 0.00000876,
    priceChange24h: -3.2,
    volume24h: 120000000,
    marketCap: 5100000000
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    address: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
    priceUsd: 0.0876,
    priceChange24h: 5.7,
    volume24h: 800000000,
    marketCap: 12500000000
  }
];

// Mock-Wallet-Analysen
const generateMockWalletAnalyses = (count = 10) => {
  const analyses = [];
  const walletTypes = Object.keys(WALLET_TYPES);
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const riskFlags = ['whale', 'infrequent_tx', 'high_value', 'new_wallet', 'suspicious_pattern'];
  
  for (let i = 0; i < count; i++) {
    const walletType = walletTypes[Math.floor(Math.random() * walletTypes.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    
    // Zufällige Risiko-Flags auswählen
    const selectedRiskFlags = [];
    const numFlags = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numFlags; j++) {
      const flag = riskFlags[Math.floor(Math.random() * riskFlags.length)];
      if (!selectedRiskFlags.includes(flag)) {
        selectedRiskFlags.push(flag);
      }
    }
    
    // Zufällige Daten generieren
    const balance = Math.random() * 1000000;
    const percentageOfSupply = Math.random() * 10;
    const transactionCount = Math.floor(Math.random() * 1000) + 10;
    const riskScore = Math.floor(Math.random() * 100);
    const confidenceScore = Math.random() * 0.5 + 0.5; // Zwischen 0.5 und 1.0
    
    // Zufällige Zeitstempel generieren
    const now = new Date();
    const firstTx = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Innerhalb des letzten Jahres
    const lastTx = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Innerhalb der letzten 30 Tage
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Innerhalb der letzten 7 Tage
    const updatedAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Innerhalb der letzten 24 Stunden
    
    analyses.push({
      wallet_address: `0x${Math.random().toString(16).substr(2, 40)}`,
      chain,
      wallet_type: walletType,
      confidence_score: confidenceScore,
      token_address: token.address,
      balance,
      percentage_of_supply: percentageOfSupply,
      transaction_count: transactionCount,
      first_transaction: firstTx.toISOString(),
      last_transaction: lastTx.toISOString(),
      risk_score: riskScore,
      risk_flags: selectedRiskFlags,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString()
    });
  }
  
  return analyses;
};

// Mock-Transaktionen generieren
const generateMockTransactions = (token, count = 20) => {
  const transactions = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.random() * 3600000; // Letzte Stunde
    const categories = Object.keys(WALLET_CATEGORIES);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    transactions.push({
      id: `tx-${token.symbol}-${i}`,
      timestamp,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      amount: Math.random() * 1000000,
      priceUsd: token.priceUsd * (0.98 + Math.random() * 0.04),
      type: Math.random() > 0.4 ? 'buy' : 'sell',
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      walletCategory: randomCategory,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
    });
  }
  
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

// Mock-Daten mit Token und Transaktionen
export const getMockRadarData = () => {
  return mockTokens.map(token => ({
    token,
    transactions: generateMockTransactions(token),
    timeRange: {
      start: Date.now() - 3600000,
      end: Date.now()
    }
  }));
};

// Mock-Wallet-Analysen
export const getMockWalletAnalyses = () => {
  return generateMockWalletAnalyses();
};

// API-Ansatz (später mit echtem Backend)
export const fetchRadarData = async () => {
  try {
    // Später: const response = await api.get('/radar/small-caps');
    // return response.data;
    
    // Für jetzt: Mock-Daten zurückgeben
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockRadarData()), 500);
    });
  } catch (error) {
    console.error('Error fetching radar data:', error);
    return [];
  }
};

// API-Ansatz für Wallet-Analysen
export const fetchWalletAnalyses = async () => {
  try {
    // Später: const response = await api.get('/wallet/analyses');
    // return response.data;
    
    // Für jetzt: Mock-Daten zurückgeben
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockWalletAnalyses()), 500);
    });
  } catch (error) {
    console.error('Error fetching wallet analyses:', error);
    return [];
  }
};
