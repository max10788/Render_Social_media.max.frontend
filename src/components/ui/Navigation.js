import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.nav-links') && !event.target.closest('.nav-toggle')) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const mainPages = [
    { path: '/', icon: '🏠', text: 'Home', label: 'Home' },
    ...(currentUser ? [{ path: '/dashboard', icon: '📊', text: 'Dashboard', label: 'Dashboard' }] : []),
    { path: '/radar', icon: '📡', text: 'Contract Radar', label: 'Contract Radar' },
    { path: '/tokens', icon: '💎', text: 'Token Overview', label: 'Token Overview' },
    { path: '/wallets', icon: '👛', text: 'Wallet Analysis', label: 'Wallet Analysis' },
    { path: '/network', icon: '🕸️', text: 'Transaction Network', label: 'Transaction Network' },
    { path: '/price-movers', icon: '📈', text: 'Price Movers', label: 'Price Movers' },
  ];

  const accountPages = currentUser ? [
    { path: '/account', icon: '👤', text: 'Account Settings', label: 'Account Settings' },
  ] : [];

  const authPages = !currentUser ? [
    { path: '/login', icon: '🔑', text: 'Login', label: 'Login' },
    { path: '/register', icon: '📝', text: 'Register', label: 'Register' },
  ] : [];

  return (
    <>
      <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
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

        <button 
          className={`nav-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={isMenuOpen}
          aria-controls="nav-links"
          type="button"
        >
          <span className="nav-toggle-bar" aria-hidden="true"></span>
          <span className="nav-toggle-bar" aria-hidden="true"></span>
          <span className="nav-toggle-bar" aria-hidden="true"></span>
        </button>
      </nav>

      <div 
        className={`nav-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`nav-links ${isMenuOpen ? 'open' : ''}`} role="navigation" id="nav-links">
        <div className="nav-menu-header">
          <h2 className="nav-menu-title">Navigation</h2>
          <button 
            className="nav-close-btn"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Menü schließen"
            type="button"
          >
            ✕
          </button>
        </div>

        <nav className="nav-menu-content" role="menubar">
          {mainPages.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
              role="menuitem"
              aria-current={isActiveRoute(item.path) ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <span className="nav-icon" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span className="nav-text">{item.text}</span>
              {isActiveRoute(item.path) && (
                <span className="nav-indicator" aria-hidden="true"></span>
              )}
            </Link>
          ))}

          <div className="nav-divider" aria-hidden="true"></div>

          {accountPages.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
              role="menuitem"
              aria-current={isActiveRoute(item.path) ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <span className="nav-icon" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span className="nav-text">{item.text}</span>
              {isActiveRoute(item.path) && (
                <span className="nav-indicator" aria-hidden="true"></span>
              )}
            </Link>
          ))}

          {authPages.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
              role="menuitem"
              aria-current={isActiveRoute(item.path) ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <span className="nav-icon" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span className="nav-text">{item.text}</span>
              {isActiveRoute(item.path) && (
                <span className="nav-indicator" aria-hidden="true"></span>
              )}
            </Link>
          ))}

          {currentUser && (
            <div className="nav-user-area">
              <div className="nav-user-info">
                <div className="user-avatar" aria-hidden="true">
                  {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {currentUser.email?.split('@')[0] || 'Benutzer'}
                  </div>
                  <div className="user-email">{currentUser.email}</div>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="nav-link logout-btn"
                role="menuitem"
                aria-label="Abmelden"
                tabIndex={isMenuOpen ? 0 : -1}
                type="button"
              >
                <span className="nav-icon" role="img" aria-label="Abmelden">🚪</span>
                <span className="nav-text">Abmelden</span>
              </button>
            </div>
          )}

          {!currentUser && (
            <div className="nav-info-box">
              <p className="nav-info-text">
                💡 Melde dich an, um alle Funktionen zu nutzen
              </p>
            </div>
          )}
        </nav>

        <div className="nav-menu-footer">
          <div className="nav-version">BlockIntel v1.0</div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
