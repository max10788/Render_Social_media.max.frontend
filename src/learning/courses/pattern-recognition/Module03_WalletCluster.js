import React, { useState } from 'react';
import '../shared/Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import SingleQuiz from '../../components/exercises/SingleQuiz';

const Module03_WalletCluster = () => {
  const [quizComplete, setQuizComplete] = useState(false);

  const clusterQuiz = {
    question: "Drei Wallets erhalten am selben Tag zur selben Minute vom selben Airdrop Token. Danach interagieren sie nie miteinander. Sind das wahrscheinlich...?",
    options: [
      "Drei verschiedene Personen (Zufall)",
      "Wahrscheinlich dieselbe Person (Cluster)",
      "Eine Börse",
      "Ein Smart Contract"
    ],
    correctIndex: 1,
    explanation: "Sehr wahrscheinlich dieselbe Person! Das gleichzeitige Erhalten von Airdrop-Tokens ist ein starkes Cluster-Signal. Die Person nutzt mehrere Wallets, um mehr Tokens zu bekommen."
  };

  return (
    <div className="module-container">
      <header className="module-header-section">
        <div className="module-icon-large">🔗</div>
        <h1 className="module-title">Wallet-Cluster erkennen</h1>
        <p className="module-subtitle">
          Finde heraus, ob mehrere Adressen zur selben Person gehören
        </p>
      </header>

      <section className="content-section">
        <span className="section-label">Konzept</span>
        <h2>🤔 Warum Wallet-Cluster?</h2>

        <div className="story-card">
          <p className="story-text">
            <strong>Szenario:</strong> Du siehst eine Wallet, die suspicious aussieht. 
            Aber dann entdeckst du, dass diese Wallet mit 10 anderen Wallets verbunden ist – 
            alle gehören zur selben Person!
          </p>
          <p className="story-text">
            Das nennt man einen <strong>Wallet-Cluster</strong> – mehrere Adressen, 
            eine kontrollierende Entität.
          </p>
          <p className="story-highlight">
            💡 Menschen nutzen oft mehrere Wallets für: Airdrops, Sicherheit, Privatsphäre, oder Bots
          </p>
        </div>

        <ConceptBox title="Definition: Wallet-Cluster" type="info">
          <p>
            Ein <strong>Wallet-Cluster</strong> ist eine Gruppe von Adressen, die wahrscheinlich 
            von derselben Person oder Entität kontrolliert werden.
          </p>
          <p style={{ marginTop: '1rem' }}>
            <strong>Beispiele:</strong>
          </p>
          <ul>
            <li>Eine Person mit 5 Wallets für Airdrop-Farming</li>
            <li>Ein Trader mit mehreren Trading-Bots</li>
            <li>Ein Projekt-Team mit verschiedenen Wallets</li>
          </ul>
        </ConceptBox>
      </section>

      <section className="content-section">
        <span className="section-label">Erkennungsmethoden</span>
        <h2>🔍 Wie erkennst du Cluster?</h2>

        <div className="security-layers">
          <div className="security-layer">
            <div className="layer-number">1</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">🎁</span>
                <h4>Gemeinsame Funding Source</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                Alle Wallets wurden von derselben "Parent-Wallet" mit ETH gefundet
              </p>
              <div className="layer-example">
                <strong>Beispiel:</strong> Wallet A funded → B, C, D, E mit jeweils 0.5 ETH
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">2</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">⏰</span>
                <h4>Zeitliche Korrelation</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                Alle Wallets machen Aktionen zur gleichen Zeit oder in sehr ähnlichen Zeitabständen
              </p>
              <div className="layer-example">
                <strong>Beispiel:</strong> 5 Wallets claimen denselben Airdrop innerhalb von 2 Minuten
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">3</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">🔄</span>
                <h4>Verhaltensähnlichkeit</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                Alle Wallets interagieren mit denselben Contracts in derselben Reihenfolge
              </p>
              <div className="layer-example">
                <strong>Beispiel:</strong> Alle swappen auf Uniswap → bridgen zu Arbitrum → farmen auf GMX
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">4</div>
            <div className="layer-content">
              <div className="layer-header">
                <span className="layer-icon">💰</span>
                <h4>Fund-Recycling</h4>
              </div>
              <p style={{ color: '#cbd5e1' }}>
                Wallets senden Assets im Kreis: A → B → C → A
              </p>
              <div className="layer-example">
                <strong>Beispiel:</strong> Wallet A schickt 100 USDC zu B, B zu C, C zurück zu A
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Visualisierung</span>
        <h2>📊 Cluster-Visualisierung</h2>

        <div className="network-comparison">
          <div className="network-type">
            <h3 style={{ color: '#10b981' }}>✅ Kein Cluster</h3>
            <div className="network-diagram">
              <div className="peer-nodes" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="peer-node">
                  <div className="node-icon">👤</div>
                  <div className="node-label">User A</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">👤</div>
                  <div className="node-label">User B</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">👤</div>
                  <div className="node-label">User C</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">👤</div>
                  <div className="node-label">User D</div>
                </div>
              </div>
            </div>
            <div className="network-description">
              <p style={{ color: '#cbd5e1', textAlign: 'center', marginTop: '1rem' }}>
                Vier unabhängige Wallets<br/>
                Keine Verbindungen erkennbar
              </p>
            </div>
          </div>

          <div className="network-type centralized">
            <h3 style={{ color: '#ef4444' }}>⚠️ Cluster erkannt</h3>
            <div className="network-diagram">
              <div className="central-server">
                <div className="server-icon">🎯</div>
                <div className="server-label">Main Wallet (Parent)</div>
              </div>
              <div style={{ fontSize: '2rem', margin: '1rem 0', color: '#ef4444' }}>↓ ↓ ↓ ↓</div>
              <div className="peer-nodes" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="peer-node" style={{ borderColor: '#ef4444' }}>
                  <div className="node-icon">💼</div>
                  <div className="node-label">Wallet 1</div>
                </div>
                <div className="peer-node" style={{ borderColor: '#ef4444' }}>
                  <div className="node-icon">💼</div>
                  <div className="node-label">Wallet 2</div>
                </div>
                <div className="peer-node" style={{ borderColor: '#ef4444' }}>
                  <div className="node-icon">💼</div>
                  <div className="node-label">Wallet 3</div>
                </div>
                <div className="peer-node" style={{ borderColor: '#ef4444' }}>
                  <div className="node-icon">💼</div>
                  <div className="node-label">Wallet 4</div>
                </div>
              </div>
            </div>
            <div className="network-description">
              <p style={{ color: '#cbd5e1', textAlign: 'center', marginTop: '1rem' }}>
                Ein Parent-Wallet funded 4 Child-Wallets<br/>
                <strong style={{ color: '#ef4444' }}>→ Wahrscheinlich dieselbe Person!</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Anwendungsfall</span>
        <h2>💡 Warum ist das wichtig?</h2>

        <div className="scenario-cards">
          <div className="scenario-card">
            <div className="scenario-icon">🎁</div>
            <h4>Airdrop-Sybil Detection</h4>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              Projekte wollen Airdrops fair verteilen – aber manche Leute erstellen 100 Wallets
            </p>
            <div className="scenario-result warning">
              ⚠️ Cluster-Analyse findet Sybil-Angriffe
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🕵️</div>
            <h4>Fraud Investigation</h4>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              Ein Scammer hat Geld gestohlen – aber verteilt es auf 50 Wallets
            </p>
            <div className="scenario-result warning">
              🔍 Cluster-Analyse tracked alle verbundenen Wallets
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">📊</div>
            <h4>Analytics & Research</h4>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              "Wie viele echte User hat dieses Protokoll?" – nicht nur Wallet-Count
            </p>
            <div className="scenario-result success">
              ✅ Cluster-Analyse zeigt echte User-Anzahl
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Quiz</span>
        <h2>🧩 Teste dein Verständnis</h2>

        <SingleQuiz
          question={clusterQuiz.question}
          options={clusterQuiz.options}
          correctIndex={clusterQuiz.correctIndex}
          explanation={clusterQuiz.explanation}
          onComplete={() => setQuizComplete(true)}
        />

        {quizComplete && (
          <ConceptBox title="Ausgezeichnet! 🎉" type="success">
            <p>
              Du verstehst jetzt, wie Wallet-Cluster funktionieren. 
              Im nächsten Modul schauen wir uns <strong>Service-Muster</strong> an – 
              wie unterscheidest du Börsen, DeFi-Protokolle und NFT-Marketplaces?
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="content-section">
        <span className="section-label">Zusammenfassung</span>
        <h2>📝 Key Takeaways</h2>
        
        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Funding Source</h4>
              <p>Alle von derselben Parent-Wallet funded</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Zeitliche Korrelation</h4>
              <p>Aktionen zur gleichen Zeit</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Verhaltensähnlichkeit</h4>
              <p>Gleiche Interaktionen, gleiche Reihenfolge</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>Fund-Recycling</h4>
              <p>Assets werden zwischen Wallets hin- und hergeschickt</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module03_WalletCluster;
