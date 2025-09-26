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

  // Close mobile menu when clicking outside or on overlay
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navigation') && !event.target.closest('.nav-links')) {
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

  // Check if current route is active
  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = currentUser ? [
    { path: '/', icon: '🏠', text: 'Dashboard', label: 'Dashboard' },
    { path: '/radar', icon: '📡', text: 'Contract Radar', label: 'Contract Radar' },
    { path: '/tokens', icon: '💎', text: 'Token Overview', label: 'Token Overview' },
    { path: '/wallets', icon: '👛', text: 'Wallet Analysis', label: 'Wallet Analysis' },
    { path: '/network', icon: '🔗', text: 'Transaction Network', label: 'Transaction Network' }, // Neue Seite
    { path: '/account', icon: '👤', text: 'Account Settings', label: 'Account Settings' },
  ] : [
    { path: '/', icon: '🏠', text: 'Dashboard', label: 'Dashboard' },
    { path: '/login', icon: '🔑', text: 'Login', label: 'Login' },
    { path: '/register', icon: '📝', text: 'Register', label: 'Register' },
  ];

  return (
    <>
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

        {/* User Info Display (Desktop) */}
        {currentUser && (
          <div className="nav-user-desktop">
            <span className="user-welcome">Willkommen, {currentUser.email?.split('@')[0] || 'User'}</span>
          </div>
        )}

        {/* Menu Toggle Button */}
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

      {/* Overlay for mobile */}
      <div 
        className={`nav-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Side Menu */}
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
          {menuItems.map((item, index) => (
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

          {/* Divider */}
          {currentUser && <div className="nav-divider" aria-hidden="true"></div>}

          {/* User Area */}
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
        </nav>

        {/* Footer */}
        <div className="nav-menu-footer">
          <div className="nav-version">BlockIntel v1.0</div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
