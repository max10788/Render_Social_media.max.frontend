// src/hooks/useRadarData.js - MIT DEBUG LOGS
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
    
    // ✅ ========== KRITISCHER DEBUG BLOCK ==========
    console.log('\n🔍 ========== WALLET_ANALYSIS DEBUG ==========');
    console.log('  - Has wallet_analysis?', !!data.wallet_analysis);
    
    if (data.wallet_analysis) {
      console.log('  - wallet_analysis keys:', Object.keys(data.wallet_analysis));
      console.log('  - classified type:', typeof data.wallet_analysis.classified);
      console.log('  - classified isArray?', Array.isArray(data.wallet_analysis.classified));
      
      if (data.wallet_analysis.classified) {
        if (Array.isArray(data.wallet_analysis.classified)) {
          console.log('  - classified length:', data.wallet_analysis.classified.length);
          console.log('  - First classified entry (ARRAY):', JSON.stringify(data.wallet_analysis.classified[0], null, 2));
        } else {
          const keys = Object.keys(data.wallet_analysis.classified);
          console.log('  - classified keys (OBJECT):', keys.slice(0, 3));
          console.log('  - First classified entry (OBJECT):', JSON.stringify(data.wallet_analysis.classified[keys[0]], null, 2));
        }
      }
      
      console.log('  - unclassified type:', typeof data.wallet_analysis.unclassified);
      console.log('  - unclassified isArray?', Array.isArray(data.wallet_analysis.unclassified));
      
      if (data.wallet_analysis.unclassified) {
        if (Array.isArray(data.wallet_analysis.unclassified)) {
          console.log('  - unclassified length:', data.wallet_analysis.unclassified.length);
          console.log('  - First unclassified entry (ARRAY):', JSON.stringify(data.wallet_analysis.unclassified[0], null, 2));
        } else {
          const keys = Object.keys(data.wallet_analysis.unclassified);
          console.log('  - unclassified keys (OBJECT):', keys.slice(0, 3));
          console.log('  - First unclassified entry (OBJECT):', JSON.stringify(data.wallet_analysis.unclassified[keys[0]], null, 2));
        }
      }
    }
    console.log('🔍 ==========================================\n');
    // ✅ ========== END DEBUG BLOCK ==========
    
    // ✅ TATSÄCHLICHE Backend-Struktur: wallet_analysis mit Arrays
    if (data.wallet_analysis) {
      console.log('🔍 DEBUG: Found wallet_analysis property');
      
      // ✅ HAUPT-STRUKTUR: classified als ARRAY
      if (Array.isArray(data.wallet_analysis.classified)) {
        console.log('🔍 DEBUG: Processing classified wallets (ARRAY):', data.wallet_analysis.classified.length);
        
        data.wallet_analysis.classified.forEach((walletData, idx) => {
          const address = walletData.address || walletData.wallet_address;
          console.log(`  [${idx}] Processing: ${address}, type: ${walletData.type}, wallet_type: ${walletData.wallet_type}`);
          
          if (address) {
            // Map die Backend-Felder auf Frontend-Struktur
            const mappedWallet = {
              wallet_type: walletData.type || walletData.wallet_type || 'UNKNOWN',
              confidence_score: walletData.confidence_score || 0,
              transaction_count: walletData.transaction_count || walletData.tx_count || 0,
              risk_score: walletData.risk_score || 0,
              risk_flags: walletData.risk_flags || [],
              balance: walletData.balance || 0,
              first_seen: walletData.first_transaction,
              last_seen: walletData.last_transaction,
              // Zusätzliche Daten
              total_volume: walletData.total_volume || 0,
              buy_count: walletData.buy_count || 0,
              sell_count: walletData.sell_count || 0
            };
            
            console.log(`  [${idx}] Mapped wallet_type: ${mappedWallet.wallet_type}`);
            addWallet(address, mappedWallet, analysisDepth);
          }
        });
      } else if (typeof data.wallet_analysis.classified === 'object') {
        // ✅ FALLBACK: classified als OBJECT (alte Struktur)
        console.log('🔍 DEBUG: Processing classified wallets (OBJECT)');
        Object.entries(data.wallet_analysis.classified).forEach(([address, walletData]) => {
          const mappedWallet = {
            wallet_type: walletData.type || walletData.wallet_type || 'UNKNOWN',
            confidence_score: walletData.confidence_score || 0,
            transaction_count: walletData.transaction_count || walletData.tx_count || 0,
            risk_score: walletData.risk_score || 0,
            risk_flags: walletData.risk_flags || [],
            balance: walletData.balance || 0,
            first_seen: walletData.first_transaction,
            last_seen: walletData.last_transaction,
            total_volume: walletData.total_volume || 0,
            buy_count: walletData.buy_count || 0,
            sell_count: walletData.sell_count || 0
          };
          addWallet(address, mappedWallet, analysisDepth);
        });
      }

      // ✅ Unclassified als ARRAY
      if (Array.isArray(data.wallet_analysis.unclassified)) {
        console.log('🔍 DEBUG: Processing unclassified wallets (ARRAY):', data.wallet_analysis.unclassified.length);
        
        data.wallet_analysis.unclassified.forEach((walletData) => {
          const address = walletData.address || walletData.wallet_address;
          if (address) {
            const mappedWallet = {
              wallet_type: 'UNKNOWN',
              confidence_score: 0,
              transaction_count: walletData.tx_count || walletData.transaction_count || 0,
              risk_score: walletData.risk_score || 0,
              balance: walletData.balance || 0,
              first_seen: walletData.first_transaction,
              last_seen: walletData.last_transaction,
              buy_count: walletData.buy_count || 0,
              sell_count: walletData.sell_count || 0,
              total_bought: walletData.total_bought || 0,
              total_sold: walletData.total_sold || 0
            };
            addWallet(address, mappedWallet, 0);
          }
        });
      } else if (typeof data.wallet_analysis.unclassified === 'object') {
        // ✅ FALLBACK: unclassified als OBJECT
        console.log('🔍 DEBUG: Processing unclassified wallets (OBJECT)');
        Object.entries(data.wallet_analysis.unclassified).forEach(([address, walletData]) => {
          const mappedWallet = {
            wallet_type: 'UNKNOWN',
            confidence_score: 0,
            transaction_count: walletData.tx_count || walletData.transaction_count || 0,
            risk_score: walletData.risk_score || 0,
            balance: walletData.balance || 0,
            first_seen: walletData.first_transaction,
            last_seen: walletData.last_transaction,
            buy_count: walletData.buy_count || 0,
            sell_count: walletData.sell_count || 0,
            total_bought: walletData.total_bought || 0,
            total_sold: walletData.total_sold || 0
          };
          addWallet(address, mappedWallet, 0);
        });
      }
    }
    
    // ✅ Fallback: Alte Struktur mit "wallets" (Object-basiert)
    if (wallets.length === 0 && data.wallets) {
      console.warn('⚠️ No wallets in wallet_analysis, trying old "wallets" structure...');
      
      if (typeof data.wallets === 'object' && !Array.isArray(data.wallets)) {
        // Object-basierte Struktur
        if (data.wallets.classified) {
          console.log('🔍 DEBUG: Processing old classified structure (OBJECT)');
          Object.entries(data.wallets.classified).forEach(([address, walletData]) => {
            addWallet(address, walletData, analysisDepth);
          });
        }

        if (data.wallets.unclassified) {
          console.log('🔍 DEBUG: Processing old unclassified structure (OBJECT)');
          Object.entries(data.wallets.unclassified).forEach(([address, walletData]) => {
            addWallet(address, { ...walletData, wallet_type: 'UNKNOWN' }, 0);
          });
        }
      }
    }

    // ✅ FINALE WALLET-ANALYSE
    console.log('\n🎯 ========== FINAL WALLET ANALYSIS ==========');
    console.log(`  Total wallets added: ${wallets.length}`);
    const classifiedCount = wallets.filter(w => w.wallet_type !== 'UNKNOWN').length;
    const unclassifiedCount = wallets.filter(w => w.wallet_type === 'UNKNOWN').length;
    console.log(`  Classified: ${classifiedCount}`);
    console.log(`  Unclassified: ${unclassifiedCount}`);
    
    if (classifiedCount > 0) {
      console.log('  Sample classified wallets:');
      wallets.filter(w => w.wallet_type !== 'UNKNOWN').slice(0, 3).forEach(w => {
        console.log(`    - ${w.wallet_address}: ${w.wallet_type} (confidence: ${w.confidence_score})`);
      });
    }
    console.log('🎯 ==========================================\n');

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
    
    // Backend kann "score" oder "token_score" liefern
    if (data.score !== undefined && data.score !== null) {
      overallScore = data.score;
    } else if (data.token_score !== undefined && data.token_score !== null) {
      overallScore = data.token_score;
    } else {
      // Fallback: Berechne aus Wallets
      const avgRiskScore = wallets.reduce((sum, w) => sum + (w.risk_score || 0), 0) / wallets.length;
      // Invertiere Risk Score zu Quality Score: niedrig risk = hoch score
      overallScore = Math.round(100 - avgRiskScore);
    }

    // ✅ Statistics - aus wallet_analysis oder selbst berechnet
    const statistics = {
      total_holders: data.wallet_analysis?.total_wallets || wallets.length,
      classified_count: data.wallet_analysis?.classified_count || wallets.filter(w => w.wallet_type !== 'UNKNOWN').length,
      unclassified_count: data.wallet_analysis?.unclassified_count || wallets.filter(w => w.wallet_type === 'UNKNOWN').length,
      risk_level: calculateRiskLevel(wallets),
      confidence: calculateAverageConfidence(wallets),
      wallet_types: {},
      source: data.wallet_analysis?.wallet_source || backendResponse.wallet_source,
      recent_hours: data.wallet_analysis?.recent_hours || backendResponse.recent_hours,
      analysis_depth: analysisDepth
    };

    // ✅ Wallet Types Count - aus metrics oder selbst berechnen
    if (data.metrics) {
      statistics.wallet_types = {
        'WHALE': data.metrics.whales || 0,
        'HODLER': data.metrics.hodlers || 0,
        'TRADER': data.metrics.traders || 0,
        'MIXER': data.metrics.mixers || 0,
        'DUST_SWEEPER': data.metrics.dust_sweepers || 0,
        'UNKNOWN': (statistics.total_holders - statistics.classified_count) || 0
      };
    } else {
      // Fallback: Selbst zählen
      wallets.forEach(wallet => {
        const type = wallet.wallet_type;
        statistics.wallet_types[type] = (statistics.wallet_types[type] || 0) + 1;
      });
    }

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
