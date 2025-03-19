import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box,
    InputAdornment,
    Typography,
    Collapse,
    IconButton,
    Grid,
    Rating
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useExpense } from '../contexts/ExpenseContext';

const EXPENSE_TYPES = [
    'Flights',
    'Lodging',
    'Transit',
    'Meal/Drinks',
    'Sightseeing',
    'Activities',
    'Shopping',
    'Other'
];

const CURRENCIES = [
    'hkd', 'usd', 'eur', 'gbp', 'jpy', 'cny', 'aud', 'cad', 'krw'
];

export default function AddExpenseModal({ open, onClose, paidByOptions, expense }) {
    const { addExpense } = useExpense();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
    const isEditMode = !!expense;
    
    // Form state
    const [formData, setFormData] = useState({
        currency: 'hkd',
        amount: '',
        type: '',
        description: '',
        paidBy: paidByOptions && paidByOptions.length > 0 ? paidByOptions[0] : '',
        splitMethod: 'Don\'t split',
        rating: 0,
        consecutiveDays: 1,
        personalSummary: '',
        expenseDate: new Date()
    });

    // Initialize form data when editing
    useEffect(() => {
        if (expense) {
            setFormData({
                currency: expense.currency || 'hkd',
                amount: expense.amount?.toString() || '',
                type: expense.type || '',
                description: expense.description || '',
                paidBy: expense.paidBy || (paidByOptions && paidByOptions.length > 0 ? paidByOptions[0] : ''),
                splitMethod: expense.splitMethod || 'Don\'t split',
                rating: expense.rating || 0,
                consecutiveDays: expense.consecutiveDays || 1,
                personalSummary: expense.personalSummary || '',
                expenseDate: expense.expenseDate ? new Date(expense.expenseDate) : new Date()
            });
            
            // Show additional info if any of those fields are filled
            if (expense.rating > 0 || 
                expense.consecutiveDays > 1 || 
                expense.personalSummary) {
                setShowAdditionalInfo(true);
            }
        }
    }, [expense, paidByOptions]);

    // Form validation errors
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear validation error when field is updated
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRatingChange = (_, newValue) => {
        setFormData(prev => ({ ...prev, rating: newValue }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, expenseDate: date }));
    };

    const toggleAdditionalInfo = () => {
        setShowAdditionalInfo(prev => !prev);
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }
        
        if (!formData.type) {
            newErrors.type = 'Please select an expense type';
        }
        
        if (!formData.paidBy) {
            newErrors.paidBy = 'Please select who paid';
        }
        
        if (formData.consecutiveDays && (
            isNaN(formData.consecutiveDays) || 
            parseInt(formData.consecutiveDays) < 1 ||
            !Number.isInteger(parseFloat(formData.consecutiveDays))
        )) {
            newErrors.consecutiveDays = 'Please enter a valid number of days (integer >= 1)';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        try {
            setIsSubmitting(true);
            
            // If description is empty, use the type as description
            const finalDescription = formData.description || formData.type;
            
            const expenseData = {
                ...formData,
                description: finalDescription,
                amount: parseFloat(formData.amount),
                consecutiveDays: parseInt(formData.consecutiveDays)
            };
            
            if (isEditMode) {
                // In Phase 3, we're not implementing the edit functionality yet
                // This will be implemented in Phase 4
                console.log('Edit mode not implemented yet:', expenseData);
                // For Phase 3 we'll just close the modal as if it was successful
            } else {
                await addExpense(expenseData);
            }
            
            handleClose();
        } catch (error) {
            console.error('Error saving expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset form data and errors
        setFormData({
            currency: 'hkd',
            amount: '',
            type: '',
            description: '',
            paidBy: paidByOptions && paidByOptions.length > 0 ? paidByOptions[0] : '',
            splitMethod: 'Don\'t split',
            rating: 0,
            consecutiveDays: 1,
            personalSummary: '',
            expenseDate: new Date()
        });
        setErrors({});
        setShowAdditionalInfo(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditMode ? 'Edit expense' : 'Add new expense'}</DialogTitle>
            
            <DialogContent>
                <Box component="form" noValidate sx={{ mt: 1 }}>
                    {/* Currency and Amount */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={4}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    label="Currency"
                                >
                                    {CURRENCIES.map(currency => (
                                        <MenuItem key={currency} value={currency}>
                                            {currency.toUpperCase()}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={8}>
                            <TextField
                                fullWidth
                                label="Amount"
                                name="amount"
                                type="number"
                                variant="outlined"
                                value={formData.amount}
                                onChange={handleChange}
                                error={!!errors.amount}
                                helperText={errors.amount}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {formData.currency.toUpperCase()}
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Expense Type */}
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                        <InputLabel>Expense Type</InputLabel>
                        <Select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            label="Expense Type"
                            error={!!errors.type}
                        >
                            {EXPENSE_TYPES.map(type => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.type && <FormHelperText error>{errors.type}</FormHelperText>}
                    </FormControl>

                    {/* Description */}
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        name="description"
                        variant="outlined"
                        value={formData.description}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                    />

                    {/* Paid By */}
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                        <InputLabel>Paid By</InputLabel>
                        <Select
                            name="paidBy"
                            value={formData.paidBy}
                            onChange={handleChange}
                            label="Paid By"
                            error={!!errors.paidBy}
                        >
                            {paidByOptions && paidByOptions.map(option => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.paidBy && <FormHelperText error>{errors.paidBy}</FormHelperText>}
                    </FormControl>

                    {/* Split Method */}
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                        <InputLabel>Split Method</InputLabel>
                        <Select
                            name="splitMethod"
                            value={formData.splitMethod}
                            onChange={handleChange}
                            label="Split Method"
                        >
                            <MenuItem value="Don't split">Don't split</MenuItem>
                            <MenuItem value="Everyone">Everyone</MenuItem>
                            <MenuItem value="Individuals">Individuals</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Additional Information Toggle */}
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            mb: 1
                        }}
                        onClick={toggleAdditionalInfo}
                    >
                        <Typography variant="subtitle1">
                            Additional information
                        </Typography>
                        <IconButton size="small">
                            {showAdditionalInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    {/* Additional Information Content */}
                    <Collapse in={showAdditionalInfo}>
                        <Box sx={{ pl: 2, pr: 2 }}>
                            {/* Rating */}
                            <Box sx={{ mb: 2 }}>
                                <Typography component="legend">Rating</Typography>
                                <Rating
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleRatingChange}
                                />
                            </Box>

                            {/* Consecutive Days */}
                            <TextField
                                fullWidth
                                label="Consecutive Days"
                                name="consecutiveDays"
                                type="number"
                                variant="outlined"
                                value={formData.consecutiveDays}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                                error={!!errors.consecutiveDays}
                                helperText={errors.consecutiveDays || "Enter the number of consecutive days for this expense"}
                                InputProps={{ inputProps: { min: 1 } }}
                            />

                            {/* Personal Summary */}
                            <TextField
                                fullWidth
                                label="Personal Summary"
                                name="personalSummary"
                                variant="outlined"
                                value={formData.personalSummary}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                                multiline
                                rows={2}
                            />

                            {/* Expense Date */}
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Expense Date"
                                    value={formData.expenseDate}
                                    onChange={handleDateChange}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            sx: { mb: 2 }
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Box>
                    </Collapse>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    color="primary" 
                    variant="contained"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 