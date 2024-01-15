import React from 'react';
import {AuthProvider} from "../../components/router/AuthProvider";
import {NavBar} from "../../components/NavBar/NavBar";
import {Router} from "../../components/Router";

const Popup = () => {
    return (
        <AuthProvider>
            <NavBar />
            <Router />
        </AuthProvider>
    );
};

export { Popup };
