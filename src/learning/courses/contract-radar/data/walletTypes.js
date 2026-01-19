export const walletTypes = [
  {
    id: 'whale',
    name: 'Whale',
    icon: '🏰',
    neighborhood: 'Villa-Besitzer',
    color: '#818cf8',
    description: 'Große Holdings, selten aktiv, aber wenn dann mit großen Bewegungen.',
    characteristics: [
      'Besitzt mehrere "Villen" (große Token-Mengen)',
      'Selten gesehen, aber wenn dann auffällig',
      'Bewegt sich meist zwischen eigenen Grundstücken',
      'Hoher Einfluss auf die Nachbarschaft'
    ],
    onChainSignals: [
      'Balance > 1% des Total Supply',
      'Wenige Transaktionen (< 50)',
      'Große Transfer-Größen',
      'Oft von/zu Exchange Cold Wallets'
    ],
    example: 'Ein Investor mit 5% des Token-Supplies, der seit Monaten nichts bewegt hat.',
    riskLevel: 'medium',
    riskReason: 'Whale-Dumps können den Markt crashen'
  },
  {
    id: 'hodler',
    name: 'Hodler',
    icon: '🏡',
    neighborhood: 'Langzeitmieter',
    color: '#10b981',
    description: 'Wohnt seit Jahren hier, kennt die Nachbarschaft in- und auswendig.',
    characteristics: [
      'Seit langer Zeit in der Nachbarschaft (Wallet-Alter > 1 Jahr)',
      'Feste Routine, wenig Bewegung',
      'Manchmal kleine Einkäufe (Accumulation)',
      'Verkauft fast nie'
    ],
    onChainSignals: [
      'First Transaction > 365 Tage alt',
      'Wenige Outgoing Transfers',
      'Durchschnittliche Holdings',
      'Keine Exchange-Interaktionen'
    ],
    example: 'Wallet hat Token seit 2 Jahren, nur 3 Käufe, 0 Verkäufe.',
    riskLevel: 'low',
    riskReason: 'Stabile, langfristige Investoren'
  },
  {
    id: 'trader',
    name: 'Trader',
    icon: '🚗',
    neighborhood: 'Durchreisende',
    color: '#f59e0b',
    description: 'Ständig in Bewegung, heute hier, morgen dort.',
    characteristics: [
      'Zieht alle paar Tage "um" (kauft/verkauft)',
      'Schnelle Reaktionen auf Marktbewegungen',
      'Nutzt verschiedene "Routen" (DEXes/CEXes)',
      'Kleine bis mittlere Positionen'
    ],
    onChainSignals: [
      'Hohe Transaktions-Frequenz (> 100 Txns)',
      'Viele DEX-Interaktionen',
      'Kurze Haltezeiten (< 7 Tage)',
      'Wechselnde Token-Portfolios'
    ],
    example: 'Wallet hat in den letzten 24h 15 Trades gemacht, 8 verschiedene Token.',
    riskLevel: 'medium',
    riskReason: 'Kann Volatilität erzeugen, aber auch Liquidität bringen'
  },
  {
    id: 'mixer',
    name: 'Mixer',
    icon: '🎭',
    neighborhood: 'Verdächtige Gestalten',
    color: '#ef4444',
    description: 'Wechselt ständig die Identität, nutzt obskure Pfade.',
    characteristics: [
      'Nutzt "Tarnkappen" (Tornado Cash, Mixer)',
      'Sehr komplexe Bewegungsmuster',
      'Viele Zwischenstationen',
      'Oft nachts aktiv (ungewöhnliche Zeiten)'
    ],
    onChainSignals: [
      'Tornado Cash / Privacy Protocol Usage',
      'Viele Intermediate Wallets',
      'Ungewöhnliche Gas-Prices',
      'Verbindungen zu bekannten Scam-Adressen'
    ],
    example: 'Wallet erhält Token von Tornado Cash, verteilt sie auf 20 neue Wallets.',
    riskLevel: 'critical',
    riskReason: 'Mögliche Geldwäsche oder Scam-Aktivitäten'
  },
  {
    id: 'dust_sweeper',
    name: 'Dust Sweeper',
    icon: '📦',
    neighborhood: 'Paketboten',
    color: '#64748b',
    description: 'Macht viele kleine Bewegungen, sammelt "Pakete" ein.',
    characteristics: [
      'Sehr viele kleine Transaktionen',
      'Sammelt "Staub" von verschiedenen Adressen',
      'Oft automatisiert (Bots)',
      'Geringer Wert pro Bewegung'
    ],
    onChainSignals: [
      'Sehr hohe Tx-Count (> 1000)',
      'Sehr kleine Beträge (< $10)',
      'Regelmäßige Muster (zeitlich)',
      'Oft zu/von vielen verschiedenen Adressen'
    ],
    example: 'Wallet hat 2000 Transaktionen, jede im Wert von $0.10 - $5.',
    riskLevel: 'low',
    riskReason: 'Meist harmlos, aber kann Spam/Phishing sein'
  }
];

export const getWalletTypeById = (id) => {
  return walletTypes.find(type => type.id === id);
};

export const getWalletTypeByName = (name) => {
  return walletTypes.find(type => type.name.toLowerCase() === name.toLowerCase());
};
