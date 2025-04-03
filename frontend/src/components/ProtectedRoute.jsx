import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('Protected Route:', {
      isAuthenticated,
      userRole: user?.role,
      requiredRole,
      hasToken: !!localStorage.getItem('token')
    });
  }, [isAuthenticated, user, requiredRole]);

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('Invalid role, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute; 