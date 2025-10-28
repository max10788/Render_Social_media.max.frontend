/**
 * Price Movers API Service
 * 
 * Service für die Kommunikation mit der Price Movers Backend API
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api/v1`;

/**
 * Analysiert Price Movers für eine bestimmte Candle
 */
export const analyzePriceMovers = async (params) => {
  try {
    const response = await axios.post(`${API_URL}/analyze/price-movers`, params);
    return response.data;
  } catch (error) {
    console.error('Price Movers Analysis Error:', error);
    throw error;
  }
};

/**
 * Schnellanalyse der aktuellen/letzten Candle
 */
export const quickAnalysis = async (params) => {
  try {
    const response = await axios.post(`${API_URL}/analyze/quick`, params);
    return response.data;
  } catch (error) {
    console.error('Quick Analysis Error:', error);
    throw error;
  }
};

/**
 * Historische Analyse über mehrere Candles
 */
export const historicalAnalysis = async (params) => {
  try {
    const response = await axios.post(`${API_URL}/analyze/historical`, params);
    return response.data;
  } catch (error) {
    console.error('Historical Analysis Error:', error);
    throw error;
  }
};

/**
 * Wallet Details abrufen
 */
export const getWalletDetails = async (walletId, exchange, symbol = null, timeRangeHours = 24) => {
  try {
    const params = { exchange };
    if (symbol) params.symbol = symbol;
    if (timeRangeHours) params.time_range_hours = timeRangeHours;

    const response = await axios.get(`${API_URL}/wallet/${walletId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Wallet Lookup Error:', error);
    throw error;
  }
};

/**
 * Exchange-Vergleich
 */
export const compareExchanges = async (params) => {
  try {
    const response = await axios.post(`${API_URL}/compare-exchanges`, params);
    return response.data;
  } catch (error) {
    console.error('Exchange Comparison Error:', error);
    throw error;
  }
};

/**
 * Health Check
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Health Check Error:', error);
    throw error;
  }
};

export default {
  analyzePriceMovers,
  quickAnalysis,
  historicalAnalysis,
  getWalletDetails,
  compareExchanges,
  checkHealth,
};
