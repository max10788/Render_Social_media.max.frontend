/**
 * CorrelationDisplay Component
 * 
 * Displays correlation analysis between CEX and DEX
 */
import React from 'react';
import './CorrelationDisplay.css';

const CorrelationDisplay = ({ correlation }) => {
  if (!correlation) return null;

  const getCorrelationColor = (score) => {
    if (score >= 0.7) return '#10b981'; // Green
    if (score >= 0.4) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getCorrelationLabel = (score) => {
    if (score >= 0.7) return 'Strong Correlation';
    if (score >= 0.4) return 'Moderate Correlation';
    return 'Weak Correlation';
  };

  const formatTime = (seconds) => {
    if (Math.abs(seconds) < 1) return 'Simultaneous';
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return `${absSeconds}s`;
    return `${Math.floor(absSeconds / 60)}m ${absSeconds % 60}s`;
  };

  const getLeaderInfo = () => {
    if (Math.abs(correlation.cex_led_by_seconds) < 1) {
      return {
        icon: '⚡',
        text: 'Simultaneous Movement',
        color: '#818cf8'
      };
    } else if (correlation.cex_led_by_seconds > 0) {
      return {
        icon: '🏦',
        text: `CEX Led by ${formatTime(correlation.cex_led_by_seconds)}`,
        color: '#3b82f6'
      };
    } else {
      return {
        icon: '🔗',
        text: `DEX Led by ${formatTime(-correlation.cex_led_by_seconds)}`,
        color: '#10b981'
      };
    }
  };

  const leaderInfo = getLeaderInfo();

  return (
    <div className="correlation-display">
      <div className="correlation-header">
        <h3>🔀 Cross-Exchange Correlation</h3>
      </div>

      <div className="correlation-content">
        {/* Overall Score */}
        <div className="correlation-score-section">
          <div className="score-label">Overall Correlation</div>
          <div 
            className="score-value"
            style={{ color: getCorrelationColor(correlation.score) }}
          >
            {(correlation.score * 100).toFixed(1)}%
          </div>
          <div className="score-description">
            {getCorrelationLabel(correlation.score)}
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

        {/* Metrics Grid */}
        <div className="correlation-metrics">
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-label">Volume Correlation</div>
              <div className="metric-value">
                {(correlation.volume_correlation * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-label">Timing Score</div>
              <div className="metric-value">
                {(correlation.timing_score * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="metric-card" style={{ borderColor: leaderInfo.color }}>
            <div className="metric-icon">{leaderInfo.icon}</div>
            <div className="metric-content">
              <div className="metric-label">Time Leader</div>
              <div className="metric-value" style={{ color: leaderInfo.color }}>
                {leaderInfo.text}
              </div>
            </div>
          </div>

          {correlation.pattern_score !== undefined && (
            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-label">Pattern Match</div>
                <div className="metric-value">
                  {(correlation.pattern_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pattern Matches */}
        {correlation.pattern_matches && correlation.pattern_matches.length > 0 && (
          <div className="pattern-matches-section">
            <h4>🎯 Pattern Matches ({correlation.pattern_matches.length})</h4>
            <div className="pattern-matches-grid">
              {correlation.pattern_matches.slice(0, 5).map((match, index) => (
                <div key={index} className="pattern-match-card">
                  <div className="match-header">
                    <span className="match-rank">#{index + 1}</span>
                    <span className={`match-type ${match.type}`}>
                      {match.type}
                    </span>
                    <span className="match-confidence">
                      {(match.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="match-content">
                    <div className="match-entity">
                      <span className="entity-label">CEX:</span>
                      <span className="entity-value">{match.cex_entity}</span>
                    </div>
                    <div className="match-divider">↔</div>
                    <div className="match-entity">
                      <span className="entity-label">DEX:</span>
                      <span className="entity-value" title={match.dex_wallet}>
                        {match.dex_wallet.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="match-footer">
                    <span className="match-stat">
                      Volume Diff: {match.volume_diff_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {correlation.pattern_matches.length > 5 && (
              <div className="pattern-matches-more">
                +{correlation.pattern_matches.length - 5} more matches
              </div>
            )}
          </div>
        )}

        {/* Conclusion */}
        <div className="correlation-conclusion">
          <div className="conclusion-icon">💡</div>
          <div className="conclusion-text">
            {correlation.conclusion}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationDisplay;
