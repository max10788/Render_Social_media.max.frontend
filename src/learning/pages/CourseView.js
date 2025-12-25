// path: src/learning/pages/CourseView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Module01_WhyBlockchain from '../courses/blockchain-basics/modules/Module01_WhyBlockchain';
import Module02_SharedNotebook from '../courses/blockchain-basics/modules/Module02_SharedNotebook';
import Module03_BlockStructure from '../courses/blockchain-basics/modules/Module03_BlockStructure';
import Module04_TheChain from '../courses/blockchain-basics/modules/Module04_TheChain';
import Module05_HashFunction from '../courses/blockchain-basics/modules/Module05_HashFunction';
import './CourseView.css';

const CourseView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [showCompletion, setShowCompletion] = useState(false);

  const moduleNumber = parseInt(moduleId.replace('module-', ''));

  const modules = {
    1: { 
      component: Module01_WhyBlockchain, 
      title: 'Warum braucht man Blockchain?',
      description: 'Vertrauen ohne Bank oder Notar'
    },
    2: { 
      component: Module02_SharedNotebook, 
      title: 'Das gemeinsame Notizbuch',
      description: 'Verteilte Listen, die alle sehen können'
    },
    3: {
      component: Module03_BlockStructure,
      title: 'Der Block als Datenstruktur',
      description: 'Was steht in einem Block?'
    },
    4: {
      component: Module04_TheChain,
      title: 'Die Kette: Blöcke verbinden',
      description: 'Wie Blöcke über Hashes verbunden sind'
    },
    5: {
      component: Module05_HashFunction,
      title: 'Die Hash-Funktion',
      description: 'Digitaler Fingerabdruck - kleine Änderung, neuer Hash'
    }
    // Module 6-9 werden später hinzugefügt
  };

  useEffect(() => {
    // Load progress
    const savedProgress = localStorage.getItem('learning_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }

    // Scroll to top on module change
    window.scrollTo(0, 0);
  }, [moduleId]);

  const handleComplete = () => {
    const newProgress = {
      ...progress,
      [moduleNumber]: { completed: true, progress: 100 }
    };
    setProgress(newProgress);
    localStorage.setItem('learning_progress', JSON.stringify(newProgress));
    setShowCompletion(true);
  };

  const handleNext = () => {
    const nextModule = moduleNumber + 1;
    if (modules[nextModule]) {
      navigate(`/learning/blockchain-basics/module-${nextModule}`);
      setShowCompletion(false);
    } else {
      navigate('/learning');
    }
  };

  const handlePrevious = () => {
    const prevModule = moduleNumber - 1;
    if (prevModule >= 1) {
      navigate(`/learning/blockchain-basics/module-${prevModule}`);
    }
  };

  const CurrentModule = modules[moduleNumber]?.component;

  if (!CurrentModule) {
    return (
      <div className="course-view">
        <div className="container">
          <div className="error-state">
            <h2>Modul nicht gefunden</h2>
            <Link to="/learning" className="btn btn-primary">
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-view">
      {/* Header Navigation */}
      <div className="course-header">
        <div className="container">
          <div className="header-nav">
            <Link to="/learning" className="back-link">
              <span className="back-arrow">←</span>
              Kursübersicht
            </Link>
            
            <div className="module-indicator">
              <span className="module-number">Modul {moduleNumber}</span>
              <span className="module-separator">/</span>
              <span className="module-total">9</span>
            </div>

            <div className="module-nav">
              {moduleNumber > 1 && (
                <button onClick={handlePrevious} className="nav-btn">
                  <span className="nav-arrow">←</span>
                  Zurück
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="module-progress-bar">
            <div 
              className="module-progress-fill"
              style={{ width: `${(moduleNumber / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <div className="course-content">
        <div className="container">
          <CurrentModule onComplete={handleComplete} />

          {/* Navigation Footer */}
          <div className="course-footer">
            <div className="footer-actions">
              {moduleNumber > 1 && (
                <button onClick={handlePrevious} className="btn btn-secondary">
                  <span className="btn-arrow">←</span>
                  Vorheriges Modul
                </button>
              )}
              
              {!showCompletion ? (
                <button onClick={handleComplete} className="btn btn-primary">
                  Modul abschließen
                  <span className="btn-icon">✓</span>
                </button>
              ) : (
                <button onClick={handleNext} className="btn btn-success">
                  {moduleNumber < 9 ? 'Nächstes Modul' : 'Zum Kurs zurück'}
                  <span className="btn-arrow">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div className="completion-overlay">
          <div className="completion-modal">
            <div className="completion-icon">🎉</div>
            <h2 className="completion-title">Modul abgeschlossen!</h2>
            <p className="completion-text">
              Sehr gut! Du hast Modul {moduleNumber} erfolgreich abgeschlossen.
            </p>
            <div className="completion-actions">
              <button onClick={handleNext} className="btn btn-primary btn-large">
                {moduleNumber < 9 ? 'Weiter zu Modul ' + (moduleNumber + 1) : 'Zurück zur Übersicht'}
                <span className="btn-arrow">→</span>
              </button>
              <button onClick={() => setShowCompletion(false)} className="btn btn-secondary">
                Modul wiederholen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseView;
