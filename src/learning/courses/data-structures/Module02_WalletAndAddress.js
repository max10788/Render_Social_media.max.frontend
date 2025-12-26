// src/learning/courses/reading-transactions/modules/Module02_WalletAndAddress.js

import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import ExpandableSection from '../../../components/content/ExpandableSection';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import '../../blockchain-basics/modules/Module.css';

export default function Module02_WalletAndAddress() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was ist die Wallet-App?",
      options: [
        "Ein Tresor für deine Coins",
        "Eine Fernbedienung für die Blockchain",
        "Eine Bank",
        "Ein Passwort-Manager"
      ],
      correctIndex: 1,
      explanation: "Die Wallet-App ist wie eine Fernbedienung – sie sendet Befehle an die Blockchain. Deine Coins sind auf der Blockchain, nicht in der App."
    },
    {
      question: "Was ist eine Adresse (Public Key)?",
      options: [
        "Dein Passwort",
        "Deine Kontonummer, die jeder sehen kann",
        "Dein geheimer Schlüssel",
        "Deine E-Mail"
      ],
      correctIndex: 1,
      explanation: "Die Adresse ist wie eine Kontonummer – öffentlich, jeder kann sie sehen und dir Geld schicken."
    },
    {
      question: "Was passiert, wenn du deinen Private Key verlierst?",
      options: [
        "Du kannst ihn bei der Bank zurücksetzen",
        "Du verlierst für immer Zugriff auf deine Coins",
        "Nichts, du kannst einen neuen erstellen",
        "Die Wallet-App erstellt automatisch einen neuen"
      ],
      correctIndex: 1,
      explanation: "Private Key verloren = Coins für immer weg. Es gibt keine Bank, die ihn zurücksetzen kann!"
    },
    {
      question: "Was solltest du NIEMALS tun?",
      options: [
        "Deine Adresse teilen",
        "Deinen Private Key oder Seed Phrase teilen",
        "Transaktionen senden",
        "Geld empfangen"
      ],
      correctIndex: 1,
      explanation: "NIEMALS Private Key oder Seed Phrase teilen! Wer diese hat, besitzt deine Coins. Adresse teilen ist OK."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">👛</div>
        <h1 className="module-title">Wallet & Adresse verstehen</h1>
        <p className="module-subtitle">
          Die Fernbedienung für deine Coins
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">📖 Alltagsbeispiel</span>
        
        <div className="story-card">
          <p className="story-text">
            Stell dir vor, dein Geld liegt in einem <strong>Schließfach bei einer Bank</strong>.
          </p>
          <p className="story-text">
            <strong>Die Schließfach-Nummer</strong> (z.B. "Fach 12345") ist öffentlich – 
            jeder kann Geld in dein Fach einwerfen.
          </p>
          <p className="story-text">
            <strong>Der Schlüssel</strong> zum Fach hast nur du. 
            Ohne den Schlüssel kannst du nicht an dein Geld.
          </p>
          <p className="story-highlight">
            Wallet-Adresse = Schließfach-Nummer (öffentlich)<br/>
            Private Key = Schlüssel (geheim!)
          </p>
        </div>
      </div>

      {/* Comparison */}
      <div className="content-section">
        <span className="section-label">🔄 Wallet vs. Bankkonto</span>
        
        <div className="comparison-container">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">🏦</span>
              <h3>Bankkonto</h3>
            </div>
            <ul className="comparison-list">
              <li>Bank <strong>verwahrt</strong> dein Geld</li>
              <li>Kontonummer = öffentlich</li>
              <li>PIN/Passwort bei <strong>Bank gespeichert</strong></li>
              <li>Bank kann Passwort <strong>zurücksetzen</strong></li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">👛</span>
              <h3>Crypto Wallet</h3>
            </div>
            <ul className="comparison-list">
              <li>Blockchain <strong>speichert</strong> dein Geld</li>
              <li>Adresse (Public Key) = öffentlich</li>
              <li>Private Key nur bei <strong>dir</strong></li>
              <li><strong>Niemand</strong> kann ihn zurücksetzen!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Concept Boxes */}
      <div className="content-section">
        <span className="section-label">💡 Die drei Komponenten</span>
        
        <ConceptBox title="1. Wallet-App = Fernbedienung" icon="📱">
          <p className="concept-text">
            Die Wallet-App (MetaMask, Ledger, Trust Wallet...) ist nur eine <strong>Bedienoberfläche</strong>. 
            Sie zeigt deinen Kontostand an und sendet Befehle an die Blockchain.
          </p>
          <p className="concept-text" style={{marginTop: '0.75rem'}}>
            <strong>Wichtig:</strong> Deine Coins sind <strong>nicht in der App</strong>, 
            sondern auf der Blockchain! Die App ist nur das Werkzeug.
          </p>
        </ConceptBox>

        <ConceptBox title="2. Adresse = Öffentliche Kontonummer" icon="🏠">
          <p className="concept-text">
            Deine Wallet-Adresse (z.B. <code style={{background: 'rgba(99,102,241,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>0x742d...</code>) 
            ist wie deine Kontonummer.
          </p>
          <p className="concept-text" style={{marginTop: '0.75rem'}}>
            <strong>Jeder kann sie sehen</strong> und dir Geld schicken. 
            Das ist völlig sicher! Sie zu teilen ist wie "Hier ist meine IBAN".
          </p>
        </ConceptBox>

        <ConceptBox title="3. Private Key = Geheimer Schlüssel" icon="🔑">
          <p className="concept-text">
            Der Private Key ist ein langer Code (64 Zeichen) oder eine <strong>Seed Phrase</strong> (12-24 Wörter).
          </p>
          <p className="concept-text" style={{marginTop: '0.75rem', color: '#ef4444', fontWeight: '600'}}>
            ⚠️ WER DEINEN PRIVATE KEY HAT, BESITZT DEINE COINS!<br/>
            Niemals teilen, niemals online eingeben, niemals fotografieren!
          </p>
        </ConceptBox>
      </div>

      {/* Metaphor Visual */}
      <div className="content-section">
        <span className="section-label">🎯 Die Schloss-Metapher</span>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🔓</div>
            <div className="metaphor-title">Public Key (Adresse)</div>
            <p className="metaphor-text">
              <strong>Das Schloss</strong><br/>
              Öffentlich sichtbar<br/>
              Jeder kann es benutzen<br/>
              (Geld reinschicken)
            </p>
          </div>

          <div className="metaphor-divider">+</div>

          <div className="metaphor-card highlight">
            <div className="metaphor-icon">🔐</div>
            <div className="metaphor-title">Private Key</div>
            <p className="metaphor-text">
              <strong>Der Schlüssel</strong><br/>
              Nur du hast ihn<br/>
              Öffnet das Schloss<br/>
              (Geld rausschicken)
            </p>
          </div>
        </div>
      </div>

      {/* Address Format */}
      <div className="content-section">
        <span className="section-label">🔍 Wie sieht eine Adresse aus?</span>
        
        <div className="example-block">
          <div className="example-header">
            <h4>Ethereum-Adresse Beispiel</h4>
            <p className="example-note">42 Zeichen, beginnt mit "0x"</p>
          </div>
          
          <div className="anatomy-container">
            <div className="anatomy-section">
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">Vollständige Adresse:</span>
                  <span className="item-value hash-value">
                    0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p>
              <strong>Aufbau:</strong>
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li><code>0x</code> = Zeigt an "Dies ist eine Ethereum-Adresse"</li>
              <li>40 hexadezimale Zeichen (0-9, a-f)</li>
              <li>Groß-/Kleinschreibung hat eine Bedeutung (Checksumme)</li>
            </ul>
            <p style={{marginTop: '1rem', color: '#a5b4fc'}}>
              💡 Die Adresse wird aus deinem Public Key mathematisch abgeleitet.
            </p>
          </div>
        </div>
      </div>

      {/* Seed Phrase */}
      <div className="content-section">
        <span className="section-label">🌱 Was ist eine Seed Phrase?</span>
        
        <div className="story-card" style={{borderColor: '#ef4444'}}>
          <p className="story-text">
            Statt einem langen Private Key (64 Zeichen) kannst du eine <strong>Seed Phrase</strong> verwenden:
          </p>
          <div style={{
            background: 'rgba(10,14,39,0.8)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            marginTop: '1rem'
          }}>
            apple banana cherry dolphin elephant<br/>
            forest garden house island jungle<br/>
            kitchen lemon mountain
          </div>
          <p className="story-text">
            <strong>12-24 zufällige Wörter</strong> = Dein Private Key in lesbarer Form
          </p>
          <p className="story-highlight" style={{color: '#ef4444'}}>
            ⚠️ Wer diese Wörter hat, besitzt ALLE deine Wallets!<br/>
            Notiere sie auf Papier, nicht digital!
          </p>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="🔐 Warum kann ich meinen Private Key nicht zurücksetzen?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Weil es <strong>keine zentrale Stelle</strong> gibt, die deinen Key kennt!
            </p>
            <p style={{marginBottom: '1rem'}}>
              Bei einer Bank: Die Bank speichert dein Passwort (verschlüsselt) und kann es zurücksetzen.
            </p>
            <p style={{marginBottom: '1rem'}}>
              Bei Crypto: <strong>Niemand</strong> kennt deinen Private Key außer dir. 
              Nicht einmal die Wallet-App speichert ihn auf einem Server!
            </p>
            <div style={{
              background: 'rgba(239,68,68,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #ef4444',
              marginTop: '1rem'
            }}>
              <strong>Das bedeutet:</strong><br/>
              ✅ Maximale Sicherheit (niemand kann ihn stehlen)<br/>
              ❌ Maximale Verantwortung (verloren = für immer weg)
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="📱 Kann ich die gleiche Wallet auf mehreren Geräten nutzen?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Ja!</strong> Du kannst deine Seed Phrase in mehrere Wallet-Apps eingeben.
            </p>
            <p style={{marginBottom: '1rem'}}>
              Beispiel: Du hast MetaMask auf deinem Laptop. Du gibst die gleiche Seed Phrase 
              in die Trust Wallet auf deinem Handy ein → <strong>Beide Apps zeigen die gleichen Wallets</strong>.
            </p>
            <p style={{color: '#a5b4fc', fontSize: '0.9rem'}}>
              💡 Die Apps sind nur Fernbedienungen für die gleiche Wallet auf der Blockchain.
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="⚠️ Phishing: Wie Betrüger deinen Private Key stehlen" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Häufigste Betrugsmasche:</strong>
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginBottom: '1rem'}}>
              <li>Fake-Website sieht aus wie MetaMask/Ledger</li>
              <li>"Bitte gib deine Seed Phrase ein, um zu verifizieren"</li>
              <li>Du gibst sie ein → Betrüger hat jetzt deine Coins!</li>
            </ul>
            <div style={{
              background: 'rgba(16,185,129,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <strong>Regel:</strong> KEINE legitime Website fragt JEMALS nach deiner Seed Phrase!<br/>
              Auch kein Support, keine Wallet-App, niemand.
            </div>
          </div>
        </ExpandableSection>
      </div>

      {/* Quiz */}
      <div className="content-section">
        <span className="section-label">✅ Wissenscheck</span>
        
        <div className="quiz-section">
          <MultipleChoice
            questions={quizQuestions}
            onComplete={(score) => setQuizScore(score)}
          />

          {quizScore !== null && (
            <div className="quiz-result">
              {quizScore === 100 ? (
                <div className="result-card perfect">
                  <div className="result-icon">🎉</div>
                  <div className="result-title">Perfekt!</div>
                  <p className="result-text">
                    Du weißt jetzt, wie Wallets funktionieren!
                  </p>
                </div>
              ) : quizScore >= 75 ? (
                <div className="result-card good">
                  <div className="result-icon">👍</div>
                  <div className="result-title">Gut!</div>
                  <p className="result-text">{quizScore}% richtig!</p>
                </div>
              ) : (
                <div className="result-card retry">
                  <div className="result-icon">📚</div>
                  <div className="result-title">Nochmal lesen</div>
                  <p className="result-text">{quizScore}% richtig.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h3 className="summary-title">📌 Zusammenfassung</h3>
          <ul className="summary-list">
            <li>
              <strong>Wallet-App</strong> = Fernbedienung (Coins sind auf der Blockchain)
            </li>
            <li>
              <strong>Adresse (Public Key)</strong> = Kontonummer (öffentlich, teilen OK)
            </li>
            <li>
              <strong>Private Key / Seed Phrase</strong> = Schlüssel (NIEMALS teilen!)
            </li>
            <li>
              Private Key verloren = <strong>Coins für immer weg</strong> (keine Rücksetzung möglich)
            </li>
            <li>
              Notiere Seed Phrase auf <strong>Papier</strong>, nie digital!
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Wie sieht eine einfache Transaktion aus? 
              Was sind die wichtigsten Felder? 📋
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
