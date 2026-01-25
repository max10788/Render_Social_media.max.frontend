import React, { useState } from 'react';
import '../shared/Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import SingleQuiz from '../../components/exercises/SingleQuiz';

const Module02_VerhaltensmuserEinfach = () => {
  const [quizComplete, setQuizComplete] = useState(false);

  const patternQuiz = {
    question: "Eine Adresse erhält über 100 kleine Einzahlungen pro Tag von verschiedenen Adressen und macht 5-10 große Auszahlungen pro Tag. Was ist das wahrscheinlich?",
    options: [
      "Ein normaler User",
      "Eine Börsen-Adresse (Exchange)",
      "Ein Airdrop",
      "Ein Smart Contract"
    ],
    correctIndex: 1,
    explanation: "Richtig! Das ist ein typisches Muster für eine Börse: Viele User zahlen kleine Beträge ein (Deposits), die Börse konsolidiert diese und macht große Auszahlungen (Withdrawals)."
  };

  return (
    <div className="module-container">
      <header className="module-header-section">
        <div className="module-icon-large">👤</div>
        <h1 className="module-title">Einfache Verhaltensmuster</h1>
        <p className="module-subtitle">
          Erkenne grundlegende On-Chain-Aktivitäten: normale User, Börsen und Airdrops
        </p>
      </header>

      <section className="content-section">
        <span className="section-label">Grundmuster</span>
        <h2>📊 Die drei häufigsten Muster</h2>
        
        <div className="scenario-cards">
          <div className="scenario-card">
            <div className="scenario-icon">👤</div>
            <h4>Normaler User</h4>
            <p><strong>Muster:</strong></p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li>Wenige Transaktionen pro Tag (1-10)</li>
              <li>Meist ähnliche Beträge</li>
              <li>Regelmäßige Interaktionen mit bekannten Services</li>
              <li>Gelegentliche Pausen (Tage ohne Aktivität)</li>
            </ul>
            <div className="scenario-result success">
              ✅ Menschliches Verhalten
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🏦</div>
            <h4>Börse (Exchange)</h4>
            <p><strong>Muster:</strong></p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li>Sehr viele Transaktionen (100+ pro Tag)</li>
              <li>Viele kleine Einzahlungen</li>
              <li>Wenige große Auszahlungen</li>
              <li>24/7 aktiv, keine Pausen</li>
              <li>Hoher Gesamtwert (Millionen $)</li>
            </ul>
            <div className="scenario-result success">
              🏦 Service-Adresse
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🎁</div>
            <h4>Airdrop</h4>
            <p><strong>Muster:</strong></p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li>Eine Sender-Adresse</li>
              <li>Viele Empfänger (100-10.000+)</li>
              <li>Meist gleicher oder ähnlicher Betrag</li>
              <li>Alle Transaktionen in kurzer Zeit</li>
              <li>Oft neue Token</li>
            </ul>
            <div className="scenario-result success">
              🎁 Distribution-Event
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Vergleich</span>
        <h2>🔄 Transaktions-Flow visualisiert</h2>

        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">👤</div>
            <h4 className="metaphor-title">Normaler User</h4>
            <div className="metaphor-text">
              <p style={{ marginBottom: '0.75rem' }}>Wallet A</p>
              <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>↓ ↑ ↓</p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Wenige Transaktionen<br/>
                In beide Richtungen
              </p>
            </div>
          </div>

          <div className="metaphor-divider">vs</div>

          <div className="metaphor-card highlight">
            <div className="metaphor-icon">🏦</div>
            <h4 className="metaphor-title">Börse</h4>
            <div className="metaphor-text">
              <p style={{ marginBottom: '0.75rem' }}>Exchange Wallet</p>
              <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>↓↓↓↓↓ → ↑↑</p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Viele rein (deposits)<br/>
                Wenige raus (withdrawals)
              </p>
            </div>
          </div>

          <div className="metaphor-divider">vs</div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🎁</div>
            <h4 className="metaphor-title">Airdrop</h4>
            <div className="metaphor-text">
              <p style={{ marginBottom: '0.75rem' }}>Distributor</p>
              <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>1 → ∞</p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Eine Quelle<br/>
                Viele Empfänger
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Praxis</span>
        <h2>🔍 Echtes Beispiel: Binance Hot Wallet</h2>

        <ConceptBox title="Real-World Daten" type="info">
          <div style={{ marginBottom: '1rem' }}>
            <strong>Adresse:</strong>
            <code style={{ 
              display: 'block', 
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              wordBreak: 'break-all'
            }}>
              0x28C6c06298d514Db089934071355E5743bf21d60
            </code>
          </div>
          <p><strong>Erkennungsmerkmale:</strong></p>
          <ul>
            <li>~1000 Transaktionen pro Tag</li>
            <li>Gesamtwert: mehrere Milliarden Dollar</li>
            <li>Nie offline (24/7 aktiv)</li>
            <li>Hauptsächlich ERC-20 Tokens</li>
            <li>Label in Explorern: "Binance 14"</li>
          </ul>
        </ConceptBox>

        <div className="comparison-container" style={{ marginTop: '2rem' }}>
          <div className="comparison-item problem">
            <div className="comparison-header">
              <span className="comparison-icon">❓</span>
              <h3>Ohne Pattern Recognition</h3>
            </div>
            <p style={{ color: '#cbd5e1' }}>
              "Was macht diese Adresse? Ist das sicher? Warum so viele Transaktionen?"
            </p>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">✓</span>
              <h3>Mit Pattern Recognition</h3>
            </div>
            <p style={{ color: '#cbd5e1' }}>
              "Börsen-Muster erkannt: Hot Wallet, viele kleine Inflows, wenige große Outflows → Binance"
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Quiz</span>
        <h2>🧩 Teste dein Wissen</h2>

        <SingleQuiz
          question={patternQuiz.question}
          options={patternQuiz.options}
          correctIndex={patternQuiz.correctIndex}
          explanation={patternQuiz.explanation}
          onComplete={() => setQuizComplete(true)}
        />

        {quizComplete && (
          <ConceptBox title="Sehr gut! 🎉" type="success">
            <p>
              Du kannst jetzt die drei grundlegenden Muster unterscheiden. 
              Im nächsten Modul schauen wir uns <strong>Wallet-Cluster</strong> an – 
              wie erkennst du, ob mehrere Adressen zur selben Person gehören?
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
              <h4>Transaktionsfrequenz</h4>
              <p>User: wenige/Tag | Börse: 100+/Tag</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Flow-Richtung</h4>
              <p>Börse: viele rein, wenige raus</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Aktivitätsmuster</h4>
              <p>User: Pausen | Börse: 24/7 aktiv</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>Airdrop-Struktur</h4>
              <p>1 Sender → viele Empfänger, kurze Zeit</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module02_VerhaltensmuserEinfach;
