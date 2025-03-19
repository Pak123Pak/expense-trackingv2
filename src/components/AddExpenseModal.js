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
    Rating,
    Input,
    CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useExpense } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';

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

export default function AddExpenseModal({ open, onClose, paidByOptions, expense }) {
    const { addExpense, updateExpense } = useExpense();
    const { availableCurrencies, homeCurrency } = useCurrency();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
    const isEditMode = !!expense;
    
    // Form state
    const [formData, setFormData] = useState({
        currency: homeCurrency || 'hkd',
        amount: '',
        type: '',
        description: '',
        paidBy: paidByOptions && paidByOptions.length > 0 ? paidByOptions[0] : '',
        splitMethod: 'Don\'t split',
        rating: 0,
        consecutiveDays: 1,
        personalSummary: '',
        expenseDate: new Date(),
        photoURL: ''
    });

    // Photo state
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    // Form validation errors
    const [errors, setErrors] = useState({});

    // Initialize form data when editing
    useEffect(() => {
        if (expense) {
            setFormData({
                currency: expense.currency || homeCurrency || 'hkd',
                amount: expense.amount?.toString() || '',
                type: expense.type || '',
                description: expense.description || '',
                paidBy: expense.paidBy || (paidByOptions && paidByOptions.length > 0 ? paidByOptions[0] : ''),
                splitMethod: expense.splitMethod || 'Don\'t split',
                rating: expense.rating || 0,
                consecutiveDays: expense.consecutiveDays || 1,
                personalSummary: expense.personalSummary || '',
                expenseDate: expense.expenseDate ? new Date(expense.expenseDate) : new Date(),
                photoURL: expense.photoURL || ''
            });
            
            // Show additional info if any of those fields are filled
            if (expense.rating > 0 || 
                expense.consecutiveDays > 1 || 
                expense.personalSummary ||
                expense.photoURL) {
                setShowAdditionalInfo(true);
            }
            
            // Set photo preview if available
            if (expense.photoURL) {
                setPhotoPreview(expense.photoURL);
            }
        } else {
            // For new expense, default to home currency
            setFormData(prev => ({ ...prev, currency: homeCurrency || 'hkd' }));
        }
    }, [expense, paidByOptions, homeCurrency]);

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

    // Handle photo upload
    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedPhoto(file);
            
            // Create a preview URL
            const reader = new FileReader();
            reader.onload = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
            
            // Clear validation error if there was one
            if (errors.photo) {
                setErrors(prev => ({ ...prev, photo: '' }));
            }
        }
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
            newErrors.type = 'Please select a type';
        }
        
        if (!formData.paidBy) {
            newErrors.paidBy = 'Please select who paid';
        }
        
        if (!formData.splitMethod) {
            newErrors.splitMethod = 'Please select how to split';
        }
        
        if (formData.consecutiveDays !== '' && (isNaN(formData.consecutiveDays) || parseInt(formData.consecutiveDays) < 1)) {
            newErrors.consecutiveDays = 'Please enter a valid number of days (minimum 1)';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            // Prepare expense data from form
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                consecutiveDays: parseInt(formData.consecutiveDays),
                // For new expenses, use type as description if no description provided
                description: formData.description || formData.type,
                // Convert date to ISO string for storage
                expenseDate: formData.expenseDate.toISOString(),
                // Use photo preview as URL (in a real app, this would be uploaded to storage)
                photoURL: photoPreview
            };
            
            if (isEditMode) {
                await updateExpense(expense.id, expenseData);
            } else {
                await addExpense(expenseData);
            }
            
            onClose();
        } catch (error) {
            console.error('Error saving expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => {
        // Reset form and errors
        setFormData({
            currency: homeCurrency || 'hkd',
            amount: '',
            type: '',
            description: '',
            paidBy: paidByOptions && paidByOptions.length > 0 ? paidByOptions[0] : '',
            splitMethod: 'Don\'t split',
            rating: 0,
            consecutiveDays: 1,
            personalSummary: '',
            expenseDate: new Date(),
            photoURL: ''
        });
        setErrors({});
        setSelectedPhoto(null);
        setPhotoPreview('');
        setShowAdditionalInfo(false);
        
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                {isEditMode ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            
            <DialogContent>
                {/* First Line: Currency and Amount */}
                <Box sx={{ display: 'flex', mb: 2, mt: 1 }}>
                    <FormControl 
                        sx={{ minWidth: 150, mr: 2 }}
                        error={!!errors.currency}
                    >
                        <InputLabel id="currency-label">Currency</InputLabel>
                        <Select
                            labelId="currency-label"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            label="Currency"
                        >
                            {Object.keys(availableCurrencies).length > 0 ? (
                                Object.entries(availableCurrencies)
                                    .sort(([codeA], [codeB]) => {
                                        // Show home currency first
                                        if (codeA.toLowerCase() === homeCurrency) return -1;
                                        if (codeB.toLowerCase() === homeCurrency) return 1;
                                        return codeA.localeCompare(codeB);
                                    })
                                    .map(([code, name]) => (
                                        <MenuItem key={code} value={code.toLowerCase()}>
                                            {code.toUpperCase()} - {name}
                                        </MenuItem>
                                    ))
                            ) : (
                                // Fallback to predefined list if API fails
                                ['hkd', 'usd', 'eur', 'gbp', 'jpy', 'cny', 'aud', 'cad', 'krw'].map(currency => (
                                    <MenuItem key={currency} value={currency}>
                                        {currency.toUpperCase()}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                        {errors.currency && (
                            <FormHelperText>{errors.currency}</FormHelperText>
                        )}
                    </FormControl>
                    
                    <TextField
                        fullWidth
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        error={!!errors.amount}
                        helperText={errors.amount}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {formData.currency.toUpperCase()}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                
                {/* Second Line: Expense Type */}
                <FormControl 
                    fullWidth 
                    sx={{ mb: 2 }}
                    error={!!errors.type}
                >
                    <InputLabel id="type-label">Type of Expense</InputLabel>
                    <Select
                        labelId="type-label"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        label="Type of Expense"
                    >
                        {EXPENSE_TYPES.map(type => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.type && (
                        <FormHelperText>{errors.type}</FormHelperText>
                    )}
                </FormControl>
                
                {/* Third Line: Description */}
                <TextField
                    fullWidth
                    label="Description (optional)"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    placeholder="Defaults to type if left empty"
                />
                
                {/* Fourth Line: Paid By */}
                <FormControl 
                    fullWidth 
                    sx={{ mb: 2 }}
                    error={!!errors.paidBy}
                >
                    <InputLabel id="paid-by-label">Paid By</InputLabel>
                    <Select
                        labelId="paid-by-label"
                        name="paidBy"
                        value={formData.paidBy}
                        onChange={handleChange}
                        label="Paid By"
                    >
                        {paidByOptions.map(option => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.paidBy && (
                        <FormHelperText>{errors.paidBy}</FormHelperText>
                    )}
                </FormControl>
                
                {/* Fifth Line: Split Method */}
                <FormControl 
                    fullWidth 
                    sx={{ mb: 2 }}
                    error={!!errors.splitMethod}
                >
                    <InputLabel id="split-method-label">How to Split</InputLabel>
                    <Select
                        labelId="split-method-label"
                        name="splitMethod"
                        value={formData.splitMethod}
                        onChange={handleChange}
                        label="How to Split"
                    >
                        <MenuItem value="Don't split">Don't split</MenuItem>
                        <MenuItem value="Everyone">Everyone</MenuItem>
                        <MenuItem value="Individuals">Individuals</MenuItem>
                    </Select>
                    {errors.splitMethod && (
                        <FormHelperText>{errors.splitMethod}</FormHelperText>
                    )}
                </FormControl>
                
                {/* Sixth Line: Additional Information Toggle */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        mb: 2
                    }}
                    onClick={toggleAdditionalInfo}
                >
                    <Typography color="primary">
                        Additional information
                    </Typography>
                    <IconButton size="small">
                        {showAdditionalInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                
                {/* Additional Information Content */}
                <Collapse in={showAdditionalInfo}>
                    {/* Rating */}
                    <Box sx={{ mb: 2 }}>
                        <Typography component="legend">Rate this expense (optional)</Typography>
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
                        value={formData.consecutiveDays}
                        onChange={handleChange}
                        sx={{ mb: 2 }}
                        error={!!errors.consecutiveDays}
                        helperText={errors.consecutiveDays || "Number of consecutive days for this expense"}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                    
                    {/* Personal Summary */}
                    <TextField
                        fullWidth
                        label="Personal Summary (optional)"
                        name="personalSummary"
                        value={formData.personalSummary}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                    />
                    
                    {/* Photo Upload */}
                    <Box sx={{ mb: 2 }}>
                        <Typography gutterBottom>
                            Upload a photo (optional)
                        </Typography>
                        
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<PhotoCamera />}
                        >
                            Upload
                            <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={handlePhotoChange}
                            />
                        </Button>
                        
                        {photoPreview && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <img 
                                    src={photoPreview} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '200px',
                                        borderRadius: '4px'
                                    }} 
                                />
                            </Box>
                        )}
                    </Box>
                    
                    {/* Expense Date */}
                    <Box sx={{ mb: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Expense Date"
                                value={formData.expenseDate}
                                onChange={handleDateChange}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </LocalizationProvider>
                    </Box>
                </Collapse>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <CircularProgress size={24} />
                    ) : (
                        isEditMode ? 'Update' : 'Save'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 