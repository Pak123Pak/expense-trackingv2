import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Menu, 
    MenuItem, 
    IconButton, 
    Typography,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    CircularProgress,
    Badge,
    Autocomplete,
    TextField
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotification } from '../contexts/NotificationContext';

// This is a basic settings menu that will be expanded in future phases
export default function SettingsMenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [saving, setSaving] = useState(false);
    
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { homeCurrency, availableCurrencies, updateHomeCurrency } = useCurrency();
    const { unreadCount } = useNotification();
    const menuButtonRef = useRef(null);
    
    // Set selected currency when home currency changes
    useEffect(() => {
        setSelectedCurrency(homeCurrency);
    }, [homeCurrency]);

    const handleOpenSettings = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseSettings = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Error logging out:', error);
        }
        handleCloseSettings();
    };
    
    const handleOpenCurrencyDialog = () => {
        setCurrencyDialogOpen(true);
        handleCloseSettings();
    };
    
    const handleCloseCurrencyDialog = () => {
        setCurrencyDialogOpen(false);
        setSelectedCurrency(homeCurrency);
    };
    
    const handleCurrencyChange = (event) => {
        setSelectedCurrency(event.target.value);
    };
    
    const handleSaveCurrency = async () => {
        if (selectedCurrency === homeCurrency) {
            handleCloseCurrencyDialog();
            return;
        }
        
        setSaving(true);
        try {
            await updateHomeCurrency(selectedCurrency);
            handleCloseCurrencyDialog();
        } catch (error) {
            console.error('Error updating home currency:', error);
        } finally {
            setSaving(false);
        }
    };
    
    const handleOpenNotifications = () => {
        handleCloseSettings();
        navigate('/notifications');
    };

    return (
        <>
            <IconButton 
                color="inherit" 
                onClick={handleOpenNotifications}
                sx={{ mr: 1 }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            
            <IconButton 
                ref={menuButtonRef}
                color="inherit" 
                onClick={handleOpenSettings}
            >
                <Badge 
                    color="error" 
                    variant="dot" 
                    invisible={unreadCount === 0}
                >
                    <SettingsIcon />
                </Badge>
            </IconButton>
            
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseSettings}
            >
                <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                        Settings
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleOpenCurrencyDialog}>
                    Change Home Currency
                </MenuItem>
                <MenuItem onClick={handleOpenNotifications}>
                    Notifications
                    {unreadCount > 0 && (
                        <Badge 
                            badgeContent={unreadCount} 
                            color="error" 
                            sx={{ ml: 1 }}
                        />
                    )}
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
            
            {/* Currency Settings Dialog */}
            <Dialog open={currencyDialogOpen} onClose={handleCloseCurrencyDialog}>
                <DialogTitle>Change Home Currency</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" paragraph>
                        Select your home currency. All expenses will be converted to this currency for summary and reporting.
                    </Typography>
                    
                    <FormControl fullWidth margin="normal">
                        <Autocomplete
                            value={selectedCurrency ? selectedCurrency.toUpperCase() : null}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setSelectedCurrency(newValue.toLowerCase());
                                }
                            }}
                            disabled={saving}
                            options={Object.keys(availableCurrencies)}
                            getOptionLabel={(option) => `${option.toUpperCase()} - ${availableCurrencies[option] || ''}`}
                            renderInput={(params) => <TextField {...params} label="Home Currency" />}
                            filterOptions={(options, { inputValue }) => {
                                const filter = inputValue.toLowerCase();
                                return options.filter(option => 
                                    option.toLowerCase().includes(filter) || 
                                    availableCurrencies[option]?.toLowerCase().includes(filter)
                                );
                            }}
                        />
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCurrencyDialog} disabled={saving}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveCurrency} 
                        variant="contained" 
                        color="primary"
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 