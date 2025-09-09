import { useState, useEffect } from 'react';
import { fetchRadarData, fetchWallets } from '../services/tokenDiscovery';

export const useCryptoTracker = () => {
  const [radarData, setRadarData] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [radarResult, walletsResult] = await Promise.all([
          fetchRadarData(),
          fetchWallets()
        ]);
        setRadarData(radarResult);
        setWallets(walletsResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Auto-Refresh alle 30 Sekunden
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return {
    radarData,
    wallets,
    loading,
    error,
    timeRange,
    setTimeRange
  };
};
