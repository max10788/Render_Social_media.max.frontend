import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

/**
 * Custom hook for OTC WebSocket connection
 */
export const useOTCWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const socketRef = useRef(null);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(`${WS_URL}/otc`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socketRef.current.on('connect', () => {
      console.log('✅ OTC WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ OTC WebSocket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for new large transfers
    socketRef.current.on('new_large_transfer', (data) => {
      console.log('🔔 New large transfer:', data);
      
      const alert = {
        id: `alert_${Date.now()}`,
        type: 'new_large_transfer',
        severity: data.usd_value > 5000000 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        data
      };

      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
      setRecentTransfers(prev => [data, ...prev].slice(0, 20)); // Keep last 20 transfers
    });

    // Listen for cluster activity
    socketRef.current.on('cluster_activity', (data) => {
      console.log('🔗 Cluster activity:', data);
      
      const alert = {
        id: `alert_${Date.now()}`,
        type: 'cluster_activity',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        data
      };

      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    // Listen for desk interactions
    socketRef.current.on('desk_interaction', (data) => {
      console.log('🏦 Desk interaction:', data);
      
      const alert = {
        id: `alert_${Date.now()}`,
        type: 'desk_interaction',
        severity: data.confidence_score > 80 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        data
      };

      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Subscribe to specific wallet alerts
   */
  const subscribeToWallet = useCallback((address) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_wallet', { address });
      console.log(`📍 Subscribed to wallet: ${address}`);
    }
  }, []);

  /**
   * Unsubscribe from wallet alerts
   */
  const unsubscribeFromWallet = useCallback((address) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_wallet', { address });
      console.log(`📍 Unsubscribed from wallet: ${address}`);
    }
  }, []);

  /**
   * Clear all alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Dismiss specific alert
   */
  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  /**
   * Connect on mount, disconnect on unmount
   */
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    alerts,
    recentTransfers,
    connect,
    disconnect,
    subscribeToWallet,
    unsubscribeFromWallet,
    clearAlerts,
    dismissAlert
  };
};

export default useOTCWebSocket;
