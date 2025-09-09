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

// Cluster-Typen
export const CLUSTER_TYPES = {
  CEX: { label: 'Centralized Exchange', color: '#f472b6' },
  DEX: { label: 'Decentralized Exchange', color: '#60a5fa' },
  WHALE: { label: 'Whale Cluster', color: '#f59e0b' },
  TEAM: { label: 'Team/Developer', color: '#34d399' },
  OTHER: { label: 'Other', color: '#a78bfa' }
};

// Risiko-Level
export const RISK_LEVELS = {
  low: { label: 'Low', color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#ef4444' },
  critical: { label: 'Critical', color: '#dc2626' }
};

// Token-Adressen für die Mock-Wallets
const TOKEN_ADDRESSES = {
  'PEPE': '0x6982508145454ce325ddbe47a25d4ec3d2311933',
  'SHIB': '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
  'DOGE': '0xba2ae424d960c26247dd6c32edc70b295c744c43'
};

// Mock-Token-Daten
const mockTokens = [
  {
    id: 1,
    symbol: 'PEPE',
    name: 'Pepe',
    address: TOKEN_ADDRESSES.PEPE,
    chain: 'ethereum',
    priceUsd: 0.00001234,
    priceChange24h: 12.5,
    volume24h: 15000000,
    marketCap: 5200000000,
    liquidity: 120000000,
    holders_count: 250000,
    contract_verified: true,
    creation_date: '2023-04-15T00:00:00',
    last_analyzed: '2025-04-05T10:00:00',
    token_score: 75.2,
    created_at: '2023-04-15T00:00:00',
    updated_at: '2025-04-05T10:00:00'
  },
  {
    id: 2,
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: TOKEN_ADDRESSES.SHIB,
    chain: 'ethereum',
    priceUsd: 0.00000876,
    priceChange24h: -3.2,
    volume24h: 120000000,
    marketCap: 5100000000,
    liquidity: 98000000,
    holders_count: 1350000,
    contract_verified: true,
    creation_date: '2020-08-01T00:00:00',
    last_analyzed: '2025-04-05T09:30:00',
    token_score: 82.7,
    created_at: '2020-08-01T00:00:00',
    updated_at: '2025-04-05T09:30:00'
  },
  {
    id: 3,
    symbol: 'DOGE',
    name: 'Dogecoin',
    address: TOKEN_ADDRESSES.DOGE,
    chain: 'ethereum',
    priceUsd: 0.0876,
    priceChange24h: 5.7,
    volume24h: 800000000,
    marketCap: 12500000000,
    liquidity: 450000000,
    holders_count: 4800000,
    contract_verified: true,
    creation_date: '2013-12-15T00:00:00',
    last_analyzed: '2025-04-05T08:45:00',
    token_score: 88.4,
    created_at: '2013-12-15T00:00:00',
    updated_at: '2025-04-05T08:45:00'
  }
];

// Mock-Wallet-Daten für Smart Contract Interaktionen
const mockWallets = [
  {
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8756',
    tokenType: 'PEPE',
    activityType: 'Buy',
    volume: 12500,
    timestamp: new Date(Date.now() - 3600000) // 1 Stunde alt
  },
  {
    walletAddress: '0x9b8e8f7d3c4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    tokenType: 'SHIB',
    activityType: 'Sell',
    volume: 8500,
    timestamp: new Date(Date.now() - 7200000) // 2 Stunden alt
  },
  {
    walletAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    tokenType: 'DOGE',
    activityType: 'Transfer',
    volume: 25000,
    timestamp: new Date(Date.now() - 1800000) // 30 Minuten alt
  },
  {
    walletAddress: '0x3c4d5e6f7890abcdef1234567890abcdef12345678',
    tokenType: 'PEPE',
    activityType: 'Buy',
    volume: 18500,
    timestamp: new Date(Date.now() - 5400000) // 1.5 Stunden alt
  },
  {
    walletAddress: '0x4e5f67890abcdef1234567890abcdef1234567890a',
    tokenType: 'SHIB',
    activityType: 'Transfer',
    volume: 12000,
    timestamp: new Date(Date.now() - 900000) // 15 Minuten alt
  },
  {
    walletAddress: '0x5f67890abcdef1234567890abcdef1234567890ab',
    tokenType: 'DOGE',
    activityType: 'Sell',
    volume: 32000,
    timestamp: new Date(Date.now() - 2700000) // 45 Minuten alt
  },
  {
    walletAddress: '0x67890abcdef1234567890abcdef1234567890abcd',
    tokenType: 'PEPE',
    activityType: 'Transfer',
    volume: 9500,
    timestamp: new Date(Date.now() - 3600000) // 1 Stunde alt
  },
  {
    walletAddress: '0x7890abcdef1234567890abcdef1234567890abcde',
    tokenType: 'SHIB',
    activityType: 'Buy',
    volume: 21500,
    timestamp: new Date(Date.now() - 6300000) // 1.75 Stunden alt
  },
  {
    walletAddress: '0x890abcdef1234567890abcdef1234567890abcdef',
    tokenType: 'DOGE',
    activityType: 'Buy',
    volume: 42000,
    timestamp: new Date(Date.now() - 450000) // 7.5 Minuten alt
  },
  {
    walletAddress: '0x90abcdef1234567890abcdef1234567890abcdef1',
    tokenType: 'PEPE',
    activityType: 'Sell',
    volume: 15500,
    timestamp: new Date(Date.now() - 8100000) // 2.25 Stunden alt
  },
  {
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    tokenType: 'SHIB',
    activityType: 'Transfer',
    volume: 7500,
    timestamp: new Date(Date.now() - 1350000) // 22.5 Minuten alt
  },
  {
    walletAddress: '0xbcdef1234567890abcdef1234567890abcdef123',
    tokenType: 'DOGE',
    activityType: 'Transfer',
    volume: 18000,
    timestamp: new Date(Date.now() - 2250000) // 37.5 Minuten alt
  },
  {
    walletAddress: '0xcdef1234567890abcdef1234567890abcdef1234',
    tokenType: 'PEPE',
    activityType: 'Buy',
    volume: 27500,
    timestamp: new Date(Date.now() - 3150000) // 52.5 Minuten alt
  },
  {
    walletAddress: '0xdef1234567890abcdef1234567890abcdef12345',
    tokenType: 'SHIB',
    activityType: 'Sell',
    volume: 13500,
    timestamp: new Date(Date.now() - 4050000) // 1.125 Stunden alt
  },
  {
    walletAddress: '0xef1234567890abcdef1234567890abcdef123456',
    tokenType: 'DOGE',
    activityType: 'Buy',
    volume: 35000,
    timestamp: new Date(Date.now() - 4950000) // 1.375 Stunden alt
  }
];

// Funktion zur Generierung von Wallet-Analysen basierend auf den Mock-Wallets
export const getMockWalletAnalysesFromWallets = () => {
  const walletTypes = Object.keys(WALLET_TYPES);
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const riskFlagsMap = {
    'Buy': ['high_volume', 'frequent_trading'],
    'Sell': ['profit_taking', 'distribution'],
    'Transfer': ['wallet_movement', 'consolidation']
  };
  
  // Berechne das Gesamtvolumen aller Wallets
  const totalVolume = mockWallets.reduce((sum, wallet) => sum + wallet.volume, 0);
  
  return mockWallets.map(wallet => {
    // Wähle einen zufälligen Wallet-Typ basierend auf der Aktivität
    let walletType;
    if (wallet.activityType === 'Buy' && wallet.volume > 20000) {
      walletType = 'whale_wallet';
    } else if (wallet.activityType === 'Sell' && wallet.volume > 15000) {
      walletType = 'smart_money';
    } else {
      walletType = walletTypes[Math.floor(Math.random() * walletTypes.length)];
    }
    
    // Berechne Confidence-Score basierend auf Volumen und Aktivität
    const confidenceScore = Math.min(0.5 + (wallet.volume / 50000), 0.95);
    
    // Berechne Prozentsatz des Volumens im Verhältnis zum Gesamtvolumen
    const percentageOfSupply = (wallet.volume / totalVolume) * 100;
    
    // Berechne Transaktionsanzahl basierend auf Volumen
    const transactionCount = Math.max(10, Math.floor(wallet.volume / 1000));
    
    // Berechne Risiko-Score basierend auf verschiedenen Faktoren
    let riskScore = 30; // Basis-Risiko
    
    // Höheres Risiko für Sell-Aktivitäten
    if (wallet.activityType === 'Sell') {
      riskScore += 20;
    }
    
    // Höheres Risiko für sehr hohe Volumina
    if (wallet.volume > 30000) {
      riskScore += 25;
    } else if (wallet.volume > 15000) {
      riskScore += 15;
    }
    
    // Risiko basierend auf Wallet-Typ
    if (walletType === 'bot') {
      riskScore += 30;
    } else if (walletType === 'retail') {
      riskScore += 5;
    }
    
    // Sicherstellen, dass der Risiko-Score zwischen 0 und 100 liegt
    riskScore = Math.min(riskScore, 100);
    
    // Wähle Risk-Flags basierend auf Aktivität und Volumen
    const riskFlags = [...(riskFlagsMap[wallet.activityType] || [])];
    
    // Zusätzliche Flags basierend auf Volumen
    if (wallet.volume > 25000) {
      riskFlags.push('high_value');
    }
    
    if (wallet.volume < 10000) {
      riskFlags.push('low_activity');
    }
    
    // Aktuelle Zeit für created_at und updated_at
    const now = new Date();
    
    return {
      wallet_address: wallet.walletAddress,
      chain: 'ethereum', // Alle Wallets sind auf Ethereum für dieses Beispiel
      wallet_type: walletType,
      confidence_score: confidenceScore,
      token_address: TOKEN_ADDRESSES[wallet.tokenType],
      balance: wallet.volume,
      percentage_of_supply: percentageOfSupply,
      transaction_count: transactionCount,
      first_transaction: wallet.timestamp.toISOString(),
      last_transaction: wallet.timestamp.toISOString(),
      risk_score: riskScore,
      risk_flags: riskFlags,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  });
};

// Mock-Adressen
const generateMockAddresses = (count = 10) => {
  const addresses = [];
  const addressTypes = ['EOA', 'CONTRACT'];
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const labels = ['Whale', 'Exchange', 'Team', 'Investor', 'Bot'];
  
  for (let i = 0; i < count; i++) {
    const addressType = addressTypes[Math.floor(Math.random() * addressTypes.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const label = Math.random() > 0.5 ? labels[Math.floor(Math.random() * labels.length)] : undefined;
    const isContract = addressType === 'CONTRACT';
    
    const riskScore = Math.floor(Math.random() * 100);
    const transactionCount = Math.floor(Math.random() * 1000) + 10;
    
    const now = new Date();
    const firstSeen = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const lastActivity = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    addresses.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      chain,
      address_type: addressType,
      is_contract: isContract,
      label,
      risk_score: riskScore,
      first_seen: firstSeen.toISOString(),
      last_activity: lastActivity.toISOString(),
      transaction_count: transactionCount,
      metadata: {
        additional_info: `Generated mock address ${i + 1}`
      }
    });
  }
  
  return addresses;
};

// Mock-Cluster
const generateMockClusters = (count = 5) => {
  const clusters = [];
  const clusterTypes = Object.keys(CLUSTER_TYPES);
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  
  for (let i = 0; i < count; i++) {
    const clusterType = clusterTypes[Math.floor(Math.random() * clusterTypes.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const clusterTypeInfo = CLUSTER_TYPES[clusterType];
    
    const addressCount = Math.floor(Math.random() * 500) + 10;
    const totalBalance = Math.random() * 10000000;
    const riskScore = Math.floor(Math.random() * 100);
    
    const now = new Date();
    const createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    clusters.push({
      id: i + 1,
      name: `${clusterTypeInfo.label} Cluster ${i + 1}`,
      description: `This is a ${clusterTypeInfo.label.toLowerCase()} cluster with ${addressCount} addresses`,
      cluster_type: clusterType,
      chain,
      address_count: addressCount,
      total_balance_usd: totalBalance,
      risk_score: riskScore,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
      is_active: Math.random() > 0.2,
      metadata: {
        additional_info: `Generated mock cluster ${i + 1}`
      }
    });
  }
  
  return clusters;
};

// Mock-CustomAnalysen
const generateMockCustomAnalyses = (count = 8) => {
  const analyses = [];
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const statuses = ['pending', 'in_progress', 'completed', 'failed'];
  const riskFlags = ['high_volatility', 'low_liquidity', 'honeypot', 'rugpull_suspect', 'high_tax', 'locked_liquidity'];
  
  for (let i = 0; i < count; i++) {
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const selectedRiskFlags = [];
    const numFlags = Math.floor(Math.random() * 3);
    for (let j = 0; j < numFlags; j++) {
      const flag = riskFlags[Math.floor(Math.random() * riskFlags.length)];
      if (!selectedRiskFlags.includes(flag)) {
        selectedRiskFlags.push(flag);
      }
    }
    
    const marketCap = Math.random() * 100000000;
    const volume24h = Math.random() * 10000000;
    const liquidity = Math.random() * 5000000;
    const holdersCount = Math.floor(Math.random() * 100000) + 100;
    const totalScore = Math.random() * 100;
    
    const now = new Date();
    const analysisDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    analyses.push({
      id: i + 1,
      token_address: token.address,
      chain,
      token_name: token.name,
      token_symbol: token.symbol,
      market_cap: marketCap,
      volume_24h: volume24h,
      liquidity,
      holders_count: holdersCount,
      total_score: totalScore,
      metrics: {
        score_breakdown: {
          liquidity_score: Math.random() * 100,
          volume_score: Math.random() * 100,
          holder_score: Math.random() * 100,
          age_score: Math.random() * 100
        }
      },
      risk_flags: selectedRiskFlags,
      analysis_date: analysisDate.toISOString(),
      analysis_status: status,
      user_id: `user${Math.floor(Math.random() * 100)}`,
      session_id: `sess${Math.floor(Math.random() * 1000)}`
    });
  }
  
  return analyses;
};

// Mock-ScanJobs
const generateMockScanJobs = (count = 6) => {
  const scanJobs = [];
  const statuses = ['pending', 'in_progress', 'completed', 'failed'];
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const scanTypes = ['discovery', 'analysis', 'monitoring'];
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const scanType = scanTypes[Math.floor(Math.random() * scanTypes.length)];
    
    const progress = status === 'completed' ? 1.0 : Math.random();
    const tokensFound = Math.floor(Math.random() * 100) + 10;
    const tokensAnalyzed = status === 'completed' ? tokensFound : Math.floor(tokensFound * progress);
    const highRiskTokens = Math.floor(tokensAnalyzed * 0.1);
    
    const now = new Date();
    const startTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    const endTime = status === 'completed' ? new Date(startTime.getTime() + Math.random() * 60 * 60 * 1000) : undefined;
    
    scanJobs.push({
      id: `scan${i + 1}`,
      status,
      progress,
      start_time: startTime.toISOString(),
      end_time: endTime ? endTime.toISOString() : undefined,
      error_message: status === 'failed' ? 'Scan failed due to network issues' : undefined,
      tokens_found: tokensFound,
      tokens_analyzed: tokensAnalyzed,
      high_risk_tokens: highRiskTokens,
      chain,
      scan_type: scanType
    });
  }
  
  return scanJobs;
};

// Mock-ScanResults
const generateMockScanResults = (count = 10) => {
  const scanResults = [];
  const statuses = ['pending', 'in_progress', 'completed', 'failed'];
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const scanTypes = ['token_scan', 'wallet_scan', 'cluster_scan'];
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const riskFlags = ['unusual_trading', 'low_liquidity', 'honeypot', 'rugpull_suspect', 'high_tax'];
  
  for (let i = 0; i < count; i++) {
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const scanType = scanTypes[Math.floor(Math.random() * scanTypes.length)];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    
    const selectedRiskFlags = [];
    const numFlags = Math.floor(Math.random() * 3);
    for (let j = 0; j < numFlags; j++) {
      const flag = riskFlags[Math.floor(Math.random() * riskFlags.length)];
      if (!selectedRiskFlags.includes(flag)) {
        selectedRiskFlags.push(flag);
      }
    }
    
    const score = Math.random() * 100;
    const processingTime = Math.floor(Math.random() * 5000) + 500;
    
    const now = new Date();
    const createdAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    
    scanResults.push({
      id: i + 1,
      scan_id: `scan${Math.floor(Math.random() * 6) + 1}`,
      scanType: scanType,
      token_address: token.address,
      chain,
      score,
      riskLevel: riskLevel,
      findings: {
        details: `Scan ${i + 1} findings for ${token.name}`,
        anomalies: Math.random() > 0.5,
        recommendations: Math.random() > 0.7 ? 'Further investigation recommended' : 'No action required'
      },
      risk_flags: selectedRiskFlags,
      created_at: createdAt.toISOString(),
      processing_time_ms: processingTime,
      status
    });
  }
  
  return scanResults;
};

// Mock-Transaktionen
const generateMockTransactions = (count = 20) => {
  const transactions = [];
  const chains = ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'];
  const statuses = ['success', 'failed', 'pending'];
  const methods = ['transfer', 'approve', 'swap', 'addLiquidity', 'removeLiquidity'];
  
  for (let i = 0; i < count; i++) {
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    
    const value = Math.random() * 10;
    const gasUsed = Math.floor(Math.random() * 500000) + 21000;
    const gasPrice = Math.random() * 100;
    const fee = (gasUsed * gasPrice) / 1000000000;
    const tokenAmount = Math.random() * 10000;
    
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    
    transactions.push({
      id: i + 1,
      tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      chain,
      block_number: Math.floor(Math.random() * 1000000) + 15000000,
      from_address: `0x${Math.random().toString(16).substr(2, 40)}`,
      to_address: `0x${Math.random().toString(16).substr(2, 40)}`,
      value,
      gas_used: gasUsed,
      gas_price: gasPrice,
      fee,
      token_address: token.address,
      token_amount: tokenAmount,
      timestamp: timestamp.toISOString(),
      status,
      method,
      metadata: {
        additional_info: `Generated mock transaction ${i + 1}`
      }
    });
  }
  
  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Mock-Daten mit Token und Transaktionen
export const getMockRadarData = () => {
  return mockTokens.map(token => ({
    token,
    transactions: generateMockTransactions(5).map(tx => ({
      id: `tx-${token.symbol}-${tx.id}`,
      timestamp: new Date(tx.timestamp).getTime(),
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      amount: tx.token_amount || 0,
      priceUsd: token.priceUsd,
      type: Math.random() > 0.4 ? 'buy' : 'sell',
      walletAddress: tx.from_address,
      walletCategory: Object.keys(WALLET_CATEGORIES)[Math.floor(Math.random() * Object.keys(WALLET_CATEGORIES).length)],
      transactionHash: tx.tx_hash
    })),
    timeRange: {
      start: Date.now() - 3600000,
      end: Date.now()
    }
  }));
};

// Export-Funktionen für alle Mock-Daten
export const getMockAddresses = () => generateMockAddresses();
export const getMockClusters = () => generateMockClusters();
export const getMockCustomAnalyses = () => generateMockCustomAnalyses();
export const getMockScanJobs = () => generateMockScanJobs();
export const getMockScanResults = () => generateMockScanResults();
export const getMockTokens = () => mockTokens;
export const getMockTransactions = () => generateMockTransactions();
export const getMockWallets = () => mockWallets;

// API-Ansatz (später mit echtem Backend)
export const fetchRadarData = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockRadarData()), 500);
    });
  } catch (error) {
    console.error('Error fetching radar data:', error);
    return [];
  }
};

// API-Ansätze für alle Datenmodelle
export const fetchAddresses = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockAddresses()), 500);
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
};

export const fetchClusters = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockClusters()), 500);
    });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    return [];
  }
};

export const fetchCustomAnalyses = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockCustomAnalyses()), 500);
    });
  } catch (error) {
    console.error('Error fetching custom analyses:', error);
    return [];
  }
};

export const fetchScanJobs = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockScanJobs()), 500);
    });
  } catch (error) {
    console.error('Error fetching scan jobs:', error);
    return [];
  }
};

export const fetchScanResults = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockScanResults()), 500);
    });
  } catch (error) {
    console.error('Error fetching scan results:', error);
    return [];
  }
};

export const fetchTokens = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockTokens()), 500);
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

export const fetchTransactions = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockTransactions()), 500);
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Aktualisierte fetchWalletAnalyses-Funktion, die die Mock-Wallets verwendet
export const fetchWalletAnalyses = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockWalletAnalysesFromWallets()), 500);
    });
  } catch (error) {
    console.error('Error fetching wallet analyses:', error);
    return [];
  }
};

export const fetchWallets = async () => {
  try {
    return new Promise(resolve => {
      setTimeout(() => resolve(getMockWallets()), 500);
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return [];
  }
};
