import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import SingleQuiz from '../../components/exercises/SingleQuiz';

const Module04_ServiceMuster = () => {
  const [quizComplete, setQuizComplete] = useState(false);

  const serviceQuiz = {
    question: "Eine Adresse hat 10.000+ NFT-Transfers, empfängt 2.5% Fee von jedem Trade, und ist 24/7 aktiv. Was ist das?",
    options: [
      "Ein NFT-Sammler",
      "Ein Bot",
      "Ein NFT-Marketplace (z.B. OpenSea)",
      "Ein Airdrop"
    ],
    correctIndex: 2,
    explanation: "Richtig! Das ist ein NFT-Marketplace Contract. Die 2.5% Fee und die massive Anzahl an Transfers sind typisch für Marketplaces wie OpenSea oder Blur."
  };

  return (
    <div className="module-container">
      <header className="module-header-section">
        <div className="module-icon-large">🏪</div>
        <h1 className="module-title">Service-Muster erkennen</h1>
        <p className="module-subtitle">
          Unterscheide Börsen, DeFi-Protokolle, NFT-Marketplaces und andere Services
        </p>
      </header>

      <section className="content-section">
        <span className="section-label">Übersicht</span>
        <h2>🎯 Service-Kategorien</h2>

        <div className="application-overview">
          <div className="app-category">
            <div className="category-icon">🏦</div>
            <h4>Exchanges</h4>
            <p>Centralized Exchanges (CEX)</p>
          </div>
          <div className="app-category">
            <div className="category-icon">🔄</div>
            <h4>DeFi</h4>
            <p>DEXs, Lending, Staking</p>
          </div>
          <div className="app-category">
            <div className="category-icon">🖼️</div>
            <h4>NFT</h4>
            <p>Marketplaces & Collections</p>
          </div>
          <div className="app-category">
            <div className="category-icon">🌉</div>
            <h4>Bridges</h4>
            <p>Cross-Chain Transfers</p>
          </div>
          <div className="app-category">
            <div className="category-icon">👛</div>
            <h4>Wallets</h4>
            <p>Smart Contract Wallets</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">CEX vs DEX</span>
        <h2>🏦 Börsen-Muster</h2>

        <div className="comparison-container">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">🏦</span>
              <h3>Centralized Exchange (CEX)</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>Hot Wallet:</strong> Sehr hoher Wert (Millionen-Milliarden)</li>
              <li><strong>Aktivität:</strong> 1000+ Transaktionen/Tag</li>
              <li><strong>Flow:</strong> Viele kleine Inflows, wenige große Outflows</li>
              <li><strong>Tokens:</strong> Hunderte verschiedene Tokens</li>
              <li><strong>Timing:</strong> 24/7 aktiv, keine Pausen</li>
            </ul>
            <div className="layer-example">
              <strong>Beispiele:</strong> Binance, Coinbase, Kraken, OKX
            </div>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">🔄</span>
              <h3>Decentralized Exchange (DEX)</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>Contract-basiert:</strong> Kein "Owner", nur Code</li>
              <li><strong>Liquidity Pools:</strong> User locken Tokens</li>
              <li><strong>Swaps:</strong> TokenA ↔ TokenB direkt on-chain</li>
              <li><strong>Fees:</strong> 0.3% (Uniswap), 0.05% (Curve), etc.</li>
              <li><strong>Transparenz:</strong> Alles öffentlich einsehbar</li>
            </ul>
            <div className="layer-example">
              <strong>Beispiele:</strong> Uniswap, Curve, Balancer, SushiSwap
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">DeFi-Muster</span>
        <h2>💎 DeFi-Protokoll Muster</h2>

        <div className="security-layers">
          <div className="security-layer">
            <div className="layer-number">1</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">🏊</span>
                <h4>Liquidity Pool (LP)</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                Ein Contract hält zwei Tokens (z.B. ETH/USDC) und erlaubt Swaps
              </p>
              <div className="layer-example">
                <strong>Muster:</strong> Viele Swap-Transaktionen, Mint/Burn von LP-Tokens, Fee-Sammlung
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">2</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">💰</span>
                <h4>Lending Protocol</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                User leihen und verleihen Assets (z.B. Aave, Compound)
              </p>
              <div className="layer-example">
                <strong>Muster:</strong> Deposit/Withdraw, Borrow/Repay, Liquidations, Interest accrual
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">3</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">🎰</span>
                <h4>Staking Contract</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                User locken Tokens, erhalten Rewards
              </p>
              <div className="layer-example">
                <strong>Muster:</strong> Stake/Unstake, Reward Claims, Lock-Periods
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">NFT-Muster</span>
        <h2>🖼️ NFT-Marketplace & Collections</h2>

        <div className="nft-comparison">
          <div className="nft-col non-fungible">
            <h5>NFT Marketplace</h5>
            <div style={{ fontSize: '3rem', margin: '1rem 0' }}>🏪</div>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              <strong>Muster:</strong>
            </p>
            <ul style={{ textAlign: 'left', color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>Tausende NFT-Transfers</li>
              <li>WETH ↔ NFT Swaps</li>
              <li>2.5% Fee Collection</li>
              <li>Bid/Ask Matching</li>
            </ul>
            <div className="nft-note">
              Beispiele: OpenSea, Blur, LooksRare
            </div>
          </div>

          <div className="nft-col fungible">
            <h5>NFT Collection</h5>
            <div style={{ fontSize: '3rem', margin: '1rem 0' }}>🎨</div>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              <strong>Muster:</strong>
            </p>
            <ul style={{ textAlign: 'left', color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>Mint-Event (viele Mints auf einmal)</li>
              <li>ERC-721 Token Contract</li>
              <li>Royalty Payments</li>
              <li>Metadata URI</li>
            </ul>
            <div className="nft-note">
              Beispiele: BAYC, CryptoPunks, Azuki
            </div>
          </div>
        </div>

        <ConceptBox title="Pro-Tipp: Marketplace Detection" type="info">
          <p>
            Wenn du eine Adresse siehst, die:
          </p>
          <ul>
            <li>✅ 10.000+ NFT-Transfers hat</li>
            <li>✅ Von vielen verschiedenen Collections</li>
            <li>✅ Immer einen kleinen % Fee sammelt</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            → Das ist mit 99% Wahrscheinlichkeit ein <strong>NFT Marketplace Contract</strong>
          </p>
        </ConceptBox>
      </section>

      <section className="content-section">
        <span className="section-label">Bridge-Muster</span>
        <h2>🌉 Cross-Chain Bridges</h2>

        <div className="story-card">
          <p className="story-text">
            <strong>Bridges</strong> verbinden verschiedene Blockchains (z.B. Ethereum ↔ Arbitrum)
          </p>
          <p className="story-text">
            <strong>Typisches Muster:</strong>
          </p>
          <ul style={{ color: '#cbd5e1' }}>
            <li>User deposited auf Ethereum → Contract locked Tokens</li>
            <li>Contract auf Ziel-Chain (Arbitrum) mintet gleichen Betrag</li>
            <li>Bei Withdraw: Tokens auf Ziel-Chain burned, auf Source-Chain unlocked</li>
          </ul>
          <p className="story-highlight">
            🌉 Bridges haben massive Lock-Werte (oft Milliarden) und sehr hohe Transaktions-Counts
          </p>
        </div>

        <div className="scenario-cards">
          <div className="scenario-card">
            <div className="scenario-icon">🌉</div>
            <h4>Arbitrum Bridge</h4>
            <p style={{ color: '#cbd5e1' }}>
              <strong>Muster:</strong>
            </p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>Deposit: ETH → Arbitrum ETH</li>
              <li>Withdraw: Arbitrum ETH → ETH (7 Tage Wait)</li>
              <li>Massive TVL ($2B+)</li>
            </ul>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🌉</div>
            <h4>Hop Protocol</h4>
            <p style={{ color: '#cbd5e1' }}>
              <strong>Muster:</strong>
            </p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>Fast bridges zwischen L2s</li>
              <li>Liquidity Pools auf jeder Chain</li>
              <li>AMM-basiert</li>
            </ul>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🌉</div>
            <h4>Stargate</h4>
            <p style={{ color: '#cbd5e1' }}>
              <strong>Muster:</strong>
            </p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>LayerZero-basiert</li>
              <li>Multi-Chain Swaps</li>
              <li>Delta Algorithm</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Quiz</span>
        <h2>🧩 Service-Erkennung Test</h2>

        <SingleQuiz
          question={serviceQuiz.question}
          options={serviceQuiz.options}
          correctIndex={serviceQuiz.correctIndex}
          explanation={serviceQuiz.explanation}
          onComplete={() => setQuizComplete(true)}
        />

        {quizComplete && (
          <ConceptBox title="Hervorragend! 🎉" type="success">
            <p>
              Du kannst jetzt verschiedene Service-Typen unterscheiden! 
              Im nächsten Modul lernst du <strong>Analyse-Workflows</strong> – 
              wie gehst du systematisch vor, um eine Wallet zu analysieren?
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="content-section">
        <span className="section-label">Zusammenfassung</span>
        <h2>📝 Service-Erkennungs-Cheatsheet</h2>
        
        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">🏦</div>
            <div className="takeaway-content">
              <h4>CEX</h4>
              <p>Viele Inflows, wenige Outflows, Millionen $, 24/7</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🔄</div>
            <div className="takeaway-content">
              <h4>DEX</h4>
              <p>Swap-Pattern, LP-Tokens, Fee-Collection</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🖼️</div>
            <div className="takeaway-content">
              <h4>NFT Marketplace</h4>
              <p>10.000+ NFT Transfers, 2.5% Fees</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🌉</div>
            <div className="takeaway-content">
              <h4>Bridge</h4>
              <p>Lock/Unlock, Mint/Burn, massive TVL</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">💰</div>
            <div className="takeaway-content">
              <h4>Lending</h4>
              <p>Deposit/Borrow/Liquidation Pattern</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🎰</div>
            <div className="takeaway-content">
              <h4>Staking</h4>
              <p>Stake/Unstake, Reward Claims</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module04_ServiceMuster;
