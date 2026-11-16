import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  Sparkles,
  Type,
  FileCheck,
  CheckSquare,
  Zap,
  Send,
  Link2,
  Users,
  MessageCircle,
  CalendarCheck,
  LayoutGrid,
  FolderOpen,
  Building2,
  Target,
  Wallet,
  UserCheck,
  Settings,
  Shield,
  Clapperboard,
} from 'lucide-react';
import { AuthUser } from '../../store/useAuthStore';

export interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: (pathname: string) => boolean;
  badgeKey?: 'notifications';
  requiresPlatformAdmin?: boolean;
}

export interface NavGroupConfig {
  label: string;
  items: NavItemConfig[];
  requiresPlatformAdmin?: boolean;
}

export const navGroups: NavGroupConfig[] = [
  {
    label: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        isActive: (p) => p === '/dashboard',
      },
      {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        isActive: (p) => p.startsWith('/dashboard/analytics') || p.startsWith('/analytics'),
      },
      {
        name: 'Notifications',
        href: '/notifications',
        icon: Bell,
        badgeKey: 'notifications',
        isActive: (p) => p.startsWith('/notifications'),
      },
    ],
  },
  {
    label: 'Marketing',
    items: [
      {
        name: 'Creation',
        href: '/studio',
        icon: Sparkles,
        isActive: (p) =>
          p.startsWith('/studio') ||
          p.startsWith('/creative-studio') ||
          p.startsWith('/creation'),
      },
      {
        name: 'Captions',
        href: '/captions',
        icon: Type,
        isActive: (p) => p.startsWith('/captions'),
      },
      {
        name: 'Plan Review',
        href: '/plan-review',
        icon: FileCheck,
        isActive: (p) => p.startsWith('/plan-review'),
      },
      {
        name: 'Approvals',
        href: '/approvals',
        icon: CheckSquare,
        isActive: (p) => p.startsWith('/approvals'),
      },
      {
        name: 'Ads',
        href: '/campaigns',
        icon: Zap,
        isActive: (p) =>
          p.startsWith('/campaigns') ||
          p.startsWith('/ads'),
      },
      {
        name: 'Publishing',
        href: '/publishing',
        icon: Send,
        isActive: (p) => p.startsWith('/publishing'),
      },
      {
        name: 'Connections',
        href: '/connections',
        icon: Link2,
        isActive: (p) => p.startsWith('/connections'),
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        name: 'CRM',
        href: '/leads',
        icon: Users,
        isActive: (p) =>
          p.startsWith('/leads') ||
          p.startsWith('/crm'),
      },
      {
        name: 'WhatsApp',
        href: '/whatsapp',
        icon: MessageCircle,
        isActive: (p) =>
          p.startsWith('/conversations') ||
          p.startsWith('/whatsapp'),
      },
      {
        name: 'Appointments',
        href: '/appointments',
        icon: CalendarCheck,
        isActive: (p) => p.startsWith('/appointments'),
      },
    ],
  },
  {
    label: 'Library',
    items: [
      {
        name: 'Catalog',
        href: '/projects',
        icon: LayoutGrid,
        isActive: (p) =>
          p.startsWith('/projects') ||
          p.startsWith('/catalog') ||
          p.startsWith('/properties'),
      },
      {
        name: 'Assets',
        href: '/assets',
        icon: FolderOpen,
        isActive: (p) =>
          p.startsWith('/assets') ||
          p.startsWith('/media'),
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        name: 'Brand',
        href: '/branding',
        icon: Building2,
        isActive: (p) => p.startsWith('/branding'),
      },
      {
        name: 'Audience',
        href: '/audience',
        icon: Target,
        isActive: (p) => p.startsWith('/audience'),
      },
      {
        name: 'Budget',
        href: '/budget',
        icon: Wallet,
        isActive: (p) => p.startsWith('/budget'),
      },
      {
        name: 'Team',
        href: '/team',
        icon: UserCheck,
        isActive: (p) => p.startsWith('/team'),
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        isActive: (p) =>
          p.startsWith('/settings') ||
          p.startsWith('/profile'),
      },
    ],
  },
  {
    label: 'Platform',
    requiresPlatformAdmin: true,
    items: [
      {
        name: 'Organizations',
        href: '/admin/organizations',
        icon: Shield,
        requiresPlatformAdmin: true,
        isActive: (p) => p.startsWith('/admin/organizations') || p === '/admin',
      },
      {
        name: 'Video Lab',
        href: '/admin/video-lab',
        icon: Clapperboard,
        requiresPlatformAdmin: true,
        isActive: (p) => p.startsWith('/admin/video-lab'),
      },
    ],
  },
];

/**
 * Filter groups based on user role permissions (e.g. platform admin visibility)
 */
export function getVisibleNavGroups(user: AuthUser | null): NavGroupConfig[] {
  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || user?.role === 'platform_admin');

  return navGroups
    .filter((group) => !group.requiresPlatformAdmin || isPlatformAdmin)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requiresPlatformAdmin || isPlatformAdmin),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Derives sentence-case breadcrumbs and title from the active route
 */
export function getBreadcrumbFromPathname(
  pathname: string,
  user: AuthUser | null
): { groupLabel?: string; itemLabel: string } {
  const groups = getVisibleNavGroups(user);

  for (const group of groups) {
    for (const item of group.items) {
      if (item.isActive(pathname)) {
        return {
          groupLabel: group.label,
          itemLabel: item.name,
        };
      }
    }
  }

  // Fallbacks for known secondary routes
  if (pathname.startsWith('/calendar') || pathname.startsWith('/planner')) return { groupLabel: 'Overview', itemLabel: 'Calendar' };
  if (pathname.startsWith('/projects/new')) return { groupLabel: 'Library', itemLabel: 'New project' };
  if (pathname.includes('/projects/') && pathname.includes('/edit')) return { groupLabel: 'Library', itemLabel: 'Edit project' };
  if (pathname.includes('/projects/')) return { groupLabel: 'Library', itemLabel: 'Project details' };

  return { itemLabel: 'Console' };
}

