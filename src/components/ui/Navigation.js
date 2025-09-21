import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect for navigation shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navigation')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check if current route is active
  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      {/* Brand/Logo Section */}
      <div className="nav-brand">
        <Link to="/" aria-label="BlockIntel - Home">
          <img 
            src="/logo-blockintel.png" 
            alt="BlockIntel" 
            className="brand-logo"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="brand-fallback" style={{ display: 'none' }}>
            <span className="brand-icon" role="img" aria-label="BlockIntel">🏠</span>
            <span className="brand-text">BlockIntel</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`} role="menubar">
        <li role="none">
          <Link 
            to="/" 
            className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
            role="menuitem"
            aria-current={isActiveRoute('/') ? 'page' : undefined}
          >
            <span className="nav-icon" role="img" aria-label="Home">🏠</span>
            <span className="nav-text">Dashboard</span>
          </Link>
        </li>

        {currentUser ? (
          <>
            <li role="none">
              <Link 
                to="/radar" 
                className={`nav-link ${isActiveRoute('/radar') ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActiveRoute('/radar') ? 'page' : undefined}
              >
                <span className="nav-icon" role="img" aria-label="Radar">📡</span>
                <span className="nav-text">Contract Radar</span>
              </Link>
            </li>

            <li role="none">
              <Link 
                to="/tokens" 
                className={`nav-link ${isActiveRoute('/tokens') ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActiveRoute('/tokens') ? 'page' : undefined}
              >
                <span className="nav-icon" role="img" aria-label="Tokens">💎</span>
                <span className="nav-text">Token Overview</span>
              </Link>
            </li>

            <li role="none">
              <Link 
                to="/wallets" 
                className={`nav-link ${isActiveRoute('/wallets') ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActiveRoute('/wallets') ? 'page' : undefined}
              >
                <span className="nav-icon" role="img" aria-label="Wallets">👛</span>
                <span className="nav-text">Wallet Analysis</span>
              </Link>
            </li>

            <li role="none">
              <Link 
                to="/account" 
                className={`nav-link ${isActiveRoute('/account') ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActiveRoute('/account') ? 'page' : undefined}
              >
                <span className="nav-icon" role="img" aria-label="Account">👤</span>
                <span className="nav-text">Account</span>
              </Link>
            </li>

            <li role="none">
              <button 
                onClick={handleLogout} 
                className="nav-link logout-btn"
                role="menuitem"
                aria-label="Logout from account"
              >
                <span className="nav-icon" role="img" aria-label="Logout">🚪</span>
                <span className="nav-text">Logout</span>
              </button>
            </li>
          </>
        ) : (
          <>
            <li role="none">
              <Link 
                to="/login" 
                className={`nav-link ${isActiveRoute('/login') ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActiveRoute('/login') ? 'page' : undefined}
              >
                <span className="nav-icon" role="img" aria-label="Login">🔑</span>
                <span className="nav-text">Login</span>
              </Link>
            </li>

            <li role="none">
              <Link 
                to="/register" 
                className={`nav-link ${isActiveRoute('/register') ? 'active' : ''}`}
                role="menuitem"
                aria-current={isActiveRoute('/register') ? 'page' : undefined}
              >
                <span className="nav-icon" role="img" aria-label="Register">📝</span>
                <span className="nav-text">Register</span>
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* User Area (Desktop) */}
      <div className="nav-user-area">
        {currentUser && (
          <span className="nav-user-info">
            Welcome, {currentUser.email?.split('@')[0] || 'User'}
          </span>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className={`nav-toggle ${isMenuOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="nav-links"
      >
        <span className="nav-toggle-bar"></span>
        <span className="nav-toggle-bar"></span>
        <span className="nav-toggle-bar"></span>
      </button>
    </nav>
  );
};

export default Navigation;
