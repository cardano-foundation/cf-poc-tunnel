import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Logo from '../../../../static/icons/32x.png';

const NavBar: React.FC = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <img src={Logo} alt="Logo" style={{ marginRight: 10 }} />

                <Typography variant="h6" style={{ flexGrow: 1 }}>
                    Project Tunnel
                </Typography>

                <IconButton color="inherit">
                    <QrCodeIcon />
                </IconButton>
                <IconButton color="inherit">
                    <SettingsIcon />
                </IconButton>
                <IconButton color="inherit">
                    <LockIcon />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
};

export {NavBar};
