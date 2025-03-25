/**
 * CheckDebtModal.js
 * 
 * This component displays debt information for a trip, including:
 * - A summary of the user's balance
 * - Current debts (who owes what to whom)
 * - Debt history (settled debts)
 * - A "Settle Up" button to clear all current debts
 * 
 * Implemented in Phase 7 to enable debt tracking and settlement.
 */

import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button,
    Typography,
    Box,
    Divider,
    List,
    ListItem,
    ListItemText,
    Tabs,
    Tab,
    Paper,
    CircularProgress,
    Alert,
    useTheme
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDebt } from '../contexts/DebtContext';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTrip } from '../contexts/TripContext';
import { useParams } from 'react-router-dom';

// Tab panel component for switching between active debts and history
function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`debt-tabpanel-${index}`}
            aria-labelledby={`debt-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function CheckDebtModal({ open, onClose }) {
    const [tabValue, setTabValue] = useState(0);
    const { calculatedDebts, debtHistory, userBalances, settleUpDebts, loading } = useDebt();
    const { currentUser } = useAuth();
    const { formatCurrency, homeCurrency } = useCurrency();
    const { getTripDetails } = useTrip();
    const { tripId } = useParams();
    const [isSettling, setIsSettling] = useState(false);
    const [tripmates, setTripmates] = useState([]);
    const theme = useTheme();

    // Fetch tripmates with their display names
    useEffect(() => {
        async function fetchTripmates() {
            if (!tripId) return;
            
            try {
                const tripDetails = await getTripDetails(tripId);
                if (tripDetails?.tripmates) {
                    setTripmates(tripDetails.tripmates);
                }
            } catch (error) {
                console.error('Error fetching tripmates:', error);
            }
        }
        
        fetchTripmates();
    }, [tripId, getTripDetails]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleSettleUp = async () => {
        setIsSettling(true);
        try {
            await settleUpDebts();
            // After settling up, switch to history tab
            setTabValue(1);
        } catch (error) {
            console.error('Error settling debts:', error);
        } finally {
            setIsSettling(false);
        }
    };

    // Function to determine if a debt involves the current user
    const isUserInvolved = (debt) => {
        return debt.fromUser === currentUser.uid || debt.toUser === currentUser.uid;
    };

    // Filter debts where the current user is involved
    const userDebts = calculatedDebts.filter(isUserInvolved);
    const userDebtHistory = debtHistory.filter(isUserInvolved);

    // Find display name for a user ID or email
    const getDisplayName = (userId, email) => {
        const tripmate = tripmates.find(tm => tm.uid === userId || tm.email === email);
        return tripmate ? tripmate.displayName : email || 'Unknown user';
    };

    // Function to format the debt description based on user perspective
    const getDebtDescription = (debt) => {
        const amount = formatCurrency(debt.amount, homeCurrency);
        
        if (debt.fromUser === currentUser.uid) {
            return `You owe ${getDisplayName(debt.toUser, debt.toUserEmail)}: ${amount}`;
        } else {
            return `${getDisplayName(debt.fromUser, debt.fromUserEmail)} owes you: ${amount}`;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Check Debt
            </DialogTitle>
            
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* User Balance Summary */}
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                p: 2, 
                                mb: 3, 
                                backgroundColor: theme.palette.background.default
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Your Balance Summary
                            </Typography>
                            {Object.entries(userBalances).map(([userId, balance]) => {
                                // Only show the current user's balance
                                if (userId === currentUser.uid) {
                                    return (
                                        <Box key={userId} sx={{ mt: 1 }}>
                                            <Typography>
                                                Total paid: {formatCurrency(balance.paid, homeCurrency)}
                                            </Typography>
                                            <Typography>
                                                Your share: {formatCurrency(balance.owed, homeCurrency)}
                                            </Typography>
                                            <Typography 
                                                sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: balance.balance > 0 
                                                        ? 'success.main' 
                                                        : balance.balance < 0 
                                                            ? 'error.main' 
                                                            : 'text.primary'
                                                }}
                                            >
                                                {balance.balance > 0 
                                                    ? `You are owed: ${formatCurrency(balance.balance, homeCurrency)}`
                                                    : balance.balance < 0
                                                        ? `You owe: ${formatCurrency(Math.abs(balance.balance), homeCurrency)}`
                                                        : 'You are all settled up!'}
                                            </Typography>
                                        </Box>
                                    );
                                }
                                return null;
                            })}
                        </Paper>

                        {/* Tabs for Active Debts and History */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="debt tabs">
                                <Tab label="Current Debts" id="debt-tab-0" />
                                <Tab label="Debt History" id="debt-tab-1" />
                            </Tabs>
                        </Box>
                        
                        {/* Current Debts Tab */}
                        <TabPanel value={tabValue} index={0}>
                            {userDebts.length > 0 ? (
                                <List>
                                    {userDebts.map((debt) => (
                                        <React.Fragment key={debt.fromUser + debt.toUser}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={getDebtDescription(debt)}
                                                    secondary={debt.description}
                                                />
                                            </ListItem>
                                            <Divider />
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Alert severity="info">
                                    You don't have any debts in this trip.
                                </Alert>
                            )}
                        </TabPanel>
                        
                        {/* Debt History Tab */}
                        <TabPanel value={tabValue} index={1}>
                            {userDebtHistory.length > 0 ? (
                                <List>
                                    {userDebtHistory.map((debt, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={getDebtDescription(debt)}
                                                    secondary={
                                                        <>
                                                            {debt.description}
                                                            <br />
                                                            <Typography variant="caption" color="text.secondary">
                                                                Settled: {new Date(debt.settledAt).toLocaleString()}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            <Divider />
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Alert severity="info">
                                    No debt settlement history yet.
                                </Alert>
                            )}
                        </TabPanel>
                    </>
                )}
            </DialogContent>
            
            <DialogActions>
                <Button 
                    onClick={handleSettleUp} 
                    variant="contained" 
                    color="primary"
                    disabled={isSettling || loading || userDebts.length === 0}
                    sx={{ mr: 1 }}
                >
                    {isSettling ? <CircularProgress size={24} /> : 'Settle Up'}
                </Button>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
} 