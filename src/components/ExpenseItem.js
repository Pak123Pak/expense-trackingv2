import React, { useState } from 'react';
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
    Rating
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useExpense } from '../contexts/ExpenseContext';

export default function ExpenseItem({ expense, onEdit }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const { deleteExpense } = useExpense();

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
                        {expense.currency.toUpperCase()} {expense.amount}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                <Rating value={expense.rating} readOnly />
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
                            <Typography variant="body2" sx={{ ml: 2, mt: 1 }}>
                                {expense.personalSummary}
                            </Typography>
                        </Collapse>
                    </Box>
                )}
                
                {/* Delete Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                    <IconButton 
                        color="error" 
                        onClick={handleOpenConfirmDialog}
                        disabled={isDeleting}
                        size="small"
                    >
                        <DeleteIcon />
                    </IconButton>
                    {isDeleting && (
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
            </Paper>

            {/* Confirmation Dialog */}
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
                    <Button onClick={handleCloseConfirmDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 