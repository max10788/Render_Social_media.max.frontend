// path: src/components/ui/Navigation.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Handle menu interactions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.nav-sidebar') && !event.target.closest('.nav-toggle')) {
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

  // Navigation structure organized by category
  const navigationGroups = [
    {
      title: 'Analysis Tools',
      items: [
        { path: '/radar', icon: '📡', text: 'Contract Radar', label: 'Smart Contract Analysis' },
        { path: '/price-movers', icon: '💹', text: 'Price Impact', label: 'Wallet Price Impact' },
        { path: '/otc-analysis', icon: '🔄', text: 'OTC Flows', label: 'OTC Transaction Analysis' },
        { path: '/wallets', icon: '👛', text: 'Wallet Intelligence', label: 'Wallet Behavior Analysis' },
      ]
    },
    {
      title: 'Market Data',
      items: [
        { path: '/tokens', icon: '💎', text: 'Tokens', label: 'Token Overview' },
        { path: '/orderbook-heatmap', icon: '🔥', text: 'Orderbook', label: 'Orderbook Heatmap' },
        { path: '/iceberg-orders', icon: '🧊', text: 'Iceberg Orders', label: 'Hidden Order Detection' },
      ]
    },
    {
      title: 'Network',
      items: [
        { path: '/network', icon: '🕸️', text: 'Transaction Graph', label: 'Transaction Network' },
      ]
    }
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Brand */}
          <Link to="/" className="nav-brand" aria-label="BlockIntel - Home">
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
              <span className="brand-icon">📊</span>
              <span className="brand-text">BlockIntel</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-desktop-links">
            {currentUser && (
              <Link 
                to="/dashboard" 
                className={`nav-desktop-link ${isActiveRoute('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            )}
            <a href="#tools" className="nav-desktop-link">Tools</a>
            <a href="#learning" className="nav-desktop-link">Learn</a>
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="nav-action-btn primary">
                  Dashboard
                </Link>
                <button 
                  className="nav-toggle-desktop"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Open menu"
                  type="button"
                >
                  <span className="user-avatar-small">
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-action-btn secondary">
                  Sign In
                </Link>
                <Link to="/register" className="nav-action-btn primary">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className={`nav-toggle ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              type="button"
            >
              <span className="toggle-line"></span>
              <span className="toggle-line"></span>
              <span className="toggle-line"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div 
        className={`nav-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Menu */}
      <aside className={`nav-sidebar ${isMenuOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">📊</span>
            <span className="brand-text">BlockIntel</span>
          </div>
          <button 
            className="sidebar-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Quick Actions (Mobile) */}
        {!currentUser && (
          <div className="sidebar-quick-actions">
            <Link 
              to="/register" 
              className="quick-action-btn primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="quick-action-btn secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="sidebar-nav">
          {/* Main Links */}
          <div className="nav-group">
            <Link
              to="/"
              className={`nav-item ${isActiveRoute('/') && location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-item-icon">🏠</span>
              <span className="nav-item-text">Home</span>
            </Link>
            
            {currentUser && (
              <Link
                to="/dashboard"
                className={`nav-item ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-item-icon">📊</span>
                <span className="nav-item-text">Dashboard</span>
              </Link>
            )}
          </div>

          {/* Tool Groups */}
          {currentUser && navigationGroups.map((group, index) => (
            <div key={index} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                  title={item.label}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.text}</span>
                  {isActiveRoute(item.path) && (
                    <span className="nav-item-indicator" aria-hidden="true"></span>
                  )}
                </Link>
              ))}
            </div>
          ))}

          {/* Account Section */}
          {currentUser && (
            <div className="nav-group">
              <div className="nav-group-title">Account</div>
              <Link
                to="/account"
                className={`nav-item ${isActiveRoute('/account') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-item-icon">⚙️</span>
                <span className="nav-item-text">Settings</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="nav-item logout"
                type="button"
              >
                <span className="nav-item-icon">🚪</span>
                <span className="nav-item-text">Sign Out</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Info (if logged in) */}
        {currentUser && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {currentUser.email?.split('@')[0] || 'User'}
                </div>
                <div className="user-email">{currentUser.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box (if not logged in) */}
        {!currentUser && (
          <div className="sidebar-footer">
            <div className="info-box">
              <div className="info-icon">💡</div>
              <div className="info-text">
                <strong>Sign in</strong> to access professional analysis tools
              </div>
            </div>
          </div>
        )}

        {/* Version */}
        <div className="sidebar-version">BlockIntel v1.0</div>
      </aside>
    </>
  );
};

export default Navigation;
