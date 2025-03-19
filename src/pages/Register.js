import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    Container, 
    Box, 
    Avatar, 
    Typography, 
    TextField, 
    Button, 
    Grid, 
    Alert,
    Paper
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters long');
        }
        
        try {
            setError('');
            setLoading(true);
            await signup(email, password, displayName);
            navigate('/trips');
        } catch (error) {
            console.error('Registration error:', error);
            
            // More user-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please use a different email or try to log in.');
            } else if (error.code === 'auth/invalid-email') {
                setError('Invalid email address. Please enter a valid email.');
            } else if (error.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else if (error.code === 'auth/configuration-not-found') {
                setError('Firebase configuration error. Please ensure Firebase is properly set up.');
            } else {
                setError(error.message || 'Failed to create an account. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <PersonAddIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign Up
                </Typography>
                
                {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="displayName"
                        label="Display Name"
                        name="displayName"
                        autoComplete="name"
                        autoFocus
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        helperText="Password must be at least 6 characters long"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        Sign Up
                    </Button>
                    <Grid container justifyContent="flex-end">
                        <Grid item>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    Already have an account? Sign In
                                </Typography>
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
} 