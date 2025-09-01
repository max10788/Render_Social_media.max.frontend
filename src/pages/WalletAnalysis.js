// src/pages/WalletAnalysis.js
import React, { useState } from 'react';
import { useCryptoTracker } from '../hooks/useCryptoTracker'; // Updated import path

const WalletAnalysis = () => {
  const [address, setAddress] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const { analyzeWallet, loading, error } = useCryptoTracker();

  const handleAnalyze = async () => {
    const result = await analyzeWallet(address);
    if (result) {
      setAnalysis(result);
    }
  };

  return (
    <div className="page-container">
      <h1>Wallet Analysis</h1>
      
      <div className="controls">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter wallet address"
        />
        <button onClick={handleAnalyze} disabled={loading || !address}>
          {loading ? 'Analyzing...' : 'Analyze Wallet'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {analysis && (
        <div className="analysis-results">
          <h2>Analysis Results</h2>
          <div className="result-item">
            <span className="label">Risk Score:</span>
            <span className="value">{analysis.risk_score}</span>
          </div>
          <div className="result-item">
            <span className="label">Entity Type:</span>
            <span className="value">{analysis.entity_type}</span>
          </div>
          <div className="result-item">
            <span className="label">Labels:</span>
            <span className="value">{analysis.labels.join(', ')}</span>
          </div>
          <div className="result-item">
            <span className="label">Transaction Count:</span>
            <span className="value">{analysis.transaction_count}</span>
          </div>
          <div className="result-item">
            <span className="label">Total Value:</span>
            <span className="value">{analysis.total_value}</span>
          </div>
          <div className="result-item">
            <span className="label">First Activity:</span>
            <span className="value">{analysis.first_activity}</span>
          </div>
          <div className="result-item">
            <span className="label">Last Activity:</span>
            <span className="value">{analysis.last_activity}</span>
          </div>
          <div className="result-item">
            <span className="label">Associated Entities:</span>
            <span className="value">{analysis.associated_entities.join(', ')}</span>
          </div>
          <div className="result-item">
            <span className="label">Compliance Flags:</span>
            <span className="value">{analysis.compliance_flags.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletAnalysis;
