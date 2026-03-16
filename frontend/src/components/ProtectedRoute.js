import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect based on role
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'telecaller') {
      return <Navigate to="/telecaller" replace />;
    } else {
      return <Navigate to="/member" replace />;
    }
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'telecaller') {
      return <Navigate to="/telecaller" replace />;
    } else {
      return <Navigate to="/member" replace />;
    }
  }

  return children;
};
