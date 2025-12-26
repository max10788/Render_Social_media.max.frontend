// src/learning/courses/data-structures/modules/Module01_DataStructuresIntro.js

import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import ExpandableSection from '../../../components/content/ExpandableSection';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import '../../../courses/blockchain-basics/modules/Module.css';

export default function Module01_DataStructuresIntro() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Warum braucht die Blockchain spezielle Datenstrukturen?",
      options: [
        "Um Daten schnell zu finden und zu verifizieren",
        "Um mehr Speicherplatz zu verbrauchen",
        "Um die Blockchain langsamer zu machen",
        "Um Daten zu verstecken"
      ],
      correctIndex: 0,
      explanation: "Datenstrukturen ermöglichen schnelles Suchen, Verifizieren und effiziente Speicherung von Blockchain-Daten."
    },
    {
      question: "Was ist der Hauptunterschied zwischen einer Datenbank und Blockchain-Datenstrukturen?",
      options: [
        "Blockchain kann Daten löschen, Datenbanken nicht",
        "Blockchain-Daten sind unveränderlich und transparent",
        "Datenbanken sind schneller in allen Bereichen",
        "Blockchain speichert keine Daten"
      ],
      correctIndex: 1,
      explanation: "Blockchain-Daten sind unveränderlich (immutable) und für alle transparent einsehbar."
    },
    {
      question: "Welche Information findest du NICHT in einem Blockexplorer?",
      options: [
        "Transaktionshash",
        "Private Keys von Wallets",
        "Smart Contract Interaktionen",
        "Gas-Gebühren"
      ],
      correctIndex: 1,
      explanation: "Private Keys sind geheim und werden niemals öffentlich angezeigt. Alles andere ist transparent."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">🗂️</div>
        <h1 className="module-title">Datenstrukturen verstehen</h1>
        <p className="module-subtitle">
          Warum die Blockchain Daten wie eine Bibliothek organisiert
        </p>
      </div>

      {/* Story Section */}
      <div className="content-section">
        <span className="section-label">📖 Alltagsbeispiel</span>
        
        <div className="story-card">
          <p className="story-text">
            Stell dir vor, du hast 10.000 Bücher zu Hause. Du wirfst sie einfach alle in einen riesigen Raum.
          </p>
          <p className="story-text">
            <strong>Problem:</strong> Jemand fragt dich: "Hast du das Buch über Bitcoin?" 
            Du müsstest jedes einzelne Buch durchsuchen. Das dauert Stunden!
          </p>
          <p className="story-text">
            <strong>Lösung:</strong> Du baust ein Regalsystem mit Kategorien, alphabetischer Sortierung 
            und einem Katalog. Jetzt findest du jedes Buch in Sekunden.
          </p>
          <p className="story-highlight">
            Die Blockchain steht vor demselben Problem – nur mit Millionen von Transaktionen!
          </p>
        </div>
      </div>

      {/* Comparison */}
      <div className="content-section">
        <span className="section-label">🔄 Vergleich</span>
        
        <div className="comparison-container">
          <div className="comparison-item problem">
            <div className="comparison-header">
              <span className="comparison-icon">❌</span>
              <h3>Ohne Datenstrukturen</h3>
            </div>
            <ul className="comparison-list">
              <li>Daten liegen <strong>ungeordnet</strong> herum</li>
              <li>Suche nach einer Transaktion: <strong>Stunden</strong></li>
              <li>Verifizierung: <strong>unmöglich schnell</strong></li>
              <li>Speicher wird <strong>verschwendet</strong></li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">✅</span>
              <h3>Mit Datenstrukturen</h3>
            </div>
            <ul className="comparison-list">
              <li>Daten sind <strong>organisiert</strong></li>
              <li>Suche: <strong>Millisekunden</strong></li>
              <li>Verifizierung: <strong>sofort</strong></li>
              <li>Speicher <strong>effizient genutzt</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Konzeptboxen */}
      <div className="content-section">
        <span className="section-label">💡 Wichtige Konzepte</span>
        
        <ConceptBox
          title="Was sind Datenstrukturen?"
          icon="🏗️"
          type="info"
        >
          <p>
            Datenstrukturen sind <strong>Organisationssysteme</strong> für Daten. 
            Wie Regale in einer Bibliothek bestimmen sie:
          </p>
          <ul>
            <li><strong>Wo</strong> Daten gespeichert werden</li>
            <li><strong>Wie schnell</strong> man sie findet</li>
            <li><strong>Wie effizient</strong> der Speicher genutzt wird</li>
          </ul>
        </ConceptBox>

        <ConceptBox
          title="Warum braucht die Blockchain das?"
          icon="⚡"
          type="warning"
        >
          <p>
            Ethereum verarbeitet <strong>~1 Million Transaktionen pro Tag</strong>. 
            Ohne clevere Datenstrukturen wäre es unmöglich:
          </p>
          <ul>
            <li>Schnell zu prüfen ob eine Wallet Geld hat</li>
            <li>Transaktionen in Sekunden zu verifizieren</li>
            <li>Tausende Nodes synchron zu halten</li>
          </ul>
        </ConceptBox>
      </div>

      {/* Metapher Grid */}
      <div className="content-section">
        <span className="section-label">🔗 Wie Blockchain Daten organisiert</span>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">📚</div>
            <div className="metaphor-title">Bibliothek</div>
            <p className="metaphor-text">
              Regale, Kategorien, Katalog für schnelles Finden
            </p>
          </div>

          <div className="metaphor-divider">≈</div>

          <div className="metaphor-card highlight">
            <div className="metaphor-icon">⛓️</div>
            <div className="metaphor-title">Blockchain</div>
            <p className="metaphor-text">
              Arrays, Hash Tables, Merkle Trees für schnellen Zugriff
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Deep Dive */}
      <div className="content-section">
        <ExpandableSection title="🔍 Welche Datenstrukturen nutzt die Blockchain?" defaultExpanded={false}>
          <div className="takeaways-grid">
            <div className="takeaway-item">
              <div className="takeaway-number">1</div>
              <div className="takeaway-content">
                <h4>Arrays & Listen</h4>
                <p>Transaktionen in einem Block werden als <strong>Liste</strong> gespeichert - wie eine nummerierte Einkaufsliste.</p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">2</div>
              <div className="takeaway-content">
                <h4>Hash Tables (Mappings)</h4>
                <p>Wallet-Balances werden als <strong>Schlüssel-Wert-Paare</strong> gespeichert: Adresse → Betrag.</p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">3</div>
              <div className="takeaway-content">
                <h4>Merkle Trees</h4>
                <p>Ermöglichen <strong>blitzschnelle Verifikation</strong> von Transaktionen ohne alle Daten zu laden.</p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">4</div>
              <div className="takeaway-content">
                <h4>Patricia Tries</h4>
                <p>Ethereum's spezielles System um <strong>Account-States</strong> effizient zu speichern.</p>
              </div>
            </div>
          </div>
        </ExpandableSection>
      </div>

      {/* Quiz */}
      <div className="content-section">
        <span className="section-label">✅ Wissenscheck</span>
        
        <div className="quiz-section">
          <div className="quiz-intro">
            <p>Teste dein Verständnis mit diesen 3 Fragen:</p>
          </div>

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
                    Du hast alle Fragen richtig beantwortet. Bereit für Arrays & Listen!
                  </p>
                </div>
              ) : quizScore >= 66 ? (
                <div className="result-card good">
                  <div className="result-icon">👍</div>
                  <div className="result-title">Gut gemacht!</div>
                  <p className="result-text">
                    {quizScore}% richtig. Du kannst weitermachen!
                  </p>
                </div>
              ) : (
                <div className="result-card retry">
                  <div className="result-icon">📚</div>
                  <div className="result-title">Nochmal lesen</div>
                  <p className="result-text">
                    {quizScore}% richtig. Lies das Modul nochmal durch.
                  </p>
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
              <strong>Datenstrukturen</strong> organisieren Blockchain-Daten wie Regale in einer Bibliothek
            </li>
            <li>
              Ohne sie wäre die Blockchain <strong>viel zu langsam</strong> und ineffizient
            </li>
            <li>
              Wichtigste Strukturen: <strong>Arrays, Hash Tables, Merkle Trees, Tries</strong>
            </li>
            <li>
              Sie ermöglichen <strong>schnelles Suchen, Verifizieren und Speichern</strong>
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Wir schauen uns an wie Transaktionen in einem Block 
              als <strong>Array (Liste)</strong> gespeichert werden! 📋
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
