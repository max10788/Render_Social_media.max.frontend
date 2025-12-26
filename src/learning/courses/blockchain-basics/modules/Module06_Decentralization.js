import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import ExpandableSection from '../../../components/content/ExpandableSection';
import './Module.css';

const Module06_Decentralization = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(false);

  const quizQuestions = [
    {
      question: "Was bedeutet 'dezentral' im Kontext der Blockchain?",
      answers: [
        "Es gibt einen Hauptserver in der Mitte",
        "Die Daten werden auf vielen Computern gleichzeitig gespeichert",
        "Nur ein Computer hat alle Daten"
      ],
      correct: 1,
      explanation: "Richtig! 'Dezentral' bedeutet: Die Blockchain-Daten liegen nicht auf einem zentralen Server, sondern auf tausenden Computern weltweit. Jeder dieser Computer (Knoten/Node) hat eine vollständige Kopie der Blockchain."
    },
    {
      question: "Was ist der größte Vorteil eines dezentralen Netzwerks?",
      answers: [
        "Es ist schneller als zentrale Server",
        "Kein einzelner Punkt kann das gesamte Netzwerk lahmlegen",
        "Es ist billiger"
      ],
      correct: 1,
      explanation: "Genau! Wenn bei Facebook der zentrale Server ausfällt, ist Facebook offline. Aber bei Bitcoin: Selbst wenn 1000 Computer ausfallen, laufen noch 10,000+ weiter. Es gibt keinen 'Single Point of Failure' - keinen einzelnen Punkt, dessen Ausfall alles lahmlegt."
    },
    {
      question: "Was passiert, wenn jemand bei einer dezentralen Blockchain seine Kopie manipuliert?",
      answers: [
        "Alle anderen übernehmen automatisch die manipulierte Version",
        "Die anderen Teilnehmer merken es und lehnen die falsche Version ab",
        "Nichts, jeder kann seine eigene Version haben"
      ],
      correct: 1,
      explanation: "Perfekt! Wenn du versuchst, deine Kopie zu fälschen (z.B. 'Ich habe jetzt 1 Million Bitcoin'), vergleichen die anderen Computer: 'Bei mir steht was anderes!' Die Mehrheit gewinnt - deine gefälschte Version wird abgelehnt. Das nennt man Konsens."
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
        <div className="module-number">Modul 6 von 9</div>
        <h1 className="module-title">Dezentralität</h1>
        <p className="module-subtitle">
          Viele Kopien statt einem Server - warum ist das so wichtig?
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, deine ganze Schule nutzt <strong>Google Classroom</strong> für Hausaufgaben. 
            Alle Aufgaben, Noten und Nachrichten liegen auf den Google-Servern in den USA.
          </p>
          <p>
            Eines Tages gibt es einen <strong>Server-Ausfall bei Google</strong>. Plötzlich kann 
            niemand mehr auf seine Aufgaben zugreifen. Die ganze Schule steht still - weil ein 
            einziger Server ausgefallen ist. Das nennt man einen "Single Point of Failure" 
            (einzelner Ausfallpunkt).
          </p>
          <p>
            <strong>Jetzt stell dir vor:</strong> Jeder Schüler und jeder Lehrer hätte eine 
            vollständige Kopie aller Aufgaben auf seinem Laptop. Wenn Googles Server ausfällt? 
            Kein Problem! Ihr habt ja alle noch eure Kopien. <strong>Das ist Dezentralität!</strong>
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="🌐"
          title="Dezentralität = Viele gleichberechtigte Kopien"
          description="In einem dezentralen Netzwerk gibt es keinen 'Chef-Computer'. Stattdessen haben tausende Computer (Knoten/Nodes) eine vollständige Kopie der Blockchain. Alle sind gleichberechtigt."
        />
        <div className="concept-explanation">
          <p>
            Denk an die Blockchain wie an <strong>Wikipedia, aber besser</strong>: Bei Wikipedia 
            gibt es zentrale Server. Bei einer Blockchain hat jeder Teilnehmer eine vollständige 
            Kopie - wie wenn jeder sein eigenes Wikipedia hätte, und alle synchron bleiben.
          </p>
        </div>
      </section>

      {/* Visual Network Comparison */}
      <section className="content-section">
        <div className="section-label">🔄 Zentral vs. Dezentral - Der Unterschied</div>
        
        <div className="network-comparison">
          <div className="network-type centralized">
            <h3>❌ Zentrales Netzwerk</h3>
            <div className="network-diagram">
              <div className="central-server">
                <div className="server-icon">🖥️</div>
                <div className="server-label">Zentraler Server</div>
              </div>
              <div className="client-nodes">
                <div className="client-node">💻</div>
                <div className="client-node">💻</div>
                <div className="client-node">💻</div>
                <div className="client-node">💻</div>
                <div className="client-node">💻</div>
              </div>
              <div className="network-connections">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="connection-line"></div>
                ))}
              </div>
            </div>
            <div className="network-description">
              <p><strong>Beispiele:</strong> Google, Facebook, Banken</p>
              <div className="pros-cons">
                <div className="pros">
                  <strong>✓ Vorteile:</strong>
                  <ul>
                    <li>Schnell</li>
                    <li>Einfach zu verwalten</li>
                    <li>Energieeffizient</li>
                  </ul>
                </div>
                <div className="cons">
                  <strong>✗ Nachteile:</strong>
                  <ul>
                    <li>Single Point of Failure</li>
                    <li>Zensur möglich</li>
                    <li>Manipulation möglich</li>
                    <li>Vertrauen nötig</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="network-type decentralized">
            <h3>✅ Dezentrales Netzwerk (Blockchain)</h3>
            <div className="network-diagram">
              <div className="peer-nodes">
                <div className="peer-node main">
                  <div className="node-icon">🌐</div>
                  <div className="node-label">Node 1</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">🌐</div>
                  <div className="node-label">Node 2</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">🌐</div>
                  <div className="node-label">Node 3</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">🌐</div>
                  <div className="node-label">Node 4</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">🌐</div>
                  <div className="node-label">Node 5</div>
                </div>
                <div className="peer-node">
                  <div className="node-icon">🌐</div>
                  <div className="node-label">Node 6</div>
                </div>
              </div>
              <div className="mesh-connections">
                {/* Visual mesh network */}
              </div>
            </div>
            <div className="network-description">
              <p><strong>Beispiele:</strong> Bitcoin, Ethereum, IPFS</p>
              <div className="pros-cons">
                <div className="pros">
                  <strong>✓ Vorteile:</strong>
                  <ul>
                    <li>Kein Single Point of Failure</li>
                    <li>Zensurresistent</li>
                    <li>Manipulation sehr schwer</li>
                    <li>Kein Vertrauen nötig</li>
                  </ul>
                </div>
                <div className="cons">
                  <strong>✗ Nachteile:</strong>
                  <ul>
                    <li>Langsamer</li>
                    <li>Komplexer</li>
                    <li>Mehr Energie</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Decentralization Works */}
      <section className="content-section">
        <div className="section-label">⚙️ Wie funktioniert ein dezentrales Netzwerk?</div>
        
        <div className="step-by-step">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Viele gleichberechtigte Computer (Nodes)</h4>
              <p>
                Bei Bitcoin gibt es über 15,000 Computer weltweit, die alle eine vollständige 
                Kopie der Blockchain haben. Jeder dieser Computer nennt man einen "Node" (Knoten).
              </p>
              <div className="step-example">
                <strong>Beispiel:</strong> Node in Deutschland, Node in Japan, Node in Brasilien - 
                alle haben die gleiche Blockchain-Kopie.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Ständige Synchronisation</h4>
              <p>
                Wenn ein neuer Block erstellt wird, teilt der "Gewinner" dies allen anderen Nodes 
                mit: "Hey, ich habe Block #1234 erstellt!" Alle anderen prüfen ihn und fügen ihn 
                zu ihrer Kopie hinzu.
              </p>
              <div className="step-example">
                <strong>Beispiel:</strong> "Neue Transaktion: Anna → Tom: 5 BTC" wird an alle 
                15,000+ Nodes gesendet.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Peer-to-Peer Kommunikation</h4>
              <p>
                Nodes kommunizieren direkt miteinander (Peer-to-Peer), ohne Vermittler. Wie bei 
                BitTorrent: Du lädst nicht von einem zentralen Server, sondern von vielen anderen 
                Nutzern gleichzeitig.
              </p>
              <div className="step-example">
                <strong>Beispiel:</strong> Node A sendet Daten an Node B, C, D → diese senden 
                weiter an E, F, G → Welleneffekt!
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Konsens durch Mehrheit</h4>
              <p>
                Wenn verschiedene Nodes unterschiedliche Versionen haben, gewinnt die Version, 
                die die meisten Nodes akzeptieren. Ein einzelner betrügerischer Node kann nichts 
                ausrichten gegen tausende ehrliche Nodes.
              </p>
              <div className="step-example">
                <strong>Beispiel:</strong> 14,999 Nodes sagen "Block ist valide", 1 Node sagt 
                "Block ist falsch" → Die Mehrheit gewinnt!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real World Scenario */}
      <section className="content-section">
        <div className="section-label">🌍 Was passiert, wenn...?</div>
        
        <div className="scenario-cards">
          <div className="scenario-card">
            <div className="scenario-icon">💥</div>
            <h4>...ein Node abstürzt?</h4>
            <p>
              <strong>Kein Problem!</strong> Die anderen 14,999+ Nodes laufen weiter. Das 
              Netzwerk merkt es kaum. Der abgestürzte Node kann später wieder beitreten und 
              holt sich die fehlenden Blöcke von anderen.
            </p>
            <div className="scenario-result success">
              ✓ Netzwerk läuft weiter
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🌩️</div>
            <h4>...1000 Nodes gleichzeitig ausfallen?</h4>
            <p>
              <strong>Immer noch kein Problem!</strong> Solange noch hunderte oder tausende 
              Nodes online sind, funktioniert alles. Bitcoin hatte sogar schon Phasen, wo 
              große Mining-Farmen abgeschaltet wurden - das Netzwerk lief weiter.
            </p>
            <div className="scenario-result success">
              ✓ Netzwerk überlebt
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🕵️</div>
            <h4>...ein Land Bitcoin verbietet?</h4>
            <p>
              <strong>Netzwerk läuft weiter!</strong> Selbst wenn ein ganzes Land (z.B. China) 
              Bitcoin verbietet und alle Nodes dort abschaltet, laufen die Nodes in anderen 
              Ländern weiter. Das ist Zensurresistenz!
            </p>
            <div className="scenario-result success">
              ✓ Global verteilt = sicher
            </div>
          </div>

          <div className="scenario-card">
            <div className="scenario-icon">🦹</div>
            <h4>...jemand versucht zu betrügen?</h4>
            <p>
              <strong>Wird abgelehnt!</strong> Wenn ein Node eine gefälschte Transaktion sendet 
              ("Ich habe 1 Million Bitcoin!"), prüfen alle anderen Nodes ihre Kopie: "Nein, 
              bei mir hat er nur 5 Bitcoin!" Die gefälschte Version wird abgelehnt.
            </p>
            <div className="scenario-result warning">
              ✗ Betrug wird erkannt
            </div>
          </div>
        </div>
      </section>

      {/* Metaphor Grid */}
      <section className="content-section">
        <div className="section-label">🎨 Verschiedene Metaphern für Dezentralität</div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">📚</div>
            <h4>Bibliothek vs. Kopien bei allen</h4>
            <p>
              <strong>Zentral:</strong> Es gibt nur eine Bibliothek in der Stadt. Wenn sie 
              abbrennt, sind alle Bücher weg.<br/>
              <strong>Dezentral:</strong> Jeder Bürger hat eine Kopie aller Bücher zu Hause. 
              Ein einzelnes Feuer kann nicht alles zerstören.
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">🎵</div>
            <h4>Spotify vs. Lokale MP3s</h4>
            <p>
              <strong>Zentral:</strong> Musik liegt auf Spotify-Servern. Spotify offline = 
              du hast keine Musik.<br/>
              <strong>Dezentral:</strong> Jeder hat die Songs als MP3 auf seinem Gerät. 
              Server egal!
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🏦</div>
            <h4>Bank vs. Bargeld bei allen</h4>
            <p>
              <strong>Zentral:</strong> Dein Geld liegt bei der Bank. Bank pleite = Geld weg 
              (meistens versichert, aber trotzdem).<br/>
              <strong>Dezentral:</strong> Jeder hat sein Bargeld zu Hause (unsicher in der 
              Realität, aber du verstehst das Prinzip!).
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
              <h4>Viele gleichberechtigte Kopien</h4>
              <p>
                In einem dezentralen Netzwerk gibt es tausende Computer (Nodes), die alle eine 
                vollständige Kopie der Blockchain haben. Keiner ist "Chef".
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Kein Single Point of Failure</h4>
              <p>
                Wenn ein Node (oder 1000!) ausfallen, läuft das Netzwerk weiter. Es gibt keinen 
                einzelnen Punkt, dessen Ausfall alles lahmlegt.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Zensurresistent</h4>
              <p>
                Kein Land, keine Firma, keine Regierung kann die Blockchain "abschalten". 
                Solange irgendwo auf der Welt noch Nodes laufen, existiert die Blockchain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Wie viele Nodes braucht man mindestens?">
        <div className="deep-dive-content">
          <p>
            <strong>Interessante Frage!</strong> Technisch könnte eine Blockchain sogar mit nur 
            2-3 Nodes funktionieren. Aber: Je weniger Nodes, desto weniger sicher!
          </p>
          
          <h4>Faustregel: Mehr Nodes = Sicherer</h4>
          <div className="deep-dive-list">
            <div className="dive-item">
              <span className="dive-icon">🔴</span>
              <div>
                <strong>1-10 Nodes:</strong> Sehr unsicher. Ein Angreifer könnte leicht die 
                Mehrheit kontrollieren (51%-Angriff).
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-icon">🟡</span>
              <div>
                <strong>100-1000 Nodes:</strong> Besser, aber noch angreifbar. Große Firmen 
                oder Regierungen könnten das Netzwerk übernehmen.
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-icon">🟢</span>
              <div>
                <strong>10,000+ Nodes:</strong> Sehr sicher! Bitcoin hat über 15,000 Nodes. 
                Niemand kann alle kontrollieren - sie sind über die ganze Welt verteilt.
              </div>
            </div>
          </div>

          <h4>Bitcoin's Nodes weltweit (Stand 2025):</h4>
          <ul className="deep-dive-stats">
            <li>🇺🇸 USA: ~3,500 Nodes</li>
            <li>🇩🇪 Deutschland: ~2,000 Nodes</li>
            <li>🇫🇷 Frankreich: ~800 Nodes</li>
            <li>🇳🇱 Niederlande: ~700 Nodes</li>
            <li>🌍 Andere Länder: ~8,000 Nodes</li>
            <li><strong>Total: ~15,000+ Nodes</strong></li>
          </ul>

          <p className="dive-conclusion">
            <strong>Fazit:</strong> Je mehr Nodes, desto dezentraler und sicherer. Bei Bitcoin 
            müsste ein Angreifer tausende Computer in verschiedenen Ländern gleichzeitig 
            kontrollieren - praktisch unmöglich!
          </p>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du Dezentralität verstanden hast. 
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
                ? '🎉 Super! Du verstehst das Konzept der Dezentralität!' 
                : '📚 Fast! Schau dir den Vergleich zentral vs. dezentral nochmal an.'}
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
                <strong>Dezentralität</strong> bedeutet: Die Blockchain liegt nicht auf einem 
                Server, sondern auf tausenden Computern (Nodes) weltweit - alle haben eine Kopie.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Es gibt <strong>keinen Single Point of Failure</strong>. Wenn hunderte Nodes 
                ausfallen, läuft das Netzwerk weiter.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Das Netzwerk ist <strong>zensurresistent</strong>: Kein Land, keine Firma kann 
                die Blockchain abschalten oder kontrollieren.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Betrug wird erkannt</strong>: Wenn jemand seine Kopie fälscht, vergleichen 
                die anderen Nodes und lehnen die falsche Version ab (Konsens durch Mehrheit).
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Wie einigen sich eigentlich tausende Computer darauf, welche Version "die richtige" 
              ist? Wie wird entschieden, wer den nächsten Block erstellen darf? Zeit für 
              <strong> Konsens-Mechanismen</strong> - Proof of Work vs. Proof of Stake!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module06_Decentralization;
