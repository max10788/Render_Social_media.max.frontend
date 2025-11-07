import React from 'react';
import './RecentActivity.css';

const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="activity-empty">
        <div className="empty-icon">📋</div>
        <p className="empty-text">No recent activity</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    const iconMap = {
      tool: '🔧',
      watchlist: '⭐',
      comparison: '⚖️',
      scan: '🔍',
      analysis: '📊',
      alert: '🔔',
      export: '📤',
      import: '📥'
    };
    return iconMap[type] || '📌';
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="recent-activity">
      {activities.map(activity => (
        <div key={activity.id} className="activity-item">
          <div className="activity-icon">
            {getActivityIcon(activity.type)}
          </div>
          <div className="activity-content">
            <div className="activity-message">{activity.message}</div>
            <div className="activity-time">{formatTimestamp(activity.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
