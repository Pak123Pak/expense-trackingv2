import React, { useState } from 'react';
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
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { useTrip } from '../contexts/TripContext';
import { useNavigate } from 'react-router-dom';

export default function TripItem({ trip }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const { deleteTrip } = useTrip();
    const navigate = useNavigate();

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
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }
                }}
                onClick={handleOpenTrip}
            >
                <Box>
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