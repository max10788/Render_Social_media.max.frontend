// src/websocket/WebSocketClient.js
/**
 * WebSocket Client - DEAKTIVIERT für normale Nutzung
 * Verbindet sich NICHT automatisch
 * 
 * Kann manuell aktiviert werden wenn benötigt
 */

import { WS_CONFIG } from '../config/websocket';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.isConnecting = false;
    this.shouldReconnect = false;
    
    console.log('📡 WebSocket Client initialized (DISABLED - no auto-connect)');
  }

  /**
   * Verbindet WebSocket nur wenn explizit aufgerufen
   * ACHTUNG: Für Wallet Analyses NICHT benötigt!
   */
  connect(channel = '') {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return Promise.resolve();
    }

    if (this.isConnecting) {
      console.log('⏳ WebSocket connection already in progress');
      return Promise.resolve();
    }

    if (!WS_CONFIG.ENABLED) {
      console.warn('⚠️ WebSocket ist deaktiviert. Falls benötigt, setze WS_CONFIG.ENABLED = true');
      return Promise.reject(new Error('WebSocket disabled'));
    }

    console.log('🔌 Connecting to WebSocket:', WS_CONFIG.URL);
    this.isConnecting = true;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      try {
        // Verwende konfigurierte URL statt window.location.host
        const wsUrl = channel ? `${WS_CONFIG.URL}/${channel}` : WS_CONFIG.URL;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('open');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.emit('close');
          
          if (this.shouldReconnect && WS_CONFIG.RECONNECT.enabled) {
            this.attemptReconnect(channel);
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  attemptReconnect(channel) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const delay = Math.min(
        this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
        30000
      );
      
      setTimeout(() => {
        console.log(`⏳ Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(channel).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.shouldReconnect = false;
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    console.warn('⚠️ WebSocket not connected, message not sent');
    return false;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  onOpen(callback) {
    this.on('open', callback);
  }

  onMessage(callback) {
    this.on('message', callback);
  }

  onClose(callback) {
    this.on('close', callback);
  }

  onError(callback) {
    this.on('error', callback);
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Singleton-Instanz (verbindet sich NICHT automatisch)
const wsClient = new WebSocketClient();

// WICHTIG: Komponenten müssen explizit wsClient.connect() aufrufen
// Für Wallet Analyses ist dies NICHT notwendig!

export default wsClient;
