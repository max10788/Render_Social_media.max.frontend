/**
 * useChartService Hook - ENHANCED with DEX Hybrid Support
 * 
 * React Hook für Chart-Funktionalität
 * Verwendet chartService für API-Calls
 * 
 * ✅ DEX Hybrid: 99 CEX Historical + 1 DEX Current
 * ✅ Data Source Tracking
 * ✅ Warning Messages
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
  isDEX,
} from '../services/chartService';

export const useChartService = () => {
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  
  // 🆕 DEX Hybrid Tracking
  const [dataSource, setDataSource] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [dataWarning, setDataWarning] = useState(null);
  const [isDexMode, setIsDexMode] = useState(false);

  /**
   * Load chart data for given exchange/symbol/timeframe
   * 
   * ✅ AUTO-ROUTES: CEX oder DEX basierend auf Exchange
   * ✅ DEX = Hybrid (99 CEX + 1 DEX)
   */
  const loadChartData = useCallback(async ({ exchange, symbol, timeframe, candleCount = 100 }) => {
    setChartLoading(true);
    setChartError(null);
    
    try {
      console.log('📊 Loading chart data:', { exchange, symbol, timeframe });
      
      // Check if DEX
      const dexMode = isDEX(exchange);
      setIsDexMode(dexMode);
      
      // Calculate time window
      const { start_time, end_time } = calculateTimeWindow(timeframe, candleCount);
      
      // Fetch candles (auto-routes to DEX or CEX)
      const response = await fetchChartCandles({
        exchange,
        symbol,
        timeframe,
        start_time: start_time.toISOString(),
        end_time: end_time.toISOString(),
        include_impact: false,
      });
      
      console.log('✅ Chart data loaded:', {
        candlesCount: response.candles?.length || 0,
        dataSource: response.data_source,
        dataQuality: response.data_quality,
        warning: response.warning,
      });
      
      // 🆕 Store DEX metadata
      setDataSource(response.data_source || null);
      setDataQuality(response.data_quality || null);
      setDataWarning(response.warning || null);
      
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
   * 
   * ✅ DEX: Nur letzte Candle hat echte Wallets
   * ✅ Historical: Error-Message
   */
  const loadCandleMovers = useCallback(async (timestamp, params) => {
    try {
      console.log('🎯 Loading candle movers:', { timestamp, params });
      
      const response = await fetchCandleMovers(timestamp, params);
      
      console.log('✅ Candle movers loaded:', {
        moversCount: response.top_movers?.length || 0,
        isDex: isDEX(params.exchange),
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Error loading candle movers:', error);
      
      // 🆕 Special handling for DEX historical candles
      if (isDEX(params.exchange) && error.response?.status === 404) {
        throw new Error(
          'No wallet data available for historical DEX candles. ' +
          'Only the most recent candle has real wallet addresses.'
        );
      }
      
      throw error;
    }
  }, []);

  /**
   * Batch analyze multiple candles
   * 
   * ⚠️ NOT SUPPORTED for DEX!
   */
  const batchAnalyze = useCallback(async (params) => {
    try {
      // 🆕 Block DEX batch analysis
      if (isDEX(params.exchange)) {
        throw new Error(
          'Batch analysis is not supported for DEX exchanges. ' +
          'Please use single candle analysis only.'
        );
      }
      
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
   * 
   * ⚠️ NOT SUPPORTED for DEX!
   */
  const analyzeMultiple = useCallback(async (params) => {
    try {
      // 🆕 Block DEX multi-analysis
      if (isDEX(params.exchange)) {
        throw new Error(
          'Multi-candle analysis is not supported for DEX exchanges. ' +
          'Please analyze candles individually.'
        );
      }
      
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
   * 
   * ⚠️ NOT SUPPORTED for DEX!
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
    setDataSource(null);
    setDataQuality(null);
    setDataWarning(null);
    setIsDexMode(false);
  }, []);

  return {
    // State
    chartData,
    chartLoading,
    chartError,
    
    // 🆕 DEX Metadata
    dataSource,
    dataQuality,
    dataWarning,
    isDexMode,
    
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
