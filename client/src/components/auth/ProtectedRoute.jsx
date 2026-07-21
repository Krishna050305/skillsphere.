import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Route protection wrapper component.
 * Redirects to `/login` if not authenticated, and redirects to dashboard `/` if role constraints are not met.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Loading state placeholder
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}
