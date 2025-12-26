import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import './Module.css';

const Module05_HashFunction = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Hash Simulator State
  const [inputText, setInputText] = useState('Hallo Welt');
  const [simulatedHash, setSimulatedHash] = useState('');

  // Simple hash simulation (not real SHA-256, just for demonstration)
  const simulateHash = (text) => {
    if (!text) return '0000000000000000';
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Convert to hex-like string
    const hexHash = Math.abs(hash).toString(16).padStart(16, '0');
    return hexHash.substring(0, 16);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setSimulatedHash(simulateHash(text));
  };

  useState(() => {
    setSimulatedHash(simulateHash(inputText));
  }, []);

  const quizQuestions = [
    {
      question: "Was ist ein Hash?",
      answers: [
        "Ein Passwort für die Blockchain",
        "Ein eindeutiger digitaler Fingerabdruck von Daten",
        "Die Anzahl der Transaktionen"
      ],
      correct: 1,
      explanation: "Richtig! Ein Hash ist wie ein Fingerabdruck: Jedes Dokument, jede Datei, jeder Text hat einen einzigartigen Hash. Wie dein Fingerabdruck nur dir gehört, gehört jeder Hash zu genau einem bestimmten Dateninhalt."
    },
    {
      question: "Was passiert, wenn du nur einen Buchstaben in einem Text änderst?",
      answers: [
        "Der Hash ändert sich ein klein wenig",
        "Der Hash bleibt gleich",
        "Der Hash ändert sich komplett"
      ],
      correct: 2,
      explanation: "Genau! Das ist das Geniale an Hash-Funktionen: Selbst die kleinste Änderung (ein Buchstabe, ein Punkt, ein Leerzeichen) führt zu einem völlig anderen Hash. Aus 'Hallo' wird ein ganz anderer Hash als aus 'Halo' - obwohl nur ein Buchstabe fehlt!"
    },
    {
      question: "Kann man aus einem Hash zurückrechnen, welcher Text dahinter steckt?",
      answers: [
        "Ja, ganz einfach",
        "Nein, das ist praktisch unmöglich (Einweg-Funktion)",
        "Nur mit einem speziellen Passwort"
      ],
      correct: 1,
      explanation: "Perfekt! Hash-Funktionen sind 'Einweg-Funktionen' - wie ein Fleischwolf. Du kannst Fleisch leicht zu Hackfleisch machen, aber aus Hackfleisch kannst du nicht mehr das ursprüngliche Stück Fleisch zurückgewinnen. So ist es mit Hashes: Text → Hash ist einfach, aber Hash → Text ist praktisch unmöglich."
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
        <div className="module-number">Modul 5 von 9</div>
        <h1 className="module-title">Die Hash-Funktion</h1>
        <p className="module-subtitle">
          Der digitale Fingerabdruck - wie kleine Änderungen zu komplett neuen Hashes führen
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du bist Detektiv. An einem Tatort findest du einen <strong>Fingerabdruck</strong>. 
            Dieser Fingerabdruck ist einzigartig - er gehört zu genau einer Person auf der ganzen Welt.
          </p>
          <p>
            Selbst wenn zwei Zwillinge fast identisch aussehen, sind ihre <strong>Fingerabdrücke 
            völlig verschieden</strong>. Sogar dein linker und rechter Zeigefinger haben unterschiedliche 
            Muster.
          </p>
          <p>
            <strong>Ein Hash ist der digitale Fingerabdruck von Daten:</strong> Jeder Text, jede 
            Datei, jedes Dokument hat einen einzigartigen Hash. Änderst du auch nur einen Buchstaben, 
            ist der "Fingerabdruck" komplett anders - wie wenn du eine ganz andere Person wärst.
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="🔐"
          title="Hash = Digitaler Fingerabdruck"
          description="Eine Hash-Funktion nimmt beliebige Daten (Text, Zahlen, Dateien) und berechnet daraus eine feste Zahlen- und Buchstabenkombination. Dieser Hash ist wie ein Fingerabdruck: einzigartig und unveränderlich."
        />
        <div className="concept-explanation">
          <p>
            Denk an einen Hash wie an einen <strong>QR-Code für Daten</strong>: Zwei verschiedene 
            Texte können nie den gleichen Hash haben. Und selbst die kleinste Änderung (ein Leerzeichen, 
            ein Komma) führt zu einem komplett anderen Hash.
          </p>
        </div>
      </section>

      {/* Interactive Hash Simulator */}
      <section className="content-section">
        <div className="section-label">🎮 Interaktiver Hash-Simulator</div>
        <div className="hash-simulator">
          <div className="simulator-intro">
            <p>
              Probiere es selbst aus! Gib einen Text ein und sieh dir den berechneten Hash an. 
              Ändere dann nur einen Buchstaben und beobachte, wie sich der gesamte Hash verändert.
            </p>
          </div>

          <div className="simulator-container">
            <div className="simulator-input-section">
              <label htmlFor="hash-input" className="simulator-label">
                <span className="label-icon">📝</span>
                Dein Text:
              </label>
              <textarea
                id="hash-input"
                className="hash-input"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Gib hier einen Text ein..."
                rows="4"
              />
              <div className="input-info">
                Zeichen: {inputText.length}
              </div>
            </div>

            <div className="simulator-arrow">
              <div className="arrow-icon">→</div>
              <div className="arrow-label">Hash-Funktion</div>
            </div>

            <div className="simulator-output-section">
              <label className="simulator-label">
                <span className="label-icon">🔐</span>
                Berechneter Hash:
              </label>
              <div className="hash-output">
                {simulatedHash || 'Gib einen Text ein...'}
              </div>
              <div className="output-info">
                Immer 16 Zeichen (vereinfacht)
              </div>
            </div>
          </div>

          <div className="simulator-examples">
            <h4>Probiere diese Beispiele:</h4>
            <div className="example-buttons">
              <button 
                className="example-btn"
                onClick={() => {
                  setInputText('Hallo Welt');
                  setSimulatedHash(simulateHash('Hallo Welt'));
                }}
              >
                "Hallo Welt"
              </button>
              <button 
                className="example-btn"
                onClick={() => {
                  setInputText('Hallo Wel');
                  setSimulatedHash(simulateHash('Hallo Wel'));
                }}
              >
                "Hallo Wel" (ohne 't')
              </button>
              <button 
                className="example-btn"
                onClick={() => {
                  setInputText('Hallo Welt!');
                  setSimulatedHash(simulateHash('Hallo Welt!'));
                }}
              >
                "Hallo Welt!" (mit '!')
              </button>
              <button 
                className="example-btn"
                onClick={() => {
                  setInputText('Blockchain ist cool');
                  setSimulatedHash(simulateHash('Blockchain ist cool'));
                }}
              >
                "Blockchain ist cool"
              </button>
            </div>
            <p className="examples-note">
              💡 Beachte: Selbst kleinste Änderungen führen zu komplett anderen Hashes!
            </p>
          </div>
        </div>
      </section>

      {/* Hash Properties */}
      <section className="content-section">
        <div className="section-label">⚙️ Die 5 wichtigsten Eigenschaften einer Hash-Funktion</div>
        
        <div className="properties-grid">
          <div className="property-card">
            <div className="property-number">1</div>
            <div className="property-content">
              <h4>Eindeutig (Deterministisch)</h4>
              <p>
                Der gleiche Input führt IMMER zum gleichen Hash. Wenn du 100 Mal "Hallo" 
                eingibst, bekommst du 100 Mal den gleichen Hash.
              </p>
              <div className="property-example">
                <div className="example-row">
                  <span>"Hallo"</span> → <span className="hash-short">abc123def456</span>
                </div>
                <div className="example-row">
                  <span>"Hallo"</span> → <span className="hash-short">abc123def456</span> (gleich!)
                </div>
              </div>
            </div>
          </div>

          <div className="property-card">
            <div className="property-number">2</div>
            <div className="property-content">
              <h4>Schnell zu berechnen</h4>
              <p>
                Egal ob du 5 Buchstaben oder 5 Millionen Buchstaben hast - die Hash-Funktion 
                berechnet den Hash in Sekundenbruchteilen.
              </p>
              <div className="property-example">
                <div className="example-row">
                  <span>"Hi"</span> → <span className="time">0.001 Sekunden</span>
                </div>
                <div className="example-row">
                  <span>"Ganzes Buch"</span> → <span className="time">0.001 Sekunden</span>
                </div>
              </div>
            </div>
          </div>

          <div className="property-card">
            <div className="property-number">3</div>
            <div className="property-content">
              <h4>Kleine Änderung = Komplett neuer Hash</h4>
              <p>
                Das ist die wichtigste Eigenschaft! Selbst wenn du nur ein Komma hinzufügst, 
                ist der Hash völlig anders. Man nennt das den "Avalanche-Effekt" (Lawinen-Effekt).
              </p>
              <div className="property-example">
                <div className="example-row">
                  <span>"Katze"</span> → <span className="hash-short">a1b2c3d4e5f6</span>
                </div>
                <div className="example-row">
                  <span>"Katzen"</span> → <span className="hash-short">z9y8x7w6v5u4</span> (völlig anders!)
                </div>
              </div>
            </div>
          </div>

          <div className="property-card">
            <div className="property-number">4</div>
            <div className="property-content">
              <h4>Feste Länge</h4>
              <p>
                Egal wie lang der Input ist - der Hash hat immer die gleiche Länge. 
                Bei Bitcoin (SHA-256) sind es immer 64 Zeichen.
              </p>
              <div className="property-example">
                <div className="example-row">
                  <span>"Hi"</span> → <span className="hash-short">abc...xyz</span> (64 Zeichen)
                </div>
                <div className="example-row">
                  <span>"Die Bibel"</span> → <span className="hash-short">def...uvw</span> (64 Zeichen)
                </div>
              </div>
            </div>
          </div>

          <div className="property-card full-width">
            <div className="property-number">5</div>
            <div className="property-content">
              <h4>Einweg-Funktion (nicht umkehrbar)</h4>
              <p>
                Aus dem Hash kannst du NICHT zurückrechnen, welcher Text dahinter steckt. 
                Es ist wie ein Fleischwolf: Text → Hash ist einfach, aber Hash → Text ist 
                praktisch unmöglich.
              </p>
              <div className="property-example">
                <div className="example-row direction-row">
                  <span>"Mein Passwort"</span> 
                  <span className="arrow-forward">→ EINFACH →</span> 
                  <span className="hash-short">xyz789abc123</span>
                </div>
                <div className="example-row direction-row">
                  <span className="hash-short">xyz789abc123</span> 
                  <span className="arrow-backward">← UNMÖGLICH ←</span> 
                  <span>???</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real World Example */}
      <section className="content-section">
        <div className="section-label">🌍 Echte Hash-Funktion: SHA-256</div>
        <div className="real-hash-example">
          <div className="real-hash-intro">
            <p>
              Die Bitcoin-Blockchain nutzt die Hash-Funktion <strong>SHA-256</strong> 
              (Secure Hash Algorithm, 256 Bit). Hier siehst du echte Beispiele:
            </p>
          </div>

          <div className="real-hash-samples">
            <div className="hash-sample">
              <div className="sample-input">
                <span className="input-label">Input:</span>
                <span className="input-text">"Hallo Welt"</span>
              </div>
              <div className="sample-output">
                <span className="output-label">SHA-256 Hash:</span>
                <span className="output-hash">
                  a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
                </span>
              </div>
            </div>

            <div className="hash-sample">
              <div className="sample-input">
                <span className="input-label">Input:</span>
                <span className="input-text">"Hallo Welt!"</span>
                <span className="input-note">(nur ein '!' hinzugefügt)</span>
              </div>
              <div className="sample-output">
                <span className="output-label">SHA-256 Hash:</span>
                <span className="output-hash changed">
                  315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3
                </span>
              </div>
            </div>
          </div>

          <div className="real-hash-note">
            <p>
              👆 Siehst du? Ein einziges Ausrufezeichen macht den Hash <strong>komplett 
              anders</strong>! Kein einziges Zeichen ist gleich geblieben. Das ist der 
              "Avalanche-Effekt" in Aktion.
            </p>
          </div>
        </div>
      </section>

      {/* Metaphor Grid */}
      <section className="content-section">
        <div className="section-label">🎨 Verschiedene Metaphern für Hashes</div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">👆</div>
            <h4>Fingerabdruck</h4>
            <p>
              Wie dein Fingerabdruck einzigartig ist, ist jeder Hash einzigartig. Zwei 
              verschiedene Texte haben nie den gleichen Hash - wie zwei Menschen nie den 
              gleichen Fingerabdruck haben.
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">🔨</div>
            <h4>Fleischwolf (Einweg)</h4>
            <p>
              Fleisch durch den Wolf drehen ist einfach. Aber aus Hackfleisch das 
              ursprüngliche Stück Fleisch zurückgewinnen? Unmöglich! So ist es mit 
              Hash-Funktionen: nur in eine Richtung.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">📸</div>
            <h4>Foto einer Szene</h4>
            <p>
              Ein Foto zeigt dir einen Moment. Aber aus dem Foto kannst du nicht alle 
              Details der Szene perfekt rekonstruieren. Du weißt, dass etwas da war, 
              aber nicht jedes Detail.
            </p>
          </div>
        </div>
      </section>

      {/* Why Important for Blockchain */}
      <section className="content-section">
        <div className="section-label">🔗 Warum sind Hashes so wichtig für Blockchain?</div>
        <div className="importance-container">
          <div className="importance-card">
            <div className="importance-icon">🔒</div>
            <h4>Manipulation wird sofort erkannt</h4>
            <p>
              Wenn jemand auch nur ein einziges Byte in einem Block ändert, ändert sich 
              der Hash komplett. Alle anderen Teilnehmer sehen: "Hey, dieser Hash passt 
              nicht mehr zum Inhalt!"
            </p>
            <div className="importance-example">
              <div>Block-Inhalt: "Anna → Tom: 5 BTC"</div>
              <div>Hash: abc123def456</div>
              <div className="change-arrow">↓ Manipulation ↓</div>
              <div>Block-Inhalt: "Anna → Tom: 500 BTC"</div>
              <div className="changed-hash">Hash: xyz789uvw012 ❌</div>
            </div>
          </div>

          <div className="importance-card">
            <div className="importance-icon">⛓️</div>
            <h4>Verkettung der Blöcke</h4>
            <p>
              Jeder Block enthält den Hash des vorherigen Blocks. Wenn du Block #100 änderst, 
              ändert sich sein Hash. Aber Block #101 verweist noch auf den alten Hash - die 
              Kette ist kaputt!
            </p>
            <div className="importance-example">
              <div>Block #100: Hash = ABC</div>
              <div>Block #101: Prev-Hash = ABC ✓</div>
              <div className="change-arrow">↓ Block #100 geändert ↓</div>
              <div>Block #100: Hash = XYZ (neu!)</div>
              <div className="changed-hash">Block #101: Prev-Hash = ABC ❌</div>
            </div>
          </div>

          <div className="importance-card">
            <div className="importance-icon">🎯</div>
            <h4>Effiziente Verifikation</h4>
            <p>
              Anstatt tausende Transaktionen zu vergleichen, kann man einfach die Hashes 
              vergleichen. Wenn zwei Hashes gleich sind, sind die Daten identisch. Das spart 
              Zeit und Rechenpower.
            </p>
            <div className="importance-example">
              <div>Ohne Hash: Vergleiche 10,000 Transaktionen 😰</div>
              <div>Mit Hash: Vergleiche 1 Hash (64 Zeichen) 😊</div>
            </div>
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
              <h4>Hash = Digitaler Fingerabdruck</h4>
              <p>
                Ein Hash ist eine eindeutige Zahlen-Buchstaben-Kombination, die aus beliebigen 
                Daten berechnet wird. Wie ein Fingerabdruck ist jeder Hash einzigartig.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Kleinste Änderung = Komplett neuer Hash</h4>
              <p>
                Selbst wenn du nur ein Komma änderst, ist der Hash völlig anders. Das macht 
                Manipulation sofort erkennbar - der "Avalanche-Effekt".
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Einweg-Funktion</h4>
              <p>
                Aus einem Hash kann man NICHT zurückrechnen, welche Daten dahinter stecken. 
                Text → Hash ist einfach, aber Hash → Text ist praktisch unmöglich.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Wie funktioniert SHA-256 technisch?">
        <div className="deep-dive-content">
          <p>
            <strong>Achtung:</strong> Das wird jetzt etwas technischer! Aber keine Sorge, 
            wir bleiben verständlich.
          </p>
          
          <h4>SHA-256 in vereinfachten Schritten:</h4>
          <div className="deep-dive-list">
            <div className="dive-item">
              <span className="dive-number">1</span>
              <div>
                <strong>Padding:</strong> Der Input-Text wird auf eine bestimmte Länge 
                aufgefüllt (immer ein Vielfaches von 512 Bit).
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-number">2</span>
              <div>
                <strong>Chunking:</strong> Der aufgefüllte Text wird in Blöcke zu je 512 Bit 
                aufgeteilt.
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-number">3</span>
              <div>
                <strong>Kompression:</strong> Jeder Block wird durch 64 Runden komplexer 
                mathematischer Operationen gejagt (XOR, AND, Shift, etc.).
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-number">4</span>
              <div>
                <strong>Output:</strong> Am Ende steht ein 256-Bit-Hash (= 64 Hexadezimal-Zeichen).
              </div>
            </div>
          </div>

          <p className="dive-conclusion">
            <strong>Warum ist das sicher?</strong> Die 64 Runden mit verschiedenen mathematischen 
            Operationen machen es praktisch unmöglich, zwei verschiedene Inputs zu finden, die 
            den gleichen Hash ergeben (genannt "Kollision"). Die Wahrscheinlichkeit ist so gering 
            wie ein Sandkorn aus allen Wüsten der Welt zufällig zu wählen - zweimal hintereinander!
          </p>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du Hash-Funktionen verstanden hast. 
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
                ? '🎉 Ausgezeichnet! Du verstehst Hash-Funktionen!' 
                : '📚 Fast! Probiere den Hash-Simulator nochmal aus.'}
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
                Ein <strong>Hash</strong> ist ein digitaler Fingerabdruck von Daten - 
                eine eindeutige Zahlen-Buchstaben-Kombination.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Selbst die <strong>kleinste Änderung</strong> (ein Buchstabe, ein Komma) 
                führt zu einem völlig neuen Hash - das ist der Avalanche-Effekt.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Hash-Funktionen sind <strong>Einweg-Funktionen</strong>: Text → Hash ist 
                einfach, aber Hash → Text ist praktisch unmöglich.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Bitcoin nutzt <strong>SHA-256</strong>, das immer einen 64-Zeichen-langen 
                Hash erzeugt - egal wie lang der Input ist.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Hashes machen die Blockchain sicher: Manipulation wird sofort erkannt, weil 
                sich der Hash ändert und die Kette bricht.
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Jetzt weißt du, was Blöcke sind, wie sie verkettet werden und wie Hashes funktionieren. 
              Aber: <strong>Wo liegen diese Blöcke eigentlich?</strong> Nur auf einem Computer? 
              Nein! Im nächsten Modul geht's um <strong>Dezentralität</strong> - das Herzstück 
              der Blockchain!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module05_HashFunction;
