// src/learning/pages/CourseView.js - UPDATED IMPORTS

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

// Blockchain Basics Modules
import Module01_WhyBlockchain from '../courses/blockchain-basics/modules/Module01_WhyBlockchain';
import Module02_SharedNotebook from '../courses/blockchain-basics/modules/Module02_SharedNotebook';
import Module03_BlockStructure from '../courses/blockchain-basics/modules/Module03_BlockStructure';
import Module04_TheChain from '../courses/blockchain-basics/modules/Module04_TheChain';
import Module05_HashFunction from '../courses/blockchain-basics/modules/Module05_HashFunction';
import Module06_Decentralization from '../courses/blockchain-basics/modules/Module06_Decentralization';
import Module07_Consensus from '../courses/blockchain-basics/modules/Module07_Consensus';
import Module08_Security from '../courses/blockchain-basics/modules/Module08_Security';
import Module09_RealWorldExamples from '../courses/blockchain-basics/modules/Module09_RealWorldExamples';

// Reading Transactions Modules - CORRECTED PATH
import Module01_TransactionBasics from '../courses/data-structures/Module01_TransactionBasics';
import Module02_WalletAndAddress from '../courses/data-structures/Module02_WalletAndAddress';
import Module03_SimpleTransaction from '../courses/data-structures/Module03_SimpleTransaction';
import Module04_EthereumExplorer from '../courses/data-structures/Module04_EthereumExplorer';
import Module05_GasAndFees from '../courses/data-structures/Module05_GasAndFees';

import './CourseView.css';

const CourseView = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);

  const moduleNumber = moduleId ? parseInt(moduleId) : 1;

  // Course configurations
  const courseConfigs = {
    'blockchain-basics': {
      title: 'Blockchain Grundlagen',
      totalModules: 9,
      modules: {
        1: { component: Module01_WhyBlockchain, title: 'Warum braucht man Blockchain?' },
        2: { component: Module02_SharedNotebook, title: 'Das gemeinsame Notizbuch' },
        3: { component: Module03_BlockStructure, title: 'Der Block als Datenstruktur' },
        4: { component: Module04_TheChain, title: 'Die Kette: Blöcke verbinden' },
        5: { component: Module05_HashFunction, title: 'Die Hash-Funktion' },
        6: { component: Module06_Decentralization, title: 'Dezentralität' },
        7: { component: Module07_Consensus, title: 'Konsens: Wie sich alle einigen' },
        8: { component: Module08_Security, title: 'Sicherheit & Unveränderlichkeit' },
        9: { component: Module09_RealWorldExamples, title: 'Praxisbeispiele & Anwendungen' }
      }
    },
    'reading-transactions': {
      title: 'Transaktionen Lesen',
      totalModules: 8,
      modules: {
        1: { component: Module01_TransactionBasics, title: 'Was ist eine Transaktion?' },
        2: { component: Module02_WalletAndAddress, title: 'Wallet & Adresse verstehen' },
        3: { component: Module03_SimpleTransaction, title: 'Aufbau einer Transaktion' },
        4: { component: Module04_EthereumExplorer, title: 'Ethereum im Blockexplorer' },
        5: { component: Module05_GasAndFees, title: 'Gas & Gebühren' },
        // 6: { component: Module06_SmartContracts, title: 'Smart Contract Interaktionen' },
        // 7: { component: Module07_Security, title: 'Security-Perspektive' },
        // 8: { component: Module08_SpecialCases, title: 'Spezialfälle und Muster' }
      }
    }
  };

  const currentCourse = courseConfigs[courseId];

  useEffect(() => {
    const savedProgress = localStorage.getItem('learning_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    window.scrollTo(0, 0);
  }, [courseId, moduleId]);

  const handleComplete = () => {
    const newProgress = {
      ...progress,
      [courseId]: {
        ...(progress[courseId] || {}),
        [moduleNumber]: { completed: true, progress: 100 }
      }
    };
    setProgress(newProgress);
    localStorage.setItem('learning_progress', JSON.stringify(newProgress));
    
    const courseProgress = newProgress[courseId];
    const allCompleted = Object.keys(currentCourse.modules).every(key => 
      courseProgress[parseInt(key)]?.completed === true
    );
    
    if (allCompleted) {
      setCourseCompleted(true);
    }
    
    setShowCompletion(true);
  };

  const handleNext = () => {
    const nextModule = moduleNumber + 1;
    if (currentCourse.modules[nextModule]) {
      navigate(`/learning/course/${courseId}/module/${nextModule}`);
      setShowCompletion(false);
      setCourseCompleted(false);
    } else {
      navigate('/learning');
    }
  };

  const handlePrevious = () => {
    const prevModule = moduleNumber - 1;
    if (prevModule >= 1) {
      navigate(`/learning/course/${courseId}/module/${prevModule}`);
    }
  };

  if (!currentCourse) {
    return (
      <div className="course-view">
        <div className="container">
          <div className="error-state">
            <h2>Kurs nicht gefunden</h2>
            <Link to="/learning" className="btn btn-primary">Zurück zur Übersicht</Link>
          </div>
        </div>
      </div>
    );
  }

  const CurrentModule = currentCourse.modules[moduleNumber]?.component;

  if (!CurrentModule) {
    return (
      <div className="course-view">
        <div className="container">
          <div className="error-state">
            <h2>Modul nicht gefunden</h2>
            <Link to="/learning" className="btn btn-primary">Zurück zur Übersicht</Link>
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
            
            <div className="course-info">
              <span className="course-name">{currentCourse.title}</span>
              <span className="module-indicator">
                Modul {moduleNumber} / {currentCourse.totalModules}
              </span>
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

          <div className="module-progress-bar">
            <div 
              className="module-progress-fill"
              style={{ width: `${(moduleNumber / currentCourse.totalModules) * 100}%` }}
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
                  {moduleNumber < currentCourse.totalModules ? 'Nächstes Modul' : 'Zum Kurs zurück'}
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
            {courseCompleted && moduleNumber === currentCourse.totalModules ? (
              <>
                <div className="completion-icon course-done">🎓</div>
                <h2 className="completion-title">Kurs abgeschlossen!</h2>
                <p className="completion-text">
                  🎉 Herzlichen Glückwunsch! Du hast "{currentCourse.title}" erfolgreich abgeschlossen!
                </p>
              </>
            ) : (
              <>
                <div className="completion-icon">🎉</div>
                <h2 className="completion-title">Modul abgeschlossen!</h2>
                <p className="completion-text">
                  Sehr gut! Du hast Modul {moduleNumber} erfolgreich abgeschlossen.
                </p>
              </>
            )}
            
            <div className="completion-actions">
              <button onClick={handleNext} className="btn btn-primary btn-large">
                {moduleNumber < currentCourse.totalModules 
                  ? 'Weiter zu Modul ' + (moduleNumber + 1) 
                  : 'Zurück zur Übersicht'}
                <span className="btn-arrow">→</span>
              </button>
              <button onClick={() => {
                setShowCompletion(false);
                setCourseCompleted(false);
              }} className="btn btn-secondary">
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
