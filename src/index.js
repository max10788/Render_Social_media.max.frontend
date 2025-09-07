// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initSocket } from './socket';
import reportWebVitals from './reportWebVitals';

// Konfigurationsobjekt für Umgebungsvariablen
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend.onrender.com',
  wsUrl: process.env.REACT_APP_WS_URL || 'wss://render-social-media-max-backend.onrender.com/ws',
  environment: process.env.REACT_APP_ENVIRONMENT || 'production',
  ethereumRpcUrl: process.env.REACT_APP_ETHEREUM_RPC_URL,
  solanaRpcUrl: process.env.REACT_APP_SOLANA_RPC_URL,
  suiRpcUrl: process.env.REACT_APP_SUI_RPC_URL,
};

// Protokolliere die Konfiguration zur Diagnose (nur in Entwicklung)
if (config.environment === 'development') {
  console.log('App Configuration:', {
    apiUrl: config.apiUrl,
    wsUrl: config.wsUrl,
    environment: config.environment,
    // RPC-URLs nicht vollständig loggen (Sicherheit)
    ethereumRpc: config.ethereumRpcUrl ? 'Configured' : 'Missing',
    solanaRpc: config.solanaRpcUrl ? 'Configured' : 'Missing',
    suiRpc: config.suiRpcUrl ? 'Configured' : 'Missing',
  });
}

// Ignoriere den Ethereum-Fehler, falls er auftritt
if (window.ethereum) {
  try {
    // Ethereum-bezogener Code hier
    console.log('Ethereum provider detected');
  } catch (error) {
    if (error.message && error.message.includes('Cannot redefine property: ethereum')) {
      console.warn('Ethereum property redefinition error ignored');
    } else {
      console.error('Ethereum error:', error);
    }
  }
}

// Globale Konfiguration für die gesamte App verfügbar machen
window.appConfig = config;

// Initialize WebSocket connection
const socket = initSocket();

// Log socket connection status
socket.on('connected', () => {
  console.log('🔌 WebSocket connected successfully');
});
socket.on('disconnected', () => {
  console.log('🔌 WebSocket disconnected');
});
socket.on('error', (error) => {
  console.error('🔌 WebSocket error:', error);
});
socket.on('message', (data) => {
  console.log('🔌 WebSocket message received:', data);
});

// React-App rendern
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (socket) {
    socket.disconnect();
  }
});

reportWebVitals();
