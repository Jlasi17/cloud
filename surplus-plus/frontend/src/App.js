import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GoogleMapsProvider from './components/maps/GoogleMapsProvider';

// Import pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserDashboard from './pages/UserDashboard';
import DeliveryPartnerDashboard from './pages/DeliveryPartnerDashboard';
import DeliveryProfile from './pages/DeliveryProfile';
import MapDemo from './components/maps/MapDemo';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <GoogleMapsProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route 
                path="/user/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/delivery/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryPartnerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/delivery/profile" 
                element={
                  <ProtectedRoute allowedRoles={['delivery']}>
                    <DeliveryProfile />
                  </ProtectedRoute>
                } 
              />
              <Route path="/map-demo" element={<MapDemo />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </GoogleMapsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
