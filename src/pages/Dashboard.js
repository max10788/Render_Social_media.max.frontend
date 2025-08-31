import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useApi, usePollingApi } from '../hooks/useApi';
import { BLOCKCHAIN_CONFIG } from '../config/api';
import '../App.css';

function Dashboard() {
  // Systemdaten mit Polling für Echtzeit-Updates
  const { data: config, loading: configLoading, error: configError } = useApi(
    () => apiService.getConfig()
  );
  
  const { data: analytics, loading: analyticsLoading } = usePollingApi(
    () => apiService.getAnalytics(),
    30000 // Alle 30 Sekunden aktualisieren
  );
  
  const { data: assets, loading: assetsLoading } = useApi(
    () => apiService.getAssets()
  );
  
  const { data: blockchains, loading: blockchainsLoading } = useApi(
    () => apiService.getBlockchains()
  );

  // Status für Analyse
  const [selectedAsset, setSelectedAsset] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // Einstellungen laden
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await apiService.getSettings();
        setSettings(settingsData.settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Analyse durchführen
  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    
    setAnalysisLoading(true);
    try {
      const result = await apiService.submitAnalysis({
        assetId: selectedAsset,
        timeframe: '1d',
      });
      setAnalysisResult(result);
    } catch (error) {
      alert('Analyse fehlgeschlagen: ' + error.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Einstellungen aktualisieren
  const handleSettingsUpdate = async (newSettings) => {
    try {
      await apiService.updateSettings(newSettings);
      setSettings({ ...settings, ...newSettings });
      alert('Einstellungen gespeichert!');
    } catch (error) {
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  // Feedback senden
  const handleFeedback = async () => {
    const feedback = prompt('Bitte geben Sie Ihr Feedback ein:');
    if (feedback) {
      try {
        await apiService.submitFeedback(feedback);
        alert('Feedback gesendet!');
      } catch (error) {
        alert('Fehler beim Senden: ' + error.message);
      }
    }
  };

  // Blockchain-Explorer öffnen
  const openExplorer = (chainId) => {
    const config = BLOCKCHAIN_CONFIG[chainId.toUpperCase()];
    if (config?.explorer) {
      window.open(config.explorer, '_blank');
    }
  };

  return (
    <div className="page-content">
      <h2>On-Chain Analyse Dashboard</h2>
      
      {/* System-Status */}
      <div style={{ marginBottom: '30px' }}>
        <h3>System-Status</h3>
        {configLoading ? (
          <p>Lade Konfiguration...</p>
        ) : configError ? (
          <p>Fehler: {configError.message}</p>
        ) : (
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
        )}
      </div>
      
      {/* Analytics */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Analysen-Statistik {analyticsLoading && '(Aktualisiere...)'}</h3>
        {analytics && (
          <div style={{ 
            background: 'rgba(0, 102, 255, 0.1)', 
            border: '1px solid rgba(0, 102, 255, 0.3)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <p>Gesamtanalysen: {analytics.analytics.totalAnalyses}</p>
            <p>Erfolgreich: {analytics.analytics.successfulAnalyses}</p>
            <p>Fehlgeschlagen: {analytics.analytics.failedAnalyses}</p>
            <p>Durchschn. Score: {analytics.analytics.averageScore}</p>
          </div>
        )}
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
              width: '250px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onClick={() => openExplorer(blockchain.id)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff' }}>
                {blockchain.name}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#a0b0c0' }}>
                Blockzeit: {blockchain.block_time}s
              </p>
              <p style={{ fontSize: '0.8rem', color: '#00d4ff', marginTop: '10px' }}>
                Explorer öffnen →
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Einstellungen */}
      {settings && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Einstellungen</h3>
          <div style={{ 
            background: 'rgba(0, 153, 204, 0.1)', 
            border: '1px solid rgba(0, 153, 204, 0.3)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingsUpdate({ notifications: e.target.checked })}
                />
                Benachrichtigungen aktivieren
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingsUpdate({ autoRefresh: e.target.checked })}
                />
                Automatische Aktualisierung
              </label>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Aktualisierungsintervall (Sekunden):
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingsUpdate({ refreshInterval: parseInt(e.target.value) })}
                style={{ 
                  width: '100px', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid rgba(0, 212, 255, 0.3)', 
                  background: 'rgba(10, 14, 39, 0.7)', 
                  color: '#e0e6ed'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
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
