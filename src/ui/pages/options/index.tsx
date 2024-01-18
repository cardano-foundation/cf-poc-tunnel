import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@components/router/authProvider';
import { Options } from '@pages/options/options';

function render() {
  const optionsContainer = document.querySelector('#options');
  if (!optionsContainer) throw new Error("Can't find Options root element");
  const root = createRoot(optionsContainer);
  root.render(
    <BrowserRouter>
      <AuthProvider>
        <Options />
      </AuthProvider>
    </BrowserRouter>,
  );
}

render();
