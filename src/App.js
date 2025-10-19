import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navigation from './components/ui/Navigation';
import ContractRadar from './pages/ContractRadar';
import TokenOverview from './pages/TokenOverview';
import WalletAnalyses from './pages/WalletAnalyses';
import ScanJobs from './pages/ScanJobs';
import TransactionNetworkPage from './components/ui/TransactionNetworkPage';
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
              <Route path="/" element={<ContractRadar />} />
              <Route path="/radar" element={<ContractRadar />} />
              <Route path="/tokens" element={<TokenOverview />} />
              <Route path="/wallets" element={<WalletAnalyses />} />
              <Route path="/scans" element={<ScanJobs />} />
              <Route path="/network" element={<TransactionNetworkPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes - Login erforderlich */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <ContractRadar />
                  </ProtectedRoute>
                } 
              />
              
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
