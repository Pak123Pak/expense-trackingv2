import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    Button,
    Divider,
    AppBar,
    Toolbar,
    IconButton,
    CircularProgress,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNotification } from '../contexts/NotificationContext';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';

export default function Notifications() {
    const navigate = useNavigate();
    const { notifications, loading, respondToInvitation, deleteNotification } = useNotification();
    
    const handleBackClick = () => {
        navigate(-1);
    };
    
    const formatDate = (date) => {
        if (isToday(date)) {
            return `Today at ${format(date, 'h:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday at ${format(date, 'h:mm a')}`;
        } else if (isThisYear(date)) {
            return format(date, 'MMM d');
        } else {
            return format(date, 'MMM d, yyyy');
        }
    };
    
    const handleAcceptInvitation = async (notificationId) => {
        try {
            await respondToInvitation(notificationId, true);
        } catch (error) {
            console.error('Error accepting invitation:', error);
        }
    };
    
    const handleDeclineInvitation = async (notificationId) => {
        try {
            await respondToInvitation(notificationId, false);
        } catch (error) {
            console.error('Error declining invitation:', error);
        }
    };
    
    const handleDeleteNotification = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };
    
    const renderNotificationContent = (notification) => {
        switch (notification.type) {
            case 'tripInvitation':
                return (
                    <>
                        <Typography variant="body1">
                            <strong>{notification.fromUserEmail}</strong> has invited you to join the trip: <strong>{notification.tripName}</strong>
                        </Typography>
                        
                        {notification.status === 'pending' ? (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleAcceptInvitation(notification.id)}
                                >
                                    Confirm
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    startIcon={<CancelIcon />}
                                    onClick={() => handleDeclineInvitation(notification.id)}
                                >
                                    Decline
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Status: {notification.status === 'accepted' ? 'Accepted' : 'Declined'}
                                </Typography>
                                <Button
                                    variant="text"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    sx={{ mt: 1 }}
                                >
                                    Clear
                                </Button>
                            </Box>
                        )}
                    </>
                );
            default:
                return (
                    <>
                        <Typography variant="body1">
                            Unknown notification type.
                        </Typography>
                        <Button
                            variant="text"
                            color="primary"
                            size="small"
                            onClick={() => handleDeleteNotification(notification.id)}
                            sx={{ mt: 1 }}
                        >
                            Clear
                        </Button>
                    </>
                );
        }
    };
    
    return (
        <>
            <AppBar position="static" color="primary">
                <Toolbar>
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        onClick={handleBackClick}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
                        Notifications
                    </Typography>
                </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : notifications.length > 0 ? (
                    <Paper elevation={3}>
                        <List>
                            {notifications.map((notification, index) => (
                                <React.Fragment key={notification.id}>
                                    {index > 0 && <Divider />}
                                    <ListItem 
                                        sx={{ 
                                            py: 2,
                                            bgcolor: notification.read ? 'transparent' : 'action.hover'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box mb={1}>
                                                    {renderNotificationContent(notification)}
                                                </Box>
                                            }
                                            secondary={formatDate(notification.createdAt)}
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                ) : (
                    <Alert severity="info">
                        You don't have any notifications.
                    </Alert>
                )}
            </Container>
        </>
    );
} 