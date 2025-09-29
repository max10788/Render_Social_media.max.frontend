import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Test account credentials
  const TEST_USER = {
    email: 'test@example.com',
    password: 'test123',
    userData: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      plan: 'Test Account',
      createdAt: '2025-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      scanCount: 0
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);

      // Frontend-only test account
      if (email === TEST_USER.email && password === TEST_USER.password) {
        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 600));
        // Save as if authenticated
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify(TEST_USER.userData));
        navigate('/dashboard');
        return;
      }

      // Normal login with backend
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-icon">📡</span>
            <span className="auth-title">Crypto Radar</span>
          </div>
          <h2>Access Terminal</h2>
          <p>Enter your credentials to access the system</p>
          {/* Test Account Info */}
          <div style={{marginTop: '10px', padding: '8px', backgroundColor: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem'}}>
            <span style={{ color: 'var(--primary-color)', marginBottom: '2px' }}><b>Testzugang:</b></span>
            <div style={{ color: 'var(--text-secondary)' }}>
              E-Mail: <b>test@example.com</b><br />
              Passwort: <b>test123</b>
            </div>
          </div>
        </div>
        
        <div className="auth-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Access Code</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-password">
                Forgot access code?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                'Access System'
              )}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Request Access</Link></p>
        </div>
      </div>
      
      <div className="auth-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
}
