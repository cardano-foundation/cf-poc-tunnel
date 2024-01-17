import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Options } from './Options';
import { AuthProvider } from '@components/Router/AuthProvider';

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
