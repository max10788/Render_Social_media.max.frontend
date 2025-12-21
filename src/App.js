import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navigation from './components/ui/Navigation';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import ContractRadar from './pages/ContractRadar';
import TokenOverview from './pages/TokenOverview';
import WalletAnalyses from './pages/WalletAnalyses';
import ScanJobs from './pages/ScanJobs';
import TransactionNetworkPage from './components/ui/TransactionNetworkPage';
import PriceMovers from './pages/PriceMovers';
import OrderbookHeatmap from './pages/OrderbookHeatmap';
import IcebergOrders from './pages/IcebergOrders';
import OTCAnalysis from './pages/OTCAnalysis';
import Login from './auth/Login/Login';
import Register from './auth/Register/Register';
import Account from './auth/Account/Account';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';

console.log('🎯 App.js wird geladen');
console.log('✅ Alle App-Imports erfolgreich');

function App() {
  console.log('🏗️ App-Komponente wird gerendert');
  
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/radar" element={<ContractRadar />} />
              <Route path="/tokens" element={<TokenOverview />} />
              <Route path="/wallets" element={<WalletAnalyses />} />
              <Route path="/scans" element={<ScanJobs />} />
              <Route path="/network" element={<TransactionNetworkPage />} />
              <Route path="/otc-analysis" element={<OTCAnalysis />} />
              <Route path="/price-movers" element={<PriceMovers />} />
              <Route path="/orderbook-heatmap" element={<OrderbookHeatmap />} />
              <Route path="/iceberg-orders" element={<IcebergOrders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

console.log('✅ App-Komponente definiert');

export default App;
