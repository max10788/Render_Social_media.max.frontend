import React from 'react';
import PropTypes from 'prop-types';
import './StatsCard.css';

const StatsCard = ({ title, value, change, format = 'number' }) => {
  const formattedValue = format === 'currency' 
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : value.toLocaleString();

  return (
    <div className="stats-card">
      <h3 className="stats-title">{title}</h3>
      <div className="stats-value">{formattedValue}</div>
      {change !== undefined && (
        <div className={`stats-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  change: PropTypes.number,
  format: PropTypes.oneOf(['number', 'currency'])
};

export default StatsCard;
