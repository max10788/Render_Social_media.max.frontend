// path: src/learning/courses/blockchain-basics/modules/Module01_WhyBlockchain.js
import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import './Module.css';

const Module01_WhyBlockchain = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Was ist das Hauptproblem, das Blockchain löst?",
      answers: [
        "Langsamere Überweisungen",
        "Vertrauen zwischen Unbekannten ohne Vermittler",
        "Höhere Kosten"
      ],
      correct: 1,
      explanation: "Blockchain ermöglicht es Menschen, einander zu vertrauen und Transaktionen durchzuführen, ohne eine Bank oder einen Notar als Vermittler zu benötigen."
    },
    {
      question: "Warum braucht man bei traditionellen Überweisungen eine Bank?",
      answers: [
        "Weil die Bank das Geld physisch transportiert",
        "Weil die Bank als vertrauenswürdiger Vermittler fungiert",
        "Weil man sonst keine Überweisungen machen kann"
      ],
      correct: 1,
      explanation: "Die Bank führt das zentrale Register und bestätigt, dass das Geld wirklich von A nach B übertragen wurde. Sie ist der vertrauenswürdige Vermittler."
    },
    {
      question: "Was bedeutet 'dezentral' im Kontext von Blockchain?",
      answers: [
        "Es gibt viele Kopien der Daten statt einer zentralen Stelle",
        "Die Daten werden an verschiedenen Orten gespeichert",
        "Niemand kann die Daten kontrollieren"
      ],
      correct: 0,
      explanation: "Dezentral bedeutet, dass nicht eine einzige Institution (wie eine Bank) alle Daten kontrolliert, sondern viele Teilnehmer im Netzwerk eine Kopie haben."
    }
  ];

  const handleQuizComplete = (score) => {
    setQuizScore(score);
    setQuizCompleted(true);
  };

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header-section">
        <div className="module-icon-large">🏦</div>
        <h1 className="module-title">Warum braucht man Blockchain?</h1>
        <p className="module-subtitle">Vertrauen ohne Bank oder Notar</p>
      </div>

      {/* Story Section */}
      <section className="content-section story-section">
        <div className="section-label">📖 Alltagssituation</div>
        <div className="story-card">
          <p className="story-text">
            Stell dir vor, du möchtest einem Freund in einem anderen Land Geld schicken. 
            Du gehst zur Bank, gibst die Überweisung in Auftrag, und die Bank sorgt dafür, 
            dass das Geld ankommt. Die Bank ist der <strong>Vermittler</strong>, dem beide 
            Seiten vertrauen müssen.
          </p>
          <p className="story-text">
            Aber was wäre, wenn es keine Bank bräuchte? Wenn du direkt, sicher und 
            überprüfbar Geld senden könntest, <strong>ohne einen Vermittler</strong>?
          </p>
          <p className="story-highlight">
            Genau hier kommt die Blockchain ins Spiel.
          </p>
        </div>
      </section>

      {/* Concept Section */}
      <section className="content-section">
        <div className="section-label">💡 Kernkonzept</div>
        <ConceptBox
          icon="🤝"
          title="Vertrauen ohne Vermittler"
          content="Blockchain ist wie ein öffentliches Notizbuch, das jeder einsehen kann. Jede Transaktion wird dort aufgeschrieben, und weil so viele Menschen eine Kopie haben, kann niemand heimlich etwas ändern."
        />
      </section>

      {/* Problem & Solution */}
      <section className="content-section">
        <div className="section-label">❓ Problem & Lösung</div>
        
        <div className="comparison-container">
          <div className="comparison-item problem">
            <div className="comparison-header">
              <span className="comparison-icon">⚠️</span>
              <h3>Das Problem</h3>
            </div>
            <ul className="comparison-list">
              <li>Banken und Notare sind <strong>zentrale Vermittler</strong></li>
              <li>Man muss ihnen <strong>blind vertrauen</strong></li>
              <li>Sie können Gebühren erheben und <strong>Zeit</strong> brauchen</li>
              <li>Nicht jeder hat <strong>Zugang</strong> zu diesen Diensten</li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">✅</span>
              <h3>Die Lösung: Blockchain</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>Dezentral:</strong> Viele Kopien statt einer Zentrale</li>
              <li><strong>Transparent:</strong> Alle können die Transaktionen sehen</li>
              <li><strong>Manipulationssicher:</strong> Änderungen fallen sofort auf</li>
              <li><strong>Direkt:</strong> Von Person zu Person ohne Vermittler</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Visual Metaphor */}
      <section className="content-section">
        <div className="section-label">🎨 Bildlicher Vergleich</div>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🏛️</div>
            <h4 className="metaphor-title">Traditionell: Die Bank</h4>
            <p className="metaphor-text">
              Wie ein Tresor, zu dem nur die Bank den Schlüssel hat. Du musst darauf 
              vertrauen, dass die Bank alles richtig macht.
            </p>
          </div>

          <div className="metaphor-divider">→</div>

          <div className="metaphor-card highlight">
            <div className="metaphor-icon">📚</div>
            <h4 className="metaphor-title">Blockchain: Das Gemeinsame Notizbuch</h4>
            <p className="metaphor-text">
              Wie ein Notizbuch, von dem jeder eine Kopie hat. Jeder kann nachschauen, 
              und niemand kann heimlich etwas ändern.
            </p>
          </div>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="content-section">
        <div className="section-label">🔑 Wichtigste Punkte</div>
        
        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Vertrauen durch Technologie</h4>
              <p>Statt einer Bank zu vertrauen, vertrauen wir der Mathematik und vielen Kopien der Daten.</p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Dezentralisierung</h4>
              <p>Keine einzelne Person oder Institution kontrolliert die Blockchain.</p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Transparenz</h4>
              <p>Alle Transaktionen sind für jeden sichtbar und überprüfbar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Sections */}
      <section className="content-section">
        <ExpandableSection
          title="💭 Warum ist das revolutionär?"
          content="Zum ersten Mal in der Geschichte können Menschen direkt Werte übertragen, ohne einer zentralen Institution vertrauen zu müssen. Das öffnet Türen für Menschen ohne Bankzugang und schafft neue Möglichkeiten für globale Zusammenarbeit."
        />

        <ExpandableSection
          title="🌍 Wo wird Blockchain schon genutzt?"
          content="Kryptowährungen wie Bitcoin sind das bekannteste Beispiel. Aber Blockchain wird auch für Lieferketten-Tracking, digitale Verträge (Smart Contracts), Gesundheitsdaten und sogar Grundbücher getestet."
        />
      </section>

      {/* Quiz Section */}
      <section className="content-section quiz-section">
        <div className="section-label">✏️ Wissens-Check</div>
        <div className="quiz-intro">
          <p>Teste dein Verständnis mit diesen 3 Fragen:</p>
        </div>
        
        <MultipleChoice
          questions={quizQuestions}
          onComplete={handleQuizComplete}
        />

        {quizCompleted && (
          <div className="quiz-result">
            <div className={`result-card ${quizScore === 3 ? 'perfect' : quizScore >= 2 ? 'good' : 'retry'}`}>
              <div className="result-icon">
                {quizScore === 3 ? '🎉' : quizScore >= 2 ? '👍' : '📚'}
              </div>
              <h3 className="result-title">
                {quizScore === 3 ? 'Perfekt!' : quizScore >= 2 ? 'Gut gemacht!' : 'Weiter üben!'}
              </h3>
              <p className="result-text">
                Du hast {quizScore} von 3 Fragen richtig beantwortet.
              </p>
              {quizScore < 2 && (
                <p className="result-hint">
                  Lies das Modul noch einmal durch und versuche es erneut.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="content-section summary-section">
        <div className="section-label">📝 Zusammenfassung</div>
        <div className="summary-card">
          <h3 className="summary-title">Was du gelernt hast:</h3>
          <ul className="summary-list">
            <li>Blockchain löst das <strong>Vertrauensproblem</strong> ohne zentrale Vermittler</li>
            <li>Statt einer Bank vertrauen wir einem <strong>dezentralen Netzwerk</strong></li>
            <li>Alle Transaktionen sind <strong>transparent und nachvollziehbar</strong></li>
            <li>Niemand kann heimlich Daten ändern</li>
          </ul>
          
          <div className="next-module-hint">
            <p>
              <strong>Im nächsten Modul</strong> schauen wir uns an, wie dieses 
              "gemeinsame Notizbuch" technisch funktioniert.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module01_WhyBlockchain;
