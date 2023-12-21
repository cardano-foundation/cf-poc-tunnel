import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SessionList } from './components/SessionList/SessionList';
import { NavBar } from './components/NavBar/NavBar';
import { SessionDetails } from './pages/SessionDetails/SessionDetails';
import { Connect } from './pages/Connect/Connect';
import { Lock } from './pages/Lock/Lock';

const Popup = () => {
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<SessionList />} />
        <Route path="/:id" element={<SessionDetails />} />
        <Route path="/:id/connect" element={<Connect />} />
        <Route path="/lock" element={<Lock />} />
        <Route path="*" element={<div>Route not found</div>} />
      </Routes>
    </div>
  );
};

export { Popup };
