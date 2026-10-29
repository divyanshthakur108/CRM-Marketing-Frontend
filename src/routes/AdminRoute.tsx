import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[12px] text-[#737373]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
          <span>Verifying platform privilege...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isPlatformAdmin = user?.isPlatformAdmin || user?.role === 'platform_admin';
  if (!isPlatformAdmin) {
    // Non-admins get 403 on /admin
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <div className="max-w-md w-full bg-white border border-[#E5E5E5] rounded-[10px] p-8 text-center shadow-card">
          <div className="w-12 h-12 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-[8px] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0A0A0A]">403</h1>
          <h2 className="text-[14px] font-medium text-[#B91C1C] mt-1">
            Access forbidden
          </h2>
          <p className="text-[13px] text-[#525252] mt-3">
            Platform administrator privileges are required to access this resource. Your account (
            <span className="font-medium text-[#0A0A0A]">{user?.email}</span>) does not have authorization.
          </p>
          <div className="mt-6 pt-4 border-t border-[#E5E5E5]">
            <Link to="/dashboard">
              <Button variant="primary" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to workspace dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
