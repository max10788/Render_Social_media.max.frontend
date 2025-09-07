mport React from 'react';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <a href="/">
          <span className="brand-icon">📡</span>
          <span className="brand-text">Crypto Radar</span>
        </a>
      </div>
      <ul className="nav-links">
        <li>
          <a href="/" className="nav-link">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </a>
        </li>
        <li>
          <a href="/radar" className="nav-link">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Radar</span>
          </a>
        </li>
        <li>
          <a href="/dashboard" className="nav-link">
            <span className="nav-icon">📈</span>
            <span className="nav-text">Dashboard</span>
          </a>
        </li>
      </ul>
      <div className="nav-toggle">
        <span className="nav-toggle-bar"></span>
        <span className="nav-toggle-bar"></span>
        <span className="nav-toggle-bar"></span>
      </div>
    </nav>
  );
};

export default Navigation;
