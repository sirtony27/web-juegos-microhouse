import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const RequireAuth = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login, saving the current location they were trying to go to
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;
