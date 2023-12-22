import React from 'react';
import { NavBar } from './components/NavBar/NavBar';
import { Router } from './Router';
import { AuthProvider } from './Router/AuthProvider';

const Popup = () => {
  return (
    <AuthProvider>
      <NavBar />
      <Router />
    </AuthProvider>
  );
};

export { Popup };
