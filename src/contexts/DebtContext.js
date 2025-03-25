/**
 * DebtContext.js
 * 
 * This context manages debt-related operations for the expense tracker app.
 * It handles calculating debts based on expenses and different splitting methods,
 * tracks user balances, and provides functionality to settle debts.
 * 
 * Implemented in Phase 7 to enable expense splitting and debt tracking.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    writeBatch,
    deleteDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useCurrency } from './CurrencyContext';
import { useExpense } from './ExpenseContext';

const DebtContext = createContext();

export function useDebt() {
    return useContext(DebtContext);
}

export function DebtProvider({ children, tripId }) {
    const [debts, setDebts] = useState([]);
    const [debtHistory, setDebtHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [calculatedDebts, setCalculatedDebts] = useState([]);
    const [userBalances, setUserBalances] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { currentUser } = useAuth();
    const { expenses } = useExpense();
    const { convert, homeCurrency } = useCurrency();

    // Fetch debts whenever the tripId changes or refresh is triggered
    useEffect(() => {
        async function fetchDebts() {
            if (!currentUser || !tripId) {
                setDebts([]);
                setDebtHistory([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Get active debts
                const activeDebtsQuery = query(
                    collection(db, 'trips', tripId, 'debts'),
                    where('settled', '==', false),
                    orderBy('createdAt', 'desc')
                );
                
                // Get settled debts (history)
                const settledDebtsQuery = query(
                    collection(db, 'trips', tripId, 'debts'),
                    where('settled', '==', true),
                    orderBy('settledAt', 'desc')
                );
                
                const [activeSnapshot, historySnapshot] = await Promise.all([
                    getDocs(activeDebtsQuery),
                    getDocs(settledDebtsQuery)
                ]);
                
                const activeDebts = activeSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const debtHistoryItems = historySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setDebts(activeDebts);
                setDebtHistory(debtHistoryItems);
            } catch (error) {
                console.error('Error fetching debts:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDebts();
    }, [currentUser, tripId, refreshTrigger]);

    // Calculate debts based on expenses
    useEffect(() => {
        async function calculateDebts() {
            if (!expenses.length || !tripId) {
                setCalculatedDebts([]);
                setUserBalances({});
                return;
            }

            try {
                const tripDoc = await getDoc(doc(db, 'trips', tripId));
                if (!tripDoc.exists()) return;
                
                const tripData = tripDoc.data();
                const tripmates = tripData.tripmates || [];
                
                // Fetch all user emails for the tripmates
                const usersData = {};
                for (const userId of tripmates) {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        usersData[userId] = {
                            email: userDoc.data().email,
                            displayName: userDoc.data().displayName || userDoc.data().email
                        };
                    }
                }
                
                // Check for existing settled debts to avoid recalculating
                const settledExpenseIds = new Set();
                const settledDebtsQuery = query(
                    collection(db, 'trips', tripId, 'debts'),
                    where('settled', '==', true)
                );
                const settledDebtsSnapshot = await getDocs(settledDebtsQuery);
                settledDebtsSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.expenseId) {
                        settledExpenseIds.add(data.expenseId);
                    }
                });
                
                // Calculate debts for each expense
                const debtItems = [];
                const userBalanceMap = {};
                
                // Initialize balances for all tripmates
                for (const userId of tripmates) {
                    userBalanceMap[userId] = {
                        paid: 0,
                        owed: 0,
                        balance: 0
                    };
                }
                
                for (const expense of expenses) {
                    const paidByEmail = expense.paidBy;
                    const amount = expense.amount;
                    const currency = expense.currency;
                    
                    // Find paidBy user ID
                    const paidByUserId = Object.entries(usersData).find(
                        ([_, userData]) => userData.email === paidByEmail
                    )?.[0];
                    
                    if (!paidByUserId) continue;
                    
                    // Skip expenses that have been settled
                    if (settledExpenseIds.has(expense.id)) continue;
                    
                    // Convert amount to home currency
                    const convertedAmount = await convert(amount, currency, homeCurrency);
                    
                    // Handle different split methods
                    if (expense.splitMethod === "Don't split") {
                        // No debt calculation needed for "Don't split"
                        userBalanceMap[paidByUserId].paid += convertedAmount;
                        userBalanceMap[paidByUserId].balance += convertedAmount;
                    } 
                    else if (expense.splitMethod === "Everyone") {
                        // Split evenly among all tripmates
                        const perPersonAmount = convertedAmount / tripmates.length;
                        
                        // The payer paid the full amount
                        userBalanceMap[paidByUserId].paid += convertedAmount;
                        
                        // But only owes their share
                        userBalanceMap[paidByUserId].owed += perPersonAmount;
                        userBalanceMap[paidByUserId].balance += (convertedAmount - perPersonAmount);
                        
                        // Create debt items
                        for (const userId of tripmates) {
                            if (userId === paidByUserId) continue;
                            
                            // Initialize balance for user if not exists
                            if (!userBalanceMap[userId]) {
                                userBalanceMap[userId] = {
                                    paid: 0,
                                    owed: 0,
                                    balance: 0
                                };
                            }
                            
                            userBalanceMap[userId].owed += perPersonAmount;
                            userBalanceMap[userId].balance -= perPersonAmount;
                            
                            debtItems.push({
                                fromUser: userId,
                                fromUserEmail: usersData[userId]?.email,
                                toUser: paidByUserId,
                                toUserEmail: paidByEmail,
                                amount: perPersonAmount,
                                currency: homeCurrency,
                                description: `Split from ${expense.description}`,
                                expenseId: expense.id,
                                calculated: true
                            });
                        }
                    }
                    else if (expense.splitMethod === "Individuals") {
                        // Handle individual splitting based on selected individuals
                        const splitWithEmails = expense.splitWith || [];
                        
                        // Find the user IDs corresponding to the emails
                        const splitWithUserIds = [];
                        for (const [userId, userData] of Object.entries(usersData)) {
                            if (splitWithEmails.includes(userData.email)) {
                                splitWithUserIds.push(userId);
                            }
                        }
                        
                        // Include the payer in the split if they're in the splitWith list
                        const splitCount = splitWithUserIds.length;
                        
                        if (splitCount === 0) {
                            // If no one is selected to split with, handle like "Don't split"
                            userBalanceMap[paidByUserId].paid += convertedAmount;
                            userBalanceMap[paidByUserId].balance += convertedAmount;
                            continue;
                        }
                        
                        const perPersonAmount = convertedAmount / splitCount;
                        
                        // The payer paid the full amount
                        userBalanceMap[paidByUserId].paid += convertedAmount;
                        
                        // Calculate debts for each person in the split
                        for (const userId of splitWithUserIds) {
                            // Initialize balance for user if not exists
                            if (!userBalanceMap[userId]) {
                                userBalanceMap[userId] = {
                                    paid: 0,
                                    owed: 0,
                                    balance: 0
                                };
                            }
                            
                            userBalanceMap[userId].owed += perPersonAmount;
                            
                            // If this is the payer, they don't owe themselves, just adjust their balance
                            if (userId === paidByUserId) {
                                userBalanceMap[userId].balance += (convertedAmount - perPersonAmount);
                            } else {
                                // Otherwise, create a debt item from this person to the payer
                                userBalanceMap[userId].balance -= perPersonAmount;
                                
                                debtItems.push({
                                    fromUser: userId,
                                    fromUserEmail: usersData[userId]?.email,
                                    toUser: paidByUserId,
                                    toUserEmail: paidByEmail,
                                    amount: perPersonAmount,
                                    currency: homeCurrency,
                                    description: `Split from ${expense.description}`,
                                    expenseId: expense.id,
                                    calculated: true
                                });
                            }
                        }
                    }
                }
                
                // Simplify debts (combine debts between the same users)
                const simplifiedDebts = {};
                for (const debt of debtItems) {
                    const key = `${debt.fromUser}_${debt.toUser}`;
                    if (!simplifiedDebts[key]) {
                        simplifiedDebts[key] = {
                            ...debt,
                            amount: debt.amount
                        };
                    } else {
                        simplifiedDebts[key].amount += debt.amount;
                        simplifiedDebts[key].description = 'Combined expenses split';
                    }
                }
                
                // Convert to array and filter out zero amounts
                const finalDebts = Object.values(simplifiedDebts)
                    .filter(debt => Math.abs(debt.amount) > 0.01); // Filter out very small amounts
                
                setCalculatedDebts(finalDebts);
                setUserBalances(userBalanceMap);
            } catch (error) {
                console.error('Error calculating debts:', error);
            }
        }
        
        calculateDebts();
    }, [expenses, tripId, homeCurrency, convert]);

    // Settle up all debts
    async function settleUpDebts() {
        if (!currentUser || !tripId || calculatedDebts.length === 0) return false;

        try {
            const batch = writeBatch(db);
            const timestamp = serverTimestamp();
            
            // First, store calculated debts in the database with settled = true
            for (const debt of calculatedDebts) {
                const newDebtRef = doc(collection(db, 'trips', tripId, 'debts'));
                batch.set(newDebtRef, {
                    ...debt,
                    settled: true,
                    settledAt: timestamp,
                    createdAt: timestamp
                });
            }
            
            await batch.commit();
            
            // Update local state
            const settledDebts = calculatedDebts.map(debt => ({
                ...debt,
                id: Math.random().toString(36).substr(2, 9), // Temporary ID
                settled: true,
                settledAt: new Date(),
                createdAt: new Date()
            }));
            
            setDebtHistory(prev => [...settledDebts, ...prev]);
            setCalculatedDebts([]);
            
            // Reset user balances after settling
            const resetBalances = {};
            Object.keys(userBalances).forEach(userId => {
                resetBalances[userId] = {
                    paid: userBalances[userId].paid,
                    owed: userBalances[userId].paid, // Set owed equal to paid so balance becomes 0
                    balance: 0 // Reset balance to 0
                };
            });
            setUserBalances(resetBalances);
            
            // Trigger a refresh of the debts
            setRefreshTrigger(prev => prev + 1);
            
            return true;
        } catch (error) {
            console.error('Error settling debts:', error);
            return false;
        }
    }

    const value = {
        debts,
        debtHistory,
        loading,
        calculatedDebts,
        userBalances,
        settleUpDebts
    };

    return (
        <DebtContext.Provider value={value}>
            {children}
        </DebtContext.Provider>
    );
} 