import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Alert,
    Paper,
    Divider,
    useTheme,
    useMediaQuery,
    Grid,
    Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTrip } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import TripItem from '../components/TripItem';
import AddTripModal from '../components/AddTripModal';
import PageContainer from '../components/PageContainer';
import LoadingWrapper from '../components/LoadingWrapper';
import ErrorDisplay from '../components/ErrorDisplay';

export default function TripList() {
    const [addTripModalOpen, setAddTripModalOpen] = useState(false);
    const { trips, loading, error, fetchTrips } = useTrip();
    const { currentUser } = useAuth();
    const { homeCurrency } = useCurrency();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const handleOpenAddTripModal = () => {
        setAddTripModalOpen(true);
    };
    
    const handleCloseAddTripModal = () => {
        setAddTripModalOpen(false);
    };

    return (
        <PageContainer title="My Trips">
            <Box sx={{ mb: 4 }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddTripModal}
                    sx={{ py: 1.5, px: 3 }}
                    fullWidth={isMobile}
                >
                    Add new trip
                </Button>
            </Box>
            
            <Paper 
                elevation={2} 
                sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    mb: 4,
                    borderRadius: 2
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Account Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body1" component="div" sx={{ mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>User:</Box>
                            {currentUser?.email}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body1" component="div">
                            <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Home Currency:</Box>
                            {homeCurrency.toUpperCase()}
                        </Typography>
                    </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    You can change your home currency in the settings menu (top right).
                </Typography>
            </Paper>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                My Trips
            </Typography>
            
            {error && (
                <ErrorDisplay 
                    message={error} 
                    onRetry={fetchTrips}
                />
            )}
            
            <LoadingWrapper loading={loading}>
                {trips.length > 0 ? (
                    <Fade in={!loading}>
                        <Box>
                            {trips.map((trip) => (
                                <TripItem key={trip.id} trip={trip} />
                            ))}
                        </Box>
                    </Fade>
                ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        You don't have any trips yet. Create your first trip using the "+ Add new trip" button.
                    </Alert>
                )}
            </LoadingWrapper>
            
            <AddTripModal 
                open={addTripModalOpen} 
                onClose={handleCloseAddTripModal} 
            />
        </PageContainer>
    );
} 