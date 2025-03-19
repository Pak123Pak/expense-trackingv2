import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Button, 
    Box, 
    Paper,
    AppBar, 
    Toolbar, 
    CircularProgress,
    Alert,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseProvider, useExpense } from '../contexts/ExpenseContext';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseItem from '../components/ExpenseItem';
import SettingsMenu from '../components/SettingsMenu';

// Sort method options
const SORT_OPTIONS = [
    { value: 'modifiedDesc', label: 'Modified time (newest)' },
    { value: 'modifiedAsc', label: 'Modified time (oldest)' },
    { value: 'expenseDesc', label: 'Expense time (newest)' },
    { value: 'expenseAsc', label: 'Expense time (oldest)' },
    { value: 'amountDesc', label: 'Amount (largest)' },
    { value: 'amountAsc', label: 'Amount (smallest)' }
];

// Inner component that uses the ExpenseContext
function TripDetailsContent() {
    const { expenses, loading, sortMethod, changeSortMethod } = useExpense();
    const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const { currentUser } = useAuth();
    
    const handleOpenAddExpenseModal = () => {
        setSelectedExpense(null);
        setAddExpenseModalOpen(true);
    };
    
    const handleCloseAddExpenseModal = () => {
        setAddExpenseModalOpen(false);
        setSelectedExpense(null);
    };
    
    const handleEditExpense = (expense) => {
        setSelectedExpense(expense);
        setAddExpenseModalOpen(true);
    };

    const handleSortChange = (e) => {
        changeSortMethod(e.target.value);
    };

    // Calculate total expenses
    const calculateTotal = () => {
        if (expenses.length === 0) return 0;
        
        return expenses.reduce((total, expense) => {
            return total + parseFloat(expense.amount);
        }, 0);
    };

    return (
        <>
            {/* Add Expense Button */}
            <Box sx={{ mb: 4 }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddExpenseModal}
                >
                    Add new expense
                </Button>
            </Box>
            
            {/* Summary Box */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Trip Summary
                </Typography>
                <Typography variant="body1">
                    Total Expenses: {expenses.length > 0 ? `${expenses[0].currency.toUpperCase()} ${calculateTotal().toFixed(2)}` : '0'}
                </Typography>
            </Paper>
            
            {/* Sort Control */}
            <Box sx={{ mb: 3 }}>
                <FormControl variant="outlined" sx={{ minWidth: 250 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                        value={sortMethod}
                        onChange={handleSortChange}
                        label="Sort by"
                    >
                        {SORT_OPTIONS.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            
            {/* Expenses List */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : expenses.length > 0 ? (
                <Box>
                    {expenses.map((expense) => (
                        <ExpenseItem 
                            key={expense.id} 
                            expense={expense} 
                            onEdit={handleEditExpense} 
                        />
                    ))}
                </Box>
            ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                    You don't have any expenses yet. Create your first expense using the "+ Add new expense" button.
                </Alert>
            )}
            
            {/* Add/Edit Expense Modal */}
            <AddExpenseModal 
                open={addExpenseModalOpen} 
                onClose={handleCloseAddExpenseModal} 
                paidByOptions={[currentUser?.email]} // Will be expanded in later phases
                expense={selectedExpense}
            />
        </>
    );
}

// Outer component that wraps the context provider
export default function TripDetails() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    
    useEffect(() => {
        async function fetchTripDetails() {
            if (!currentUser || !tripId) {
                setLoading(false);
                return;
            }
            
            try {
                const tripDoc = await getDoc(doc(db, 'trips', tripId));
                
                if (!tripDoc.exists()) {
                    setError('Trip not found');
                    setLoading(false);
                    return;
                }
                
                const tripData = { id: tripDoc.id, ...tripDoc.data() };
                
                // Check if current user is allowed to access this trip
                if (tripData.creatorId !== currentUser.uid && !tripData.tripmates.includes(currentUser.uid)) {
                    setError('You do not have permission to view this trip');
                    setLoading(false);
                    return;
                }
                
                setTrip(tripData);
            } catch (err) {
                console.error('Error fetching trip details:', err);
                setError('Failed to load trip details');
            } finally {
                setLoading(false);
            }
        }
        
        fetchTripDetails();
    }, [tripId, currentUser]);
    
    const handleBackToTrips = () => {
        navigate('/trips');
    };
    
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBackIcon />} 
                    onClick={handleBackToTrips}
                >
                    Back to Trips
                </Button>
            </Container>
        );
    }
    
    if (!trip) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="warning">
                    Trip data is not available.
                </Alert>
                <Button 
                    variant="contained" 
                    startIcon={<ArrowBackIcon />} 
                    onClick={handleBackToTrips}
                    sx={{ mt: 2 }}
                >
                    Back to Trips
                </Button>
            </Container>
        );
    }
    
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        onClick={handleBackToTrips}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {trip.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        {currentUser?.email}
                    </Typography>
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <ExpenseProvider tripId={tripId}>
                    <TripDetailsContent />
                </ExpenseProvider>
            </Container>
        </>
    );
} 