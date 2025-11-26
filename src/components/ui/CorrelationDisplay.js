import React from 'react';
import InfoTooltip from './InfoTooltip';
import './CorrelationDisplay.css';

const CorrelationDisplay = ({ correlation }) => {
  if (!correlation) return null;

  const getCorrelationColor = (score) => {
    if (score >= 0.7) return '#10b981';
    if (score >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  const getCorrelationLabel = (score) => {
    if (score >= 0.7) return { label: 'Starke Korrelation', emoji: '✅', desc: 'CEX und DEX bewegen sich sehr ähnlich' };
    if (score >= 0.4) return { label: 'Mittlere Korrelation', emoji: '⚠️', desc: 'Teilweise ähnliche Bewegungen' };
    return { label: 'Schwache Korrelation', emoji: '❌', desc: 'Unterschiedliche Bewegungen' };
  };

  const formatTime = (seconds) => {
    if (Math.abs(seconds) < 1) return 'Gleichzeitig';
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return `${absSeconds}s`;
    return `${Math.floor(absSeconds / 60)}m ${absSeconds % 60}s`;
  };

  const getLeaderInfo = () => {
    if (Math.abs(correlation.cex_led_by_seconds) < 1) {
      return {
        icon: '⚡',
        text: 'Gleichzeitige Bewegung',
        subtext: 'Beide Börsen reagieren zur selben Zeit',
        color: '#818cf8'
      };
    } else if (correlation.cex_led_by_seconds > 0) {
      return {
        icon: '🏦',
        text: `CEX war ${formatTime(correlation.cex_led_by_seconds)} schneller`,
        subtext: 'Zentrale Börse hat zuerst reagiert',
        color: '#3b82f6'
      };
    } else {
      return {
        icon: '🔗',
        text: `DEX war ${formatTime(-correlation.cex_led_by_seconds)} schneller`,
        subtext: 'Dezentrale Börse hat zuerst reagiert',
        color: '#10b981'
      };
    }
  };

  const leaderInfo = getLeaderInfo();
  const corrInfo = getCorrelationLabel(correlation.score);

  return (
    <div className="correlation-display">
      {/* Erklärung oben */}
      <div className="correlation-explanation-banner">
        <div className="banner-icon">🔍</div>
        <div>
          <strong>Was ist Korrelation?</strong>
          <InfoTooltip term="correlation" />
          <p>Vergleicht ob CEX und DEX zur gleichen Zeit ähnlich reagieren. Hohe Werte bedeuten: Dieselben Händler sind wahrscheinlich auf beiden Börsen aktiv.</p>
        </div>
      </div>

      <div className="correlation-header">
        <h3>🔀 Börsen-Vergleich (CEX ↔ DEX)</h3>
      </div>

      <div className="correlation-content">
        {/* Overall Score - Vereinfacht */}
        <div className="correlation-score-section">
          <div className="score-label">
            Gesamt-Korrelation
            <InfoTooltip term="correlation" position="bottom" />
          </div>
          <div 
            className="score-value"
            style={{ color: getCorrelationColor(correlation.score) }}
          >
            {corrInfo.emoji} {(correlation.score * 100).toFixed(0)}%
          </div>
          <div className="score-description">
            {corrInfo.label}
          </div>
          <div className="score-subdesc">
            {corrInfo.desc}
          </div>
          
          <div className="score-bar">
            <div 
              className="score-fill"
              style={{ 
                width: `${correlation.score * 100}%`,
                background: getCorrelationColor(correlation.score)
              }}
            />
          </div>
        </div>

        {/* Metrics Grid - Vereinfacht */}
        <div className="correlation-metrics">
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-label">
                Volumen-Ähnlichkeit
                <InfoTooltip term="volume" position="top" />
              </div>
              <div className="metric-value">
                {(correlation.volume_correlation * 100).toFixed(0)}%
              </div>
              <div className="metric-explain">
                Wie ähnlich das Handelsvolumen ist
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-label">
                Zeitliche Übereinstimmung
                <InfoTooltip term="timeframe" position="top" />
              </div>
              <div className="metric-value">
                {(correlation.timing_score * 100).toFixed(0)}%
              </div>
              <div className="metric-explain">
                Wie synchron die Bewegungen sind
              </div>
            </div>
          </div>

          <div className="metric-card metric-leader" style={{ borderColor: leaderInfo.color }}>
            <div className="metric-icon">{leaderInfo.icon}</div>
            <div className="metric-content">
              <div className="metric-label">Wer war schneller?</div>
              <div className="metric-value" style={{ color: leaderInfo.color }}>
                {leaderInfo.text}
              </div>
              <div className="metric-explain">
                {leaderInfo.subtext}
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Matches - Vereinfacht */}
        {correlation.pattern_matches && correlation.pattern_matches.length > 0 && (
          <div className="pattern-matches-section">
            <h4>
              🎯 Gefundene Übereinstimmungen ({correlation.pattern_matches.length})
              <InfoTooltip term="hybrid" position="right" />
            </h4>
            <p className="pattern-explain">
              Diese Händler-Muster wurden auf beiden Börsen gefunden - wahrscheinlich dieselbe Person/Organisation:
            </p>
            <div className="pattern-matches-grid">
              {correlation.pattern_matches.slice(0, 3).map((match, index) => (
                <div key={index} className="pattern-match-card">
                  <div className="match-header">
                    <span className="match-rank">#{index + 1}</span>
                    <span className={`match-type ${match.type}`}>
                      {match.type === 'whale' && '🐋 Whale'}
                      {match.type === 'bot' && '🤖 Bot'}
                      {match.type === 'market_maker' && '💼 Market Maker'}
                      <InfoTooltip term={match.type} />
                    </span>
                    <span className="match-confidence-badge">
                      {(match.confidence * 100).toFixed(0)}% sicher
                    </span>
                  </div>
                  <div className="match-content">
                    <div className="match-entity">
                      <span className="entity-label">🏦 CEX Muster:</span>
                      <span className="entity-value">{match.cex_entity}</span>
                    </div>
                    <div className="match-arrow">⇄</div>
                    <div className="match-entity">
                      <span className="entity-label">🔗 DEX Wallet:</span>
                      <span className="entity-value" title={match.dex_wallet}>
                        {match.dex_wallet.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                  <div className="match-footer">
                    <span className="match-stat">
                      Volumen-Unterschied: {Math.abs(match.volume_diff_pct).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {correlation.pattern_matches.length > 3 && (
              <div className="pattern-matches-more">
                +{correlation.pattern_matches.length - 3} weitere Übereinstimmungen gefunden
              </div>
            )}
          </div>
        )}

        {/* Conclusion - Verständlicher */}
        <div className="correlation-conclusion">
          <div className="conclusion-icon">💡</div>
          <div className="conclusion-content">
            <strong>Zusammenfassung:</strong>
            <p>{correlation.conclusion}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .correlation-explanation-banner {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          gap: 12px;
          align-items: start;
        }

        .banner-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .correlation-explanation-banner strong {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3b82f6;
          font-size: 15px;
          margin-bottom: 8px;
        }

        .correlation-explanation-banner p {
          margin: 0;
          font-size: 13px;
          color: #e1e8ed;
          line-height: 1.6;
        }

        .score-subdesc {
          font-size: 13px;
          color: #8899a6;
          margin-top: 4px;
          margin-bottom: 12px;
        }

        .metric-explain {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          line-height: 1.4;
        }

        .metric-leader {
          grid-column: 1 / -1;
          background: rgba(59, 130, 246, 0.05);
        }

        .pattern-explain {
          font-size: 13px;
          color: #8899a6;
          margin: 0 0 16px 0;
          line-height: 1.6;
        }

        .match-confidence-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .match-arrow {
          font-size: 20px;
          color: #4b5563;
          flex-shrink: 0;
        }

        .conclusion-content {
          flex: 1;
        }

        .conclusion-content strong {
          display: block;
          color: #3b82f6;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .conclusion-content p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default CorrelationDisplay;
