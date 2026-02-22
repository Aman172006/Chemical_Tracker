import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

/**
 * ProtectedRoute — checks JWT auth + optional role requirement.
 * Redirects to /owner-login if not authenticated.
 */
export function ProtectedRoute({ requireOwner, requireAdmin }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/owner-login" replace />;
    }

    if (requireOwner && user?.role !== 'owner' && user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    if (requireAdmin && user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
