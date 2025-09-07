import React from 'react';
import PropTypes from 'prop-types';
import './RecentTransactions.css';

const RecentTransactions = ({ transactions }) => {
  return (
    <div className="recent-transactions">
      <h3 className="transactions-title">Aktuelle Transaktionen</h3>
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="no-transactions">Keine Transaktionen verfügbar</div>
        ) : (
          transactions.map((tx, index) => (
            <div key={index} className="transaction-item">
              <div className="transaction-hash">
                {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
              </div>
              <div className="transaction-value">${tx.value.toLocaleString()}</div>
              <div className="transaction-time">
                {new Date(tx.timestamp).toLocaleTimeString('de-DE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

RecentTransactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.shape({
    hash: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  })).isRequired
};

export default RecentTransactions;
