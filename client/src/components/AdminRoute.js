import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getToken } from '../utils/tokenManager';

const AdminRoute = ({ children }) => {
  const token = getToken();
  if (!token) return <Navigate to="/console" replace />;

  try {
    const decoded = jwtDecode(token);
    if (decoded?.role !== 'admin') {
      return <Navigate to="/console/dashboard" replace />;
    }
    return children;
  } catch (e) {
    return <Navigate to="/console" replace />;
  }
};

export default AdminRoute;
