import React, { useState } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Button, 
    Box,
    CircularProgress
} from '@mui/material';
import { useTrip } from '../contexts/TripContext';

export default function AddTripModal({ open, onClose }) {
    const [tripName, setTripName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { addTrip } = useTrip();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!tripName.trim()) {
            setError('Trip name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            
            const result = await addTrip(tripName);
            if (result) {
                // Reset form and close modal on success
                setTripName('');
                onClose();
            } else {
                setError('Failed to create trip. Please try again.');
            }
        } catch (error) {
            console.error('Error creating trip:', error);
            setError(error.message || 'Failed to create trip');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTripName('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Trip</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="tripName"
                        label="Trip Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        error={!!error}
                        helperText={error}
                        disabled={isSubmitting}
                    />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleClose} 
                        color="secondary"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Box sx={{ position: 'relative' }}>
                        <Button 
                            type="submit" 
                            color="primary"
                            variant="contained"
                            disabled={isSubmitting}
                        >
                            Save
                        </Button>
                        {isSubmitting && (
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
                </DialogActions>
            </form>
        </Dialog>
    );
} 