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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AddTripForm({ open, onClose, onSuccess }) {
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tripName.trim()) {
      setError('Trip name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add a new trip document to the 'trips' collection
      await addDoc(collection(db, 'trips'), {
        name: tripName.trim(),
        creatorId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tripmates: [currentUser.uid] // Include creator as a tripmate
      });

      setTripName('');
      setLoading(false);
      onSuccess(); // Inform parent component of success
      onClose(); // Close the dialog
    } catch (error) {
      console.error('Error adding trip:', error);
      setError('Failed to create trip. Please try again.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTripName('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Trip</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Trip Name"
            type="text"
            fullWidth
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            error={!!error}
            helperText={error}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Box sx={{ position: 'relative' }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              Save
            </Button>
            {loading && (
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