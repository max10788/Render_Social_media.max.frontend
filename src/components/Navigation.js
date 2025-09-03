// src/components/Navigation.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">On-Chain Analytics</span>
        </Link>
      </div>
      
      <div className="nav-toggle" onClick={toggleMenu}>
        <span className={`nav-toggle-bar ${isMenuOpen ? 'open' : ''}`}></span>
        <span className={`nav-toggle-bar ${isMenuOpen ? 'open' : ''}`}></span>
        <span className={`nav-toggle-bar ${isMenuOpen ? 'open' : ''}`}></span>
      </div>
      
      <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">📊</span>
          <span className="nav-text">Dashboard</span>
        </Link>
        <Link to="/token-discovery" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Token Discovery</span>
        </Link>
        <Link to="/wallet-analysis" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">👛</span>
          <span className="nav-text">Wallet Analysis</span>
        </Link>
        <Link to="/contract-radar" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          <span className="nav-icon">📡</span>
          <span className="nav-text">Contract Radar</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
