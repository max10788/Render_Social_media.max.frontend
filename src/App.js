import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navigation from './components/ui/Navigation';
import Dashboard from './pages/Dashboard';
import ContractRadar from './pages/ContractRadar';
import TokenOverview from './pages/TokenOverview';
import WalletAnalyses from './pages/WalletAnalyses';
import ScanJobs from './pages/ScanJobs';
import TransactionNetworkPage from './components/ui/TransactionNetworkPage';
import PriceMovers from './pages/PriceMovers';
import Login from './auth/Login/Login';
import Register from './auth/Register/Register';
import Account from './auth/Account/Account';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes - kein Login erforderlich */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/radar" element={<ContractRadar />} />
              <Route path="/tokens" element={<TokenOverview />} />
              <Route path="/wallets" element={<WalletAnalyses />} />
              <Route path="/scans" element={<ScanJobs />} />
              <Route path="/network" element={<TransactionNetworkPage />} />
              <Route path="/price-movers" element={<PriceMovers />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes - Login erforderlich */}
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

export default App;
