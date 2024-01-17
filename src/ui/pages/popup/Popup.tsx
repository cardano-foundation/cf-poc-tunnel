import React from 'react';
import { NavBar } from '@components/NavBar/NavBar';
import { AuthProvider } from '@components/Router/AuthProvider';
import Routes from '../../components/Router/routes';
import { useLocation } from 'react-router-dom';

const Popup = () => {
  console.log('hey popUp');
  const location = useLocation();
  const currentPathname = location.pathname;
  console.log('currentPathname');
  console.log(currentPathname);
  return (
    <AuthProvider>
      <NavBar />
      <Routes />
    </AuthProvider>
  );
};

export { Popup };
