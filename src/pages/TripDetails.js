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
    Select,
    IconButton,
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { ExpenseProvider, useExpense } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import AddExpenseModal from '../components/AddExpenseModal';
import AddTripmateModal from '../components/AddTripmateModal';
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
function TripDetailsContent({ tripmates, isCreator }) {
    const { expenses, loading, sortMethod, changeSortMethod } = useExpense();
    const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCalculatingTotal, setIsCalculatingTotal] = useState(true);
    const { currentUser } = useAuth();
    const { homeCurrency, convert, formatCurrency } = useCurrency();
    
    // Calculate the total in home currency whenever expenses or homeCurrency changes
    useEffect(() => {
        async function calculateTotal() {
            if (expenses.length === 0) {
                setTotalAmount(0);
                setIsCalculatingTotal(false);
                return;
            }
            
            try {
                setIsCalculatingTotal(true);
                let total = 0;
                
                // Convert each expense to home currency and sum
                for (const expense of expenses) {
                    const convertedAmount = await convert(
                        expense.amount,
                        expense.currency,
                        homeCurrency
                    );
                    total += convertedAmount;
                }
                
                setTotalAmount(total);
            } catch (error) {
                console.error('Error calculating total:', error);
                
                // Fallback: just sum up without conversion
                const fallbackTotal = expenses.reduce((sum, expense) => {
                    if (expense.currency.toLowerCase() === homeCurrency.toLowerCase()) {
                        return sum + expense.amount;
                    }
                    return sum;
                }, 0);
                
                setTotalAmount(fallbackTotal);
            } finally {
                setIsCalculatingTotal(false);
            }
        }
        
        calculateTotal();
    }, [expenses, homeCurrency, convert]);
    
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

    // Get all email addresses from tripmates for paid by options
    const paidByOptions = tripmates.map(tripmate => tripmate.email);

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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">
                        Total Expenses: 
                    </Typography>
                    {isCalculatingTotal ? (
                        <CircularProgress size={20} sx={{ ml: 1 }} />
                    ) : (
                        <Typography variant="body1" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {formatCurrency(totalAmount, homeCurrency)}
                        </Typography>
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    All amounts converted to your home currency ({homeCurrency.toUpperCase()})
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
                paidByOptions={paidByOptions}
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
    const [tripmates, setTripmates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addTripmateModalOpen, setAddTripmateModalOpen] = useState(false);
    const { currentUser } = useAuth();
    const { getTripDetails } = useTrip();

    useEffect(() => {
        async function fetchTripDetails() {
            if (!currentUser) {
                setError('You must be logged in to view trip details');
                setLoading(false);
                return;
            }

            try {
                const tripDetails = await getTripDetails(tripId);
                
                if (!tripDetails) {
                    setError('Trip not found');
                    setLoading(false);
                    return;
                }
                
                setTrip(tripDetails);
                setTripmates(tripDetails.tripmates || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching trip details:', err);
                
                if (err.message === 'Not authorized to view this trip') {
                    setError('You do not have permission to view this trip');
                } else {
                    setError('Error loading trip details');
                }
                
                setLoading(false);
            }
        }
        
        fetchTripDetails();
    }, [tripId, currentUser, getTripDetails]);

    const handleBackToTrips = () => {
        navigate('/trips');
    };
    
    const handleOpenAddTripmateModal = () => {
        setAddTripmateModalOpen(true);
    };
    
    const handleCloseAddTripmateModal = () => {
        setAddTripmateModalOpen(false);
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button 
                    variant="outlined" 
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
            <AppBar position="static" color="primary" elevation={0}>
                <Toolbar>
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        onClick={handleBackToTrips}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
                        {trip.name}
                    </Typography>
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4 }}>
                {/* Tripmates Section */}
                {tripmates.length > 1 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                            Trip members: 
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                                {tripmates.map(tripmate => (
                                    <Chip
                                        key={tripmate.uid}
                                        label={tripmate.email}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Typography>
                    </Box>
                )}
                
                {/* Add Tripmate Button - Only shown to trip creator */}
                {trip.isCreator && (
                    <Box sx={{ mb: 4 }}>
                        <Button 
                            variant="outlined" 
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddTripmateModal}
                        >
                            Add new tripmate
                        </Button>
                    </Box>
                )}
                
                <ExpenseProvider tripId={tripId}>
                    <TripDetailsContent tripmates={tripmates} isCreator={trip.isCreator} />
                </ExpenseProvider>
                
                {/* Add Tripmate Modal */}
                <AddTripmateModal 
                    open={addTripmateModalOpen} 
                    onClose={handleCloseAddTripmateModal}
                    tripId={tripId}
                    tripName={trip.name}
                />
            </Container>
        </>
    );
} 