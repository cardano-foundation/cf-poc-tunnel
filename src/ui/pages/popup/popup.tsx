import React from 'react';
import {AuthProvider} from "@components/router/authProvider";
import {NavBar} from "@components/navBar";
import Routes from "@components/router/routes";

const Popup = () => {
  return (
    <AuthProvider>
      <NavBar />
      <Routes />
    </AuthProvider>
  );
};

export { Popup };
