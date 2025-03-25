import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { convertCurrency, getAvailableCurrencies, formatCurrency } from '../services/currencyService';

const CurrencyContext = createContext();

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }) {
  const [homeCurrency, setHomeCurrency] = useState('hkd');
  const [expenseSortPreference, setExpenseSortPreference] = useState('modifiedDesc');
  const [availableCurrencies, setAvailableCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load user's home currency and sort preference from Firestore
  useEffect(() => {
    async function fetchUserPreferences() {
      if (!currentUser) {
        setHomeCurrency('hkd');
        setExpenseSortPreference('modifiedDesc');
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHomeCurrency(userData.homeCurrency || 'hkd');
          setExpenseSortPreference(userData.expenseSortPreference || 'modifiedDesc');
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPreferences();
  }, [currentUser]);

  // Load available currencies
  useEffect(() => {
    async function loadCurrencies() {
      try {
        const currencies = await getAvailableCurrencies();
        setAvailableCurrencies(currencies);
      } catch (error) {
        console.error('Error loading currencies:', error);
      }
    }

    loadCurrencies();
  }, []);

  // Update user's home currency in Firestore
  async function updateHomeCurrency(currency) {
    if (!currentUser) return false;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        homeCurrency: currency.toLowerCase()
      });
      setHomeCurrency(currency.toLowerCase());
      return true;
    } catch (error) {
      console.error('Error updating home currency:', error);
      return false;
    }
  }

  // Update user's expense sort preference in Firestore
  async function updateExpenseSortPreference(sortMethod) {
    if (!currentUser) return false;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        expenseSortPreference: sortMethod
      });
      setExpenseSortPreference(sortMethod);
      return true;
    } catch (error) {
      console.error('Error updating expense sort preference:', error);
      return false;
    }
  }

  // Currency conversion logic 
  async function convert(amount, fromCurrency, toCurrency = homeCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    try {
      return await convertCurrency(amount, fromCurrency, toCurrency);
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount if conversion fails
    }
  }

  // Function to format currency with conversion
  async function formatWithConversion(amount, fromCurrency) {
    const original = formatCurrency(amount, fromCurrency);
    
    // If the currency is already the home currency, just return the formatted amount
    if (fromCurrency.toLowerCase() === homeCurrency.toLowerCase()) {
      return original;
    }
    
    // Otherwise, convert and format
    try {
      const convertedAmount = await convert(amount, fromCurrency);
      const formattedConverted = formatCurrency(convertedAmount, homeCurrency);
      return `${original} (${formattedConverted})`;
    } catch (error) {
      console.error('Error formatting with conversion:', error);
      return original;
    }
  }

  const value = {
    homeCurrency,
    availableCurrencies,
    loading,
    convert,
    formatCurrency,
    formatWithConversion,
    updateHomeCurrency,
    expenseSortPreference,
    updateExpenseSortPreference
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
} 