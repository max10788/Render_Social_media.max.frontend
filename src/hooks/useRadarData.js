// src/hooks/useRadarData.js - FIXED VERSION ✅
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
   * ✅ KOMPLETT NEU: Robuste Transformation mit allen Backend-Formaten
   */
  const transformBackendDataToRadar = (backendResponse, analysisDepth = 3) => {
    if (!backendResponse || !backendResponse.success) {
      throw new Error('Invalid backend data structure');
    }

    const data = backendResponse.analysis_result;
    
    if (!data) {
      throw new Error('No analysis result in response');
    }
    
    console.log('🔍 ===== TRANSFORMATION START =====');
    console.log('Backend Response Keys:', Object.keys(data));
    
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
      volume24h: data.token_info?.volume_24h || 0,
      holdersCount: data.token_info?.holders_count || 0,
      liquidity: data.token_info?.liquidity || 0
    };

    console.log('✅ Token Info:', tokenInfo.name, tokenInfo.symbol);

    // ✅ Wallets Array - HAUPTLOGIK
    const wallets = [];
    
    /**
     * ✅ Hilfsfunktion: Wallet normalisieren und hinzufügen
     */
    const addWallet = (walletData, isClassified) => {
      // Adresse extrahieren (verschiedene Feldnamen möglich)
      const address = walletData.address || walletData.wallet_address;
      
      if (!address) {
        console.warn('⚠️ Wallet ohne Adresse übersprungen:', walletData);
        return;
      }

      // Check ob Wallet schon existiert
      const existingIndex = wallets.findIndex(w => w.wallet_address === address);
      
      const normalizedWallet = {
        // Identifikation
        wallet_address: address,
        chain: backendResponse.chain,
        token_address: backendResponse.token_address,
        
        // Klassifizierung
        wallet_type: walletData.type || walletData.wallet_type || 'UNKNOWN',
        confidence_score: walletData.confidence_score || walletData.confidence || 0,
        stage: isClassified ? analysisDepth : 0,
        
        // Token Balance
        balance: walletData.balance || 0,
        percentage_of_supply: walletData.percentage_of_supply || walletData.percentage || 0,
        
        // Transaktionen
        transaction_count: walletData.transaction_count || walletData.tx_count || 0,
        first_transaction: walletData.first_transaction || walletData.first_seen,
        last_transaction: walletData.last_transaction || walletData.last_seen,
        
        // Risk Assessment (nur bei klassifizierten Wallets)
        risk_score: walletData.risk_score || 0,
        risk_flags: Array.isArray(walletData.risk_flags) ? walletData.risk_flags : [],
        
        // Trading Data (falls vorhanden)
        buy_count: walletData.buy_count || 0,
        sell_count: walletData.sell_count || 0,
        total_bought: walletData.total_bought || 0,
        total_sold: walletData.total_sold || 0,
        total_volume: walletData.total_volume || 0,
        
        // Metadata
        created_at: walletData.created_at || new Date().toISOString(),
        updated_at: walletData.updated_at || new Date().toISOString()
      };

      if (existingIndex >= 0) {
        // Update existing wallet with new data
        wallets[existingIndex] = { ...wallets[existingIndex], ...normalizedWallet };
      } else {
        // Add new wallet
        wallets.push(normalizedWallet);
      }
    };

    // ✅ HAUPTLOGIK: Wallets aus wallet_analysis extrahieren
    if (data.wallet_analysis) {
      console.log('✅ Found wallet_analysis');
      
      // ========== CLASSIFIED WALLETS ==========
      const classified = data.wallet_analysis.classified;
      
      if (Array.isArray(classified)) {
        console.log(`📦 Processing ${classified.length} classified wallets (ARRAY format)`);
        classified.forEach((wallet, idx) => {
          if (idx < 3) console.log(`  [${idx}] Sample:`, wallet.address || wallet.wallet_address, wallet.type || wallet.wallet_type);
          addWallet(wallet, true);
        });
      } else if (classified && typeof classified === 'object') {
        const entries = Object.entries(classified);
        console.log(`📦 Processing ${entries.length} classified wallets (OBJECT format)`);
        entries.forEach(([address, wallet], idx) => {
          if (idx < 3) console.log(`  [${idx}] Sample:`, address, wallet.type || wallet.wallet_type);
          addWallet({ address, ...wallet }, true);
        });
      }
      
      // ========== UNCLASSIFIED WALLETS ==========
      const unclassified = data.wallet_analysis.unclassified;
      
      if (Array.isArray(unclassified)) {
        console.log(`📦 Processing ${unclassified.length} unclassified wallets (ARRAY format)`);
        unclassified.forEach((wallet, idx) => {
          if (idx < 3) console.log(`  [${idx}] Sample:`, wallet.address || wallet.wallet_address);
          addWallet(wallet, false);
        });
      } else if (unclassified && typeof unclassified === 'object') {
        const entries = Object.entries(unclassified);
        console.log(`📦 Processing ${entries.length} unclassified wallets (OBJECT format)`);
        entries.forEach(([address, wallet], idx) => {
          if (idx < 3) console.log(`  [${idx}] Sample:`, address);
          addWallet({ address, ...wallet }, false);
        });
      }
    }

    // ✅ Fallback: Alte Struktur mit "wallets" (nur als Backup)
    if (wallets.length === 0 && data.wallets) {
      console.warn('⚠️ Using fallback: old "wallets" structure');
      
      if (Array.isArray(data.wallets)) {
        data.wallets.forEach(wallet => addWallet(wallet, false));
      } else if (typeof data.wallets === 'object') {
        if (data.wallets.classified) {
          const classified = data.wallets.classified;
          if (Array.isArray(classified)) {
            classified.forEach(w => addWallet(w, true));
          } else {
            Object.entries(classified).forEach(([addr, w]) => addWallet({ address: addr, ...w }, true));
          }
        }
        if (data.wallets.unclassified) {
          const unclassified = data.wallets.unclassified;
          if (Array.isArray(unclassified)) {
            unclassified.forEach(w => addWallet(w, false));
          } else {
            Object.entries(unclassified).forEach(([addr, w]) => addWallet({ address: addr, ...w }, false));
          }
        }
      }
    }

    // ✅ Validierung
    if (wallets.length === 0) {
      console.error('❌ NO WALLETS FOUND!');
      console.error('Available data keys:', Object.keys(data));
      if (data.wallet_analysis) {
        console.error('wallet_analysis keys:', Object.keys(data.wallet_analysis));
        console.error('classified type:', typeof data.wallet_analysis.classified);
        console.error('unclassified type:', typeof data.wallet_analysis.unclassified);
      }
      throw new Error('No wallets found in analysis. The token may have no holders or transactions.');
    }

    console.log(`✅ TOTAL WALLETS: ${wallets.length}`);
    
    // Split für Statistiken
    const classifiedWallets = wallets.filter(w => w.wallet_type !== 'UNKNOWN');
    const unclassifiedWallets = wallets.filter(w => w.wallet_type === 'UNKNOWN');
    
    console.log(`   - Classified: ${classifiedWallets.length}`);
    console.log(`   - Unclassified: ${unclassifiedWallets.length}`);

    // ✅ Score berechnen
    let overallScore = 50;
    
    if (data.score !== undefined && data.score !== null) {
      overallScore = data.score;
    } else if (data.token_score !== undefined && data.token_score !== null) {
      overallScore = data.token_score;
    } else {
      // Fallback: Aus Risk Score berechnen
      const avgRiskScore = wallets.reduce((sum, w) => sum + (w.risk_score || 0), 0) / wallets.length;
      overallScore = Math.round(100 - avgRiskScore);
    }

    // ✅ Statistics
    const statistics = {
      total_holders: data.wallet_analysis?.total || wallets.length,
      classified_count: classifiedWallets.length,
      unclassified_count: unclassifiedWallets.length,
      risk_level: calculateRiskLevel(wallets),
      confidence: calculateAverageConfidence(wallets),
      wallet_types: {},
      source: data.wallet_analysis?.wallet_source || backendResponse.wallet_source,
      recent_hours: data.wallet_analysis?.recent_hours || backendResponse.recent_hours,
      analysis_depth: analysisDepth
    };

    // Wallet Types Count
    if (data.metrics) {
      statistics.wallet_types = {
        'WHALE': data.metrics.whales || 0,
        'HODLER': data.metrics.hodlers || 0,
        'TRADER': data.metrics.traders || 0,
        'MIXER': data.metrics.mixers || 0,
        'DUST_SWEEPER': data.metrics.dust_sweepers || 0,
        'UNKNOWN': unclassifiedWallets.length
      };
    } else {
      // Fallback: Selbst zählen
      wallets.forEach(wallet => {
        const type = wallet.wallet_type;
        statistics.wallet_types[type] = (statistics.wallet_types[type] || 0) + 1;
      });
    }

    console.log('🔍 ===== TRANSFORMATION END =====\n');

    return {
      tokenInfo,
      wallets, // ✅ FLAT ARRAY mit ALLEN Wallets
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
   * ✅ Analysiert einen Token
   */
  const analyzeToken = useCallback(async (
    contractAddress, 
    blockchain = 'ethereum', 
    walletSource = 'top_holders', 
    recentHours = 3,
    analysisDepth = 3
  ) => {
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

      // API Request Body
      const requestBody = {
        token_address: cleanAddress,
        chain: blockchain,
        wallet_source: walletSource,
        recent_hours: walletSource === 'recent_traders' ? recentHours : 3
      };

      console.log('🚀 API Request:', requestBody);
      console.log('🎯 Analysis Depth (Frontend only):', analysisDepth);

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
      console.log('📥 Backend Response:', responseData);

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
