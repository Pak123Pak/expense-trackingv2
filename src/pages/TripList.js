import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TripList() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    My Trips
                </Typography>
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
            </Box>
            
            <Typography variant="body1">
                You don't have any trips yet. Create your first trip using the "+ Add new trip" button.
            </Typography>
            
            <Button 
                variant="contained" 
                color="primary"
                sx={{ mt: 2 }}
            >
                + Add new trip
            </Button>
        </Container>
    );
} 