import React, { useState, useEffect } from 'react';
import { 
    Paper, 
    Typography, 
    Box, 
    IconButton, 
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Chip,
    Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTrip } from '../contexts/TripContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function TripItem({ trip }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [tripmates, setTripmates] = useState([]);
    const { deleteTrip, getTripDetails } = useTrip();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Fetch trip members on initial render
    useEffect(() => {
        async function fetchTripmates() {
            try {
                const tripDetails = await getTripDetails(trip.id);
                if (tripDetails?.tripmates) {
                    setTripmates(tripDetails.tripmates);
                }
            } catch (error) {
                console.error('Error fetching trip members:', error);
            }
        }
        
        fetchTripmates();
    }, [trip.id, getTripDetails]);

    // Format the creation date
    const formattedDate = trip.createdAt instanceof Date 
        ? trip.createdAt.toLocaleDateString() 
        : new Date(trip.createdAt?.seconds * 1000).toLocaleDateString();

    const handleOpenTrip = () => {
        // Navigate to the Trip Details page
        navigate(`/trips/${trip.id}`);
    };

    const handleOpenConfirmDialog = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the parent
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };

    const handleDelete = async (e) => {
        try {
            setIsDeleting(true);
            await deleteTrip(trip.id);
            handleCloseConfirmDialog();
        } catch (error) {
            console.error('Error deleting trip:', error);
        } finally {
            setIsDeleting(false);
        }
    };
    
    const toggleMembers = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the parent
        setShowMembers(!showMembers);
    };

    // Check if this is a shared trip where the user is not the creator
    const isSharedTrip = !trip.isCreator;

    return (
        <>
            <Paper 
                elevation={2}
                sx={{
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }
                }}
                onClick={handleOpenTrip}
            >
                <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
                            {trip.name}
                        </Typography>
                        {isSharedTrip && (
                            <Chip
                                icon={<PeopleIcon />}
                                label="Shared"
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Created: {formattedDate}
                    </Typography>
                    
                    {/* Trip Members */}
                    {tripmates.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    cursor: 'pointer'
                                }}
                                onClick={toggleMembers}
                            >
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                    Trip Members:
                                    <IconButton size="small" onClick={toggleMembers}>
                                        {showMembers ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                                    </IconButton>
                                </Typography>
                            </Box>
                            
                            <Collapse in={showMembers}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {tripmates.map(tripmate => (
                                        <Chip 
                                            key={tripmate.uid} 
                                            label={tripmate.displayName || tripmate.email.split('@')[0]} 
                                            size="small"
                                            variant={tripmate.uid === currentUser?.uid ? "filled" : "outlined"}
                                            color={tripmate.uid === currentUser?.uid ? "primary" : "default"}
                                        />
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    )}
                </Box>
                
                <Box sx={{ position: 'relative' }}>
                    {/* Only show delete button for trips the user created */}
                    {!isSharedTrip && (
                        <IconButton 
                            color="error" 
                            onClick={handleOpenConfirmDialog}
                            disabled={isDeleting}
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
                    {isDeleting && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
            >
                <DialogTitle>Delete Trip</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{trip.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 