import React, { useState } from 'react';
import '../shared/Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import SingleQuiz from '../../components/exercises/SingleQuiz';

const Module05_AnalyseWorkflows = () => {
  const [quizComplete, setQuizComplete] = useState(false);

  const workflowQuiz = {
    question: "Du analysierst eine neue Wallet. Was ist der BESTE erste Schritt?",
    options: [
      "Sofort alle Transaktionen im Detail prüfen",
      "Einen High-Level Überblick verschaffen: Alter, Wert, Aktivität, häufigste Interaktionen",
      "Nach Cluster-Verbindungen suchen",
      "Die neueste Transaktion analysieren"
    ],
    correctIndex: 1,
    explanation: "Richtig! Start always with the BIG PICTURE. Verschaffe dir einen High-Level Überblick, bevor du in Details gehst. Das spart Zeit und gibt Kontext."
  };

  return (
    <div className="module-container">
      <header className="module-header-section">
        <div className="module-icon-large">🔬</div>
        <h1 className="module-title">Analyse-Workflows</h1>
        <p className="module-subtitle">
          Systematisch vorgehen: Von der ersten Adresse bis zur vollständigen Analyse
        </p>
      </header>

      <section className="content-section">
        <span className="section-label">Methodik</span>
        <h2>🎯 Der systematische Ansatz</h2>

        <ConceptBox title="Warum ein Workflow?" type="info">
          <p>
            Ohne System analysierst du chaotisch: Du springst zwischen Transaktionen hin und her, 
            verlierst den Überblick, und übersiehst wichtige Muster.
          </p>
          <p style={{ marginTop: '1rem' }}>
            <strong>Mit einem klaren Workflow:</strong>
          </p>
          <ul>
            <li>✅ Du gehst strukturiert vor</li>
            <li>✅ Du übersiehst nichts Wichtiges</li>
            <li>✅ Du sparst Zeit</li>
            <li>✅ Du kannst deine Findings dokumentieren</li>
          </ul>
        </ConceptBox>
      </section>

      <section className="content-section">
        <span className="section-label">5-Schritte-Prozess</span>
        <h2>📋 Der Standard-Analyse-Workflow</h2>

        <div className="supply-chain-steps">
          <div className="sc-step">
            <div className="sc-number">1</div>
            <div className="sc-content">
              <h5>High-Level Overview</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Wallet Age, Balance, TX Count, Active Days
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">2</div>
            <div className="sc-content">
              <h5>Activity Pattern</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Frequency, Timing, Value Distribution
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">3</div>
            <div className="sc-content">
              <h5>Interaction Analysis</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Welche Contracts? Welche Tokens?
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">4</div>
            <div className="sc-content">
              <h5>Funding & Outflows</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Woher kommt das Geld? Wohin geht es?
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">5</div>
            <div className="sc-content">
              <h5>Cluster Detection</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Verbindungen zu anderen Wallets?
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <ConceptBox title="⚡ Quick-Win Tipp" type="practice">
            <p>
              Für 80% der Fälle reichen die ersten 3 Schritte! 
              Cluster-Analyse brauchst du nur bei suspected Sybils oder Fraud-Cases.
            </p>
          </ConceptBox>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Schritt 1</span>
        <h2>📊 High-Level Overview</h2>

        <div className="security-layers">
          <div className="security-layer">
            <div className="layer-number">🔍</div>
            <div className="layer-content">
              <div className="layer-header">
                <h4>Was du checken solltest:</h4>
              </div>
              <ul style={{ color: '#cbd5e1' }}>
                <li><strong>Wallet Age:</strong> Wann first TX? (z.B. 2 Jahre alt)</li>
                <li><strong>Current Balance:</strong> Wie viel ETH/Tokens? (z.B. 5.2 ETH)</li>
                <li><strong>Total TX Count:</strong> Wie viele Transaktionen? (z.B. 847 TXs)</li>
                <li><strong>Active Days:</strong> An wie vielen Tagen aktiv? (z.B. 156 Tage)</li>
                <li><strong>Total Volume:</strong> Wie viel $ moved? (z.B. $125k)</li>
              </ul>
              <div className="layer-protection">
                <strong>💡 Was sagt dir das?</strong>
                <p>
                  Alter + Volume + TX Count → Ist das ein erfahrener User, ein neuer Wallet, 
                  oder ein Bot?
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="comparison-container" style={{ marginTop: '1.5rem' }}>
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">🆕</span>
              <h3>Neue Wallet</h3>
            </div>
            <ul className="comparison-list">
              <li>Age: &lt; 30 Tage</li>
              <li>TXs: &lt; 20</li>
              <li>Mögliche Bedeutung: Airdrop Farmer, neuer User, oder Sybil</li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">⭐</span>
              <h3>Etablierte Wallet</h3>
            </div>
            <ul className="comparison-list">
              <li>Age: &gt; 1 Jahr</li>
              <li>TXs: 500+</li>
              <li>Mögliche Bedeutung: Echter User, Trader, oder Service</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Schritt 2-3</span>
        <h2>🎯 Activity & Interactions</h2>

        <div className="nft-comparison">
          <div className="nft-col fungible">
            <h5>Activity Pattern Check</h5>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              <strong>Fragen:</strong>
            </p>
            <ul style={{ textAlign: 'left', color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>Wie oft aktiv? (täglich / wöchentlich / monatlich)</li>
              <li>Zu welchen Zeiten? (Bot = 24/7, Human = Tageszeiten)</li>
              <li>Transaktions-Value? (kleine Beträge / große Beträge)</li>
              <li>Gas-Optimierung? (Batching? EIP-1559?)</li>
            </ul>
          </div>

          <div className="nft-col non-fungible">
            <h5>Interaction Analysis</h5>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              <strong>Fragen:</strong>
            </p>
            <ul style={{ textAlign: 'left', color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>Welche Contracts? (DEX / Lending / NFT / Bridge)</li>
              <li>Welche Tokens? (ETH / Stablecoins / Memecoins)</li>
              <li>Diversität? (viele verschiedene / immer dieselben)</li>
              <li>Erfolgsrate? (Failed TXs / Reverts)</li>
            </ul>
          </div>
        </div>

        <ConceptBox title="🎨 Beispiel: DeFi Power User" type="success">
          <p><strong>Pattern erkannt:</strong></p>
          <ul>
            <li>✅ 1000+ Transaktionen über 18 Monate</li>
            <li>✅ Interagiert mit: Uniswap, Aave, Curve, Yearn</li>
            <li>✅ Hauptsächlich Stablecoins (USDC, DAI)</li>
            <li>✅ Yield Farming Strategie erkennbar</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            → <strong>Interpretation:</strong> Erfahrener DeFi User, wahrscheinlich Yield Optimizer
          </p>
        </ConceptBox>
      </section>

      <section className="content-section">
        <span className="section-label">Schritt 4-5</span>
        <h2>💰 Funding & Cluster Analysis</h2>

        <div className="story-card">
          <p className="story-text">
            <strong>Funding Source Tracking:</strong> Woher kam das initiale Kapital?
          </p>
          <ul style={{ color: '#cbd5e1' }}>
            <li>Von einer Börse? → Wahrscheinlich legitimer User</li>
            <li>Von einem bekannten Exploiter? → 🚨 Red Flag</li>
            <li>Von einer Parent-Wallet die 100 andere Wallets funded? → Sybil Cluster</li>
            <li>Direkt gemined? → Sehr altes Wallet (Pre-2016)</li>
          </ul>
          <p className="story-highlight">
            💡 Der Funding Trail sagt oft mehr als 1000 Transaktionen!
          </p>
        </div>

        <div className="scenario-cards">
          <div className="scenario-card">
            <div className="scenario-icon">✅</div>
            <h4>Clean Funding</h4>
            <p style={{ color: '#cbd5e1' }}>
              Funded von Coinbase/Binance → Normaler User
            </p>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">⚠️</div>
            <h4>Suspicious Funding</h4>
            <p style={{ color: '#cbd5e1' }}>
              Funded von Tornado Cash → Potential Mixer Usage
            </p>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🚨</div>
            <h4>Red Flag Funding</h4>
            <p style={{ color: '#cbd5e1' }}>
              Funded von bekanntem Exploiter → High Risk
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Tools</span>
        <h2>🛠️ Welche Tools nutzt du wo?</h2>

        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">📊</div>
            <div className="takeaway-content">
              <h4>Etherscan</h4>
              <p>High-Level Overview, TX History, Token Holdings</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🔍</div>
            <div className="takeaway-content">
              <h4>Arkham</h4>
              <p>Entity Labels, Flow Visualization, Connections</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">📈</div>
            <div className="takeaway-content">
              <h4>Nansen</h4>
              <p>Wallet Labels (Smart Money), Token God Mode</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🎯</div>
            <div className="takeaway-content">
              <h4>Dune Analytics</h4>
              <p>Custom Queries, Aggregate Analysis, Dashboards</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🌐</div>
            <div className="takeaway-content">
              <h4>Breadcrumbs</h4>
              <p>Advanced Clustering, Investigations, Reports</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">🔗</div>
            <div className="takeaway-content">
              <h4>Eigene Tools</h4>
              <p>Python Scripts, APIs, Custom Dashboards</p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Quiz</span>
        <h2>🧩 Workflow-Verständnis Test</h2>

        <SingleQuiz
          question={workflowQuiz.question}
          options={workflowQuiz.options}
          correctIndex={workflowQuiz.correctIndex}
          explanation={workflowQuiz.explanation}
          onComplete={() => setQuizComplete(true)}
        />

        {quizComplete && (
          <ConceptBox title="Perfekt! 🎉" type="success">
            <p>
              Du verstehst jetzt, wie man systematisch vorgeht! 
              Im letzten Modul wenden wir alles an: <strong>Praxis mit echten Beispielen!</strong>
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="content-section">
        <span className="section-label">Zusammenfassung</span>
        <h2>📝 Der 5-Schritte-Workflow</h2>
        
        <div className="summary-card">
          <ul className="summary-list">
            <li><strong>Step 1:</strong> High-Level Overview (Age, Balance, TX Count)</li>
            <li><strong>Step 2:</strong> Activity Pattern (Frequency, Timing, Value)</li>
            <li><strong>Step 3:</strong> Interactions (Contracts, Tokens, Diversity)</li>
            <li><strong>Step 4:</strong> Funding Source (Woher kam das Geld?)</li>
            <li><strong>Step 5:</strong> Cluster Detection (Verbindungen zu anderen Wallets?)</li>
          </ul>
          <div className="next-module-hint">
            <p>
              <strong>Pro-Tipp:</strong> Für 80% der Fälle reichen Steps 1-3. 
              Steps 4-5 nur bei Verdachtsfällen oder Research-Projekten!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module05_AnalyseWorkflows;
