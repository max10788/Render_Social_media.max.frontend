// path: src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navigation from './components/ui/Navigation';
import LandingPage from './pages/LandingPage/LandingPage';
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
import LearningHome from './learning/pages/LearningHome';
import CourseView from './learning/pages/CourseView';
import ToolsOverview from './pages/ToolsOverview';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Learning Routes - PUBLIC (no login required) */}
              <Route path="/learning" element={<LearningHome />} />
              <Route path="/learning/course/:courseId" element={<CourseView />} />
              <Route path="/learning/course/:courseId/module/:moduleId" element={<CourseView />} />
              
              {/* Legacy route for old blockchain-basics links */}
              <Route path="/learning/blockchain-basics/:moduleId" element={<CourseView />} />
              
              {/* Dashboard & Tools - Can be public or protected as needed */}
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
              <Route path="/tools" element={<ToolsOverview />} />
              
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

export default App;
