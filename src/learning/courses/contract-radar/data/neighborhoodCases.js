export const neighborhoodCases = [
  {
    id: 1,
    scenario: 'Die Villa am See',
    address: '0xWhale1234...',
    description: 'Du siehst ein großes Anwesen mit Pool. Der Besitzer ist selten da, aber wenn, dann mit Limousine.',
    observations: [
      'Riesiges Grundstück (5% des Token Supplies)',
      'Auto wird nur 1x pro Monat bewegt',
      'Wenn er fährt, sind es immer große Strecken',
      'Parkplatz ist mit der Bank verbunden (Exchange Wallet)'
    ],
    walletData: {
      balance: '5,000,000 Tokens (5% Supply)',
      txCount: '12',
      firstSeen: '420 Tage',
      lastActive: '2 Tage',
      avgTxSize: '500,000 Tokens'
    },
    question: 'Was für ein Bewohner-Typ ist das?',
    options: [
      { id: 'whale', label: 'Villa-Besitzer (Whale)', icon: '🏰' },
      { id: 'hodler', label: 'Langzeitmieter (Hodler)', icon: '🏡' },
      { id: 'trader', label: 'Durchreisender (Trader)', icon: '🚗' }
    ],
    correct: 'whale',
    explanation: 'Perfekt! Das ist ein **Whale**: Riesige Holdings (5%), sehr wenige Bewegungen (12 Txns), große Transfer-Größen. Klassisches Whale-Verhalten!',
    tips: [
      'Achte auf das Verhältnis: Balance zu Transaktions-Anzahl',
      'Whales haben oft < 100 Transaktionen aber > 1% Supply',
      'Verbindungen zu Exchange Cold Wallets sind typisch'
    ]
  },
  {
    id: 2,
    scenario: 'Das gemütliche Reihenhaus',
    address: '0xHodler5678...',
    description: 'Eine Familie wohnt hier seit Jahren. Jeden Morgen das gleiche Ritual, sehr ruhig.',
    observations: [
      'Seit 2 Jahren in der Nachbarschaft',
      'Macht nur gelegentlich Einkäufe (Käufe)',
      'Verkauft nie etwas',
      'Mittlere Grundstücksgröße'
    ],
    walletData: {
      balance: '50,000 Tokens (0.05% Supply)',
      txCount: '8',
      firstSeen: '730 Tage',
      lastActive: '45 Tage',
      buys: '8',
      sells: '0'
    },
    question: 'Welcher Bewohner-Typ passt hier?',
    options: [
      { id: 'whale', label: 'Villa-Besitzer (Whale)', icon: '🏰' },
      { id: 'hodler', label: 'Langzeitmieter (Hodler)', icon: '🏡' },
      { id: 'mixer', label: 'Verdächtige Gestalt (Mixer)', icon: '🎭' }
    ],
    correct: 'hodler',
    explanation: 'Genau! Das ist ein **Hodler**: Sehr alt (730 Tage), nur Käufe, keine Verkäufe, mittlere Größe. Ein klassischer "Diamond Hands" Investor!',
    tips: [
      'Hodler haben meist ein hohes Wallet-Alter (> 365 Tage)',
      'Buy-to-Sell Ratio ist stark positiv',
      'Selten Interaktionen mit Exchanges'
    ]
  },
  {
    id: 3,
    scenario: 'Der Umzugswagen-Parkplatz',
    address: '0xTrader9999...',
    description: 'Ständig stehen hier Umzugswagen. Heute diese Person, morgen jemand anderes.',
    observations: [
      'Sehr hohe Aktivität (mehrmals täglich)',
      'Nutzt verschiedene "Routen" (Uniswap, Sushiswap, etc.)',
      'Manchmal voll, manchmal leer',
      'Schnelle Reaktionen auf Nachrichten'
    ],
    walletData: {
      balance: '2,500 Tokens (schwankend)',
      txCount: '342',
      firstSeen: '90 Tage',
      lastActive: '3 Stunden',
      avgHoldTime: '4 Tage',
      dexInteractions: '287'
    },
    question: 'Was ist das für ein Bewohner?',
    options: [
      { id: 'trader', label: 'Durchreisender (Trader)', icon: '🚗' },
      { id: 'hodler', label: 'Langzeitmieter (Hodler)', icon: '🏡' },
      { id: 'dust_sweeper', label: 'Paketbote (Dust Sweeper)', icon: '📦' }
    ],
    correct: 'trader',
    explanation: 'Richtig! Das ist ein **Trader**: Sehr viele Transaktionen (342), kurze Haltezeiten (4 Tage), viele DEX-Interaktionen. Ein aktiver Day-Trader!',
    tips: [
      'Trader haben > 100 Transaktionen',
      'Haltezeiten sind meist < 7 Tage',
      'Viele DEX-Interaktionen (Swaps) sind typisch'
    ]
  },
  {
    id: 4,
    scenario: 'Das Geisterhaus',
    address: '0xMixer6666...',
    description: 'Niemand weiß, wer hier wohnt. Nachts kommen dunkle Vans, die Fenster sind verhangen.',
    observations: [
      'Nutzt Umwege über "Waschstraßen" (Tornado Cash)',
      'Verteilt "Post" auf 30 verschiedene Briefkästen',
      'Fährt nur nachts (ungewöhnliche Zeiten)',
      'Komplexe, verschachtelte Routen'
    ],
    walletData: {
      balance: '10,000 Tokens',
      txCount: '156',
      firstSeen: '30 Tage',
      tornadoCashUsage: 'Ja',
      intermediateWallets: '45',
      suspiciousConnections: '3'
    },
    question: 'Welcher Typ ist das?',
    options: [
      { id: 'mixer', label: 'Verdächtige Gestalt (Mixer)', icon: '🎭' },
      { id: 'trader', label: 'Durchreisender (Trader)', icon: '🚗' },
      { id: 'whale', label: 'Villa-Besitzer (Whale)', icon: '🏰' }
    ],
    correct: 'mixer',
    explanation: 'Genau! Das ist ein **Mixer**: Tornado Cash Usage, viele Intermediate Wallets (45!), verdächtige Verbindungen. Höchste Vorsicht geboten!',
    tips: [
      'Privacy-Tool-Usage ist das stärkste Signal',
      'Viele Intermediate Wallets (> 10) sind verdächtig',
      'Verbindungen zu bekannten Scam-Adressen → sofort kritisch'
    ]
  },
  {
    id: 5,
    scenario: 'Die DHL-Station',
    address: '0xDustBot1111...',
    description: 'Hier werden ständig kleine Pakete abgeholt und abgegeben. Ein ständiges Kommen und Gehen.',
    observations: [
      'Tausende von kleinen Bewegungen',
      'Immer die gleichen Zeiten (automatisiert)',
      'Sehr kleine Beträge pro Bewegung',
      'Verbindungen zu hunderten Adressen'
    ],
    walletData: {
      balance: '150 Tokens',
      txCount: '2,847',
      firstSeen: '180 Tage',
      avgTxValue: '$2.50',
      uniqueAddresses: '892',
      pattern: 'Regelmäßig (jede Stunde)'
    },
    question: 'Was ist das?',
    options: [
      { id: 'dust_sweeper', label: 'Paketbote (Dust Sweeper)', icon: '📦' },
      { id: 'trader', label: 'Durchreisender (Trader)', icon: '🚗' },
      { id: 'mixer', label: 'Verdächtige Gestalt (Mixer)', icon: '🎭' }
    ],
    correct: 'dust_sweeper',
    explanation: 'Perfekt! Das ist ein **Dust Sweeper**: Sehr viele Transaktionen (2847!), sehr kleine Beträge ($2.50), regelmäßige Muster. Wahrscheinlich ein Bot!',
    tips: [
      'Dust Sweeper haben > 1000 Transaktionen',
      'Sehr kleine Beträge (< $10) sind typisch',
      'Zeitliche Regelmäßigkeit deutet auf Bots hin'
    ]
  }
];
