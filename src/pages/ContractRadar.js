import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import TokenOverview from './TokenOverview';
import WalletAnalyses from './WalletAnalyses';
import ScanJobs from './ScanJobs';
import './ContractRadar.css';

const ContractRadar = () => {
  const [activeTab, setActiveTab] = useState('radar');
  
  return (
    <div className="contract-radar-page">
      <div className="page-header">
        <h1>Smart Contract Radar</h1>
        <p>Real-time tracking of small-cap token transactions by wallet category</p>
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
