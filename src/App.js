import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navigation from './components/ui/Navigation';
import ContractRadar from './pages/ContractRadar';
import Login from './auth/Login/Login';
import Register from './auth/Register/Register';
import Account from './auth/Account/Account';
import ProtectedRoute from './auth/ProtectedRoute';
import './App.css';
import TransactionNetworkPage from './pages/TransactionNetworkPage';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ContractRadar />} />
              <Route path="/radar" element={<ContractRadar />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
