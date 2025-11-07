import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import QuickStats from '../components/dashboard/QuickStats';
import Watchlist from '../components/dashboard/Watchlist';
import RecentActivity from '../components/dashboard/RecentActivity';
import ComparisonPanel from '../components/dashboard/ComparisonPanel';
import DashboardTabView from '../components/dashboard/DashboardTabView';
import './UserDashboard.css';

// ✅ React Icons importieren - Font Awesome (professionell & bekannt)
import { 
  FaSatelliteDish,   // Radar/Scanning Icon (FaRadar existiert nicht!)
  FaGem,             // Token/Diamond Icon
  FaChartLine,       // Price Movers/Chart Icon
  FaWallet,          // Wallet Icon
  FaProjectDiagram,  // Network/Graph Icon
  FaBalanceScale,    // Compare/Balance Icon
  FaBullseye         // Target/Welcome Icon
} from 'react-icons/fa';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTabs, setActiveTabs] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonItems, setComparisonItems] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const savedWatchlist = localStorage.getItem('dashboard_watchlist');
    if (savedWatchlist) {
      setWatchlistItems(JSON.parse(savedWatchlist));
    }

    const savedActivity = localStorage.getItem('dashboard_activity');
    if (savedActivity) {
      setRecentActivity(JSON.parse(savedActivity));
    }

    const savedTabs = localStorage.getItem('dashboard_tabs');
    if (savedTabs) {
      const tabs = JSON.parse(savedTabs);
      setActiveTabs(tabs);
      if (tabs.length > 0) {
        setSelectedTab(tabs[0].id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard_watchlist', JSON.stringify(watchlistItems));
  }, [watchlistItems]);

  useEffect(() => {
    localStorage.setItem('dashboard_activity', JSON.stringify(recentActivity));
  }, [recentActivity]);

  useEffect(() => {
    localStorage.setItem('dashboard_tabs', JSON.stringify(activeTabs));
  }, [activeTabs]);

  const addToWatchlist = (item) => {
    const exists = watchlistItems.find(w => w.id === item.id);
    if (!exists) {
      setWatchlistItems([...watchlistItems, { ...item, addedAt: Date.now() }]);
      addActivity('watchlist', `Added ${item.name || item.symbol} to watchlist`);
    }
  };

  const removeFromWatchlist = (itemId) => {
    setWatchlistItems(watchlistItems.filter(w => w.id !== itemId));
  };

  const addToComparison = (item) => {
    if (comparisonItems.length < 4 && !comparisonItems.find(c => c.id === item.id)) {
      setComparisonItems([...comparisonItems, item]);
      if (!comparisonMode) setComparisonMode(true);
    }
  };

  const removeFromComparison = (itemId) => {
    setComparisonItems(comparisonItems.filter(c => c.id !== itemId));
    if (comparisonItems.length <= 1) {
      setComparisonMode(false);
    }
  };

  const addActivity = (type, message) => {
    const activity = {
      id: Date.now(),
      type,
      message,
      timestamp: Date.now()
    };
    setRecentActivity([activity, ...recentActivity.slice(0, 19)]);
  };

  const openToolTab = (toolName, toolPath, toolData = null) => {
    const tabId = `${toolName}-${Date.now()}`;
    const newTab = {
      id: tabId,
      name: toolName,
      path: toolPath,
      data: toolData,
      createdAt: Date.now()
    };
    
    setActiveTabs([...activeTabs, newTab]);
    setSelectedTab(tabId);
    addActivity('tool', `Opened ${toolName}`);
  };

  const closeTab = (tabId) => {
    const newTabs = activeTabs.filter(t => t.id !== tabId);
    setActiveTabs(newTabs);
    
    if (selectedTab === tabId && newTabs.length > 0) {
      setSelectedTab(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      setSelectedTab(null);
    }
  };

  // ✅ Tool Quick Actions mit React Icons anstatt Emojis
  const toolQuickActions = [
    { 
      id: 'radar', 
      icon: <FaSatelliteDish />, 
      name: 'Contract Radar', 
      path: '/radar', 
      description: 'Analyze smart contracts' 
    },
    { 
      id: 'tokens', 
      icon: <FaGem />, 
      name: 'Token Overview', 
      path: '/tokens', 
      description: 'Track token metrics' 
    },
    { 
      id: 'price-movers', 
      icon: <FaChartLine />, 
      name: 'Price Movers', 
      path: '/price-movers', 
      description: 'Identify price impacts' 
    },
    { 
      id: 'wallets', 
      icon: <FaWallet />, 
      name: 'Wallet Analysis', 
      path: '/wallets', 
      description: 'Analyze wallet behavior' 
    },
    { 
      id: 'network', 
      icon: <FaProjectDiagram />, 
      name: 'Transaction Network', 
      path: '/network', 
      description: 'Visualize flows' 
    }
  ];

  return (
    <div className={`user-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">Welcome back, {currentUser?.email?.split('@')[0] || 'User'}</h1>
          <p className="dashboard-subtitle">Your OnChain Intelligence Hub</p>
        </div>
        <div className="dashboard-header-actions">
          <button 
            className={`btn-comparison ${comparisonMode ? 'active' : ''}`}
            onClick={() => setComparisonMode(!comparisonMode)}
            title="Toggle Comparison Mode"
          >
            <span className="btn-icon">
              <FaBalanceScale />
            </span>
            {comparisonMode ? 'Exit Compare' : 'Compare Mode'}
            {comparisonItems.length > 0 && (
              <span className="comparison-count">{comparisonItems.length}</span>
            )}
          </button>
        </div>
      </div>

      <QuickStats 
        addToWatchlist={addToWatchlist}
        addToComparison={addToComparison}
      />

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>

          {!sidebarCollapsed && (
            <>
              <section className="sidebar-section">
                <h3 className="sidebar-section-title">Quick Actions</h3>
                <div className="quick-actions-grid">
                  {toolQuickActions.map(tool => (
                    <button
                      key={tool.id}
                      className="quick-action-btn"
                      onClick={() => openToolTab(tool.name, tool.path)}
                      title={tool.description}
                    >
                      <span className="quick-action-icon">{tool.icon}</span>
                      <span className="quick-action-name">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="sidebar-section">
                <h3 className="sidebar-section-title">
                  Watchlist
                  <span className="watchlist-count">{watchlistItems.length}</span>
                </h3>
                <Watchlist 
                  items={watchlistItems}
                  onRemove={removeFromWatchlist}
                  onAddToComparison={addToComparison}
                  onOpenTool={openToolTab}
                />
              </section>

              <section className="sidebar-section">
                <h3 className="sidebar-section-title">Recent Activity</h3>
                <RecentActivity activities={recentActivity.slice(0, 10)} />
              </section>
            </>
          )}
        </aside>

        <main className="dashboard-main">
          {comparisonMode && comparisonItems.length > 0 && (
            <ComparisonPanel 
              items={comparisonItems}
              onRemove={removeFromComparison}
              onClose={() => {
                setComparisonMode(false);
                setComparisonItems([]);
              }}
            />
          )}

          {activeTabs.length === 0 ? (
            <div className="dashboard-welcome-screen">
              <div className="welcome-icon">
                <FaBullseye />
              </div>
              <h2 className="welcome-title">Get Started</h2>
              <p className="welcome-text">
                Select a tool from Quick Actions to begin your analysis
              </p>
              <div className="welcome-tools-grid">
                {toolQuickActions.map(tool => (
                  <button
                    key={tool.id}
                    className="welcome-tool-card"
                    onClick={() => openToolTab(tool.name, tool.path)}
                  >
                    <span className="welcome-tool-icon">{tool.icon}</span>
                    <h4 className="welcome-tool-name">{tool.name}</h4>
                    <p className="welcome-tool-desc">{tool.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <DashboardTabView
              tabs={activeTabs}
              selectedTab={selectedTab}
              onSelectTab={setSelectedTab}
              onCloseTab={closeTab}
              addToWatchlist={addToWatchlist}
              addToComparison={addToComparison}
              addActivity={addActivity}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
