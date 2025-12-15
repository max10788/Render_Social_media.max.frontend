import { useState, useCallback } from 'react';
import { getIcebergOrders, getAvailableSymbols } from '../services/icebergService';

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

  const fetchIcebergOrders = useCallback(async (symbol, timeframe, threshold) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIcebergOrders({
        exchange,
        symbol,
        timeframe,
        threshold
      });
      
      // Process and categorize with SNAKE_CASE fix
      const processedData = {
        totalDetected: data.icebergs?.length || 0,
        buyIcebergs: data.icebergs?.filter(order => order.side === 'buy') || [],
        sellIcebergs: data.icebergs?.filter(order => order.side === 'sell') || [],
        buyOrders: data.icebergs?.filter(order => order.side === 'buy').length || 0,
        sellOrders: data.icebergs?.filter(order => order.side === 'sell').length || 0,
        totalHiddenVolume: data.icebergs?.reduce((sum, order) => 
          sum + (order.hidden_volume || order.hiddenVolume || 0), 0  // ← Fix snake_case
        ) || 0,
        timeline: data.timeline || []
      };
      setIcebergData(processedData);
    } catch (err) {
      console.error('Error fetching iceberg orders:', err);
      setError(err.message || 'Failed to fetch iceberg orders');
      setIcebergData(generateMockData());
    } finally {
      setLoading(false);
    }
  }, [exchange]);  // ← OHNE timeframe

  const loadSymbols = useCallback(async () => {
    try {
      const availableSymbols = await getAvailableSymbols(exchange);
      setSymbols(availableSymbols);
    } catch (err) {
      console.error('Error loading symbols:', err);
      // Keep default symbols
    }
  }, [exchange]);

  // Mock data generator for development
  const generateMockData = () => {
    const generateOrder = (side, price) => ({
      side,
      price,
      visibleVolume: Math.random() * 10 + 5,
      hiddenVolume: Math.random() * 50 + 10,
      confidence: Math.random() * 0.3 + 0.7,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    });

    const buyIcebergs = Array.from({ length: 5 }, (_, i) => 
      generateOrder('buy', 42000 - i * 100)
    );
    
    const sellIcebergs = Array.from({ length: 5 }, (_, i) => 
      generateOrder('sell', 43000 + i * 100)
    );

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
      timeline
    };
  };

  return {
    icebergData,
    loading,
    error,
    fetchIcebergOrders,
    loadSymbols,
    symbols
  };
};

export default useIcebergOrders;
