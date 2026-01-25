import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import ExpandableSection from '../../../components/content/ExpandableSection';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import '../../shared/Module.css';

const Module03_BlockStructure = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Was enthält ein Block in einer Blockchain?",
      answers: [
        "Nur eine einzelne Transaktion",
        "Mehrere Transaktionen, einen Zeitstempel und einen Hash",
        "Nur den Hash des vorherigen Blocks"
      ],
      correct: 1,
      explanation: "Richtig! Ein Block ist wie ein Umschlag, der mehrere Briefe (Transaktionen) enthält. Außen auf dem Umschlag steht die Zeit (Zeitstempel) und ein eindeutiges Siegel (Hash). So kann man später nachvollziehen, was wann passiert ist."
    },
    {
      question: "Warum braucht jeder Block einen Zeitstempel?",
      answers: [
        "Damit man weiß, in welcher Reihenfolge die Blöcke erstellt wurden",
        "Nur zur Dekoration",
        "Damit der Block schöner aussieht"
      ],
      correct: 0,
      explanation: "Genau! Der Zeitstempel ist wie ein Datumsstempel auf einem Brief. Er zeigt, wann der Block erstellt wurde. Das ist wichtig, um später zu beweisen: 'Diese Transaktion war VOR jener anderen.' So kann niemand behaupten, eine Zahlung sei früher oder später erfolgt."
    },
    {
      question: "Was ist der Hash eines Blocks?",
      answers: [
        "Die Anzahl der Transaktionen im Block",
        "Ein eindeutiger digitaler Fingerabdruck des gesamten Block-Inhalts",
        "Der Name des Blocks"
      ],
      correct: 1,
      explanation: "Perfekt! Der Hash ist wie ein Fingerabdruck oder Siegel. Jeder Block hat einen einzigartigen Hash, der aus allen Informationen im Block berechnet wird. Wenn auch nur ein Buchstabe im Block geändert wird, ändert sich der gesamte Hash. Das macht Manipulation sofort erkennbar."
    }
  ];

  const handleQuizComplete = (score) => {
    setQuizScore(score);
    setQuizCompleted(true);
    
    const passed = score >= 2;
    if (passed && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-number">Modul 3 von 9</div>
        <h1 className="module-title">Der Block als Datenstruktur</h1>
        <p className="module-subtitle">
          Was steht eigentlich in so einem Block? Lass uns ihn aufmachen und reinschauen!
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du bekommst einen <strong>versiegelten Briefumschlag</strong> von 
            deiner Oma. Außen steht: "25. Dezember 2025, 14:30 Uhr" und ein rotes Wachssiegel.
          </p>
          <p>
            Wenn du den Umschlag öffnest, findest du mehrere Briefe drin: "10€ für Tom", 
            "5€ für Lisa", "Grüße an Anna". Der Umschlag fasst mehrere Nachrichten zusammen.
          </p>
          <p>
            <strong>Genau so funktioniert ein Block in der Blockchain:</strong> Er ist wie 
            ein versiegelter Umschlag, der mehrere Transaktionen (Briefe) enthält, einen 
            Zeitstempel trägt (Datum außen) und ein eindeutiges Siegel hat (Hash).
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="📦"
          title="Ein Block = Container für Daten"
          description="Ein Block ist wie ein Behälter, der mehrere Informationen speichert: Transaktionen (Wer sendet was an wen?), einen Zeitstempel (Wann?) und einen eindeutigen Hash (digitales Siegel)."
        />
        <div className="concept-explanation">
          <p>
            Denk an einen Block wie an einen <strong>Aktenordner</strong>: Drin liegen mehrere 
            Dokumente (Transaktionen), außen steht ein Datum (Zeitstempel) und eine eindeutige 
            Aktennummer (Hash).
          </p>
        </div>
      </section>

      {/* Block Anatomy Visualization */}
      <section className="content-section">
        <div className="section-label">🔍 Block-Anatomie: Was steht drin?</div>
        <div className="block-anatomy">
          <div className="anatomy-container">
            {/* Block Header */}
            <div className="anatomy-section header">
              <div className="anatomy-label">
                <span className="label-icon">📋</span>
                <strong>Block-Header</strong> (Kopf des Blocks)
              </div>
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">Block-Nummer:</span>
                  <span className="item-value">#1234</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Zeitstempel:</span>
                  <span className="item-value">25.12.2025, 14:30:00</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Hash des vorherigen Blocks:</span>
                  <span className="item-value hash-value">0000a1b2c3d4...</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Eigener Hash:</span>
                  <span className="item-value hash-value">0000e5f6g7h8...</span>
                </div>
              </div>
            </div>

            {/* Block Body */}
            <div className="anatomy-section body">
              <div className="anatomy-label">
                <span className="label-icon">📝</span>
                <strong>Block-Body</strong> (Inhalt des Blocks)
              </div>
              <div className="anatomy-content">
                <div className="transaction-list">
                  <div className="transaction-item">
                    <span className="tx-icon">💸</span>
                    <span className="tx-text">Anna → Tom: 5 BTC</span>
                  </div>
                  <div className="transaction-item">
                    <span className="tx-icon">💸</span>
                    <span className="tx-text">Lisa → Max: 2 BTC</span>
                  </div>
                  <div className="transaction-item">
                    <span className="tx-icon">💸</span>
                    <span className="tx-text">Tom → Sarah: 1 BTC</span>
                  </div>
                  <div className="transaction-count">
                    ... und 47 weitere Transaktionen
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p>
              <strong>Block-Header:</strong> Enthält "Metadaten" (Daten über Daten) - wie 
              die Aufschrift auf einem Umschlag.
            </p>
            <p>
              <strong>Block-Body:</strong> Enthält die eigentlichen Transaktionen - wie die 
              Briefe im Umschlag.
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Explanation of Components */}
      <section className="content-section">
        <div className="section-label">⚙️ Die einzelnen Bestandteile erklärt</div>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon">🔢</div>
            <h4>Block-Nummer</h4>
            <p>
              Wie eine Seitenzahl in einem Buch. Der erste Block hat Nummer 0 (Genesis-Block), 
              der nächste Nummer 1, dann 2, 3, usw. So weiß man immer: "Dieser Block kommt 
              nach jenem."
            </p>
            <div className="component-example">
              <strong>Beispiel:</strong> Block #1234 ist der 1235. Block in der Kette
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon">⏰</div>
            <h4>Zeitstempel</h4>
            <p>
              Zeigt, wann der Block erstellt wurde. Das ist wichtig, um zu beweisen: 
              "Diese Transaktion war definitiv am 25.12.2025 um 14:30 Uhr." Niemand kann 
              später sagen: "Das war doch erst gestern!"
            </p>
            <div className="component-example">
              <strong>Beispiel:</strong> 2025-12-25T14:30:00Z
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon">🔗</div>
            <h4>Hash des vorherigen Blocks</h4>
            <p>
              Wie ein Verweis in einem Buch: "siehe vorherige Seite". Dieser Hash zeigt 
              auf den Block davor und verbindet die Blöcke zu einer Kette. Wenn jemand 
              einen alten Block ändern würde, würde diese Verbindung brechen.
            </p>
            <div className="component-example">
              <strong>Beispiel:</strong> 0000a1b2c3d4e5f6g7h8...
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon">🔐</div>
            <h4>Eigener Hash (Block-Hash)</h4>
            <p>
              Der "Fingerabdruck" dieses Blocks. Er wird aus ALLEN Informationen im Block 
              berechnet: Transaktionen, Zeit, vorheriger Hash. Wenn auch nur ein Buchstabe 
              geändert wird, ist der Hash komplett anders.
            </p>
            <div className="component-example">
              <strong>Beispiel:</strong> 0000e5f6g7h8i9j0k1l2...
            </div>
          </div>

          <div className="component-card full-width">
            <div className="component-icon">💰</div>
            <h4>Transaktionen</h4>
            <p>
              Das Herzstück des Blocks! Eine Liste von Aktionen: "Anna sendet 5 Bitcoin an Tom", 
              "Lisa sendet 2 Bitcoin an Max". Ein Block kann hunderte solcher Transaktionen 
              enthalten - wie ein Umschlag mit vielen Briefen.
            </p>
            <div className="component-example">
              <strong>Beispiel:</strong><br/>
              1. Anna → Tom: 5 BTC<br/>
              2. Lisa → Max: 2 BTC<br/>
              3. Tom → Sarah: 1 BTC
            </div>
          </div>
        </div>
      </section>

      {/* Metaphor Grid */}
      <section className="content-section">
        <div className="section-label">🎨 Verschiedene Metaphern für einen Block</div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">✉️</div>
            <h4>Versiegelter Umschlag</h4>
            <p>
              <strong>Außen:</strong> Datum, Absender, Siegel (Hash)<br/>
              <strong>Innen:</strong> Mehrere Briefe (Transaktionen)
            </p>
            <p className="metaphor-note">
              Wenn das Siegel gebrochen wird, sieht man es sofort!
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">📁</div>
            <h4>Aktenordner</h4>
            <p>
              <strong>Rückenschild:</strong> Datum, Ordnernummer<br/>
              <strong>Inhalt:</strong> Viele Dokumente (Transaktionen)
            </p>
            <p className="metaphor-note">
              Jeder Ordner hat eine eindeutige Nummer (Hash)
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">📦</div>
            <h4>Paket mit Lieferschein</h4>
            <p>
              <strong>Lieferschein:</strong> Datum, Paketnummer, vorheriges Paket<br/>
              <strong>Inhalt:</strong> Mehrere Artikel (Transaktionen)
            </p>
            <p className="metaphor-note">
              Jedes Paket verweist auf das vorherige in der Lieferkette
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Example */}
      <section className="content-section">
        <div className="section-label">🎯 Beispiel: Ein echter Block</div>
        <div className="example-block">
          <div className="example-header">
            <h4>Bitcoin Block #800,000</h4>
            <p className="example-note">(Vereinfachte Darstellung)</p>
          </div>
          
          <div className="example-content">
            <div className="example-row">
              <span className="example-key">Block-Nummer:</span>
              <span className="example-value">#800,000</span>
            </div>
            <div className="example-row">
              <span className="example-key">Zeitstempel:</span>
              <span className="example-value">14. Juli 2023, 03:14:56 UTC</span>
            </div>
            <div className="example-row">
              <span className="example-key">Hash:</span>
              <span className="example-value hash-value">
                00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054
              </span>
            </div>
            <div className="example-row">
              <span className="example-key">Vorheriger Hash:</span>
              <span className="example-value hash-value">
                00000000000000000001c792c63b2e4fd75c93d783c6ffe6f32f25b8f2e9e99b
              </span>
            </div>
            <div className="example-row">
              <span className="example-key">Anzahl Transaktionen:</span>
              <span className="example-value">2,345 Transaktionen</span>
            </div>
          </div>

          <div className="example-explanation">
            <p>
              👆 Das ist ein echter Bitcoin-Block! Beachte: Der Hash beginnt mit vielen 
              Nullen - das ist kein Zufall, sondern Teil des "Mining"-Prozesses (dazu 
              später mehr). Die 2,345 Transaktionen sind wie 2,345 Briefe in einem Umschlag.
            </p>
          </div>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="content-section">
        <div className="section-label">🔑 Die wichtigsten Punkte</div>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Block = Container</h4>
              <p>
                Ein Block ist ein Container, der mehrere Transaktionen bündelt - wie ein 
                Umschlag mit mehreren Briefen oder ein Aktenordner mit mehreren Dokumenten.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Drei Hauptbestandteile</h4>
              <p>
                Jeder Block hat: (1) Transaktionen (die Daten), (2) einen Zeitstempel 
                (wann?), und (3) einen Hash (eindeutiges Siegel/Fingerabdruck).
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Verkettung durch Hashes</h4>
              <p>
                Jeder Block enthält den Hash des vorherigen Blocks - wie ein Verweis. 
                Das verbindet alle Blöcke zu einer Kette (mehr dazu im nächsten Modul!).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Warum steht der vorherige Hash mit im Block?">
        <div className="deep-dive-content">
          <p>
            <strong>Gute Frage!</strong> Warum muss jeder Block den Hash des vorherigen 
            Blocks enthalten? Könnte man nicht einfach eine Liste von Blöcken haben?
          </p>
          
          <h4>Der Trick mit dem Hash-Verweis</h4>
          <p>
            Stell dir vor, du änderst heimlich Block #1233. Dann ändert sich sein Hash. 
            Aber Block #1234 enthält noch den ALTEN Hash von #1233! 
          </p>
          
          <div className="deep-dive-example">
            <p><strong>Vorher:</strong></p>
            <p>Block #1233: Hash = ABC123</p>
            <p>Block #1234: Vorheriger Hash = ABC123 ✅ (passt!)</p>
            
            <p className="example-divider">↓ Jemand ändert Block #1233 ↓</p>
            
            <p><strong>Nachher:</strong></p>
            <p>Block #1233: Hash = XYZ789 (neu!)</p>
            <p>Block #1234: Vorheriger Hash = ABC123 ❌ (passt nicht mehr!)</p>
          </div>

          <p>
            Die Kette ist gebrochen! Jeder im Netzwerk sieht: "Hey, da stimmt was nicht!" 
            Um die Manipulation zu verbergen, müsste der Angreifer ALLE folgenden Blöcke 
            auch ändern - was praktisch unmöglich ist.
          </p>

          <h4>Wie ein Dominoeffekt</h4>
          <p>
            Wenn du einen alten Block änderst, ist das wie wenn du einen Dominostein in 
            der Mitte einer langen Reihe verschiebst - alle nachfolgenden Steine passen 
            nicht mehr. Die Kette ist kaputt und alle sehen es.
          </p>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du verstanden hast, was in einem Block steht. 
            Beantworte mindestens 2 von 3 Fragen richtig, um fortzufahren.
          </p>
        </div>
        <MultipleChoice 
          questions={quizQuestions} 
          onComplete={handleQuizComplete}
        />
        {quizCompleted && (
          <div className={`quiz-result ${quizScore >= 2 ? 'success' : 'warning'}`}>
            <h3>
              {quizScore >= 2 
                ? '🎉 Sehr gut! Du kennst dich jetzt mit Blöcken aus!' 
                : '📚 Fast! Schau dir die Block-Anatomie nochmal an.'}
            </h3>
            <p>
              Du hast {quizScore} von {quizQuestions.length} Fragen richtig beantwortet.
            </p>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="summary-section">
        <div className="section-label">📝 Zusammenfassung</div>
        <div className="summary-content">
          <h3>Was du gelernt hast:</h3>
          <div className="summary-points">
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Ein <strong>Block</strong> ist wie ein versiegelter Umschlag oder Aktenordner, 
                der mehrere Transaktionen zusammenfasst.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Jeder Block enthält: <strong>Transaktionen</strong> (die Daten), einen 
                <strong> Zeitstempel</strong> (wann?) und einen <strong>Hash</strong> 
                (eindeutiges Siegel).
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Der <strong>Hash des vorherigen Blocks</strong> verbindet alle Blöcke zu 
                einer Kette. Wenn jemand einen alten Block ändert, bricht die Kette und 
                alle sehen es.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Ein echter Bitcoin-Block kann <strong>tausende Transaktionen</strong> enthalten - 
                wie ein großer Umschlag mit vielen Briefen.
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Wie genau diese Blöcke zu einer <strong>Kette</strong> verbunden werden. 
              Warum heißt es "Block-CHAIN"? Und was passiert, wenn jemand versucht, 
              die Kette zu manipulieren?
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module03_BlockStructure;
