import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionDetails } from '@pages/popup/sessionDetails/SessionDetails';
import { Connect } from '@pages/popup/connect/Connect';
import { Lock } from '@pages/popup/lock/Lock';
import { useAuth } from './AuthProvider';
import { SessionList } from '@pages/popup/sessionList/SessionList';

const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useAuth();
    if (!isLoggedIn) {
        return <Navigate to="/lock" />;
    }

    return children;
};

const Router = () => {
    console.log('Router!!');
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
