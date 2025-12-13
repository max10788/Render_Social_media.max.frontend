import { API_BASE_URL } from '../config/api';

export const getCandleData = async ({ exchange, symbol, timeframe, startTime, endTime }) => {
  try {
    const params = new URLSearchParams({
      exchange,
      symbol,
      timeframe,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      include_impact: 'false'
    });

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chart/candles?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('🔍 Backend Response:', data);
    console.log('🔍 Is Array?', Array.isArray(data));
    
    // Backend gibt direkt ein Array zurück, NICHT {candles: [...]}
    const candlesArray = Array.isArray(data) ? data : (data.candles || []);
    
    return {
      candles: candlesArray,
      warning: data.warning || null,
      isSynthetic: candlesArray[0]?.is_synthetic || false
    };
  } catch (error) {
    console.error('❌ Error fetching candle data:', error);
    throw error;
  }
};

export const getAvailableTimeframes = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/chart/timeframes`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.timeframes || [];
  } catch (error) {
    console.error('Error fetching timeframes:', error);
    return [
      { value: '1m', label: '1 Minute', seconds: 60 },
      { value: '5m', label: '5 Minutes', seconds: 300 },
      { value: '15m', label: '15 Minutes', seconds: 900 },
      { value: '1h', label: '1 Hour', seconds: 3600 }
    ];
  }
};

export const getAvailableSymbols = async (exchange) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/chart/symbols?exchange=${exchange}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.symbols || [];
  } catch (error) {
    console.error('Error fetching symbols:', error);
    return [];
  }
};

export default {
  getCandleData,
  getAvailableTimeframes,
  getAvailableSymbols
};
