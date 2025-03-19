import React, { useState } from 'react';
import { 
  ListItem, 
  ListItemText, 
  IconButton, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function TripItem({ trip, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOpenConfirm = (e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete button
    setConfirmOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'trips', trip.id));
      handleCloseConfirm();
      onDelete(trip.id);
    } catch (error) {
      console.error('Error deleting trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = () => {
    // In the future, this will navigate to the trip details page
    // For now, we'll just log the trip ID
    console.log(`Clicked on trip: ${trip.id}`);
    // Placeholder for future navigation
    // navigate(`/trips/${trip.id}`);
  };

  return (
    <>
      <ListItem 
        button 
        onClick={handleTripClick}
        sx={{ 
          borderBottom: '1px solid #eee',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
        }}
      >
        <ListItemText primary={trip.name} />
        <IconButton 
          edge="end" 
          aria-label="delete" 
          onClick={handleOpenConfirm}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </ListItem>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleCloseConfirm}
      >
        <DialogTitle>Delete Trip</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{trip.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={loading}>
            Cancel
          </Button>
          <Box sx={{ position: 'relative' }}>
            <Button 
              onClick={handleDelete} 
              color="error" 
              disabled={loading}
            >
              Delete
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
      </Dialog>
    </>
  );
} 