import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { homeFor, useAuth, type UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: UserRole;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // Wait for Supabase to restore the session, otherwise logged-in users get bounced
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  // Not logged in -> send to the login page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Profile loads slightly after user, so wait for it before checking the role
  if (role && !profile) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  // Logged in but wrong role (e.g. a buyer opening the farmer dashboard)
  if (role && profile?.role !== role) {
    return <Navigate to={profile ? homeFor(profile.role) : '/'} replace />;
  }

  return <>{children}</>;
}