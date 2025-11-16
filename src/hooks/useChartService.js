/**
 * useChartService Hook
 * 
 * React Hook für Chart-Funktionalität
 * Verwendet chartService für API-Calls
 */
import { useState, useCallback } from 'react';
import { 
  calculateTimeWindow, 
  fetchChartCandles, 
  fetchCandleMovers,
  batchAnalyzeCandles,
  analyzeMultipleCandles,
  prepareMultiCandleAnalysis,
  validateSelectionParams,
  formatCandlesForChart,
} from '../services/chartService';

export const useChartService = () => {
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  /**
   * Load chart data for given exchange/symbol/timeframe
   */
  const loadChartData = useCallback(async ({ exchange, symbol, timeframe, candleCount = 100 }) => {
    setChartLoading(true);
    setChartError(null);
    
    try {
      console.log('📊 Loading chart data:', { exchange, symbol, timeframe });
      
      // Calculate time window (returns Date objects)
      const { start_time, end_time } = calculateTimeWindow(timeframe, candleCount);
      
      // Fetch candles
      const response = await fetchChartCandles({
        exchange,
        symbol,
        timeframe,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
        include_impact: true,
      });
      
      console.log('✅ Chart data loaded:', {
        candlesCount: response.candles?.length || 0,
      });
      
      // Format candles for chart
      const formattedCandles = formatCandlesForChart(response.candles || []);
      setChartData(formattedCandles);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error loading chart data:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load chart data';
      setChartError(errorMessage);
      throw error;
    } finally {
      setChartLoading(false);
    }
  }, []);

  /**
   * Load movers for a specific candle
   */
  const loadCandleMovers = useCallback(async (timestamp, params) => {
    try {
      console.log('🎯 Loading candle movers:', { timestamp, params });
      
      const response = await fetchCandleMovers(timestamp, params);
      
      console.log('✅ Candle movers loaded:', {
        moversCount: response.top_movers?.length || 0,
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Error loading candle movers:', error);
      throw error;
    }
  }, []);

  /**
   * Batch analyze multiple candles
   */
  const batchAnalyze = useCallback(async (params) => {
    try {
      console.log('📊 Batch analyzing candles:', params);
      
      const response = await batchAnalyzeCandles(params);
      
      console.log('✅ Batch analysis complete:', {
        successful: response.successful_analyses,
        failed: response.failed_analyses,
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Error in batch analysis:', error);
      throw error;
    }
  }, []);

  /**
   * Analyze multiple candles (wrapper for batchAnalyzeCandles)
   */
  const analyzeMultiple = useCallback(async (params) => {
    try {
      console.log('🎯 Analyzing multiple candles:', params);
      
      const response = await analyzeMultipleCandles(params);
      
      console.log('✅ Multi-candle analysis complete:', response);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error in multi-candle analysis:', error);
      throw error;
    }
  }, []);

  /**
   * Prepare multi-candle analysis with lookback
   */
  const prepareMultiAnalysis = useCallback((selectedCandles, allCandles, config) => {
    try {
      console.log('🔧 Preparing multi-candle analysis:', {
        selectedCount: selectedCandles?.length,
        allCount: allCandles?.length,
        config,
      });
      
      const prepared = prepareMultiCandleAnalysis(selectedCandles, allCandles, config);
      
      console.log('✅ Multi-candle analysis prepared:', prepared);
      
      return prepared;
      
    } catch (error) {
      console.error('❌ Error preparing multi-candle analysis:', error);
      throw error;
    }
  }, []);

  /**
   * Validate selection parameters
   */
  const validateSelection = useCallback((selectedCandles, config) => {
    return validateSelectionParams(selectedCandles, config);
  }, []);

  /**
   * Reset chart state
   */
  const resetChart = useCallback(() => {
    setChartData(null);
    setChartError(null);
    setChartLoading(false);
  }, []);

  return {
    // State
    chartData,
    chartLoading,
    chartError,
    
    // Functions
    loadChartData,
    loadCandleMovers,
    batchAnalyze,
    analyzeMultiple,
    prepareMultiAnalysis,
    validateSelection,
    resetChart,
  };
};

export default useChartService;
