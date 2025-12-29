import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import SingleQuiz from '../../components/exercises/SingleQuiz';

const Module06_Praxis = () => {
  const [quizComplete, setQuizComplete] = useState(false);

  const finalQuiz = {
    question: "Du siehst eine Wallet mit: 250 TXs in 3 Monaten, nur Uniswap/Aave Interaktionen, funded von Binance. Welche Kategorie?",
    options: [
      "Airdrop Farmer (Sybil)",
      "Normaler DeFi User",
      "Bot / MEV Searcher",
      "Börsen-Wallet"
    ],
    correctIndex: 1,
    explanation: "Richtig! Das ist ein normaler DeFi User: Moderate Aktivität (250 TXs in 3 Monaten), legitime DeFi-Plattformen, und clean Funding von Binance. Keine Red Flags!"
  };

  return (
    <div className="module-container">
      <header className="module-header-section">
        <div className="module-icon-large">🎯</div>
        <h1 className="module-title">Praxis & Anwendung</h1>
        <p className="module-subtitle">
          Setze alles um: Analysiere echte Wallets und erkenne Muster in der Praxis
        </p>
      </header>

      <section className="content-section">
        <span className="section-label">Recap</span>
        <h2>🔄 Was du gelernt hast</h2>

        <div className="summary-card">
          <h3 className="summary-title">Deine Pattern Recognition Skills:</h3>
          <ul className="summary-list">
            <li><strong>Modul 1:</strong> Pattern Recognition Grundkonzept verstanden</li>
            <li><strong>Modul 2:</strong> User vs Börse vs Airdrop unterscheiden</li>
            <li><strong>Modul 3:</strong> Wallet-Cluster erkennen (Sybil Detection)</li>
            <li><strong>Modul 4:</strong> Services identifizieren (DEX, CEX, NFT, Bridge)</li>
            <li><strong>Modul 5:</strong> Systematischer 5-Schritte-Analyse-Workflow</li>
          </ul>
          <div className="next-module-hint">
            <p>
              Jetzt kommt der beste Teil: <strong>Echte Praxis mit realen Beispielen!</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Praxis-Beispiel 1</span>
        <h2>🎁 Case Study: Airdrop Farmer Detection</h2>

        <ConceptBox title="Szenario" type="info">
          <p>
            Ein neues DeFi-Protokoll plant einen Airdrop. Sie wollen Sybil-Accounts ausschließen. 
            Du sollst helfen, Cluster zu finden.
          </p>
        </ConceptBox>

        <div className="attack-scenarios">
          <div className="attack-scenario">
            <div className="attack-header">
              <span className="attack-icon">🔍</span>
              <h4>Analyse-Prozess</h4>
            </div>
            <div className="attack-steps">
              <div className="attack-step attacker">
                <strong>Step 1:</strong> Export alle Wallets, die das Protokoll genutzt haben (10.000 Adressen)
              </div>
              <div className="attack-step attacker">
                <strong>Step 2:</strong> Prüfe Funding Sources → Finde Parent-Wallets
              </div>
              <div className="attack-step defense">
                <strong>Finding:</strong> 2.500 Wallets wurden von nur 50 Parent-Wallets funded!
              </div>
              <div className="attack-step defense">
                <strong>Step 3:</strong> Zeitliche Korrelation → Alle Cluster-Wallets claimen innerhalb 1 Stunde
              </div>
              <div className="attack-step defense">
                <strong>Step 4:</strong> Verhaltensanalyse → Identische Interaktions-Sequenz
              </div>
            </div>
            <div className="attack-result failed">
              ✅ Ergebnis: 2.500 Sybil-Accounts identifiziert und vom Airdrop ausgeschlossen
            </div>
          </div>
        </div>

        <div className="comparison-container" style={{ marginTop: '2rem' }}>
          <div className="comparison-item problem">
            <div className="comparison-header">
              <span className="comparison-icon">❌</span>
              <h3>Ohne Pattern Recognition</h3>
            </div>
            <p style={{ color: '#cbd5e1' }}>
              "Wir haben 10.000 Users" → Aber 25% sind Sybils → Unfairer Airdrop
            </p>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">✅</span>
              <h3>Mit Pattern Recognition</h3>
            </div>
            <p style={{ color: '#cbd5e1' }}>
              "Wir haben 7.500 echte Users" → Cluster entfernt → Fairer Airdrop
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Praxis-Beispiel 2</span>
        <h2>🕵️ Case Study: Fraud Investigation</h2>

        <div className="story-card">
          <p className="story-text">
            <strong>Szenario:</strong> Ein Protokol wurde für $5M gehackt. 
            Der Hacker transferiert die Funds auf verschiedene Wallets. 
            Deine Aufgabe: Tracking!
          </p>
        </div>

        <div className="supply-chain-steps">
          <div className="sc-step">
            <div className="sc-number">🚨</div>
            <div className="sc-content">
              <h5>Exploit Wallet</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                $5M stolen
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">🔄</div>
            <div className="sc-content">
              <h5>Split to 10 Wallets</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                $500k each
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">🌪️</div>
            <div className="sc-content">
              <h5>Tornado Cash</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Mixing
              </p>
            </div>
          </div>

          <div className="sc-arrow">→</div>

          <div className="sc-step">
            <div className="sc-number">🏦</div>
            <div className="sc-content">
              <h5>CEX Deposit</h5>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                Cash out?
              </p>
            </div>
          </div>
        </div>

        <ConceptBox title="Pattern Recognition hilft!" type="success">
          <p><strong>Erkenntnisse durch Analyse:</strong></p>
          <ul>
            <li>✅ Alle 10 Wallets zeigen identisches Timing-Pattern</li>
            <li>✅ Gemeinsame Tornado Cash Withdrawal-Wallets gefunden</li>
            <li>✅ CEX-Deposit identifiziert → Exchange kontaktiert</li>
            <li>✅ Funds frozen auf der Börse</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            <strong>Ergebnis:</strong> $4.2M von $5M recovered! 🎉
          </p>
        </ConceptBox>
      </section>

      <section className="content-section">
        <span className="section-label">Praxis-Beispiel 3</span>
        <h2>📊 Case Study: Protocol Health Analysis</h2>

        <div className="scenario-cards">
          <div className="scenario-card">
            <div className="scenario-icon">❓</div>
            <h4>Die Frage</h4>
            <p style={{ color: '#cbd5e1' }}>
              "Wie gesund ist unser Protokoll wirklich? Haben wir echte User oder nur Bots?"
            </p>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🔍</div>
            <h4>Die Analyse</h4>
            <ul style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              <li>50.000 "Unique Wallets"</li>
              <li>Pattern Recognition → Cluster Detection</li>
              <li>Finding: 15.000 Sybil-Accounts</li>
              <li>Resultat: 35.000 echte Users</li>
            </ul>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">💡</div>
            <h4>Die Erkenntnis</h4>
            <p style={{ color: '#cbd5e1' }}>
              Trotz weniger "Wallets" sind die echten User engaged und valuable. 
              Fokus auf Qualität, nicht Quantität!
            </p>
          </div>
        </div>

        <div className="comparison-container" style={{ marginTop: '2rem' }}>
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">📊</span>
              <h3>Naive Metrics</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '1.2rem', textAlign: 'center', margin: '1rem 0' }}>
              <strong>50.000 Users</strong>
            </p>
            <p style={{ color: '#94a3b8' }}>
              Aber: 30% sind Sybils!
            </p>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">🎯</span>
              <h3>Pattern-Based Metrics</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '1.2rem', textAlign: 'center', margin: '1rem 0' }}>
              <strong>35.000 Real Users</strong>
            </p>
            <p style={{ color: '#94a3b8' }}>
              Akkurate, ehrliche Daten!
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Quiz</span>
        <h2>🧩 Final Assessment</h2>

        <SingleQuiz
          question={finalQuiz.question}
          options={finalQuiz.options}
          correctIndex={finalQuiz.correctIndex}
          explanation={finalQuiz.explanation}
          onComplete={() => setQuizComplete(true)}
        />

        {quizComplete && (
          <div className="final-summary">
            <div className="summary-card">
              <h3 className="summary-title">🎓 Kurs abgeschlossen!</h3>
              <p className="congrats-text">
                Herzlichen Glückwunsch! Du hast alle Module erfolgreich absolviert und 
                bist jetzt in der Lage, On-Chain-Muster zu erkennen und zu analysieren.
              </p>
              
              <div className="takeaways-grid" style={{ marginTop: '2rem' }}>
                <div className="takeaway-item">
                  <div className="takeaway-number">✓</div>
                  <div className="takeaway-content">
                    <h4>Muster erkennen</h4>
                    <p>User, Börsen, Airdrops, Services unterscheiden</p>
                  </div>
                </div>
                <div className="takeaway-item">
                  <div className="takeaway-number">✓</div>
                  <div className="takeaway-content">
                    <h4>Cluster finden</h4>
                    <p>Sybil-Accounts und verbundene Wallets identifizieren</p>
                  </div>
                </div>
                <div className="takeaway-item">
                  <div className="takeaway-number">✓</div>
                  <div className="takeaway-content">
                    <h4>Systematisch analysieren</h4>
                    <p>5-Schritte-Workflow anwenden</p>
                  </div>
                </div>
                <div className="takeaway-item">
                  <div className="takeaway-number">✓</div>
                  <div className="takeaway-content">
                    <h4>Praktische Anwendung</h4>
                    <p>Real-World Cases analysieren</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="content-section">
        <span className="section-label">Nächste Schritte</span>
        <h2>🚀 Was kommt als Nächstes?</h2>

        <div className="next-steps-grid">
          <div className="next-step-card">
            <div className="next-icon">🛠️</div>
            <h4>Üben, üben, üben!</h4>
            <p style={{ color: '#cbd5e1' }}>
              Analysiere echte Wallets auf Etherscan. Je mehr du übst, desto schneller erkennst du Muster!
            </p>
          </div>

          <div className="next-step-card">
            <div className="next-icon">📚</div>
            <h4>Advanced Techniques</h4>
            <p style={{ color: '#cbd5e1' }}>
              Lerne Python für automatisierte Analysen, nutze APIs, baue eigene Dashboards
            </p>
          </div>

          <div className="next-step-card">
            <div className="next-icon">🤝</div>
            <div className="next-icon">🤝</div>
            <h4>Community beitreten</h4>
            <p style={{ color: '#cbd5e1' }}>
              Tausche dich mit anderen On-Chain Analysts aus, teile Findings, lerne von anderen
            </p>
          </div>

          <div className="next-step-card">
            <div className="next-icon">💼</div>
            <h4>Career Opportunities</h4>
            <p style={{ color: '#cbd5e1' }}>
              On-Chain Analyst, Blockchain Investigator, Security Researcher, Protocol Analyst
            </p>
          </div>
        </div>

        <div className="final-message">
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Du hast jetzt die Grundlagen – der Rest ist Übung und Erfahrung! 💪
          </p>
          <p className="thank-you">
            Viel Erfolg bei deiner On-Chain Analysis Journey! 🎯
          </p>
        </div>
      </section>
    </div>
  );
};

export default Module06_Praxis;
