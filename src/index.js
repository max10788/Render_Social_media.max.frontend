import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Konfigurationsobjekt für Umgebungsvariablen
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  wsUrl: process.env.REACT_APP_WS_URL,
  environment: process.env.REACT_APP_ENVIRONMENT,
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
