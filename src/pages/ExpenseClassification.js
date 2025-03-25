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
import { collection, query, getDocs } from 'firebase/firestore';
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
                setTripmates(tripDetails.tripmates || []);
                
                // Fetch all expenses for this trip
                const expensesQuery = query(collection(db, 'trips', tripId, 'expenses'));
                const querySnapshot = await getDocs(expensesQuery);
                const expensesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setExpenses(expensesData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load trip data');
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
                let filteredExpenses = [...expenses];
                
                // Filter expenses by selected user if not "All"
                if (selectedUser !== 'All') {
                    filteredExpenses = expenses.filter(expense => 
                        expense.paidBy === selectedUser
                    );
                }
                
                // Create data based on classification type
                if (classificationType === 'Type') {
                    await generateTypeBasedChart(filteredExpenses);
                } else {
                    await generateDayByDayChart(filteredExpenses);
                }
            } catch (err) {
                console.error('Error generating chart data:', err);
                setError('Failed to generate chart data');
            }
        }
        
        generateChartData();
    }, [classificationType, selectedUser, expenses, loading, homeCurrency]);
    
    const generateTypeBasedChart = async (filteredExpenses) => {
        // Group expenses by type
        const expenseTypes = ['Flights', 'Lodging', 'Transit', 'Meal/Drinks', 
                            'Sightseeing', 'Activities', 'Shopping', 'Other'];
        
        // Initialize amounts for each type
        const typeAmounts = {};
        expenseTypes.forEach(type => {
            typeAmounts[type] = 0;
        });
        
        // Get trip details to determine tripmates
        const tripDetails = await getTripDetails(tripId);
        const allTripmates = tripDetails.tripmates || [];
        
        // Calculate total for each type (convert to home currency)
        for (const expense of filteredExpenses) {
            const type = expense.type || 'Other';
            const convertedAmount = await convert(
                expense.amount,
                expense.currency,
                homeCurrency
            );
            
            // Handle based on split method
            if (expense.splitMethod === "Don't split") {
                // If showing "All" users or viewing the specific user who paid
                if (selectedUser === 'All' || selectedUser === expense.paidBy) {
                    typeAmounts[type] = (typeAmounts[type] || 0) + convertedAmount;
                }
            } 
            else if (expense.splitMethod === "Everyone") {
                const perPersonAmount = convertedAmount / allTripmates.length;
                
                if (selectedUser === 'All') {
                    // For "All" view, show the entire expense amount
                    typeAmounts[type] = (typeAmounts[type] || 0) + convertedAmount;
                } else {
                    // For individual view, only show this person's share
                    // Find if the selected user is one of the tripmates
                    const tripmateEmails = allTripmates.map(tm => tm.email);
                    if (tripmateEmails.includes(selectedUser)) {
                        typeAmounts[type] = (typeAmounts[type] || 0) + perPersonAmount;
                    }
                }
            }
            else if (expense.splitMethod === "Individuals") {
                // Handle individual splitting based on selected individuals
                const splitWithEmails = expense.splitWith || [];
                const splitCount = splitWithEmails.length;
                
                if (splitCount === 0) {
                    // If no one is selected to split with, treat like "Don't split"
                    if (selectedUser === 'All' || selectedUser === expense.paidBy) {
                        typeAmounts[type] = (typeAmounts[type] || 0) + convertedAmount;
                    }
                } else {
                    const perPersonAmount = convertedAmount / splitCount;
                    
                    if (selectedUser === 'All') {
                        // For "All" view, show the entire expense amount
                        typeAmounts[type] = (typeAmounts[type] || 0) + convertedAmount;
                    } else if (splitWithEmails.includes(selectedUser)) {
                        // This user is specifically included in the split
                        typeAmounts[type] = (typeAmounts[type] || 0) + perPersonAmount;
                    }
                }
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
    
    const generateDayByDayChart = async (filteredExpenses) => {
        // Map to store date -> amount pairs
        const dateAmounts = {};
        
        // Get trip details to determine tripmates
        const tripDetails = await getTripDetails(tripId);
        const allTripmates = tripDetails.tripmates || [];
        
        // For each expense, calculate daily amounts based on consecutive days
        for (const expense of filteredExpenses) {
            const startDate = new Date(expense.expenseDate);
            const consecutiveDays = expense.consecutiveDays || 1;
            
            // Convert to home currency
            const convertedAmount = await convert(
                expense.amount,
                expense.currency,
                homeCurrency
            );
            
            let amountToDistribute = 0;
            
            // Handle based on split method
            if (expense.splitMethod === "Don't split") {
                // If showing "All" users or viewing the specific user who paid
                if (selectedUser === 'All' || selectedUser === expense.paidBy) {
                    amountToDistribute = convertedAmount;
                }
            } 
            else if (expense.splitMethod === "Everyone") {
                const perPersonAmount = convertedAmount / allTripmates.length;
                
                if (selectedUser === 'All') {
                    // For "All" view, show the entire expense amount
                    amountToDistribute = convertedAmount;
                } else {
                    // For individual view, only show this person's share
                    const tripmateEmails = allTripmates.map(tm => tm.email);
                    if (tripmateEmails.includes(selectedUser)) {
                        amountToDistribute = perPersonAmount;
                    }
                }
            }
            else if (expense.splitMethod === "Individuals") {
                // Handle individual splitting based on selected individuals
                const splitWithEmails = expense.splitWith || [];
                const splitCount = splitWithEmails.length;
                
                if (splitCount === 0) {
                    // If no one is selected to split with, treat like "Don't split"
                    if (selectedUser === 'All' || selectedUser === expense.paidBy) {
                        amountToDistribute = convertedAmount;
                    }
                } else {
                    const perPersonAmount = convertedAmount / splitCount;
                    
                    if (selectedUser === 'All') {
                        // For "All" view, show the entire expense amount
                        amountToDistribute = convertedAmount;
                    } else if (splitWithEmails.includes(selectedUser)) {
                        // This user is specifically included in the split
                        amountToDistribute = perPersonAmount;
                    }
                }
            }
            
            if (amountToDistribute > 0) {
                const dailyAmount = amountToDistribute / consecutiveDays;
                
                // Add amount to each day within the expense's duration
                for (let i = 0; i < consecutiveDays; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    const dateString = currentDate.toISOString().split('T')[0];
                    dateAmounts[dateString] = (dateAmounts[dateString] || 0) + dailyAmount;
                }
            }
        }
        
        // Sort dates
        const sortedDates = Object.keys(dateAmounts).sort();
        const sortedAmounts = sortedDates.map(date => dateAmounts[date]);
        
        // Format dates for display
        const formattedDates = sortedDates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString();
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