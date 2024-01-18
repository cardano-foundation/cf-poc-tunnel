import React from 'react';
import { NavBar } from '@components/NavBar/NavBar';
import { AuthProvider } from '@components/Router/AuthProvider';
import Routes from '../../components/Router/routes';

const Popup = () => {
  return (
    <AuthProvider>
      <NavBar />
      <Routes />
    </AuthProvider>
  );
};

export { Popup };
