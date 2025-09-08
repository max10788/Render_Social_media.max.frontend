import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import TokenOverview from '../components/ui/TokenOverview';
import WalletAnalyses from '../components/ui/WalletAnalyses';
import ScanJobs from '../components/ui/ScanJobs';
import './ContractRadar.css';

const ContractRadar = () => {
  const [activeTab, setActiveTab] = useState('radar');

  return (
    <div className="contract-radar-page">
      <div className="page-header">
        <h1>Smart Contract Radar</h1>
        <p>Real-time tracking of small-cap token transactions by wallet category</p>
      </div>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'radar' ? 'active' : ''}`}
          onClick={() => setActiveTab('radar')}
        >
          Radar
        </button>
        <button 
          className={`tab-button ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          Token-Übersicht
        </button>
        <button 
          className={`tab-button ${activeTab === 'wallets' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallets')}
        >
          Wallet-Analysen
        </button>
        <button 
          className={`tab-button ${activeTab === 'scans' ? 'active' : ''}`}
          onClick={() => setActiveTab('scans')}
        >
          Scan-Jobs
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'radar' && <Radar />}
        {activeTab === 'tokens' && <TokenOverview />}
        {activeTab === 'wallets' && <WalletAnalyses />}
        {activeTab === 'scans' && <ScanJobs />}
      </div>
      
      <div className="radar-info">
        <h3>How it works</h3>
        <p>This radar tracks transactions for small-cap tokens in real-time, categorizing wallets as:</p>
        <ul>
          <li><strong>Whales:</strong> Large holders with significant market influence</li>
          <li><strong>Smart Money:</strong> Historically profitable wallets</li>
          <li><strong>Retail:</strong> Regular individual investors</li>
          <li><strong>Bots:</strong> Automated trading algorithms</li>
        </ul>
        <p>Each point represents a transaction, with distance from center indicating recency.</p>
      </div>
    </div>
  );
};

export default ContractRadar;
