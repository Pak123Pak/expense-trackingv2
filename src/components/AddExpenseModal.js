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
    CircularProgress,
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Autocomplete
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useExpense } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTrip } from '../contexts/TripContext';
import { useParams } from 'react-router-dom';

const EXPENSE_TYPES = [
    'Flights',
    'Lodging',
    'Transit',
    'Meal/Drinks',
    'Sightseeing',
    'Activities',
    'Shopping',
    'Groceries',
    'Other'
];

export default function AddExpenseModal({ open, onClose, paidByOptions = [], expense }) {
    const { tripId } = useParams();
    const { addExpense, updateExpense } = useExpense();
    const { availableCurrencies, homeCurrency } = useCurrency();
    const { getTripDetails } = useTrip();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
    const isEditMode = !!expense;
    const [tripmates, setTripmates] = useState([]);
    
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

    // New state for individual split
    const [individualSplits, setIndividualSplits] = useState([]);

    // Fetch tripmates with their display names
    useEffect(() => {
        async function fetchTripmates() {
            if (!tripId) return;
            
            try {
                const tripDetails = await getTripDetails(tripId);
                if (tripDetails?.tripmates) {
                    setTripmates(tripDetails.tripmates);
                }
            } catch (error) {
                console.error('Error fetching tripmates:', error);
            }
        }
        
        fetchTripmates();
    }, [tripId, getTripDetails]);

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
            
            // Set individual splits if they exist
            if (expense.splitWith && Array.isArray(expense.splitWith)) {
                setIndividualSplits(expense.splitWith);
            }
            
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
            setIndividualSplits([]);
        }
    }, [expense, paidByOptions, homeCurrency]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Reset individual splits when split method changes
        if (name === 'splitMethod' && value !== 'Individuals') {
            setIndividualSplits([]);
        }
        
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

    // Find display name for an email
    const getDisplayNameForEmail = (email) => {
        const tripmate = tripmates.find(tm => tm.email === email);
        return tripmate ? tripmate.displayName || email : email;
    };

    // Handle individual split selection
    const handleIndividualSplitChange = (email) => {
        setIndividualSplits(prev => {
            if (prev.includes(email)) {
                return prev.filter(item => item !== email);
            } else {
                return [...prev, email];
            }
        });
        
        // Clear validation error if there was one
        if (errors.splitWith) {
            setErrors(prev => ({ ...prev, splitWith: '' }));
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
        
        if (formData.splitMethod === 'Individuals' && individualSplits.length === 0) {
            newErrors.splitWith = 'Please select at least one person to split with';
        }
        
        if (formData.consecutiveDays && (
            isNaN(formData.consecutiveDays) || 
            parseInt(formData.consecutiveDays) <= 0
        )) {
            newErrors.consecutiveDays = 'Please enter a positive number';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                consecutiveDays: parseInt(formData.consecutiveDays),
                expenseDate: formData.expenseDate.toISOString(),
                tripId
            };
            
            // Include splitWith if method is Individuals
            if (formData.splitMethod === 'Individuals') {
                expenseData.splitWith = individualSplits;
            }
            
            // Use the data URL from the preview if a new photo was selected
            if (selectedPhoto && photoPreview) {
                expenseData.photoURL = photoPreview;
            }
            
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
        // Reset form and state
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
        setSelectedPhoto(null);
        setPhotoPreview('');
        setErrors({});
        setShowAdditionalInfo(false);
        setIndividualSplits([]);
        
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {isEditMode ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            
            <DialogContent>
                {/* Currency and Amount */}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={5}>
                        <FormControl 
                            fullWidth 
                            error={!!errors.currency}
                        >
                        <Autocomplete
                            id="currency-autocomplete"
                            options={Object.keys(availableCurrencies).sort((a, b) => {
                                // Show home currency first
                                if (a.toLowerCase() === homeCurrency) return -1;
                                if (b.toLowerCase() === homeCurrency) return 1;
                                return a.localeCompare(b);
                            })}
                            getOptionLabel={(option) => 
                                `${option.toUpperCase()} - ${availableCurrencies[option] || ''}`
                            }
                            value={formData.currency ? formData.currency.toUpperCase() : null}
                            onChange={(event, newValue) => {
                                if (newValue) {
                                    setFormData({
                                        ...formData,
                                        currency: newValue.toLowerCase()
                                    });
                                    
                                    // Clear any currency errors
                                    if (errors.currency) {
                                        setErrors({...errors, currency: ''});
                                    }
                                }
                            }}
                            renderInput={(params) => 
                                <TextField 
                                    {...params} 
                                    label="Currency" 
                                    error={!!errors.currency}
                                    helperText={errors.currency}
                                />
                            }
                            filterOptions={(options, { inputValue }) => {
                                const filter = inputValue.toLowerCase();
                                return options.filter(option => 
                                    option.toLowerCase().includes(filter) || 
                                    availableCurrencies[option]?.toLowerCase().includes(filter)
                                );
                            }}
                            fullWidth
                        />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={7}>
                        <TextField
                            fullWidth
                            label="Amount"
                            name="amount"
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
                    </Grid>
                </Grid>
                
                {/* Type */}
                <FormControl 
                    fullWidth 
                    sx={{ mt: 2 }}
                    error={!!errors.type}
                >
                    <InputLabel>Type</InputLabel>
                    <Select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        label="Type"
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
                
                {/* Description */}
                <TextField
                    fullWidth
                    label="Description (optional)"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    sx={{ mt: 2 }}
                    placeholder={formData.type ? `If empty, '${formData.type}' will be used as description` : 'If empty, expense type will be used as description'}
                />
                
                {/* Paid By */}
                <FormControl 
                    fullWidth 
                    sx={{ mt: 2 }}
                    error={!!errors.paidBy}
                >
                    <InputLabel>Paid By</InputLabel>
                    <Select
                        name="paidBy"
                        value={formData.paidBy}
                        onChange={handleChange}
                        label="Paid By"
                    >
                        {paidByOptions.map(email => (
                            <MenuItem key={email} value={email}>
                                {getDisplayNameForEmail(email)}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.paidBy && (
                        <FormHelperText>{errors.paidBy}</FormHelperText>
                    )}
                </FormControl>
                
                {/* Split Method */}
                <FormControl 
                    fullWidth 
                    sx={{ mt: 2 }}
                    error={!!errors.splitMethod}
                >
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
                
                {/* Individual Split Options */}
                {formData.splitMethod === 'Individuals' && (
                    <Box sx={{ mt: 2, ml: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Split with:
                        </Typography>
                        
                        <List dense>
                            {paidByOptions.map(email => (
                                <ListItem 
                                    key={email} 
                                    dense
                                    sx={{ p: 0, my: 0.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={individualSplits.includes(email)}
                                            onChange={() => handleIndividualSplitChange(email)}
                                            size="small"
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary={getDisplayNameForEmail(email)} />
                                </ListItem>
                            ))}
                        </List>
                        
                        {errors.splitWith && (
                            <FormHelperText error>{errors.splitWith}</FormHelperText>
                        )}
                    </Box>
                )}
                
                {/* Additional Information Toggle */}
                <Box 
                    sx={{ 
                        mt: 2,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={toggleAdditionalInfo}
                >
                    <Typography variant="subtitle1">
                        Additional Information
                    </Typography>
                    <IconButton size="small">
                        {showAdditionalInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                
                {/* Additional Information Content */}
                <Collapse in={showAdditionalInfo}>
                    <Box sx={{ p: 1, mt: 1 }}>
                        {/* Expense Date */}
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Expense Date"
                                value={formData.expenseDate}
                                onChange={handleDateChange}
                                renderInput={(params) => 
                                    <TextField 
                                        {...params} 
                                        fullWidth 
                                        sx={{ mb: 2 }}
                                    />
                                }
                            />
                        </LocalizationProvider>
                        
                        {/* Rating */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Rating
                            </Typography>
                            <Rating
                                name="rating"
                                value={formData.rating}
                                onChange={handleRatingChange}
                                size="large"
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
                            error={!!errors.consecutiveDays}
                            helperText={errors.consecutiveDays}
                            sx={{ mb: 2 }}
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                        
                        {/* Personal Summary */}
                        <TextField
                            fullWidth
                            label="Personal Summary"
                            name="personalSummary"
                            value={formData.personalSummary}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            sx={{ mb: 2 }}
                        />
                        
                        {/* Photo Upload */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Photo
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <label htmlFor="expense-photo">
                                    <Input
                                        id="expense-photo"
                                        type="file"
                                        inputProps={{
                                            accept: 'image/*'
                                        }}
                                        onChange={handlePhotoChange}
                                        sx={{ display: 'none' }}
                                    />
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<PhotoCamera />}
                                    >
                                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                    </Button>
                                </label>
                                
                                {photoPreview && (
                                    <IconButton 
                                        color="error" 
                                        onClick={() => {
                                            setSelectedPhoto(null);
                                            setPhotoPreview('');
                                        }}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                            
                            {photoPreview && (
                                <Box 
                                    sx={{ 
                                        mt: 2, 
                                        textAlign: 'center',
                                        border: '1px solid #eee',
                                        borderRadius: 1,
                                        p: 1
                                    }}
                                >
                                    <img 
                                        src={photoPreview} 
                                        alt="Expense preview" 
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '200px',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
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
                    {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
} 