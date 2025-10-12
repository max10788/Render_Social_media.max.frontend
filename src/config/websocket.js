// src/config/websocket.js
/**
 * WebSocket-Konfiguration - DEAKTIVIERT für Wallet Analyses
 * WebSocket wird nur bei Bedarf manuell verbunden
 */

// API URL aus Environment (ohne /ws Pfad)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// WebSocket URL ableiten (nur wenn explizit benötigt)
const getWebSocketUrl = () => {
  // Wenn WS_URL explizit gesetzt ist
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }

  // Konvertiere API URL zu WebSocket URL
  const wsUrl = API_URL
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');
  
  return `${wsUrl}/ws`;
};

export const WS_CONFIG = {
  // WebSocket URL (wird nicht automatisch verwendet)
  URL: getWebSocketUrl(),
  
  // WebSocket Features (alles deaktiviert für Wallet Analyses)
  ENABLED: false,
  AUTO_CONNECT: false,
  
  // Reconnection-Einstellungen
  RECONNECT: {
    enabled: false, // WICHTIG: Deaktiviert!
    maxAttempts: 5,
    delay: 3000,
    backoffMultiplier: 1.5,
    maxDelay: 30000
  },
  
  // Timeout-Einstellungen
  TIMEOUT: {
    connection: 10000,
    response: 5000
  }
};

// Debug-Log (nur in Entwicklung)
if (process.env.NODE_ENV === 'development') {
  console.log('🔌 WebSocket Config (DISABLED):', {
    enabled: WS_CONFIG.ENABLED,
    url: WS_CONFIG.URL,
    apiUrl: API_URL
  });
}

// Nur URL exportieren (keine automatische Verbindung)
export default WS_CONFIG.URL;
