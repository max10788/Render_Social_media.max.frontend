import { useState, useEffect } from 'react';
import { fetchWalletAnalyses } from '../services/tokenDiscovery';

export const useWalletAnalyses = () => {
  const [walletAnalyses, setWalletAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchWalletAnalyses();
        setWalletAnalyses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Auto-Refresh alle 60 Sekunden
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    walletAnalyses,
    loading,
    error
  };
};
