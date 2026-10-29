import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[12px] text-[#737373]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirects to /login when no active session, preserving return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Route Guard: A client with incomplete onboarding is redirected from /dashboard to /onboarding
  const isPlatformAdmin = user?.isPlatformAdmin || user?.role === 'platform_admin';
  if (!isPlatformAdmin && user?.onboardingStatus && user.onboardingStatus !== 'completed') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};
