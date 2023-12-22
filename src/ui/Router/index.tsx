import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionList } from '../components/SessionList/SessionList';
import { SessionDetails } from '../pages/SessionDetails/SessionDetails';
import { Connect } from '../pages/Connect/Connect';
import { Lock } from '../pages/Lock/Lock';
import { useAuth } from './AuthProvider';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/lock" />;
  }

  return children;
};

const Router = () => {
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SessionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:id"
          element={
            <ProtectedRoute>
              <SessionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:id/connect"
          element={
            <ProtectedRoute>
              <Connect />
            </ProtectedRoute>
          }
        />
        <Route path="/lock" element={<Lock />} />
        <Route path="*" element={<div>Route not found</div>} />
      </Routes>
    </div>
  );
};

export { Router };
