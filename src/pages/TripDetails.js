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
    Divider,
    Badge
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import MoneyIcon from '@mui/icons-material/Money';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FilterListIcon from '@mui/icons-material/FilterList';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { ExpenseProvider, useExpense } from '../contexts/ExpenseContext';
import { DebtProvider, useDebt } from '../contexts/DebtContext';
import { useCurrency } from '../contexts/CurrencyContext';
import AddExpenseModal from '../components/AddExpenseModal';
import AddTripmateModal from '../components/AddTripmateModal';
import CheckDebtModal from '../components/CheckDebtModal';
import ExpenseFilterModal from '../components/ExpenseFilterModal';
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
    const { expenses, loading, sortMethod, changeSortMethod, filters, updateFilters, isFiltering } = useExpense();
    const { userBalances, loading: debtLoading } = useDebt();
    const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
    const [checkDebtModalOpen, setCheckDebtModalOpen] = useState(false);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCalculatingTotal, setIsCalculatingTotal] = useState(true);
    const [personalExpenses, setPersonalExpenses] = useState({});
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
            
            setIsCalculatingTotal(true);
            
            let total = 0;
            const personalExpensesMap = {};
            
            // Initialize personal expenses for all tripmates
            tripmates.forEach(tripmate => {
                personalExpensesMap[tripmate.email] = 0;
            });
            
            for (const expense of expenses) {
                // Convert each expense to home currency
                const convertedAmount = await convert(
                    expense.amount,
                    expense.currency,
                    homeCurrency
                );
                
                // Add to total
                total += convertedAmount;
                
                // Calculate personal expenses based on split method
                if (expense.splitMethod === "Don't split") {
                    // If not splitting, expense belongs to the person who paid
                    if (personalExpensesMap[expense.paidBy] !== undefined) {
                        personalExpensesMap[expense.paidBy] += convertedAmount;
                    }
                } 
                else if (expense.splitMethod === "Everyone") {
                    // Split evenly among all tripmates
                    const perPersonAmount = convertedAmount / tripmates.length;
                    
                    // Add the split share to each tripmate
                    tripmates.forEach(tripmate => {
                        personalExpensesMap[tripmate.email] += perPersonAmount;
                    });
                }
                else if (expense.splitMethod === "Individuals") {
                    // Handle individual splitting based on selected individuals
                    const splitWithEmails = expense.splitWith || [];
                    const splitCount = splitWithEmails.length;
                    
                    if (splitCount === 0) {
                        // If no one is selected to split with, handle like "Don't split"
                        if (personalExpensesMap[expense.paidBy] !== undefined) {
                            personalExpensesMap[expense.paidBy] += convertedAmount;
                        }
                    } else {
                        const perPersonAmount = convertedAmount / splitCount;
                        
                        // Add the split share to each selected individual
                        splitWithEmails.forEach(email => {
                            if (personalExpensesMap[email] !== undefined) {
                                personalExpensesMap[email] += perPersonAmount;
                            }
                        });
                    }
                }
            }
            
            setTotalAmount(total);
            setPersonalExpenses(personalExpensesMap);
            setIsCalculatingTotal(false);
        }
        
        calculateTotal();
    }, [expenses, homeCurrency, convert, tripmates]);
    
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

    const handleOpenFilterModal = () => {
        setFilterModalOpen(true);
    };
    
    const handleCloseFilterModal = () => {
        setFilterModalOpen(false);
    };
    
    const handleApplyFilters = (newFilters) => {
        updateFilters(newFilters);
    };

    const handleOpenClassification = () => {
        navigate(`/trips/${tripId}/classification`);
    };

    // Get all email addresses from tripmates for paid by options
    const paidByOptions = tripmates.map(tripmate => tripmate.email);

    // Check if filters are active
    const areFiltersActive = filters && filters.filterMode !== 'All';

    // Helper function to get display name for an email
    const getDisplayNameForEmail = (email) => {
        const tripmate = tripmates.find(tm => tm.email === email);
        return tripmate ? (tripmate.displayName || email) : email;
    };

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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
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
                    
                    {!isCalculatingTotal && (
                        <Box sx={{ ml: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Personal Expenses:
                            </Typography>
                            <Grid container spacing={1}>
                                {tripmates.map((tripmate) => (
                                    <Grid item xs={12} sm={6} md={4} key={tripmate.email}>
                                        <Box sx={{ 
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            px: 1,
                                            borderRadius: 1,
                                            bgcolor: tripmate.email === currentUser?.email ? 'action.hover' : 'transparent'
                                        }}>
                                            <Typography variant="body2" noWrap>
                                                {tripmate.displayName || tripmate.email}
                                                {tripmate.email === currentUser?.email && " (You)"}:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                {formatCurrency(personalExpenses[tripmate.email] || 0, homeCurrency)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="caption" color="text.secondary">
                    All amounts converted to your home currency ({homeCurrency.toUpperCase()})
                </Typography>
            </Paper>
            
            {/* Sort and Filter Options */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Expenses
                    {loading && <CircularProgress size={20} sx={{ ml:.5 }} />}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Filter Button */}
                    <Button
                        variant="outlined"
                        color={areFiltersActive ? "primary" : "inherit"}
                        startIcon={
                            <Badge
                                color="primary"
                                variant="dot"
                                invisible={!areFiltersActive}
                            >
                                <FilterListIcon />
                            </Badge>
                        }
                        onClick={handleOpenFilterModal}
                        size="small"
                    >
                        Filter
                    </Button>
                    
                    {/* Sort Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="sort-select-label">Sort by</InputLabel>
                        <Select
                            labelId="sort-select-label"
                            id="sort-select"
                            value={sortMethod}
                            label="Sort by"
                            onChange={handleSortChange}
                        >
                            {SORT_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>
            
            {/* Filter Indicator */}
            {areFiltersActive && (
                <Box sx={{ mb: 2 }}>
                    <Paper
                        variant="outlined"
                        sx={{ 
                            p: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            bgcolor: 'primary.50'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight="medium">
                                Active Filters:
                            </Typography>
                            
                            {filters.amount?.enabled && (
                                <Chip 
                                    size="small"
                                    label={`Amount: ${filters.amount.min || '0'} - ${filters.amount.max || '∞'} ${homeCurrency.toUpperCase()}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                            
                            {filters.type?.enabled && filters.type.selected.length > 0 && (
                                <Chip 
                                    size="small"
                                    label={`Types: ${filters.type.selected.join(', ')}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                            
                            {filters.paidBy?.enabled && filters.paidBy.selected && (
                                <Chip 
                                    size="small"
                                    label={`Paid by: ${getDisplayNameForEmail(filters.paidBy.selected)}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                            
                            {filters.expenseDate?.enabled && filters.expenseDate.date && (
                                <Chip 
                                    size="small"
                                    label={`Date: ${new Date(filters.expenseDate.date).toLocaleDateString()}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                        
                        <Button 
                            size="small" 
                            onClick={() => updateFilters({ filterMode: 'All' })}
                            color="primary"
                        >
                            Clear Filters
                        </Button>
                    </Paper>
                </Box>
            )}
            
            {/* Filter Results Message */}
            {areFiltersActive && expenses.length === 0 && !loading && !isFiltering && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No expenses match the current filters. Try adjusting your filters or clear them to see all expenses.
                </Alert>
            )}
            
            {/* Expense List */}
            {expenses.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {expenses.map(expense => (
                        <ExpenseItem 
                            key={expense.id} 
                            expense={expense} 
                            onEdit={handleEditExpense}
                        />
                    ))}
                </Box>
            ) : (
                !loading && !isFiltering && !areFiltersActive && (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            No expenses yet. Click "Add new expense" to get started.
                        </Typography>
                    </Paper>
                )
            )}
            
            {/* Modals */}
            <AddExpenseModal 
                open={addExpenseModalOpen} 
                onClose={handleCloseAddExpenseModal} 
                paidByOptions={paidByOptions}
                expense={selectedExpense}
            />
            
            <CheckDebtModal
                open={checkDebtModalOpen}
                onClose={handleCloseCheckDebtModal}
                tripId={tripId}
            />
            
            <ExpenseFilterModal
                open={filterModalOpen}
                onClose={handleCloseFilterModal}
                onApplyFilter={handleApplyFilters}
                tripmates={tripmates}
                currentFilters={filters}
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
            <AppBar position="fixed" color="default" elevation={2} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, width: '100%' }}>
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
            
            <Container sx={{ mt: '64px', pt: 2 }}>
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