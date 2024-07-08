import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();

  return isAuthenticated ? <Outlet /> : (
    <Navigate to="/login" state={{ protectedRoute: true, from: location }} replace />
  );
};

export default ProtectedRoute;
