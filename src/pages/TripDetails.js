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
    Chip,
    Grid,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import MoneyIcon from '@mui/icons-material/Money';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { ExpenseProvider, useExpense } from '../contexts/ExpenseContext';
import { DebtProvider, useDebt } from '../contexts/DebtContext';
import { useCurrency } from '../contexts/CurrencyContext';
import AddExpenseModal from '../components/AddExpenseModal';
import AddTripmateModal from '../components/AddTripmateModal';
import CheckDebtModal from '../components/CheckDebtModal';
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

// Inner component that uses the ExpenseContext and DebtContext
function TripDetailsContent({ tripmates, isCreator }) {
    const { expenses, loading, sortMethod, changeSortMethod } = useExpense();
    const { userBalances, loading: debtLoading } = useDebt();
    const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
    const [checkDebtModalOpen, setCheckDebtModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCalculatingTotal, setIsCalculatingTotal] = useState(true);
    const { currentUser } = useAuth();
    const { homeCurrency, convert, formatCurrency } = useCurrency();
    const navigate = useNavigate();
    const { tripId } = useParams();
    
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

    const handleOpenCheckDebtModal = () => {
        setCheckDebtModalOpen(true);
    };
    
    const handleCloseCheckDebtModal = () => {
        setCheckDebtModalOpen(false);
    };

    const handleOpenClassification = () => {
        navigate(`/trips/${tripId}/classification`);
    };

    // Get all email addresses from tripmates for paid by options
    const paidByOptions = tripmates.map(tripmate => tripmate.email);

    return (
        <>
            {/* Action Buttons */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddExpenseModal}
                >
                    Add new expense
                </Button>
                
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<MoneyIcon />}
                    onClick={handleOpenCheckDebtModal}
                >
                    Check debt
                </Button>
                
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AnalyticsIcon />}
                    onClick={handleOpenClassification}
                >
                    Classify expense
                </Button>
            </Box>
            
            {/* Summary Box */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Trip Summary
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                
                <Divider sx={{ my: 2 }} />
                
                {/* User Balances */}
                <Typography variant="subtitle1" gutterBottom>
                    Individual Balances:
                </Typography>
                
                {debtLoading ? (
                    <CircularProgress size={20} />
                ) : (
                    <Grid container spacing={2}>
                        {Object.entries(userBalances).map(([userId, balance]) => {
                            // Find tripmate data for this userId
                            const tripmate = tripmates.find(tm => tm.uid === userId);
                            if (!tripmate) return null;
                            
                            return (
                                <Grid item xs={12} sm={6} md={4} key={userId}>
                                    <Box 
                                        sx={{ 
                                            p: 1, 
                                            borderRadius: 1,
                                            bgcolor: userId === currentUser.uid ? 'action.hover' : 'transparent'
                                        }}
                                    >
                                        <Typography variant="subtitle2" noWrap>
                                            {tripmate.displayName}
                                            {userId === currentUser.uid && " (You)"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Paid: {formatCurrency(balance.paid, homeCurrency)}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontWeight: 'medium',
                                                color: balance.balance > 0 
                                                    ? 'success.main' 
                                                    : balance.balance < 0 
                                                        ? 'error.main' 
                                                        : 'text.secondary'
                                            }}
                                        >
                                            Balance: {formatCurrency(balance.balance, homeCurrency)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
                
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
            
            {/* Check Debt Modal */}
            <CheckDebtModal 
                open={checkDebtModalOpen} 
                onClose={handleCloseCheckDebtModal} 
            />
        </>
    );
}

// Outer component that wraps the context providers
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
    }, [currentUser, tripId, getTripDetails]);

    const handleBackToTrips = () => {
        navigate('/');
    };

    const handleOpenAddTripmateModal = () => {
        setAddTripmateModalOpen(true);
    };

    const handleCloseAddTripmateModal = () => {
        setAddTripmateModalOpen(false);
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error">{error}</Alert>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleBackToTrips}
                        sx={{ mt: 2 }}
                    >
                        Back to Trip List
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <>
            <AppBar position="static" color="default">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleBackToTrips}
                        aria-label="back"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {trip.name}
                    </Typography>
                    
                    {/* Tripmates button */}
                    <Button 
                        startIcon={<PeopleIcon />}
                        onClick={handleOpenAddTripmateModal}
                        sx={{ mr: 2 }}
                    >
                        Add Tripmate
                    </Button>
                    
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4 }}>
                {/* Display tripmates if there are any */}
                {tripmates.length > 1 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Trip Members:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {tripmates.map(tripmate => (
                                <Chip 
                                    key={tripmate.uid} 
                                    label={tripmate.displayName || tripmate.email} 
                                    variant="outlined"
                                    color={tripmate.uid === currentUser.uid ? "primary" : "default"}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
                
                {/* Context providers for expenses and debts */}
                <ExpenseProvider tripId={tripId}>
                    <DebtProvider tripId={tripId}>
                        <TripDetailsContent 
                            tripmates={tripmates} 
                            isCreator={trip.isCreator} 
                        />
                    </DebtProvider>
                </ExpenseProvider>
            </Container>
            
            {/* Add Tripmate Modal */}
            <AddTripmateModal
                open={addTripmateModalOpen}
                onClose={handleCloseAddTripmateModal}
                tripId={tripId}
                tripName={trip.name}
            />
        </>
    );
} 