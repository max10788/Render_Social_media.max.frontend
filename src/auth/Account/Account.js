import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './Account.css';

export default function Account() {
  const { currentUser, logout } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        // Später: API-Aufruf mit Token
        // Für jetzt simulieren wir Benutzerdaten
        setTimeout(() => {
          setUserDetails({
            id: '1',
            name: currentUser?.name || 'Demo User',
            email: currentUser?.email || 'demo@example.com',
            createdAt: '2023-01-15T00:00:00Z',
            plan: 'Premium',
            lastLogin: '2023-06-20T14:30:00Z',
            scanCount: 42
          });
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="account-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading account data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <div className="account-card">
        <div className="account-header">
          <h2>Account Terminal</h2>
          <div className="account-tabs">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button 
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
        </div>
        
        <div className="account-body">
          {activeTab === 'profile' && (
            <div className="account-section">
              <div className="profile-header">
                <div className="profile-avatar">
                  <span className="avatar-icon">👤</span>
                </div>
                <div className="profile-info">
                  <h3>{userDetails?.name}</h3>
                  <p>{userDetails?.email}</p>
                  <div className="user-badge">{userDetails?.plan} User</div>
                </div>
              </div>
              
              <div className="account-details">
                <div className="detail-item">
                  <span className="detail-label">User ID</span>
                  <span className="detail-value">{userDetails?.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Member Since</span>
                  <span className="detail-value">
                    {userDetails?.createdAt 
                      ? new Date(userDetails.createdAt).toLocaleDateString() 
                      : 'Unknown'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Access</span>
                  <span className="detail-value">
                    {userDetails?.lastLogin 
                      ? new Date(userDetails.lastLogin).toLocaleString() 
                      : 'Unknown'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scan Count</span>
                  <span className="detail-value">{userDetails?.scanCount}</span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="account-section">
              <h3>Security Settings</h3>
              <div className="security-options">
                <div className="security-item">
                  <div className="security-info">
                    <h4>Change Access Code</h4>
                    <p>Update your password to keep your account secure</p>
                  </div>
                  <button className="secondary-button">Change</button>
                </div>
                
                <div className="security-item">
                  <div className="security-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <div className="toggle-switch">
                    <input type="checkbox" id="2fa" />
                    <label htmlFor="2fa"></label>
                  </div>
                </div>
                
                <div className="security-item">
                  <div className="security-info">
                    <h4>Login Sessions</h4>
                    <p>Manage your active login sessions</p>
                  </div>
                  <button className="secondary-button">View</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="account-section">
              <h3>System Preferences</h3>
              <div className="settings-options">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Notification Preferences</h4>
                    <p>Configure how you receive notifications</p>
                  </div>
                  <button className="secondary-button">Configure</button>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Data Export</h4>
                    <p>Download your account data</p>
                  </div>
                  <button className="secondary-button">Export</button>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Theme Settings</h4>
                    <p>Customize the appearance of the interface</p>
                  </div>
                  <button className="secondary-button">Customize</button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="account-footer">
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span>Terminate Session</span>
          </button>
        </div>
      </div>
      
      <div className="account-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
}
