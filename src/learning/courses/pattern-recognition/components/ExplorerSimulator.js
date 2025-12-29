import React, { useState } from 'react';
import './ExplorerSimulator.css';

const ExplorerSimulator = ({ onComplete }) => {
  const [currentCase, setCurrentCase] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const cases = [
    {
      id: 1,
      address: "0xBinance8...",
      tag: "Binance: Hot Wallet 8",
      overview: {
        balance: "12,543 ETH",
        txCount: "45,823",
        created: "Block 8,234,567"
      },
      recentTx: [
        { from: "0xUser123...", to: "0xBinance8...", value: "2.5 ETH", type: "IN" },
        { from: "0xUser456...", to: "0xBinance8...", value: "1.2 ETH", type: "IN" },
        { from: "0xUser789...", to: "0xBinance8...", value: "0.8 ETH", type: "IN" },
        { from: "0xUserABC...", to: "0xBinance8...", value: "5.0 ETH", type: "IN" },
        { from: "0xBinance8...", to: "0xBinance_Cold...", value: "500 ETH", type: "OUT" }
      ],
      tabs: {
        transactions: "45,823",
        internalTx: "128",
        erc20: "8,234",
        nftTransfers: "0"
      },
      question: "Was für ein Service ist das?",
      options: ["Börse", "DeFi Contract", "NFT Marketplace"],
      correct: 0,
      explanation: "Perfekt! Das ist eindeutig eine Börse: Explorer-Tag 'Binance', sehr viele Transaktionen (45k+), fast nur Eingänge, ein großer Ausgang (Konsolidierung zu Cold Wallet)."
    },
    {
      id: 2,
      address: "0xUniswap_V2...",
      tag: "Uniswap V2: Router 2",
      overview: {
        balance: "234 ETH",
        txCount: "2,345,678",
        created: "Block 10,207,858"
      },
      recentTx: [
        { from: "0xTrader1...", to: "0xUniswap_V2...", value: "1 ETH", type: "IN", note: "Swap" },
        { from: "0xUniswap_V2...", to: "0xTrader1...", value: "0 ETH", type: "OUT", note: "Token Transfer" }
      ],
      tabs: {
        transactions: "2,345,678",
        internalTx: "15,234",
        erc20: "4,567,890",
        nftTransfers: "0"
      },
      internalTxCount: 8,
      logsCount: 12,
      question: "Welcher Service-Typ ist das?",
      options: ["Börse", "DeFi Contract", "NFT Marketplace"],
      correct: 1,
      explanation: "Richtig! Das ist DeFi: Contract-Name 'Uniswap', sehr viele Internal Transactions, hohe ERC-20 Token Activity, Logs zeigen 'Swap' Events."
    },
    {
      id: 3,
      address: "0xOpenSea_Seaport...",
      tag: "OpenSea: Seaport 1.5",
      overview: {
        balance: "89 ETH",
        txCount: "892,345",
        created: "Block 15,456,789"
      },
      recentTx: [
        { from: "0xBuyer1...", to: "0xOpenSea_Seaport...", value: "50 ETH", type: "IN", note: "NFT Purchase" },
        { from: "0xContract_NFT...", to: "0xBuyer1...", value: "0 ETH", type: "OUT", note: "NFT #1234" }
      ],
      tabs: {
        transactions: "892,345",
        internalTx: "5,432",
        erc20: "123,456",
        nftTransfers: "567,890"
      },
      logsCount: 15,
      nftDetails: "ERC-721 Transfer: Bored Ape #1234",
      question: "Welcher Service ist das?",
      options: ["Börse", "DeFi Contract", "NFT Marketplace"],
      correct: 2,
      explanation: "Genau! Das ist ein NFT-Marketplace: Explorer-Tag 'OpenSea', sehr hohe NFT Transfers (567k), Logs zeigen NFT-Sales, kombinierte ETH + NFT Bewegungen."
    }
  ];

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
    
    if (answerIndex === cases[currentCase].correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentCase < cases.length - 1) {
      setCurrentCase(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      if (onComplete) onComplete();
    }
  };

  const caseData = cases[currentCase];
  const isCorrect = selectedAnswer === caseData.correct;
  const isLast = currentCase === cases.length - 1;

  return (
    <div className="explorer-simulator">
      <div className="simulator-progress">
        <div className="progress-label">
          Fall {currentCase + 1} von {cases.length}
        </div>
        <div className="progress-dots">
          {cases.map((_, idx) => (
            <div 
              key={idx} 
              className={`progress-dot ${idx <= currentCase ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="explorer-mock">
        {/* Header */}
        <div className="explorer-header">
          <div className="explorer-logo">🔍 BlockExplorer</div>
          <div className="explorer-search">
            <input 
              type="text" 
              value={caseData.address} 
              readOnly 
              className="explorer-search-input"
            />
          </div>
        </div>

        {/* Address Info */}
        <div className="address-info-section">
          <div className="address-title">
            <h3>Address</h3>
            {caseData.tag && (
              <span className="address-tag">{caseData.tag}</span>
            )}
          </div>
          <div className="address-hash">{caseData.address}</div>
        </div>

        {/* Overview */}
        <div className="explorer-overview">
          <div className="overview-item">
            <span className="overview-label">Balance:</span>
            <span className="overview-value">{caseData.overview.balance}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Transactions:</span>
            <span className="overview-value highlight">{caseData.overview.txCount}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">First Seen:</span>
            <span className="overview-value">{caseData.overview.created}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="explorer-tabs">
          <button className="explorer-tab active">
            Transactions <span className="tab-count">{caseData.tabs.transactions}</span>
          </button>
          <button className="explorer-tab">
            Internal Txns <span className="tab-count">{caseData.tabs.internalTx}</span>
          </button>
          <button className="explorer-tab">
            ERC-20 Txns <span className="tab-count">{caseData.tabs.erc20}</span>
          </button>
          <button className="explorer-tab">
            NFT Transfers <span className="tab-count">{caseData.tabs.nftTransfers}</span>
          </button>
        </div>

        {/* Transaction List */}
        <div className="transaction-list">
          <div className="tx-list-header">
            <div>From</div>
            <div></div>
            <div>To</div>
            <div>Value</div>
          </div>
          {caseData.recentTx.map((tx, idx) => (
            <div key={idx} className={`tx-list-row ${tx.type.toLowerCase()}`}>
              <div className="tx-address">{tx.from}</div>
              <div className="tx-arrow">
                {tx.type === 'IN' ? '→' : '←'}
              </div>
              <div className="tx-address">{tx.to}</div>
              <div className="tx-value">
                {tx.value}
                {tx.note && <div className="tx-note">{tx.note}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        {caseData.internalTxCount && (
          <div className="additional-info">
            <div className="info-badge">
              ⚙️ Internal Transactions: {caseData.internalTxCount}
            </div>
            <div className="info-badge">
              📜 Logs/Events: {caseData.logsCount}
            </div>
          </div>
        )}

        {caseData.nftDetails && (
          <div className="additional-info">
            <div className="info-badge nft">
              🎨 {caseData.nftDetails}
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="simulator-question">
        <h4>{caseData.question}</h4>
        <div className="simulator-options">
          {caseData.options.map((option, idx) => (
            <button
              key={idx}
              className={`simulator-option ${
                selectedAnswer === idx ? 'selected' : ''
              } ${
                showFeedback && idx === caseData.correct ? 'correct' : ''
              } ${
                showFeedback && selectedAnswer === idx && idx !== caseData.correct ? 'incorrect' : ''
              }`}
              onClick={() => !showFeedback && handleAnswer(idx)}
              disabled={showFeedback}
            >
              <span className="option-icon">
                {idx === 0 && '🏦'}
                {idx === 1 && '⚙️'}
                {idx === 2 && '🎨'}
              </span>
              {option}
              {showFeedback && idx === caseData.correct && (
                <span className="check-icon">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`simulator-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-icon">
            {isCorrect ? '✅' : '❌'}
          </div>
          <div className="feedback-text">
            <h4>{isCorrect ? 'Richtig!' : 'Nicht ganz...'}</h4>
            <p>{caseData.explanation}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {showFeedback && (
        <div className="simulator-actions">
          <button 
            className="btn-primary"
            onClick={handleNext}
          >
            {isLast ? 'Abschließen' : 'Nächster Fall'} →
          </button>
        </div>
      )}

      {/* Final Score */}
      {isLast && showFeedback && (
        <div className="simulator-score">
          <div className="score-icon">🎯</div>
          <div className="score-content">
            <strong>Dein Ergebnis:</strong> {correctCount} von {cases.length} richtig
            {correctCount === cases.length && (
              <div className="perfect-badge">🌟 Perfekt!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorerSimulator;
