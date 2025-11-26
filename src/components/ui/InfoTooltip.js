import React, { useState } from 'react';

const GLOSSARY = {
  'impact_score': {
    term: 'Impact Score',
    simple: 'Einfluss-Bewertung',
    explain: 'Zeigt wie stark eine Wallet den Preis bewegt hat (0-100%). Je höher, desto größer der Einfluss auf den Kurs.',
    example: '85% = Diese Wallet hat 85% der Preisbewegung verursacht'
  },
  'whale': {
    term: 'Whale',
    simple: 'Großinvestor',
    explain: 'Wallet mit sehr großem Handelsvolumen. "Wale" können Märkte stark beeinflussen.',
    example: 'Handel mit >$100.000 pro Trade'
  },
  'market_maker': {
    term: 'Market Maker',
    simple: 'Liquiditäts-Anbieter',
    explain: 'Professionelle Händler die ständig kaufen und verkaufen, um den Markt flüssig zu halten.',
    example: 'Sorgen für stabile Preise durch viele kleine Trades'
  },
  'bot': {
    term: 'Trading Bot',
    simple: 'Automatischer Händler',
    explain: 'Computerprogramm das automatisch handelt. Reagiert sehr schnell auf Preisänderungen.',
    example: 'Macht 100+ Trades pro Minute'
  },
  'correlation': {
    term: 'Correlation',
    simple: 'Zusammenhang',
    explain: 'Zeigt ob CEX und DEX gleichzeitig reagieren. Hohe Korrelation = ähnliche Bewegungen.',
    example: '85% = Beide Börsen bewegen sich sehr ähnlich'
  },
  'volume': {
    term: 'Volume',
    simple: 'Handelsvolumen',
    explain: 'Wie viel Geld in diesem Zeitraum gehandelt wurde.',
    example: '$50,000 = 50.000 Dollar wurden umgesetzt'
  },
  'candle': {
    term: 'Candlestick',
    simple: 'Kurskerze',
    explain: 'Zeigt Preisbewegung in einem Zeitfenster: Grün = Preis gestiegen, Rot = Preis gefallen.',
    example: '5m Kerze = Alle 5 Minuten eine neue Kerze'
  },
  'dex': {
    term: 'DEX',
    simple: 'Dezentrale Börse',
    explain: 'Krypto-Börse ohne Mittelmann. Handel direkt zwischen Wallets auf der Blockchain.',
    example: 'Jupiter, Raydium (auf Solana)'
  },
  'cex': {
    term: 'CEX',
    simple: 'Zentrale Börse',
    explain: 'Klassische Krypto-Börse mit Firma im Hintergrund. Handel über Plattform-Konten.',
    example: 'Binance, Bitget, Kraken'
  },
  'wallet': {
    term: 'Wallet',
    simple: 'Krypto-Geldbörse',
    explain: 'Adresse auf der Blockchain die Kryptowährungen besitzt. Wie eine Kontonummer.',
    example: '9xQe...k7F2 (Solana Adresse)'
  },
  'timeframe': {
    term: 'Timeframe',
    simple: 'Zeitfenster',
    explain: 'Zeitspanne pro Kerze. 5m = jede Kerze zeigt 5 Minuten, 1h = eine Stunde.',
    example: '5m für schnelle Bewegungen, 4h für Trends'
  },
  'hybrid': {
    term: 'Hybrid Analysis',
    simple: 'Vergleichsanalyse',
    explain: 'Vergleicht CEX und DEX gleichzeitig um zu sehen ob dieselben Akteure handeln.',
    example: 'Findet Muster die auf beiden Börsen erscheinen'
  }
};

const InfoTooltip = ({ term, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const info = GLOSSARY[term];
  
  if (!info) return null;

  return (
    <span className="info-tooltip-wrapper">
      <button
        className="info-icon-btn"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        aria-label={`Info zu ${info.term}`}
      >
        ℹ️
      </button>
      {show && (
        <div className={`info-tooltip-box ${position}`}>
          <div className="tooltip-header">
            <strong>{info.term}</strong>
            <span className="tooltip-simple">({info.simple})</span>
          </div>
          <p className="tooltip-explain">{info.explain}</p>
          <div className="tooltip-example">
            <strong>💡 Beispiel:</strong> {info.example}
          </div>
        </div>
      )}
      <style jsx>{`
        .info-tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          margin-left: 4px;
        }

        .info-icon-btn {
          background: transparent;
          border: none;
          font-size: 14px;
          cursor: help;
          padding: 2px;
          opacity: 0.6;
          transition: opacity 0.2s;
          line-height: 1;
        }

        .info-icon-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .info-tooltip-box {
          position: absolute;
          z-index: 10000;
          background: linear-gradient(145deg, #1a2332, #0f1419);
          border: 2px solid #0099ff;
          border-radius: 12px;
          padding: 16px;
          min-width: 280px;
          max-width: 350px;
          box-shadow: 0 8px 32px rgba(0, 153, 255, 0.3);
          animation: fadeIn 0.2s ease-out;
          font-size: 13px;
          line-height: 1.5;
        }

        .info-tooltip-box.top {
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }

        .info-tooltip-box.bottom {
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }

        .info-tooltip-box.left {
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }

        .info-tooltip-box.right {
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .tooltip-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 8px;
          color: #00e5ff;
          font-size: 14px;
        }

        .tooltip-simple {
          font-size: 12px;
          color: #8899a6;
          font-weight: normal;
        }

        .tooltip-explain {
          color: #e1e8ed;
          margin: 0 0 12px 0;
        }

        .tooltip-example {
          background: rgba(0, 153, 255, 0.1);
          border-left: 3px solid #0099ff;
          padding: 8px 12px;
          font-size: 12px;
          color: #a8d5e2;
          border-radius: 4px;
        }

        .tooltip-example strong {
          color: #00e5ff;
          display: block;
          margin-bottom: 4px;
        }

        @media (max-width: 768px) {
          .info-tooltip-box {
            min-width: 240px;
            max-width: 280px;
            font-size: 12px;
          }
        }
      `}</style>
    </span>
  );
};

// Export Komponente + Glossar für direkten Import
export { GLOSSARY };
export default InfoTooltip;
