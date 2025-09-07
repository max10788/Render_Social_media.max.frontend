import { WalletTransaction, TokenData } from '../types/api';

// Mock Wallet-Kategorien
const WALLET_CATEGORIES = {
  whale: { label: 'Whale', color: '#f59e0b' },
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
