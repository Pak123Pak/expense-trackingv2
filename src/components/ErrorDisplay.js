import React from 'react';
import { Alert, Box, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * A component to display errors with an optional retry button
 * @param {Object} props - The component props
 * @param {string} props.message - The error message to display
 * @param {function} props.onRetry - Optional callback for retry button
 * @param {string} props.severity - The severity of the error (error, warning, info, success)
 * @param {Object} props.sx - Additional styles for the error container
 * @returns {React.ReactNode} - The rendered component
 */
export default function ErrorDisplay({ 
  message = 'An error occurred. Please try again later.', 
  onRetry, 
  severity = 'error',
  sx = {} 
}) {
  return (
    <Box sx={{ my: 2, ...sx }}>
      <Alert 
        severity={severity}
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Box>
  );
} 