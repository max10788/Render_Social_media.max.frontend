import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import './Module.css';

const Module02_SharedNotebook = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Was passiert, wenn bei einem WhatsApp-Gruppenchat eine Person ihr Handy verliert?",
      answers: [
        "Alle Nachrichten sind für alle Teilnehmer verloren",
        "Nur diese Person verliert ihre Nachrichten, die anderen behalten sie",
        "Der gesamte Chat wird gelöscht"
      ],
      correct: 1,
      explanation: "Genau! Jeder Teilnehmer hat seine eigene Kopie des Chats auf seinem Gerät. Wenn eine Person ihr Handy verliert, haben alle anderen ihre Kopien noch. So funktioniert auch eine Blockchain - viele Kopien bedeuten Sicherheit."
    },
    {
      question: "Warum ist ein gemeinsames Google Doc anfälliger als eine Blockchain?",
      answers: [
        "Weil Google Doc in der Cloud ist",
        "Weil es nur eine zentrale Kopie gibt, die jemand kontrolliert",
        "Weil Google Docs keine Passwörter haben"
      ],
      correct: 1,
      explanation: "Richtig! Bei Google Docs gibt es nur eine zentrale Kopie auf Google-Servern. Google (oder ein Hacker) könnte theoretisch das Dokument ändern oder löschen. Bei einer Blockchain haben tausende Computer jeweils eine vollständige Kopie - niemand kontrolliert alle gleichzeitig."
    },
    {
      question: "Was ist der Hauptvorteil eines 'gemeinsamen Notizbuchs' in der Blockchain?",
      answers: [
        "Es spart Speicherplatz",
        "Es ist schneller als eine normale Datenbank",
        "Niemand kann heimlich Einträge ändern oder löschen"
      ],
      correct: 2,
      explanation: "Perfekt! Weil tausende Teilnehmer die gleiche Kopie haben, fällt sofort auf, wenn jemand versucht, seine Kopie zu manipulieren. Die anderen würden sagen: 'Hey, bei mir steht was anderes!' Das macht Manipulation praktisch unmöglich."
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
        <div className="module-number">Modul 2 von 9</div>
        <h1 className="module-title">Das gemeinsame Notizbuch</h1>
        <p className="module-subtitle">
          Wie funktioniert eine verteilte Liste, die alle gleichzeitig sehen können?
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du planst mit deinen Freunden einen Roadtrip. Ihr erstellt einen 
            WhatsApp-Gruppenchat: "Wer bringt was mit?" Anna schreibt "Ich bringe Snacks", 
            Tom "Ich tanke voll", Lisa "Ich bringe die Playlist".
          </p>
          <p>
            Jeder von euch hat jetzt <strong>die gleiche Liste auf seinem Handy</strong>. 
            Wenn Tom später behauptet "Ich habe nie gesagt, dass ich tanke!", können alle 
            anderen in ihrem Chat nachschauen. Die Nachricht ist da - bei allen gleich.
          </p>
          <p>
            <strong>Genau so funktioniert eine Blockchain:</strong> Wie ein riesiger Gruppenchat, 
            den tausende Menschen gleichzeitig auf ihrem Computer haben. Niemand kann heimlich 
            Nachrichten ändern oder löschen.
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="📓"
          title="Verteilte Liste = Gemeinsames Notizbuch"
          description="Eine Blockchain ist wie ein Notizbuch, das nicht an einem Ort liegt, sondern von dem jeder Teilnehmer eine identische Kopie hat. Jeder neue Eintrag wird bei allen gleichzeitig hinzugefügt."
        />
        <div className="concept-explanation">
          <p>
            Statt einer zentralen Datenbank (wie bei einer Bank oder Facebook) gibt es 
            <strong> viele identische Kopien</strong> der gleichen Liste - verteilt auf 
            tausende Computer weltweit.
          </p>
        </div>
      </section>

      {/* Comparison: Central vs Distributed */}
      <section className="content-section">
        <div className="section-label">🔄 Der Unterschied</div>
        <div className="comparison-container">
          <div className="comparison-card problem">
            <div className="card-icon">🏢</div>
            <h3>Zentrales Notizbuch</h3>
            <div className="comparison-items">
              <div className="comparison-item">
                <strong>Beispiel:</strong> Google Docs
              </div>
              <div className="comparison-item">
                <strong>Speicherort:</strong> Ein Server bei Google
              </div>
              <div className="comparison-item">
                <strong>Wer kontrolliert:</strong> Google (und du mit Berechtigung)
              </div>
              <div className="comparison-item problem-highlight">
                <strong>Risiko:</strong> Google könnte Dokument löschen, Hacker könnte Server angreifen, Server könnte ausfallen
              </div>
            </div>
          </div>

          <div className="comparison-card solution">
            <div className="card-icon">🌐</div>
            <h3>Verteiltes Notizbuch (Blockchain)</h3>
            <div className="comparison-items">
              <div className="comparison-item">
                <strong>Beispiel:</strong> Bitcoin-Blockchain
              </div>
              <div className="comparison-item">
                <strong>Speicherort:</strong> Tausende Computer weltweit
              </div>
              <div className="comparison-item">
                <strong>Wer kontrolliert:</strong> Alle zusammen (Konsens)
              </div>
              <div className="comparison-item solution-highlight">
                <strong>Vorteil:</strong> Kein einzelner Punkt, der ausfallen kann. Manipulation fällt sofort auf.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Metaphor Grid */}
      <section className="content-section">
        <div className="section-label">🎨 Bildlich gesprochen</div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">📱</div>
            <h4>WhatsApp-Gruppenchat</h4>
            <p>
              Jedes Mitglied hat den kompletten Chatverlauf auf seinem Handy. 
              Wenn jemand behauptet "Die Nachricht stand da nie!", können alle anderen 
              nachschauen: "Doch, hier steht sie!"
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">📋</div>
            <h4>Klassenzimmer-Liste</h4>
            <p>
              Stell dir vor, jeder Schüler schreibt bei einer Änderung mit: "Max hat 10€ 
              für Pizza eingezahlt". Alle schreiben es gleichzeitig auf ihren Zettel. 
              Später kann niemand sagen "Ich hab nur 5€ gegeben" - alle Listen sagen 10€.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🎵</div>
            <h4>Gemeinsame Spotify-Playlist</h4>
            <p>
              Bei einer gemeinsamen Playlist sehen alle die gleichen Songs. Wenn jemand 
              einen Song hinzufügt, erscheint er bei allen. Aber: Spotify (zentral) 
              könnte die Playlist löschen. Eine Blockchain kann das nicht - sie liegt 
              ja bei allen!
            </p>
          </div>
        </div>
      </section>

      {/* How it works technically */}
      <section className="content-section">
        <div className="section-label">⚙️ Wie funktioniert das technisch?</div>
        <div className="step-by-step">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Neue Transaktion</h4>
              <p>
                Anna sendet 5 Bitcoin an Tom. Diese Information wird ins Netzwerk 
                gesendet - wie eine Nachricht in einen Gruppenchat.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Alle bekommen die Info</h4>
              <p>
                Tausende Computer im Bitcoin-Netzwerk empfangen die Nachricht: 
                "Anna → Tom: 5 BTC". Jeder prüft: Hat Anna überhaupt 5 BTC?
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Eintrag in die Liste</h4>
              <p>
                Wenn alle einverstanden sind (Konsens), wird der Eintrag zur gemeinsamen 
                Liste hinzugefügt. Alle Computer schreiben gleichzeitig den gleichen 
                Eintrag in ihre Kopie.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Permanente Aufzeichnung</h4>
              <p>
                Ab jetzt steht bei allen: "Anna → Tom: 5 BTC, Datum: 25.12.2025". 
                Niemand kann das mehr ändern, weil es bei tausenden Computern steht.
              </p>
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
              <h4>Viele identische Kopien</h4>
              <p>
                Die Blockchain ist eine Liste, die nicht an einem Ort liegt, sondern 
                auf tausenden Computern gleichzeitig existiert - alle Kopien sind identisch.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Gemeinsame Wahrheit</h4>
              <p>
                Wie beim Gruppenchat: Wenn jemand behauptet "Das stand nie da!", können 
                tausende andere sagen "Doch, hier ist der Beweis!" Manipulation fällt 
                sofort auf.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Kein einzelner Kontrollpunkt</h4>
              <p>
                Anders als bei Google Docs oder Facebook gibt es keine zentrale Stelle, 
                die die Daten kontrolliert oder löschen könnte. Die Daten gehören allen 
                Teilnehmern gemeinsam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Warum nicht einfach eine normale Datenbank?">
        <div className="deep-dive-content">
          <p>
            <strong>Gute Frage!</strong> Normale Datenbanken (wie bei Banken oder Facebook) 
            sind schneller und effizienter. Warum also der Aufwand mit tausenden Kopien?
          </p>
          
          <h4>Wann brauchst du eine Blockchain?</h4>
          <ul className="deep-dive-list">
            <li>
              <strong>Wenn du niemandem vertrauen willst:</strong> Bei einer Bank musst 
              du der Bank vertrauen. Bei einer Blockchain musst du niemandem vertrauen - 
              die Mathematik sorgt für Sicherheit.
            </li>
            <li>
              <strong>Wenn Manipulation ausgeschlossen sein muss:</strong> Bei einer 
              normalen Datenbank kann ein Admin heimlich Einträge ändern. Bei einer 
              Blockchain ist das praktisch unmöglich.
            </li>
            <li>
              <strong>Wenn viele Parteien beteiligt sind:</strong> Wenn mehrere Firmen 
              oder Länder zusammenarbeiten, aber sich nicht 100% vertrauen, ist eine 
              gemeinsame Blockchain ideal.
            </li>
          </ul>

          <h4>Wann brauchst du KEINE Blockchain?</h4>
          <ul className="deep-dive-list">
            <li>
              <strong>Wenn eine zentrale Stelle vertrauenswürdig ist:</strong> Für deine 
              privaten Notizen brauchst du keine Blockchain - eine normale Notiz-App reicht.
            </li>
            <li>
              <strong>Wenn Geschwindigkeit wichtig ist:</strong> Normale Datenbanken sind 
              viel schneller. Blockchains sind langsamer, weil erst Konsens erreicht werden muss.
            </li>
            <li>
              <strong>Wenn Daten privat bleiben sollen:</strong> In einer öffentlichen 
              Blockchain können alle alles sehen (wie im Gruppenchat). Für private Daten 
              ist das ungeeignet.
            </li>
          </ul>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du das Konzept des "gemeinsamen Notizbuchs" verstanden hast. 
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
                ? '🎉 Sehr gut! Du hast das Konzept verstanden!' 
                : '📚 Fast geschafft! Lies das Modul nochmal durch.'}
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
                Eine Blockchain ist wie ein <strong>gemeinsames Notizbuch</strong>, das 
                nicht an einem Ort liegt, sondern auf tausenden Computern gleichzeitig 
                existiert.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Wie beim WhatsApp-Gruppenchat hat jeder Teilnehmer eine identische Kopie. 
                Wenn jemand versucht zu manipulieren, fällt das sofort auf.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Im Gegensatz zu zentralen Datenbanken (Google Docs, Facebook) gibt es 
                keinen einzelnen Kontrollpunkt, der ausfallen oder manipuliert werden kann.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Neue Einträge (Transaktionen) werden ins Netzwerk gesendet und bei allen 
                Teilnehmern gleichzeitig in die Liste aufgenommen.
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Wie genau so ein "Eintrag" in der Liste aussieht - was ist überhaupt ein 
              <strong> Block</strong>? Welche Informationen stehen drin? Und warum heißt 
              es "Block-CHAIN" (Block-Kette)?
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module02_SharedNotebook;
