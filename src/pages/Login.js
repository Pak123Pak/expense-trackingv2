import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    Paper,
    Divider,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ErrorDisplay from '../components/ErrorDisplay';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // If user is already logged in, redirect to trips page
    useEffect(() => {
        console.log("Version 5");
        if (currentUser) {
            navigate('/trips');
        }
    }, [currentUser, navigate]);

    // Get redirect path from location state
    const from = location.state?.from?.pathname || '/trips';

    // Parse error messages from Firebase for better user experience
    const getErrorMessage = (errorCode) => {
        switch(errorCode) {
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/too-many-requests':
                return 'Too many failed login attempts. Please try again later.';
            default:
                return 'Failed to sign in. Please check your credentials.';
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate(from);
        } catch (error) {
            console.error('Login error:', error);
            setError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container component="main" maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: { xs: 3, sm: 4 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    borderRadius: 2,
                    mb: 4
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                    <LockOutlinedIcon fontSize="large" />
                </Avatar>
                <Typography component="h1" variant={isMobile ? "h5" : "h4"} sx={{ mb: 2 }}>
                    Sign In
                </Typography>
                
                {error && <ErrorDisplay message={error} severity="error" sx={{ width: '100%', mb: 2 }} />}
                
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!error && error.includes('email')}
                        disabled={loading}
                        InputProps={{
                            sx: { borderRadius: 1 }
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!error && error.includes('password')}
                        disabled={loading}
                        InputProps={{
                            sx: { borderRadius: 1 }
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ 
                            mt: 3, 
                            mb: 2, 
                            py: 1.5,
                            position: 'relative'
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={24} sx={{ position: 'absolute' }} />
                        ) : 'Sign In'}
                    </Button>
                    
                    <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            OR
                        </Typography>
                    </Divider>
                    
                    <Grid container justifyContent="center">
                        <Grid item>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <Typography variant="body1" color="primary" fontWeight={500}>
                                    Create a new account
                                </Typography>
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Expense Tracker © {new Date().getFullYear()}
                </Typography>
            </Box>
        </Container>
    );
} 