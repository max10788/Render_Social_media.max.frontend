import { useState, useCallback } from 'react';
import { getIcebergOrders, getAvailableSymbols, getClusterAnalysis } from '../services/icebergService';

const useIcebergOrders = (exchange = 'binance') => {
  const [icebergData, setIcebergData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbols, setSymbols] = useState([
    'BTC/USDT',
    'ETH/USDT',
    'BNB/USDT',
    'SOL/USDT',
    'XRP/USDT',
    'ADA/USDT',
    'DOGE/USDT',
    'AVAX/USDT'
  ]);

  const fetchIcebergOrders = useCallback(async (symbol, timeframe, threshold, enableClustering = true, adaptiveClustering = false) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getIcebergOrders({
        exchange,
        symbol,
        timeframe,
        threshold,
        enableClustering,
        adaptiveClustering
      });

      console.log('📊 Backend Response:', data);

      // Process data mit Support für snake_case UND camelCase
      const processedData = {
        // Basis-Informationen
        totalDetected: data.statistics?.totalDetected || data.icebergs?.length || 0,
        buyOrders: data.statistics?.buyOrders || 0,
        sellOrders: data.statistics?.sellOrders || 0,
        totalHiddenVolume: data.statistics?.totalHiddenVolume || 0,
        averageConfidence: data.statistics?.averageConfidence || 0,

        // Einzelne Icebergs (für Chart)
        buyIcebergs: data.icebergs?.filter(order => order.side === 'buy').map(normalizeIceberg) || [],
        sellIcebergs: data.icebergs?.filter(order => order.side === 'sell').map(normalizeIceberg) || [],

        // NEU: Parent Orders (wenn Clustering aktiviert)
        parentOrders: data.parent_orders || [],
        individualIcebergs: data.individual_icebergs?.map(normalizeIceberg) || [],
        
        // NEU: Clustering Stats
        clusteringStats: data.clustering_stats || null,
        clusteringEnabled: enableClustering,

        // Timeline und Metadata
        timeline: data.timeline || [],
        metadata: data.metadata || {}
      };

      console.log('✅ Processed Data:', {
        total: processedData.totalDetected,
        buy: processedData.buyOrders,
        sell: processedData.sellOrders,
        parentOrders: processedData.parentOrders?.length || 0,
        clusteringRate: processedData.clusteringStats?.clustering_rate || 0
      });

      setIcebergData(processedData);
    } catch (err) {
      console.error('❌ Error fetching iceberg orders:', err);
      setError(err.message || 'Failed to fetch iceberg orders');
      
      // Fallback zu Mock-Daten für Development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Using mock data due to error');
        setIcebergData(generateMockData());
      }
    } finally {
      setLoading(false);
    }
  }, [exchange]);

  const fetchClusterAnalysis = useCallback(async (symbol, threshold, timeWindow, priceTolerance, minRefills) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getClusterAnalysis({
        exchange,
        symbol,
        threshold,
        timeWindow,
        priceTolerance,
        minRefills
      });

      console.log('🔬 Cluster Analysis:', data);
      return data;
    } catch (err) {
      console.error('❌ Error fetching cluster analysis:', err);
      setError(err.message || 'Failed to fetch cluster analysis');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [exchange]);

  const loadSymbols = useCallback(async () => {
    try {
      const availableSymbols = await getAvailableSymbols(exchange);
      if (availableSymbols.length > 0) {
        setSymbols(availableSymbols);
      }
    } catch (err) {
      console.error('Error loading symbols:', err);
      // Keep default symbols
    }
  }, [exchange]);

  // Normalisiere Iceberg-Daten (snake_case → camelCase)
  const normalizeIceberg = (iceberg) => {
    return {
      side: iceberg.side,
      price: iceberg.price,
      visibleVolume: iceberg.visible_volume || iceberg.visibleVolume || 0,
      hiddenVolume: iceberg.hidden_volume || iceberg.hiddenVolume || 0,
      totalVolume: iceberg.total_volume || iceberg.totalVolume || 
                   (iceberg.visible_volume || iceberg.visibleVolume || 0) + 
                   (iceberg.hidden_volume || iceberg.hiddenVolume || 0),
      confidence: iceberg.confidence || 0,
      timestamp: iceberg.timestamp,
      detectionMethod: iceberg.detection_method || iceberg.detectionMethod,
      // Zusätzliche Felder falls vorhanden
      supportingTrades: iceberg.supporting_trades || iceberg.supportingTrades,
      refillCount: iceberg.refill_count || iceberg.refillCount,
      zScore: iceberg.z_score || iceberg.zScore
    };
  };

  // Mock data generator für Development
  const generateMockData = () => {
    const generateOrder = (side, price) => ({
      side,
      price,
      visibleVolume: Math.random() * 10 + 5,
      hiddenVolume: Math.random() * 50 + 10,
      confidence: Math.random() * 0.3 + 0.7,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      detectionMethod: ['trade_flow_analysis', 'volume_anomaly', 'order_refill_pattern'][Math.floor(Math.random() * 3)]
    });

    const buyIcebergs = Array.from({ length: 8 }, (_, i) => 
      generateOrder('buy', 42000 - i * 50)
    );
    
    const sellIcebergs = Array.from({ length: 7 }, (_, i) => 
      generateOrder('sell', 43000 + i * 50)
    );

    // Mock Parent Orders
    const parentOrders = [
      {
        id: 'PARENT_1_BUY',
        side: 'buy',
        price: {
          avg: 41950,
          min: 41900,
          max: 42000,
          std: 30,
          range_percent: 0.12
        },
        volume: {
          total: 45.5,
          visible: 8.2,
          hidden: 37.3,
          hidden_ratio: 4.55,
          avg_refill_size: 5.69,
          refill_size_consistency: 0.89
        },
        refills: {
          count: 8,
          details: buyIcebergs.slice(0, 8)
        },
        timing: {
          first_seen: new Date(Date.now() - 300000).toISOString(),
          last_seen: new Date(Date.now() - 10000).toISOString(),
          duration_minutes: 4.83,
          avg_interval_seconds: 36.25,
          interval_consistency: 0.82
        },
        confidence: {
          overall: 0.85,
          consistency_score: 0.89
        }
      },
      {
        id: 'PARENT_2_SELL',
        side: 'sell',
        price: {
          avg: 43100,
          min: 43050,
          max: 43150,
          std: 25,
          range_percent: 0.11
        },
        volume: {
          total: 38.2,
          visible: 6.8,
          hidden: 31.4,
          hidden_ratio: 4.62,
          avg_refill_size: 5.46,
          refill_size_consistency: 0.91
        },
        refills: {
          count: 7,
          details: sellIcebergs.slice(0, 7)
        },
        timing: {
          first_seen: new Date(Date.now() - 240000).toISOString(),
          last_seen: new Date(Date.now() - 5000).toISOString(),
          duration_minutes: 3.92,
          avg_interval_seconds: 39.17,
          interval_consistency: 0.87
        },
        confidence: {
          overall: 0.88,
          consistency_score: 0.91
        }
      }
    ];

    const timeline = [...buyIcebergs, ...sellIcebergs]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(order => ({
        side: order.side,
        volume: order.hiddenVolume + order.visibleVolume,
        timestamp: order.timestamp
      }));

    return {
      totalDetected: buyIcebergs.length + sellIcebergs.length,
      buyIcebergs,
      sellIcebergs,
      buyOrders: buyIcebergs.length,
      sellOrders: sellIcebergs.length,
      totalHiddenVolume: [...buyIcebergs, ...sellIcebergs].reduce(
        (sum, order) => sum + order.hiddenVolume, 
        0
      ),
      averageConfidence: 0.82,
      parentOrders,
      individualIcebergs: [],
      clusteringStats: {
        total_input_icebergs: 15,
        parent_orders_found: 2,
        clustered_icebergs: 15,
        unclustered_icebergs: 0,
        clustering_rate: 100,
        avg_refills_per_parent: 7.5
      },
      clusteringEnabled: true,
      timeline
    };
  };

  return {
    icebergData,
    loading,
    error,
    fetchIcebergOrders,
    fetchClusterAnalysis,
    loadSymbols,
    symbols
  };
};

export default useIcebergOrders;
