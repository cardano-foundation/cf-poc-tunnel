import ReactDOM from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Options } from './Options';
import { AuthProvider } from '../../components/router/AuthProvider';

const index = ReactDOM.createRoot(
  document.getElementById('options') as HTMLElement,
);

index.render(
  <BrowserRouter basename="/options.html">
    <AuthProvider>
      <Options />
    </AuthProvider>
  </BrowserRouter>,
);
