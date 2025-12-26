import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import './Module.css';

const Module04_TheChain = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [dragDropComplete, setDragDropComplete] = useState(false);

  // Simple Drag-and-Drop State
  const [blocks, setBlocks] = useState([
    { id: 3, number: 3, hash: 'ABC789', prevHash: 'XYZ456', placed: false },
    { id: 1, number: 1, hash: 'XYZ456', prevHash: '000000', placed: false },
    { id: 2, number: 2, hash: 'DEF123', prevHash: 'ABC789', placed: false }
  ]);
  const [chain, setChain] = useState([null, null, null]);

  const quizQuestions = [
    {
      question: "Warum nennt man die Blockchain eine 'Kette'?",
      answers: [
        "Weil sie aus Metall ist",
        "Weil jeder Block über seinen Hash mit dem nächsten verbunden ist",
        "Weil sie lang ist"
      ],
      correct: 1,
      explanation: "Richtig! Wie bei einer echten Kette greifen die Glieder ineinander: Jeder Block enthält den Hash des vorherigen Blocks. Block 2 zeigt auf Block 1, Block 3 auf Block 2, usw. Diese Hash-Verweise bilden die 'Kette'."
    },
    {
      question: "Was passiert, wenn jemand einen alten Block in der Mitte der Kette ändert?",
      answers: [
        "Nichts, niemand merkt es",
        "Nur dieser eine Block ändert sich",
        "Sein Hash ändert sich, und alle nachfolgenden Blöcke passen nicht mehr zusammen"
      ],
      correct: 2,
      explanation: "Genau! Wenn du Block #100 änderst, ändert sich sein Hash. Aber Block #101 enthält noch den ALTEN Hash von #100. Die Kette ist gebrochen! Um das zu verbergen, müsstest du ALLE folgenden Blöcke (101, 102, 103...) auch neu berechnen - praktisch unmöglich bei tausenden Blöcken."
    },
    {
      question: "Welcher Block ist der erste in jeder Blockchain?",
      answers: [
        "Der neueste Block",
        "Der Genesis-Block (Block 0)",
        "Es gibt keinen ersten Block"
      ],
      correct: 1,
      explanation: "Perfekt! Der allererste Block heißt 'Genesis-Block' (Genesis = Anfang/Ursprung). Er ist besonders, weil er keinen vorherigen Block hat - es gibt ja noch keinen! Bei Bitcoin wurde der Genesis-Block am 3. Januar 2009 erstellt."
    }
  ];

  const handleQuizComplete = (score) => {
    setQuizScore(score);
    setQuizCompleted(true);
    
    const passed = score >= 2 && dragDropComplete;
    if (passed && onComplete) {
      onComplete();
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, blockId) => {
    e.dataTransfer.setData('blockId', blockId);
  };

  const handleDrop = (e, position) => {
    e.preventDefault();
    const blockId = parseInt(e.dataTransfer.getData('blockId'));
    const block = blocks.find(b => b.id === blockId);
    
    if (block && !block.placed) {
      const newChain = [...chain];
      newChain[position] = block;
      setChain(newChain);
      
      const newBlocks = blocks.map(b => 
        b.id === blockId ? { ...b, placed: true } : b
      );
      setBlocks(newBlocks);

      // Check if correctly ordered
      if (newChain.every(b => b !== null)) {
        const correct = newChain[0].number === 1 && 
                       newChain[1].number === 2 && 
                       newChain[2].number === 3;
        if (correct) {
          setDragDropComplete(true);
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const resetDragDrop = () => {
    setBlocks(blocks.map(b => ({ ...b, placed: false })));
    setChain([null, null, null]);
    setDragDropComplete(false);
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-number">Modul 4 von 9</div>
        <h1 className="module-title">Die Kette: Blöcke verbinden</h1>
        <p className="module-subtitle">
          Wie werden Blöcke zu einer unzertrennlichen Kette verkettet?
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du schreibst mit deinen Freunden einen <strong>Fortsetzungsroman</strong>. 
            Lisa schreibt Kapitel 1 und gibt es Tom. Tom liest Kapitel 1, schreibt dann 
            Kapitel 2 und gibt beides an Anna weiter.
          </p>
          <p>
            Jedes neue Kapitel <strong>bezieht sich auf das vorherige</strong>: "Nachdem Sarah 
            im letzten Kapitel den Schlüssel gefunden hatte..." Wenn jemand nachträglich 
            Kapitel 1 ändert ("Sarah findet einen Ring statt Schlüssel"), passen alle 
            folgenden Kapitel nicht mehr zusammen!
          </p>
          <p>
            <strong>So funktioniert die Blockchain-Kette:</strong> Jeder Block verweist auf 
            den vorherigen. Wenn du einen alten Block änderst, passt nichts mehr zusammen - 
            die Geschichte ergibt keinen Sinn mehr.
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="⛓️"
          title="Verkettung durch Hash-Verweise"
          description="Jeder Block enthält den Hash (Fingerabdruck) des vorherigen Blocks. Das verbindet alle Blöcke wie Kettenglieder: Block 2 greift in Block 1, Block 3 in Block 2, usw. Ändert man einen Block, bricht die ganze Kette."
        />
        <div className="concept-explanation">
          <p>
            Denk an die Blockchain wie an eine <strong>DNA-Doppelhelix</strong> oder eine 
            <strong> Fahrradkette</strong>: Jedes Glied ist mit dem nächsten verbunden. 
            Entfernst du ein Glied, funktioniert die ganze Kette nicht mehr.
          </p>
        </div>
      </section>

      {/* Visual Chain Demonstration */}
      <section className="content-section">
        <div className="section-label">🔗 Visualisierung: So sieht die Kette aus</div>
        <div className="chain-visualization">
          <div className="chain-block genesis">
            <div className="block-number">Block #0</div>
            <div className="block-label">Genesis-Block</div>
            <div className="block-content">
              <div className="block-field">
                <span className="field-label">Vorheriger Hash:</span>
                <span className="field-value none">000000 (keiner)</span>
              </div>
              <div className="block-field">
                <span className="field-label">Eigener Hash:</span>
                <span className="field-value">ABC123</span>
              </div>
              <div className="block-transactions">
                <span className="tx-icon">📝</span> 1 Transaktion
              </div>
            </div>
            <div className="chain-arrow">→</div>
          </div>

          <div className="chain-block">
            <div className="block-number">Block #1</div>
            <div className="block-content">
              <div className="block-field">
                <span className="field-label">Vorheriger Hash:</span>
                <span className="field-value highlight">ABC123</span>
              </div>
              <div className="block-field">
                <span className="field-label">Eigener Hash:</span>
                <span className="field-value">XYZ456</span>
              </div>
              <div className="block-transactions">
                <span className="tx-icon">📝</span> 50 Transaktionen
              </div>
            </div>
            <div className="chain-arrow">→</div>
          </div>

          <div className="chain-block">
            <div className="block-number">Block #2</div>
            <div className="block-content">
              <div className="block-field">
                <span className="field-label">Vorheriger Hash:</span>
                <span className="field-value highlight">XYZ456</span>
              </div>
              <div className="block-field">
                <span className="field-label">Eigener Hash:</span>
                <span className="field-value">DEF789</span>
              </div>
              <div className="block-transactions">
                <span className="tx-icon">📝</span> 75 Transaktionen
              </div>
            </div>
            <div className="chain-arrow">→</div>
          </div>

          <div className="chain-continues">
            <div className="continues-text">... und so weiter ...</div>
            <div className="continues-info">
              Bei Bitcoin gibt es mittlerweile über 870,000 Blöcke!
            </div>
          </div>
        </div>

        <div className="visualization-explanation">
          <p>
            👆 Siehst du die Verbindung? Der <span className="highlight-text">eigene Hash</span> von 
            Block #0 (ABC123) ist der <span className="highlight-text">vorherige Hash</span> von 
            Block #1. Der eigene Hash von Block #1 (XYZ456) ist der vorherige Hash von Block #2. 
            <strong> Die Blöcke sind wie Puzzle-Teile, die nur in einer Reihenfolge passen!</strong>
          </p>
        </div>
      </section>

      {/* Interactive Drag and Drop */}
      <section className="content-section">
        <div className="section-label">🎯 Interaktive Übung: Bringe die Blöcke in die richtige Reihenfolge!</div>
        <div className="drag-drop-container">
          <div className="drag-drop-instructions">
            <p>
              Ziehe die Blöcke in die richtige Reihenfolge, indem du auf die Hash-Verweise achtest. 
              Welcher Block kommt zuerst? Tipp: Der Genesis-Block hat prevHash = "000000".
            </p>
          </div>

          <div className="available-blocks">
            <h4>Verfügbare Blöcke:</h4>
            <div className="blocks-list">
              {blocks.filter(b => !b.placed).map(block => (
                <div
                  key={block.id}
                  className="draggable-block"
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.id)}
                >
                  <div className="drag-block-number">Block #{block.number}</div>
                  <div className="drag-block-info">
                    <div className="drag-field">
                      <span>Prev:</span> <span className="hash-short">{block.prevHash}</span>
                    </div>
                    <div className="drag-field">
                      <span>Hash:</span> <span className="hash-short">{block.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="drop-zone-container">
            <h4>Die Blockchain (in richtiger Reihenfolge):</h4>
            <div className="drop-zones">
              {chain.map((block, index) => (
                <div
                  key={index}
                  className={`drop-zone ${block ? 'filled' : ''} ${dragDropComplete ? 'correct' : ''}`}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                >
                  {block ? (
                    <>
                      <div className="dropped-block-number">Block #{block.number}</div>
                      <div className="dropped-block-info">
                        <div>Prev: {block.prevHash}</div>
                        <div>Hash: {block.hash}</div>
                      </div>
                    </>
                  ) : (
                    <div className="drop-placeholder">
                      Ziehe Block #{index + 1} hier hin
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {dragDropComplete && (
            <div className="drag-drop-success">
              <span className="success-icon">🎉</span>
              <p>Perfekt! Die Blöcke sind richtig verkettet!</p>
            </div>
          )}

          <button onClick={resetDragDrop} className="btn btn-secondary btn-small">
            🔄 Zurücksetzen
          </button>
        </div>
      </section>

      {/* What happens when chain breaks */}
      <section className="content-section">
        <div className="section-label">⚠️ Was passiert bei Manipulation?</div>
        <div className="manipulation-demo">
          <h4>Szenario: Jemand versucht, Block #1 zu ändern</h4>
          
          <div className="manipulation-before">
            <div className="demo-label">Vorher (alles in Ordnung):</div>
            <div className="demo-chain">
              <div className="demo-block valid">
                <div className="demo-block-title">Block #1</div>
                <div className="demo-hash">Hash: XYZ456</div>
              </div>
              <div className="demo-arrow">✓</div>
              <div className="demo-block valid">
                <div className="demo-block-title">Block #2</div>
                <div className="demo-prev-hash">Prev: XYZ456 ✓</div>
              </div>
              <div className="demo-arrow">✓</div>
              <div className="demo-block valid">
                <div className="demo-block-title">Block #3</div>
                <div className="demo-prev-hash">Prev: DEF789 ✓</div>
              </div>
            </div>
          </div>

          <div className="manipulation-action">
            <div className="action-icon">🔨</div>
            <p><strong>Angreifer ändert eine Transaktion in Block #1</strong></p>
            <p className="action-detail">z.B. "Anna → Tom: 5 BTC" wird zu "Anna → Tom: 500 BTC"</p>
          </div>

          <div className="manipulation-after">
            <div className="demo-label">Nachher (Kette ist kaputt!):</div>
            <div className="demo-chain broken">
              <div className="demo-block invalid">
                <div className="demo-block-title">Block #1</div>
                <div className="demo-hash changed">Hash: ABC999 (NEU!)</div>
              </div>
              <div className="demo-arrow broken">✗</div>
              <div className="demo-block invalid">
                <div className="demo-block-title">Block #2</div>
                <div className="demo-prev-hash broken">Prev: XYZ456 ✗</div>
                <div className="demo-error">❌ Passt nicht mehr!</div>
              </div>
              <div className="demo-arrow broken">✗</div>
              <div className="demo-block invalid">
                <div className="demo-block-title">Block #3</div>
                <div className="demo-prev-hash broken">Prev: DEF789 ✗</div>
                <div className="demo-error">❌ Passt auch nicht!</div>
              </div>
            </div>
          </div>

          <div className="manipulation-explanation">
            <p>
              <strong>Die Kette ist gebrochen!</strong> Block #2 erwartet noch den alten Hash 
              (XYZ456), aber Block #1 hat jetzt einen neuen Hash (ABC999). Alle Computer im 
              Netzwerk sehen sofort: "Hier stimmt was nicht!"
            </p>
            <p>
              Um die Manipulation zu verbergen, müsste der Angreifer ALLE nachfolgenden Blöcke 
              neu berechnen - bei Bitcoin derzeit über 870,000 Blöcke. Das würde Jahre dauern 
              und riesige Rechenpower kosten. <strong>Praktisch unmöglich!</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Metaphor Grid */}
      <section className="content-section">
        <div className="section-label">🎨 Verschiedene Metaphern für die Kette</div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🧬</div>
            <h4>DNA-Strang</h4>
            <p>
              Wie bei der DNA ist jeder Teil mit dem nächsten verbunden. Ändert man einen 
              Teil, funktioniert die gesamte genetische Information nicht mehr. Die Kette 
              muss vollständig und in der richtigen Reihenfolge sein.
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">🚂</div>
            <h4>Zugwaggons</h4>
            <p>
              Jeder Waggon ist mit dem nächsten gekoppelt. Du kannst nicht Waggon 3 entfernen, 
              ohne dass die Verbindung zwischen Waggon 2 und 4 kaputt geht. Die Reihenfolge 
              ist fest und unveränderlich.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">📚</div>
            <h4>Fortsetzungsroman</h4>
            <p>
              Jedes Kapitel bezieht sich auf das vorherige: "Nachdem Sarah im letzten Kapitel..." 
              Ändert man Kapitel 5, ergeben Kapitel 6, 7, 8 keinen Sinn mehr. Die Geschichte 
              muss zusammenhängen.
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
              <h4>Hash-Verweise verbinden</h4>
              <p>
                Jeder Block enthält den Hash des vorherigen Blocks. Das ist wie ein Verweis: 
                "Ich gehöre nach Block XYZ." Diese Verweise bilden die Kette.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Manipulationen brechen die Kette</h4>
              <p>
                Wenn du einen Block änderst, ändert sich sein Hash. Alle nachfolgenden Blöcke 
                verweisen aber noch auf den alten Hash - die Kette ist kaputt und jeder sieht es!
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Genesis-Block = Anfang</h4>
              <p>
                Jede Blockchain startet mit einem besonderen Block: dem Genesis-Block (Block #0). 
                Er hat keinen vorherigen Block, weil er der allererste ist. Bei Bitcoin: 3. Januar 2009.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Könnte man nicht alle Blöcke neu berechnen?">
        <div className="deep-dive-content">
          <p>
            <strong>Clevere Frage!</strong> Theoretisch könnte ein Angreifer ja sagen: 
            "Okay, ich ändere Block #1000 und berechne dann einfach alle Blöcke ab #1001 
            neu. Dann passt die Kette wieder!"
          </p>
          
          <h4>Warum das in der Praxis unmöglich ist:</h4>
          <div className="deep-dive-list">
            <div className="dive-item">
              <span className="dive-icon">⏱️</span>
              <div>
                <strong>Zeit:</strong> Jeden neuen Block zu erstellen dauert ca. 10 Minuten 
                (bei Bitcoin). Um 870,000 Blöcke neu zu berechnen, bräuchtest du 
                <strong> 16,500 Jahre</strong>!
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-icon">💰</span>
              <div>
                <strong>Kosten:</strong> Das Berechnen von Blöcken (Mining) kostet riesige 
                Mengen Strom. Die Stromkosten für 870,000 Blöcke wären astronomisch - 
                Milliarden von Euros!
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-icon">🏃</span>
              <div>
                <strong>Das Netzwerk läuft weiter:</strong> Während du versuchst, alte Blöcke 
                neu zu berechnen, erstellt das Netzwerk neue Blöcke. Du würdest nie aufholen - 
                wie ein Hamster im Laufrad!
              </div>
            </div>
            <div className="dive-item">
              <span className="dive-icon">👥</span>
              <div>
                <strong>Konsens:</strong> Selbst wenn du es schaffst, haben tausende andere 
                Computer die ECHTE Kette. Das Netzwerk würde deine manipulierte Version 
                ablehnen: "Nein, bei uns steht was anderes!"
              </div>
            </div>
          </div>

          <p className="dive-conclusion">
            <strong>Fazit:</strong> Technisch möglich, aber praktisch unmöglich. Es wäre wie 
            zu versuchen, den Ozean mit einem Löffel auszuschöpfen - während es gleichzeitig 
            weiter regnet.
          </p>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du verstanden hast, wie die Blockchain-Kette funktioniert. 
            Beantworte mindestens 2 von 3 Fragen richtig UND löse die Drag-and-Drop-Übung.
          </p>
        </div>
        <MultipleChoice 
          questions={quizQuestions} 
          onComplete={handleQuizComplete}
        />
        {quizCompleted && (
          <div className={`quiz-result ${quizScore >= 2 && dragDropComplete ? 'success' : 'warning'}`}>
            <h3>
              {quizScore >= 2 && dragDropComplete
                ? '🎉 Perfekt! Du verstehst die Blockchain-Kette!' 
                : quizScore >= 2 
                  ? '📝 Fast! Löse noch die Drag-and-Drop-Übung oben.'
                  : '📚 Fast! Schau dir die Visualisierung nochmal an.'}
            </h3>
            <p>
              Quiz: {quizScore} von {quizQuestions.length} richtig. 
              Drag-and-Drop: {dragDropComplete ? '✓ Gelöst' : '✗ Noch nicht gelöst'}
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
                Die <strong>Blockchain-Kette</strong> entsteht dadurch, dass jeder Block 
                den Hash des vorherigen Blocks enthält - wie Kettenglieder, die ineinander greifen.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Wenn jemand einen alten Block ändert, <strong>ändert sich sein Hash</strong>. 
                Alle nachfolgenden Blöcke verweisen aber noch auf den alten Hash - die Kette 
                ist kaputt und jeder sieht es!
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Die Kette zu manipulieren ist <strong>praktisch unmöglich</strong>, weil man 
                alle nachfolgenden Blöcke neu berechnen müsste - das würde Jahre dauern und 
                riesige Kosten verursachen.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Jede Blockchain startet mit dem <strong>Genesis-Block</strong> - dem allerersten 
                Block, der keinen vorherigen Hash hat.
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Was ist eigentlich dieser <strong>Hash</strong>, von dem wir die ganze Zeit 
              reden? Wie wird er berechnet? Und warum ändert er sich komplett, wenn du auch 
              nur einen Buchstaben änderst? Zeit für den digitalen Fingerabdruck!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module04_TheChain;
