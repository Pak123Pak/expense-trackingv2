import React from 'react';
import { Box, Container, Typography, AppBar, Toolbar, IconButton, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import SettingsMenu from './SettingsMenu';

/**
 * A standardized container for pages with responsive layout
 * @param {Object} props - The component props
 * @param {string} props.title - The page title
 * @param {React.ReactNode} props.children - The page content
 * @param {boolean} props.showBackButton - Whether to show a back button
 * @param {string} props.backTo - Where to navigate on back button press
 * @param {React.ReactNode} props.action - Optional action button for the app bar
 * @param {Object} props.maxWidth - Container max width (xs, sm, md, lg, xl)
 * @returns {React.ReactNode} - The rendered component
 */
export default function PageContainer({ 
  title, 
  children, 
  showBackButton = false, 
  backTo = -1, 
  action,
  maxWidth = 'lg'
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleBack = () => {
    if (typeof backTo === 'number') {
      navigate(backTo);
    } else {
      navigate(backTo);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          {showBackButton && (
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="h1" 
            sx={{ 
              flexGrow: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </Typography>
          
          {action}
          
          <SettingsMenu />
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth={maxWidth} 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4 },
          flex: 1
        }}
      >
        {children}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          mt: 'auto',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Expense Tracker © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
} 