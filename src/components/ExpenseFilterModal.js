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
    Typography,
    Box,
    TextField,
    Checkbox,
    FormGroup,
    FormControlLabel,
    Chip,
    Stack,
    Divider,
    Grid
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useCurrency } from '../contexts/CurrencyContext';

// Expense types from the ExpenseClassification page
const EXPENSE_TYPES = [
    'Flights', 'Lodging', 'Transit', 'Meal/Drinks', 
    'Sightseeing', 'Activities', 'Shopping', 'Groceries', 'Other'
];

export default function ExpenseFilterModal({ 
    open, 
    onClose, 
    onApplyFilter, 
    paidByOptions = [],
    currentFilters
}) {
    const { homeCurrency, formatCurrency } = useCurrency();
    
    // Initial filter state based on current filters or defaults
    const [filters, setFilters] = useState({
        filterMode: currentFilters?.filterMode || 'All',
        amount: {
            enabled: currentFilters?.amount?.enabled || false,
            min: currentFilters?.amount?.min || '',
            max: currentFilters?.amount?.max || ''
        },
        type: {
            enabled: currentFilters?.type?.enabled || false,
            selected: currentFilters?.type?.selected || []
        },
        paidBy: {
            enabled: currentFilters?.paidBy?.enabled || false,
            selected: currentFilters?.paidBy?.selected || ''
        },
        expenseDate: {
            enabled: currentFilters?.expenseDate?.enabled || false,
            date: currentFilters?.expenseDate?.date ? new Date(currentFilters.expenseDate.date) : null
        }
    });

    // Update filters when currentFilters changes (e.g., when reopening the modal)
    useEffect(() => {
        if (currentFilters) {
            setFilters({
                filterMode: currentFilters.filterMode || 'All',
                amount: {
                    enabled: currentFilters.amount?.enabled || false,
                    min: currentFilters.amount?.min || '',
                    max: currentFilters.amount?.max || ''
                },
                type: {
                    enabled: currentFilters.type?.enabled || false,
                    selected: currentFilters.type?.selected || []
                },
                paidBy: {
                    enabled: currentFilters.paidBy?.enabled || false,
                    selected: currentFilters.paidBy?.selected || ''
                },
                expenseDate: {
                    enabled: currentFilters.expenseDate?.enabled || false,
                    date: currentFilters.expenseDate?.date ? new Date(currentFilters.expenseDate.date) : null
                }
            });
        }
    }, [currentFilters, open]);

    // Handle filter mode change
    const handleFilterModeChange = (e) => {
        const mode = e.target.value;
        setFilters(prev => ({
            ...prev,
            filterMode: mode,
            // Reset all other filters if 'All' is selected
            ...(mode === 'All' && {
                amount: { enabled: false, min: '', max: '' },
                type: { enabled: false, selected: [] },
                paidBy: { enabled: false, selected: '' },
                expenseDate: { enabled: false, date: null }
            })
        }));
    };

    // Handle filter toggle changes
    const handleFilterToggle = (filterName) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: {
                ...prev[filterName],
                enabled: !prev[filterName].enabled
            }
        }));
    };

    // Handle amount filter changes
    const handleAmountChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            amount: {
                ...prev.amount,
                [field]: value
            }
        }));
    };

    // Handle type filter changes
    const handleTypeChange = (type) => {
        setFilters(prev => {
            const selected = [...prev.type.selected];
            const index = selected.indexOf(type);
            
            if (index === -1) {
                selected.push(type);
            } else {
                selected.splice(index, 1);
            }
            
            return {
                ...prev,
                type: {
                    ...prev.type,
                    selected
                }
            };
        });
    };

    // Handle paid by filter changes
    const handlePaidByChange = (e) => {
        setFilters(prev => ({
            ...prev,
            paidBy: {
                ...prev.paidBy,
                selected: e.target.value
            }
        }));
    };

    // Handle date filter changes
    const handleDateChange = (date) => {
        setFilters(prev => ({
            ...prev,
            expenseDate: {
                ...prev.expenseDate,
                date
            }
        }));
    };

    // Apply the filters
    const handleApplyFilter = () => {
        // If filter mode is 'All', just return that
        if (filters.filterMode === 'All') {
            onApplyFilter({ filterMode: 'All' });
            onClose();
            return;
        }
        
        // Otherwise, return all filters
        onApplyFilter({
            ...filters,
            // Ensure 'All' isn't sent if custom filters are applied
            filterMode: 'Custom'
        });
        onClose();
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            filterMode: 'All',
            amount: { enabled: false, min: '', max: '' },
            type: { enabled: false, selected: [] },
            paidBy: { enabled: false, selected: '' },
            expenseDate: { enabled: false, date: null }
        });
    };

    // Calculate if any custom filters are applied
    const hasCustomFilters = 
        filters.amount.enabled || 
        filters.type.enabled || 
        filters.paidBy.enabled || 
        filters.expenseDate.enabled;

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            aria-labelledby="filter-dialog-title"
        >
            <DialogTitle id="filter-dialog-title">Filter Expenses</DialogTitle>
            <DialogContent>
                {/* Filter Mode Selection */}
                <FormControl fullWidth margin="normal">
                    <InputLabel id="filter-mode-label">Filter Mode</InputLabel>
                    <Select
                        labelId="filter-mode-label"
                        id="filter-mode"
                        value={filters.filterMode}
                        label="Filter Mode"
                        onChange={handleFilterModeChange}
                    >
                        <MenuItem value="All">All Expenses</MenuItem>
                        <MenuItem value="Custom">Custom Filters</MenuItem>
                    </Select>
                </FormControl>

                {filters.filterMode === 'Custom' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Apply Filters
                        </Typography>
                        
                        {/* Amount Filter */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={filters.amount.enabled}
                                            onChange={() => handleFilterToggle('amount')}
                                        />
                                    }
                                    label={`Amount Range (${homeCurrency.toUpperCase()})`}
                                />
                            </Box>
                            {filters.amount.enabled && (
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Minimum"
                                            type="number"
                                            fullWidth
                                            value={filters.amount.min}
                                            onChange={(e) => handleAmountChange('min', e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                                        {homeCurrency.toUpperCase()}
                                                    </Typography>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Maximum"
                                            type="number"
                                            fullWidth
                                            value={filters.amount.max}
                                            onChange={(e) => handleAmountChange('max', e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                                        {homeCurrency.toUpperCase()}
                                                    </Typography>
                                                )
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                        
                        <Divider sx={{ mb: 3 }} />
                        
                        {/* Type Filter */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={filters.type.enabled}
                                            onChange={() => handleFilterToggle('type')}
                                        />
                                    }
                                    label="Expense Type"
                                />
                            </Box>
                            {filters.type.enabled && (
                                <Box sx={{ ml: 3 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                        {EXPENSE_TYPES.map((type) => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                onClick={() => handleTypeChange(type)}
                                                color={filters.type.selected.includes(type) ? "primary" : "default"}
                                                variant={filters.type.selected.includes(type) ? "filled" : "outlined"}
                                            />
                                        ))}
                                    </Stack>
                                    {filters.type.selected.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            Please select at least one type
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                        
                        <Divider sx={{ mb: 3 }} />
                        
                        {/* Paid By Filter */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={filters.paidBy.enabled}
                                            onChange={() => handleFilterToggle('paidBy')}
                                        />
                                    }
                                    label="Paid By"
                                />
                            </Box>
                            {filters.paidBy.enabled && (
                                <FormControl fullWidth sx={{ ml: 3 }}>
                                    <InputLabel id="paid-by-filter-label">Paid By</InputLabel>
                                    <Select
                                        labelId="paid-by-filter-label"
                                        id="paid-by-filter"
                                        value={filters.paidBy.selected}
                                        label="Paid By"
                                        onChange={handlePaidByChange}
                                    >
                                        {paidByOptions.map((email) => (
                                            <MenuItem key={email} value={email}>
                                                {email}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                        
                        <Divider sx={{ mb: 3 }} />
                        
                        {/* Expense Date Filter */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={filters.expenseDate.enabled}
                                            onChange={() => handleFilterToggle('expenseDate')}
                                        />
                                    }
                                    label="Expense Date"
                                />
                            </Box>
                            {filters.expenseDate.enabled && (
                                <Box sx={{ ml: 3 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Select Date"
                                            value={filters.expenseDate.date}
                                            onChange={handleDateChange}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </LocalizationProvider>
                                </Box>
                            )}
                        </Box>
                        
                        {/* Chips to show active filters */}
                        {hasCustomFilters && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Active Filters:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                    {filters.amount.enabled && (
                                        <Chip 
                                            label={`Amount: ${filters.amount.min || '0'} - ${filters.amount.max || '∞'} ${homeCurrency.toUpperCase()}`} 
                                            onDelete={() => handleFilterToggle('amount')}
                                            color="primary"
                                        />
                                    )}
                                    {filters.type.enabled && filters.type.selected.length > 0 && (
                                        <Chip 
                                            label={`Types: ${filters.type.selected.length} selected`} 
                                            onDelete={() => handleFilterToggle('type')}
                                            color="primary"
                                        />
                                    )}
                                    {filters.paidBy.enabled && filters.paidBy.selected && (
                                        <Chip 
                                            label={`Paid by: ${filters.paidBy.selected}`} 
                                            onDelete={() => handleFilterToggle('paidBy')}
                                            color="primary"
                                        />
                                    )}
                                    {filters.expenseDate.enabled && filters.expenseDate.date && (
                                        <Chip 
                                            label={`Date: ${filters.expenseDate.date.toLocaleDateString()}`} 
                                            onDelete={() => handleFilterToggle('expenseDate')}
                                            color="primary"
                                        />
                                    )}
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleResetFilters} color="inherit">
                    Reset Filters
                </Button>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleApplyFilter} color="primary" variant="contained">
                    Apply Filters
                </Button>
            </DialogActions>
        </Dialog>
    );
} 