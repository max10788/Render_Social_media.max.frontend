import { useState, useEffect } from 'react';
import { fetchRadarData } from '../services/tokenDiscovery';

export const useCryptoTracker = () => {
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchRadarData();
        setRadarData(data);
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
    loading,
    error,
    timeRange,
    setTimeRange
  };
};
