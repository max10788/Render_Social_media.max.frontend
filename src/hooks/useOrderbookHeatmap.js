/**
 * useOrderbookHeatmap.js - Enhanced Hook with Buffer + Dual WebSocket
 * 
 * Features:
 * - State management for all heatmap controls
 * - Dual WebSocket connections (Heatmap + Price)
 * - Rolling buffer management (600 snapshots max = 10 min @ 1s)
 * - Auto-reconnect logic for both WebSockets
 * - Cleanup on unmount
 * - Error handling
 * 
 * WebSocket Architecture:
 * 1. Heatmap WS: /ws/{symbol} → Orderbook snapshots
 * 2. Price WS: /ws/price/{symbol} → Live price updates
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
  // ========== STATE ==========
  
  // Configuration state
  const [exchanges, setExchanges] = useState([]);
  const [selectedExchanges, setSelectedExchanges] = useState(['binance']);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [priceBucketSize, setPriceBucketSize] = useState(50);
  const [timeWindowSeconds, setTimeWindowSeconds] = useState(300); // 5 minutes default
  
  // Data state
  const [heatmapBuffer, setHeatmapBuffer] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]); // NEW: Track price over time
  const [status, setStatus] = useState(null);
  
  // UI state
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [priceWsConnected, setPriceWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Refs
  const wsRef = useRef(null);
  const priceWsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const priceReconnectTimerRef = useRef(null);

  // Constants
  const MAX_BUFFER_SIZE = 600; // 10 minutes @ 1 update/second

  // ========== LIFECYCLE ==========

  /**
   * Load available exchanges on mount
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
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnectWebSockets();
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (priceReconnectTimerRef.current) {
        clearTimeout(priceReconnectTimerRef.current);
      }
    };
  }, []);

  // ========== WEBSOCKET MANAGEMENT ==========

  /**
   * Connect Heatmap WebSocket
   * Receives orderbook snapshots
   */
  const connectHeatmapWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ Heatmap WebSocket already connected');
      return;
    }

    const wsSymbol = normalizeSymbol(symbol);
    const wsUrl = `${process.env.REACT_APP_API_URL.replace('http', 'ws')}/api/v1/orderbook-heatmap/ws/${wsSymbol}`;
    
    console.log('🔌 Connecting Heatmap WS:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Heatmap WS Connected');
        setWsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('📦 Heatmap WS Raw Message:', data);
          
          if (data.type === 'heatmap_update') {
            console.log('📊 Heatmap Update:', {
              symbol: data.symbol,
              timestamp: data.data?.timestamp,
              exchanges: data.data?.exchanges?.length,
              prices: data.data?.prices?.length,
              matrix: data.data?.matrix?.length,
              full_data: data.data
            });
            
            // Validate data structure
            if (!data.data) {
              console.error('❌ Missing data.data in heatmap update');
              return;
            }
            
            if (!data.data.prices || !Array.isArray(data.data.prices)) {
              console.error('❌ Missing or invalid data.data.prices');
              return;
            }
            
            if (!data.data.exchanges || !Array.isArray(data.data.exchanges)) {
              console.error('❌ Missing or invalid data.data.exchanges');
              return;
            }
            
            if (!data.data.matrix || !Array.isArray(data.data.matrix)) {
              console.error('❌ Missing or invalid data.data.matrix');
              return;
            }
            
            // Add to buffer (rolling window)
            setHeatmapBuffer((prev) => {
              const newBuffer = [...prev, data.data];
              
              console.log('📊 Buffer updated:', {
                old_size: prev.length,
                new_size: newBuffer.length,
                will_prune: newBuffer.length > MAX_BUFFER_SIZE
              });
              
              // Keep only last MAX_BUFFER_SIZE snapshots
              if (newBuffer.length > MAX_BUFFER_SIZE) {
                return newBuffer.slice(-MAX_BUFFER_SIZE);
              }
              
              return newBuffer;
            });
            
            // Update timestamp
            setLastUpdate(new Date());
            
            // Extract current price if included in heatmap data
            if (data.current_price) {
              setCurrentPrice(data.current_price);
              setPriceWsConnected(true); // Mark price as available
            }
          } else {
            console.warn('⚠️ Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('❌ Error parsing Heatmap WS message:', err);
          console.error('Raw event data:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Heatmap WS Error:', error);
        setWsConnected(false);
        setError('Heatmap WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('🔌 Heatmap WS Closed');
        setWsConnected(false);
        
        // Auto-reconnect if still running
        if (isRunning) {
          console.log('⏳ Reconnecting Heatmap WS in 3s...');
          reconnectTimerRef.current = setTimeout(() => {
            connectHeatmapWebSocket();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create Heatmap WS:', err);
      setError('Failed to connect Heatmap WebSocket');
    }
  }, [symbol, isRunning]);

  /**
   * Connect Price WebSocket
   * Receives live price updates
   */
  const connectPriceWebSocket = useCallback(() => {
    if (priceWsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ Price WebSocket already connected');
      return;
    }

    const wsSymbol = normalizeSymbol(symbol);
    const priceWsUrl = `${process.env.REACT_APP_API_URL.replace('http', 'ws')}/api/v1/orderbook-heatmap/ws/price/${wsSymbol}`;
    
    console.log('🔌 Connecting Price WS:', priceWsUrl);

    try {
      const ws = new WebSocket(priceWsUrl);

      ws.onopen = () => {
        console.log('✅ Price WS Connected');
        setPriceWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'price_update') {
            console.log('💰 Price Update:', data.price);
            setCurrentPrice(data.price);
            
            // Add to price history
            setPriceHistory((prev) => {
              const newHistory = [
                ...prev,
                {
                  price: data.price,
                  timestamp: data.timestamp || new Date().toISOString()
                }
              ];
              
              // Keep only last 600 points (same as heatmap buffer)
              if (newHistory.length > MAX_BUFFER_SIZE) {
                return newHistory.slice(-MAX_BUFFER_SIZE);
              }
              
              return newHistory;
            });
          }
        } catch (err) {
          console.error('Error parsing Price WS message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Price WS Error:', error);
        setPriceWsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 Price WS Closed');
        setPriceWsConnected(false);
        
        // Auto-reconnect if still running
        if (isRunning) {
          console.log('⏳ Reconnecting Price WS in 3s...');
          priceReconnectTimerRef.current = setTimeout(() => {
            connectPriceWebSocket();
          }, 3000);
        }
      };

      priceWsRef.current = ws;
    } catch (err) {
      console.error('Failed to create Price WS:', err);
      // Don't set error - price WS is optional
      console.warn('Price WebSocket unavailable, continuing without live price');
    }
  }, [symbol, isRunning]);

  /**
   * Disconnect both WebSockets
   */
  const disconnectWebSockets = useCallback(() => {
    console.log('🔌 Disconnecting WebSockets...');
    
    // Clear reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (priceReconnectTimerRef.current) {
      clearTimeout(priceReconnectTimerRef.current);
      priceReconnectTimerRef.current = null;
    }

    // Close Heatmap WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close Price WebSocket
    if (priceWsRef.current) {
      priceWsRef.current.close();
      priceWsRef.current = null;
    }

    setWsConnected(false);
    setPriceWsConnected(false);
    
    console.log('✅ WebSockets disconnected');
  }, []);

  // ========== API ACTIONS ==========

  /**
   * Start Heatmap
   */
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHeatmapBuffer([]); // Clear buffer
    setCurrentPrice(null); // Reset price
    setPriceHistory([]); // Clear price history

    try {
      console.log('🚀 Starting Heatmap:', {
        symbol,
        exchanges: selectedExchanges,
        priceBucketSize,
        timeWindowSeconds,
      });

      const result = await startHeatmap({
        symbol,
        exchanges: selectedExchanges,
        price_bucket_size: priceBucketSize,
        time_window_seconds: timeWindowSeconds,
      });

      console.log('✅ Heatmap started:', result);
      setIsRunning(true);
      
      // Connect WebSockets
      connectHeatmapWebSocket();
      connectPriceWebSocket();

    } catch (err) {
      console.error('Failed to start heatmap:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start heatmap');
    } finally {
      setIsLoading(false);
    }
  }, [
    symbol,
    selectedExchanges,
    priceBucketSize,
    timeWindowSeconds,
    connectHeatmapWebSocket,
    connectPriceWebSocket,
  ]);

  /**
   * Stop Heatmap
   */
  const handleStop = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🛑 Stopping Heatmap...');
      
      await stopHeatmap();
      console.log('✅ Heatmap stopped');
      
      setIsRunning(false);
      disconnectWebSockets();
      setHeatmapBuffer([]);
      setCurrentPrice(null);
      setPriceHistory([]);

    } catch (err) {
      console.error('Failed to stop heatmap:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to stop heatmap');
    } finally {
      setIsLoading(false);
    }
  }, [disconnectWebSockets]);

  /**
   * Fetch Current Status
   */
  const fetchStatus = useCallback(async () => {
    try {
      const result = await getStatus();
      setStatus(result);
      setIsRunning(result.is_running || false);
      
      console.log('📊 Status:', result);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  // ========== RETURN ==========

  return {
    // Configuration
    exchanges,
    selectedExchanges,
    symbol,
    priceBucketSize,
    timeWindowSeconds,
    
    // Data
    heatmapBuffer,
    currentPrice,
    priceHistory,
    status,
    
    // UI State
    isRunning,
    isLoading,
    error,
    
    // WebSocket State
    wsConnected,
    priceWsConnected,
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
