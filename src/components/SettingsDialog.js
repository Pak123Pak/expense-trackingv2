import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Common currencies - this will be expanded in the future
const COMMON_CURRENCIES = [
  { code: 'usd', name: 'US Dollar (USD)' },
  { code: 'eur', name: 'Euro (EUR)' },
  { code: 'gbp', name: 'British Pound (GBP)' },
  { code: 'jpy', name: 'Japanese Yen (JPY)' },
  { code: 'cny', name: 'Chinese Yuan (CNY)' },
  { code: 'hkd', name: 'Hong Kong Dollar (HKD)' },
  { code: 'aud', name: 'Australian Dollar (AUD)' },
  { code: 'cad', name: 'Canadian Dollar (CAD)' },
];

export default function SettingsDialog({ open, onClose }) {
  const { currentUser } = useAuth();
  const [homeCurrency, setHomeCurrency] = useState('hkd');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHomeCurrency(userData.homeCurrency || 'hkd');
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUserSettings();
    }
  }, [currentUser, open]);

  const handleSave = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        homeCurrency: homeCurrency
      });
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="home-currency-label">Home Currency</InputLabel>
              <Select
                labelId="home-currency-label"
                value={homeCurrency}
                label="Home Currency"
                onChange={(e) => setHomeCurrency(e.target.value)}
                disabled={saving}
              >
                {COMMON_CURRENCIES.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Your home currency is used to convert and display expenses in your preferred currency.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Box sx={{ position: 'relative' }}>
          <Button
            onClick={handleSave}
            color="primary"
            disabled={loading || saving}
          >
            Save
          </Button>
          {saving && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
} 