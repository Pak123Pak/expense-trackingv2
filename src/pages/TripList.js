import React, { useState } from 'react';
import { 
    Container, 
    Typography, 
    Button, 
    Box, 
    AppBar, 
    Toolbar, 
    CircularProgress,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTrip } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import TripItem from '../components/TripItem';
import AddTripModal from '../components/AddTripModal';
import SettingsMenu from '../components/SettingsMenu';

export default function TripList() {
    const [addTripModalOpen, setAddTripModalOpen] = useState(false);
    const { trips, loading } = useTrip();
    const { currentUser } = useAuth();
    
    const handleOpenAddTripModal = () => {
        setAddTripModalOpen(true);
    };
    
    const handleCloseAddTripModal = () => {
        setAddTripModalOpen(false);
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        My Trips
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        {currentUser?.email}
                    </Typography>
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container maxWidth="md" sx={{ mt: 4 }}>
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