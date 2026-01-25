// src/learning/courses/reading-transactions/modules/Module01_TransactionBasics.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import '../shared/Module.css';

export default function Module01_TransactionBasics() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was ist der Hauptunterschied zwischen einem Überweisungsbeleg und einer Blockchain-Transaktion?",
      options: [
        "Der Beleg ist privat, die Transaktion öffentlich für alle",
        "Der Beleg ist schneller",
        "Die Transaktion kostet nichts",
        "Es gibt keinen Unterschied"
      ],
      correctIndex: 0,
      explanation: "Überweisungsbelege sind privat (nur du und die Bank sehen sie). Blockchain-Transaktionen sind öffentlich und transparent für jeden einsehbar."
    },
    {
      question: "Was bedeutet 'signieren' einer Transaktion?",
      options: [
        "Die Transaktion mit einem Stift unterschreiben",
        "Mit dem Private Key beweisen, dass du der Besitzer bist",
        "Die Transaktion an die Bank senden",
        "Die Transaktion löschen"
      ],
      correctIndex: 1,
      explanation: "Signieren = Mit deinem Private Key mathematisch beweisen, dass du der Wallet-Besitzer bist, ohne den Key preiszugeben."
    },
    {
      question: "Wann gilt eine Transaktion als 'bestätigt'?",
      options: [
        "Sofort nach dem Absenden",
        "Wenn die Bank sie genehmigt",
        "Wenn ein Miner/Validator sie in einen Block aufnimmt",
        "Nach 24 Stunden"
      ],
      correctIndex: 2,
      explanation: "Bestätigt = Die Transaktion wurde in einen Block aufgenommen und ist jetzt Teil der Blockchain."
    },
    {
      question: "Was passiert NICHT mit deinem Private Key beim Senden?",
      options: [
        "Er wird zur Signatur verwendet",
        "Er verlässt dein Gerät",
        "Er erstellt einen mathematischen Beweis",
        "Er bleibt geheim"
      ],
      correctIndex: 1,
      explanation: "Der Private Key verlässt NIEMALS dein Gerät. Nur die Signatur (mathematischer Beweis) wird gesendet."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">📝</div>
        <h1 className="module-title">Was ist eine Transaktion?</h1>
        <p className="module-subtitle">
          Die digitale Quittung im öffentlichen Kassenbuch
        </p>
      </div>

      {/* Story Section */}
      <div className="content-section">
        <span className="section-label">📖 Alltagsbeispiel</span>
        
        <div className="story-card">
          <p className="story-text">
            Du kaufst im Supermarkt für <strong>50€</strong> ein. 
            An der Kasse bezahlst du mit deiner EC-Karte.
          </p>
          <p className="story-text">
            Was passiert? Du gibst deine <strong>PIN</strong> ein (wie ein Passwort), 
            die Kasse sendet die Zahlung an deine Bank, und die Bank bucht das Geld ab.
          </p>
          <p className="story-text">
            Du bekommst einen <strong>Beleg</strong> (Kassenbon) als Nachweis. 
            Auf dem Beleg steht: Wer, was, wie viel, wann.
          </p>
          <p className="story-highlight">
            Eine Blockchain-Transaktion funktioniert ähnlich – nur ohne Bank!
          </p>
        </div>
      </div>

      {/* Comparison */}
      <div className="content-section">
        <span className="section-label">🔄 Vergleich: Bank vs. Blockchain</span>
        
        <div className="comparison-container">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">🏦</span>
              <h3>Bank-Überweisung</h3>
            </div>
            <ul className="comparison-list">
              <li>Du gibst <strong>PIN/Passwort</strong> ein</li>
              <li>Bank prüft und <strong>führt aus</strong></li>
              <li>Beleg ist <strong>privat</strong> (nur du siehst ihn)</li>
              <li>Bank kann Zahlung <strong>rückgängig</strong> machen</li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">⛓️</span>
              <h3>Blockchain-Transaktion</h3>
            </div>
            <ul className="comparison-list">
              <li>Du <strong>signierst</strong> mit Private Key</li>
              <li>Netzwerk (Miner/Validator) prüft</li>
              <li>Quittung ist <strong>öffentlich</strong> für alle</li>
              <li>Transaktion ist <strong>unveränderlich</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Concept Boxes */}
      <div className="content-section">
        <span className="section-label">💡 Kernkonzepte</span>
        
        <ConceptBox
          title="Transaktion = Öffentliche Quittung"
          icon="🧾"
        >
          <p className="concept-text">
            Eine Blockchain-Transaktion ist wie ein <strong>Kassenbon im öffentlichen Kassenbuch</strong>. 
            Jeder kann sie lesen, aber niemand kann sie ändern oder fälschen.
          </p>
          <p className="concept-text" style={{marginTop: '0.75rem'}}>
            Auf der "Quittung" steht: <strong>Wer</strong> hat <strong>wem</strong> wie viel geschickt, 
            <strong>wann</strong> und mit welchen <strong>Gebühren</strong>.
          </p>
        </ConceptBox>

        <ConceptBox
          title="Keine Bank = Du bist verantwortlich"
          icon="🔐"
        >
          <p className="concept-text">
            Es gibt keine Bank, die deine Zahlung rückgängig machen kann. 
            <strong>Du</strong> bist die Bank!
          </p>
          <p className="concept-text" style={{marginTop: '0.75rem'}}>
            Deshalb: <strong>Immer die Empfänger-Adresse doppelt prüfen!</strong> 
            Einmal gesendet = für immer weg.
          </p>
        </ConceptBox>
      </div>

      {/* Transaction Flow */}
      <div className="content-section">
        <span className="section-label">🔄 Wie eine Transaktion abläuft</span>
        
        <div className="metaphor-grid" style={{gridTemplateColumns: '1fr'}}>
          <div className="takeaways-grid">
            <div className="takeaway-item">
              <div className="takeaway-number">1</div>
              <div className="takeaway-content">
                <h4>Du erstellst die Transaktion</h4>
                <p>
                  In deiner Wallet-App gibst du ein: <strong>An wen</strong> (Adresse), 
                  <strong>wie viel</strong> (Betrag), <strong>Gebühr</strong> (Gas).
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">2</div>
              <div className="takeaway-content">
                <h4>Du signierst mit deinem Private Key</h4>
                <p>
                  Deine Wallet erstellt eine <strong>digitale Signatur</strong> – 
                  mathematischer Beweis, dass du der Besitzer bist.
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">3</div>
              <div className="takeaway-content">
                <h4>Transaktion wird ins Netzwerk gesendet</h4>
                <p>
                  Die signierte Nachricht geht an das <strong>Blockchain-Netzwerk</strong>. 
                  Tausende Computer empfangen sie.
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">4</div>
              <div className="takeaway-content">
                <h4>Miner/Validator nimmt sie in Block auf</h4>
                <p>
                  Ein Miner (Bitcoin) oder Validator (Ethereum) <strong>prüft die Transaktion</strong> 
                  und packt sie in einen neuen Block.
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">5</div>
              <div className="takeaway-content">
                <h4>Transaktion ist bestätigt!</h4>
                <p>
                  Der Block wird zur Blockchain hinzugefügt. 
                  Die Transaktion ist jetzt <strong>permanent und öffentlich</strong> 🎉
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metaphor Comparison */}
      <div className="content-section">
        <span className="section-label">🎯 Die Beleg-Metapher</span>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🧾</div>
            <div className="metaphor-title">Überweisungsbeleg</div>
            <p className="metaphor-text">
              • Privat (nur du & Bank)<br/>
              • Kann korrigiert werden<br/>
              • Bank ist Mittelsmann
            </p>
          </div>

          <div className="metaphor-divider">→</div>

          <div className="metaphor-card highlight">
            <div className="metaphor-icon">📜</div>
            <div className="metaphor-title">Blockchain-Transaktion</div>
            <p className="metaphor-text">
              • Öffentlich (jeder sieht sie)<br/>
              • Unveränderlich<br/>
              • Kein Mittelsmann
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <div className="content-section">
        <ExpandableSection 
          title="🔍 Was bedeutet 'öffentlich' genau?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Jeder</strong> kann deine Transaktion im <strong>Blockexplorer</strong> ansehen 
              (z.B. Etherscan.io). Man sieht:
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Von welcher <strong>Adresse</strong> gesendet wurde</li>
              <li>An welche <strong>Adresse</strong> gesendet wurde</li>
              <li>Wie viel <strong>Geld</strong> (z.B. 0.5 ETH)</li>
              <li><strong>Wann</strong> (Zeitstempel)</li>
              <li>Welche <strong>Gebühr</strong> gezahlt wurde</li>
            </ul>
            <p style={{marginTop: '1rem', color: '#a5b4fc', fontStyle: 'italic'}}>
              ⚠️ Aber: Man sieht NICHT deinen Namen oder Private Key. 
              Die Adresse ist wie eine Kontonummer – pseudonym.
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="🔐 Warum kann niemand meine Transaktion fälschen?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Durch die <strong>digitale Signatur</strong>!
            </p>
            <p style={{marginBottom: '1rem'}}>
              Dein Private Key erstellt eine einzigartige Signatur für jede Transaktion. 
              Das Netzwerk kann mit deinem <strong>Public Key</strong> (Adresse) prüfen:
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #6366f1'
            }}>
              ✅ "Diese Signatur wurde wirklich von diesem Private Key erstellt"<br/>
              ✅ "Der Besitzer hat diese Transaktion autorisiert"<br/>
              ❌ "Diese Signatur ist gefälscht" (wird abgelehnt)
            </div>
            <p style={{marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem'}}>
              Es ist mathematisch unmöglich, eine gültige Signatur ohne den Private Key zu erstellen.
            </p>
          </div>
        </ExpandableSection>
      </div>

      {/* Quiz */}
      <div className="content-section">
        <span className="section-label">✅ Wissenscheck</span>
        
        <div className="quiz-section">
          <div className="quiz-intro">
            <p>Teste dein Verständnis mit diesen 4 Fragen:</p>
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
                    Du hast das Konzept einer Transaktion verstanden!
                  </p>
                  <p className="result-hint">
                    Bereit für Wallets & Adressen? 🚀
                  </p>
                </div>
              ) : quizScore >= 75 ? (
                <div className="result-card good">
                  <div className="result-icon">👍</div>
                  <div className="result-title">Gut gemacht!</div>
                  <p className="result-text">
                    {quizScore}% richtig – du bist auf dem richtigen Weg!
                  </p>
                  <p className="result-hint">
                    Lies die Erklärungen nochmal durch, dann geht's weiter.
                  </p>
                </div>
              ) : (
                <div className="result-card retry">
                  <div className="result-icon">📚</div>
                  <div className="result-title">Nochmal lesen</div>
                  <p className="result-text">
                    {quizScore}% richtig – lies das Modul nochmal durch.
                  </p>
                  <p className="result-hint">
                    Die Konzepte brauchen Zeit. Kein Problem! 💪
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
              Eine Transaktion ist wie ein <strong>öffentlicher Kassenbon</strong> im Blockchain-Kassenbuch
            </li>
            <li>
              Du signierst mit deinem <strong>Private Key</strong> (bleibt geheim auf deinem Gerät)
            </li>
            <li>
              Das Netzwerk prüft die Signatur und nimmt die Transaktion in einen <strong>Block</strong> auf
            </li>
            <li>
              <strong>Jeder</strong> kann die Transaktion sehen, aber <strong>niemand</strong> kann sie ändern
            </li>
            <li>
              Es gibt <strong>keine Bank</strong> – du bist selbst verantwortlich! ⚠️
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Was ist eine Wallet? Was ist der Unterschied zwischen 
              Adresse und Private Key? 🔑
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
