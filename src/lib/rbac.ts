export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MARKETING_MANAGER'
  | 'SALES_AGENT'
  | 'CREATIVE_EDITOR'
  | 'VIEWER';

export type Action =
  | 'create:project'
  | 'edit:project'
  | 'delete:project'
  | 'approve:creative'
  | 'request:revision'
  | 'edit:budget'
  | 'publish:campaign'
  | 'manage:team'
  | 'connect:meta'
  | 'edit:lead'
  | 'export:data'
  | 'view:analytics'
  | 'manage:brand';

export const PERMISSIONS: Record<UserRole, Action[]> = {
  OWNER: [
    'create:project',
    'edit:project',
    'delete:project',
    'approve:creative',
    'request:revision',
    'edit:budget',
    'publish:campaign',
    'manage:team',
    'connect:meta',
    'edit:lead',
    'export:data',
    'view:analytics',
    'manage:brand',
  ],
  ADMIN: [
    'create:project',
    'edit:project',
    'delete:project',
    'approve:creative',
    'request:revision',
    'edit:budget',
    'publish:campaign',
    'manage:team',
    'connect:meta',
    'edit:lead',
    'export:data',
    'view:analytics',
    'manage:brand',
  ],
  MARKETING_MANAGER: [
    'create:project',
    'edit:project',
    'approve:creative',
    'request:revision',
    'edit:budget',
    'publish:campaign',
    'connect:meta',
    'edit:lead',
    'view:analytics',
    'manage:brand',
  ],
  CREATIVE_EDITOR: [
    'create:project',
    'edit:project',
    'request:revision',
    'view:analytics',
  ],
  SALES_AGENT: [
    'edit:lead',
    'export:data',
  ],
  VIEWER: [
    'view:analytics',
  ],
};

/**
 * Checks whether a given role is authorized to perform a specified action.
 */
export function can(role: UserRole | string | undefined, action: Action): boolean {
  if (!role) return false;
  const userRole = role.toUpperCase() as UserRole;
  const allowedActions = PERMISSIONS[userRole] || [];
  return allowedActions.includes(action);
}
