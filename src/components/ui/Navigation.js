import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">
          <span className="brand-icon">📡</span>
          <span className="brand-text">Crypto Radar</span>
        </Link>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link to="/" className="nav-link">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </Link>
        </li>
        
        {currentUser ? (
          <>
            <li>
              <Link to="/radar" className="nav-link">
                <span className="nav-icon">📊</span>
                <span className="nav-text">Radar</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="nav-link">
                <span className="nav-icon">📈</span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/account" className="nav-link">
                <span className="nav-icon">👤</span>
                <span className="nav-text">Account</span>
              </Link>
            </li>
            <li>
              <button onClick={logout} className="nav-link logout-btn">
                <span className="nav-icon">🚪</span>
                <span className="nav-text">Logout</span>
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="nav-link">
                <span className="nav-icon">🔑</span>
                <span className="nav-text">Login</span>
              </Link>
            </li>
            <li>
              <Link to="/register" className="nav-link">
                <span className="nav-icon">📝</span>
                <span className="nav-text">Register</span>
              </Link>
            </li>
          </>
        )}
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
