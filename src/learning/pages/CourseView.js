// src/learning/pages/CourseView.js - WITH PATTERN RECOGNITION

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

// Reading Transactions Modules - ALL 8 MODULES
import Module01_TransactionBasics from '../courses/data-structures/Module01_TransactionBasics';
import Module02_WalletAndAddress from '../courses/data-structures/Module02_WalletAndAddress';
import Module03_SimpleTransaction from '../courses/data-structures/Module03_SimpleTransaction';
import Module04_EthereumExplorer from '../courses/data-structures/Module04_EthereumExplorer';
import Module05_GasAndFees from '../courses/data-structures/Module05_GasAndFees';
import Module06_SmartContracts from '../courses/data-structures/Module06_SmartContracts';
import Module07_SecurityModule from '../courses/data-structures/Module07_Security';
import Module08_SpecialCases from '../courses/data-structures/Module08_SpecialCases';

// Pattern Recognition Modules - ALL 6 MODULES
import Module01_ZielUndRahmen from '../courses/pattern-recognition/Module01_ZielUndRahmen';
import Module02_VerhaltensmuserEinfach from '../courses/pattern-recognition/Module02_VerhaltensmuserEinfach';
import Module03_WalletCluster from '../courses/pattern-recognition/Module03_WalletCluster';
import Module04_ServiceMuster from '../courses/pattern-recognition/Module04_ServiceMuster';
import Module05_AnalyseWorkflows from '../courses/pattern-recognition/Module05_AnalyseWorkflows';
import Module06_Praxis from '../courses/pattern-recognition/Module06_Praxis';

import './CourseView.css';

const CourseView = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [showCompletion, setShowCompletion] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);

  // AUTO-REDIRECT: If no moduleId, redirect to module 1
  useEffect(() => {
    if (courseId && !moduleId) {
      navigate(`/learning/course/${courseId}/module/1`, { replace: true });
    }
  }, [courseId, moduleId, navigate]);

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
        6: { component: Module06_SmartContracts, title: 'Smart Contract Interaktionen' },
        7: { component: Module07_SecurityModule, title: 'Security & Sicherheit' },
        8: { component: Module08_SpecialCases, title: 'Special Cases & Spezialfälle' }
      }
    },
    'pattern-recognition': {
      title: 'Pattern Recognition',
      totalModules: 6,
      modules: {
        1: { component: Module01_ZielUndRahmen, title: 'Ziel und Rahmen' },
        2: { component: Module02_VerhaltensmuserEinfach, title: 'Einfache Verhaltensmuster' },
        3: { component: Module03_WalletCluster, title: 'Wallet-Cluster erkennen' },
        4: { component: Module04_ServiceMuster, title: 'Service-Muster' },
        5: { component: Module05_AnalyseWorkflows, title: 'Analyse-Workflows' },
        6: { component: Module06_Praxis, title: 'Praxis & Anwendung' }
      }
    }
  };

  const currentCourse = courseConfigs[courseId];

  // Load progress
  useEffect(() => {
    const savedProgress = localStorage.getItem('learning_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
    window.scrollTo(0, 0);
  }, [courseId, moduleId]);

  // Show loading if redirecting
  if (!moduleId) {
    return (
      <div className="course-view">
        <div className="container" style={{ 
          padding: '4rem 1rem', 
          textAlign: 'center',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>⏳</div>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Lade Kurs...</p>
        </div>
      </div>
    );
  }

  // Check if course exists
  if (!currentCourse) {
    return (
      <div className="course-view">
        <div className="container">
          <div className="error-state" style={{ 
            padding: '4rem 1rem', 
            textAlign: 'center',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#e0e7ff', marginBottom: '0.5rem' }}>Kurs nicht gefunden</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Kurs-ID: <code>{courseId}</code></p>
            <Link to="/learning" className="btn btn-primary">
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const CurrentModule = currentCourse.modules[moduleNumber]?.component;

  // Check if module exists
  if (!CurrentModule) {
    return (
      <div className="course-view">
        <div className="container">
          <div className="error-state" style={{ 
            padding: '4rem 1rem', 
            textAlign: 'center',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h2 style={{ color: '#e0e7ff', marginBottom: '0.5rem' }}>Modul nicht gefunden</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Kurs: <strong>{courseId}</strong>, Modul: <strong>{moduleNumber}</strong>
            </p>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Dieser Kurs hat {currentCourse.totalModules} Module. 
              {moduleNumber > currentCourse.totalModules && ' Modul noch nicht verfügbar.'}
            </p>
            <Link to={`/learning/course/${courseId}/module/1`} className="btn btn-primary">
              Zu Modul 1
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    
    const courseProgress = newProgress[courseId] || {};
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
                <div className="completion-stats" style={{ 
                  display: 'flex', 
                  gap: '2rem', 
                  justifyContent: 'center',
                  margin: '2rem 0'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {currentCourse.totalModules}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Module</div>
                  </div>
                </div>
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
