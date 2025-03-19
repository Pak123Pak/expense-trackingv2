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

const ExpenseContext = createContext();

export function useExpense() {
    return useContext(ExpenseContext);
}

export function ExpenseProvider({ children, tripId }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const [sortMethod, setSortMethod] = useState('modifiedDesc');

    // Fetch expenses whenever the tripId or sortMethod changes
    useEffect(() => {
        async function fetchExpenses() {
            if (!currentUser || !tripId) {
                setExpenses([]);
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
            setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            return false;
        }
    }

    // Change sorting method
    function changeSortMethod(method) {
        setSortMethod(method);
    }

    const value = {
        expenses,
        loading,
        addExpense,
        updateExpense,
        deleteExpense,
        sortMethod,
        changeSortMethod
    };

    return (
        <ExpenseContext.Provider value={value}>
            {children}
        </ExpenseContext.Provider>
    );
} 