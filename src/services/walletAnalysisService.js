// src/services/walletAnalysisService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WALLET_API_BASE = `${API_BASE_URL}/api/v1/wallet`;

// Axios-Instanz mit Standard-Konfiguration
const walletApi = axios.create({
  baseURL: WALLET_API_BASE,
  timeout: 60000, // 60 Sekunden für längere Analysen
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor für Auth-Token
walletApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor für Error Handling
walletApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token abgelaufen - Logout
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Analysiert eine einzelne Wallet
 * @param {Object} params - Analyse-Parameter
 * @param {string} [params.wallet_address] - Wallet-Adresse
 * @param {Array} [params.transactions] - Transaktionen (optional)
 * @param {string} [params.blockchain] - Blockchain (ethereum, solana, sui)
 * @param {number} [params.stage=1] - Analyse-Stage (1-3)
 * @param {number} [params.fetch_limit=100] - Max. Transaktionen
 * @returns {Promise<Object>} Analyse-Ergebnis
 */
export const analyzeWallet = async ({
  wallet_address,
  transactions = null,
  blockchain,
  stage = 1,
  fetch_limit = 100,
}) => {
  try {
    const payload = {
      wallet_address,
      blockchain,
      stage,
      fetch_limit,
    };

    // Nur Transaktionen hinzufügen, wenn vorhanden
    if (transactions && transactions.length > 0) {
      payload.transactions = transactions;
    }

    const response = await walletApi.post('/analyze', payload);
    return response.data;
  } catch (error) {
    console.error('Wallet-Analyse fehlgeschlagen:', error);
    throw formatError(error);
  }
};

/**
 * Holt Top-N wahrscheinlichste Wallet-Typen
 * @param {Object} params - Parameter
 * @param {string} [params.wallet_address] - Wallet-Adresse
 * @param {Array} [params.transactions] - Transaktionen (optional)
 * @param {string} [params.blockchain] - Blockchain
 * @param {number} [params.stage=1] - Analyse-Stage
 * @param {number} [params.top_n=3] - Anzahl Top-Matches
 * @param {number} [params.fetch_limit=100] - Max. Transaktionen
 * @returns {Promise<Object>} Top-Matches
 */
export const getTopMatches = async ({
  wallet_address,
  transactions = null,
  blockchain,
  stage = 1,
  top_n = 3,
  fetch_limit = 100,
}) => {
  try {
    const payload = {
      wallet_address,
      blockchain,
      stage,
      top_n,
      fetch_limit,
    };

    if (transactions && transactions.length > 0) {
      payload.transactions = transactions;
    }

    const response = await walletApi.post('/analyze/top-matches', payload);
    return response.data;
  } catch (error) {
    console.error('Top-Matches Abruf fehlgeschlagen:', error);
    throw formatError(error);
  }
};

/**
 * Analysiert mehrere Wallets gleichzeitig
 * @param {Object} params - Parameter
 * @param {Array<Object>} params.wallets - Wallet-Array
 * @param {number} [params.stage=1] - Analyse-Stage
 * @param {number} [params.fetch_limit=100] - Max. Transaktionen
 * @returns {Promise<Object>} Batch-Ergebnis
 */
export const batchAnalyzeWallets = async ({
  wallets,
  stage = 1,
  fetch_limit = 100,
}) => {
  try {
    const response = await walletApi.post('/analyze/batch', {
      wallets,
      stage,
      fetch_limit,
    });
    return response.data;
  } catch (error) {
    console.error('Batch-Analyse fehlgeschlagen:', error);
    throw formatError(error);
  }
};

/**
 * Health-Check des Wallet-Services
 * @returns {Promise<Object>} Health-Status
 */
export const checkWalletServiceHealth = async () => {
  try {
    const response = await walletApi.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health-Check fehlgeschlagen:', error);
    throw formatError(error);
  }
};

/**
 * Holt Wallet-Metadaten (Balance, First/Last Transaction)
 * @param {Object} params - Parameter
 * @param {string} params.wallet_address - Wallet-Adresse
 * @param {string} params.blockchain - Blockchain (ethereum, solana, sui)
 * @returns {Promise<Object>} Metadata-Ergebnis
 */
export const getWalletMetadata = async ({
  wallet_address,
  blockchain,
}) => {
  try {
    const response = await walletApi.get('/metadata', {
      params: {
        wallet_address,
        blockchain,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Wallet-Metadaten Abruf fehlgeschlagen:', error);
    throw formatError(error);
  }
};

/**
 * Formatiert Fehler für einheitliche Darstellung
 * @param {Error} error - Axios-Fehler
 * @returns {Object} Formatierter Fehler
 */
const formatError = (error) => {
  if (error.response) {
    // Server hat mit Fehlercode geantwortet
    const { data, status } = error.response;
    return {
      success: false,
      error: data?.error || 'Server-Fehler',
      error_code: data?.error_code || 'UNKNOWN_ERROR',
      details: data?.details,
      hint: data?.hint,
      status,
    };
  } else if (error.request) {
    // Request wurde gesendet, aber keine Antwort erhalten
    return {
      success: false,
      error: 'Keine Antwort vom Server',
      error_code: 'NO_RESPONSE',
      details: 'Der Server antwortet nicht. Bitte prüfen Sie Ihre Verbindung.',
    };
  } else {
    // Fehler beim Setup des Requests
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler',
      error_code: 'REQUEST_SETUP_ERROR',
    };
  }
};

/**
 * Validiert Wallet-Adresse basierend auf Blockchain
 * @param {string} address - Wallet-Adresse
 * @param {string} blockchain - Blockchain-Name
 * @returns {boolean} Ist gültig
 */
export const isValidWalletAddress = (address, blockchain) => {
  if (!address || !blockchain) return false;

  const blockchainLower = blockchain.toLowerCase();

  // Ethereum/EVM-Adressen
  if (blockchainLower === 'ethereum' || blockchainLower === 'eth') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Solana-Adressen
  if (blockchainLower === 'solana' || blockchainLower === 'sol') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  // Sui-Adressen
  if (blockchainLower === 'sui') {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }

  return false;
};

/**
 * Maskiert Wallet-Adresse für Anzeige
 * @param {string} address - Wallet-Adresse
 * @param {number} [prefixLength=6] - Länge des Präfix
 * @param {number} [suffixLength=4] - Länge des Suffix
 * @returns {string} Maskierte Adresse
 */
export const maskWalletAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address || 'N/A';
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Formatiert Confidence-Score für Anzeige
 * @param {number} confidence - Confidence-Wert (0-1)
 * @returns {string} Formatierter String mit %
 */
export const formatConfidence = (confidence) => {
  if (confidence === null || confidence === undefined) return 'N/A';
  return `${(confidence * 100).toFixed(2)}%`;
};

/**
 * Gibt Farbe basierend auf Confidence zurück
 * @param {number} confidence - Confidence-Wert (0-1)
 * @returns {string} CSS-Farbe
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return '#4caf50'; // Grün
  if (confidence >= 0.6) return '#ff9800'; // Orange
  if (confidence >= 0.4) return '#ff5722'; // Rot-Orange
  return '#f44336'; // Rot
};
