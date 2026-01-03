import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 
  'wss://render-social-media-max-backend-m1un.onrender.com';
/**
 * Custom hook for OTC WebSocket connection (Native WebSocket)
 * 
 * ✅ REWRITTEN: Socket.IO → Native WebSocket API
 * - Connection: ws://localhost:5000/ws/otc/live
 * - Messages: JSON { type, event, data }
 * - Manual reconnection logic
 */
export const useOTCWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    // Don't connect if already connected
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected to WebSocket');
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('🔌 Connecting to WebSocket:', `${WS_URL}/ws/otc/live`);
    
    try {
      socketRef.current = new WebSocket(`${WS_URL}/ws/otc/live`);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      // Retry after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => connect(), 5000);
      return;
    }

    /**
     * Handle connection opened
     */
    socketRef.current.onopen = () => {
      console.log('✅ OTC WebSocket connected');
      setIsConnected(true);
      
      // Subscribe to all OTC events
      try {
        socketRef.current.send(JSON.stringify({
          type: 'subscribe',
          events: ['new_large_transfer', 'cluster_activity', 'desk_interaction']
        }));
        console.log('📡 Subscription request sent');
      } catch (error) {
        console.error('Failed to send subscription:', error);
      }
    };

    /**
     * Handle connection closed
     */
    socketRef.current.onclose = (event) => {
      console.log('❌ OTC WebSocket disconnected:', {
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean
      });
      setIsConnected(false);
      
      // Auto-reconnect after 5 seconds (unless manually closed)
      if (event.code !== 1000) { // 1000 = normal closure
        console.log('🔄 Reconnecting in 5 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => connect(), 5000);
      }
    };

    /**
     * Handle errors
     */
    socketRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      // Error will trigger onclose, which handles reconnection
    };

    /**
     * Handle incoming messages
     */
    socketRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Route by event type
        if (message.event === 'new_large_transfer') {
          console.log('🔔 New large transfer:', message.data);
          
          const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'new_large_transfer',
            severity: message.data.usd_value > 5000000 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            data: message.data
          };

          setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
          setRecentTransfers(prev => [message.data, ...prev].slice(0, 20)); // Keep last 20 transfers
        }
        
        else if (message.event === 'cluster_activity') {
          console.log('🔗 Cluster activity:', message.data);
          
          const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'cluster_activity',
            severity: 'medium',
            timestamp: new Date().toISOString(),
            data: message.data
          };

          setAlerts(prev => [alert, ...prev].slice(0, 50));
        }
        
        else if (message.event === 'desk_interaction') {
          console.log('🏦 Desk interaction:', message.data);
          
          const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'desk_interaction',
            severity: message.data.confidence_score > 80 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            data: message.data
          };

          setAlerts(prev => [alert, ...prev].slice(0, 50));
        }
        
        else if (message.type === 'connection') {
          console.log('📡 Connection message:', message.message);
        }
        
        else if (message.type === 'subscription_confirmed') {
          console.log('✅ Subscription confirmed:', message.events);
        }
        
        else if (message.type === 'pong') {
          // Heartbeat response
          console.log('💓 Pong received');
        }
        
        else {
          console.log('📨 Unknown message type:', message);
        }
        
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
      }
    };
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close socket
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Client disconnect'); // Normal closure
      }
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Subscribe to specific wallet alerts
   * Note: Backend doesn't support wallet-specific subscriptions yet
   */
  const subscribeToWallet = useCallback((address) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log(`📍 Subscribed to wallet: ${address}`);
      // Future implementation when backend supports it:
      // socketRef.current.send(JSON.stringify({
      //   type: 'subscribe_wallet',
      //   address: address
      // }));
    } else {
      console.warn('Cannot subscribe to wallet: WebSocket not connected');
    }
  }, []);

  /**
   * Unsubscribe from wallet alerts
   */
  const unsubscribeFromWallet = useCallback((address) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log(`📍 Unsubscribed from wallet: ${address}`);
      // Future implementation when backend supports it:
      // socketRef.current.send(JSON.stringify({
      //   type: 'unsubscribe_wallet',
      //   address: address
      // }));
    } else {
      console.warn('Cannot unsubscribe from wallet: WebSocket not connected');
    }
  }, []);

  /**
   * Clear all alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    console.log('🧹 Alerts cleared');
  }, []);

  /**
   * Dismiss specific alert
   */
  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    console.log('🗑️ Alert dismissed:', alertId);
  }, []);

  /**
   * Send ping to keep connection alive
   */
  const sendPing = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
        console.log('💓 Ping sent');
      } catch (error) {
        console.error('Failed to send ping:', error);
      }
    }
  }, []);

  /**
   * Connect on mount, disconnect on unmount
   */
  useEffect(() => {
    connect();
    
    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      sendPing();
    }, 30000);
    
    return () => {
      clearInterval(pingInterval);
      disconnect();
    };
  }, [connect, disconnect, sendPing]);

  return {
    isConnected,
    alerts,
    recentTransfers,
    connect,
    disconnect,
    subscribeToWallet,
    unsubscribeFromWallet,
    clearAlerts,
    dismissAlert,
    sendPing
  };
};

export default useOTCWebSocket;
