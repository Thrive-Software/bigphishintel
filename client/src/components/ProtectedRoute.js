import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getToken } from '../utils/tokenManager';

const ProtectedRoute = ({ children }) => {
    const token = getToken();
    const location = useLocation();

    if (!token) return <Navigate to="/console" replace />;

    try {
        const decoded = jwtDecode(token);
        if (
            decoded?.mustChangePassword &&
            location.pathname !== '/console/force-password-change'
        ) {
            return <Navigate to="/console/force-password-change" replace />;
        }
    } catch (e) {
        return <Navigate to="/console" replace />;
    }

    return children;
};

export default ProtectedRoute;
