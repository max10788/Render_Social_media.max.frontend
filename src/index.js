// Original Imports MÜSSEN ZUERST kommen (ESLint-Regel)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initSocket } from './socket';

// DEBUGGING - Nach den Imports
console.log('🔍 Index.js - Alle Imports geladen');

console.log('🚀 Index.js wird geladen');
console.log('✅ Alle Imports erfolgreich geladen');

// Konfigurationsobjekt für Umgebungsvariablen
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend-m1un.onrender.com', // ✅ HIER!
  wsUrl: process.env.REACT_APP_WS_URL || 'wss://render-social-media-max-backend-m1un.onrender.com/ws/otc',
  environment: process.env.REACT_APP_ENVIRONMENT || 'production',
  ethereumRpcUrl: process.env.REACT_APP_ETHEREUM_RPC_URL,
  solanaRpcUrl: process.env.REACT_APP_SOLANA_RPC_URL,
  suiRpcUrl: process.env.REACT_APP_SUI_RPC_URL,
};

console.log('⚙️ Config erstellt:', config.environment);

// Protokolliere die Konfiguration zur Diagnose (nur in Entwicklung)
if (config.environment === 'development') {
  console.log('App Configuration:', {
    apiUrl: config.apiUrl,
    wsUrl: config.wsUrl,
    environment: config.environment,
    ethereumRpc: config.ethereumRpcUrl ? 'Configured' : 'Missing',
    solanaRpc: config.solanaRpcUrl ? 'Configured' : 'Missing',
    suiRpc: config.suiRpcUrl ? 'Configured' : 'Missing',
  });
}

// Ignoriere den Ethereum-Fehler, falls er auftritt
if (window.ethereum) {
  try {
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

console.log('🔌 Initialisiere WebSocket...');

// Initialize WebSocket connection
let socketInstance = null;
try {
  socketInstance = initSocket();
  console.log('✅ WebSocket initialisiert');
  
  // Log socket connection status
  if (socketInstance) {
    socketInstance.on('connected', () => {
      console.log('🔌 WebSocket connected successfully');
    });
    
    socketInstance.on('disconnected', () => {
      console.log('🔌 WebSocket disconnected');
    });
    
    socketInstance.on('error', (error) => {
      console.error('🔌 WebSocket error:', error);
    });
    
    socketInstance.on('message', (data) => {
      console.log('🔌 WebSocket message received:', data);
    });
  }
} catch (error) {
  console.error('❌ WebSocket Initialisierung fehlgeschlagen:', error);
}

console.log('📦 Rendere React App...');

// React-App rendern
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ React App gerendert');
} catch (error) {
  console.error('❌ React Render Error:', error);
  console.error('Stack:', error.stack);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (socketInstance) {
    console.log('🔌 Schließe WebSocket-Verbindung...');
    socketInstance.disconnect();
  }
});

reportWebVitals();
