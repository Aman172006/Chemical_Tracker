import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import OwnerLoginPage from './pages/OwnerLoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientLoginPage from './pages/ClientLoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientTrackingPage from './pages/ClientTrackingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/owner-login" element={<OwnerLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/client-login" element={<ClientLoginPage />} />
            <Route path="/track" element={<ClientTrackingPage />} />
            <Route path="/track/:secretId" element={<ClientTrackingPage />} />

            {/* Protected Owner/Admin Routes */}
            <Route element={<ProtectedRoute requireOwner />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
