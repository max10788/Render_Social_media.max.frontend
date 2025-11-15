// TEMPORARY FIX - Debugging für zirkuläre Imports
console.log('🔍 Index.js wird ausgeführt');

// Teste jeden Import einzeln
try {
  console.log('📦 Teste React Import...');
  const React = require('react');
  console.log('✅ React OK');
} catch (e) {
  console.error('❌ React Error:', e);
}

try {
  console.log('📦 Teste ReactDOM Import...');
  const ReactDOM = require('react-dom/client');
  console.log('✅ ReactDOM OK');
} catch (e) {
  console.error('❌ ReactDOM Error:', e);
}

try {
  console.log('📦 Teste index.css Import...');
  require('./index.css');
  console.log('✅ index.css OK');
} catch (e) {
  console.error('❌ index.css Error:', e);
}

try {
  console.log('📦 Teste socket.js Import...');
  const { initSocket } = require('./socket');
  console.log('✅ socket.js OK');
} catch (e) {
  console.error('❌ socket.js Error:', e);
}

try {
  console.log('📦 Teste reportWebVitals Import...');
  const reportWebVitals = require('./reportWebVitals');
  console.log('✅ reportWebVitals OK');
} catch (e) {
  console.error('❌ reportWebVitals Error:', e);
}

try {
  console.log('📦 Teste App.js Import...');
  const App = require('./App');
  console.log('✅ App.js OK');
} catch (e) {
  console.error('❌ App.js Error:', e);
  console.error('Stack:', e.stack);
}

// Original Code
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initSocket } from './socket';

console.log('🚀 Index.js wird geladen');
console.log('✅ Alle Imports erfolgreich geladen');

// Konfigurationsobjekt für Umgebungsvariablen
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend.onrender.com',
  wsUrl: process.env.REACT_APP_WS_URL || 'wss://render-social-media-max-backend.onrender.com/ws',
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
