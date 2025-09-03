import { useState, useCallback, useEffect, useRef } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
    
    const executeWithRetry = async () => {
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
        
        return executeWithRetry();
      } finally {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      }
    };
    
    return executeWithRetry();
  }, []);

  const discoverTokensHelper = useCallback(async (
    endpoint,
    params,
    errorMessage
  ) => {
    const result = await handleRequest(
      async () => {
        const url = `${BASE_URL}${endpoint}`;
        console.log(`Sending request to: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: abortControllerRef.current?.signal
        });
        
        // Protokolliere wichtige Antwortinformationen
        console.log('Response URL:', response.url);
        console.log('Response Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText.substring(0, 500));
          throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        // Prüfe den Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('Unexpected Content-Type. Response preview:', responseText.substring(0, 500));
          throw new Error(`Unexpected Content-Type: ${contentType}. Expected: application/json`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid response structure - expected array');
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
        const url = `${BASE_URL}/track-transaction-chain`;
        console.log(`Tracking transaction chain: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_tx_hash: startTxHash,
            target_currency: targetCurrency,
            num_transactions: numTransactions
          }),
          signal: abortControllerRef.current?.signal
        });
        
        // Protokolliere wichtige Antwortinformationen
        console.log('Response URL:', response.url);
        console.log('Response Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText.substring(0, 500));
          throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        // Prüfe den Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('Unexpected Content-Type. Response preview:', responseText.substring(0, 500));
          throw new Error(`Unexpected Content-Type: ${contentType}. Expected: application/json`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || !Array.isArray(data.transactions)) {
          throw new Error('Invalid response structure - missing transactions array');
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
        const url = `${BASE_URL}/analyze-wallet/${address}`;
        console.log(`Analyzing wallet: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current?.signal
        });
        
        // Protokolliere wichtige Antwortinformationen
        console.log('Response URL:', response.url);
        console.log('Response Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText.substring(0, 500));
          throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        // Prüfe den Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('Unexpected Content-Type. Response preview:', responseText.substring(0, 500));
          throw new Error(`Unexpected Content-Type: ${contentType}. Expected: application/json`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data.risk_score !== 'number') {
          throw new Error('Invalid response structure - missing risk_score');
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
