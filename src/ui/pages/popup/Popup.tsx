import React from 'react';
import { NavBar } from '@components/NavBar/NavBar';
import { Router } from '@components/Router';
import { AuthProvider } from '@components/Router/AuthProvider';

const Popup = () => {
    console.log("hey popUp")
    return (
        <AuthProvider>
            <NavBar />
            <Router />
        </AuthProvider>
    );
};

export { Popup };
