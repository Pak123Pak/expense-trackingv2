import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    getDocs, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useCurrency } from './CurrencyContext';

const ExpenseContext = createContext();

export function useExpense() {
    return useContext(ExpenseContext);
}

export function ExpenseProvider({ children, tripId }) {
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, updateExpenseSortPreference } = useAuth();
    const { expenseSortPreference, homeCurrency, convert } = useCurrency();
    const [sortMethod, setSortMethod] = useState(expenseSortPreference);
    const [filters, setFilters] = useState({ filterMode: 'All' });
    const [isFiltering, setIsFiltering] = useState(false);
    
    // Update sort method whenever the preference from CurrencyContext changes
    useEffect(() => {
        if (expenseSortPreference) {
            setSortMethod(expenseSortPreference);
        }
    }, [expenseSortPreference]);

    // Fetch expenses whenever the tripId or sortMethod changes
    useEffect(() => {
        async function fetchExpenses() {
            if (!currentUser || !tripId) {
                setExpenses([]);
                setFilteredExpenses([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const expensesQuery = query(
                    collection(db, 'trips', tripId, 'expenses'),
                    orderBy('updatedAt', 'desc')
                );
                const querySnapshot = await getDocs(expensesQuery);
                const expensesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Apply sorting based on sortMethod
                const sortedExpenses = sortExpenses(expensesData, sortMethod);
                setExpenses(sortedExpenses);
                
                // Apply any existing filters
                await applyFilters(sortedExpenses, filters);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchExpenses();
    }, [currentUser, tripId, sortMethod]);

    // Sort expenses based on the selected method
    function sortExpenses(expensesArray, method) {
        const expensesCopy = [...expensesArray];
        
        switch(method) {
            case 'modifiedDesc': // Modified time (newest)
                return expensesCopy.sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds);
            case 'modifiedAsc': // Modified time (oldest)
                return expensesCopy.sort((a, b) => a.updatedAt.seconds - b.updatedAt.seconds);
            case 'expenseDesc': // Expense time (newest)
                return expensesCopy.sort((a, b) => {
                    const dateA = new Date(a.expenseDate);
                    const dateB = new Date(b.expenseDate);
                    return dateB - dateA;
                });
            case 'expenseAsc': // Expense time (oldest)
                return expensesCopy.sort((a, b) => {
                    const dateA = new Date(a.expenseDate);
                    const dateB = new Date(b.expenseDate);
                    return dateA - dateB;
                });
            case 'amountDesc': // Amount (largest)
                return expensesCopy.sort((a, b) => b.amount - a.amount);
            case 'amountAsc': // Amount (smallest)
                return expensesCopy.sort((a, b) => a.amount - b.amount);
            default:
                return expensesCopy;
        }
    }

    // Apply filters to expenses
    async function applyFilters(expensesToFilter, currentFilters) {
        if (!currentFilters || currentFilters.filterMode === 'All') {
            setFilteredExpenses(expensesToFilter);
            setIsFiltering(false);
            return;
        }
        
        setIsFiltering(true);
        
        try {
            // Start with all expenses
            let result = [...expensesToFilter];
            
            // Filter by amount (in home currency)
            if (currentFilters.amount?.enabled) {
                const min = currentFilters.amount.min ? parseFloat(currentFilters.amount.min) : -Infinity;
                const max = currentFilters.amount.max ? parseFloat(currentFilters.amount.max) : Infinity;
                
                // We need to filter after converting each expense to home currency
                const filteredByAmount = [];
                
                for (const expense of result) {
                    try {
                        // Convert expense amount to home currency for filtering
                        const convertedAmount = await convert(
                            expense.amount,
                            expense.currency,
                            homeCurrency
                        );
                        
                        if (convertedAmount >= min && convertedAmount <= max) {
                            filteredByAmount.push(expense);
                        }
                    } catch (error) {
                        console.error('Error converting amount for filtering:', error);
                    }
                }
                
                result = filteredByAmount;
            }
            
            // Filter by type
            if (currentFilters.type?.enabled && currentFilters.type.selected.length > 0) {
                result = result.filter(expense => 
                    currentFilters.type.selected.includes(expense.type)
                );
            }
            
            // Filter by paid by
            if (currentFilters.paidBy?.enabled && currentFilters.paidBy.selected) {
                result = result.filter(expense => 
                    expense.paidBy === currentFilters.paidBy.selected
                );
            }
            
            // Filter by expense date, considering consecutive days
            if (currentFilters.expenseDate?.enabled && currentFilters.expenseDate.date) {
                const filterDate = new Date(currentFilters.expenseDate.date);
                // Reset the time to 00:00:00 for consistent comparison
                filterDate.setHours(0, 0, 0, 0);
                
                result = result.filter(expense => {
                    if (!expense.expenseDate) return false;
                    
                    const expenseDate = new Date(expense.expenseDate);
                    // Reset the time to 00:00:00 for consistent comparison
                    expenseDate.setHours(0, 0, 0, 0);
                    
                    // Check if it's the exact same date
                    if (expenseDate.getTime() === filterDate.getTime()) {
                        return true;
                    }
                    
                    // Check for consecutive days
                    const consecutiveDays = expense.consecutiveDays || 1;
                    if (consecutiveDays > 1) {
                        // Create a date range
                        const endDate = new Date(expenseDate);
                        endDate.setDate(expenseDate.getDate() + (consecutiveDays - 1));
                        
                        // Check if the filter date falls within the expense date range
                        return filterDate >= expenseDate && filterDate <= endDate;
                    }
                    
                    return false;
                });
            }
            
            setFilteredExpenses(result);
        } catch (error) {
            console.error('Error applying filters:', error);
            // If something goes wrong, just show all expenses
            setFilteredExpenses(expensesToFilter);
        } finally {
            setIsFiltering(false);
        }
    }

    // Update filters
    async function updateFilters(newFilters) {
        setFilters(newFilters);
        await applyFilters(expenses, newFilters);
    }

    // Add a new expense
    async function addExpense(expenseData) {
        if (!currentUser || !tripId) return null;

        const newExpense = {
            ...expenseData,
            tripId: tripId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, 'trips', tripId, 'expenses'), newExpense);
            const expenseWithId = {
                id: docRef.id,
                ...newExpense,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Add the new expense to the list and resort
            const updatedExpenses = [expenseWithId, ...expenses];
            const sortedExpenses = sortExpenses(updatedExpenses, sortMethod);
            setExpenses(sortedExpenses);
            
            // Re-apply filters
            await applyFilters(sortedExpenses, filters);
            
            return expenseWithId;
        } catch (error) {
            console.error('Error adding expense:', error);
            return null;
        }
    }

    // Update an existing expense
    async function updateExpense(expenseId, expenseData) {
        if (!currentUser || !tripId) return null;

        try {
            const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);
            
            const updatedExpense = {
                ...expenseData,
                updatedAt: serverTimestamp(),
            };
            
            await updateDoc(expenseRef, updatedExpense);
            
            // Update the expense in the local state
            const updatedExpenses = expenses.map(expense => {
                if (expense.id === expenseId) {
                    return {
                        ...expense,
                        ...expenseData,
                        updatedAt: new Date() // Use a JavaScript Date object for local state
                    };
                }
                return expense;
            });
            
            // Resort the expenses according to the current sort method
            const sortedExpenses = sortExpenses(updatedExpenses, sortMethod);
            setExpenses(sortedExpenses);
            
            // Re-apply filters
            await applyFilters(sortedExpenses, filters);
            
            return true;
        } catch (error) {
            console.error('Error updating expense:', error);
            return false;
        }
    }

    // Delete an expense
    async function deleteExpense(expenseId) {
        if (!currentUser || !tripId) return false;

        try {
            await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
            const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
            setExpenses(updatedExpenses);
            
            // Re-apply filters
            await applyFilters(updatedExpenses, filters);
            
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            return false;
        }
    }

    // Change sorting method and save to user preferences
    async function changeSortMethod(method) {
        setSortMethod(method);
        
        // Save the sort preference to user settings
        if (currentUser) {
            try {
                await updateExpenseSortPreference(method);
            } catch (error) {
                console.error('Error saving sort preference:', error);
            }
        }
    }

    const value = {
        expenses: filteredExpenses, // Now return filtered expenses instead of all expenses
        allExpenses: expenses, // Add all expenses for reference if needed
        loading,
        isFiltering,
        addExpense,
        updateExpense,
        deleteExpense,
        sortMethod,
        changeSortMethod,
        filters,
        updateFilters
    };

    return (
        <ExpenseContext.Provider value={value}>
            {children}
        </ExpenseContext.Provider>
    );
} 