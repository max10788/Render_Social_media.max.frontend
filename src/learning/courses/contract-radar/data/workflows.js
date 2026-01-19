export const radarWorkflows = {
  basicAnalysis: {
    id: 'basic-analysis',
    title: 'Workflow 1: Grundlegende Nachbarschafts-Analyse',
    description: 'Schritt-für-Schritt Anleitung für deine erste Contract Radar Analyse',
    estimatedTime: '5 Minuten',
    steps: [
      {
        title: 'Contract Address eingeben',
        description: 'Gib die Adresse des Smart Contracts ein, den du analysieren möchtest. Das ist wie die Straße, in die du ziehst.',
        tips: [
          'Kopiere die vollständige Adresse (0x...)',
          'Stelle sicher, dass es ein Token Contract ist',
          'Prüfe die Chain (Ethereum, BSC, etc.)'
        ],
        checkpoints: [
          'Adresse ist vollständig (42 Zeichen)',
          'Chain ist korrekt ausgewählt',
          'Du bist bereit für die Analyse'
        ],
        example: 'Beispiel: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 (Uniswap auf Ethereum)'
      },
      {
        title: 'Wallet Source wählen',
        description: 'Entscheide, welche "Bewohner" du beobachten willst: Die großen Grundstücksbesitzer (Top Holders) oder die aktuellen Besucher (Recent Traders).',
        tips: [
          'Top Holders = Langfristige Perspektive',
          'Recent Traders = Kurzfristige Aktivität',
          'Bei neuen Tokens: Recent Traders nutzen',
          'Bei etablierten Tokens: Top Holders nutzen'
        ],
        checkpoints: [
          'Du weißt, warum du diese Source gewählt hast',
          'Recent Hours ist passend eingestellt (bei Recent Traders)',
          'Analysis Depth ist gewählt'
        ],
        example: 'Für einen neuen Token: Recent Traders (3 Hours) + Stage 2 Analysis'
      },
      {
        title: 'Analysis Depth festlegen',
        description: 'Wähle, wie tief du graben willst. Das ist wie: Nur kurz vorbeischauen (Stage 1), die Nachbarschaft kennenlernen (Stage 2), oder eine vollständige Hintergrundprüfung (Stage 3).',
        tips: [
          'Stage 1 (Quick): Für schnelle Übersicht',
          'Stage 2 (Standard): Für die meisten Fälle',
          'Stage 3 (Deep): Für kritische Entscheidungen',
          'Mehr Stages = Mehr Zeit, aber bessere Insights'
        ],
        checkpoints: [
          'Du verstehst den Unterschied zwischen den Stages',
          'Die gewählte Stage passt zu deinem Zeitbudget',
          'Du bist bereit, die Analyse zu starten'
        ],
        example: 'Stage 2 für ausgewogene Analyse in ~30 Sekunden'
      },
      {
        title: 'Analyse starten und warten',
        description: 'Klicke auf "Start Analysis" und warte, während die Nachbarschaft durchleuchtet wird. Das Backend analysiert jetzt alle Bewohner.',
        tips: [
          'Sei geduldig - gute Analysen brauchen Zeit',
          'Stage 1: ~10s, Stage 2: ~30s, Stage 3: ~60s',
          'Du siehst den Fortschritt in Echtzeit',
          'Die Wallets erscheinen nach und nach'
        ],
        checkpoints: [
          'Analyse läuft (Spinner ist sichtbar)',
          'Radar zeigt erste Ergebnisse',
          'Keine Fehlermeldung erschienen'
        ]
      },
      {
        title: 'Radar interpretieren',
        description: 'Der Radar zeigt dir jetzt alle "Bewohner" an. Jeder Punkt ist ein Wallet, die Farbe zeigt den Typ, die Position die Aktivität.',
        tips: [
          'Große Punkte = Große Holdings (Whales)',
          'Farben = Wallet-Typen (siehe Legende)',
          'Position = Verhaltenscluster',
          'Hover über Punkte für Details'
        ],
        checkpoints: [
          'Du kannst die verschiedenen Wallet-Typen unterscheiden',
          'Du siehst die Cluster-Bildung',
          'Du verstehst die Farbkodierung'
        ],
        example: 'Viele grüne Punkte (Hodler) = Stabile Community'
      },
      {
        title: 'Wallets im Detail prüfen',
        description: 'Klicke auf einzelne Wallets in der rechten Spalte, um Details zu sehen: Balance, Transaktionen, Risk Score, und Risk Flags.',
        tips: [
          'Sortiere nach Risk Score für schnelle Übersicht',
          'Prüfe Risk Flags bei auffälligen Wallets',
          'Vergleiche mehrere Wallets miteinander',
          'Achte auf Confidence Score'
        ],
        checkpoints: [
          'Du verstehst die Wallet-Karten',
          'Du kannst Risk Scores interpretieren',
          'Du erkennst verdächtige Patterns'
        ],
        example: 'Wallet mit Risk Score 85 + Flag "Tornado Cash" → Kritisch!'
      },
      {
        title: 'Gesamtbewertung erstellen',
        description: 'Fasse deine Erkenntnisse zusammen: Ist die "Nachbarschaft" sicher? Gibt es viele Whales? Viele Mixer? Wie ist die Gesamtstimmung?',
        tips: [
          'Verhältnis der Wallet-Typen beachten',
          'Durchschnittlicher Risk Score wichtig',
          'Anzahl kritischer Flags zählen',
          'Vergleiche mit ähnlichen Projekten'
        ],
        checkpoints: [
          'Du hast eine klare Meinung zum Token',
          'Du kannst deine Bewertung begründen',
          'Du weißt, ob du investieren würdest'
        ],
        conclusion: 'Du hast jetzt einen vollständigen Überblick über die Token-Nachbarschaft und kannst fundierte Entscheidungen treffen!'
      }
    ]
  },
  
  advancedAnalysis: {
    id: 'advanced-analysis',
    title: 'Workflow 2: Vergleichende Nachbarschafts-Analyse',
    description: 'Vergleiche mehrere Contracts, um das beste Investment zu finden',
    estimatedTime: '15 Minuten',
    steps: [
      {
        title: 'Mehrere Contracts identifizieren',
        description: 'Sammle 2-3 Contract Addresses, die du vergleichen möchtest. Das ist wie: Verschiedene Wohngegenden vor dem Umzug vergleichen.',
        tips: [
          'Wähle ähnliche Projekte (gleiche Nische)',
          'Notiere dir die Adressen',
          'Prüfe, ob alle auf der gleichen Chain sind'
        ],
        checkpoints: [
          'Du hast 2-3 Addresses gesammelt',
          'Alle sind auf der gleichen Chain',
          'Du kennst die Grunddaten (Market Cap, etc.)'
        ]
      },
      {
        title: 'Standardisierte Einstellungen',
        description: 'Nutze für alle Contracts die gleichen Einstellungen (Source, Hours, Depth), um fair zu vergleichen.',
        tips: [
          'Gleiche Wallet Source für alle',
          'Gleiche Analysis Depth',
          'Gleicher Zeitraum (Recent Hours)',
          'Notiere dir die Einstellungen'
        ],
        checkpoints: [
          'Einstellungen sind identisch',
          'Du hast sie dokumentiert',
          'Du bist bereit für die Analysen'
        ]
      },
      {
        title: 'Analysen durchführen',
        description: 'Führe nacheinander die Analysen durch und erstelle Screenshots oder Notizen.',
        tips: [
          'Mache Screenshots vom Radar',
          'Notiere Wallet-Counts pro Typ',
          'Notiere durchschnittliche Risk Scores',
          'Achte auf auffällige Patterns'
        ],
        checkpoints: [
          'Alle Analysen sind abgeschlossen',
          'Du hast Notizen/Screenshots',
          'Keine Fehler aufgetreten'
        ]
      },
      {
        title: 'Metriken vergleichen',
        description: 'Erstelle eine Vergleichstabelle: Anzahl Whales, Hodler, Trader, Mixer, Dust Sweeper pro Contract.',
        tips: [
          'Nutze eine Tabelle (Excel/Notion)',
          'Vergleiche absolute und relative Zahlen',
          'Achte auf Ausreißer',
          'Berechne Durchschnittswerte'
        ],
        checkpoints: [
          'Tabelle ist vollständig',
          'Du siehst klare Unterschiede',
          'Du kannst Trends erkennen'
        ],
        example: 'Contract A: 60% Hodler, Contract B: 40% Trader → A ist stabiler'
      },
      {
        title: 'Risk Profile erstellen',
        description: 'Bewerte jedes Contract nach Risiko: Wie viele kritische Flags? Wie viele Mixer? Durchschnittlicher Risk Score?',
        tips: [
          'Erstelle ein Risiko-Ranking',
          'Gewichte verschiedene Faktoren',
          'Berücksichtige deine Risikotoleranz',
          'Dokumentiere deine Bewertung'
        ],
        checkpoints: [
          'Jedes Contract hat ein Risk Profile',
          'Du kannst die Unterschiede erklären',
          'Du hast eine Präferenz'
        ]
      },
      {
        title: 'Entscheidung treffen',
        description: 'Basierend auf allen Daten: Welches Contract hat die "beste Nachbarschaft"?',
        tips: [
          'Nutze deine Vergleichstabelle',
          'Gewichte deine Prioritäten',
          'Vertraue den Daten, nicht dem Hype',
          'Dokumentiere deine Entscheidung'
        ],
        conclusion: 'Du hast jetzt einen datenbasierten Vergleich und kannst die beste Investment-Entscheidung treffen!'
      }
    ]
  }
};
