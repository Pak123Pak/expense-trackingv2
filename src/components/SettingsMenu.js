import React, { useState, useRef } from 'react';
import { 
    Menu, 
    MenuItem, 
    IconButton, 
    Typography,
    Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';

// This is a basic settings menu that will be expanded in future phases
export default function SettingsMenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const { logout } = useAuth();
    const menuButtonRef = useRef(null);

    const handleOpenSettings = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseSettings = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Error logging out:', error);
        }
        handleCloseSettings();
    };

    return (
        <>
            <IconButton 
                ref={menuButtonRef}
                color="inherit" 
                onClick={handleOpenSettings}
            >
                <SettingsIcon />
            </IconButton>
            
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseSettings}
            >
                <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                        Settings
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </>
    );
} 