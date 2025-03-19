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
  const [availableCurrencies, setAvailableCurrencies] = useState({});
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load user's home currency from Firestore
  useEffect(() => {
    async function fetchUserCurrency() {
      if (!currentUser) {
        setHomeCurrency('hkd');
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHomeCurrency(userData.homeCurrency || 'hkd');
        }
      } catch (error) {
        console.error('Error fetching user currency:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserCurrency();
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

  // Convert amount from one currency to another
  async function convert(amount, fromCurrency, toCurrency = homeCurrency) {
    try {
      const convertedAmount = await convertCurrency(
        amount,
        fromCurrency,
        toCurrency
      );
      return convertedAmount;
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount;
    }
  }

  // Format with both original and converted amounts
  async function formatWithConversion(amount, fromCurrency) {
    // Format the original amount
    const formatted = formatCurrency(amount, fromCurrency);
    
    // If the currency is already the home currency, no need to convert
    if (fromCurrency.toLowerCase() === homeCurrency.toLowerCase()) {
      return formatted;
    }
    
    try {
      // Convert to home currency
      const convertedAmount = await convert(amount, fromCurrency);
      // Format the converted amount
      const formattedConverted = formatCurrency(convertedAmount, homeCurrency);
      
      // Return both values
      return `${formatted} (${formattedConverted})`;
    } catch (error) {
      console.error('Error formatting with conversion:', error);
      return formatted;
    }
  }

  const value = {
    homeCurrency,
    availableCurrencies,
    loading,
    updateHomeCurrency,
    convert,
    formatWithConversion,
    formatCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
} 