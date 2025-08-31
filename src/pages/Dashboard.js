import React, { useState, useEffect } from 'react';
import { api } from '../api'; // Einfacher Import
import '../App.css';

function Dashboard() {
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [assets, setAssets] = useState(null);
  const [blockchains, setBlockchains] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedAsset, setSelectedAsset] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Echte API-Aufrufe
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [configData, analyticsData, assetsData, blockchainsData] = await Promise.all([
          api.getConfig(),
          api.getAnalytics(),
          api.getAssets(),
          api.getBlockchains()
        ]);
        
        setConfig(configData);
        setAnalytics(analyticsData);
        setAssets(assetsData);
        setBlockchains(blockchainsData);
      } catch (err) {
        setError('Fehler beim Laden der Daten: ' + err.message);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    
    setAnalysisLoading(true);
    try {
      const result = await api.submitAnalysis({
        assetId: selectedAsset,
        timeframe: '1d',
      });
      setAnalysisResult(result);
    } catch (err) {
      alert('Analyse fehlgeschlagen: ' + err.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleFeedback = async () => {
    const feedback = prompt('Bitte geben Sie Ihr Feedback ein:');
    if (feedback) {
      try {
        await api.submitFeedback(feedback);
        alert('Feedback gesendet!');
      } catch (err) {
        alert('Fehler beim Senden: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <h2>On-Chain Analyse Dashboard</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Lade Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <h2>On-Chain Analyse Dashboard</h2>
        <div style={{ 
          background: 'rgba(255, 0, 0, 0.1)', 
          border: '1px solid rgba(255, 0, 0, 0.3)', 
          borderRadius: '12px', 
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3>Fehler</h3>
          <p>{error}</p>
          <p>Stellen Sie sicher, dass das Backend unter {process.env.REACT_APP_API_URL || '/api'} erreichbar ist.</p>
        </div>
      </div>
    );
  }

  // Rest des Components bleibt gleich...
  return (
    <div className="page-content">
      <h2>On-Chain Analyse Dashboard</h2>
      
      {/* System-Status */}
      <div style={{ marginBottom: '30px' }}>
        <h3>System-Status</h3>
        <div style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px' 
        }}>
          <p>Min. Score: {config?.minScore}</p>
          <p>Max. Analysen/Stunde: {config?.maxAnalysesPerHour}</p>
          <p>Cache-TTL: {config?.cacheTTL}s</p>
          <p>Unterstützte Blockchains: {config?.supportedChains?.join(', ')}</p>
        </div>
      </div>
      
      {/* Analytics */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Analysen-Statistik</h3>
        <div style={{ 
          background: 'rgba(0, 102, 255, 0.1)', 
          border: '1px solid rgba(0, 102, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px' 
        }}>
          <p>Gesamtanalysen: {analytics?.analytics?.totalAnalyses}</p>
          <p>Erfolgreich: {analytics?.analytics?.successfulAnalyses}</p>
          <p>Fehlgeschlagen: {analytics?.analytics?.failedAnalyses}</p>
          <p>Durchschn. Score: {analytics?.analytics?.averageScore}</p>
        </div>
      </div>
      
      {/* Asset-Auswahl und Analyse */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Asset-Analyse</h3>
        <div style={{ 
          background: 'rgba(0, 153, 204, 0.1)', 
          border: '1px solid rgba(0, 153, 204, 0.3)', 
          borderRadius: '12px', 
          padding: '20px' 
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Asset auswählen:</label>
            <select 
              value={selectedAsset} 
              onChange={(e) => setSelectedAsset(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            >
              <option value="">-- Asset auswählen --</option>
              {assets?.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAnalyze}
            disabled={!selectedAsset || analysisLoading}
            style={{ 
              background: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
              border: 'none', 
              color: 'white', 
              padding: '10px 25px', 
              borderRadius: '25px', 
              cursor: 'pointer', 
              fontFamily: 'Orbitron, sans-serif', 
              fontWeight: '500'
            }}
          >
            {analysisLoading ? 'Analysiere...' : 'Analyse starten'}
          </button>
          
          {analysisResult && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '8px' }}>
              <h4>Ergebnis:</h4>
              <p>Score: {analysisResult.score}</p>
              <p>Zeitstempel: {new Date(analysisResult.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Blockchains */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Unterstützte Blockchains</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          {blockchains?.map(blockchain => (
            <div key={blockchain.id} style={{ 
              background: 'rgba(0, 102, 255, 0.1)', 
              border: '1px solid rgba(0, 102, 255, 0.3)', 
              borderRadius: '12px', 
              padding: '15px', 
              width: '250px' 
            }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff' }}>{blockchain.name}</h4>
              <p style={{ fontSize: '0.9rem', color: '#a0b0c0' }}>Explorer: {blockchain.explorer}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Feedback-Button */}
      <button 
        onClick={handleFeedback}
        style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)', 
          color: '#00d4ff', 
          padding: '10px 25px', 
          borderRadius: '25px', 
          cursor: 'pointer', 
          fontFamily: 'Orbitron, sans-serif', 
          fontWeight: '500'
        }}
      >
        Feedback senden
      </button>
    </div>
  );
}

export default React.memo(Dashboard);
