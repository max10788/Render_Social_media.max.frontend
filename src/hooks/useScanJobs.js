import { useState, useEffect } from 'react';
import { fetchScanJobs } from '../services/tokenDiscovery';

export const useScanJobs = () => {
  const [scanJobs, setScanJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchScanJobs();
        setScanJobs(data);
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
  }, []);

  return {
    scanJobs,
    loading,
    error
  };
};
