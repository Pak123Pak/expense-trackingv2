import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    Box,
    CircularProgress
} from '@mui/material';
import { useTrip } from '../contexts/TripContext';
import { useNotification } from '../contexts/NotificationContext';

export default function AddTripmateModal({ open, onClose, tripId, tripName }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const { addTripmate } = useTrip();
    const { sendTripInvitation } = useNotification();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setError('Please enter a valid email address');
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(false);
        
        try {
            // Verify trip access
            await addTripmate(tripId, email);
            
            // Send invitation notification
            await sendTripInvitation(tripId, tripName, email);
            
            setSuccess(true);
            setEmail('');
            
            // Close the modal after a short delay
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);
        } catch (error) {
            if (error.message === 'User not found') {
                setError('User not found. Please check the email address.');
            } else {
                setError('Error sending invitation. Please try again.');
                console.error('Error adding tripmate:', error);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleClose = () => {
        setEmail('');
        setError(null);
        setSuccess(false);
        onClose();
    };
    
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Tripmate</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>Invitation sent successfully!</Alert>}
                    
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Email Address"
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            helperText="Enter the email of an existing user to invite them to this trip"
                            disabled={loading || success}
                            autoFocus
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={loading || !email.trim() || success}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Send Invitation'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
} 