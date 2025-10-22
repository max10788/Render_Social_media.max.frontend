// src/hooks/useRadarData.js
import { useState, useCallback } from 'react';
import { 
  API_CONFIG, 
  createAnalysisRequest, 
  parseAnalysisResponse,
  validateAnalysisRequest 
} from '../config/api';

export const useRadarData = () => {
  const [radarData, setRadarData] = useState(null);
  const [rawAnalysis, setRawAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Transformiert Backend-Daten in Radar-Format
   */
  const transformBackendDataToRadar = (backendResponse) => {
    if (!backendResponse || !backendResponse.success) {
      throw new Error('Invalid backend data structure');
    }

    const data = backendResponse.analysis_result;
    
    if (!data) {
      throw new Error('No analysis result in response');
    }
    
    // Token Info extrahieren
    const tokenInfo = {
      name: data.token_info?.name || 'Unknown Token',
      symbol: data.token_info?.symbol || 'N/A',
      address: data.token_info?.address || backendResponse.token_address,
      chain: backendResponse.chain,
      decimals: data.token_info?.decimals || 18,
      totalSupply: data.token_info?.total_supply || 0,
      price: data.token_info?.price_usd || 0,
      marketCap: data.token_info?.market_cap || 0,
      volume24h: data.token_info?.volume_24h || 0
    };

    // Wallets transformieren - alle Stages kombinieren
    const wallets = [];
    
    // Hilfsfunktion zum Hinzufügen von Wallets
    const addWallet = (address, walletData, stage) => {
      const existingIndex = wallets.findIndex(w => w.wallet_address === address);
      
      const walletObj = {
        wallet_address: address,
        chain: backendResponse.chain,
        wallet_type: walletData.type || 'UNKNOWN',
        confidence_score: walletData.confidence || 0,
        transaction_count: walletData.transaction_count || 0,
        risk_score: walletData.risk_score || 0,
        risk_flags: walletData.risk_flags || [],
        balance: walletData.balance || 0,
        first_seen: walletData.first_transaction_date,
        last_seen: walletData.last_transaction_date,
        stage: stage,
        // Zusätzliche Daten
        total_volume: walletData.total_volume || 0,
        buy_count: walletData.buy_count || 0,
        sell_count: walletData.sell_count || 0,
        transfer_count: walletData.transfer_count || 0
      };
      
      if (existingIndex >= 0) {
        // Update existing with higher stage data
        wallets[existingIndex] = { ...wallets[existingIndex], ...walletObj };
      } else {
        wallets.push(walletObj);
      }
    };

    // Stage 1 Wallets (Basic)
    if (data.wallets?.stage_1?.classified) {
      Object.entries(data.wallets.stage_1.classified).forEach(([address, walletData]) => {
        addWallet(address, walletData, 1);
      });
    }

    // Stage 2 Wallets (Advanced)
    if (data.wallets?.stage_2?.classified) {
      Object.entries(data.wallets.stage_2.classified).forEach(([address, walletData]) => {
        addWallet(address, walletData, 2);
      });
    }

    // Stage 3 Wallets (Deep)
    if (data.wallets?.stage_3?.classified) {
      Object.entries(data.wallets.stage_3.classified).forEach(([address, walletData]) => {
        addWallet(address, walletData, 3);
      });
    }

    // Unclassified Wallets (falls benötigt)
    if (data.wallets?.unclassified) {
      Object.entries(data.wallets.unclassified).forEach(([address, walletData]) => {
        addWallet(address, { ...walletData, type: 'UNKNOWN' }, 0);
      });
    }

    console.log(`✅ Transformed ${wallets.length} wallets from backend data`);

    // Overall Score berechnen
    let overallScore = 50; // Default
    
    if (data.summary) {
      const { risk_level, confidence } = data.summary;
      
      // Score basierend auf Risk Level
      if (risk_level === 'LOW') overallScore = 80;
      else if (risk_level === 'MEDIUM') overallScore = 50;
      else if (risk_level === 'HIGH') overallScore = 20;
      
      // Adjust by confidence
      if (confidence) {
        overallScore = Math.round(overallScore * confidence);
      }
    }

    // Statistics
    const statistics = {
      total_holders: data.summary?.total_holders || wallets.length,
      classified_count: data.summary?.classified_count || wallets.length,
      risk_level: data.summary?.risk_level || 'MEDIUM',
      confidence: data.summary?.confidence || 0.5,
      wallet_types: {},
      source: backendResponse.wallet_source
    };

    // Wallet Types Count
    wallets.forEach(wallet => {
      const type = wallet.wallet_type;
      statistics.wallet_types[type] = (statistics.wallet_types[type] || 0) + 1;
    });

    return {
      tokenInfo,
      wallets,
      score: overallScore,
      statistics,
      timestamp: Date.now(),
      walletSource: backendResponse.wallet_source,
      recentHours: backendResponse.recent_hours
    };
  };

  /**
   * Analysiert einen Token
   */
  const analyzeToken = useCallback(async (contractAddress, blockchain = 'ethereum', walletSource = 'top_holders', recentHours = 3) => {
    setLoading(true);
    setError(null);
    setRadarData(null);
    setRawAnalysis(null);

    try {
      // Validation
      if (!contractAddress || !contractAddress.trim()) {
        throw new Error('Contract address is required');
      }

      const cleanAddress = contractAddress.trim();

      // ✅ KORREKTER API Request Body (token_address statt contract_address)
      const requestBody = {
        token_address: cleanAddress,  // ✅ Backend erwartet token_address
        chain: blockchain,
        wallet_source: walletSource,
        recent_hours: walletSource === 'recent_traders' ? recentHours : 3
      };

      console.log('🚀 Starting analysis with:', requestBody);

      // API Call
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE_CUSTOM}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      const responseData = await response.json();
      console.log('📥 Backend response:', responseData);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error(
            responseData.error_message || 
            `Token not found: ${cleanAddress} on ${blockchain}`
          );
        }
        
        throw new Error(
          responseData.error_message || 
          responseData.detail || 
          `Analysis failed with status ${response.status}`
        );
      }

      // Check success flag
      if (!responseData.success) {
        throw new Error(responseData.error_message || 'Analysis failed');
      }

      // Raw Analysis speichern
      setRawAnalysis(responseData);

      // Transform zu Radar Format
      const transformedData = transformBackendDataToRadar(responseData);
      console.log('✅ Transformed radar data:', transformedData);
      console.log(`✅ Found ${transformedData.wallets.length} wallets to display`);

      setRadarData(transformedData);
      
      return transformedData;

    } catch (err) {
      console.error('❌ Analysis error:', err);
      const errorMessage = err.message || 'Analysis failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset State
   */
  const reset = useCallback(() => {
    setRadarData(null);
    setRawAnalysis(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    radarData,
    rawAnalysis,
    loading,
    error,
    analyzeToken,
    reset
  };
};

export default useRadarData;
