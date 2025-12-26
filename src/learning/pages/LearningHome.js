// path: src/learning/pages/LearningHome.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './LearningHome.css';

const LearningHome = () => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState({});

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('learning_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const courseModules = [
    {
      id: 1,
      title: 'Warum braucht man Blockchain?',
      description: 'Vertrauen ohne Bank oder Notar',
      icon: '🏦',
      duration: '5 min',
      difficulty: 'Einfach'
    },
    {
      id: 2,
      title: 'Grundidee: Das gemeinsame Notizbuch',
      description: 'Wie ein Gruppenchat für Transaktionen',
      icon: '📝',
      duration: '8 min',
      difficulty: 'Einfach'
    },
    {
      id: 3,
      title: 'Der Block als Datenstruktur',
      description: 'Was steht in einem Block?',
      icon: '📦',
      duration: '10 min',
      difficulty: 'Einfach'
    },
    {
      id: 4,
      title: 'Die Kette: Blöcke verbinden',
      description: 'Wie Blöcke über Hashes verlinkt sind',
      icon: '🔗',
      duration: '12 min',
      difficulty: 'Mittel'
    },
    {
      id: 5,
      title: 'Hash-Funktion',
      description: 'Der digitale Fingerabdruck',
      icon: '🔐',
      duration: '10 min',
      difficulty: 'Mittel'
    },
    {
      id: 6,
      title: 'Dezentralität',
      description: 'Viele Kopien statt zentraler Datenbank',
      icon: '🌐',
      duration: '8 min',
      difficulty: 'Mittel'
    },
    {
      id: 7,
      title: 'Konsens: Wie sich alle einigen',
      description: 'Proof of Work und Proof of Stake',
      icon: '🤝',
      duration: '15 min',
      difficulty: 'Fortgeschritten'
    },
    {
      id: 8,
      title: 'Unveränderlichkeit & Sicherheit',
      description: 'Warum Manipulation extrem schwer ist',
      icon: '🛡️',
      duration: '12 min',
      difficulty: 'Fortgeschritten'
    },
    {
      id: 9,
      title: 'Praxis: Echte Anwendungen',
      description: 'Kryptowährung, Lieferkette, Grundbuch',
      icon: '💼',
      duration: '10 min',
      difficulty: 'Mittel'
    }
  ];

  const calculateOverallProgress = () => {
    const completed = Object.values(progress).filter(p => p.completed).length;
    return Math.round((completed / courseModules.length) * 100);
  };

  const getModuleProgress = (moduleId) => {
    return progress[moduleId]?.completed ? 100 : progress[moduleId]?.progress || 0;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Einfach': return 'easy';
      case 'Mittel': return 'medium';
      case 'Fortgeschritten': return 'advanced';
      default: return 'easy';
    }
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className="learning-home">
      {/* Header */}
      <div className="learning-header">
        <div className="container">
          <Link to="/" className="back-link">
            <span className="back-arrow">←</span>
            Zurück zur Startseite
          </Link>
          
          <div className="header-content">
            <h1 className="page-title">
              Blockchain Grundlagen verstehen
            </h1>
            <p className="page-subtitle">
              Lerne die Kernkonzepte der Blockchain-Technologie – ohne Programmierkenntnisse.
              In 9 kurzen Modulen verstehst du, wie Blockchain funktioniert.
            </p>
          </div>

          {/* Overall Progress */}
          <div className="overall-progress-card">
            <div className="progress-header">
              <div className="progress-info">
                <span className="progress-label">Dein Fortschritt</span>
                <span className="progress-percentage">{overallProgress}%</span>
              </div>
              <div className="progress-stats">
                <span className="stat-item">
                  <span className="stat-icon">✓</span>
                  {Object.values(progress).filter(p => p.completed).length} / {courseModules.length} Module
                </span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules */}
      <div className="learning-content">
        <div className="container">
          <div className="modules-header">
            <h2 className="section-title">Kurs-Module</h2>
            <p className="section-description">
              Jedes Modul enthält eine kurze Lektion, interaktive Beispiele und Wissens-Quiz.
            </p>
          </div>

          <div className="modules-grid">
            {courseModules.map((module, index) => {
              const moduleProgress = getModuleProgress(module.id);
              const isCompleted = progress[module.id]?.completed || false;
              const isLocked = index > 0 && !progress[index]?.completed && moduleProgress === 0;

              return (
                <div 
                  key={module.id} 
                  className={`module-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
                >
                  <div className="module-header">
                    <div className="module-icon">{module.icon}</div>
                    <div className="module-number">Modul {module.id}</div>
                  </div>

                  <div className="module-content">
                    <h3 className="module-title">{module.title}</h3>
                    <p className="module-description">{module.description}</p>

                    <div className="module-meta">
                      <span className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        {module.duration}
                      </span>
                      <span className={`meta-difficulty ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </div>

                    {moduleProgress > 0 && !isCompleted && (
                      <div className="module-progress">
                        <div className="progress-bar-mini">
                          <div 
                            className="progress-bar-mini-fill" 
                            style={{ width: `${moduleProgress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{moduleProgress}% abgeschlossen</span>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="completion-badge">
                        <span className="badge-icon">✓</span>
                        Abgeschlossen
                      </div>
                    )}
                  </div>

                  <div className="module-footer">
                    {!isLocked ? (
                      <Link 
                        to={`/learning/blockchain-basics/module-${module.id}`}
                        className="module-button"
                      >
                        {isCompleted ? 'Wiederholen' : moduleProgress > 0 ? 'Fortsetzen' : 'Starten'}
                        <span className="button-arrow">→</span>
                      </Link>
                    ) : (
                      <button className="module-button locked" disabled>
                        <span className="lock-icon">🔒</span>
                        Gesperrt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info Section */}
          <div className="info-section">
            <div className="info-card">
              <div className="info-icon">💡</div>
              <div className="info-content">
                <h3 className="info-title">Lern-Tipps</h3>
                <ul className="info-list">
                  <li>Nimm dir Zeit für jedes Modul – Qualität vor Geschwindigkeit</li>
                  <li>Wiederhole Module, wenn etwas unklar ist</li>
                  <li>Teste dein Wissen mit den Quiz-Fragen</li>
                  <li>Module bauen aufeinander auf – folge der Reihenfolge</li>
                </ul>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🎯</div>
              <div className="info-content">
                <h3 className="info-title">Dein Lernziel</h3>
                <p className="info-text">
                  Nach diesem Kurs kannst du die wichtigsten Blockchain-Begriffe erklären und verstehst, 
                  warum die Technologie als manipulationssicher gilt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningHome;
