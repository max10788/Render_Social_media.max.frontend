import React, { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, INTERVALS } from '../config/api'; // Nur benötigte Importe
import DashboardService from '../services/dashboard';
import StatsCard from '../components/ui/StatsCard';
import ActivityChart from '../components/ui/ActivityChart';
import RecentTransactions from '../components/ui/RecentTransactions';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await DashboardService.getStats();
      setStats(response.stats || {});
    } catch (err) {
      setError(err);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchDashboardData, INTERVALS.DASHBOARD_REFRESH);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchDashboardData]);
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Crypto Dashboard</h1>
        <p>Übersicht über die Kryptomarktaktivitäten</p>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-indicator">Lade Dashboard-Daten...</div>
        ) : error ? (
          <div className="error-message">Fehler beim Laden der Dashboard-Daten: {error.message}</div>
        ) : (
          <>
            <div className="stats-grid">
              <StatsCard 
                title="Gesamtvolumen" 
                value={stats.totalVolume || 0} 
                change={stats.volumeChange || 0} 
                format="currency" 
              />
              <StatsCard 
                title="Aktive Contracts" 
                value={stats.activeContracts || 0} 
                change={stats.contractsChange || 0} 
              />
              <StatsCard 
                title="Transaktionen" 
                value={stats.transactions || 0} 
                change={stats.transactionsChange || 0} 
              />
              <StatsCard 
                title="Neue Token" 
                value={stats.newTokens || 0} 
                change={stats.tokensChange || 0} 
              />
            </div>
            
            <div className="dashboard-charts">
              <ActivityChart data={stats.activityData || []} />
              <RecentTransactions transactions={stats.recentTransactions || []} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
