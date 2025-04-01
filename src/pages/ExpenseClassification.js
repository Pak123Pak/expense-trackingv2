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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { db } from '../firebase';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { collection, query, getDocs, getDoc, doc } from 'firebase/firestore';
import SettingsMenu from '../components/SettingsMenu';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function ExpenseClassification() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { homeCurrency, formatCurrency, convert } = useCurrency();
    const { getTripDetails } = useTrip();
    
    const [trip, setTrip] = useState(null);
    const [tripmates, setTripmates] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Classification options
    const [classificationType, setClassificationType] = useState('Type');
    const [selectedUser, setSelectedUser] = useState('All');
    
    // Chart data
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    
    // Fetch trip details and expenses
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                
                // Get trip details to get tripmates
                const tripDetails = await getTripDetails(tripId);
                setTrip(tripDetails);
                
                // Use tripmates array directly from the trip details
                // It already contains all the user information we need
                if (tripDetails && tripDetails.tripmates) {
                    setTripmates(tripDetails.tripmates);
                } else {
                    setTripmates([]);
                }
                
                // Fetch all expenses for this trip
                try {
                    const expensesQuery = query(collection(db, 'trips', tripId, 'expenses'));
                    const querySnapshot = await getDocs(expensesQuery);
                    const expensesData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    setExpenses(expensesData);
                } catch (expenseError) {
                    console.error('Error fetching expenses:', expenseError);
                    setError(`Failed to load expense data: ${expenseError.message}`);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(`Failed to load trip data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
        
        fetchData();
    }, [tripId, getTripDetails]);
    
    // Generate chart data whenever classification options or data changes
    useEffect(() => {
        async function generateChartData() {
            if (loading || expenses.length === 0) return;
            
            try {
                // Create data based on classification type
                if (classificationType === 'Type') {
                    await generateTypeBasedChart(expenses);
                } else {
                    await generateDayByDayChart(expenses);
                }
            } catch (err) {
                console.error('Error generating chart data:', err);
                setError('Failed to generate chart data');
            }
        }
        
        generateChartData();
    }, [classificationType, selectedUser, expenses, loading, homeCurrency]);
    
    // Get expense amount based on splitting method and selected user
    const getUserExpenseAmount = async (expense, userEmail) => {
        try {
            if (!expense || !expense.amount || !expense.currency) return 0;
            
            const convertedAmount = await convert(
                expense.amount,
                expense.currency,
                homeCurrency
            );
            
            // If "All" users is selected or it's a "Don't split" expense that belongs to selected user
            if (selectedUser === 'All') {
                return convertedAmount;
            }
            
            // Handle expense splitting based on the splitMethod
            if (expense.splitMethod === "Don't split") {
                // Only the person who paid has this expense
                return expense.paidBy === selectedUser ? convertedAmount : 0;
            } else if (expense.splitMethod === "Everyone") {
                // For "Everyone", split equally among all tripmates
                if (selectedUser === 'All') {
                    return convertedAmount;
                } else if (tripmates.length > 0) {
                    const perPersonAmount = convertedAmount / tripmates.length;
                    
                    if (expense.paidBy === selectedUser) {
                        // If selected user paid, only count their share
                        return perPersonAmount;
                    } else {
                        // If selected user didn't pay but is part of the trip (which they must be)
                        // they owe their share to whoever paid
                        return perPersonAmount;
                    }
                }
                return 0;
            } else if (expense.splitMethod === "Individuals") {
                // For "Individuals", check if the user is in the splitWith array
                const splitWith = expense.splitWith || [];
                
                if (selectedUser === 'All') {
                    return convertedAmount;
                } else if (splitWith.length > 0) {
                    const perPersonAmount = convertedAmount / splitWith.length;
                    
                    // Check if the selected user is included in the split
                    if (splitWith.includes(selectedUser)) {
                        // If user is in the split, they should be counted for their share
                        return perPersonAmount;
                    } else {
                        // User is not part of this expense split
                        return 0;
                    }
                }
                return 0;
            }
            
            // Default fallback
            return 0;
        } catch (err) {
            console.error(`Error calculating expense amount for ${expense?.id}:`, err);
            return 0;
        }
    };
    
    const generateTypeBasedChart = async (allExpenses) => {
        // Group expenses by type
        const expenseTypes = ['Flights', 'Lodging', 'Transit', 'Meal/Drinks', 
                            'Sightseeing', 'Activities', 'Shopping', 'Groceries', 'Other'];
        
        // Initialize amounts for each type
        const typeAmounts = {};
        expenseTypes.forEach(type => {
            typeAmounts[type] = 0;
        });
        
        // For each expense
        for (const expense of allExpenses) {
            try {
                const type = expense.type || 'Other';
                
                // Calculate the amount to add based on splitting and user selection
                const amountToAdd = await getUserExpenseAmount(expense, selectedUser);
                
                // Add to the correct type
                typeAmounts[type] = (typeAmounts[type] || 0) + amountToAdd;
            } catch (err) {
                console.error(`Error processing expense ${expense.id}:`, err);
                // Continue to next expense
            }
        }
        
        // Filter out types with no expenses
        const activeTypes = expenseTypes.filter(type => typeAmounts[type] > 0);
        const activeAmounts = activeTypes.map(type => typeAmounts[type]);
        
        setChartData({
            labels: activeTypes,
            datasets: [
                {
                    label: `Expenses by Type (${homeCurrency.toUpperCase()})`,
                    data: activeAmounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                }
            ]
        });
    };
    
    const generateDayByDayChart = async (allExpenses) => {
        // Map to store date -> amount pairs
        const dateAmounts = {};
        
        // For each expense, calculate daily amounts based on consecutive days
        for (const expense of allExpenses) {
            // Skip expenses with invalid dates
            if (!expense.expenseDate) continue;
            
            try {
                // Calculate the amount to add based on splitting and user selection
                const totalAmountToAdd = await getUserExpenseAmount(expense, selectedUser);
                
                // If there's no amount to add for this user, skip
                if (totalAmountToAdd <= 0) continue;
                
                // Create a valid date object
                const startDate = new Date(expense.expenseDate);
                if (isNaN(startDate.getTime())) continue; // Skip invalid dates
                
                const consecutiveDays = expense.consecutiveDays || 1;
                
                // Calculate daily amount
                const dailyAmount = totalAmountToAdd / consecutiveDays;
                
                // Add amount to each day within the expense's duration
                for (let i = 0; i < consecutiveDays; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    const dateString = currentDate.toISOString().split('T')[0];
                    dateAmounts[dateString] = (dateAmounts[dateString] || 0) + dailyAmount;
                }
            } catch (err) {
                console.error(`Error processing expense ${expense.id}:`, err);
                // Continue to next expense
            }
        }
        
        // Sort dates
        const sortedDates = Object.keys(dateAmounts).sort();
        const sortedAmounts = sortedDates.map(date => dateAmounts[date]);
        
        // Format dates for display
        const formattedDates = sortedDates.map(date => {
            try {
                const d = new Date(date);
                return d.toLocaleDateString();
            } catch (err) {
                console.error(`Error formatting date ${date}:`, err);
                return date; // Fallback to ISO string format
            }
        });
        
        setChartData({
            labels: formattedDates,
            datasets: [
                {
                    label: `Daily Expenses (${homeCurrency.toUpperCase()})`,
                    data: sortedAmounts,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                }
            ]
        });
    };
    
    const handleBackToTrip = () => {
        navigate(`/trips/${tripId}`);
    };
    
    const handleClassificationTypeChange = (event) => {
        setClassificationType(event.target.value);
    };
    
    const handleSelectedUserChange = (event) => {
        setSelectedUser(event.target.value);
    };

    // Helper function to get display name for an email
    const getDisplayNameForEmail = (email) => {
        const tripmate = tripmates.find(tm => tm.email === email);
        return tripmate ? tripmate.displayName : email;
    };
    
    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: classificationType === 'Type' 
                    ? 'Expenses by Type' 
                    : 'Expenses by Date',
                font: {
                    size: 16
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        return `${formatCurrency(value, homeCurrency)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, homeCurrency, true);
                    }
                }
            }
        }
    };
    
    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleBackToTrip}
                    sx={{ mt: 2 }}
                >
                    Back to Trip
                </Button>
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
                        onClick={handleBackToTrip}
                        aria-label="back"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {trip ? `${trip.name} - Expense Classification` : 'Expense Classification'}
                    </Typography>
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Classification</InputLabel>
                                <Select
                                    value={classificationType}
                                    onChange={handleClassificationTypeChange}
                                    label="Classification"
                                >
                                    <MenuItem value="Type">Type</MenuItem>
                                    <MenuItem value="Day by day">Day by day</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>User</InputLabel>
                                <Select
                                    value={selectedUser}
                                    onChange={handleSelectedUserChange}
                                    label="User"
                                >
                                    <MenuItem value="All">All Users</MenuItem>
                                    {tripmates.map(tripmate => (
                                        <MenuItem 
                                            key={tripmate.email} 
                                            value={tripmate.email}
                                        >
                                            {tripmate.displayName || tripmate.email}
                                            {tripmate.uid === currentUser?.uid && " (You)"}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                p: 3, 
                                height: 500, 
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {expenses.length > 0 ? (
                                <>
                                    {selectedUser !== 'All' && (
                                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                            Viewing expenses for: {getDisplayNameForEmail(selectedUser)}
                                        </Typography>
                                    )}
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Bar 
                                            options={chartOptions} 
                                            data={chartData}
                                        />
                                    </Box>
                                </>
                            ) : (
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center',
                                        height: '100%'
                                    }}
                                >
                                    <Typography variant="h6" color="text.secondary">
                                        No expenses found for this trip
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </>
                )}
            </Container>
        </>
    );
} 