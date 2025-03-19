import React, { useState } from 'react';
import { 
    Container, 
    Typography, 
    Button, 
    Box, 
    AppBar, 
    Toolbar, 
    CircularProgress,
    Alert,
    Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTrip } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import TripItem from '../components/TripItem';
import AddTripModal from '../components/AddTripModal';
import SettingsMenu from '../components/SettingsMenu';

export default function TripList() {
    const [addTripModalOpen, setAddTripModalOpen] = useState(false);
    const { trips, loading } = useTrip();
    const { currentUser } = useAuth();
    const { homeCurrency } = useCurrency();
    
    const handleOpenAddTripModal = () => {
        setAddTripModalOpen(true);
    };
    
    const handleCloseAddTripModal = () => {
        setAddTripModalOpen(false);
    };

    return (
        <>
            <AppBar position="static" color="primary" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        My Trips
                    </Typography>
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddTripModal}
                    >
                        Add new trip
                    </Button>
                </Box>
                
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Account Settings
                    </Typography>
                    <Typography variant="body1">
                        User: {currentUser?.email}
                    </Typography>
                    <Typography variant="body1">
                        Home Currency: {homeCurrency.toUpperCase()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        You can change your home currency in the settings menu (top right).
                    </Typography>
                </Paper>
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : trips.length > 0 ? (
                    <Box>
                        {trips.map((trip) => (
                            <TripItem key={trip.id} trip={trip} />
                        ))}
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        You don't have any trips yet. Create your first trip using the "+ Add new trip" button.
                    </Alert>
                )}
            </Container>
            
            <AddTripModal 
                open={addTripModalOpen} 
                onClose={handleCloseAddTripModal} 
            />
        </>
    );
} 