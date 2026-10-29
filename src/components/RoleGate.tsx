import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { can, Action, UserRole } from '../lib/rbac';

export interface RoleGateProps {
  action: Action;
  role?: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children if the active or specified role has permission.
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  action,
  role,
  children,
  fallback = null,
}) => {
  const { user } = useAuthStore();
  const effectiveRole = (role || user?.role || 'OWNER') as UserRole;

  if (can(effectiveRole, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
