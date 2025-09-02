// src/hooks/useCryptoTracker.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { API_CONFIG } from '../config/api';

// Types (commented for documentation)
/*
interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  fee: number;
  timestamp: number;
  currency: string;
  direction: string;
  block_number?: number;
  gas_price?: number;
}

interface TrackingResult {
  transactions: Transaction[];
  source_currency: string;
  target_currency: string;
  start_transaction: string;
  transactions_count: number;
  tracking_timestamp: number;
  exchange_rate?: number;
}

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  market_cap?: number;
  volume_24h?: number;
  liquidity?: number;
  holders_count?: number;
  contract_verified?: boolean;
  creation_date?: string;
  last_analyzed?: string;
  token_score?: number;
}

interface WalletAnalysis {
  address: string;
  risk_score: number;
  entity_type: string;
  labels: string[];
  confidence: number;
  transaction_count: number;
  total_value: number;
  first_activity?: string;
  last_activity?: string;
  associated_entities: string[];
  compliance_flags: string[];
}

interface DiscoveryParams {
  chain: string;
  maxMarketCap?: number;
  minVolume?: number;
  hoursAgo?: number;
  limit?: number;
}

interface UseCryptoTracker {
  loading: boolean;
  error: Error | null;
  transactions: Transaction[];
  tokens: TokenData[];
  walletAnalysis: WalletAnalysis | null;
  trackTransactionChain: (startTxHash: string, targetCurrency: string, numTransactions?: number) => Promise<void>;
  discoverTokens: (params: DiscoveryParams) => Promise<void>;
  discoverTrendingTokens: (params: DiscoveryParams) => Promise<void>;
  analyzeWallet: (address: string) => Promise<void>;
  clearError: () => void;
}
*/

const useCryptoTracker = () => {
  const [loadingStates, setLoadingStates] = useState({
    tracking: false,
    discovering: false,
    analyzing: false
  });
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [walletAnalysis, setWalletAnalysis] = useState(null);
  const abortControllerRef = useRef(null);

  const handleRequest = useCallback(async (
    requestFn,
    errorMessage,
    loadingKey,
    maxRetries = 3
  ) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
        setError(null);
        return await requestFn();
      } catch (err) {
        retryCount++;
        
        if (retryCount > maxRetries || err.name === 'AbortError') {
          if (err.name !== 'AbortError') {
            const error = err instanceof Error ? err : new Error(errorMessage);
            setError(error);
          }
          return null;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, retryCount))
        );
      } finally {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      }
    }
    
    return null;
  }, []);

  const discoverTokensHelper = useCallback(async (
    endpoint,
    params,
    errorMessage
  ) => {
    const result = await handleRequest(
      async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
        // Validate response structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid response structure');
        }
        
        return data;
      },
      errorMessage,
      'discovering'
    );
    
    if (result) setTokens(result);
  }, [handleRequest]);

  const trackTransactionChain = useCallback(async (
    startTxHash,
    targetCurrency,
    numTransactions = 10
  ) => {
    const result = await handleRequest(
      async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/track-transaction-chain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_tx_hash: startTxHash,
            target_currency: targetCurrency,
            num_transactions: numTransactions
          }),
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || !Array.isArray(data.transactions)) {
          throw new Error('Invalid response structure');
        }
        
        return data;
      },
      'Failed to track transaction chain',
      'tracking'
    );
    
    if (result) {
      setTransactions(result.transactions);
    }
  }, [handleRequest]);

  const discoverTokens = useCallback(async (params) => {
    await discoverTokensHelper('/discover-tokens', params, 'Failed to discover tokens');
  }, [discoverTokensHelper]);

  const discoverTrendingTokens = useCallback(async (params) => {
    await discoverTokensHelper('/discover-trending-tokens', params, 'Failed to discover trending tokens');
  }, [discoverTokensHelper]);

  const analyzeWallet = useCallback(async (address) => {
    const result = await handleRequest(
      async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/analyze-wallet/${address}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data.risk_score !== 'number') {
          throw new Error('Invalid response structure');
        }
        
        return data;
      },
      'Failed to analyze wallet',
      'analyzing'
    );
    
    if (result) {
      setWalletAnalysis(result);
    }
  }, [handleRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // States
    loading: loadingStates.tracking || loadingStates.discovering || loadingStates.analyzing,
    error,
    transactions,
    tokens,
    walletAnalysis,
    // Actions
    trackTransactionChain,
    discoverTokens,
    discoverTrendingTokens,
    analyzeWallet,
    clearError
  };
};

export default useCryptoTracker;
