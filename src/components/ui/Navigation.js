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

  // Alle Haupt-Seiten (immer sichtbar, unabhängig vom Login-Status)
  const mainPages = [
    { path: '/', icon: '🏠', text: 'Dashboard', label: 'Dashboard' },
    { path: '/radar', icon: '📡', text: 'Contract Radar', label: 'Contract Radar' },
    { path: '/tokens', icon: '💎', text: 'Token Overview', label: 'Token Overview' },
    { path: '/wallets', icon: '👛', text: 'Wallet Analysis', label: 'Wallet Analysis' },
    { path: '/network', icon: '🕸️', text: 'Transaction Network', label: 'Transaction Network' },
  ];

  // Account-Seiten (nur wenn angemeldet)
  const accountPages = currentUser ? [
    { path: '/account', icon: '👤', text: 'Account Settings', label: 'Account Settings' },
  ] : [];

  // Auth-Seiten (nur wenn nicht angemeldet)
  const authPages = !currentUser ? [
    { path: '/login', icon: '🔑', text: 'Login', label: 'Login' },
    { path: '/register', icon: '📝', text: 'Register', label: 'Register' },
  ] : [];

  // Alle Menüpunkte kombinieren
  const menuItems = [...mainPages, ...accountPages, ...authPages];

  return (
    <>
      {/* Hamburger Button */}
      <button 
        className={`nav-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && <div className="nav-overlay" onClick={closeMenu}></div>}

      {/* Navigation Panel */}
      <nav className={`navigation ${isOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <h2>Navigation</h2>
          <button className="nav-close" onClick={closeMenu}>
            ✕
          </button>
        </div>

        <div className="nav-content">
          {/* Haupt-Navigation */}
          <div className="nav-section">
            <h3>Seiten</h3>
            <ul className="nav-list">
              {allPages.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Auth Sektion */}
          <div className="nav-section auth-section">
            <h3>{user ? 'Account' : 'Anmeldung'}</h3>
            <ul className="nav-list">
              {authPages.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
              
              {/* Logout Button nur wenn angemeldet */}
              {user && (
                <li>
                  <button
                    className="nav-item logout-btn"
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                  >
                    <span className="nav-icon">🚪</span>
                    <span className="nav-label">Logout</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* User Info wenn angemeldet */}
          {user && (
            <div className="nav-section user-info">
              <div className="user-badge">
                <span className="user-avatar">{user.email?.[0]?.toUpperCase() || '?'}</span>
                <div className="user-details">
                  <p className="user-email">{user.email}</p>
                  <p className="user-status">Angemeldet</p>
                </div>
              </div>
            </div>
          )}

          {/* Info wenn nicht angemeldet */}
          {!user && (
            <div className="nav-section info-section">
              <div className="info-box">
                <p>📌 Einige Funktionen erfordern eine Anmeldung</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="nav-footer">
          <p>BlockIntel v1.0</p>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
