import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, 10000); // 10 second timeout
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  // If timed out, clear token and redirect to login
  if (timedOut) {
    localStorage.removeItem('bitz_token');
    return <Navigate to="/login" state={{ from: location }} replace />;
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
  const [timedOut, setTimedOut] = useState(false);

  // Timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimedOut(true);
        localStorage.removeItem('bitz_token');
      }, 10000); // 10 second timeout
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  // If timed out, just show the login page
  if (timedOut) {
    return children;
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
