/**
 * useChartService Hook
 * 
 * Kapselt alle Chart Service Calls in einem Hook
 * Verhindert zirkuläre Imports in Components
 */
import { useState, useCallback } from 'react';
import { 
  fetchChartCandles, 
  fetchCandleMovers, 
  calculateTimeWindow 
} from '../services/chartService';

export const useChartService = () => {
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  /**
   * Lädt Chart Candles
   */
  const loadChartData = useCallback(async (params) => {
    setChartLoading(true);
    setChartError(null);
    
    try {
      const { start_time, end_time } = calculateTimeWindow(params.timeframe, 100);
      
      const response = await fetchChartCandles({
        exchange: params.exchange,
        symbol: params.symbol,
        timeframe: params.timeframe,
        start_time,
        end_time,
        include_impact: false,
      });
      
      setChartData(response.candles || []);
      return response.candles || [];
    } catch (err) {
      console.error('Error loading chart data:', err);
      const errorMessage = err.message || 'Failed to load chart data';
      setChartError(errorMessage);
      throw err;
    } finally {
      setChartLoading(false);
    }
  }, []);

  /**
   * Lädt Candle Movers
   */
  const loadCandleMovers = useCallback(async (timestamp, params) => {
    try {
      const response = await fetchCandleMovers(timestamp, {
        exchange: params.exchange,
        symbol: params.symbol,
        timeframe: params.timeframe,
        top_n_wallets: params.topNWallets || 10,
      });
      
      return response;
    } catch (err) {
      console.error('Error loading candle movers:', err);
      throw err;
    }
  }, []);

  /**
   * Reset State
   */
  const reset = useCallback(() => {
    setChartData([]);
    setChartLoading(false);
    setChartError(null);
  }, []);

  return {
    chartData,
    chartLoading,
    chartError,
    loadChartData,
    loadCandleMovers,
    reset,
  };
};

export default useChartService;
