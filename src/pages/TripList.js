import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  List, 
  CircularProgress, 
  Paper, 
  Divider,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AddTripForm from '../components/AddTripForm';
import TripItem from '../components/TripItem';
import SettingsDialog from '../components/SettingsDialog';

export default function TripList() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addTripDialogOpen, setAddTripDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch trips from Firestore
    const fetchTrips = async () => {
        if (!currentUser) return;
        
        setLoading(true);
        try {
            // Query trips where the current user is a tripmate
            const tripsQuery = query(
                collection(db, 'trips'),
                where('tripmates', 'array-contains', currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(tripsQuery);
            const tripsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamp to Date if needed
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
            }));
            
            setTrips(tripsData);
            setError('');
        } catch (err) {
            console.error('Error fetching trips:', err);
            setError('Failed to load trips. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleAddTripSuccess = () => {
        fetchTrips();
        setSuccessMessage('Trip created successfully!');
    };

    const handleDeleteTrip = (tripId) => {
        setTrips(trips.filter(trip => trip.id !== tripId));
        setSuccessMessage('Trip deleted successfully!');
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage('');
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    My Trips
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Logged in as: {currentUser?.email}
                        </Typography>
                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            size="small"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Box>
                    <IconButton 
                        color="primary" 
                        onClick={() => setSettingsDialogOpen(true)}
                        aria-label="settings"
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Box>
            
            <Button 
                variant="contained" 
                color="primary"
                sx={{ mb: 3 }}
                onClick={() => setAddTripDialogOpen(true)}
            >
                + Add new trip
            </Button>
            
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={2} sx={{ mb: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : trips.length > 0 ? (
                    <List sx={{ p: 0 }}>
                        {trips.map((trip) => (
                            <TripItem 
                                key={trip.id} 
                                trip={trip} 
                                onDelete={handleDeleteTrip} 
                            />
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1">
                            You don't have any trips yet. Create your first trip using the "+ Add new trip" button.
                        </Typography>
                    </Box>
                )}
            </Paper>
            
            {/* Add Trip Dialog */}
            <AddTripForm 
                open={addTripDialogOpen}
                onClose={() => setAddTripDialogOpen(false)}
                onSuccess={handleAddTripSuccess}
            />

            {/* Settings Dialog */}
            <SettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
            />

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                message={successMessage}
            />
        </Container>
    );
} 