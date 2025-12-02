/**
 * useOrderbookHeatmap.js - Custom Hook for Orderbook Heatmap
 * 
 * Manages:
 * - API calls (start/stop/status/snapshot)
 * - WebSocket connection for live updates
 * - State management
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAvailableExchanges,
  startHeatmap,
  stopHeatmap,
  getStatus,
  getSnapshot,
  normalizeSymbol,
} from '../services/orderbookHeatmapService';

const useOrderbookHeatmap = () => {
  // State
  const [exchanges, setExchanges] = useState([]);
  const [selectedExchanges, setSelectedExchanges] = useState(['binance']);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [priceBucketSize, setPriceBucketSize] = useState(50);
  const [timeWindowSeconds, setTimeWindowSeconds] = useState(60);
  
  const [heatmapData, setHeatmapData] = useState(null);
  const [status, setStatus] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // WebSocket Ref
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const snapshotIntervalRef = useRef(null);

  /**
   * Load Available Exchanges on Mount
   */
  useEffect(() => {
    const loadExchanges = async () => {
      try {
        const result = await getAvailableExchanges();
        setExchanges(result.exchanges || []);
        console.log('✅ Loaded exchanges:', result.exchanges);
      } catch (err) {
        console.error('Failed to load exchanges:', err);
        setError('Failed to load exchanges');
      }
    };

    loadExchanges();
  }, []);

  /**
   * Connect to WebSocket
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    const wsSymbol = normalizeSymbol(symbol);
    const wsUrl = `${process.env.REACT_APP_API_URL.replace('http', 'ws')}/api/v1/orderbook-heatmap/ws/${wsSymbol}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket Connected');
        setWsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'heatmap_update') {
            console.log('📊 Heatmap Update Received:', {
              symbol: data.symbol,
              prices: data.data?.prices?.length,
              exchanges: data.data?.exchanges?.length,
            });
            
            setHeatmapData(data.data);
            setLastUpdate(new Date());
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
        setWsConnected(false);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket Disconnected');
        setWsConnected(false);
        
        // Auto-reconnect if heatmap is running
        if (isRunning) {
          console.log('⏳ Reconnecting in 3s...');
          reconnectTimerRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect WebSocket');
    }
  }, [symbol, isRunning]);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    if (wsRef.current) {
      console.log('🔌 Closing WebSocket...');
      wsRef.current.close();
      wsRef.current = null;
    }

    setWsConnected(false);
  }, []);

  /**
   * Start Heatmap
   */
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await startHeatmap({
        symbol,
        exchanges: selectedExchanges,
        price_bucket_size: priceBucketSize,
        time_window_seconds: timeWindowSeconds,
      });

      console.log('✅ Heatmap started:', result);
      setIsRunning(true);
      
      // Connect WebSocket
      connectWebSocket();
      
      // Start polling snapshots (fallback if WebSocket fails)
      snapshotIntervalRef.current = setInterval(async () => {
        try {
          const snapshot = await getSnapshot(symbol);
          setHeatmapData(snapshot);
          setLastUpdate(new Date());
        } catch (err) {
          console.error('Snapshot polling error:', err);
        }
      }, 5000); // Poll every 5s as backup

    } catch (err) {
      console.error('Failed to start heatmap:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start heatmap');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedExchanges, priceBucketSize, timeWindowSeconds, connectWebSocket]);

  /**
   * Stop Heatmap
   */
  const handleStop = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await stopHeatmap();
      console.log('✅ Heatmap stopped');
      
      setIsRunning(false);
      disconnectWebSocket();
      
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }

    } catch (err) {
      console.error('Failed to stop heatmap:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to stop heatmap');
    } finally {
      setIsLoading(false);
    }
  }, [disconnectWebSocket]);

  /**
   * Fetch Current Status
   */
  const fetchStatus = useCallback(async () => {
    try {
      const result = await getStatus();
      setStatus(result);
      setIsRunning(result.is_running || false);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [disconnectWebSocket]);

  return {
    // State
    exchanges,
    selectedExchanges,
    symbol,
    priceBucketSize,
    timeWindowSeconds,
    heatmapData,
    status,
    isRunning,
    isLoading,
    error,
    wsConnected,
    lastUpdate,

    // Actions
    setSelectedExchanges,
    setSymbol,
    setPriceBucketSize,
    setTimeWindowSeconds,
    handleStart,
    handleStop,
    fetchStatus,
  };
};

export default useOrderbookHeatmap;
