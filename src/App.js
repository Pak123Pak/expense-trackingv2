import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Alert, Box, Button } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { TripProvider } from './contexts/TripContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { DebtProvider } from './contexts/DebtContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import TripList from './pages/TripList';
import TripDetails from './pages/TripDetails';
import Notifications from './pages/Notifications';
import ExpenseClassification from './pages/ExpenseClassification';
import LoadingWrapper from './components/LoadingWrapper';
import ErrorDisplay from './components/ErrorDisplay';
import theme from './theme';
import './App.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ErrorDisplay 
            message="Something went wrong. Please try refreshing the page."
            onRetry={() => window.location.reload()}
          />
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [loading, setLoading] = useState(true);
  const [offlineStatus, setOfflineStatus] = useState(!navigator.onLine);
  
  // For GitHub Pages, we use HashRouter instead of BrowserRouter to avoid the need for server-side routing
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate loading time for initial resources
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <LoadingWrapper loading={loading} message="Loading application...">
          {offlineStatus && (
            <Alert 
              severity="warning" 
              sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.appBar + 1 }}
            >
              You are currently offline. Some features may be unavailable.
            </Alert>
          )}
          
          <Router>
            <AuthProvider>
              <CurrencyProvider>
                <TripProvider>
                  <NotificationProvider>
                    <ExpenseProvider>
                      <DebtProvider>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route 
                            path="/trips" 
                            element={
                              <PrivateRoute>
                                <TripList />
                              </PrivateRoute>
                            } 
                          />
                          <Route 
                            path="/trips/:tripId" 
                            element={
                              <PrivateRoute>
                                <TripDetails />
                              </PrivateRoute>
                            } 
                          />
                          <Route 
                            path="/trips/:tripId/classification" 
                            element={
                              <PrivateRoute>
                                <ExpenseClassification />
                              </PrivateRoute>
                            } 
                          />
                          <Route 
                            path="/notifications" 
                            element={
                              <PrivateRoute>
                                <Notifications />
                              </PrivateRoute>
                            } 
                          />
                          <Route path="/" element={<Navigate to="/login" />} />
                          <Route path="*" element={
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                              <ErrorDisplay 
                                message="Page not found" 
                                severity="warning"
                              />
                              <Button 
                                variant="contained" 
                                color="primary" 
                                sx={{ mt: 2 }}
                                onClick={() => window.location.href = '/'}
                              >
                                Go to Home
                              </Button>
                            </Box>
                          } />
                        </Routes>
                      </DebtProvider>
                    </ExpenseProvider>
                  </NotificationProvider>
                </TripProvider>
              </CurrencyProvider>
            </AuthProvider>
          </Router>
        </LoadingWrapper>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
