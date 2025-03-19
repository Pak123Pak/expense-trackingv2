import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { TripProvider } from './contexts/TripContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import TripList from './pages/TripList';
import TripDetails from './pages/TripDetails';
import Notifications from './pages/Notifications';
import ExpenseClassification from './pages/ExpenseClassification';
import './App.css';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  // Get the basename from the homepage in package.json for GitHub Pages deployment
  const basename = process.env.PUBLIC_URL || '';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={basename}>
        <AuthProvider>
          <CurrencyProvider>
            <TripProvider>
              <NotificationProvider>
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
                </Routes>
              </NotificationProvider>
            </TripProvider>
          </CurrencyProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
