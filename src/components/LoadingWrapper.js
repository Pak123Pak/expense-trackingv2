import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * A wrapper component that displays a loading spinner when content is loading
 * @param {Object} props - The component props
 * @param {boolean} props.loading - Whether the content is loading
 * @param {React.ReactNode} props.children - The content to display when not loading
 * @param {string} props.message - Optional loading message to display
 * @param {Object} props.sx - Additional styles for the loading container
 * @returns {React.ReactNode} - The rendered component
 */
export default function LoadingWrapper({ loading, children, message = 'Loading...', sx = {} }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, ...sx }}>
        <CircularProgress size={40} />
        {message && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return children;
} 