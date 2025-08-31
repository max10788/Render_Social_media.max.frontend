import React, { useState, useEffect } from 'react';
import '../App.css';

function Dashboard() {
  // Mock-Daten statt API-Aufrufe
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [assets, setAssets] = useState(null);
  const [blockchains, setBlockchains] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Status für Analyse
  const [selectedAsset, setSelectedAsset] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Mock-Daten laden
  useEffect(() => {
    // Simuliere API-Aufrufe mit setTimeout
    setTimeout(() => {
      setConfig({
        minScore: 0.5,
        maxAnalysesPerHour: 100,
        cacheTTL: 300,
        supportedChains: ['Ethereum', 'Solana', 'Sui']
      });
      
      setAnalytics({
        analytics: {
          totalAnalyses: 1250,
          successfulAnalyses: 1180,
          failedAnalyses: 70,
          averageScore: 0.78
        },
        status: 'ok'
      });
      
      setAssets([
        { id: 'btc', name: 'Bitcoin', symbol: 'BTC', blockchain: 'Bitcoin' },
        { id: 'eth', name: 'Ethereum', symbol: 'ETH', blockchain: 'Ethereum' },
        { id: 'sol', name: 'Solana', symbol: 'SOL', blockchain: 'Solana' },
        { id: 'sui', name: 'Sui', symbol: 'SUI', blockchain: 'Sui' }
      ]);
      
      setBlockchains([
        { id: 'eth', name: 'Ethereum', rpcUrl: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID', explorer: 'https://etherscan.io' },
        { id: 'sol', name: 'Solana', rpcUrl: 'https://api.mainnet-beta.solana.com', explorer: 'https://explorer.solana.com' },
        { id: 'sui', name: 'Sui', rpcUrl: 'https://fullnode.mainnet.sui.io:443', explorer: 'https://explorer.sui.io' }
      ]);
      
      setLoading(false);
    }, 1000); // 1 Sekunde Verzögerung zum Simulieren von Ladezeiten
  }, []);

  // Analyse durchführen (Mock)
  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    
    setAnalysisLoading(true);
    
    // Simuliere API-Aufruf
    setTimeout(() => {
      setAnalysisResult({
        analysisId: `analysis-${Date.now()}`,
        score: Math.random().toFixed(2),
        result: { status: 'completed' },
        timestamp: new Date().toISOString()
      });
      setAnalysisLoading(false);
    }, 1500);
  };

  // Feedback senden (Mock)
  const handleFeedback = () => {
    const feedback = prompt('Bitte geben Sie Ihr Feedback ein:');
    if (feedback) {
      alert('Feedback gesendet! Vielen Dank.');
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <h2>On-Chain Analyse Dashboard</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Lade Dashboard...</p>
        </div>
      </div>
    );
  }

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
