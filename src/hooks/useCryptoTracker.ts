import { useState, useCallback } from 'react';
import { API_CONFIG } from '../config/api';

// Types
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
  // States
  loading: boolean;
  error: Error | null;
  transactions: Transaction[];
  tokens: TokenData[];
  walletAnalysis: WalletAnalysis | null;

  // Actions
  trackTransactionChain: (startTxHash: string, targetCurrency: string, numTransactions?: number) => Promise<void>;
  discoverTokens: (params: DiscoveryParams) => Promise<void>;
  discoverTrendingTokens: (params: DiscoveryParams) => Promise<void>;
  analyzeWallet: (address: string) => Promise<void>;
  clearError: () => void;
}

const useCryptoTracker = (): UseCryptoTracker => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [walletAnalysis, setWalletAnalysis] = useState<WalletAnalysis | null>(null);

  const handleRequest = async <T>(
    requestFn: () => Promise<T>,
    errorMessage: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await requestFn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trackTransactionChain = useCallback(async (
    startTxHash: string,
    targetCurrency: string,
    numTransactions: number = 10
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
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: TrackingResult = await response.json();
        return data;
      },
      'Failed to track transaction chain'
    );

    if (result) {
      setTransactions(result.transactions);
    }
  }, []);

  const discoverTokens = useCallback(async (params: DiscoveryParams) => {
    const result = await handleRequest(
      async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/discover-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
      },
      'Failed to discover tokens'
    );

    if (result) {
      setTokens(result);
    }
  }, []);

  const discoverTrendingTokens = useCallback(async (params: DiscoveryParams) => {
    const result = await handleRequest(
      async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/discover-trending-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
      },
      'Failed to discover trending tokens'
    );

    if (result) {
      setTokens(result);
    }
  }, []);

  const analyzeWallet = useCallback(async (address: string) => {
    const result = await handleRequest(
      async () => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/analyze-wallet/${address}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
      },
      'Failed to analyze wallet'
    );

    if (result) {
      setWalletAnalysis(result);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // States
    loading,
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
