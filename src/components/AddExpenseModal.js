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
    Input
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
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
    const { addExpense, updateExpense } = useExpense();
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
                currency: expense.currency || 'hkd',
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
        }
    }, [expense, paidByOptions]);

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
        
        // Photo validation - check file size if a new photo is selected
        if (selectedPhoto && selectedPhoto.size > 5 * 1024 * 1024) { // 5MB limit
            newErrors.photo = 'Photo size should be less than 5MB';
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
            
            // Process the photo if there's a new one
            let photoURL = formData.photoURL;
            if (selectedPhoto) {
                // In a real app, you would upload the photo to storage here
                // and get back a URL to store in the database
                // For now, we'll just use the data URL as a placeholder
                photoURL = photoPreview;
            }
            
            const expenseData = {
                ...formData,
                description: finalDescription,
                amount: parseFloat(formData.amount),
                consecutiveDays: parseInt(formData.consecutiveDays),
                photoURL
            };
            
            if (isEditMode) {
                await updateExpense(expense.id, expenseData);
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
            expenseDate: new Date(),
            photoURL: ''
        });
        setErrors({});
        setShowAdditionalInfo(false);
        setSelectedPhoto(null);
        setPhotoPreview('');
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

                            {/* Photo Upload */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Upload a photo
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Button
                                        variant="contained"
                                        component="label"
                                        startIcon={<PhotoCamera />}
                                        color="secondary"
                                    >
                                        Choose File
                                        <Input
                                            type="file"
                                            sx={{ display: 'none' }}
                                            inputProps={{ accept: 'image/*' }}
                                            onChange={handlePhotoChange}
                                        />
                                    </Button>
                                    {errors.photo && (
                                        <FormHelperText error>{errors.photo}</FormHelperText>
                                    )}
                                </Box>
                                {photoPreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <img 
                                            src={photoPreview} 
                                            alt="Expense" 
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
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Expense Date"
                                    value={formData.expenseDate}
                                    onChange={handleDateChange}
                                    renderInput={(params) => (
                                        <TextField {...params} fullWidth variant="outlined" />
                                    )}
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