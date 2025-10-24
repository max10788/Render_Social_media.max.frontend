// src/hooks/useRadarData.js - KORRIGIERTE VERSION
import { useState, useCallback } from 'react';
import { API_CONFIG } from '../config/api';

export const useRadarData = () => {
  const [radarData, setRadarData] = useState(null);
  const [rawAnalysis, setRawAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ✅ Hilfsfunktion: Berechnet Risk Level aus Wallets
   */
  const calculateRiskLevel = (wallets) => {
    if (!wallets || wallets.length === 0) return 'UNKNOWN';
    
    const avgRisk = wallets.reduce((sum, w) => sum + (w.risk_score || 0), 0) / wallets.length;
    
    if (avgRisk < 30) return 'LOW';
    if (avgRisk < 70) return 'MEDIUM';
    return 'HIGH';
  };

  /**
   * ✅ Hilfsfunktion: Berechnet durchschnittliche Confidence
   */
  const calculateAverageConfidence = (wallets) => {
    if (!wallets || wallets.length === 0) return 0;
    
    const classifiedWallets = wallets.filter(w => w.wallet_type !== 'UNKNOWN');
    if (classifiedWallets.length === 0) return 0;
    
    const avgConfidence = classifiedWallets.reduce((sum, w) => sum + (w.confidence_score || 0), 0) / classifiedWallets.length;
    return avgConfidence;
  };

  /**
   * ✅ KORRIGIERT: Transformiert Backend-Daten in Radar-Format
   * Fokus nur auf TATSÄCHLICHE Backend-Struktur
   */
  const transformBackendDataToRadar = (backendResponse, analysisDepth = 3) => {
    if (!backendResponse || !backendResponse.success) {
      throw new Error('Invalid backend data structure');
    }

    const data = backendResponse.analysis_result;
    
    if (!data) {
      throw new Error('No analysis result in response');
    }
    
    console.log('🔍 DEBUG: Full API response structure:', JSON.stringify(data, null, 2));
    
    // ✅ Token Info extrahieren
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

    // ✅ Wallets Array
    const wallets = [];
    
    /**
     * ✅ Hilfsfunktion: Wallet zum Array hinzufügen
     */
    const addWallet = (address, walletData, stage) => {
      const existingIndex = wallets.findIndex(w => w.wallet_address === address);
      
      const walletObj = {
        wallet_address: address,
        chain: backendResponse.chain,
        wallet_type: walletData.wallet_type || walletData.type || 'UNKNOWN',
        confidence_score: walletData.confidence_score || walletData.confidence || 0,
        transaction_count: walletData.transaction_count || walletData.transactions || 0,
        risk_score: walletData.risk_score || 0,
        risk_flags: walletData.risk_flags || [],
        balance: walletData.balance || 0,
        first_seen: walletData.first_transaction_date || walletData.first_seen,
        last_seen: walletData.last_transaction_date || walletData.last_seen,
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

    console.log('🔍 DEBUG: Available properties in data:', Object.keys(data));
    
    // ✅ KORRIGIERT: Nur noch die TATSÄCHLICHE Backend-Struktur verarbeiten
    if (data.wallets) {
      console.log('🔍 DEBUG: Found wallets property with keys:', Object.keys(data.wallets));
      
      // ✅ HAUPT-STRUKTUR: classified wallets (direkt)
      if (data.wallets.classified) {
        console.log('🔍 DEBUG: Processing classified wallets:', Object.keys(data.wallets.classified).length);
        
        Object.entries(data.wallets.classified).forEach(([address, walletData]) => {
          // ✅ analysisDepth wird hier als "stage" gespeichert
          addWallet(address, walletData, analysisDepth);
        });
      }

      // ✅ Unclassified Wallets
      if (data.wallets.unclassified) {
        console.log('🔍 DEBUG: Processing unclassified wallets:', Object.keys(data.wallets.unclassified).length);
        
        Object.entries(data.wallets.unclassified).forEach(([address, walletData]) => {
          addWallet(address, { ...walletData, wallet_type: 'UNKNOWN' }, 0);
        });
      }
    }
    
    // ✅ Fallback: Wenn keine Wallets im erwarteten Format gefunden wurden
    // Prüfe alternative Strukturen
    if (wallets.length === 0) {
      console.warn('⚠️ No wallets found in expected structure, trying alternatives...');
      
      // Alternative 1: Wallets als direktes Array
      if (Array.isArray(data.wallets)) {
        console.log('🔍 DEBUG: Found wallets as array');
        data.wallets.forEach((wallet, index) => {
          if (wallet.wallet_address || wallet.address) {
            const address = wallet.wallet_address || wallet.address;
            addWallet(address, wallet, analysisDepth);
          }
        });
      }
      
      // Alternative 2: holder_data
      if (data.holder_data) {
        console.log('🔍 DEBUG: Found holder_data');
        if (typeof data.holder_data === 'object') {
          Object.entries(data.holder_data).forEach(([address, holderData]) => {
            addWallet(address, holderData, analysisDepth);
          });
        }
      }
    }

    // ✅ Wenn immer noch keine Wallets, werfe Fehler
    if (wallets.length === 0) {
      console.error('❌ No wallets found in any expected structure');
      console.error('Available data keys:', Object.keys(data));
      if (data.wallets) {
        console.error('Wallets structure:', Object.keys(data.wallets));
      }
      throw new Error('No wallets found in analysis. The token may have no holders or transactions in the selected timeframe.');
    }

    console.log(`✅ Transformed ${wallets.length} wallets from backend data`);

    // ✅ Overall Score berechnen
    let overallScore = 50; // Default
    
    if (data.token_score !== undefined && data.token_score !== null) {
      // Backend liefert direkt einen token_score (0-100)
      overallScore = data.token_score;
    } else {
      // Fallback: Berechne aus Wallets
      const avgRiskScore = wallets.reduce((sum, w) => sum + (w.risk_score || 0), 0) / wallets.length;
      // Invertiere Risk Score zu Quality Score: niedrig risk = hoch score
      overallScore = Math.round(100 - avgRiskScore);
    }

    // ✅ Statistics - SELBST BERECHNET aus Wallets (Backend sendet keine summary)
    const statistics = {
      total_holders: wallets.length,
      classified_count: wallets.filter(w => w.wallet_type !== 'UNKNOWN').length,
      unclassified_count: wallets.filter(w => w.wallet_type === 'UNKNOWN').length,
      risk_level: calculateRiskLevel(wallets),
      confidence: calculateAverageConfidence(wallets),
      wallet_types: {},
      source: backendResponse.wallet_source,
      analysis_depth: analysisDepth
    };

    // ✅ Wallet Types Count
    wallets.forEach(wallet => {
      const type = wallet.wallet_type;
      statistics.wallet_types[type] = (statistics.wallet_types[type] || 0) + 1;
    });

    console.log('✅ Statistics calculated:', statistics);

    return {
      tokenInfo,
      wallets,
      score: overallScore,
      statistics,
      timestamp: Date.now(),
      walletSource: backendResponse.wallet_source,
      recentHours: backendResponse.recent_hours,
      analysisDepth: analysisDepth,
      riskFlags: data.risk_flags || []
    };
  };

  /**
   * ✅ KORRIGIERT: Analysiert einen Token
   * Parameter: analysisDepth hinzugefügt
   */
  const analyzeToken = useCallback(async (
    contractAddress, 
    blockchain = 'ethereum', 
    walletSource = 'top_holders', 
    recentHours = 3,
    analysisDepth = 3  // ✅ NEU: Parameter hinzugefügt
  ) => {
    setLoading(true);
    setError(null);
    setRadarData(null);
    setRawAnalysis(null);

    try {
      // ✅ Validation
      if (!contractAddress || !contractAddress.trim()) {
        throw new Error('Contract address is required');
      }

      const cleanAddress = contractAddress.trim();

      // ✅ API Request Body - Backend erwartet KEINE analysisDepth
      // analysisDepth wird nur im Frontend verwendet
      const requestBody = {
        token_address: cleanAddress,
        chain: blockchain,
        wallet_source: walletSource,
        recent_hours: walletSource === 'recent_traders' ? recentHours : 3
      };

      console.log('🚀 Starting analysis with:', requestBody);
      console.log('🎯 Analysis Depth (Frontend only):', analysisDepth);

      // ✅ API Call
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
        // ✅ Handle specific error cases
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

      // ✅ Check success flag
      if (!responseData.success) {
        throw new Error(responseData.error_message || 'Analysis failed');
      }

      // ✅ Raw Analysis speichern
      setRawAnalysis(responseData);

      // ✅ Transform zu Radar Format - mit analysisDepth
      const transformedData = transformBackendDataToRadar(responseData, analysisDepth);
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
   * ✅ Reset State
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
