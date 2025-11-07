import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardTabView.css';

const DashboardTabView = ({ 
  tabs, 
  selectedTab, 
  onSelectTab, 
  onCloseTab,
  addToWatchlist,
  addToComparison,
  addActivity
}) => {
  if (tabs.length === 0) {
    return null;
  }

  const activeTab = tabs.find(t => t.id === selectedTab);

  const getTabIcon = (toolName) => {
    const iconMap = {
      'Contract Radar': '📡',
      'Token Overview': '💎',
      'Price Movers': '💹',
      'Wallet Analysis': '👛',
      'Transaction Network': '🕸️',
      'Scan Jobs': '🔍'
    };
    return iconMap[toolName] || '🔧';
  };

  const renderTabContent = (tab) => {
    return (
      <div className="tab-content-container">
        <div className="tab-content-header">
          <h2 className="tab-content-title">
            <span className="tab-content-icon">{getTabIcon(tab.name)}</span>
            {tab.name}
          </h2>
          <div className="tab-content-actions">
            <Link 
              to={tab.path}
              className="btn-open-fullpage"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Open Full Page</span>
              <span className="btn-icon">↗</span>
            </Link>
          </div>
        </div>

        <div className="tab-content-body">
          <div className="tab-iframe-wrapper">
            <p className="tab-placeholder-text">
              This is a placeholder for the {tab.name} tool.
            </p>
            <p className="tab-placeholder-hint">
              Click "Open Full Page" above to use the full tool with all features.
            </p>
            
            {tab.data && (
              <div className="tab-data-preview">
                <h4>Session Data:</h4>
                <pre>{JSON.stringify(tab.data, null, 2)}</pre>
              </div>
            )}

            <div className="tab-quick-actions">
              <button 
                className="tab-action-btn"
                onClick={() => {
                  addToWatchlist({
                    id: `${tab.name}-${Date.now()}`,
                    type: 'tool',
                    name: tab.name,
                    icon: getTabIcon(tab.name)
                  });
                  addActivity('watchlist', `Added ${tab.name} to watchlist`);
                }}
              >
                ⭐ Add to Watchlist
              </button>
              <button 
                className="tab-action-btn"
                onClick={() => {
                  addToComparison({
                    id: `${tab.name}-${Date.now()}`,
                    type: 'tool',
                    name: tab.name,
                    icon: getTabIcon(tab.name)
                  });
                  addActivity('comparison', `Added ${tab.name} to comparison`);
                }}
              >
                ⚖️ Compare
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-tab-view">
      <div className="tab-navigation">
        <div className="tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${selectedTab === tab.id ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="tab-icon">{getTabIcon(tab.name)}</span>
              <span className="tab-label">{tab.name}</span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title="Close Tab"
              >
                ✕
              </button>
            </button>
          ))}
        </div>
        <div className="tab-controls">
          <button 
            className="tab-control-btn"
            title="Close All Tabs"
            onClick={() => {
              tabs.forEach(tab => onCloseTab(tab.id));
            }}
          >
            Close All
          </button>
        </div>
      </div>

      <div className="tab-content-area">
        {activeTab ? renderTabContent(activeTab) : (
          <div className="tab-content-empty">
            <p>No tab selected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTabView;
