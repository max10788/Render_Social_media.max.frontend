// src/services/candleService.js
import { API_BASE_URL } from '../config/api';

export const getCandleData = async ({ exchange, symbol, timeframe, startTime, endTime }) => {
  try {
    const params = new URLSearchParams({
      exchange,
      symbol,
      timeframe,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    });

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chart/candles?${params}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candles || [];
  } catch (error) {
    console.error('Error fetching candle data:', error);
    throw error;
  }
};
