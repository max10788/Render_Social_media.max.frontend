import Module01_Willkommen from './Module01_Willkommen';
import Module02_Bewohnertypen from './Module02_Bewohnertypen';
import Module03_Beobachtungsebenen from './Module03_Beobachtungsebenen';
import Module04_Beobachtungszeitraeume from './Module04_Beobachtungszeitraeume';
import Module05_Sicherheitsbewertung from './Module05_Sicherheitsbewertung';
import Module06_PraktischerWorkflow from './Module06_PraktischerWorkflow';

export const contractRadarCourse = {
  id: 'contract-radar',
  title: 'Contract Radar - Die Nachbarschaftsanalyse',
  description: 'Lerne, wie du Token-Communities analysierst und Wallet-Typen identifizierst',
  icon: '📡',
  color: '#6366f1',
  category: 'Tools',
  difficulty: 'Beginner',
  duration: '60 Minuten',
  modules: [
    {
      id: 'module-01',
      title: 'Willkommen in der Nachbarschaft',
      description: 'Einführung in Contract Radar und die Nachbarschafts-Metapher',
      component: Module01_Willkommen,
      duration: '8 Minuten',
      icon: '🏘️'
    },
    {
      id: 'module-02',
      title: 'Die Bewohner kennenlernen',
      description: 'Verstehe die 5 Wallet-Typen und lerne sie zu identifizieren',
      component: Module02_Bewohnertypen,
      duration: '15 Minuten',
      icon: '👥'
    },
    {
      id: 'module-03',
      title: 'Die 3 Beobachtungsebenen',
      description: 'Von Quick Scan bis Deep Context - wähle die richtige Analyse-Tiefe',
      component: Module03_Beobachtungsebenen,
      duration: '10 Minuten',
      icon: '🔬'
    },
    {
      id: 'module-04',
      title: 'Beobachtungszeiträume',
      description: 'Top Holders vs Recent Traders und das richtige Zeitfenster',
      component: Module04_Beobachtungszeitraeume,
      duration: '12 Minuten',
      icon: '⏰'
    },
    {
      id: 'module-05',
      title: 'Sicherheitsbewertung',
      description: 'Risk Scores und Risk Flags richtig interpretieren',
      component: Module05_Sicherheitsbewertung,
      duration: '10 Minuten',
      icon: '🛡️'
    },
    {
      id: 'module-06',
      title: 'Praktischer Workflow',
      description: 'Wende dein Wissen an - Schritt-für-Schritt Analysen',
      component: Module06_PraktischerWorkflow,
      duration: '15 Minuten',
      icon: '🎯'
    }
  ],
  prerequisites: [],
  learningOutcomes: [
    'Verstehe, was Contract Radar ist und wie es funktioniert',
    'Identifiziere die 5 Wallet-Typen (Whale, Hodler, Trader, Mixer, Dust Sweeper)',
    'Wähle die richtige Analysis Depth und Wallet Source',
    'Interpretiere Risk Scores und Risk Flags korrekt',
    'Führe vollständige Token-Analysen selbstständig durch'
  ],
  relatedCourses: ['pattern-recognition', 'blockchain-basics'],
  toolLink: '/radar'
};
