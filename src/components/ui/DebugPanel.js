import React, { useState } from 'react';

const DebugPanel = ({ rawAnalysis, radarData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('raw');

  if (!rawAnalysis && !radarData) return null;

  const styles = {
    container: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px'
    },
    button: {
      background: '#1e293b',
      color: '#10b981',
      border: '1px solid #10b981',
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    },
    panel: {
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '12px',
      width: '600px',
      maxHeight: '600px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      marginBottom: '10px'
    },
    header: {
      background: '#1e293b',
      padding: '12px 16px',
      borderBottom: '1px solid #334155',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      color: '#10b981',
      margin: 0,
      fontSize: '14px',
      fontWeight: 'bold'
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: '#94a3b8',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0 8px'
    },
    tabs: {
      display: 'flex',
      background: '#1e293b',
      borderBottom: '1px solid #334155'
    },
    tab: (active) => ({
      flex: 1,
      padding: '8px 16px',
      background: active ? '#0f172a' : 'transparent',
      color: active ? '#10b981' : '#94a3b8',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: active ? 'bold' : 'normal'
    }),
    content: {
      padding: '16px',
      maxHeight: '500px',
      overflowY: 'auto',
      color: '#e2e8f0'
    },
    pre: {
      margin: 0,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    },
    stat: {
      marginBottom: '12px',
      padding: '8px',
      background: '#1e293b',
      borderRadius: '6px',
      borderLeft: '3px solid #10b981'
    },
    statLabel: {
      color: '#94a3b8',
      fontSize: '11px',
      marginBottom: '4px'
    },
    statValue: {
      color: '#e2e8f0',
      fontSize: '13px',
      fontWeight: 'bold'
    },
    badge: (type) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      marginRight: '4px',
      background: type === 'success' ? '#10b98120' : type === 'error' ? '#ef444420' : '#f59e0b20',
      color: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b',
      border: `1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'}`
    })
  };

  const renderRawData = () => (
    <div style={styles.content}>
      <div style={styles.stat}>
        <div style={styles.statLabel}>Request Status</div>
        <div style={styles.statValue}>
          <span style={styles.badge(rawAnalysis?.success ? 'success' : 'error')}>
            {rawAnalysis?.success ? '✓ SUCCESS' : '✗ FAILED'}
          </span>
        </div>
      </div>

      <div style={styles.stat}>
        <div style={styles.statLabel}>Token Address</div>
        <div style={styles.statValue}>{rawAnalysis?.token_address || 'N/A'}</div>
      </div>

      <div style={styles.stat}>
        <div style={styles.statLabel}>Chain</div>
        <div style={styles.statValue}>{rawAnalysis?.chain || 'N/A'}</div>
      </div>

      <div style={styles.stat}>
        <div style={styles.statLabel}>Wallet Source</div>
        <div style={styles.statValue}>
          {rawAnalysis?.wallet_source || 'N/A'}
          {rawAnalysis?.recent_hours && ` (${rawAnalysis.recent_hours}h)`}
        </div>
      </div>

      <div style={styles.stat}>
        <div style={styles.statLabel}>Full Response (JSON)</div>
        <pre style={styles.pre}>
          {JSON.stringify(rawAnalysis, null, 2)}
        </pre>
      </div>
    </div>
  );

  const renderTransformedData = () => {
    if (!radarData) {
      return <div style={styles.content}>No transformed data available</div>;
    }

    const walletsByType = {};
    radarData.wallets?.forEach(w => {
      const type = w.wallet_type || 'UNKNOWN';
      walletsByType[type] = (walletsByType[type] || 0) + 1;
    });

    return (
      <div style={styles.content}>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Token Info</div>
          <div style={styles.statValue}>
            {radarData.tokenInfo?.name} ({radarData.tokenInfo?.symbol})
          </div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statLabel}>Overall Score</div>
          <div style={styles.statValue}>{radarData.score}/100</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statLabel}>Total Wallets</div>
          <div style={styles.statValue}>{radarData.wallets?.length || 0}</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statLabel}>Wallet Distribution</div>
          <div style={styles.statValue}>
            {Object.entries(walletsByType).map(([type, count]) => (
              <div key={type}>
                <span style={styles.badge('warning')}>{type}</span>
                {count} wallets
              </div>
            ))}
          </div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statLabel}>Statistics</div>
          <pre style={styles.pre}>
            {JSON.stringify(radarData.statistics, null, 2)}
          </pre>
        </div>

        <div style={styles.stat}>
          <div style={styles.statLabel}>Sample Wallet</div>
          <pre style={styles.pre}>
            {JSON.stringify(radarData.wallets?.[0], null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const renderWalletList = () => (
    <div style={styles.content}>
      {radarData?.wallets?.map((wallet, idx) => (
        <div key={idx} style={styles.stat}>
          <div style={styles.statLabel}>
            Wallet {idx + 1}
            <span style={styles.badge('success')}>Stage {wallet.stage}</span>
          </div>
          <div style={styles.statValue}>
            <div>{wallet.wallet_address}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Type: {wallet.wallet_type} | 
              Risk: {wallet.risk_score} | 
              Confidence: {(wallet.confidence_score * 100).toFixed(1)}% |
              Txs: {wallet.transaction_count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      {isExpanded && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <h3 style={styles.title}>🔍 API Debug Panel</h3>
            <button 
              style={styles.closeButton}
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>
          
          <div style={styles.tabs}>
            <button 
              style={styles.tab(activeTab === 'raw')}
              onClick={() => setActiveTab('raw')}
            >
              Raw Response
            </button>
            <button 
              style={styles.tab(activeTab === 'transformed')}
              onClick={() => setActiveTab('transformed')}
            >
              Transformed Data
            </button>
            <button 
              style={styles.tab(activeTab === 'wallets')}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets ({radarData?.wallets?.length || 0})
            </button>
          </div>

          {activeTab === 'raw' && renderRawData()}
          {activeTab === 'transformed' && renderTransformedData()}
          {activeTab === 'wallets' && renderWalletList()}
        </div>
      )}
      
      <button 
        style={styles.button}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▼' : '▲'} Debug
      </button>
    </div>
  );
};

export default DebugPanel;
