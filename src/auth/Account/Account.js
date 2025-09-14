import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './Account.css';

export default function Account() {
  const { currentUser, logout } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserDetails(data);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <div className="account-loading">Loading account details...</div>;
  }

  return (
    <div className="account-container">
      <div className="account-card">
        <h2>My Account</h2>
        <div className="account-info">
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span className="info-value">{userDetails?.name || currentUser?.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{userDetails?.email || currentUser?.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Member Since:</span>
            <span className="info-value">
              {userDetails?.createdAt 
                ? new Date(userDetails.createdAt).toLocaleDateString() 
                : 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="account-actions">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
