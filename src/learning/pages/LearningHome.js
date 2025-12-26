// src/learning/pages/LearningHome.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LearningHome.css';

const LearningHome = () => {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const savedProgress = localStorage.getItem('learning_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const courses = [
    {
      id: 'blockchain-basics',
      title: 'Blockchain Grundlagen',
      description: 'Verstehe die fundamentalen Konzepte der Blockchain-Technologie – ohne Vorkenntnisse.',
      icon: '🧱',
      modules: 9,
      duration: '2-3 Stunden',
      level: 'Beginner',
      color: '#6366f1',
      topics: [
        'Warum Blockchain?',
        'Dezentralisierung verstehen',
        'Hash-Funktionen',
        'Konsens-Mechanismen'
      ]
    },
    {
      id: 'reading-transactions',
      title: 'Transaktionen Lesen',
      description: 'Lerne Wallet-Transaktionen im Blockexplorer zu analysieren und zu verstehen.',
      icon: '📝',
      modules: 8, // UPDATED TO 8!
      duration: '3-4 Stunden',
      level: 'Beginner',
      color: '#a855f7',
      new: true,
      topics: [
        'Wallet & Adressen',
        'Gas & Gebühren',
        'Smart Contracts',
        'Security Best Practices'
      ]
    }
  ];

  const getCourseProgress = (courseId, moduleCount) => {
    const courseProgress = progress[courseId] || {};
    const completed = Object.values(courseProgress).filter(p => p?.completed).length;
    return Math.round((completed / moduleCount) * 100);
  };

  const getCompletedModules = (courseId) => {
    const courseProgress = progress[courseId] || {};
    return Object.values(courseProgress).filter(p => p?.completed).length;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'beginner';
      case 'Intermediate': return 'intermediate';
      case 'Advanced': return 'advanced';
      default: return 'beginner';
    }
  };

  return (
    <div className="learning-home">
      <div className="learning-header">
        <div className="container">
          <Link to="/" className="back-link">
            <span className="back-arrow">←</span>
            Zurück zur Startseite
          </Link>
          
          <div className="header-content">
            <h1 className="page-title">
              Onchain Analysis Academy
            </h1>
            <p className="page-subtitle">
              Lerne professionelle Blockchain-Analyse Schritt für Schritt – 
              von den Grundlagen bis zu fortgeschrittenen Techniken.
            </p>
          </div>

          <div className="learning-stats">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-value">{courses.length}</div>
                <div className="stat-label">Kurse verfügbar</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-value">
                  {courses.reduce((sum, course) => sum + course.modules, 0)}
                </div>
                <div className="stat-label">Module insgesamt</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-value">~5h</div>
                <div className="stat-label">Gesamtdauer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="learning-content">
        <div className="container">
          <div className="courses-header">
            <h2 className="section-title">Verfügbare Kurse</h2>
            <p className="section-description">
              Wähle einen Kurs und starte deine Lernreise. Jeder Kurs enthält 
              interaktive Module mit Quiz und praktischen Beispielen.
            </p>
          </div>

          <div className="courses-grid">
            {courses.map((course) => {
              const courseProgress = getCourseProgress(course.id, course.modules);
              const completedModules = getCompletedModules(course.id);
              const isStarted = completedModules > 0;
              const isCompleted = completedModules === course.modules;

              return (
                <div 
                  key={course.id} 
                  className={`course-card ${isCompleted ? 'completed' : ''}`}
                  style={{ '--course-color': course.color }}
                >
                  <div className="course-card-header">
                    <div className="course-icon" style={{ background: course.color }}>
                      {course.icon}
                    </div>
                    <div className="course-badges">
                      {course.new && (
                        <span className="course-badge new">Neu</span>
                      )}
                      <span className={`course-badge level ${getLevelColor(course.level)}`}>
                        {course.level}
                      </span>
                    </div>
                  </div>

                  <div className="course-card-content">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.description}</p>

                    <div className="course-topics">
                      {course.topics.map((topic, i) => (
                        <div key={i} className="topic-tag">
                          <span className="topic-dot">•</span>
                          {topic}
                        </div>
                      ))}
                    </div>

                    <div className="course-meta">
                      <span className="meta-item">
                        <span className="meta-icon">📚</span>
                        {course.modules} Module
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        {course.duration}
                      </span>
                    </div>

                    {isStarted && (
                      <div className="course-progress">
                        <div className="progress-info">
                          <span className="progress-label">Fortschritt</span>
                          <span className="progress-percentage">{courseProgress}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${courseProgress}%`,
                              background: course.color
                            }}
                          ></div>
                        </div>
                        <div className="progress-modules">
                          {completedModules} / {course.modules} Module abgeschlossen
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="completion-badge-course">
                        <span className="badge-icon">✓</span>
                        Kurs abgeschlossen
                      </div>
                    )}
                  </div>

                  <div className="course-card-footer">
                    <Link 
                      to={`/learning/course/${course.id}`}
                      className="course-button"
                      style={{ background: course.color }}
                    >
                      {isCompleted ? 'Wiederholen' : isStarted ? 'Fortsetzen' : 'Kurs starten'}
                      <span className="button-arrow">→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="learning-path-info">
            <div className="path-card">
              <div className="path-icon">🎯</div>
              <div className="path-content">
                <h3 className="path-title">Empfohlene Lernreihenfolge</h3>
                <ol className="path-list">
                  <li>
                    <strong>Blockchain Grundlagen</strong> – Verstehe die Technologie
                  </li>
                  <li>
                    <strong>Transaktionen Lesen</strong> – Analysiere Wallet-Aktivität
                  </li>
                  <li>
                    <strong>Advanced Analysis</strong> – Professionelle Techniken (Bald verfügbar)
                  </li>
                </ol>
              </div>
            </div>

            <div className="path-card">
              <div className="path-icon">💡</div>
              <div className="path-content">
                <h3 className="path-title">Lern-Tipps</h3>
                <ul className="tips-list">
                  <li>Module bauen aufeinander auf – folge der Reihenfolge</li>
                  <li>Nimm dir Zeit für Quiz-Fragen</li>
                  <li>Wiederhole Module bei Bedarf</li>
                  <li>Praktische Übungen festigen das Wissen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningHome;
