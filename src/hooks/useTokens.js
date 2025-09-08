import { useState, useEffect } from 'react';
import { fetchTokens } from '../services/tokenDiscovery';

export const useTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchTokens();
        setTokens(data);
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
    tokens,
    loading,
    error
  };
};
