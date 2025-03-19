import React, { useState, useEffect } from 'react';
import { 
    Paper, 
    Typography, 
    Box, 
    IconButton, 
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Collapse,
    Rating,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useExpense } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';

export default function ExpenseItem({ expense, onEdit }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [formattedAmount, setFormattedAmount] = useState('');
    const [isLoadingAmount, setIsLoadingAmount] = useState(true);
    
    const { deleteExpense } = useExpense();
    const { homeCurrency, formatWithConversion, formatCurrency } = useCurrency();

    // Format the expense amount with currency conversion
    useEffect(() => {
        async function formatAmount() {
            try {
                setIsLoadingAmount(true);
                const formatted = await formatWithConversion(
                    expense.amount,
                    expense.currency
                );
                setFormattedAmount(formatted);
            } catch (error) {
                console.error('Error formatting amount:', error);
                // Fallback to basic formatting if conversion fails
                setFormattedAmount(formatCurrency(expense.amount, expense.currency));
            } finally {
                setIsLoadingAmount(false);
            }
        }
        
        formatAmount();
    }, [expense.amount, expense.currency, homeCurrency, formatWithConversion, formatCurrency]);

    // Format the expense date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Format date range if consecutive days > 1
    const formatDateRange = () => {
        const startDate = new Date(expense.expenseDate);
        
        if (expense.consecutiveDays <= 1) {
            return formatDate(startDate);
        }
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + expense.consecutiveDays - 1);
        
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    const handleOpenConfirmDialog = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the parent
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteExpense(expense.id);
            handleCloseConfirmDialog();
        } catch (error) {
            console.error('Error deleting expense:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExpenseClick = () => {
        onEdit(expense);
    };

    const toggleRating = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the parent
        setShowRating(prev => !prev);
    };

    const toggleSummary = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the parent
        setShowSummary(prev => !prev);
    };

    const togglePhoto = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the parent
        setShowPhoto(prev => !prev);
    };

    return (
        <>
            <Paper 
                elevation={2}
                sx={{
                    p: 2,
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }
                }}
                onClick={handleExpenseClick}
            >
                {/* First Line: Description and Amount */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">
                        {expense.description}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {isLoadingAmount ? (
                            <CircularProgress size={20} />
                        ) : (
                            <Tooltip 
                                title={`Originally ${expense.currency.toUpperCase()} ${expense.amount}`} 
                                placement="left"
                                arrow
                            >
                                <span>{formattedAmount}</span>
                            </Tooltip>
                        )}
                    </Typography>
                </Box>
                
                {/* Second Line: Type and Date */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {expense.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {formatDateRange()}
                    </Typography>
                </Box>
                
                {/* Third Line: Paid By and Split Method */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Paid by: {expense.paidBy}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Split: {expense.splitMethod}
                    </Typography>
                </Box>
                
                {/* Rating (if available) */}
                {expense.rating > 0 && (
                    <Box sx={{ mb: 1 }}>
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={toggleRating}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Show rating
                            </Typography>
                            <IconButton size="small">
                                {showRating ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={showRating}>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                <Rating value={expense.rating} readOnly />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                    ({expense.rating}/5)
                                </Typography>
                            </Box>
                        </Collapse>
                    </Box>
                )}
                
                {/* Personal Summary (if available) */}
                {expense.personalSummary && (
                    <Box sx={{ mb: 1 }}>
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={toggleSummary}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Show personal summary
                            </Typography>
                            <IconButton size="small">
                                {showSummary ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={showSummary}>
                            <Typography variant="body2" sx={{ mt: 1, px: 1 }}>
                                {expense.personalSummary}
                            </Typography>
                        </Collapse>
                    </Box>
                )}
                
                {/* Photo (if available) */}
                {expense.photoURL && (
                    <Box sx={{ mb: 1 }}>
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={togglePhoto}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Show photo
                            </Typography>
                            <IconButton size="small">
                                {showPhoto ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={showPhoto}>
                            <Box sx={{ mt: 1, textAlign: 'center' }}>
                                <img 
                                    src={expense.photoURL} 
                                    alt="Expense" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '200px',
                                        borderRadius: '4px'
                                    }} 
                                />
                            </Box>
                        </Collapse>
                    </Box>
                )}
                
                {/* Delete Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton 
                        size="small" 
                        color="error" 
                        onClick={handleOpenConfirmDialog}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Paper>
            
            {/* Confirm Delete Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
            >
                <DialogTitle>Delete Expense</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this expense? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        disabled={isDeleting}
                    >
                        {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 