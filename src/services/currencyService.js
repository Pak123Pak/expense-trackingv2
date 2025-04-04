import axios from 'axios';

// Free API key from ExchangeRate-API (limited to 1500 requests per month)
const API_URL = 'https://open.er-api.com/v6/latest';

// Cache exchange rates to reduce API calls
const ratesCache = {
  rates: {},
  timestamp: null,
  baseCurrency: null,
};

/**
 * Get the latest exchange rates from the API or cache
 * @param {string} baseCurrency - Base currency code (e.g., 'USD')
 * @returns {Promise<object>} - Object containing exchange rates
 */
export const getExchangeRates = async (baseCurrency = 'USD') => {
  const currentTime = Date.now();
  const cacheExpiryTime = 3600000; // 1 hour in milliseconds
  
  // If we have cached rates for this base currency and they're less than 1 hour old, use them
  if (
    ratesCache.rates && 
    ratesCache.baseCurrency === baseCurrency && 
    ratesCache.timestamp && 
    (currentTime - ratesCache.timestamp < cacheExpiryTime)
  ) {
    return ratesCache.rates;
  }
  
  try {
    const response = await axios.get(`${API_URL}/${baseCurrency}`);
    
    // Update cache
    ratesCache.rates = response.data.rates;
    ratesCache.timestamp = currentTime;
    ratesCache.baseCurrency = baseCurrency;
    
    return response.data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

/**
 * Convert an amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Currency code to convert from (e.g., 'USD')
 * @param {string} toCurrency - Currency code to convert to (e.g., 'EUR')
 * @returns {Promise<number>} - Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // If currencies are the same, return the original amount
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }
  
  try {
    // Get rates with fromCurrency as base
    const rates = await getExchangeRates(fromCurrency.toUpperCase());
    const rate = rates[toCurrency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};

/**
 * Get a list of all available currencies
 * @returns {Promise<object>} - Object with currency codes as keys and currency names as values
 */
export const getAvailableCurrencies = async () => {
  try {
    // We'll get the rates from USD to get all available currencies
    const rates = await getExchangeRates('USD');
    
    // Create a map of currency codes to names
    const currencyNames = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan',
      HKD: 'Hong Kong Dollar',
      NZD: 'New Zealand Dollar',
      // Add more currencies as needed
      ...Object.keys(rates).reduce((acc, code) => {
        if (!acc[code]) {
          acc[code] = code;
        }
        return acc;
      }, {})
    };
    
    return currencyNames;
  } catch (error) {
    console.error('Error getting available currencies:', error);
    throw error;
  }
};

// Format currency for display
export const formatCurrency = (amount, currencyCode) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}; 