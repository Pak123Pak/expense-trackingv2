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
        
        // Calculate total for each type (convert to home currency)
        for (const expense of filteredExpenses) {
            const type = expense.type || 'Other';
            const convertedAmount = await convert(
                expense.amount,
                expense.currency,
                homeCurrency
            );
            
            typeAmounts[type] = (typeAmounts[type] || 0) + convertedAmount;
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
        
        // For each expense, calculate daily amounts based on consecutive days
        for (const expense of filteredExpenses) {
            const startDate = new Date(expense.expenseDate);
            const consecutiveDays = expense.consecutiveDays || 1;
            const dailyAmount = expense.amount / consecutiveDays;
            
            // Convert to home currency
            const convertedDailyAmount = await convert(
                dailyAmount,
                expense.currency,
                homeCurrency
            );
            
            // Add amount to each day within the expense's duration
            for (let i = 0; i < consecutiveDays; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const dateString = currentDate.toISOString().split('T')[0];
                dateAmounts[dateString] = (dateAmounts[dateString] || 0) + convertedDailyAmount;
            }
        }
        
        // Sort dates
        const sortedDates = Object.keys(dateAmounts).sort();
        const sortedAmounts = sortedDates.map(date => dateAmounts[date]);
        
        // Format dates for display
        const formattedDates = sortedDates.map(date => {
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year}`;
        });
        
        setChartData({
            labels: formattedDates,
            datasets: [
                {
                    label: `Expenses by Day (${homeCurrency.toUpperCase()})`,
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
    
    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, homeCurrency, false);
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.raw, homeCurrency);
                    }
                }
            }
        }
    };
    
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleBackToTrip}
                        aria-label="back"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
                        Expense Classification
                        {trip && ` - ${trip.name}`}
                    </Typography>
                    <SettingsMenu />
                </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4, mb: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography color="error">{error}</Typography>
                    </Paper>
                ) : (
                    <>
                        {/* Classification Controls */}
                        <Paper sx={{ p: 3, mb: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                                <FormControl fullWidth variant="outlined">
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
                                
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>User</InputLabel>
                                    <Select
                                        value={selectedUser}
                                        onChange={handleSelectedUserChange}
                                        label="User"
                                    >
                                        <MenuItem value="All">All</MenuItem>
                                        {tripmates.map(tripmate => (
                                            <MenuItem key={tripmate.uid} value={tripmate.email}>
                                                {tripmate.email} {tripmate.uid === currentUser.uid ? '(You)' : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary">
                                All amounts converted to your home currency ({homeCurrency.toUpperCase()})
                            </Typography>
                        </Paper>
                        
                        {/* Chart */}
                        <Paper sx={{ p: 3, height: 500 }}>
                            {expenses.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No expense data available
                                    </Typography>
                                </Box>
                            ) : (
                                <Bar data={chartData} options={chartOptions} />
                            )}
                        </Paper>
                    </>
                )}
            </Container>
        </>
    );
} 