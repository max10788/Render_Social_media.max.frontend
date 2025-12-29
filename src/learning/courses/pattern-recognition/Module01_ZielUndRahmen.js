import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import SingleQuiz from '../../components/exercises/SingleQuiz';

const Module01_ZielUndRahmen = () => {
  const [quizComplete, setQuizComplete] = useState(false);

  const introQuiz = {
    question: "Du siehst auf deinem Bankkonto jeden Monat eine Zahlung: gleicher Betrag, gleicher Absender, immer am 15. des Monats. Was ist das wahrscheinlich?",
    options: [
      "Ein Fehler der Bank",
      "Ein wiederkehrendes Muster (z.B. Miete oder Abo)",
      "Eine zufällige Zahlung",
      "Betrug"
    ],
    correctIndex: 1,
    explanation: "Genau! Das ist ein **Muster**: regelmäßig, gleicher Betrag, gleicher Absender. Auf der Blockchain funktioniert es ähnlich – aus vielen Transaktionen lassen sich Muster erkennen!"
  };

  return (
    <div className="module-container">
      <header className="module-header-section">
        <div className="module-icon-large">🔍</div>
        <h1 className="module-title">Ziel und Rahmen für Pattern Recognition</h1>
        <p className="module-subtitle">
          Lerne, wie sich viele Transaktionen zu wiederkehrenden Mustern formen
        </p>
      </header>

      <section className="content-section">
        <span className="section-label">Einführung</span>
        <h2>🎯 Was lernst du in diesem Kurs?</h2>
        <ConceptBox title="Dein Lernziel" type="info">
          <p>
            Nach diesem Kurs kannst du <strong>typische On-Chain-Bilder erkennen</strong>:
          </p>
          <ul>
            <li>✅ Normale User-Transaktionen</li>
            <li>✅ Börsen-Adressen</li>
            <li>✅ Token-Transfers</li>
            <li>✅ Smart-Contract-Interaktionen</li>
          </ul>
          <p className="highlight-text">
            Und das <strong>ohne Mathematik oder Statistik</strong> – nur durch Beobachtung!
          </p>
        </ConceptBox>

        <div className="text-content">
          <h3>Warum ist das wichtig?</h3>
          <p>
            Im vorherigen Kurs hast du gelernt, was eine einzelne Transaktion ist. 
            Jetzt schauen wir uns an, wie sich <strong>viele Transaktionen</strong> zu 
            wiederkehrenden Mustern formen – genau wie im echten Leben!
          </p>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Konzept</span>
        <h2>📚 Von Alltagsmustern zu On-Chain-Mustern</h2>
        
        <div className="comparison-container">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">🏦</span>
              <h3>Im echten Leben</h3>
            </div>
            <ul className="comparison-list">
              <li>Stromrechnung: regelmäßig, ähnlicher Betrag</li>
              <li>Supermarkt: viele kleine Zahlungen</li>
              <li>Gehalt: einmal im Monat, fester Betrag</li>
            </ul>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem', fontStyle: 'italic' }}>
              Diese Muster erkennst du sofort!
            </p>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">⛓️</span>
              <h3>Auf der Blockchain</h3>
            </div>
            <ul className="comparison-list">
              <li>Börse: viele Einzahlungen, große Auszahlungen</li>
              <li>Airdrop: eine Adresse → viele neue Adressen</li>
              <li>DeFi: viele interne Transaktionen</li>
            </ul>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem', fontStyle: 'italic' }}>
              Diese Muster lernst du hier!
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <span className="section-label">Quiz</span>
        <h2>🧩 Warm-up: Erkenne das Muster!</h2>
        <ConceptBox title="Aufgabe" type="practice">
          <p>Teste dein Mustergefühl mit einem Alltagsbeispiel:</p>
        </ConceptBox>

        <SingleQuiz
          question={introQuiz.question}
          options={introQuiz.options}
          correctIndex={introQuiz.correctIndex}
          explanation={introQuiz.explanation}
          onComplete={() => setQuizComplete(true)}
        />

        {quizComplete && (
          <ConceptBox title="Perfekt! 🎉" type="success">
            <p>
              Du hast das Prinzip verstanden. Im nächsten Modul schauen wir uns konkrete 
              <strong> On-Chain-Muster</strong> an – mit echten Beispielen aus Block Explorern!
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="content-section">
        <span className="section-label">Vorschau</span>
        <h2>📖 Was kommt als Nächstes?</h2>
        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Einfache Verhaltensmuster</h4>
              <p>Normale Zahlung, Börse, Airdrop</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Wallet-Cluster</h4>
              <p>Mehrere Adressen, eine Person?</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>Service-Muster</h4>
              <p>Börsen, DeFi, NFTs erkennen</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">5</div>
            <div className="takeaway-content">
              <h4>Analyse-Workflows</h4>
              <p>Schritt für Schritt analysieren</p>
            </div>
          </div>
          <div className="takeaway-item">
            <div className="takeaway-number">6</div>
            <div className="takeaway-content">
              <h4>Praxis</h4>
              <p>Echte Beispiele analysieren</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module01_ZielUndRahmen;
