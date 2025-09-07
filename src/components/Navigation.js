import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">CryptoTracker</Link>
        </div>
        
        <ul className="nav-menu">
          <li className={`nav-item ${isActive('/')}`}>
            <Link to="/">Dashboard</Link>
          </li>
          <li className={`nav-item ${isActive('/tokens')}`}>
            <Link to="/tokens">Token Discovery</Link>
          </li>
          <li className={`nav-item ${isActive('/wallets')}`}>
            <Link to="/wallets">Wallet Analysis</Link>
          </li>
          <li className={`nav-item ${isActive('/contracts')}`}>
            <Link to="/contracts">Contract Radar</Link>
          </li>
        </ul>
        
        <div className="nav-user">
          {/* User profile or login button would go here */}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
